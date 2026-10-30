import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import AuditLog from '../src/modules/admin/AuditLog.model';
import SystemConfig from '../src/modules/admin/SystemConfig.model';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole } from '../src/types';
import './setup';

describe('Super Admin System Configuration & AI Model Control Tests', () => {
  let superAdminUser: any;
  let regularUser: any;
  let superAdminToken: string;
  let regularToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await SystemConfig.deleteMany({});

    const passwordHash = await hashPassword('SuperAdminPass123!');

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

  describe('GET /api/v1/system/config', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/system/config');
      expect(res.status).toBe(401);
    });

    it('rejects non-SUPER_ADMIN users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/system/config')
        .set('Authorization', `Bearer ${regularToken}`);
      expect(res.status).toBe(403);
    });

    it('returns full system configuration object with defaults for SUPER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/system/config')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const config = res.body.data;
      expect(config).toBeDefined();

      // AI Model settings
      expect(config.ai).toBeDefined();
      expect(config.ai.model).toBeDefined();
      expect(typeof config.ai.temperature).toBe('number');
      expect(typeof config.ai.maxTokens).toBe('number');
      expect(typeof config.ai.confidenceThreshold).toBe('number');

      // Storage settings
      expect(config.storage).toBeDefined();
      expect(config.storage.provider).toBeDefined();

      // Security & Rate limiting settings
      expect(config.security).toBeDefined();
      expect(typeof config.security.allowedDetectionsPerHour).toBe('number');

      // General platform settings
      expect(config.general).toBeDefined();
      expect(config.general.platformName).toBeDefined();
    });
  });

  describe('PATCH /api/v1/system/config', () => {
    it('rejects non-SUPER_ADMIN updates with 403', async () => {
      const res = await request(app)
        .patch('/api/v1/system/config')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ ai: { temperature: 0.5 } });

      expect(res.status).toBe(403);
    });

    it('updates AI model and system settings, and creates an audit log', async () => {
      const payload = {
        ai: {
          model: 'gemini-1.5-pro',
          temperature: 0.4,
          maxTokens: 4096,
          confidenceThreshold: 80,
        },
        security: {
          allowedDetectionsPerHour: 25,
          require2faForAdmins: true,
        },
        storage: {
          provider: 'R2',
          cdnBaseUrl: 'https://cdn.virtualherbalgarden.org',
        },
        general: {
          platformName: 'Virtual Herbal Garden Global',
          supportEmail: 'ops@virtualherbalgarden.org',
        },
      };

      const res = await request(app)
        .patch('/api/v1/system/config')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ai.model).toBe('gemini-1.5-pro');
      expect(res.body.data.ai.temperature).toBe(0.4);
      expect(res.body.data.security.allowedDetectionsPerHour).toBe(25);
      expect(res.body.data.storage.cdnBaseUrl).toBe('https://cdn.virtualherbalgarden.org');

      // Verify audit log creation
      const logs = await AuditLog.find({ action: 'CONFIG_CHANGE' });
      expect(logs.length).toBeGreaterThan(0);
    });

    it('accepts senderEmail formatted as RFC 5322 mailbox (Name <email@domain.com>) and empty strings without 400 validation error', async () => {
      const payload = {
        ai: {
          model: 'gemini-3.8-flash',
        },
        email: {
          senderName: 'Virtual Herbal Garden',
          senderEmail: 'Virtual Herbal Garden <aniket.kr2103@gmail.com>',
        },
        general: {
          supportEmail: '',
        },
      };

      const res = await request(app)
        .patch('/api/v1/system/config')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ai.model).toBe('gemini-3.8-flash');
    });
  });

  describe('POST /api/v1/system/config/test-ai', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).post('/api/v1/system/config/test-ai');
      expect(res.status).toBe(401);
    });

    it('rejects non-SUPER_ADMIN with 403', async () => {
      const res = await request(app)
        .post('/api/v1/system/config/test-ai')
        .set('Authorization', `Bearer ${regularToken}`);
      expect(res.status).toBe(403);
    });

    it('returns AI connectivity status and latency for SUPER_ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/system/config/test-ai')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ model: 'gemini-3.5-flash' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBeDefined();
      expect(typeof res.body.data.latencyMs).toBe('number');
    });
  });

  describe('Host Environment Configuration & Sync (/api/v1/system/config/sync-env)', () => {
    it('GET /api/v1/system/config includes envDefaults with server GEMINI_MODEL', async () => {
      const res = await request(app)
        .get('/api/v1/system/config')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.envDefaults).toBeDefined();
      expect(res.body.data.envDefaults.geminiModel).toBeDefined();
    });

    it('auto-upgrades deprecated gemini-2.5-flash to env.GEMINI_MODEL in getSystemConfig', async () => {
      // Seed an existing outdated config with gemini-2.5-flash
      await SystemConfig.create({
        _id: 'global',
        ai: {
          model: 'gemini-2.5-flash',
          endpoint: 'generativelanguage.googleapis.com',
          temperature: 0.3,
          maxTokens: 2048,
          confidenceThreshold: 75,
          fallbackModel: 'gemini-1.5-flash',
        },
      });

      const res = await request(app)
        .get('/api/v1/system/config')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      // Should not remain the deprecated gemini-2.5-flash
      expect(res.body.data.ai.model).not.toBe('gemini-2.5-flash');
    });

    it('POST /api/v1/system/config/sync-env syncs database settings to server environment', async () => {
      // First update DB to custom values
      await request(app)
        .patch('/api/v1/system/config')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ai: { model: 'custom-model-test' },
          security: { allowedDetectionsPerHour: 99 },
        });

      // Now call sync-env
      const res = await request(app)
        .post('/api/v1/system/config/sync-env')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ai.model).not.toBe('custom-model-test');

      const logs = await AuditLog.find({ action: 'CONFIG_CHANGE' });
      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
