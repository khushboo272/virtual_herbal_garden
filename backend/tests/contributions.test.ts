import Plant from '../src/modules/library/Plant.model';
import Remedy from '../src/modules/remedies/Remedy.model';
import User from '../src/modules/users/User.model';
import Detection from '../src/modules/ai-scanner/Detection.model';
import { plantService } from '../src/modules/library/plant.service';
import { remedyService } from '../src/modules/remedies/remedy.service';
import { contributionService } from '../src/modules/contributions/contribution.service';
import { adminService } from '../src/modules/admin/admin.service';
import { detectionService } from '../src/modules/ai-scanner/detection.service';
import { supportService } from '../src/modules/support/support.service';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, ContentStatus, PlantPart, ToxicityLevel } from '../src/types';
import mongoose from 'mongoose';
import './setup';

describe('Contributions & Botanist Workflow Tests', () => {
  let botanist1Id: string;
  let botanist2Id: string;
  let adminId: string;
  let regularUserId: string;

  beforeEach(async () => {
    const b1 = await User.create({
      email: `botanist1-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Pass123!'),
      role: UserRole.BOTANIST,
      displayName: 'Botanist One',
    });
    botanist1Id = b1._id.toString();

    const b2 = await User.create({
      email: `botanist2-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Pass123!'),
      role: UserRole.BOTANIST,
      displayName: 'Botanist Two',
    });
    botanist2Id = b2._id.toString();

    const admin = await User.create({
      email: `admin-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Pass123!'),
      role: UserRole.ADMIN,
      displayName: 'Platform Admin',
    });
    adminId = admin._id.toString();

    const regular = await User.create({
      email: `user-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Pass123!'),
      role: UserRole.USER,
      displayName: 'Regular User',
    });
    regularUserId = regular._id.toString();
  });

  describe('1. Plant & Remedy Draft Status Lifecycle', () => {
    it('creates draft plant with default status DRAFT and isPublished false', async () => {
      const plant = await plantService.create(
        {
          commonName: 'Ashwagandha Draft',
          scientificName: 'Withania somnifera',
          family: 'Solanaceae',
          description: 'Traditional adaptogen herb of the Solanaceae family',
          medicinalUses: ['Stress reduction', 'Vitality'],
          partsUsed: [PlantPart.ROOTS],
          toxicityLevel: ToxicityLevel.NONE,
          regionNative: ['India'],
          images: [{ url: 'https://example.com/ashwa.jpg', isPrimary: true }],
          references: ['Ayurvedic Pharmacopoeia of India (2001)'],
        },
        botanist1Id,
      );

      expect(plant.status).toBe('DRAFT');
      expect(plant.isPublished).toBe(false);
      expect(plant.owner?.toString()).toBe(botanist1Id);
    });

    it('submits plant draft for review transitioning DRAFT -> IN_REVIEW', async () => {
      const plant = await plantService.create(
        {
          commonName: 'Brahmi Draft',
          scientificName: 'Bacopa monnieri',
          family: 'Plantaginaceae',
          description: 'Traditional memory enhancer herb across Ayurvedic texts',
          medicinalUses: ['Cognitive function'],
          partsUsed: [PlantPart.LEAVES],
          toxicityLevel: ToxicityLevel.NONE,
          regionNative: ['India'],
          images: [{ url: 'https://example.com/brahmi.jpg', isPrimary: true }],
          references: ['WHO Monograph on Selected Medicinal Plants (1999)'],
        },
        botanist1Id,
      );

      const res = await contributionService.submit(botanist1Id, 'plant', plant._id.toString());
      expect(res.status).toBe(ContentStatus.PENDING_REVIEW);

      const inDb = await Plant.findById(plant._id);
      expect(inDb?.status).toBe(ContentStatus.PENDING_REVIEW);
      expect(inDb?.isPublished).toBe(false);
      expect(inDb?.submittedAt).toBeDefined();
    });

    it('admin approves submitted plant transitioning IN_REVIEW -> PUBLISHED', async () => {
      const plant = await plantService.create(
        {
          commonName: 'Neem Draft',
          scientificName: 'Azadirachta indica',
          family: 'Meliaceae',
          description: 'Anti-bacterial tree widely utilized in traditional medicine',
          medicinalUses: ['Skin conditions'],
          partsUsed: [PlantPart.BARK, PlantPart.LEAVES],
          toxicityLevel: ToxicityLevel.LOW,
          regionNative: ['India'],
          images: [{ url: 'https://example.com/neem.jpg', isPrimary: true }],
          references: ['Indian Herbal Pharmacopoeia (2002)'],
        },
        botanist1Id,
      );

      await contributionService.submit(botanist1Id, 'plant', plant._id.toString());
      await adminService.approvePlant(plant._id.toString(), adminId);

      const approved = await Plant.findById(plant._id);
      expect(approved?.status).toBe(ContentStatus.PUBLISHED);
      expect(approved?.isPublished).toBe(true);
      expect(approved?.reviewNotes?.length).toBeGreaterThan(0);
      const lastNote = approved?.reviewNotes?.[approved.reviewNotes.length - 1];
      expect(lastNote?.action).toBe('APPROVED');
    });

    it('admin requests changes transitioning IN_REVIEW -> CHANGES_REQUESTED', async () => {
      const plant = await plantService.create(
        {
          commonName: 'Shatavari Draft',
          scientificName: 'Asparagus racemosus',
          family: 'Asparagaceae',
          description: 'Female tonic adaptogen root widely mentioned in pharmacopoeia',
          medicinalUses: ['Vitality'],
          partsUsed: [PlantPart.ROOTS],
          toxicityLevel: ToxicityLevel.NONE,
          regionNative: ['India'],
          images: [{ url: 'https://example.com/shatavari.jpg', isPrimary: true }],
          references: ['API Vol 4 (2004)'],
        },
        botanist1Id,
      );

      await contributionService.submit(botanist1Id, 'plant', plant._id.toString());
      await adminService.requestChangesPlant(
        plant._id.toString(),
        'Please clarify active phytochemicals and dosage forms.',
        adminId,
      );

      const updated = await Plant.findById(plant._id);
      expect(updated?.status).toBe(ContentStatus.CHANGES_REQUESTED);
      expect(updated?.isPublished).toBe(false);
      const lastNote = updated?.reviewNotes?.[updated.reviewNotes.length - 1];
      expect(lastNote?.comment).toContain('Please clarify');
    });
  });

  describe('2. Validation & Safety Rules on Submission', () => {
    it('fails submit if required references/citations are missing', async () => {
      const plant = await Plant.create({
        commonName: 'No Ref Plant',
        scientificName: 'NoRef specia',
        slug: 'no-ref-plant',
        family: 'Testaceae',
        description: 'Test description of sufficient length for test purposes',
        medicinalUses: ['Test'],
        partsUsed: [PlantPart.LEAVES],
        toxicityLevel: ToxicityLevel.NONE,
        regionNative: ['India'],
        images: [{ url: 'https://example.com/noref.jpg', isPrimary: true }],
        owner: botanist1Id,
        createdBy: botanist1Id,
        status: ContentStatus.DRAFT,
        references: [],
      });

      await expect(
        contributionService.submit(botanist1Id, 'plant', plant._id.toString()),
      ).rejects.toThrow(/complete all required fields/i);
    });

    it('fails submit if text contains prohibited absolute claims', async () => {
      const plant = await Plant.create({
        commonName: 'Miracle Cure Plant',
        scientificName: 'Curio miraculous',
        slug: 'miracle-cure-plant',
        family: 'Testaceae',
        description: 'This plant cures diabetes guaranteed with no side effects and is a miracle remedy.',
        medicinalUses: ['Cures diabetes'],
        partsUsed: [PlantPart.ROOTS],
        toxicityLevel: ToxicityLevel.NONE,
        regionNative: ['India'],
        images: [{ url: 'https://example.com/miracle.jpg', isPrimary: true }],
        references: ['Dubious Journal (2020)'],
        owner: botanist1Id,
        createdBy: botanist1Id,
        status: ContentStatus.DRAFT,
      });

      await expect(
        contributionService.submit(botanist1Id, 'plant', plant._id.toString()),
      ).rejects.toThrow(/complete all required fields|safety/i);
    });

    it('enforces unique scientific name at schema level', async () => {
      await Plant.create({
        commonName: 'Existing Basil',
        scientificName: 'Ocimum gratissimum',
        slug: 'existing-basil',
        family: 'Lamiaceae',
        description: 'Existing plant in database with sufficient description',
        medicinalUses: ['Antimicrobial'],
        partsUsed: [PlantPart.LEAVES],
        toxicityLevel: ToxicityLevel.NONE,
        regionNative: ['India'],
        images: [{ url: 'https://example.com/basil.jpg', isPrimary: true }],
        status: ContentStatus.PUBLISHED,
        isPublished: true,
        createdBy: botanist1Id,
      });

      await expect(
        Plant.create({
          commonName: 'Another Clove Basil',
          scientificName: 'Ocimum gratissimum',
          slug: 'another-clove-basil',
          family: 'Lamiaceae',
          description: 'Attempting duplicate scientific name submission here',
          medicinalUses: ['Antimicrobial'],
          partsUsed: [PlantPart.LEAVES],
          toxicityLevel: ToxicityLevel.NONE,
          regionNative: ['India'],
          images: [{ url: 'https://example.com/basil2.jpg', isPrimary: true }],
          references: ['Some Book (2019)'],
          owner: botanist2Id,
          createdBy: botanist2Id,
          status: ContentStatus.DRAFT,
        }),
      ).rejects.toThrow();
    });
  });

  describe('3. Ownership & Edit Locks', () => {
    it('prevents botanist from editing another botanist draft', async () => {
      const plant = await plantService.create(
        {
          commonName: 'Botanist1 Plant',
          scientificName: 'Plantus botanicus1',
          family: 'Plantaceae',
          description: 'Owned exclusively by Botanist 1 for this test',
          medicinalUses: ['General'],
          partsUsed: [PlantPart.LEAVES],
          toxicityLevel: ToxicityLevel.NONE,
          regionNative: ['India'],
          images: [{ url: 'https://example.com/p1.jpg', isPrimary: true }],
        },
        botanist1Id,
      );

      await expect(
        plantService.update(
          plant._id.toString(),
          { description: 'Hacked by Botanist 2' },
          botanist2Id,
          UserRole.BOTANIST,
        ),
      ).rejects.toThrow(/only modify your own contributions/i);
    });

    it('prevents editing when submission is locked in IN_REVIEW', async () => {
      const plant = await plantService.create(
        {
          commonName: 'Locked Plant',
          scientificName: 'Lockus botanicus',
          family: 'Plantaceae',
          description: 'A submitted plant in review that must not be edited',
          medicinalUses: ['General'],
          partsUsed: [PlantPart.LEAVES],
          toxicityLevel: ToxicityLevel.NONE,
          regionNative: ['India'],
          images: [{ url: 'https://example.com/locked.jpg', isPrimary: true }],
          references: ['Ref 1 (2021)'],
        },
        botanist1Id,
      );

      await contributionService.submit(botanist1Id, 'plant', plant._id.toString());

      await expect(
        plantService.update(
          plant._id.toString(),
          { description: 'Attempt edit while locked' },
          botanist1Id,
          UserRole.BOTANIST,
        ),
      ).rejects.toThrow(/locked|under review/i);
    });

    it('allows ADMIN to edit or moderate plant regardless of owner', async () => {
      const plant = await plantService.create(
        {
          commonName: 'Admin Editable Plant',
          scientificName: 'Adminus botanicus',
          family: 'Plantaceae',
          description: 'Owner is Botanist 1 but Admin needs to correct typos',
          medicinalUses: ['General'],
          partsUsed: [PlantPart.LEAVES],
          toxicityLevel: ToxicityLevel.NONE,
          regionNative: ['India'],
          images: [{ url: 'https://example.com/adminedit.jpg', isPrimary: true }],
        },
        botanist1Id,
      );

      const updated = await plantService.update(
        plant._id.toString(),
        { description: 'Admin corrected description properly' },
        adminId,
        UserRole.ADMIN,
      );

      expect(updated.description).toBe('Admin corrected description properly');
    });
  });

  describe('4. Public Content Draft Isolation', () => {
    it('public list NEVER returns DRAFT or IN_REVIEW plants', async () => {
      // 1 published plant
      await Plant.create({
        commonName: 'Published Herb',
        scientificName: 'Publicus herbatus',
        slug: 'published-herb',
        family: 'Lamiaceae',
        description: 'Approved public herb accessible to anyone',
        medicinalUses: ['General'],
        status: ContentStatus.PUBLISHED,
        isPublished: true,
        createdBy: botanist1Id,
      });

      // 1 draft plant
      await Plant.create({
        commonName: 'Secret Draft Herb',
        scientificName: 'Secretus draftus',
        slug: 'secret-draft-herb',
        family: 'Lamiaceae',
        description: 'Should never appear in public listing',
        medicinalUses: ['General'],
        status: ContentStatus.DRAFT,
        isPublished: false,
        createdBy: botanist1Id,
      });

      // 1 in-review plant
      await Plant.create({
        commonName: 'Review Herb',
        scientificName: 'Reviewus herbatus',
        slug: 'review-herb',
        family: 'Lamiaceae',
        description: 'Pending review right now',
        medicinalUses: ['General'],
        status: ContentStatus.PENDING_REVIEW,
        isPublished: false,
        createdBy: botanist1Id,
      });

      const publicList = await plantService.list({ page: 1, limit: 10 });
      expect(publicList.plants.length).toBe(1);
      expect(publicList.plants[0].commonName).toBe('Published Herb');
    });

    it('public remedy list NEVER returns DRAFT or IN_REVIEW remedies', async () => {
      await Remedy.create({
        title: 'Public Remedy Kadha',
        slug: 'public-remedy-kadha',
        description: 'Public tea decoction available everywhere',
        ingredients: [{ name: 'Herb', quantity: '1', unit: 'g' }],
        preparationSteps: [{ step: 1, instruction: 'Boil' }],
        dosage: '1 cup',
        preparationTime: 15,
        status: ContentStatus.PUBLISHED,
        isPublished: true,
        createdBy: botanist1Id,
      });

      await Remedy.create({
        title: 'Draft Unapproved Remedy',
        slug: 'draft-unapproved-remedy',
        description: 'Secret formula unapproved',
        ingredients: [{ name: 'Secret', quantity: '1', unit: 'g' }],
        preparationSteps: [{ step: 1, instruction: 'Mix' }],
        dosage: '1 cup',
        preparationTime: 20,
        status: ContentStatus.DRAFT,
        isPublished: false,
        createdBy: botanist1Id,
      });

      const remedies = await remedyService.list({});
      expect(remedies.remedies.length).toBe(1);
      expect(remedies.remedies[0].title).toBe('Public Remedy Kadha');
    });
  });

  describe('5. Preview Query Authorization', () => {
    it('allows owner to preview unpublished plant draft with isPreview=true', async () => {
      const plant = await Plant.create({
        commonName: 'Draft for Preview',
        scientificName: 'Previewus draftus',
        slug: 'draft-for-preview',
        family: 'Lamiaceae',
        description: 'Preview test draft item',
        medicinalUses: ['Test'],
        partsUsed: [PlantPart.LEAVES],
        toxicityLevel: ToxicityLevel.NONE,
        status: ContentStatus.DRAFT,
        isPublished: false,
        owner: botanist1Id,
        createdBy: botanist1Id,
      });

      const previewed = await plantService.getBySlug(
        plant._id.toString(),
        botanist1Id,
        UserRole.BOTANIST,
        true,
      );

      expect(previewed._id.toString()).toBe(plant._id.toString());
    });

    it('denies non-owner regular user from previewing unpublished plant', async () => {
      const plant = await Plant.create({
        commonName: 'Draft for Preview 2',
        scientificName: 'Previewus draftus 2',
        slug: 'draft-for-preview-2',
        family: 'Lamiaceae',
        description: 'Preview test draft item 2',
        medicinalUses: ['Test'],
        partsUsed: [PlantPart.LEAVES],
        toxicityLevel: ToxicityLevel.NONE,
        status: ContentStatus.DRAFT,
        isPublished: false,
        owner: botanist1Id,
        createdBy: botanist1Id,
      });

      await expect(
        plantService.getBySlug(
          plant._id.toString(),
          regularUserId,
          UserRole.USER,
          true,
        ),
      ).rejects.toThrow(/not found/i);
    });
  });

  describe('6. AI Feedback Queue User Anonymity & Verdicts', () => {
    it('excludes user identity from feedback queue items', async () => {
      const detection = await Detection.create({
        user: new mongoose.Types.ObjectId(regularUserId),
        imageUrl: 'https://example.com/scan.jpg',
        status: 'COMPLETE',
        modelVersion: 'v1.0.0',
        expiresAt: new Date(Date.now() + 86400000),
        predictions: [
          {
            rank: 1,
            plant: new mongoose.Types.ObjectId(),
            commonName: 'Tulsi',
            confidence: 0.88,
            matchFound: true,
          },
        ],
        result: {
          commonName: 'Tulsi',
          scientificName: 'Ocimum tenuiflorum',
          confidence: 0.85,
          medicinalUses: ['Immunity'],
        },
      });

      const queue = await detectionService.getFeedbackQueue(botanist1Id, { page: 1, limit: 10 });
      expect(queue.items.length).toBeGreaterThan(0);
      const item = queue.items.find((i: any) => i.id === detection._id.toString());
      expect(item).toBeDefined();
      expect((item as any).user).toBeUndefined();
    });

    it('allows botanist to submit verdict and update it', async () => {
      const detection = await Detection.create({
        user: new mongoose.Types.ObjectId(regularUserId),
        imageUrl: 'https://example.com/scan2.jpg',
        status: 'COMPLETE',
        modelVersion: 'v1.0.0',
        expiresAt: new Date(Date.now() + 86400000),
        result: {
          commonName: 'Unsure Plant',
          scientificName: 'Unknown specia',
          confidence: 0.55,
          medicinalUses: [],
        },
      });

      // First verdict
      const first = await detectionService.addFeedback(detection._id.toString(), botanist1Id, {
        verdict: 'INCORRECT',
        comment: 'Actually Holy Basil',
      });
      expect(first.feedbacks.length).toBe(1);
      expect(first.feedbacks[0].verdict).toBe('INCORRECT');

      // Update verdict
      const updated = await detectionService.addFeedback(detection._id.toString(), botanist1Id, {
        verdict: 'CORRECT',
        comment: 'Verified with laboratory specimen',
      });
      expect(updated.feedbacks.length).toBe(1); // One feedback per botanist
      expect(updated.feedbacks[0].verdict).toBe('CORRECT');
      expect(updated.feedbacks[0].comment).toContain('laboratory specimen');
    });
  });

  describe('7. Support Requests & Rate Limiting', () => {
    it('enforces maximum 3 support requests per hour per user', async () => {
      // 3 requests should succeed
      await supportService.create(regularUserId, {
        subject: 'Inquiry 1',
        message: 'Question 1',
      });
      await supportService.create(regularUserId, {
        subject: 'Inquiry 2',
        message: 'Question 2',
      });
      await supportService.create(regularUserId, {
        subject: 'Inquiry 3',
        message: 'Question 3',
      });

      // 4th request within hour must throw rate limit error
      await expect(
        supportService.create(regularUserId, {
          subject: 'Inquiry 4',
          message: 'Question 4 exceeds rate limit',
        }),
      ).rejects.toThrow(/Support requests are limited to 3 per hour/i);
    });
  });
});
