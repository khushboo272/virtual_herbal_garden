import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import Plant from '../src/modules/library/Plant.model';
import Remedy from '../src/modules/remedies/Remedy.model';
import Notification from '../src/modules/notifications/Notification.model';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, ContentStatus } from '../src/types';
import './setup';

describe('Admin Moderation Invariant Tests', () => {
  let adminUser: any;
  let botanistUser: any;
  let regularUser: any;

  let adminToken: string;
  let botanistToken: string;
  let userToken: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('TestPass123!');

    adminUser = await User.create({
      email: `admin-${Date.now()}@test.com`,
      passwordHash,
      displayName: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });
    adminToken = signAccessToken({
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: UserRole.ADMIN,
    });

    botanistUser = await User.create({
      email: `botanist-${Date.now()}@test.com`,
      passwordHash,
      displayName: 'Botanist User',
      role: UserRole.BOTANIST,
      isActive: true,
    });
    botanistToken = signAccessToken({
      sub: botanistUser._id.toString(),
      email: botanistUser.email,
      role: UserRole.BOTANIST,
    });

    regularUser = await User.create({
      email: `user-${Date.now()}@test.com`,
      passwordHash,
      displayName: 'Regular User',
      role: UserRole.USER,
      isActive: true,
    });
    userToken = signAccessToken({
      sub: regularUser._id.toString(),
      email: regularUser.email,
      role: UserRole.USER,
    });
  });

  it('Plant invariant: submit as botanist -> appears in moderation list & summary -> approve moves to PUBLISHED, notifies owner, and removes from queue', async () => {
    // 1. Create plant draft as Botanist
    const plantDraftRes = await request(app)
      .post('/api/v1/plants')
      .set('Authorization', `Bearer ${botanistToken}`)
      .send({
        commonName: 'Holy Basil Specimen',
        scientificName: `Ocimum sanctum invariant ${Date.now()}`,
        family: 'Lamiaceae',
        description: 'Sacred medicinal plant widely revered for therapeutic properties and adaptability.',
        plantType: 'HERB',
        medicinalUses: [{ use: 'Immunity booster', details: 'Used in decoctions' }],
        partsUsed: ['LEAVES'],
        toxicityLevel: 'NONE',
        images: [{ url: 'https://example.com/basil.jpg', isPrimary: true, caption: 'Leaves' }],
        references: ['https://example.com/ref-basil'],
      });
    expect(plantDraftRes.status).toBe(201);
    const plantId = plantDraftRes.body.data?._id || plantDraftRes.body.data?.id;

    // 2. Submit via contributions endpoint
    const submitRes = await request(app)
      .post(`/api/v1/contributions/plant/${plantId}/submit`)
      .set('Authorization', `Bearer ${botanistToken}`);
    expect(submitRes.status).toBe(200);

    // 3. Assert summary and list consistency
    const summaryRes = await request(app)
      .get('/api/v1/admin/moderation/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(summaryRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/v1/admin/moderation?type=plant')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);

    expect(summaryRes.body.data.plants).toBe(listRes.body.meta.total);
    const inQueue = listRes.body.data.some((item: any) => item.id === plantId);
    expect(inQueue).toBe(true);

    // 4. Admin approves
    const approveRes = await request(app)
      .post(`/api/v1/admin/moderation/plant/${plantId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ feature: true });
    expect(approveRes.status).toBe(200);

    // 5. Assert moved to PUBLISHED
    const updatedPlant = await Plant.findById(plantId);
    expect(updatedPlant?.status).toBe(ContentStatus.PUBLISHED);
    expect(updatedPlant?.isPublished).toBe(true);

    // 6. Assert owner notified
    const notification = await Notification.findOne({
      userId: botanistUser._id,
      title: /Approved/i,
    });
    expect(notification).toBeDefined();

    // 7. Assert removed from queue and summary reflects it
    const postSummaryRes = await request(app)
      .get('/api/v1/admin/moderation/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    const postListRes = await request(app)
      .get('/api/v1/admin/moderation?type=plant')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(postSummaryRes.body.data.plants).toBe(postListRes.body.meta.total);
    expect(postListRes.body.data.some((item: any) => item.id === plantId)).toBe(false);
  });

  it('Remedy invariant: submit as botanist -> appears in moderation list & summary -> approve moves to PUBLISHED, notifies owner, and removes from queue', async () => {
    // 1. Create remedy draft as Botanist
    const remedyDraftRes = await request(app)
      .post('/api/v1/remedies')
      .set('Authorization', `Bearer ${botanistToken}`)
      .send({
        title: `Herbal Immunity Elixir ${Date.now()}`,
        description: 'Traditional herbal formulation designed to boost digestive and respiratory vitality.',
        dosage: 'Take 1 cup warm every morning.',
        difficulty: 'EASY',
        preparationTime: 20,
        ingredients: [{ name: 'Tulsi Leaves', quantity: '5 leaves', notes: 'Freshly washed' }],
        preparationSteps: [{ step: 1, instruction: 'Boil 2 cups of pure spring water' }],
        traditionalSource: 'Charaka Samhita tradition',
        references: ['https://example.com/remedy-study'],
      });
    expect(remedyDraftRes.status).toBe(201);
    const remedyId = remedyDraftRes.body.data?._id || remedyDraftRes.body.data?.id;

    // 2. Submit via contributions endpoint
    const submitRes = await request(app)
      .post(`/api/v1/contributions/remedy/${remedyId}/submit`)
      .set('Authorization', `Bearer ${botanistToken}`);
    expect(submitRes.status).toBe(200);

    // 3. Assert summary and list consistency
    const summaryRes = await request(app)
      .get('/api/v1/admin/moderation/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(summaryRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/v1/admin/moderation?type=remedy')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);

    expect(summaryRes.body.data.remedies).toBe(listRes.body.meta.total);
    const inQueue = listRes.body.data.some((item: any) => item.id === remedyId);
    expect(inQueue).toBe(true);

    // 4. Admin approves
    const approveRes = await request(app)
      .post(`/api/v1/admin/moderation/remedy/${remedyId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);

    // 5. Assert moved to PUBLISHED
    const updatedRemedy = await Remedy.findById(remedyId);
    expect(updatedRemedy?.status).toBe(ContentStatus.PUBLISHED);
    expect(updatedRemedy?.isPublished).toBe(true);

    // 6. Assert owner notified
    const notification = await Notification.findOne({
      userId: botanistUser._id,
      title: /Approved/i,
    });
    expect(notification).toBeDefined();

    // 7. Assert removed from queue and summary reflects it
    const postSummaryRes = await request(app)
      .get('/api/v1/admin/moderation/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    const postListRes = await request(app)
      .get('/api/v1/admin/moderation?type=remedy')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(postSummaryRes.body.data.remedies).toBe(postListRes.body.meta.total);
    expect(postListRes.body.data.some((item: any) => item.id === remedyId)).toBe(false);
  });

  it('Role Application invariant: submit as user -> appears in queue & summary -> approve upgrades user to BOTANIST, notifies, and removes from queue', async () => {
    // 1. Submit application as regular user
    const appRes = await request(app)
      .post('/api/v1/role-applications')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        motivation: 'I hold an advanced master degree in ethnobotany and have curated botanical gardens for over five years.',
        qualifications: 'MSc Ethnobotany, Certified Ayurvedic Herbalist.',
        links: ['https://linkedin.com/in/botanist-sample'],
      });
    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.data?._id || appRes.body.data?.id;

    // 2. Summary and list consistency
    const summaryRes = await request(app)
      .get('/api/v1/admin/moderation/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(summaryRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/v1/admin/role-applications?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(listRes.status).toBe(200);

    expect(summaryRes.body.data.applications).toBe(listRes.body.meta.total);
    const inQueue = listRes.body.data.some((item: any) => item._id === applicationId);
    expect(inQueue).toBe(true);

    // 3. Admin approves
    const approveRes = await request(app)
      .post(`/api/v1/admin/role-applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ note: 'Strong ethnobotanical credentials verified.' });
    expect(approveRes.status).toBe(200);

    // 4. Assert user role upgraded to BOTANIST in DB
    const updatedUser = await User.findById(regularUser._id);
    expect(updatedUser?.role).toBe(UserRole.BOTANIST);

    // 5. Assert user notified
    const notification = await Notification.findOne({
      userId: regularUser._id,
      title: /Approved/i,
    });
    expect(notification).toBeDefined();

    // 6. Assert removed from pending queue
    const postSummaryRes = await request(app)
      .get('/api/v1/admin/moderation/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    const postListRes = await request(app)
      .get('/api/v1/admin/role-applications?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(postSummaryRes.body.data.applications).toBe(postListRes.body.meta.total);
    expect(postListRes.body.data.some((item: any) => item._id === applicationId)).toBe(false);
  });
});
