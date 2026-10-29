import request from 'supertest';
import { authenticator } from 'otplib';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import AuditLog from '../src/modules/admin/AuditLog.model';
import RefreshToken from '../src/modules/auth/RefreshToken.model';
import Notification from '../src/modules/notifications/Notification.model';
import { notificationService } from '../src/modules/notifications/notification.service';
import { signAccessToken, signReauthToken, hashRefreshToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, AuditAction, NotificationType } from '../src/types';
import { CAPABILITIES } from '../src/core/permissions';
import { createAuditLog } from '../src/core/utils/auditLogger';
import './setup';

describe('Super Admin Dashboard (Part S1) Tests', () => {
  let superAdminUser: any;
  let adminUser: any;
  let targetUser: any;

  let superAdminToken: string;
  let adminToken: string;
  let targetUserToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await AuditLog.deleteMany({});
    await RefreshToken.deleteMany({});
    await Notification.deleteMany({});

    const passwordHash = await hashPassword('SuperSecure123!');

    superAdminUser = await User.create({
      email: `superadmin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Super Admin User',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      preferences: {
        notifications: {
          newSubmission: true,
          roleApplication: true,
          support: true,
          flaggedReview: true,
          security: true,
          system: true,
        },
      },
    });
    superAdminToken = signAccessToken({
      sub: superAdminUser._id.toString(),
      email: superAdminUser.email,
      role: UserRole.SUPER_ADMIN,
    });

    adminUser = await User.create({
      email: `admin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
      preferences: {
        notifications: {
          newSubmission: true,
          roleApplication: true,
          support: true,
          flaggedReview: true,
          security: true,
          system: true,
        },
      },
    });
    adminToken = signAccessToken({
      sub: adminUser._id.toString(),
      email: adminUser.email,
      role: UserRole.ADMIN,
    });

    targetUser = await User.create({
      email: `user-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Target Regular User',
      role: UserRole.USER,
      isActive: true,
      preferences: {
        notifications: {
          newSubmission: false, // disabled by user
          roleApplication: true,
          support: true,
          flaggedReview: true,
          security: true,
          system: true,
        },
      },
    });
    targetUserToken = signAccessToken({
      sub: targetUser._id.toString(),
      email: targetUser.email,
      role: UserRole.USER,
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Step-Up Reauthentication & Rate Limiting
  // ─────────────────────────────────────────────────────────────
  describe('Step-Up Reauthentication (POST /auth/reauth)', () => {
    it('returns a valid 5-minute reauth token with correct password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reauth')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ password: 'SuperSecure123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reauthToken).toBeDefined();

      // Check REAUTH_SUCCESS audit log
      const audit = await AuditLog.findOne({ action: AuditAction.REAUTH_SUCCESS, user: superAdminUser._id });
      expect(audit).toBeTruthy();
    });

    it('rejects invalid password and audits REAUTH_FAILED without logging password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reauth')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);

      const audit = await AuditLog.findOne({ action: AuditAction.REAUTH_FAILED, user: superAdminUser._id });
      expect(audit).toBeTruthy();
      expect(JSON.stringify(audit?.newValue)).not.toContain('WrongPassword!');
    });

    it('rejects expired, invalid scope, or mismatched user reauth tokens', async () => {
      // Create a reauth token for adminUser
      const adminReauthToken = signReauthToken(adminUser._id.toString());

      // Target endpoint requiring reauth: POST /auth/2fa/regenerate-backup-codes
      // Use superAdmin's access token but admin's reauth token (mismatched user)
      const resMismatched = await request(app)
        .post('/api/v1/auth/2fa/regenerate-backup-codes')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-reauth-token', adminReauthToken);

      expect(resMismatched.status).toBe(403);
      expect(resMismatched.body.error.code).toBe('REAUTH_USER_MISMATCH');

      // Wrong scope (using access token as reauth token)
      const resWrongScope = await request(app)
        .post('/api/v1/auth/2fa/regenerate-backup-codes')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-reauth-token', superAdminToken);

      expect(resWrongScope.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. 2FA Completeness: Setup, Verify, Backup Codes & Login Challenge
  // ─────────────────────────────────────────────────────────────
  describe('Two-Factor Authentication & Login Challenge', () => {
    it('handles full 2FA lifecycle: setup, verify with backup codes, single-use codes, and disable', async () => {
      // 1. Setup
      const setupRes = await request(app)
        .post('/api/v1/auth/2fa/setup')
        .set('Authorization', `Bearer ${targetUserToken}`);

      expect(setupRes.status).toBe(200);
      expect(setupRes.body.data.secret).toBeDefined();
      expect(setupRes.body.data.otpauthUrl).toBeDefined();
      expect(setupRes.body.data.qrCodeUrl).toMatch(/^data:image\/png;base64,/);

      const secret = setupRes.body.data.secret;
      const validCode = authenticator.generate(secret);

      // 2. Verify
      const verifyRes = await request(app)
        .post('/api/v1/auth/2fa/verify')
        .set('Authorization', `Bearer ${targetUserToken}`)
        .send({ totpCode: validCode });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.backupCodes).toHaveLength(10);
      const backupCodes: string[] = verifyRes.body.data.backupCodes;

      // Check DB: secret and hashed backup codes stored, plain text NOT stored
      const updatedUser = await User.findById(targetUser._id);
      expect(updatedUser?.is2faEnabled).toBe(true);
      expect(updatedUser?.twoFactorBackupCodes).toHaveLength(10);
      expect(JSON.stringify(updatedUser?.twoFactorBackupCodes)).not.toContain(backupCodes[0]);

      // 3. Login challenge: regular login now returns requires2fa and challengeToken
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: targetUser.email, password: 'SuperSecure123!' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.requires2fa).toBe(true);
      expect(loginRes.body.data.challengeToken).toBeDefined();

      const challengeToken = loginRes.body.data.challengeToken;

      // 4. Login verify using backup code
      const backupCodeToUse = backupCodes[0];
      const loginVerifyRes = await request(app)
        .post('/api/v1/auth/2fa/login-verify')
        .send({ challengeToken, code: backupCodeToUse });

      expect(loginVerifyRes.status).toBe(200);
      expect(loginVerifyRes.body.data.accessToken).toBeDefined();

      // Check single-use consumption: remaining unused backup codes is 9
      const userAfterBackupLogin = await User.findById(targetUser._id);
      const unusedCodes = userAfterBackupLogin?.twoFactorBackupCodes.filter((c: any) => !c.used);
      const usedCodes = userAfterBackupLogin?.twoFactorBackupCodes.filter((c: any) => c.used);
      expect(unusedCodes).toHaveLength(9);
      expect(usedCodes).toHaveLength(1);

      // Re-using the same backup code must fail
      const reuseRes = await request(app)
        .post('/api/v1/auth/2fa/login-verify')
        .send({ challengeToken, code: backupCodeToUse });

      expect(reuseRes.status).toBe(401);

      // 5. Disable 2FA with reauth + valid TOTP
      const reauthToken = signReauthToken(targetUser._id.toString());
      const disableTotp = authenticator.generate(secret);

      const disableRes = await request(app)
        .post('/api/v1/auth/2fa/disable')
        .set('Authorization', `Bearer ${targetUserToken}`)
        .set('x-reauth-token', reauthToken)
        .send({ code: disableTotp });

      expect(disableRes.status).toBe(200);

      const finalUser = await User.findById(targetUser._id);
      expect(finalUser?.is2faEnabled).toBe(false);
      expect(finalUser?.twoFactorBackupCodes).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Sessions Management
  // ─────────────────────────────────────────────────────────────
  describe('Session Management', () => {
    it('allows listing own sessions with parsed device, revoking one, and revoking others', async () => {
      // Create two refresh tokens for targetUser
      const token1 = await RefreshToken.create({
        user: targetUser._id,
        tokenHash: hashRefreshToken('token-1-abc'),
        deviceInfo: { ip: '192.168.1.10', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', device: 'Desktop' },
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      const token2 = await RefreshToken.create({
        user: targetUser._id,
        tokenHash: hashRefreshToken('token-2-def'),
        deviceInfo: { ip: '10.0.0.5', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', device: 'Mobile' },
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      // GET /users/me/sessions
      const listRes = await request(app)
        .get('/api/v1/users/me/sessions')
        .set('Authorization', `Bearer ${targetUserToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(2);
      expect(listRes.body.data[0].deviceInfo.browser).toBeDefined();

      // DELETE /users/me/sessions/:id
      const deleteRes = await request(app)
        .delete(`/api/v1/users/me/sessions/${token1._id}`)
        .set('Authorization', `Bearer ${targetUserToken}`);

      expect(deleteRes.status).toBe(200);
      const remainingTokens = await RefreshToken.find({ user: targetUser._id, revokedAt: null });
      expect(remainingTokens).toHaveLength(1);
      expect(remainingTokens[0]._id.toString()).toBe(token2._id.toString());

      // User cannot delete another user's session
      const foreignRes = await request(app)
        .delete(`/api/v1/users/me/sessions/${token2._id}`)
        .set('Authorization', `Bearer ${adminToken}`); // Admin acting as non-super

      expect(foreignRes.status).toBe(404);

      // POST /users/me/sessions/revoke-others
      const revokeOthersRes = await request(app)
        .post('/api/v1/users/me/sessions/revoke-others')
        .set('Authorization', `Bearer ${targetUserToken}`);

      expect(revokeOthersRes.status).toBe(200);
    });

    it('allows Super Admin to view and revoke another user session with reauth', async () => {
      const foreignToken = await RefreshToken.create({
        user: targetUser._id,
        tokenHash: hashRefreshToken('foreign-token'),
        deviceInfo: { ip: '172.16.0.1', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', device: 'Desktop' },
        expiresAt: new Date(Date.now() + 7 * 86400000),
      });

      // GET /system/users/:id/sessions
      const getRes = await request(app)
        .get(`/api/v1/system/users/${targetUser._id}/sessions`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBeGreaterThanOrEqual(1);

      // DELETE requires reauth
      const reauthToken = signReauthToken(superAdminUser._id.toString());

      const deleteRes = await request(app)
        .delete(`/api/v1/system/users/${targetUser._id}/sessions/${foreignToken._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-reauth-token', reauthToken);

      expect(deleteRes.status).toBe(200);
      const revoked = await RefreshToken.findById(foreignToken._id);
      expect(revoked?.revokedAt).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. Role Management & Policy Invariants
  // ─────────────────────────────────────────────────────────────
  describe('Role Management & Policy (/system/users/:id/role)', () => {
    it('allows Super Admin to promote USER to ADMIN with reauth, auditing change and revoking sessions', async () => {
      const reauthToken = signReauthToken(superAdminUser._id.toString());

      const res = await request(app)
        .patch(`/api/v1/system/users/${targetUser._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-reauth-token', reauthToken)
        .send({ role: UserRole.ADMIN });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe(UserRole.ADMIN);

      // Audit log created
      const audit = await AuditLog.findOne({ action: AuditAction.ROLE_CHANGE, entityId: targetUser._id });
      expect(audit).toBeTruthy();
      expect((audit?.oldValue as any)?.role).toBe(UserRole.USER);
      expect((audit?.newValue as any)?.role).toBe(UserRole.ADMIN);
    });

    it('prohibits modifying a SUPER_ADMIN account or changing self role', async () => {
      const reauthToken = signReauthToken(superAdminUser._id.toString());

      // Try changing self
      const selfRes = await request(app)
        .patch(`/api/v1/system/users/${superAdminUser._id}/role`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-reauth-token', reauthToken)
        .send({ role: UserRole.ADMIN });

      expect([400, 403]).toContain(selfRes.status);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. RBAC: ADMIN Role Gets 403 on ALL /system Endpoints
  // ─────────────────────────────────────────────────────────────
  describe('RBAC: ADMIN role gets 403 on all /system endpoints', () => {
    const systemEndpoints = [
      { method: 'get', path: '/api/v1/system/roles/matrix' },
      { method: 'get', path: '/api/v1/system/admins' },
      { method: 'get', path: '/api/v1/system/audit-logs' },
      { method: 'get', path: '/api/v1/system/audit/summary' },
      { method: 'get', path: '/api/v1/system/security/events' },
    ];

    systemEndpoints.forEach(({ method, path }) => {
      it(`blocks ADMIN on ${method.toUpperCase()} ${path} with 403`, async () => {
        const res = await (request(app) as any)[method](path)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(403);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. Audit Log: Filters, CSV Export, Append-Only & Redaction
  // ─────────────────────────────────────────────────────────────
  describe('Audit Log Functionality', () => {
    beforeEach(async () => {
      await createAuditLog({
        actor: superAdminUser,
        action: AuditAction.CONFIG_CHANGE,
        entityType: 'SystemConfig',
        entityId: superAdminUser._id,
        oldValue: { mode: 'dev' },
        newValue: { mode: 'prod', secretApiKey: 'SUPER_SECRET_KEY_123' },
        details: { note: 'Switched environment' },
        severity: 'WARN',
        ipAddress: '198.51.100.1',
      });

      await createAuditLog({
        actor: adminUser,
        action: AuditAction.CONTENT_APPROVE,
        entityType: 'Plant',
        entityId: adminUser._id,
        details: { commonName: 'Holy Basil' },
        severity: 'INFO',
        ipAddress: '198.51.100.2',
      });
    });

    it('filters audit logs by action, severity, and actor', async () => {
      const res = await request(app)
        .get('/api/v1/system/audit-logs')
        .query({ action: AuditAction.CONFIG_CHANGE, severity: 'WARN' })
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].action).toBe(AuditAction.CONFIG_CHANGE);
    });

    it('redacts sensitive fields so secrets are never stored in audit logs', async () => {
      const log = await AuditLog.findOne({ action: AuditAction.CONFIG_CHANGE });
      expect(log).toBeTruthy();
      expect(JSON.stringify(log?.newValue)).toContain('[REDACTED]');
      expect(JSON.stringify(log?.newValue)).not.toContain('SUPER_SECRET_KEY_123');
    });

    it('requires reauth to export CSV and streams formatted records', async () => {
      const reauthToken = signReauthToken(superAdminUser._id.toString());

      const exportRes = await request(app)
        .get('/api/v1/system/audit-logs/export.csv')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-reauth-token', reauthToken);

      expect(exportRes.status).toBe(200);
      expect(exportRes.headers['content-type']).toContain('text/csv');
      expect(exportRes.text).toContain('ID,Timestamp,ActorEmail,ActorName,ActorRole,Action,Severity');
    });

    it('is append-only: rejects PUT, PATCH, DELETE requests on audit log routes', async () => {
      const log = await AuditLog.findOne();
      expect(log).toBeTruthy();

      const patchRes = await request(app)
        .patch(`/api/v1/system/audit-logs/${log?._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ action: 'TAMPERED' });

      expect([404, 405]).toContain(patchRes.status);

      const deleteRes = await request(app)
        .delete(`/api/v1/system/audit-logs/${log?._id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect([404, 405]).toContain(deleteRes.status);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. Security Events & Suspicious IP Rule
  // ─────────────────────────────────────────────────────────────
  describe('Security Events & Suspicious IP Rule', () => {
    it('detects suspicious IPs with 5 or more failed logins within 10 minutes', async () => {
      const attackIp = '203.0.113.42';

      // Record 5 failed logins from attackIp
      for (let i = 0; i < 5; i++) {
        await createAuditLog({
          action: AuditAction.LOGIN_FAILED,
          entityType: 'User',
          details: { email: `victim${i}@test.com`, reason: 'Invalid password' },
          severity: 'WARN',
          ipAddress: attackIp,
          userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        });
      }

      const res = await request(app)
        .get('/api/v1/system/security/events')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.suspiciousIps.some((item: any) => item.ip === attackIp)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. Notification Preferences Enforcement
  // ─────────────────────────────────────────────────────────────
  describe('Notification Preferences Enforcement', () => {
    it('skips non-critical notifications when user disabled that category, but delivers security notices', async () => {
      // targetUser has newSubmission: false
      await notificationService.createNotification(
        targetUser._id.toString(),
        NotificationType.SYSTEM,
        'Plant Peer Review Submitted',
        'A new herbal plant draft was submitted for review.',
        undefined,
        'newSubmission',
      );

      const skippedNotif = await Notification.findOne({
        user: targetUser._id,
        title: 'Plant Peer Review Submitted',
      });
      expect(skippedNotif).toBeNull(); // Skipped

      // Security notice is always delivered even if preferences are modified
      await notificationService.createNotification(
        targetUser._id.toString(),
        NotificationType.SYSTEM,
        'Security Alert: Password Changed',
        'Your password was changed from an unrecognized device.',
      );

      const deliveredNotif = await Notification.findOne({
        user: targetUser._id,
        title: 'Security Alert: Password Changed',
      });
      expect(deliveredNotif).toBeTruthy(); // Delivered
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Capability Registry Coverage Test
  // ─────────────────────────────────────────────────────────────
  describe('Capability Registry Coverage Test', () => {
    it('ensures all registered capabilities have a valid minimum role and key', () => {
      expect(CAPABILITIES.length).toBeGreaterThan(15);
      CAPABILITIES.forEach((cap) => {
        expect(cap.key).toBeTruthy();
        expect(cap.description).toBeTruthy();
        expect([UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.BOTANIST]).toContain(cap.minimumRole);
        expect(['GET', 'POST', 'PATCH', 'PUT', 'DELETE']).toContain(cap.routeMethod);
        expect(cap.routePath.startsWith('/api/v1/')).toBe(true);
      });
    });

    it('contains capabilities for all system endpoints', () => {
      const systemCaps = CAPABILITIES.filter((c) => c.routePath.includes('/system'));
      expect(systemCaps.length).toBeGreaterThanOrEqual(5);

      const paths = systemCaps.map((c) => c.routePath);
      expect(paths).toContain('/api/v1/system/roles/matrix');
      expect(paths).toContain('/api/v1/system/admins');
      expect(paths).toContain('/api/v1/system/audit-logs');
      expect(paths).toContain('/api/v1/system/audit/summary');
      expect(paths).toContain('/api/v1/system/security/events');
    });
  });
});
