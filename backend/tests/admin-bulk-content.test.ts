import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import Plant from '../src/modules/library/Plant.model';
import Remedy from '../src/modules/remedies/Remedy.model';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, ContentStatus } from '../src/types';
import './setup';

describe('Admin Advanced Bulk Content Operations Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let adminToken: string;
  let regularToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await Plant.deleteMany({});
    await Remedy.deleteMany({});

    const passwordHash = await hashPassword('SecurePass123!');

    adminUser = await User.create({
      email: `admin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Content Admin',
      role: UserRole.ADMIN,
      isActive: true,
    });
    adminToken = signAccessToken({
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: UserRole.ADMIN,
    });

    regularUser = await User.create({
      email: `user-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Standard User',
      role: UserRole.USER,
      isActive: true,
    });
    regularToken = signAccessToken({
      sub: regularUser._id.toString(),
      email: regularUser.email,
      role: UserRole.USER,
    });
  });

  describe('POST /api/v1/admin/content/:type/bulk-publish', () => {
    it('rejects regular users with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/admin/content/plants/bulk-publish')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ ids: [] });

      expect(res.status).toBe(403);
    });

    it('bulk publishes multiple draft plants and updates isPublished to true', async () => {
      const plant1 = await Plant.create({
        commonName: 'Brahmi Draft',
        scientificName: 'Bacopa monnieri',
        family: 'Plantaginaceae',
        slug: `brahmi-${Date.now()}`,
        description: 'Memory booster herb.',
        status: ContentStatus.DRAFT,
        isPublished: false,
        createdBy: adminUser._id,
      });

      const plant2 = await Plant.create({
        commonName: 'Ashwagandha Draft',
        scientificName: 'Withania somnifera',
        family: 'Solanaceae',
        slug: `ashwagandha-${Date.now()}`,
        description: 'Adaptogenic root.',
        status: ContentStatus.DRAFT,
        isPublished: false,
        createdBy: adminUser._id,
      });

      const res = await request(app)
        .post('/api/v1/admin/content/plants/bulk-publish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [plant1._id.toString(), plant2._id.toString()] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processed).toBe(2);

      const updated1 = await Plant.findById(plant1._id);
      const updated2 = await Plant.findById(plant2._id);
      expect(updated1?.isPublished).toBe(true);
      expect(updated1?.status).toBe(ContentStatus.PUBLISHED);
      expect(updated2?.isPublished).toBe(true);
      expect(updated2?.status).toBe(ContentStatus.PUBLISHED);
    });
  });

  describe('POST /api/v1/admin/content/:type/bulk-feature', () => {
    it('bulk features and unfeatures multiple content items in one call', async () => {
      const plant1 = await Plant.create({
        commonName: 'Tulsi Feature',
        scientificName: 'Ocimum tenuiflorum',
        family: 'Lamiaceae',
        slug: `tulsi-feat-${Date.now()}`,
        description: 'Holy basil.',
        status: ContentStatus.PUBLISHED,
        isPublished: true,
        isFeatured: false,
        createdBy: adminUser._id,
      });

      const plant2 = await Plant.create({
        commonName: 'Neem Feature',
        scientificName: 'Azadirachta indica',
        family: 'Meliaceae',
        slug: `neem-feat-${Date.now()}`,
        description: 'Antimicrobial tree.',
        status: ContentStatus.PUBLISHED,
        isPublished: true,
        isFeatured: false,
        createdBy: adminUser._id,
      });

      // Bulk Feature: true
      const featRes = await request(app)
        .post('/api/v1/admin/content/plants/bulk-feature')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [plant1._id.toString(), plant2._id.toString()], isFeatured: true });

      expect(featRes.status).toBe(200);
      expect(featRes.body.success).toBe(true);
      expect(featRes.body.data.processed).toBe(2);

      const dbPlant1 = await Plant.findById(plant1._id);
      const dbPlant2 = await Plant.findById(plant2._id);
      expect(dbPlant1?.isFeatured).toBe(true);
      expect(dbPlant2?.isFeatured).toBe(true);

      // Bulk Unfeature: false
      const unfeatRes = await request(app)
        .post('/api/v1/admin/content/plants/bulk-feature')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [plant1._id.toString(), plant2._id.toString()], isFeatured: false });

      expect(unfeatRes.status).toBe(200);
      expect(unfeatRes.body.success).toBe(true);
      expect(unfeatRes.body.data.processed).toBe(2);

      const dbPlant1Unfeat = await Plant.findById(plant1._id);
      expect(dbPlant1Unfeat?.isFeatured).toBe(false);
    });
  });

  describe('POST /api/v1/admin/content/:type/bulk-status', () => {
    it('bulk transitions items to PENDING_REVIEW or DRAFT status', async () => {
      const remedy = await Remedy.create({
        title: 'Digestive Tea',
        slug: `digestive-tea-${Date.now()}`,
        description: 'Digestive aid.',
        ingredients: [{ name: 'Ginger', quantity: '5g' }],
        preparationSteps: [{ step: 1, instruction: 'Boil water' }],
        dosage: '1 cup after meals',
        difficultyLevel: 'EASY',
        preparationTime: 10,
        status: ContentStatus.PUBLISHED,
        isPublished: true,
        owner: adminUser._id,
        createdBy: adminUser._id,
      });

      const res = await request(app)
        .post('/api/v1/admin/content/remedies/bulk-status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [remedy._id.toString()], status: ContentStatus.DRAFT });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.processed).toBe(1);

      const dbRemedy = await Remedy.findById(remedy._id);
      expect(dbRemedy?.status).toBe(ContentStatus.DRAFT);
      expect(dbRemedy?.isPublished).toBe(false);
    });
  });
});
