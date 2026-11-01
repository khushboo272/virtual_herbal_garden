import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import Plant from '../src/modules/library/Plant.model';
import FeatureFlag from '../src/modules/system/FeatureFlag.model';
import { signAccessToken, signReauthToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole } from '../src/types';
import './setup';

describe('Storage Manager (R2) TDD Suite', () => {
  let adminUser: any;
  let adminToken: string;
  let superAdminUser: any;
  let superAdminToken: string;
  let regularUser: any;
  let regularToken: string;
  let validReauthToken: string;

  beforeEach(async () => {
    await User.deleteMany({});
    await Plant.deleteMany({});
    await FeatureFlag.deleteMany({});

    // Enable storage_manager feature flag
    await FeatureFlag.create({
      key: 'storage_manager',
      name: 'Storage Manager',
      category: 'SYSTEM',
      isEnabled: true,
      minimumRole: UserRole.ADMIN,
      isSystem: true,
    });

    const passwordHash = await hashPassword('TestPass123!');

    adminUser = await User.create({
      email: `admin-${Date.now()}@example.com`,
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

    superAdminUser = await User.create({
      email: `superadmin-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Super Admin User',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
    superAdminToken = signAccessToken({
      sub: superAdminUser._id.toString(),
      email: superAdminUser.email,
      role: UserRole.SUPER_ADMIN,
    });
    validReauthToken = signReauthToken(superAdminUser._id.toString());

    regularUser = await User.create({
      email: `user-${Date.now()}@example.com`,
      passwordHash,
      displayName: 'Regular User',
      role: UserRole.USER,
      isActive: true,
    });
    regularToken = signAccessToken({
      sub: regularUser._id.toString(),
      email: regularUser.email,
      role: UserRole.USER,
    });
  });

  describe('Security & Input Validation Units', () => {
    it('normalizes keys and rejects path traversal, backslashes and overlong keys', async () => {
      const { normalizeKey, assertKeySafe } = await import(
        '../src/modules/storage-manager/storage.security'
      );

      expect(normalizeKey('plants/tulsi/hero.webp')).toBe('plants/tulsi/hero.webp');
      expect(normalizeKey('/plants/tulsi/hero.webp')).toBe('plants/tulsi/hero.webp');

      expect(() => assertKeySafe('../secret.env')).toThrow(/path traversal|illegal/i);
      expect(() => assertKeySafe('plants/..//bad.png')).toThrow(/path traversal|illegal/i);
      expect(() => assertKeySafe('plants\\tulsi\\hero.webp')).toThrow(/backslash|illegal/i);
      expect(() => assertKeySafe('a'.repeat(513))).toThrow(/too long|512/i);
    });

    it('enforces prefix write allowlist and blocks backups/ for non-superadmin', async () => {
      const { assertPrefixWriteAllowed } = await import(
        '../src/modules/storage-manager/storage.security'
      );

      // Allowed for admin
      expect(() => assertPrefixWriteAllowed('plants/tulsi/hero.webp', UserRole.ADMIN)).not.toThrow();
      expect(() => assertPrefixWriteAllowed('models/tulsi.glb', UserRole.ADMIN)).not.toThrow();
      expect(() => assertPrefixWriteAllowed('remedies/cough-syrup/cover.webp', UserRole.ADMIN)).not.toThrow();

      // backups/ is strictly read-only for admin
      expect(() => assertPrefixWriteAllowed('backups/snapshot.json.gz', UserRole.ADMIN)).toThrow(
        /read-only|super_admin/i
      );

      // backups/ is allowed for superadmin
      expect(() =>
        assertPrefixWriteAllowed('backups/snapshot.json.gz', UserRole.SUPER_ADMIN)
      ).not.toThrow();

      // unknown prefix blocked
      expect(() => assertPrefixWriteAllowed('system_root/danger.sh', UserRole.SUPER_ADMIN)).toThrow(
        /prefix allowlist/i
      );
    });

    it('detects magic bytes and blocks disguised executables/html', async () => {
      const { sniffAndValidateMagicBytes } = await import(
        '../src/modules/storage-manager/storage.security'
      );

      const glbHeader = Buffer.from('glTF\x02\x00\x00\x00');
      expect(sniffAndValidateMagicBytes(glbHeader, 'model/gltf-binary')).toBe('model/gltf-binary');

      const pngHeader = Buffer.from('\x89PNG\r\n\x1a\n');
      expect(sniffAndValidateMagicBytes(pngHeader, 'image/png')).toBe('image/png');

      const exeHeader = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
      expect(() => sniffAndValidateMagicBytes(exeHeader, 'image/png')).toThrow(
        /executable|disallowed|magic/i
      );

      const htmlHeader = Buffer.from('<html><script>alert(1)</script></html>');
      expect(() => sniffAndValidateMagicBytes(htmlHeader, 'image/png')).toThrow(
        /html|script|disallowed/i
      );
    });
  });

  describe('Storage API Endpoints', () => {
    it('blocks unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/admin/storage/list');
      expect(res.status).toBe(401);
    });

    it('blocks regular users with 403', async () => {
      const res = await request(app)
        .get('/api/admin/storage/list')
        .set('Authorization', `Bearer ${regularToken}`);
      expect(res.status).toBe(403);
    });

    it('allows ADMIN to list storage objects and bucket summary', async () => {
      const res = await request(app)
        .get('/api/admin/storage/list?prefix=plants/')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(Array.isArray(res.body.data.folders)).toBe(true);
    });

    it('presigns direct upload for valid key and MIME type', async () => {
      const res = await request(app)
        .post('/api/admin/storage/presign-upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'plants/tulsi/hero.webp',
          contentType: 'image/webp',
          sizeBytes: 10240,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.publicUrl).toContain('plants/tulsi/hero.webp');
    });

    it('moves deleted file to trash when deleted by ADMIN', async () => {
      const res = await request(app)
        .post('/api/admin/storage/delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'plants/test-plant/hero.webp',
          permanent: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.action).toBe('TRASHED');
      expect(res.body.data.trashKey).toMatch(/^trash\/\d{8}\/plants\/test-plant\/hero\.webp/);
    });

    it('requires SUPER_ADMIN and reauth token for permanent deletion', async () => {
      // Admin attempted permanent delete is blocked
      const adminRes = await request(app)
        .post('/api/admin/storage/delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'plants/test-plant/hero.webp',
          permanent: true,
        });
      expect(adminRes.status).toBe(403);

      // SuperAdmin without reauth token is blocked with 403 REAUTH_REQUIRED
      const superNoReauth = await request(app)
        .post('/api/admin/storage/delete')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          key: 'plants/test-plant/hero.webp',
          permanent: true,
        });
      expect(superNoReauth.status).toBe(403);

      // SuperAdmin with valid reauth token succeeds
      const superWithReauth = await request(app)
        .post('/api/admin/storage/delete')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('X-Reauth-Token', validReauthToken)
        .send({
          key: 'plants/test-plant/hero.webp',
          permanent: true,
        });
      expect(superWithReauth.status).toBe(200);
      expect(superWithReauth.body.data.action).toBe('PERMANENTLY_DELETED');
    });

    it('identifies orphans and broken links in sync-check', async () => {
      await Plant.create({
        commonName: 'Orphan Checker Plant',
        scientificName: 'Orphanus botanicus',
        slug: 'orphan-plant',
        family: 'Flora',
        description: 'Plant referencing a non-existent image in R2',
        medicinalUses: ['testing'],
        toxicityLevel: 'NONE',
        regionNative: ['India'],
        images: [
          {
            url: 'https://cdn.virtualherbalgarden.org/plants/orphan-plant/non-existent.webp',
            isPrimary: true,
            type: 'main',
          },
        ],
        model3dUrl: 'https://cdn.virtualherbalgarden.org/models/missing-model.glb',
        isPublished: true,
        createdBy: adminUser._id,
      });

      const res = await request(app)
        .get('/api/admin/storage/sync-check')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.brokenLinks)).toBe(true);
      expect(Array.isArray(res.body.data.orphans)).toBe(true);
    });

    it('maps uploaded storage item to database with stable link', async () => {
      const plant = await Plant.create({
        commonName: 'Holy Basil',
        scientificName: 'Ocimum sanctum',
        slug: 'tulsi',
        family: 'Lamiaceae',
        description: 'Sacred medicinal plant',
        medicinalUses: ['Respiratory health'],
        toxicityLevel: 'NONE',
        regionNative: ['India'],
        images: [],
        isPublished: true,
        createdBy: adminUser._id,
      });

      // 1. Map 3D Model
      const modelRes = await request(app)
        .post('/api/admin/storage/map-to-db')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'plants/models/tulsi.glb',
        });

      expect(modelRes.status).toBe(200);
      expect(modelRes.body.success).toBe(true);
      expect(modelRes.body.data.model3dUrl).toContain('plants/models/tulsi.glb');

      // 2. Map Plant Image
      const imageRes = await request(app)
        .post('/api/admin/storage/map-to-db')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          key: 'plants/images/tulsi.webp',
        });

      expect(imageRes.status).toBe(200);
      expect(imageRes.body.success).toBe(true);

      const updatedPlant = await Plant.findById(plant._id);
      expect(updatedPlant?.model3dUrl).toContain('plants/models/tulsi.glb');
      expect(updatedPlant?.images[0].url).toContain('plants/images/tulsi.webp');
    });
  });
});
