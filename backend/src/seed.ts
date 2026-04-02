import mongoose from 'mongoose';
import Plant from './models/Plant';
import Tour from './models/Tour';
import Remedy from './models/Remedy';
import SystemConfig from './models/SystemConfig';
import { GrowthStage, DifficultyLevel } from './types';

export async function seedDatabase() {
  if ((await Plant.countDocuments()) > 0) return; // Only seed if empty

  console.log('🌱 Seeding database...');

  const c1 = new mongoose.Types.ObjectId();
  const c2 = new mongoose.Types.ObjectId();

  const plant1 = await Plant.create({
    commonName: 'Aloe Vera',
    scientificName: 'Aloe barbadensis miller',
    slug: 'aloe-vera',
    description: 'A succulent plant species of the genus Aloe.',
    images: [{ url: 'https://images.unsplash.com/photo-1596547609652-9fc5d8d428ae?auto=format&fit=crop&w=400&q=80', isPrimary: true, alt: 'Aloe Vera' }],
    model3dUrl: '/models/aloe_vera.gltf',
    regionNative: ['North Africa', 'Middle East'],
    family: 'Asphodelaceae',
    categories: [c1],
    medicinalUses: ['Burns', 'Skin Care', 'Digestion'],
    toxicityLevel: 'MILD',
    tags: ['Succulent', 'Indoor', 'Medicinal'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  const plant2 = await Plant.create({
    commonName: 'Tulsi',
    scientificName: 'Ocimum tenuiflorum',
    slug: 'tulsi',
    description: 'Holy basil, is an aromatic perennial plant in the family Lamiaceae.',
    images: [{ url: 'https://images.unsplash.com/photo-1628155930542-3c7a64e2c848?auto=format&fit=crop&w=400&q=80', isPrimary: true, alt: 'Tulsi' }],
    regionNative: ['India', 'Southeast Asia'],
    family: 'Lamiaceae',
    categories: [c2],
    medicinalUses: ['Immunity', 'Stress', 'Cough'],
    toxicityLevel: 'NONE',
    tags: ['Herb', 'Sacred', 'Medicinal'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  const plant3 = await Plant.create({
    commonName: 'Ashwagandha',
    scientificName: 'Withania somnifera',
    slug: 'ashwagandha',
    description: 'Also known as Indian ginseng, used for stress relief.',
    images: [{ url: 'https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&w=400&q=80', isPrimary: true, alt: 'Ashwagandha' }],
    regionNative: ['India', 'Middle East', 'Africa'],
    family: 'Solanaceae',
    categories: [c2],
    medicinalUses: ['Stress Relief', 'Energy', 'Anxiety'],
    toxicityLevel: 'NONE',
    tags: ['Adaptogen', 'Ayurveda'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  await Tour.create({
    title: 'Immunity Boosters',
    slug: 'immunity-boosters',
    description: 'Explore plants that strengthen immune system',
    durationMinutes: 5,
    difficulty: 'EASY',
    stops: [
      {
        order: 1,
        title: 'Welcome: Immune Support',
        description: 'Discover powerful plants that have been scientifically proven to boost your immune system.',
        plant: plant2._id,
        cameraPosition: { x: 0, y: 5, z: 10 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      },
    ],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  await Tour.create({
    title: 'Welcome to the Garden',
    slug: 'welcome-to-the-garden',
    description: 'Introduction to medicinal plants and their importance',
    durationMinutes: 3,
    difficulty: 'EASY',
    stops: [
      {
        order: 1,
        title: 'Introduction to Healing Plants',
        description: 'Learn about the fascinating history of herbal medicine.',
        plant: plant1._id,
        cameraPosition: { x: 5, y: 2, z: 5 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      },
    ],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  await Remedy.create({
    title: 'Aloe Vera Burn Gel',
    slug: 'aloe-vera-burn-gel',
    description: 'A soothing gel for minor burns and sunburns.',
    plants: [plant1._id],
    ingredients: [{ item: 'Fresh Aloe Vera leaf', quantity: '1', notes: 'medium size' }],
    instructions: [
      { stepId: '1', action: 'Cut the leaf', durationMin: 1 },
      { stepId: '2', action: 'Extract the gel', durationMin: 5 },
    ],
    difficultyLevel: DifficultyLevel.BEGINNER,
    preparationTimeMin: 10,
    tags: ['Skin Care', 'First Aid'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  console.log('✅ Database seeded!');
}
