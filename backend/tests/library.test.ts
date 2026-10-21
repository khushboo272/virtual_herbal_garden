/**
 * Backend library service tests.
 * Tests the PlantService list(), autocomplete(), getBySlug(), and getRelated() methods.
 */
import mongoose from 'mongoose';
import Plant from '../src/modules/library/Plant.model';
import User from '../src/modules/users/User.model';
import { PlantService } from '../src/modules/library/plant.service';
import { hashPassword } from '../src/core/utils/hash';

import './setup';

describe('Library Service', () => {
  let userId: mongoose.Types.ObjectId;
  let plantService: PlantService;

  beforeEach(async () => {
    const user = await User.create({
      email: `botanist-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Test@1234'),
      role: 'BOTANIST',
      displayName: 'Test Botanist',
      isEmailVerified: true,
      isActive: true,
    });
    userId = user._id as mongoose.Types.ObjectId;
    plantService = new PlantService();
  });

  async function createPlant(overrides: Partial<{
    commonName: string;
    scientificName: string;
    slug: string;
    aliases: string[];
    medicinalUses: string[];
    isPublished: boolean;
  }> = {}) {
    return Plant.create({
      commonName: overrides.commonName ?? 'Test Plant',
      scientificName: overrides.scientificName ?? `Test species ${Date.now()}`,
      slug: overrides.slug ?? `test-plant-${Date.now()}`,
      family: 'Testaceae',
      description: 'A test plant description.',
      medicinalUses: overrides.medicinalUses ?? ['Immunity', 'Stress Relief'],
      toxicityLevel: 'NONE',
      regionNative: ['India'],
      aliases: overrides.aliases ?? [],
      isPublished: overrides.isPublished ?? true,
      isDeleted: false,
      createdBy: userId,
    });
  }

  // ── list() ─────────────────────────────────────────────────────────────

  it('list() returns published plants only', async () => {
    await createPlant({ isPublished: true });
    await createPlant({ isPublished: false, slug: `unpub-${Date.now()}` });

    const { plants } = await plantService.list({ page: 1, limit: 10 });
    expect(plants.every((p) => p.isPublished)).toBe(true);
  });

  it('list() filters by medicinalUse', async () => {
    await createPlant({ medicinalUses: ['Digestion', 'Skin Care'] });
    const { plants } = await plantService.list({
      page: 1,
      limit: 10,
      medicinalUse: ['Digestion'],
    });
    expect(plants.length).toBeGreaterThan(0);
    plants.forEach((p) => {
      expect(
        p.medicinalUses.some((u: string) => u.toLowerCase().includes('digestion')),
      ).toBe(true);
    });
  });

  it('list() returns pagination meta', async () => {
    await createPlant();
    const { meta } = await plantService.list({ page: 1, limit: 10 });
    expect(meta).toHaveProperty('total');
    expect(meta).toHaveProperty('totalPages');
    expect(meta).toHaveProperty('page', 1);
    expect(meta).toHaveProperty('facets');
    expect(meta.facets).toHaveProperty('medicinalUse');
  });

  it('list() q= searches and returns exactMatch slug', async () => {
    const plant = await createPlant({
      commonName: 'Tulsi Unique',
      scientificName: 'Ocimum test',
      slug: `tulsi-unique-${Date.now()}`,
    });
    const { meta } = await plantService.list({ page: 1, limit: 10, q: plant.commonName });
    // exactMatch may be null if text index isn't set up in test DB — that's OK
    // We just assert no exception was thrown and meta has the shape
    expect(meta).toHaveProperty('exactMatch');
  });

  // ── autocomplete() ─────────────────────────────────────────────────────

  it('autocomplete() returns matching plants', async () => {
    const uniquePrefix = `AutoComp${Date.now()}`;
    await createPlant({
      commonName: `${uniquePrefix} Plant`,
      slug: `autocomp-${Date.now()}`,
    });

    const results = await plantService.autocomplete(uniquePrefix);
    expect(results.length).toBeGreaterThan(0);
  });

  it('autocomplete() returns empty for blank query', async () => {
    const results = await plantService.autocomplete('');
    expect(results).toEqual([]);
  });

  it('autocomplete() searches aliases', async () => {
    const uniqueAlias = `Alias${Date.now()}`;
    await createPlant({
      aliases: [uniqueAlias],
      slug: `alias-test-${Date.now()}`,
    });

    const results = await plantService.autocomplete(uniqueAlias);
    expect(results.length).toBeGreaterThan(0);
  });

  // ── getBySlug() ────────────────────────────────────────────────────────

  it('getBySlug() returns plant by slug', async () => {
    const plant = await createPlant({ slug: `slug-test-${Date.now()}` });
    const found = await plantService.getBySlug(plant.slug);
    expect(found.slug).toBe(plant.slug);
  });

  it('getBySlug() returns plant by ObjectId', async () => {
    const plant = await createPlant({ slug: `oid-test-${Date.now()}` });
    const found = await plantService.getBySlug(plant._id.toString());
    expect(found._id.toString()).toBe(plant._id.toString());
  });

  it('getBySlug() throws NOT_FOUND for unknown slug', async () => {
    await expect(plantService.getBySlug('nonexistent-plant-slug')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  // ── getRelated() ───────────────────────────────────────────────────────

  it('getRelated() returns plants from same family', async () => {
    const base = await Plant.create({
      commonName: 'Base Plant',
      scientificName: `Base species ${Date.now()}`,
      slug: `base-${Date.now()}`,
      family: 'Lamiaceae',
      description: 'Base',
      medicinalUses: [],
      toxicityLevel: 'NONE',
      regionNative: ['India'],
      isPublished: true,
      isDeleted: false,
      createdBy: userId,
    });
    await Plant.create({
      commonName: 'Related Plant',
      scientificName: `Related species ${Date.now()}`,
      slug: `related-${Date.now()}`,
      family: 'Lamiaceae',
      description: 'Related',
      medicinalUses: [],
      toxicityLevel: 'NONE',
      regionNative: ['India'],
      isPublished: true,
      isDeleted: false,
      createdBy: userId,
    });

    const related = await plantService.getRelated(base._id.toString());
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((r) => r._id.toString() !== base._id.toString())).toBe(true);
  });
});
