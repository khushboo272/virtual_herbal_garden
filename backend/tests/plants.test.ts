import mongoose from 'mongoose';
import Plant from '../src/models/Plant';
import Review from '../src/models/Review';
import User from '../src/models/User';
import { hashPassword } from '../src/utils/hash';
import { generateSlug } from '../src/utils/slug';

import './setup';

describe('Plant API', () => {
  let userId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const user = await User.create({
      email: 'botanist@test.com',
      passwordHash: await hashPassword('TestPass123!'),
      displayName: 'Botanist',
      role: 'BOTANIST',
    });
    userId = user._id as mongoose.Types.ObjectId;
  });

  describe('Plant Model', () => {
    it('should create a plant with all required fields', async () => {
      const plant = await Plant.create({
        commonName: 'Tulsi',
        scientificName: 'Ocimum tenuiflorum',
        slug: generateSlug('Tulsi'),
        family: 'Lamiaceae',
        description: 'A sacred plant in Ayurveda',
        medicinalUses: ['immunity', 'respiratory'],
        toxicityLevel: 'NONE',
        regionNative: ['South Asia'],
        createdBy: userId,
      });

      expect(plant.commonName).toBe('Tulsi');
      expect(plant.slug).toBe('tulsi');
      expect(plant.isPublished).toBe(false);
      expect(plant.avgRating).toBe(0);
      expect(plant.viewCount).toBe(0);
    });

    it('should enforce unique scientificName', async () => {
      await Plant.create({
        commonName: 'Tulsi', scientificName: 'Ocimum tenuiflorum',
        slug: 'tulsi', family: 'Lamiaceae', description: 'Description',
        medicinalUses: ['immunity'], toxicityLevel: 'NONE',
        regionNative: ['South Asia'], createdBy: userId,
      });

      await expect(
        Plant.create({
          commonName: 'Holy Basil', scientificName: 'Ocimum tenuiflorum',
          slug: 'holy-basil', family: 'Lamiaceae', description: 'Description',
          medicinalUses: ['immunity'], toxicityLevel: 'NONE',
          regionNative: ['South Asia'], createdBy: userId,
        }),
      ).rejects.toThrow();
    });

    it('should support embedded growing conditions', async () => {
      const plant = await Plant.create({
        commonName: 'Neem', scientificName: 'Azadirachta indica',
        slug: 'neem', family: 'Meliaceae', description: 'A tropical tree',
        medicinalUses: ['skin', 'dental'], toxicityLevel: 'LOW',
        regionNative: ['South Asia'],
        growingConditions: { soil: 'Well-drained', water: 'Moderate', sunlight: 'Full sun' },
        createdBy: userId,
      });

      expect(plant.growingConditions.soil).toBe('Well-drained');
      expect(plant.growingConditions.sunlight).toBe('Full sun');
    });

    it('should increment viewCount atomically', async () => {
      const plant = await Plant.create({
        commonName: 'Aloe Vera', scientificName: 'Aloe barbadensis',
        slug: 'aloe-vera', family: 'Asphodelaceae', description: 'A succulent plant',
        medicinalUses: ['skin'], toxicityLevel: 'NONE',
        regionNative: ['Arabian Peninsula'], createdBy: userId,
      });

      await Plant.findByIdAndUpdate(plant._id, { $inc: { viewCount: 1 } });
      await Plant.findByIdAndUpdate(plant._id, { $inc: { viewCount: 1 } });

      const updated = await Plant.findById(plant._id);
      expect(updated!.viewCount).toBe(2);
    });
  });

  describe('Slug Generation', () => {
    it('should generate URL-safe slugs', () => {
      expect(generateSlug('Holy Basil')).toBe('holy-basil');
      expect(generateSlug('Neem (Azadirachta)')).toBe('neem-azadirachta');
      expect(generateSlug('  Aloe   Vera  ')).toBe('aloe-vera');
    });
  });

  describe('Review System', () => {
    it('should enforce one review per user per plant', async () => {
      const plant = await Plant.create({
        commonName: 'Test Plant', scientificName: 'Test scientific',
        slug: 'test-plant', family: 'Test', description: 'Test desc',
        medicinalUses: ['test'], toxicityLevel: 'NONE',
        regionNative: ['Test'], createdBy: userId,
      });

      await Review.create({
        plant: plant._id, user: userId, rating: 4, title: 'Great plant',
      });

      await expect(
        Review.create({
          plant: plant._id, user: userId, rating: 5, title: 'Another review',
        }),
      ).rejects.toThrow();
    });
  });
});
