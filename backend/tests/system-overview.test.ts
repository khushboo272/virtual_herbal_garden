import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import AuditLog from '../src/modules/admin/AuditLog.model';
import RefreshToken from '../src/modules/auth/RefreshToken.model';
import Plant from '../src/modules/library/Plant.model';
import Remedy from '../src/modules/remedies/Remedy.model';
import Tour from '../src/modules/tours/Tour.model';
import Detection from '../src/modules/ai-scanner/Detection.model';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, AuditAction } from '../src/types';
import './setup';

describe('Super Admin System Overview & Operations Tests (Part S2)', () => {
  let superAdminUser: any;
  let adminUser: any;
  let superAdminToken: string;
  let adminToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await RefreshToken.deleteMany({});
    await Plant.deleteMany({});
    await Remedy.deleteMany({});
    await Tour.deleteMany({});
    await Detection.deleteMany({});

    const passwordHash = await hashPassword('SuperSecure123!');

    superAdminUser = await User.create({
      email: `superadmin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'System Super Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      is2faEnabled: true,
    });
    superAdminToken = signAccessToken({
      sub: superAdminUser._id.toString(),
      email: superAdminUser.email,
      role: UserRole.SUPER_ADMIN,
    });

    adminUser = await User.create({
      email: `admin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Standard Admin',
      role: UserRole.ADMIN,
      isActive: true,
    });
    adminToken = signAccessToken({
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: UserRole.ADMIN,
    });
  });

  describe('GET /api/v1/system/overview', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/system/overview');
      expect(res.status).toBe(401);
    });

    it('rejects ADMIN role with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/system/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('returns comprehensive system overview data for SUPER_ADMIN', async () => {
      // Seed some test data across collections
      await Plant.create({
        commonName: 'Test Tulsi',
        scientificName: 'Ocimum tenuiflorum',
        family: 'Lamiaceae',
        slug: 'test-tulsi',
        description: 'Sacred basil with medicinal properties',
        medicinalUses: ['Immunity', 'Cold'],
        isPublished: true,
        createdBy: superAdminUser._id,
      });

      await Remedy.create({
        title: 'Digestive Tea',
        slug: 'digestive-tea',
        description: 'Herbal digestive remedy',
        ingredients: [{ name: 'Ginger', quantity: '10g' }],
        preparationSteps: [{ step: 1, instruction: 'Boil water' }],
        dosage: '1 cup after meals',
        difficultyLevel: 'EASY',
        preparationTime: 10,
        isPublished: true,
        owner: superAdminUser._id,
        createdBy: superAdminUser._id,
      });

      const res = await request(app)
        .get('/api/v1/system/overview')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const data = res.body.data;
      expect(data).toBeDefined();

      // Health & Subsystems
      expect(data.health).toBeDefined();
      expect(data.health.database.status).toBe('connected');
      expect(data.health.database.name).toBeDefined();
      expect(typeof data.health.database.latencyMs).toBe('number');
      expect(data.health.storage).toBeDefined();
      expect(data.health.socket).toBeDefined();
      expect(data.health.ai).toBeDefined();

      // Runtime Specs
      expect(data.runtime).toBeDefined();
      expect(data.runtime.nodeVersion).toBe(process.version);
      expect(data.runtime.platform).toBe(process.platform);
      expect(typeof data.runtime.uptimeSeconds).toBe('number');
      expect(data.runtime.memory.heapUsedMb).toBeGreaterThan(0);

      // Metrics & Collections
      expect(data.metrics).toBeDefined();
      expect(data.metrics.users.total).toBe(2);
      expect(data.metrics.users.superAdmins).toBe(1);
      expect(data.metrics.content.plantsTotal).toBe(1);
      expect(data.metrics.content.remediesTotal).toBe(1);

      // Collections Summary
      expect(Array.isArray(data.collections)).toBe(true);
      const userCol = data.collections.find((c: any) => c.name === 'users');
      expect(userCol).toBeDefined();
      expect(userCol.count).toBe(2);
      expect(userCol.path).toBe('/dashboard/users');

      const plantCol = data.collections.find((c: any) => c.name === 'plants');
      expect(plantCol).toBeDefined();
      expect(plantCol.path).toBe('/dashboard/content/plants');

      const remedyCol = data.collections.find((c: any) => c.name === 'remedies');
      expect(remedyCol).toBeDefined();
      expect(remedyCol.path).toBe('/dashboard/content/remedies');

      const tourCol = data.collections.find((c: any) => c.name === 'tours');
      expect(tourCol).toBeDefined();
      expect(tourCol.path).toBe('/dashboard/tours/manage');

      // Security Pulse
      expect(data.securityPulse).toBeDefined();
      expect(typeof data.securityPulse.failedLoginsLast24h).toBe('number');
      expect(Array.isArray(data.securityPulse.recentEvents)).toBe(true);
    });
  });

  describe('POST /api/v1/system/operations/ping-subsystems', () => {
    it('rejects ADMIN role with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/system/operations/ping-subsystems')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('returns real-time round-trip latency measurements for SUPER_ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/system/operations/ping-subsystems')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const pings = res.body.data;

      expect(pings.database).toBeDefined();
      expect(pings.database.ok).toBe(true);
      expect(typeof pings.database.latencyMs).toBe('number');

      expect(pings.storage).toBeDefined();
      expect(typeof pings.storage.ok).toBe('boolean');

      expect(pings.socket).toBeDefined();
      expect(pings.socket.ok).toBe(true);

      expect(pings.ai).toBeDefined();
      expect(typeof pings.ai.ok).toBe('boolean');
    });
  });

  describe('POST /api/v1/system/operations/clear-cache', () => {
    it('flushes catalog cache and creates an audit log entry', async () => {
      const res = await request(app)
        .post('/api/v1/system/operations/clear-cache')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toMatch(/cleared/i);

      // Verify audit log
      const audit = await AuditLog.findOne({
        user: superAdminUser._id,
        action: AuditAction.CONFIG_CHANGE,
      });
      expect(audit).not.toBeNull();
      expect(JSON.stringify(audit?.newValue)).toMatch(/cache/i);
    });
  });

  describe('POST /api/v1/system/operations/purge-expired-sessions', () => {
    it('purges expired refresh tokens, leaves active ones, and logs audit', async () => {
      // 1 expired token
      await RefreshToken.create({
        user: superAdminUser._id,
        tokenHash: 'expiredhash123',
        deviceInfo: { ua: 'Mozilla/5.0 Chrome/120.0', ip: '127.0.0.1', device: 'Desktop' },
        expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      });

      // 1 active token
      await RefreshToken.create({
        user: superAdminUser._id,
        tokenHash: 'activehash123',
        deviceInfo: { ua: 'Mozilla/5.0 Chrome/120.0', ip: '127.0.0.1', device: 'Desktop' },
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });

      const res = await request(app)
        .post('/api/v1/system/operations/purge-expired-sessions')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.purgedCount).toBe(1);

      // Verify DB count
      const remainingTokens = await RefreshToken.countDocuments({});
      expect(remainingTokens).toBe(1);

      // Verify audit log
      const audit = await AuditLog.findOne({
        user: superAdminUser._id,
        action: AuditAction.CONFIG_CHANGE,
      });
      expect(audit).not.toBeNull();
      expect(JSON.stringify(audit?.newValue)).toMatch(/expired.*session/i);
    });
  });
});
