import mongoose from 'mongoose';
import Tour from '../src/modules/tours/Tour.model';
import User from '../src/modules/users/User.model';
import { hashPassword } from '../src/core/utils/hash';
import { tourService } from '../src/modules/tours/tour.service';
import { UserRole } from '../src/types';
import './setup';

let userId: mongoose.Types.ObjectId;
let adminId: mongoose.Types.ObjectId;

beforeEach(async () => {
  const user = await User.create({
    email: `tour-user-${Date.now()}-${Math.random()}@test.com`,
    passwordHash: await hashPassword('Test@1234'),
    role: 'USER',
    displayName: 'Tour Explorer',
    isEmailVerified: true,
    isActive: true,
  });
  userId = user._id as mongoose.Types.ObjectId;

  const admin = await User.create({
    email: `tour-admin-${Date.now()}-${Math.random()}@test.com`,
    passwordHash: await hashPassword('Admin@1234'),
    role: 'ADMIN',
    displayName: 'Tour Admin',
    isEmailVerified: true,
    isActive: true,
  });
  adminId = admin._id as mongoose.Types.ObjectId;
});

async function createTestTour(overrides: Partial<any> = {}) {
  const slug = overrides.slug ?? `tour-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return Tour.create({
    title: overrides.title ?? 'Ayurvedic Wellness Walk',
    slug,
    summary: overrides.summary ?? 'A relaxing and educational botanical walk.',
    healthCategory: overrides.healthCategory ?? 'immunity',
    level: overrides.level ?? 'BEGINNER',
    tags: overrides.tags ?? ['wellness', 'herbs'],
    sequential: overrides.sequential ?? true,
    isPublished: overrides.isPublished ?? true,
    isFeatured: overrides.isFeatured ?? false,
    sortOrder: overrides.sortOrder ?? 1,
    createdBy: adminId,
    checkpoints: overrides.checkpoints ?? [
      {
        key: 'cp-tulsi',
        order: 1,
        title: 'Tulsi Holy Basil',
        summary: 'Sacred adaptogen',
        body: 'Tulsi is revered in Ayurveda for vitality.',
        durationMinutes: 5,
        plantSlugs: ['tulsi'],
        remedySlugs: [],
        keyTakeaways: ['Adaptogenic support'],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What kind of herb is Tulsi traditionally regarded as?',
              options: ['Adaptogen', 'Sedative', 'Synthetic filler'],
              correctIndex: 0,
              explanation: 'Tulsi is classified as a rasayana and adaptogen.',
            },
          ],
        },
      },
      {
        key: 'cp-neem',
        order: 2,
        title: 'Neem Tree of Life',
        summary: 'Cooling bitter herb',
        body: 'Neem is traditionally applied for cleansing and skin balance.',
        durationMinutes: 5,
        plantSlugs: ['neem'],
        remedySlugs: [],
        keyTakeaways: ['Cooling qualities'],
      },
    ],
  });
}

describe('Tour Service & Controller Logic', () => {
  it('should list published tours and include health/level facets', async () => {
    await createTestTour({ title: 'Immunity Walk', healthCategory: 'immunity', level: 'BEGINNER', isPublished: true });
    await createTestTour({ title: 'Stress Relief Walk', healthCategory: 'stress-relief', level: 'INTERMEDIATE', isPublished: true });
    await createTestTour({ title: 'Draft Walk', healthCategory: 'digestion', isPublished: false });

    const result = await tourService.list({ page: 1, limit: 10 });
    expect(result.tours.length).toBe(2);
    expect(result.tours.some((t: any) => t.title === 'Draft Walk')).toBe(false);
    expect((result.meta.facets?.health as any[])?.length).toBeGreaterThan(0);
    expect((result.meta.facets?.level as any[])?.length).toBeGreaterThan(0);
  });

  it('should filter tours by health category, level, plant, and query', async () => {
    await createTestTour({
      slug: 'turmeric-path',
      title: 'Turmeric Radiance Tour',
      healthCategory: 'skincare',
      level: 'ADVANCED',
      checkpoints: [
        { key: 'cp-turmeric', order: 1, title: 'Turmeric', summary: 'Gold herb', body: 'Body', durationMinutes: 5, plantSlugs: ['turmeric'] },
      ],
    });

    const byHealth = await tourService.list({ health: 'skincare' });
    expect(byHealth.tours.some((t: any) => t.slug === 'turmeric-path')).toBe(true);

    const byPlant = await tourService.list({ plant: 'turmeric' });
    expect(byPlant.tours.some((t: any) => t.slug === 'turmeric-path')).toBe(true);

    const byQuery = await tourService.list({ q: 'Radiance' });
    expect(byQuery.tours.some((t: any) => t.slug === 'turmeric-path')).toBe(true);
  });

  it('should strip quiz correctIndex and explanation for clients on getBySlugOrId', async () => {
    const tour = await createTestTour();
    const fetched = await tourService.getBySlugOrId(tour.slug);
    expect(fetched.checkpoints[0].quiz).toBeDefined();
    expect(fetched.checkpoints[0].quiz?.questions[0].correctIndex).toBeUndefined();
    expect(fetched.checkpoints[0].quiz?.questions[0].explanation).toBeUndefined();
  });

  it('should prevent non-admin from previewing draft tours', async () => {
    const draft = await createTestTour({ isPublished: false, title: 'Hidden Draft' });
    await expect(
      tourService.getBySlugOrId(draft.slug, { userRole: UserRole.USER, preview: true })
    ).rejects.toThrow();

    const adminView = await tourService.getBySlugOrId(draft.slug, { userRole: UserRole.ADMIN, preview: true });
    expect(adminView.title).toBe('Hidden Draft');
  });

  it('should enforce sequential progression in sequential tours', async () => {
    const tour = await createTestTour({ sequential: true });
    // Attempting to complete cp-neem (order 2) without completing cp-tulsi (order 1) must be rejected
    await expect(
      tourService.completeCheckpoint(userId.toString(), tour.slug, 'cp-neem')
    ).rejects.toThrow(/before advancing/i);
  });

  it('should score quiz on server, record progress, and handle completion on final checkpoint', async () => {
    const tour = await createTestTour({ sequential: true });
    // Submit quiz for cp-tulsi with wrong answer
    const failRes = await tourService.submitQuiz(userId.toString(), tour.slug, 'cp-tulsi', [1]);
    expect(failRes.passed).toBe(false);
    expect(failRes.results[0].correct).toBe(false);

    // Re-attempt quiz with correct answer
    const passRes = await tourService.submitQuiz(userId.toString(), tour.slug, 'cp-tulsi', [0]);
    expect(passRes.passed).toBe(true);
    expect(passRes.results[0].correct).toBe(true);
    expect(passRes.results[0].explanation).toContain('classified as a rasayana');

    // Complete checkpoint 2 (non-quiz)
    const completeRes = await tourService.completeCheckpoint(userId.toString(), tour.slug, 'cp-neem');
    expect(completeRes.completedAt).toBeDefined();
    expect(completeRes.completedKeys).toEqual(['cp-tulsi', 'cp-neem']);
  });

  it('should allow rating only after tour is completed', async () => {
    const tour = await createTestTour({ sequential: false });
    await expect(
      tourService.rateTour(userId.toString(), tour.slug, 5, 'Great tour!')
    ).rejects.toThrow(/rate a tour after completing/i);

    // Complete all checkpoints
    await tourService.completeCheckpoint(userId.toString(), tour.slug, 'cp-neem');
    await tourService.submitQuiz(userId.toString(), tour.slug, 'cp-tulsi', [0]);

    const rated = await tourService.rateTour(userId.toString(), tour.slug, 5, 'Loved learning about Tulsi');
    expect(rated.rating).toBe(5);
  });

  it('should sync guest progress by adding only valid existing checkpoint keys', async () => {
    const tour = await createTestTour();
    const synced = await tourService.syncProgress(
      userId.toString(),
      tour.slug,
      ['cp-tulsi', 'invalid-checkpoint-key']
    );
    expect(synced.completedKeys).toContain('cp-tulsi');
    expect(synced.completedKeys).not.toContain('invalid-checkpoint-key');
  });

  it('should restart tour and reset progress state', async () => {
    const tour = await createTestTour();
    await tourService.submitQuiz(userId.toString(), tour.slug, 'cp-tulsi', [0]);

    const restarted = await tourService.restartTour(userId.toString(), tour.slug);
    expect(restarted.completedKeys).toEqual([]);
    const progress = await tourService.getTourProgress(userId.toString(), tour.slug);
    expect(progress.completedKeys).toEqual([]);
    expect(progress.completedAt).toBeNull();
    expect(progress.lastCheckpointKey).toBeNull();
  });

  it('should validate publishing: reject tour publish if checkpoints are empty', async () => {
    const emptyTour = await Tour.create({
      title: 'Empty Tour',
      slug: `empty-${Date.now()}`,
      summary: 'Draft with no checkpoints',
      isPublished: false,
      createdBy: adminId,
      checkpoints: [],
    });

    await expect(
      tourService.publish(emptyTour._id.toString())
    ).rejects.toThrow(/at least 1 checkpoint/i);
  });

  it('should aggregate admin analytics correctly', async () => {
    const tour = await createTestTour();
    // Simulate user 1 starting and completing
    await tourService.submitQuiz(userId.toString(), tour.slug, 'cp-tulsi', [0]);
    await tourService.completeCheckpoint(userId.toString(), tour.slug, 'cp-neem');

    const overview = await tourService.getAdminAnalytics();
    expect(overview.totalTours).toBeGreaterThan(0);
    expect(overview.totalStarts).toBeGreaterThan(0);

    const detail = await tourService.getTourAnalytics(tour._id.toString());
    expect(detail.started).toBe(1);
    expect(detail.completed).toBe(1);
    expect(detail.completionRate).toBe(100);
    expect(detail.perCheckpoint.length).toBe(2);
  });
});
