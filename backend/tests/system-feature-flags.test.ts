import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import AuditLog from '../src/modules/admin/AuditLog.model';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole } from '../src/types';
import './setup';

describe('Super Admin Feature Flags Management Tests', () => {
  let superAdminUser: any;
  let regularUser: any;
  let superAdminToken: string;
  let regularToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});

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

  describe('GET /api/v1/system/feature-flags', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/system/feature-flags');
      expect(res.status).toBe(401);
    });

    it('rejects non-SUPER_ADMIN users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/system/feature-flags')
        .set('Authorization', `Bearer ${regularToken}`);
      expect(res.status).toBe(403);
    });

    it('returns full list of feature flags with default system flags for SUPER_ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/system/feature-flags')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.flags)).toBe(true);
      expect(res.body.data.flags.length).toBeGreaterThanOrEqual(5);

      const flag3d = res.body.data.flags.find((f: any) => f.key === '3d_garden');
      expect(flag3d).toBeDefined();
      expect(flag3d.name).toBe('3D Virtual Garden');
      expect(typeof flag3d.isEnabled).toBe('boolean');
      expect(flag3d.isSystem).toBe(true);

      const maintenanceFlag = res.body.data.flags.find((f: any) => f.key === 'maintenance_mode');
      expect(maintenanceFlag).toBeDefined();
      expect(maintenanceFlag.isEnabled).toBe(false);
      expect(maintenanceFlag.isSystem).toBe(true);

      expect(res.body.data.summary).toBeDefined();
      expect(typeof res.body.data.summary.total).toBe('number');
      expect(typeof res.body.data.summary.enabledCount).toBe('number');
    });
  });

  describe('PATCH /api/v1/system/feature-flags/:key', () => {
    it('toggles flag state, updates rollout percentage and creates audit log', async () => {
      // First ensure flags are loaded
      await request(app)
        .get('/api/v1/system/feature-flags')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const updateRes = await request(app)
        .patch('/api/v1/system/feature-flags/3d_garden')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          isEnabled: false,
          rolloutPercentage: 50,
          minimumRole: UserRole.BOTANIST,
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.key).toBe('3d_garden');
      expect(updateRes.body.data.isEnabled).toBe(false);
      expect(updateRes.body.data.rolloutPercentage).toBe(50);
      expect(updateRes.body.data.minimumRole).toBe(UserRole.BOTANIST);

      // Verify audit log entry
      const log = await AuditLog.findOne({ entityType: 'FEATURE_FLAG' });
      expect(log).toBeDefined();
      expect(log?.user?.toString()).toBe(superAdminUser._id.toString());
    });
  });

  describe('POST /api/v1/system/feature-flags (Create Custom Flag)', () => {
    it('creates a custom feature flag with valid schema', async () => {
      const res = await request(app)
        .post('/api/v1/system/feature-flags')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: 'seasonal_harvest_tracker',
          name: 'Seasonal Harvest Tracker',
          description: 'Calendar for Ayurvedic herb harvesting cycles',
          category: 'COMMUNITY',
          isEnabled: true,
          rolloutPercentage: 100,
          minimumRole: UserRole.USER,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.key).toBe('seasonal_harvest_tracker');
      expect(res.body.data.isSystem).toBe(false);

      // Rejects duplicate key
      const dupRes = await request(app)
        .post('/api/v1/system/feature-flags')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: 'seasonal_harvest_tracker',
          name: 'Duplicate Harvest Tracker',
          category: 'COMMUNITY',
        });
      expect(dupRes.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/system/feature-flags/:key', () => {
    it('deletes custom flag but protects system flags from deletion', async () => {
      // 1. Try deleting system flag -> 400
      const sysDeleteRes = await request(app)
        .delete('/api/v1/system/feature-flags/3d_garden')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(sysDeleteRes.status).toBe(400);
      expect(sysDeleteRes.body.error.message).toMatch(/cannot delete system feature flag/i);

      // 2. Create custom flag
      await request(app)
        .post('/api/v1/system/feature-flags')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: 'temporary_beta_quiz',
          name: 'Temporary Beta Quiz',
          category: 'EXPERIMENTAL',
          isEnabled: false,
        });

      // 3. Delete custom flag -> 200
      const customDeleteRes = await request(app)
        .delete('/api/v1/system/feature-flags/temporary_beta_quiz')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(customDeleteRes.status).toBe(200);
      expect(customDeleteRes.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/system/feature-flags/reset', () => {
    it('resets feature flags back to platform defaults', async () => {
      // Modify a system flag
      await request(app)
        .patch('/api/v1/system/feature-flags/maintenance_mode')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isEnabled: true });

      // Reset
      const resetRes = await request(app)
        .post('/api/v1/system/feature-flags/reset')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      const flagsRes = await request(app)
        .get('/api/v1/system/feature-flags')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const maintenance = flagsRes.body.data.flags.find((f: any) => f.key === 'maintenance_mode');
      expect(maintenance.isEnabled).toBe(false);
    });
  });

  describe('Public Feature Flags & Runtime Feature Enforcement', () => {
    it('GET /api/v1/system/flags/public returns key-boolean map to unauthenticated clients', async () => {
      const res = await request(app).get('/api/v1/system/flags/public');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data).toBe('object');
      expect(typeof res.body.data.ai_scanner).toBe('boolean');
      expect(typeof res.body.data['3d_garden']).toBe('boolean');
    });

    it('blocks /api/v1/ai/detect with 403 FEATURE_DISABLED when ai_scanner is disabled', async () => {
      // Disable ai_scanner flag
      const patchRes = await request(app)
        .patch('/api/v1/system/feature-flags/ai_scanner')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isEnabled: false });
      expect(patchRes.status).toBe(200);

      // Normal user tries to scan
      const scanRes = await request(app)
        .post('/api/v1/ai/detect')
        .set('Authorization', `Bearer ${regularToken}`)
        .send();

      expect(scanRes.status).toBe(403);
      expect(scanRes.body.success).toBe(false);
      expect(scanRes.body.error.code).toBe('FEATURE_DISABLED');
      expect(scanRes.body.error.message).toMatch(/AI Plant Scanner.*disabled/i);
    });

    it('blocks /api/v1/auth/register with 403 FEATURE_DISABLED when new_user_registration is disabled', async () => {
      const patchRes = await request(app)
        .patch('/api/v1/system/feature-flags/new_user_registration')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isEnabled: false });
      expect(patchRes.status).toBe(200);

      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          displayName: 'New Member',
        });

      expect(regRes.status).toBe(403);
      expect(regRes.body.success).toBe(false);
      expect(regRes.body.error.code).toBe('FEATURE_DISABLED');
    });

    it('allows SUPER_ADMIN to bypass disabled feature flag for testing', async () => {
      // Ensure ai_scanner is disabled
      await request(app)
        .patch('/api/v1/system/feature-flags/ai_scanner')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ isEnabled: false });

      // Super admin calls /api/v1/ai/detect -> should NOT be blocked by FEATURE_DISABLED
      const scanRes = await request(app)
        .post('/api/v1/ai/detect')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send();

      // Super admin passes the feature guard (it may fail with 400 because no image file was attached, but NOT 403 FEATURE_DISABLED)
      expect(scanRes.status).not.toBe(403);
      expect(scanRes.body?.error?.code).not.toBe('FEATURE_DISABLED');
    });

    it('blocks ADMIN login when maintenance mode allowedRoles is SUPER_ADMIN only', async () => {
      // Create admin user
      const adminUser = await User.create({
        email: `test-admin-${Date.now()}@example.com`,
        passwordHash: await hashPassword('AdminPass123!'),
        displayName: 'Target Admin',
        role: UserRole.ADMIN,
        isActive: true,
      });

      // Enable maintenance mode with allowedRoles = ['SUPER_ADMIN']
      await request(app)
        .patch('/api/v1/system/feature-flags/maintenance_mode')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          isEnabled: true,
          metadata: {
            allowedRoles: ['SUPER_ADMIN'],
            headline: 'Platform Maintenance',
          },
        });

      // Admin tries to login -> 403 MAINTENANCE_MODE_RESTRICTED
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: 'AdminPass123!',
        });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.error.code).toBe('MAINTENANCE_MODE_RESTRICTED');
    });

    it('allows ADMIN login when maintenance mode allowedRoles includes ADMIN', async () => {
      const adminUser = await User.create({
        email: `test-admin-allowed-${Date.now()}@example.com`,
        passwordHash: await hashPassword('AdminPass123!'),
        displayName: 'Allowed Admin',
        role: UserRole.ADMIN,
        isActive: true,
      });

      // Enable maintenance mode with allowedRoles = ['SUPER_ADMIN', 'ADMIN']
      await request(app)
        .patch('/api/v1/system/feature-flags/maintenance_mode')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          isEnabled: true,
          metadata: {
            allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
            headline: 'Platform Maintenance',
          },
        });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: adminUser.email,
          password: 'AdminPass123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
    });
  });
});
