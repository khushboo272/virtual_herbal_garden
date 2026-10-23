import mongoose from 'mongoose';
import Remedy from '../src/modules/remedies/Remedy.model';
import Plant from '../src/modules/library/Plant.model';
import User from '../src/modules/users/User.model';
import { hashPassword } from '../src/core/utils/hash';
import { remedyService } from '../src/modules/remedies/remedy.service';
import './setup';

let userId: mongoose.Types.ObjectId;

beforeEach(async () => {
  const user = await User.create({
    email: `remedy-test-${Date.now()}-${Math.random()}@test.com`,
    passwordHash: await hashPassword('Test@1234'),
    role: 'BOTANIST',
    displayName: 'Remedy Tester',
    isEmailVerified: true,
    isActive: true,
  });
  userId = user._id as mongoose.Types.ObjectId;
});

async function createTestPlant(commonName: string, scientificName: string, aliases: string[] = []) {
  return Plant.create({
    commonName,
    scientificName,
    slug: commonName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    family: 'Lamiaceae',
    description: `Description of ${commonName}`,
    medicinalUses: ['Immunity', 'Cold'],
    aliases,
    isPublished: true,
    isDeleted: false,
    createdBy: userId,
  });
}

async function createTestRemedy(overrides: Partial<any> = {}) {
  const slug = overrides.slug ?? `remedy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return Remedy.create({
    title: overrides.title ?? 'Tulsi Ginger Kadha',
    slug,
    description: overrides.description ?? 'A decoction for cold and cough relief.',
    plants: overrides.plants ?? [],
    ingredients: overrides.ingredients ?? [
      { name: 'Tulsi Leaves', quantity: '10', unit: 'leaves', notes: 'Fresh holy basil' },
      { name: 'Crushed Ginger', quantity: '1', unit: 'inch', notes: 'Zingiber officinale' },
    ],
    preparationSteps: overrides.preparationSteps ?? [
      { step: 1, instruction: 'Boil water with herbs', durationMinutes: 10 },
    ],
    dosage: '1 cup twice daily',
    difficulty: overrides.difficulty ?? 'EASY',
    difficultyLevel: overrides.difficultyLevel ?? 'EASY',
    preparationTime: overrides.preparationTime ?? 15,
    prepTimeMinutes: overrides.prepTimeMinutes ?? 15,
    usage: overrides.usage ?? 'INTERNAL',
    contraindications: overrides.contraindications ?? ['Pregnancy in high doses'],
    precautions: overrides.precautions ?? ['Do not boil with honey'],
    traditionalSource: overrides.traditionalSource ?? 'Ayurvedic Pharmacopoeia',
    tags: overrides.tags ?? ['cold', 'respiratory', 'kadha'],
    isPublished: overrides.isPublished ?? true,
    isDeleted: overrides.isDeleted ?? false,
    createdBy: userId,
  });
}

describe('Remedy Service', () => {
  it('should search by title, ingredient and condition/tag', async () => {
    await createTestRemedy({
      title: 'Neem Turmeric Paste',
      tags: ['skin-care', 'acne'],
      ingredients: [{ name: 'Neem Powder', quantity: '1', unit: 'tbsp' }],
    });
    await createTestRemedy({
      title: 'Ashwagandha Moon Milk',
      tags: ['stress-sleep', 'insomnia'],
      ingredients: [{ name: 'Ashwagandha Root', quantity: '1', unit: 'tsp' }],
    });

    // Search by title
    const resTitle = await remedyService.list({ page: 1, limit: 10, q: 'Neem' });
    expect(resTitle.remedies.some((r) => r.title.includes('Neem'))).toBe(true);
    expect(resTitle.remedies.some((r) => r.title.includes('Ashwagandha'))).toBe(false);

    // Search by ingredient
    const resIng = await remedyService.list({ page: 1, limit: 10, q: 'Ashwagandha' });
    expect(resIng.remedies.some((r) => r.title.includes('Ashwagandha'))).toBe(true);

    // Search by tag / condition
    const resTag = await remedyService.list({ page: 1, limit: 10, q: 'acne' });
    expect(resTag.remedies.some((r) => r.title.includes('Neem'))).toBe(true);
  });

  it('should filter by health category using library keywords', async () => {
    await createTestRemedy({
      title: 'Lung Calming Tea',
      description: 'A soothing herbal tea for respiratory health and cough relief.',
      tags: ['respiratory', 'cough'],
      ingredients: [{ name: 'Mulethi', quantity: '1', unit: 'stick' }],
    });
    await createTestRemedy({
      title: 'Digestive Triphala Churna',
      description: 'A classical herbal blend supporting healthy digestion and gut motility.',
      tags: ['digestion', 'stomach'],
      ingredients: [{ name: 'Amla', quantity: '1', unit: 'tsp' }],
    });

    const resResp = await remedyService.list({ page: 1, limit: 10, health: 'respiratory' });
    expect(resResp.remedies.length).toBe(1);
    expect(resResp.remedies[0].title).toBe('Lung Calming Tea');

    const resDig = await remedyService.list({ page: 1, limit: 10, health: 'digestion' });
    expect(resDig.remedies.length).toBe(1);
    expect(resDig.remedies[0].title).toBe('Digestive Triphala Churna');
  });

  it('should filter by difficulty', async () => {
    await createTestRemedy({ title: 'Easy Remedy', difficulty: 'EASY', difficultyLevel: 'EASY' });
    await createTestRemedy({ title: 'Hard Remedy', difficulty: 'HARD', difficultyLevel: 'ADVANCED' });

    const res = await remedyService.list({ page: 1, limit: 10, difficulty: 'HARD' });
    expect(res.remedies.length).toBe(1);
    expect(res.remedies[0].title).toBe('Hard Remedy');
  });

  it('should filter by plant (by slug, ID, or ingredient name match)', async () => {
    const tulsiPlant = await createTestPlant('Holy Basil', 'Ocimum tenuiflorum', ['Tulsi']);
    const neemPlant = await createTestPlant('Neem', 'Azadirachta indica');

    await createTestRemedy({
      title: 'Tulsi Tea',
      plants: [tulsiPlant._id],
      ingredients: [{ name: 'Tulsi Leaves', quantity: '5', unit: 'leaves' }],
    });
    await createTestRemedy({
      title: 'Neem Pack',
      plants: [neemPlant._id],
      ingredients: [{ name: 'Neem leaves', quantity: '10', unit: 'leaves' }],
    });

    // Query by plant slug
    const resBySlug = await remedyService.list({ page: 1, limit: 10, plant: tulsiPlant.slug });
    expect(resBySlug.remedies.length).toBe(1);
    expect(resBySlug.remedies[0].title).toBe('Tulsi Tea');

    // Query by plant ObjectId string
    const resById = await remedyService.list({ page: 1, limit: 10, plant: neemPlant._id.toString() });
    expect(resById.remedies.length).toBe(1);
    expect(resById.remedies[0].title).toBe('Neem Pack');
  });

  it('should hide unpublished and deleted remedies', async () => {
    await createTestRemedy({ title: 'Published One', isPublished: true });
    await createTestRemedy({ title: 'Draft One', isPublished: false });
    await createTestRemedy({ title: 'Deleted One', isPublished: true, isDeleted: true });

    const res = await remedyService.list({ page: 1, limit: 10 });
    expect(res.remedies.length).toBe(1);
    expect(res.remedies[0].title).toBe('Published One');
  });

  it('should return pagination and facets', async () => {
    await createTestRemedy({
      title: 'R1',
      difficulty: 'EASY',
      tags: ['respiratory'],
    });
    await createTestRemedy({
      title: 'R2',
      difficulty: 'MEDIUM',
      tags: ['digestion'],
    });

    const res = await remedyService.list({ page: 1, limit: 10 });
    expect(res.meta.total).toBe(2);
    expect(res.meta.facets).toBeDefined();
    expect(res.meta.facets?.health).toBeDefined();
    expect(res.meta.facets?.difficulty).toBeDefined();
  });

  it('should resolve matching plants in getBySlugOrId', async () => {
    await createTestPlant('Ginger', 'Zingiber officinale');
    await createTestRemedy({
      title: 'Ginger Infusion',
      slug: 'ginger-infusion',
      ingredients: [{ name: 'Ginger Root', quantity: '1', unit: 'slice' }],
    });

    const detail = await remedyService.getBySlugOrId('ginger-infusion');
    expect(detail).toBeDefined();
    expect(detail.title).toBe('Ginger Infusion');
    expect(detail.resolvedPlants).toBeDefined();
    expect(detail.resolvedPlants.some((p: any) => p.commonName === 'Ginger')).toBe(true);
  });

  it('should return related remedies excluding itself', async () => {
    const r1 = await createTestRemedy({
      title: 'Cold Remedy 1',
      tags: ['cold', 'respiratory'],
    });
    await createTestRemedy({
      title: 'Cold Remedy 2',
      tags: ['cold', 'throat'],
    });
    await createTestRemedy({
      title: 'Unrelated Skin Pack',
      tags: ['skin-care'],
    });

    const related = await remedyService.getRelated(r1._id.toString());
    expect(related.length).toBeGreaterThan(0);
    expect(related.some((r: any) => r._id.toString() === r1._id.toString())).toBe(false);
    expect(related.some((r: any) => r.title === 'Cold Remedy 2')).toBe(true);
  });
});
