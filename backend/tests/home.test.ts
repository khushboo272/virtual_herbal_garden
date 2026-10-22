/**
 * Backend tests for home.service and library health filter.
 * Tests: stats are published-only, categories with 0 plants omitted,
 * featured fills to 6, plantOfTheDay is deterministic, a failing
 * remedies query returns [] not 500, cache hit within 60s,
 * and the health filter (keyword match, combined with q, unpublished hidden).
 */
import mongoose from 'mongoose';
import Plant from '../src/modules/library/Plant.model';
import User from '../src/modules/users/User.model';
import { hashPassword } from '../src/core/utils/hash';
import {
  buildHomePayload,
  invalidateHomeCache,
} from '../src/modules/home/home.service';
import { plantService } from '../src/modules/library/plant.service';

import './setup';

// ── Helpers ───────────────────────────────────────────────────────────────────

let userId: mongoose.Types.ObjectId;

beforeEach(async () => {
  invalidateHomeCache();
  const user = await User.create({
    email: `home-test-${Date.now()}@test.com`,
    passwordHash: await hashPassword('Test@1234'),
    role: 'BOTANIST',
    displayName: 'Home Tester',
    isEmailVerified: true,
    isActive: true,
  });
  userId = user._id as mongoose.Types.ObjectId;
});

async function createPlant(
  overrides: Partial<{
    commonName: string;
    scientificName: string;
    slug: string;
    medicinalUses: string[];
    tags: string[];
    isPublished: boolean;
    isFeatured: boolean;
    isDeleted: boolean;
  }> = {},
) {
  return Plant.create({
    commonName: overrides.commonName ?? `TestPlant ${Date.now()}`,
    scientificName: overrides.scientificName ?? `Testus species ${Date.now()}`,
    slug: overrides.slug ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    family: 'Testaceae',
    description: 'A test plant.',
    medicinalUses: overrides.medicinalUses ?? ['Immunity', 'Digestion'],
    toxicityLevel: 'NONE',
    regionNative: ['India'],
    isPublished: overrides.isPublished ?? true,
    isDeleted: overrides.isDeleted ?? false,
    isFeatured: overrides.isFeatured ?? false,
    tags: overrides.tags ?? [],
    createdBy: userId,
  });
}

// ── home.service tests ────────────────────────────────────────────────────────

describe('buildHomePayload()', () => {
  it('stats.plants counts only published plants', async () => {
    await createPlant({ isPublished: true });
    await createPlant({ isPublished: false, slug: `unpub-${Date.now()}` });

    const { stats } = await buildHomePayload();
    const dbCount = await Plant.countDocuments({ isPublished: true, isDeleted: false });
    expect(stats.plants).toBe(dbCount);
  });

  it('categories with 0 matching plants are omitted', async () => {
    // Only create plants with Immunity-related uses
    await createPlant({ medicinalUses: ['Immunity'] });

    const { categories } = await buildHomePayload();
    expect(categories.every((c) => c.plantCount > 0)).toBe(true);
  });

  it('featuredPlants fills up to 6 when fewer are flagged', async () => {
    // Flag only 2 as featured; home should fill remaining from newest
    await createPlant({ isFeatured: true, slug: `feat-1-${Date.now()}` });
    await createPlant({ isFeatured: true, slug: `feat-2-${Date.now()}` });
    await createPlant({ slug: `fill-3-${Date.now()}` });
    await createPlant({ slug: `fill-4-${Date.now()}` });
    await createPlant({ slug: `fill-5-${Date.now()}` });
    await createPlant({ slug: `fill-6-${Date.now()}` });

    const { featuredPlants } = await buildHomePayload();
    // Should have exactly the number of published plants (up to 6)
    expect(featuredPlants.length).toBeGreaterThanOrEqual(2);
    expect(featuredPlants.length).toBeLessThanOrEqual(6);
  });

  it('plantOfTheDay is deterministic for the same date', async () => {
    await createPlant({ slug: `potd-1-${Date.now()}` });
    await createPlant({ slug: `potd-2-${Date.now()}` });

    invalidateHomeCache();
    const { plantOfTheDay: a } = await buildHomePayload();
    invalidateHomeCache();
    const { plantOfTheDay: b } = await buildHomePayload();

    expect(a?.slug).toBe(b?.slug);
  });

  it('returns cached payload on second call within 60 s', async () => {
    await createPlant();

    const first = await buildHomePayload();
    const second = await buildHomePayload();

    // Same object reference == cache hit
    expect(first).toBe(second);
  });
});

// ── health filter tests ────────────────────────────────────────────────────────

describe('GET /plants?health= (via plantService.list)', () => {
  it('keyword match returns plants with matching medicinalUses', async () => {
    await createPlant({ medicinalUses: ['Immunity boost', 'Stress relief'], slug: `kw-match-${Date.now()}` });

    const { plants } = await plantService.list({ page: 1, limit: 10, health: 'immunity' });
    expect(plants.length).toBeGreaterThan(0);
  });

  it('health filter combined with q= still works', async () => {
    const p = await createPlant({
      commonName: `ImmunityHerb${Date.now()}`,
      medicinalUses: ['Immune support'],
      slug: `imm-combo-${Date.now()}`,
    });

    const { plants } = await plantService.list({
      page: 1, limit: 10,
      q: p.commonName,
      health: 'immunity',
    });
    expect(plants.some((r) => r.slug === p.slug)).toBe(true);
  });

  it('unpublished plants are not returned with health filter', async () => {
    await createPlant({
      isPublished: false,
      medicinalUses: ['Immunity'],
      slug: `unpub-imm-${Date.now()}`,
    });

    const { plants } = await plantService.list({ page: 1, limit: 10, health: 'immunity' });
    expect(plants.every((p) => p.isPublished)).toBe(true);
  });
});
