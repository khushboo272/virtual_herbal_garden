import request from 'supertest';
import app from '../src/app';
import User from '../src/modules/users/User.model';
import Plant from '../src/modules/library/Plant.model';
import { signAccessToken } from '../src/core/utils/jwt';
import { hashPassword } from '../src/core/utils/hash';
import { UserRole, ContentStatus } from '../src/types';
import './setup';

describe('Plant 3D Viewer Backend Endpoints Suite', () => {
  let botanistUser: any;
  let botanistToken: string;
  let regularUser: any;
  let regularToken: string;
  let plant: any;

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

    plant = await Plant.create({
      commonName: 'Holy Basil (Tulsi)',
      scientificName: 'Ocimum tenuiflorum',
      slug: 'tulsi',
      family: 'Lamiaceae',
      description: 'Sacred medicinal plant.',
      medicinalUses: ['Respiratory relief', 'Adaptogenic balance'],
      partsUsed: ['leaves', 'seeds'],
      toxicityLevel: 'NONE',
      status: ContentStatus.PUBLISHED,
      isPublished: true,
      owner: botanistUser._id,
      createdBy: botanistUser._id,
      model3dUrl: 'https://cdn.example.com/plants/models/tulsi.glb',
    });
  });

  describe('GET /api/v1/plants/:slug/viewer', () => {
    it('returns 3D viewer configuration, model URLs, and caches response with max-age=60', async () => {
      const res = await request(app)
        .get('/api/v1/plants/tulsi/viewer')
        .expect(200);

      expect(res.headers['cache-control']).toMatch(/max-age=60/);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('tulsi');
      expect(res.body.data.commonName).toBe('Holy Basil (Tulsi)');
      expect(res.body.data.model3dUrl).toBe('https://cdn.example.com/plants/models/tulsi.glb');
      expect(res.body.data.partsUsed).toContain('leaves');
    });

    it('returns 404 for unknown plant slug', async () => {
      await request(app)
        .get('/api/v1/plants/non-existent-specimen/viewer')
        .expect(404);
    });
  });

  describe('PUT /api/v1/plants/:id/viewer-config', () => {
    it('blocks unauthenticated requests with 401', async () => {
      await request(app)
        .put(`/api/v1/plants/${plant._id}/viewer-config`)
        .send({
          viewerDefaults: { lightingPreset: 'greenhouse' },
        })
        .expect(401);
    });

    it('blocks regular users with 403', async () => {
      await request(app)
        .put(`/api/v1/plants/${plant._id}/viewer-config`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          viewerDefaults: { lightingPreset: 'greenhouse' },
        })
        .expect(403);
    });

    it('allows botanist to update hotspots, story steps, and viewer defaults', async () => {
      const payload = {
        hotspots: [
          {
            part: 'leaves',
            label: 'Essential Oil Glands',
            position: [0.1, 0.4, 0.15],
            description: 'Contains eugenol, responsible for antimicrobial action.',
          },
        ],
        story: [
          {
            step: 1,
            title: 'Sacred Inflorescence',
            description: 'Observe the purple terminal racemes containing small aromatic blossoms.',
            partFocus: 'flowers',
          },
        ],
        viewerDefaults: {
          lightingPreset: 'greenhouse',
          backgroundPreset: 'sky',
          defaultView: 'front',
        },
      };

      const res = await request(app)
        .put(`/api/v1/plants/${plant._id}/viewer-config`)
        .set('Authorization', `Bearer ${botanistToken}`)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.hotspots).toHaveLength(1);
      expect(res.body.data.hotspots[0].label).toBe('Essential Oil Glands');
      expect(res.body.data.story).toHaveLength(1);
      expect(res.body.data.viewerDefaults.lightingPreset).toBe('greenhouse');

      // Verify database update
      const updatedPlant = await Plant.findById(plant._id);
      expect(updatedPlant?.hotspots?.[0]?.label).toBe('Essential Oil Glands');
      expect(updatedPlant?.viewerDefaults?.lightingPreset).toBe('greenhouse');
    });
  });
});

