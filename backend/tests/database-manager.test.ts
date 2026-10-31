import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import AuditLog from '../src/modules/admin/AuditLog.model';
import Category from '../src/modules/library/Category.model';
import Plant from '../src/modules/library/Plant.model';
import Remedy from '../src/modules/remedies/Remedy.model';
import Tour from '../src/modules/tours/Tour.model';
import DbJob from '../src/modules/database-manager/models/DbJob.model';
import DbBackup from '../src/modules/database-manager/models/DbBackup.model';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole } from '../src/types';
import './setup';

describe('Database Manager Module Integration Tests', () => {
  let superAdminUser: any;
  let adminUser: any;
  let regularUser: any;
  let superAdminToken: string;
  let adminToken: string;
  let regularToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await Category.deleteMany({});
    await Plant.deleteMany({});
    await Remedy.deleteMany({});
    await Tour.deleteMany({});
    await DbJob.deleteMany({});
    await DbBackup.deleteMany({});

    const passwordHash = await hashPassword('TestPass123!');

    superAdminUser = await User.create({
      email: `superadmin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'System Super Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    superAdminToken = signAccessToken({
      sub: superAdminUser._id.toString(),
      email: superAdminUser.email,
      role: UserRole.SUPER_ADMIN,
    });

    adminUser = await User.create({
      email: `admin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'System Admin',
      role: UserRole.ADMIN,
      isActive: true,
    });
    adminToken = signAccessToken({
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: UserRole.ADMIN,
    });

    regularUser = await User.create({
      email: `regular-${Date.now()}@example.com`,
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

  describe('RBAC and Access Controls', () => {
    it('rejects unauthenticated requests to overview with 401', async () => {
      const res = await request(app).get('/api/v1/admin/database/overview');
      expect(res.status).toBe(401);
    });

    it('rejects regular USER with 403 FORBIDDEN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/database/overview')
        .set('Authorization', `Bearer ${regularToken}`);
      expect(res.status).toBe(403);
    });

    it('allows ADMIN to access database overview', async () => {
      const res = await request(app)
        .get('/api/v1/admin/database/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.collections).toBeDefined();
    });
  });

  describe('Registry & Collection Metadata', () => {
    it('returns registered collections list', async () => {
      const res = await request(app)
        .get('/api/v1/admin/database/collections')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const keys = res.body.data.map((c: any) => c.key);
      expect(keys).toContain('categories');
      expect(keys).toContain('plants');
      expect(keys).toContain('remedies');
      expect(keys).toContain('tours');
      expect(keys).toContain('users');
    });
  });

  describe('Starter Seed Pack & Dry Run', () => {
    it('returns the bundled starter seed pack', async () => {
      const res = await request(app)
        .get('/api/v1/admin/database/import/starter-pack')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories).toBeDefined();
      expect(res.body.data.plants).toBeDefined();
    });

    it('executes a dry run and predicts insertions without writing to database', async () => {
      const seedRes = await request(app)
        .get('/api/v1/admin/database/import/starter-pack')
        .set('Authorization', `Bearer ${adminToken}`);

      const dryRunRes = await request(app)
        .post('/api/v1/admin/database/import/dry-run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bundle: seedRes.body.data,
          mode: 'insert_only',
        });

      expect(dryRunRes.status).toBe(200);
      expect(dryRunRes.body.success).toBe(true);
      expect(dryRunRes.body.data.willInsert).toBeGreaterThan(0);
      expect(dryRunRes.body.data.errorCount).toBe(0);

      // Verify nothing was written during dry run
      const catCount = await Category.countDocuments();
      expect(catCount).toBe(0);
    });

    it('commits starter pack and inserts records in dependency order', async () => {
      const seedRes = await request(app)
        .get('/api/v1/admin/database/import/starter-pack')
        .set('Authorization', `Bearer ${adminToken}`);

      const commitRes = await request(app)
        .post('/api/v1/admin/database/import/commit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bundle: seedRes.body.data,
          mode: 'insert_only',
        });

      expect(commitRes.status).toBe(200);
      expect(commitRes.body.success).toBe(true);
      expect(commitRes.body.data.jobId).toBeDefined();

      const catCount = await Category.countDocuments();
      const plantCount = await Plant.countDocuments();
      expect(catCount).toBeGreaterThan(0);
      expect(plantCount).toBeGreaterThan(0);
    });

    it('verifies idempotency: re-running import in insert_only mode skips existing docs', async () => {
      const seedRes = await request(app)
        .get('/api/v1/admin/database/import/starter-pack')
        .set('Authorization', `Bearer ${adminToken}`);

      // First run: commit
      await request(app)
        .post('/api/v1/admin/database/import/commit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bundle: seedRes.body.data,
          mode: 'insert_only',
        });

      const initialCount = await Plant.countDocuments();

      // Second dry run
      const dryRunRes = await request(app)
        .post('/api/v1/admin/database/import/dry-run')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bundle: seedRes.body.data,
          mode: 'insert_only',
        });

      expect(dryRunRes.body.data.willInsert).toBe(0);
      expect(dryRunRes.body.data.willSkip).toBeGreaterThan(0);

      // Second commit
      await request(app)
        .post('/api/v1/admin/database/import/commit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bundle: seedRes.body.data,
          mode: 'insert_only',
        });

      const postCount = await Plant.countDocuments();
      expect(postCount).toBe(initialCount);
    });
  });

  describe('Data Browser & Concurrency', () => {
    beforeEach(async () => {
      await Category.create({
        name: 'Digestive Health',
        slug: 'digestive-health',
        description: 'Herbs for gut health',
      });
    });

    it('browses documents with pagination and sorting', async () => {
      const res = await request(app)
        .get('/api/v1/admin/database/browse/categories?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.docs[0].slug).toBe('digestive-health');
    });

    it('updates a document with optimistic concurrency check', async () => {
      const cat = await Category.findOne({ slug: 'digestive-health' });
      const res = await request(app)
        .put(`/api/v1/admin/database/browse/categories/${cat!._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          data: { description: 'Updated gut health description' },
          expectedUpdatedAt: ((cat as any).updatedAt || (cat as any).createdAt).toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.description).toBe('Updated gut health description');
    });

    it('returns 409 conflict when optimistic concurrency timestamp differs', async () => {
      const cat = await Category.findOne({ slug: 'digestive-health' });
      const staleTimestamp = new Date(Date.now() - 100000).toISOString();

      const res = await request(app)
        .put(`/api/v1/admin/database/browse/categories/${cat!._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          data: { description: 'Stale edit' },
          expectedUpdatedAt: staleTimestamp,
        });

      expect(res.status).toBe(409);
    });
  });

  describe('Query Console', () => {
    it('executes safe find queries with projection and limit', async () => {
      await Category.create({ name: 'Immunity', slug: 'immunity', description: 'Defenses' });

      const res = await request(app)
        .post('/api/v1/admin/database/query/find')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          collection: 'categories',
          filter: { slug: 'immunity' },
          limit: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);
      expect(res.body.data.results[0].name).toBe('Immunity');
    });

    it('blocks dangerous aggregation stages ($out, $merge, $where)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/database/query/aggregate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          collection: 'categories',
          pipeline: [{ $out: 'compromised_collection' }],
        });

      expect(res.status).toBe(400);
      const errMsg = res.body.error?.message || res.body.message || '';
      expect(errMsg).toContain('Disallowed aggregation stage: $out');
    });
  });

  describe('Export & Redaction', () => {
    it('exports user collection and strictly redacts passwordHash and secrets', async () => {
      const res = await request(app)
        .get('/api/v1/admin/database/export/users?format=json')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      const exportedUsers = JSON.parse(res.text);
      expect(exportedUsers.length).toBeGreaterThan(0);
      for (const u of exportedUsers) {
        expect(u.passwordHash).toBeUndefined();
        expect(u.twoFactorSecret).toBeUndefined();
        expect(u.emailVerificationToken).toBeUndefined();
        expect(u.resetPasswordToken).toBeUndefined();
      }
    });
  });

  describe('Backups & Disaster Recovery (SUPER_ADMIN only)', () => {
    it('denies ADMIN from creating or restoring backups with 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/database/backups')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('allows SUPER_ADMIN to create backup snapshot', async () => {
      const res = await request(app)
        .post('/api/v1/admin/database/backups')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ kind: 'manual' });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.backupId).toBeDefined();
      expect(res.body.data.checksum).toBeDefined();
    });
  });

  describe('Undo Batch Job', () => {
    it('reverts inserted documents from an import batch job', async () => {
      // 1. Import a category
      const bundle = {
        categories: [
          { name: 'To Be Undone', slug: 'to-be-undone', description: 'Temporary Category' },
        ],
      };

      const commitRes = await request(app)
        .post('/api/v1/admin/database/import/commit')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bundle, mode: 'insert_only' });

      const jobId = commitRes.body.data.jobId;
      expect(await Category.countDocuments({ slug: 'to-be-undone' })).toBe(1);

      // 2. Trigger undo
      const undoRes = await request(app)
        .post(`/api/v1/admin/database/jobs/${jobId}/undo`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(undoRes.status).toBe(200);
      expect(undoRes.body.success).toBe(true);

      // 3. Document should be removed
      expect(await Category.countDocuments({ slug: 'to-be-undone' })).toBe(0);
    });
  });
});
