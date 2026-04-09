import mongoose from 'mongoose';
import Plant from './models/Plant';
import Tour from './models/Tour';
import Remedy from './models/Remedy';
import SystemConfig from './models/SystemConfig';
import { DifficultyLevel } from './types';

export async function seedDatabase() {
  if ((await Plant.countDocuments()) > 0) return; // Only seed if empty

  console.log('🌱 Seeding database...');

  const c1 = new mongoose.Types.ObjectId();
  const c2 = new mongoose.Types.ObjectId();

  const plant1 = await Plant.create({
    commonName: 'Aloe Vera',
    scientificName: 'Aloe barbadensis miller',
    slug: 'aloe-vera',
    description: 'A succulent plant species of the genus Aloe, widely used for skin care and digestive health for over 5,000 years.',
    shortDescription: 'The plant of immortality — used for burns, skin care, and digestive health.',
    images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Aloe_vera_flower_inridge.jpg/800px-Aloe_vera_flower_inridge.jpg', isPrimary: true, alt: 'Aloe Vera' }],
    model3dUrl: null,
    placement3d: { position: { x: -7, y: 0, z: 2 }, scale: 0.9 },
    regionNative: ['North Africa', 'Middle East'],
    family: 'Asphodelaceae',
    categories: [c1],
    medicinalUses: ['Burns', 'Skin Care', 'Digestion'],
    toxicityLevel: 'LOW',
    ayurvedicNames: ['Kumari', 'Ghritkumari'],
    growingConditions: { soil: 'Sandy, well-drained', water: 'Very low', sunlight: 'Full sun', climate: 'Arid', hardinessZone: '9-11' },
    tags: ['succulent', 'indoor', 'medicinal'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  const plant2 = await Plant.create({
    commonName: 'Tulsi',
    scientificName: 'Ocimum tenuiflorum',
    slug: 'tulsi',
    description: 'Holy basil is an aromatic perennial plant in the family Lamiaceae. It is a cornerstone of Ayurvedic medicine and is revered as a sacred plant.',
    shortDescription: 'Sacred adaptogenic herb used for immunity, respiratory health, and stress relief.',
    images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Ocimum_tenuiflorum_2.jpg/800px-Ocimum_tenuiflorum_2.jpg', isPrimary: true, alt: 'Tulsi' }],
    model3dUrl: null,
    placement3d: { position: { x: 0, y: 0, z: 5 }, scale: 1.0 },
    regionNative: ['India', 'Southeast Asia'],
    family: 'Lamiaceae',
    categories: [c2],
    medicinalUses: ['Immunity', 'Stress Relief', 'Respiratory Health'],
    toxicityLevel: 'NONE',
    ayurvedicNames: ['Tulasi', 'Vishnu Priya'],
    growingConditions: { soil: 'Well-drained loamy', water: 'Moderate', sunlight: 'Full sun', climate: 'Tropical', hardinessZone: '10-12' },
    tags: ['herb', 'sacred', 'medicinal'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  const plant3 = await Plant.create({
    commonName: 'Ashwagandha',
    scientificName: 'Withania somnifera',
    slug: 'ashwagandha',
    description: 'Also known as Indian ginseng, Ashwagandha has been used for over 3,000 years to relieve stress, increase energy, and improve concentration.',
    shortDescription: 'Premier Ayurvedic adaptogen for stress relief, vitality, and cognitive function.',
    images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Withania_somnifera_at_Talakona_forest%2C_in_Chittoor_district_of_Andhra_Pradesh.jpg/800px-Withania_somnifera_at_Talakona_forest%2C_in_Chittoor_district_of_Andhra_Pradesh.jpg', isPrimary: true, alt: 'Ashwagandha' }],
    model3dUrl: null,
    placement3d: { position: { x: 8, y: 0, z: -3 }, scale: 1.2 },
    regionNative: ['India', 'Middle East', 'Africa'],
    family: 'Solanaceae',
    categories: [c2],
    medicinalUses: ['Stress Relief', 'Energy', 'Anxiety', 'Cognitive Enhancement'],
    toxicityLevel: 'LOW',
    ayurvedicNames: ['Ashwagandha', 'Varahakarni'],
    growingConditions: { soil: 'Sandy loam', water: 'Low', sunlight: 'Full sun', climate: 'Arid', hardinessZone: '8-12' },
    tags: ['adaptogen', 'ayurveda'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  const plant4 = await Plant.create({
    commonName: 'Turmeric',
    scientificName: 'Curcuma longa',
    slug: 'turmeric',
    description: 'The golden spice of India used for 4,000+ years. Its primary compound curcumin has powerful anti-inflammatory and antioxidant properties.',
    shortDescription: 'The golden spice with powerful anti-inflammatory curcumin compounds.',
    images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Curcuma_longa_-_Ko%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-199.jpg/409px-Curcuma_longa_-_Ko%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-199.jpg', isPrimary: true, alt: 'Turmeric' }],
    model3dUrl: null,
    placement3d: { position: { x: 5, y: 0, z: -10 }, scale: 1.1 },
    regionNative: ['Indian subcontinent', 'Southeast Asia'],
    family: 'Zingiberaceae',
    categories: [c1],
    medicinalUses: ['Anti-inflammatory', 'Antioxidant', 'Joint Pain Relief'],
    toxicityLevel: 'NONE',
    ayurvedicNames: ['Haridra', 'Kanchani'],
    growingConditions: { soil: 'Rich loamy', water: 'Regular', sunlight: 'Partial shade', climate: 'Tropical', hardinessZone: '8-11' },
    tags: ['curcumin', 'spice', 'anti-inflammatory'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  const plant5 = await Plant.create({
    commonName: 'Brahmi',
    scientificName: 'Bacopa monnieri',
    slug: 'brahmi',
    description: 'Brahmi is renowned as a brain tonic in Ayurveda. It enhances memory, learning, and concentration.',
    shortDescription: 'Legendary Ayurvedic brain tonic for memory, focus, and neuroprotection.',
    images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Bacopa_monnieri_flowers.jpg/800px-Bacopa_monnieri_flowers.jpg', isPrimary: true, alt: 'Brahmi' }],
    model3dUrl: null,
    placement3d: { position: { x: 3, y: 0, z: 12 }, scale: 0.8 },
    regionNative: ['India', 'Australia'],
    family: 'Plantaginaceae',
    categories: [c2],
    medicinalUses: ['Memory Enhancement', 'Cognitive Function', 'Anxiety Reduction'],
    toxicityLevel: 'NONE',
    ayurvedicNames: ['Brahmi', 'Saraswati'],
    growingConditions: { soil: 'Moist, marshy', water: 'High', sunlight: 'Partial shade', climate: 'Tropical', hardinessZone: '8-11' },
    tags: ['nootropic', 'brain tonic', 'memory'],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  // Tours — field names match the Tour schema
  await Tour.create({
    title: 'Immunity Boosters',
    slug: 'immunity-boosters',
    description: 'Explore plants that strengthen the immune system.',
    estimatedDuration: 5,
    difficulty: 'EASY',
    stops: [
      {
        order: 1,
        title: 'Welcome: Immune Support',
        description: 'Discover powerful plants that boost your immune system.',
        plant: plant2._id,
        coordinates3d: { x: 0, y: 5, z: 10 },
      },
      {
        order: 2,
        title: 'Aloe Vera — Ancient Healer',
        description: 'A plant used since ancient Egypt for healing.',
        plant: plant1._id,
        coordinates3d: { x: -7, y: 2, z: 2 },
      },
    ],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  await Tour.create({
    title: 'Stress Relief & Adaptogens',
    slug: 'stress-relief-adaptogens',
    description: 'Explore science-backed adaptogenic herbs of Ayurveda.',
    estimatedDuration: 10,
    difficulty: 'MEDIUM',
    stops: [
      {
        order: 1,
        title: 'Ashwagandha — Indian Ginseng',
        description: 'The king of adaptogens with 3,000 years of documented use.',
        plant: plant3._id,
        coordinates3d: { x: 8, y: 2, z: -3 },
      },
      {
        order: 2,
        title: 'Brahmi — The Brain Tonic',
        description: 'Enhances memory, focus, and neural plasticity.',
        plant: plant5._id,
        coordinates3d: { x: 3, y: 2, z: 12 },
      },
    ],
    createdBy: new mongoose.Types.ObjectId(),
    isFeatured: true,
    isPublished: true,
  });

  // Remedy — field names match the Remedy schema
  await Remedy.create({
    title: 'Golden Milk (Haldi Doodh)',
    slug: 'golden-milk-haldi-doodh',
    description: 'A traditional Ayurvedic bedtime drink combining turmeric with warm milk and black pepper.',
    plants: [plant4._id],
    dosage: 'One cup (200ml) before bed, daily',
    ingredients: [
      { quantity: '1', unit: 'teaspoon', notes: 'Ground turmeric powder' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Warm 200ml of milk on medium heat.', durationMinutes: 3 },
      { step: 2, instruction: 'Add 1 tsp turmeric and a pinch of black pepper.', durationMinutes: 1 },
      { step: 3, instruction: 'Stir and simmer for 3-4 minutes. Add honey to taste.', durationMinutes: 4 },
    ],
    contraindications: ['Pregnancy (high doses)', 'Gallbladder issues'],
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 10,
    tags: ['golden milk', 'anti-inflammatory', 'immunity'],
    createdBy: new mongoose.Types.ObjectId(),
    isPublished: true,
  });

  await SystemConfig.create({
    _id: 'global',
    aiModelVersion: 'plant.id-v3',
    featuredPlantIds: [plant1._id, plant2._id, plant3._id, plant4._id],
    maintenanceMode: false,
    allowedDetectionsPerHour: 10,
    featureFlags: new Map([['3d_garden', true], ['ai_detection', true], ['guided_tours', true], ['dark_mode', true]]),
  });

  console.log('✅ Database seeded with 5 plants, 2 tours, 1 remedy!');
}
