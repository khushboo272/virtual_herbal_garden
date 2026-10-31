import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import Plant, {
  PlantHabit,
  LeafShape,
  ModelStatus,
  deriveVisualDefaults,
} from '../src/modules/library/Plant.model';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, ContentStatus } from '../src/types';
import './setup';

describe('Garden Showcase & 3D Model Pipeline TDD Suite', () => {
  let botanistUser: any;
  let botanistToken: string;
  let adminUser: any;
  let adminToken: string;
  let publishedPlant: any;

  beforeEach(async () => {
    await Plant.deleteMany({});
    await User.deleteMany({});

    const passwordHash = await hashPassword('TestPass123!');
    botanistUser = await User.create({
      email: `botanist-${Date.now()}@example.com`,
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

    publishedPlant = await Plant.create({
      commonName: 'Tulsi',
      scientificName: 'Ocimum tenuiflorum',
      slug: 'tulsi',
      family: 'Lamiaceae',
      description: 'Sacred Ayurvedic plant.',
      shortDescription: 'Immunity and respiratory herb.',
      medicinalUses: ['immunity', 'cough', 'cold'],
      tags: ['adaptogen', 'holy basil'],
      plantType: 'HERB',
      toxicityLevel: 'NONE',
      regionNative: ['India'],
      status: ContentStatus.PUBLISHED,
      isPublished: true,
      createdBy: botanistUser._id,
      modelUrl: 'https://cdn.example.com/models/tulsi.glb',
      modelVersion: 123456789,
      modelStatus: ModelStatus.READY,
      modelTransform: {
        scale: 1,
        rotationY: 0,
        offsetY: 0,
        targetHeightM: 0.6,
      },
      placement3d: {
        position: { x: 0, y: 0, z: 5 },
        scale: 1.0,
      },
    });

    await Plant.create({
      commonName: 'Unpublished Plant',
      scientificName: 'Invisibilia botanica',
      slug: 'unpublished-plant',
      family: 'Mystica',
      description: 'Draft plant details.',
      medicinalUses: ['relaxation'],
      tags: ['draft'],
      status: ContentStatus.DRAFT,
      isPublished: false,
      createdBy: botanistUser._id,
    });
  });

  describe('deriveVisualDefaults', () => {
    it('derives TREE habit and higher stature for trees', () => {
      const visual = deriveVisualDefaults({
        plantType: 'Tree',
        commonName: 'Neem Tree',
        scientificName: 'Azadirachta indica',
      });
      expect(visual.habit).toBe(PlantHabit.TREE);
      expect(visual.heightM).toBeGreaterThanOrEqual(3);
    });

    it('derives SHRUB habit for shrubs', () => {
      const visual = deriveVisualDefaults({
        plantType: 'Shrub',
        commonName: 'Ashwagandha',
      });
      expect(visual.habit).toBe(PlantHabit.SHRUB);
      expect(visual.heightM).toBeGreaterThanOrEqual(0.8);
    });

    it('derives HERB habit by default for herbs', () => {
      const visual = deriveVisualDefaults({
        plantType: 'Herb',
        commonName: 'Tulsi',
      });
      expect(visual.habit).toBe(PlantHabit.HERB);
      expect(visual.heightM).toBeLessThanOrEqual(1.0);
    });

    it('preserves explicitly provided visual attributes', () => {
      const visual = deriveVisualDefaults({
        plantType: 'Tree',
        commonName: 'Custom Plant',
        visual: {
          habit: PlantHabit.SUCCULENT,
          heightM: 0.75,
          foliageColor: '#00ff00',
          leafShape: LeafShape.SPIKY,
        },
      });
      expect(visual.habit).toBe(PlantHabit.SUCCULENT);
      expect(visual.heightM).toBe(0.75);
      expect(visual.foliageColor).toBe('#00ff00');
      expect(visual.leafShape).toBe(LeafShape.SPIKY);
    });
  });

  describe('GET /api/v1/garden/showcase', () => {
    it('returns published plants and excludes unpublished drafts', async () => {
      const res = await request(app).get('/api/v1/garden/showcase');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      const slugs = res.body.data.map((p: any) => p.slug);
      expect(slugs).toContain('tulsi');
      expect(slugs).not.toContain('unpublished-plant');

      const tulsi = res.body.data.find((p: any) => p.slug === 'tulsi');
      expect(tulsi).toMatchObject({
        id: publishedPlant._id.toString(),
        slug: 'tulsi',
        commonName: 'Tulsi',
        scientificName: 'Ocimum tenuiflorum',
        modelUrl: 'https://cdn.example.com/models/tulsi.glb',
        modelVersion: 123456789,
        modelStatus: ModelStatus.READY,
      });

      expect(tulsi.visual).toBeDefined();
      expect(tulsi.visual.habit).toBeDefined();
      expect(Array.isArray(tulsi.healthCategories)).toBe(true);
      expect(tulsi.healthCategories).toContain('immunity');
      expect(tulsi.healthCategories).toContain('respiratory');
    });

    it('returns ETag and Cache-Control headers, and supports 304 Not Modified', async () => {
      const firstRes = await request(app).get('/api/v1/garden/showcase');
      expect(firstRes.status).toBe(200);
      const etag = firstRes.headers['etag'];
      expect(etag).toBeDefined();
      expect(firstRes.headers['cache-control']).toContain('public');

      const secondRes = await request(app)
        .get('/api/v1/garden/showcase')
        .set('If-None-Match', etag);
      expect(secondRes.status).toBe(304);
    });
  });

  describe('POST /api/v1/garden/model-error', () => {
    it('records error reports and marks modelStatus FAILED after 3 distinct IPs within 1 hour', async () => {
      // 1st report from IP 1
      const res1 = await request(app)
        .post('/api/v1/garden/model-error')
        .set('X-Forwarded-For', '198.51.100.1')
        .send({
          plantId: publishedPlant._id.toString(),
          message: 'WebGL Shader Error in GLTF',
        });
      expect(res1.status).toBe(200);
      expect(res1.body.data.modelStatus).toBe(ModelStatus.READY);

      // 2nd report from IP 2
      const res2 = await request(app)
        .post('/api/v1/garden/model-error')
        .set('X-Forwarded-For', '198.51.100.2')
        .send({
          plantId: publishedPlant._id.toString(),
          message: 'Mesh rendering crash',
        });
      expect(res2.status).toBe(200);
      expect(res2.body.data.modelStatus).toBe(ModelStatus.READY);

      // 3rd report from IP 3 triggers FAILED
      const res3 = await request(app)
        .post('/api/v1/garden/model-error')
        .set('X-Forwarded-For', '198.51.100.3')
        .send({
          plantId: publishedPlant._id.toString(),
          message: 'Draco decompression failed',
        });
      expect(res3.status).toBe(200);
      expect(res3.body.data.modelStatus).toBe(ModelStatus.FAILED);

      const updated = await Plant.findById(publishedPlant._id);
      expect(updated!.modelStatus).toBe(ModelStatus.FAILED);
      expect(updated!.lastModelError?.message).toBe('Draco decompression failed');
    });
  });

  describe('Model Upload Pipeline & Magic Bytes Validation', () => {
    it('rejects uploads missing the binary glTF magic bytes ("glTF")', async () => {
      const invalidBuffer = Buffer.from('NOT_A_VALID_GLTF_HEADER_123456');

      const res = await request(app)
        .put(`/api/v1/plants/${publishedPlant._id}/model`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('model', invalidBuffer, 'bad-model.glb');

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/magic bytes|glTF/i);
    });

    it('allows botanist to upload model to their draft plant', async () => {
      const draft = await Plant.create({
        commonName: 'Botanist Draft Plant',
        scientificName: 'Draftus botanicus',
        slug: 'botanist-draft-plant',
        family: 'Flora',
        description: 'Testing botanist upload on draft',
        status: ContentStatus.DRAFT,
        isPublished: false,
        createdBy: botanistUser._id,
        owner: botanistUser._id,
      });

      const gltfMagic = Buffer.from('glTF\x02\x00\x00\x00\x20\x00\x00\x00');
      const payload = Buffer.concat([gltfMagic, Buffer.alloc(50)]);

      const res = await request(app)
        .put(`/api/v1/plants/${draft._id}/model`)
        .set('Authorization', `Bearer ${botanistToken}`)
        .attach('model', payload, 'draft-model.glb');

      expect(res.status).toBe(200);
      const updated = await Plant.findById(draft._id);
      expect(updated!.modelStatus).toBe(ModelStatus.READY);
    });
  });
});
