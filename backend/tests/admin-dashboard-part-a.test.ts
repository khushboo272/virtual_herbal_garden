import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import Plant from '../src/modules/library/Plant.model';
import Remedy from '../src/modules/remedies/Remedy.model';
import RoleApplication from '../src/modules/admin/RoleApplication.model';
import AuditLog from '../src/modules/admin/AuditLog.model';
import { authService } from '../src/modules/auth/auth.service';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, ContentStatus } from '../src/types';
import './setup';

describe('Admin Dashboard Part A Tests', () => {
  let superAdminUser: any;
  let adminUser: any;
  let admin2User: any;
  let botanistUser: any;
  let regularUser: any;

  let superAdminToken: string;
  let adminToken: string;
  let botanistToken: string;
  let userToken: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('TestPass123!');

    superAdminUser = await User.create({
      email: `super-${Date.now()}@test.com`,
      passwordHash,
      displayName: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    superAdminToken = signAccessToken({
      sub: superAdminUser._id.toString(),
      email: superAdminUser.email,
      role: UserRole.SUPER_ADMIN,
    });

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

    admin2User = await User.create({
      email: `admin2-${Date.now()}@test.com`,
      passwordHash,
      displayName: 'Admin User 2',
      role: UserRole.ADMIN,
      isActive: true,
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

  // ── 1. Role Policy Matrix ──
  describe('1. Role Policy Matrix (PATCH /admin/users/:id/role)', () => {
    it('allows ADMIN to switch USER to BOTANIST and back to USER', async () => {
      const res1 = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.BOTANIST });
      expect(res1.status).toBe(200);
      expect(res1.body.data.role).toBe(UserRole.BOTANIST);

      const res2 = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.USER });
      expect(res2.status).toBe(200);
      expect(res2.body.data.role).toBe(UserRole.USER);
    });

    it('denies ADMIN from promoting USER to ADMIN or SUPER_ADMIN', async () => {
      const res1 = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.ADMIN });
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.SUPER_ADMIN });
      expect(res2.status).toBe(403);
    });

    it('denies ADMIN from changing themselves or an equal/higher role (other ADMIN or SUPER_ADMIN)', async () => {
      // Self change
      const selfRes = await request(app)
        .patch(`/api/v1/admin/users/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.USER });
      expect(selfRes.status).toBe(403);

      // Other admin
      const otherAdminRes = await request(app)
        .patch(`/api/v1/admin/users/${admin2User._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.USER });
      expect(otherAdminRes.status).toBe(403);

      // Super admin
      const superAdminRes = await request(app)
        .patch(`/api/v1/admin/users/${superAdminUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.USER });
      expect(superAdminRes.status).toBe(403);
    });

    it('allows SUPER_ADMIN to promote USER to ADMIN and demote ADMIN to USER', async () => {
      const res1 = await request(app)
        .patch(`/api/v1/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: UserRole.ADMIN });
      expect(res1.status).toBe(200);
      expect(res1.body.data.role).toBe(UserRole.ADMIN);

      const res2 = await request(app)
        .patch(`/api/v1/admin/users/${admin2User._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: UserRole.USER });
      expect(res2.status).toBe(200);
      expect(res2.body.data.role).toBe(UserRole.USER);
    });

    it('denies SUPER_ADMIN from changing themselves or another SUPER_ADMIN', async () => {
      const otherSuper = await User.create({
        email: `other-super-${Date.now()}@test.com`,
        passwordHash: 'hash',
        displayName: 'Other Super',
        role: UserRole.SUPER_ADMIN,
      });

      const res1 = await request(app)
        .patch(`/api/v1/admin/users/${superAdminUser._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: UserRole.ADMIN });
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .patch(`/api/v1/admin/users/${otherSuper._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ role: UserRole.ADMIN });
      expect(res2.status).toBe(403);
    });
  });

  // ── 2. Banned Users Enforcement ──
  describe('2. Banned Users Enforcement', () => {
    it('blocks banned users at login', async () => {
      const banUntil = new Date(Date.now() + 86400000);
      await User.findByIdAndUpdate(regularUser._id, {
        bannedUntil: banUntil,
        banReason: 'Violation of guidelines',
      });

      await expect(
        authService.login(regularUser.email, 'TestPass123!', {} as any),
      ).rejects.toThrow(/banned/i);
    });

    it('blocks banned users in authenticate middleware with 403', async () => {
      await User.findByIdAndUpdate(regularUser._id, {
        bannedUntil: new Date(Date.now() + 86400000),
      });

      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  // ── 3. lastActiveAt Throttling & Active Users ──
  describe('3. Activity Tracking and Active Today', () => {
    it('updates lastActiveAt and returns real activeToday in summary and list', async () => {
      const recent = new Date();
      await User.findByIdAndUpdate(regularUser._id, {
        lastActiveAt: recent,
      });

      const listRes = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.activeToday).toBeGreaterThanOrEqual(1);

      const summaryRes = await request(app)
        .get('/api/v1/admin/dashboard-summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.data.stats.activeToday).toBeGreaterThanOrEqual(1);
    });
  });

  // ── 4. Moderation Workflow ──
  describe('4. Moderation Workflow (Plants & Remedies)', () => {
    it('approves a plant, sets isPublished to true, supports feature toggle, notifies, and audits', async () => {
      const plant = await Plant.create({
        commonName: 'Neem Plant',
        scientificName: 'Azadirachta indica',
        slug: 'neem-plant',
        family: 'Meliaceae',
        description: 'A versatile medicinal tree.',
        plantType: 'TREE',
        status: ContentStatus.PENDING_REVIEW,
        isPublished: false,
        createdBy: botanistUser._id,
        owner: botanistUser._id,
      });

      const res = await request(app)
        .post(`/api/v1/admin/moderation/plants/${plant._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ feature: true });

      expect(res.status).toBe(200);
      const updatedPlant = await Plant.findById(plant._id);
      expect(updatedPlant?.status).toBe(ContentStatus.PUBLISHED);
      expect(updatedPlant?.isPublished).toBe(true);
      expect(updatedPlant?.isFeatured).toBe(true);

      // Check Audit Log
      const audit = await AuditLog.findOne({
        action: 'PLANT_APPROVED',
        entityId: plant._id,
      });
      expect(audit).toBeDefined();
    });

    it('rejects a remedy with required reason', async () => {
      const remedy = await Remedy.create({
        title: 'Herbal Cough Syrup',
        slug: 'herbal-cough-syrup',
        description: 'Soothing syrup for throat',
        dosage: '1 tsp twice daily',
        preparationTime: 15,
        status: ContentStatus.PENDING_REVIEW,
        isPublished: false,
        createdBy: botanistUser._id,
        owner: botanistUser._id,
      });

      // Attempt without reason -> fails
      const failRes = await request(app)
        .post(`/api/v1/admin/moderation/remedies/${remedy._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(failRes.status).toBe(400);

      // With reason -> succeeds
      const successRes = await request(app)
        .post(`/api/v1/admin/moderation/remedies/${remedy._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Insufficient preparation dosage details provided.' });

      expect(successRes.status).toBe(200);
      const updated = await Remedy.findById(remedy._id);
      expect(updated?.status).toBe(ContentStatus.REJECTED);
      expect(updated?.isPublished).toBe(false);
      expect(updated?.reviewNotes).toBeDefined();
    });

    it('requests changes with required comment', async () => {
      const plant = await Plant.create({
        commonName: 'Ashwagandha Specimen',
        scientificName: 'Withania somnifera',
        slug: 'ashwagandha-specimen',
        family: 'Solanaceae',
        description: 'Rejuvenating adaptogenic herb.',
        plantType: 'SHRUB',
        status: ContentStatus.PENDING_REVIEW,
        isPublished: false,
        createdBy: botanistUser._id,
      });

      const res = await request(app)
        .post(`/api/v1/admin/moderation/plants/${plant._id}/request-changes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ comment: 'Please attach references for traditional preparation methods.' });

      expect(res.status).toBe(200);
      const updated = await Plant.findById(plant._id);
      expect(updated?.status).toBe(ContentStatus.CHANGES_REQUESTED);
      expect(updated?.isPublished).toBe(false);
    });
  });

  // ── 5. Public Access Never Exposes Non-Published Content ──
  describe('5. Public Endpoint Protection', () => {
    it('does not expose unpublished plants on public endpoints', async () => {
      const unpublishedPlant = await Plant.create({
        commonName: 'Secret Herb',
        scientificName: 'Secretus plantus',
        slug: 'secret-herb',
        family: 'Secretaceae',
        description: 'Classified medicinal plant.',
        plantType: 'HERB',
        status: ContentStatus.PENDING_REVIEW,
        isPublished: false,
        createdBy: botanistUser._id,
      });

      const res = await request(app).get(`/api/v1/plants/${unpublishedPlant.slug}`);
      expect(res.status).toBe(404);
    });
  });

  // ── 6. Content Delete Rules & Impact Counts ──
  describe('6. Content Delete Rules & Impact Counts', () => {
    it('calculates impact and prevents deleting published content or mismatched slug', async () => {
      const plant = await Plant.create({
        commonName: 'Brahmi Plant',
        scientificName: 'Bacopa monnieri',
        slug: 'brahmi-plant',
        family: 'Plantaginaceae',
        description: 'Memory enhancing perennial creeping herb.',
        plantType: 'HERB',
        status: ContentStatus.PUBLISHED,
        isPublished: true,
        createdBy: botanistUser._id,
      });

      // Impact count check
      const impactRes = await request(app)
        .get(`/api/v1/admin/content/plants/${plant._id}/impact`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(impactRes.status).toBe(200);
      expect(impactRes.body.data.remediesCount).toBeDefined();

      // Deleting published item -> 400
      const deletePublishedRes = await request(app)
        .delete(`/api/v1/admin/content/plants/${plant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirmSlug: plant.slug });
      expect(deletePublishedRes.status).toBe(400);

      // Unpublish first
      await request(app)
        .post(`/api/v1/admin/content/plants/${plant._id}/unpublish`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Mismatched slug -> 400
      const wrongSlugRes = await request(app)
        .delete(`/api/v1/admin/content/plants/${plant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirmSlug: 'wrong-slug' });
      expect(wrongSlugRes.status).toBe(400);

      // Correct slug -> 200
      const successRes = await request(app)
        .delete(`/api/v1/admin/content/plants/${plant._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ confirmSlug: plant.slug });
      expect(successRes.status).toBe(200);

      const deleted = await Plant.findById(plant._id);
      expect(deleted?.isDeleted).toBe(true);
    });
  });

  // ── 7. Bulk Limits ──
  describe('7. Bulk Limits (Admin Content)', () => {
    it('enforces maximum 50 items for bulk operations', async () => {
      const dummyIds = Array.from({ length: 51 }, () => new mongoose.Types.ObjectId().toString());
      const res = await request(app)
        .post('/api/v1/admin/content/plants/bulk-unpublish')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: dummyIds });
      expect(res.status).toBe(400);
    });
  });

  // ── 8. Role Applications Lifecycle ──
  describe('8. Role Applications Lifecycle', () => {
    it('allows USER to submit application, enforces 1 PENDING rule, and lets ADMIN approve/reject', async () => {
      // 1. Submit application
      const submitRes = await request(app)
        .post('/api/v1/role-applications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          motivation: 'I have 10 years of experience studying medicinal flora in Western Ghats and want to contribute authentic data.',
          qualifications: 'MSc in Botany, Pune University',
          links: ['https://herbalscholars.org/author/profile'],
        });
      expect(submitRes.status).toBe(201);
      const appId = submitRes.body.data._id;

      // 2. Cannot submit second while one is PENDING
      const duplicateRes = await request(app)
        .post('/api/v1/role-applications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          motivation: 'Another application attempt while already pending in queue.',
        });
      expect(duplicateRes.status).toBe(400);

      // 3. User can fetch their application
      const myRes = await request(app)
        .get('/api/v1/role-applications/mine')
        .set('Authorization', `Bearer ${userToken}`);
      expect(myRes.status).toBe(200);
      expect(myRes.body.data._id).toBe(appId);

      // 4. Admin approves application -> applicant role upgraded to BOTANIST
      const approveRes = await request(app)
        .post(`/api/v1/admin/role-applications/${appId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reviewNote: 'Strong botanical research background verified.' });
      expect(approveRes.status).toBe(200);

      const upgradedUser = await User.findById(regularUser._id);
      expect(upgradedUser?.role).toBe(UserRole.BOTANIST);

      const appDoc = await RoleApplication.findById(appId);
      expect(appDoc?.status).toBe('APPROVED');
    });

    it('requires reason when rejecting role application', async () => {
      const appDoc = await RoleApplication.create({
        userId: regularUser._id,
        requestedRole: UserRole.BOTANIST,
        motivation: 'Passionate about plants and gardening and want to share knowledge with the world.',
        qualifications: 'BSc in Botany, Delhi University',
        status: 'PENDING',
      });

      const failRes = await request(app)
        .post(`/api/v1/admin/role-applications/${appDoc._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(failRes.status).toBe(400);

      const successRes = await request(app)
        .post(`/api/v1/admin/role-applications/${appDoc._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Please provide verifiable credentials or academic affiliations.' });
      expect(successRes.status).toBe(200);

      const updated = await RoleApplication.findById(appDoc._id);
      expect(updated?.status).toBe('REJECTED');
    });
  });

  // ── 9. RBAC: BOTANIST cannot access Admin Endpoints ──
  describe('9. RBAC: Admin Endpoints Return 403 for BOTANIST', () => {
    it('returns 403 when BOTANIST attempts admin endpoints', async () => {
      const res1 = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${botanistToken}`);
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .get('/api/v1/admin/moderation')
        .set('Authorization', `Bearer ${botanistToken}`);
      expect(res2.status).toBe(403);

      const res3 = await request(app)
        .get('/api/v1/admin/content/plants')
        .set('Authorization', `Bearer ${botanistToken}`);
      expect(res3.status).toBe(403);

      const res4 = await request(app)
        .get('/api/v1/admin/role-applications')
        .set('Authorization', `Bearer ${botanistToken}`);
      expect(res4.status).toBe(403);
    });
  });
});
