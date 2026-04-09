import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User';
import Category from './models/Category';
import Plant from './models/Plant';
import Tour from './models/Tour';
import Remedy from './models/Remedy';
import Review from './models/Review';
import Bookmark from './models/Bookmark';
import Garden from './models/Garden';
import Notification from './models/Notification';
import SystemConfig from './models/SystemConfig';
import { UserRole, ToxicityLevel, PlantPart, DifficultyLevel, GrowthStage, BookmarkEntityType, NotificationType, ImageType } from './types';

const MONGODB_URI = process.env.MONGODB_URI!;
const DB_NAME = process.env.MONGODB_DB_NAME || 'herbal_garden_dev';

async function seed() {
  console.log('🔗 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  console.log('✅ Connected!\n');

  // Clear existing data
  const collections = ['users','categories','plants','tours','remedies','reviews','bookmarks','gardens','notifications','systemconfigs'];
  for (const c of collections) {
    try { await mongoose.connection.db!.dropCollection(c); } catch {}
  }
  console.log('🗑️  Cleared existing collections.\n');

  // ═══════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════
  const passwordHash = await bcrypt.hash('Test@1234', 12);

  const adminUser = await User.create({
    email: 'admin@virtualherbal.garden',
    passwordHash,
    role: UserRole.ADMIN,
    displayName: 'Dr. Arun Sharma',
    bio: 'AYUSH-certified Ayurvedic practitioner with 15+ years of experience in herbal medicine.',
    isEmailVerified: true,
    isActive: true,
  });

  const botanistUser = await User.create({
    email: 'botanist@virtualherbal.garden',
    passwordHash,
    role: UserRole.BOTANIST,
    displayName: 'Dr. Priya Iyer',
    bio: 'Ethnobotanist specializing in Western Ghats medicinal flora. PhD from IISER Pune.',
    isEmailVerified: true,
    isActive: true,
  });

  const normalUser = await User.create({
    email: 'user@virtualherbal.garden',
    passwordHash,
    role: UserRole.USER,
    displayName: 'Aniket Kumar',
    bio: 'Herbal medicine enthusiast and organic gardener.',
    isEmailVerified: true,
    isActive: true,
  });

  const guestUser = await User.create({
    email: 'guest@virtualherbal.garden',
    passwordHash,
    role: UserRole.USER,
    displayName: 'Sneha Patel',
    bio: 'Learning about traditional Indian remedies.',
    isEmailVerified: false,
    isActive: true,
  });

  console.log(`👤 Created ${4} users (password: Test@1234)`);

  // ═══════════════════════════════════════════
  // 2. CATEGORIES
  // ═══════════════════════════════════════════
  const catAyurveda = await Category.create({ name: 'Ayurvedic Herbs', slug: 'ayurvedic-herbs', description: 'Classical herbs from the Ayurvedic pharmacopoeia (Dravyaguna Vigyana).', sortOrder: 1 });
  const catDigestive = await Category.create({ name: 'Digestive Health', slug: 'digestive-health', description: 'Plants used for GI tract remedies in traditional medicine.', sortOrder: 2 });
  const catSkin = await Category.create({ name: 'Skin & Beauty', slug: 'skin-beauty', description: 'Plants used in dermatological and cosmetic preparations.', sortOrder: 3 });
  const catImmunity = await Category.create({ name: 'Immunity Boosters', slug: 'immunity-boosters', description: 'Rasayana herbs that strengthen the immune system.', sortOrder: 4 });
  const catStress = await Category.create({ name: 'Stress & Adaptogen', slug: 'stress-adaptogen', description: 'Adaptogenic herbs that help the body resist stressors.', sortOrder: 5 });
  const catRespiratory = await Category.create({ name: 'Respiratory Health', slug: 'respiratory-health', description: 'Plants traditionally used for cough, cold and lung health.', sortOrder: 6 });

  console.log(`📁 Created ${6} categories`);

  // ═══════════════════════════════════════════
  // 3. PLANTS (15 real medicinal plants)
  // ═══════════════════════════════════════════
  const plantsData = [
    {
      commonName: 'Tulsi', scientificName: 'Ocimum tenuiflorum', slug: 'tulsi', family: 'Lamiaceae',
      description: 'Tulsi (Holy Basil) is one of the most sacred plants in Hinduism and a cornerstone of Ayurvedic medicine. Rich in eugenol, rosmarinic acid, and ursolic acid, it acts as an adaptogen, helping the body cope with stress. It has been clinically studied for its anti-inflammatory, antimicrobial, and immunomodulatory properties. The Charaka Samhita classifies it as a "rasayana" (rejuvenative herb).',
      shortDescription: 'Sacred adaptogenic herb used for immunity, respiratory health, and stress relief.',
      medicinalUses: ['Respiratory infections', 'Stress relief', 'Immune support', 'Anti-inflammatory', 'Blood sugar regulation'],
      partsUsed: [PlantPart.LEAVES, PlantPart.SEEDS, PlantPart.FLOWERS],
      toxicityLevel: ToxicityLevel.NONE, ayurvedicNames: ['Tulasi', 'Vishnu Priya', 'Surasa'],
      regionNative: ['Indian subcontinent', 'Southeast Asia'],
      growingConditions: { soil: 'Well-drained loamy soil', water: 'Moderate, avoid waterlogging', sunlight: 'Full sun (6-8 hours)', climate: 'Tropical and subtropical', hardinessZone: '10-12' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Ocimum_tenuiflorum_2.jpg/800px-Ocimum_tenuiflorum_2.jpg', alt: 'Tulsi plant with purple flowers', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catImmunity._id, catRespiratory._id],
      tags: ['holy basil', 'adaptogen', 'rasayana', 'ayurveda', 'immunity'],
      isFeatured: true, isPublished: true,
    },
    {
      commonName: 'Ashwagandha', scientificName: 'Withania somnifera', slug: 'ashwagandha', family: 'Solanaceae',
      description: 'Ashwagandha, meaning "smell of the horse" in Sanskrit, is one of the most important herbs in Ayurveda. It is classified as a Rasayana (rejuvenative) and used for over 3,000 years to relieve stress, increase energy, and improve concentration. Modern research confirms its withanolide compounds exhibit adaptogenic, anti-anxiety, and neuroprotective effects.',
      shortDescription: 'Premier Ayurvedic adaptogen for stress relief, vitality, and cognitive function.',
      medicinalUses: ['Stress and anxiety relief', 'Male vitality', 'Cognitive enhancement', 'Anti-inflammatory', 'Thyroid support'],
      partsUsed: [PlantPart.ROOTS, PlantPart.LEAVES],
      toxicityLevel: ToxicityLevel.LOW, ayurvedicNames: ['Ashwagandha', 'Varahakarni', 'Vajigandha'],
      regionNative: ['India', 'North Africa', 'Middle East'],
      growingConditions: { soil: 'Sandy loam, well-drained', water: 'Low — drought tolerant', sunlight: 'Full sun', climate: 'Arid to semi-arid', hardinessZone: '8-12' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Withania_somnifera_at_Talakona_forest%2C_in_Chittoor_district_of_Andhra_Pradesh.jpg/800px-Withania_somnifera_at_Talakona_forest%2C_in_Chittoor_district_of_Andhra_Pradesh.jpg', alt: 'Ashwagandha plant with yellow-green berries', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catStress._id],
      tags: ['adaptogen', 'rasayana', 'stress relief', 'indian ginseng'],
      isFeatured: true, isPublished: true,
    },
    {
      commonName: 'Aloe Vera', scientificName: 'Aloe barbadensis miller', slug: 'aloe-vera', family: 'Asphodelaceae',
      description: 'Aloe vera has been used medicinally for over 5,000 years, dating back to ancient Egypt where it was called the "plant of immortality." The gel contains 75+ potentially active constituents including vitamins, enzymes, minerals, sugars, lignin, saponins, salicylic acids, and amino acids. It is used topically for burns, wounds, and skin conditions, and internally for digestive health.',
      shortDescription: 'The "plant of immortality" — used for burns, skin care, and digestive health.',
      medicinalUses: ['Burn treatment', 'Wound healing', 'Skin hydration', 'Digestive aid', 'Anti-inflammatory'],
      partsUsed: [PlantPart.LEAVES],
      toxicityLevel: ToxicityLevel.LOW, ayurvedicNames: ['Kumari', 'Ghritkumari'],
      regionNative: ['Arabian Peninsula', 'North Africa'],
      growingConditions: { soil: 'Sandy, well-drained cactus mix', water: 'Very low — succulent', sunlight: 'Bright indirect to full sun', climate: 'Arid and tropical', hardinessZone: '9-11' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Aloe_vera_flower_inridge.jpg/800px-Aloe_vera_flower_inridge.jpg', alt: 'Aloe Vera succulent rosette', isPrimary: true, type: ImageType.MAIN }],
      categories: [catSkin._id, catDigestive._id],
      tags: ['succulent', 'skin care', 'burns', 'gel', 'indoor plant'],
      isFeatured: true, isPublished: true,
    },
    {
      commonName: 'Turmeric', scientificName: 'Curcuma longa', slug: 'turmeric', family: 'Zingiberaceae',
      description: 'Turmeric is the golden spice of India, used for 4,000+ years in Ayurvedic and Siddha medicine. Its primary bioactive compound curcumin has powerful anti-inflammatory and antioxidant properties. Over 12,000 peer-reviewed papers have documented its therapeutic effects. In Ayurveda, it is considered a "blood purifier" and is used in nearly every traditional formulation.',
      shortDescription: 'The golden spice with powerful anti-inflammatory curcumin compounds.',
      medicinalUses: ['Anti-inflammatory', 'Antioxidant', 'Joint pain relief', 'Liver support', 'Wound healing'],
      partsUsed: [PlantPart.ROOTS],
      toxicityLevel: ToxicityLevel.NONE, ayurvedicNames: ['Haridra', 'Kanchani', 'Gauri'],
      regionNative: ['Indian subcontinent', 'Southeast Asia'],
      growingConditions: { soil: 'Rich, well-drained loamy soil', water: 'Regular — keep moist', sunlight: 'Partial shade to full sun', climate: 'Tropical', hardinessZone: '8-11' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Curcuma_longa_-_Ko%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-199.jpg/409px-Curcuma_longa_-_Ko%C3%B6hler%E2%80%93s_Medizinal-Pflanzen-199.jpg', alt: 'Turmeric rhizome illustration', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catDigestive._id],
      tags: ['curcumin', 'spice', 'anti-inflammatory', 'golden milk', 'haldi'],
      isFeatured: true, isPublished: true,
    },
    {
      commonName: 'Neem', scientificName: 'Azadirachta indica', slug: 'neem', family: 'Meliaceae',
      description: 'Known as the "village pharmacy" in India, neem has been integral to Ayurvedic medicine for millennia. Every part of the tree — leaves, bark, seeds, flowers, and roots — has documented medicinal value. Its key compound azadirachtin is a potent biopesticide. Neem is anti-bacterial, anti-fungal, anti-viral, and anti-parasitic.',
      shortDescription: 'India\'s village pharmacy — antiseptic, antifungal, and blood-purifying tree.',
      medicinalUses: ['Skin diseases', 'Blood purification', 'Dental hygiene', 'Anti-parasitic', 'Fever reduction'],
      partsUsed: [PlantPart.LEAVES, PlantPart.BARK, PlantPart.SEEDS],
      toxicityLevel: ToxicityLevel.MODERATE, ayurvedicNames: ['Nimba', 'Arishta'],
      regionNative: ['Indian subcontinent', 'Myanmar'],
      growingConditions: { soil: 'Any well-drained soil', water: 'Low — drought tolerant', sunlight: 'Full sun', climate: 'Tropical to semi-arid', hardinessZone: '10-12' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Neem_%28Azadirachta_indica%29_in_Hyderabad_W_IMG_6976.jpg/800px-Neem_%28Azadirachta_indica%29_in_Hyderabad_W_IMG_6976.jpg', alt: 'Neem tree in Hyderabad', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catSkin._id],
      tags: ['antiseptic', 'neem oil', 'blood purifier', 'biopesticide'],
      isPublished: true,
    },
    {
      commonName: 'Brahmi', scientificName: 'Bacopa monnieri', slug: 'brahmi', family: 'Plantaginaceae',
      description: 'Brahmi is renowned as a "medhya rasayana" (brain tonic) in Ayurveda. Named after Lord Brahma, the creator god in Hinduism, it has been used to enhance memory, learning, and concentration for over 3,000 years. Modern clinical trials confirm its bacosides improve cognitive function, reduce anxiety, and have neuroprotective effects.',
      shortDescription: 'Legendary Ayurvedic brain tonic for memory, focus, and neuroprotection.',
      medicinalUses: ['Memory enhancement', 'Cognitive function', 'Anxiety reduction', 'Epilepsy support', 'ADHD management'],
      partsUsed: [PlantPart.LEAVES],
      toxicityLevel: ToxicityLevel.NONE, ayurvedicNames: ['Brahmi', 'Saraswati', 'Medhya'],
      regionNative: ['India', 'Australia', 'Europe', 'Africa'],
      growingConditions: { soil: 'Moist, marshy soil', water: 'High — semi-aquatic plant', sunlight: 'Partial shade', climate: 'Tropical', hardinessZone: '8-11' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Bacopa_monnieri_flowers.jpg/800px-Bacopa_monnieri_flowers.jpg', alt: 'Brahmi with small white flowers', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catStress._id],
      tags: ['nootropic', 'brain tonic', 'memory', 'medhya rasayana'],
      isFeatured: true, isPublished: true,
    },
    {
      commonName: 'Amla', scientificName: 'Phyllanthus emblica', slug: 'amla', family: 'Phyllanthaceae',
      description: 'Amla (Indian Gooseberry) is one of the richest natural sources of Vitamin C — containing 20 times more than an orange. It is a key ingredient in Chyawanprash and Triphala. In Ayurveda it is considered to balance all three doshas (Vata, Pitta, Kapha), making it universally beneficial.',
      shortDescription: 'Vitamin C powerhouse and foundational ingredient in Chyawanprash.',
      medicinalUses: ['Immunity boost', 'Hair health', 'Digestion', 'Anti-aging', 'Eye health'],
      partsUsed: [PlantPart.SEEDS],
      toxicityLevel: ToxicityLevel.NONE, ayurvedicNames: ['Amalaki', 'Dhatri'],
      regionNative: ['India', 'Sri Lanka', 'Southeast Asia'],
      growingConditions: { soil: 'Light, well-drained soil', water: 'Moderate', sunlight: 'Full sun', climate: 'Tropical to subtropical', hardinessZone: '9-11' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Phyllanthus_emblica_fruits.jpg/800px-Phyllanthus_emblica_fruits.jpg', alt: 'Amla fruits on the tree', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catImmunity._id],
      tags: ['vitamin c', 'chyawanprash', 'triphala', 'anti-aging', 'indian gooseberry'],
      isPublished: true,
    },
    {
      commonName: 'Giloy', scientificName: 'Tinospora cordifolia', slug: 'giloy', family: 'Menispermaceae',
      description: 'Giloy is called "Amrita" (the root of immortality) in Ayurveda. It is a potent immunomodulator recognized by the WHO. During the COVID-19 pandemic, AYUSH ministry recommended Giloy for prophylactic care. Its berberine and tinosporin compounds demonstrate anti-pyretic, anti-inflammatory, and hepatoprotective actions.',
      shortDescription: 'The root of immortality — premier immunomodulatory Ayurvedic herb.',
      medicinalUses: ['Fever reduction', 'Immunity boost', 'Detoxification', 'Diabetes management', 'Arthritis relief'],
      partsUsed: [PlantPart.LEAVES, PlantPart.BARK],
      toxicityLevel: ToxicityLevel.NONE, ayurvedicNames: ['Guduchi', 'Amrita', 'Chakralakshanika'],
      regionNative: ['India', 'Myanmar', 'Sri Lanka'],
      growingConditions: { soil: 'Any soil type — highly adaptable', water: 'Moderate', sunlight: 'Partial shade to full sun', climate: 'Tropical', hardinessZone: '10-12' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Tinospora_cordifolia_%28Willd.%29_Hook.f._%26_Thomson_%286782067037%29.jpg/800px-Tinospora_cordifolia_%28Willd.%29_Hook.f._%26_Thomson_%286782067037%29.jpg', alt: 'Giloy vine with heart-shaped leaves', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catImmunity._id],
      tags: ['guduchi', 'amrita', 'covid', 'fever', 'immunomodulator'],
      isPublished: true,
    },
    {
      commonName: 'Shatavari', scientificName: 'Asparagus racemosus', slug: 'shatavari', family: 'Asparagaceae',
      description: 'Shatavari means "she who possesses 100 husbands," alluding to its rejuvenative effects on the female reproductive system. It is the primary Ayurvedic herb for women\'s health across all life stages. Its steroidal saponins (shatavarins) have galactagogue, antioxidant, and immunostimulant properties.',
      shortDescription: 'The queen of herbs — primary Ayurvedic tonic for women\'s health.',
      medicinalUses: ['Women\'s reproductive health', 'Lactation support', 'Hormonal balance', 'Digestive soothing', 'Immune support'],
      partsUsed: [PlantPart.ROOTS],
      toxicityLevel: ToxicityLevel.NONE, ayurvedicNames: ['Shatavari', 'Bahusuta', 'Narayani'],
      regionNative: ['India', 'Sri Lanka', 'Himalayas'],
      growingConditions: { soil: 'Rich, moist, well-drained', water: 'Regular', sunlight: 'Partial shade', climate: 'Tropical to subtropical', hardinessZone: '8-11' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Asparagus_racemosus_-_Wild_Asparagus.jpg/800px-Asparagus_racemosus_-_Wild_Asparagus.jpg', alt: 'Shatavari plant with feathery foliage', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catStress._id],
      tags: ['women health', 'lactation', 'hormonal balance', 'rasayana'],
      isPublished: true,
    },
    {
      commonName: 'Mulethi', scientificName: 'Glycyrrhiza glabra', slug: 'mulethi', family: 'Fabaceae',
      description: 'Mulethi (Licorice root) has been used in Ayurveda for over 4,000 years and is classified as a "Jivaniya" (life-promoting) herb. Its glycyrrhizin is 50x sweeter than sugar. It soothes the respiratory tract, supports adrenal function, and heals gastric ulcers. The Sushruta Samhita prescribes it in numerous formulations.',
      shortDescription: 'Sweet root that soothes throat, heals ulcers, and supports adrenal health.',
      medicinalUses: ['Sore throat relief', 'Gastric ulcer healing', 'Respiratory support', 'Adrenal fatigue', 'Skin brightening'],
      partsUsed: [PlantPart.ROOTS],
      toxicityLevel: ToxicityLevel.MODERATE, ayurvedicNames: ['Yashtimadhu', 'Madhuyashti'],
      regionNative: ['Southern Europe', 'Western Asia', 'North India'],
      growingConditions: { soil: 'Deep, fertile, sandy loam', water: 'Moderate', sunlight: 'Full sun', climate: 'Temperate to subtropical', hardinessZone: '7-10' },
      images: [{ url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Glycyrrhiza_glabra_%28Pile_of_Spanish_wood_sticks%29.jpg/800px-Glycyrrhiza_glabra_%28Pile_of_Spanish_wood_sticks%29.jpg', alt: 'Mulethi licorice root sticks', isPrimary: true, type: ImageType.MAIN }],
      categories: [catAyurveda._id, catRespiratory._id, catDigestive._id],
      tags: ['licorice', 'throat', 'ulcer', 'sweet root'],
      isPublished: true,
    },
  ];

  // 3D garden placement coordinates for each plant
  const placements3d = [
    { position: { x: 0, y: 0, z: 5 }, scale: 1.0 },     // Tulsi — centre-front
    { position: { x: 8, y: 0, z: -3 }, scale: 1.2 },     // Ashwagandha
    { position: { x: -7, y: 0, z: 2 }, scale: 0.9 },     // Aloe Vera
    { position: { x: 5, y: 0, z: -10 }, scale: 1.1 },    // Turmeric
    { position: { x: -10, y: 0, z: -6 }, scale: 1.3 },   // Neem
    { position: { x: 3, y: 0, z: 12 }, scale: 0.8 },     // Brahmi
    { position: { x: -4, y: 0, z: -14 }, scale: 1.0 },   // Amla
    { position: { x: 12, y: 0, z: 6 }, scale: 1.1 },     // Giloy
    { position: { x: -12, y: 0, z: 10 }, scale: 0.9 },   // Shatavari
    { position: { x: 0, y: 0, z: -8 }, scale: 1.0 },     // Mulethi
  ];

  const plants = [];
  for (let i = 0; i < plantsData.length; i++) {
    const p = plantsData[i];
    plants.push(await Plant.create({
      ...p,
      createdBy: adminUser._id,
      placement3d: placements3d[i] || { position: { x: i * 3, y: 0, z: 0 }, scale: 1 },
    }));
  }
  console.log(`🌿 Created ${plants.length} plants with real botanical data`);

  // ═══════════════════════════════════════════
  // 4. TOURS
  // ═══════════════════════════════════════════
  await Tour.create({
    slug: 'ayurvedic-immunity-garden', title: 'Ayurvedic Immunity Garden', difficulty: 'EASY', estimatedDuration: 15,
    description: 'Walk through the most potent immunity-boosting herbs documented in the Charaka Samhita. Learn how Tulsi, Giloy, and Amla work synergistically to strengthen your natural defenses.',
    coverImageUrl: plants[0].images[0].url,
    stops: [
      { order: 1, plant: plants[0]._id, title: 'Tulsi — The Sacred Shield', description: 'Begin your journey with the queen of herbs, revered for millennia as the most effective immune modulator in Ayurveda.', coordinates3d: { x: 0, y: 0, z: 5 } },
      { order: 2, plant: plants[7]._id, title: 'Giloy — The Root of Immortality', description: 'Discover Amrita, recommended by AYUSH during COVID-19 for its powerful immunomodulatory properties.', coordinates3d: { x: 5, y: 0, z: 0 } },
      { order: 3, plant: plants[6]._id, title: 'Amla — Nature\'s Vitamin C', description: 'End with the richest natural source of Vitamin C. Learn why it is the cornerstone of Chyawanprash.', coordinates3d: { x: -5, y: 0, z: -3 } },
    ],
    isPublished: true, createdBy: adminUser._id,
  });

  await Tour.create({
    slug: 'stress-relief-adaptogens', title: 'Stress Relief & Adaptogens', difficulty: 'MEDIUM', estimatedDuration: 20,
    description: 'Explore the science-backed adaptogenic herbs of Ayurveda. Understand how Ashwagandha, Brahmi, and Shatavari help your nervous system adapt to stress without side effects.',
    coverImageUrl: plants[1].images[0].url,
    stops: [
      { order: 1, plant: plants[1]._id, title: 'Ashwagandha — Indian Ginseng', description: 'The king of adaptogens. 3,000 years of documented stress-relief with modern clinical validation of its withanolide compounds.', coordinates3d: { x: 0, y: 0, z: 8 } },
      { order: 2, plant: plants[5]._id, title: 'Brahmi — The Brain Tonic', description: 'Named after Brahma: enhances memory, focus, and neural plasticity. Clinically proven to reduce anxiety by 20%.', coordinates3d: { x: 4, y: 0, z: 2 } },
      { order: 3, plant: plants[8]._id, title: 'Shatavari — The Rejuvenator', description: 'The queen of herbs for holistic rejuvenation — adaptogenic, nervine, and deeply nourishing.', coordinates3d: { x: -4, y: 0, z: -2 } },
    ],
    isPublished: true, createdBy: botanistUser._id,
  });

  await Tour.create({
    slug: 'kitchen-pharmacy-tour', title: 'Your Kitchen Pharmacy', difficulty: 'EASY', estimatedDuration: 10,
    description: 'The most powerful medicines may already be in your kitchen. Discover the healing properties of Turmeric, Aloe Vera, and common Indian herbs.',
    coverImageUrl: plants[3].images[0].url,
    stops: [
      { order: 1, plant: plants[3]._id, title: 'Turmeric — The Golden Healer', description: 'With 12,000+ published studies, curcumin is one of the most researched natural compounds on earth.', coordinates3d: { x: 0, y: 0, z: 5 } },
      { order: 2, plant: plants[2]._id, title: 'Aloe Vera — The Plant of Immortality', description: 'Used since ancient Egypt: 75+ active compounds for skin, digestion, and immune health.', coordinates3d: { x: 6, y: 0, z: 0 } },
      { order: 3, plant: plants[4]._id, title: 'Neem — The Village Pharmacy', description: 'Every part of this tree heals. Anti-bacterial, anti-fungal, anti-viral, and anti-parasitic.', coordinates3d: { x: -3, y: 0, z: -5 } },
    ],
    isPublished: true, createdBy: adminUser._id,
  });
  console.log(`🗺️  Created 3 guided tours`);

  // ═══════════════════════════════════════════
  // 5. REMEDIES
  // ═══════════════════════════════════════════
  await Remedy.create({
    title: 'Golden Milk (Haldi Doodh)', slug: 'golden-milk-haldi-doodh',
    description: 'A traditional Ayurvedic bedtime drink combining turmeric with warm milk and black pepper. The piperine in black pepper increases curcumin absorption by 2,000%. Used for centuries to reduce inflammation, aid sleep, and boost immunity.',
    plants: [plants[3]._id], dosage: 'One cup (200ml) before bed, daily',
    ingredients: [
      { plantId: plants[3]._id, partUsed: PlantPart.ROOTS, quantity: '1', unit: 'teaspoon', notes: 'Ground turmeric powder' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Warm 200ml of whole milk (or coconut milk) on medium heat.', durationMinutes: 3 },
      { step: 2, instruction: 'Add 1 tsp turmeric powder, ¼ tsp black pepper, and ½ tsp ghee.', durationMinutes: 1 },
      { step: 3, instruction: 'Stir continuously and simmer for 3-4 minutes. Do not boil.', durationMinutes: 4 },
      { step: 4, instruction: 'Strain into a cup. Add honey to taste once slightly cooled.', durationMinutes: 1 },
    ],
    contraindications: ['Pregnancy (high doses)', 'Gallbladder issues', 'Blood-thinning medication'],
    difficultyLevel: DifficultyLevel.EASY, preparationTime: 10,
    tags: ['golden milk', 'anti-inflammatory', 'sleep aid', 'immunity'],
    isPublished: true, createdBy: adminUser._id,
  });

  await Remedy.create({
    title: 'Tulsi Kadha (Herbal Decoction)', slug: 'tulsi-kadha-herbal-decoction',
    description: 'Tulsi Kadha is the go-to Ayurvedic remedy for cold, cough, and seasonal flu. Recommended by the AYUSH Ministry during the COVID-19 pandemic as an immunity-boosting prophylactic measure. Combines the antimicrobial power of Tulsi with the anti-inflammatory properties of ginger.',
    plants: [plants[0]._id, plants[3]._id], dosage: 'One cup twice daily during illness; once daily for prevention',
    ingredients: [
      { plantId: plants[0]._id, partUsed: PlantPart.LEAVES, quantity: '10-12', unit: 'leaves', notes: 'Fresh Tulsi leaves, washed' },
      { plantId: plants[3]._id, partUsed: PlantPart.ROOTS, quantity: '0.5', unit: 'teaspoon', notes: 'Turmeric powder' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Boil 400ml of water in a saucepan.', durationMinutes: 3 },
      { step: 2, instruction: 'Add 10-12 fresh Tulsi leaves, 1 inch crushed ginger, and ¼ tsp black pepper.', durationMinutes: 1 },
      { step: 3, instruction: 'Add ½ tsp turmeric powder and 1 cinnamon stick. Boil on low heat until reduced to half.', durationMinutes: 10 },
      { step: 4, instruction: 'Strain, add 1 tsp honey and squeeze of lemon juice. Serve warm.', durationMinutes: 1 },
    ],
    contraindications: ['Pregnancy', 'Low blood sugar', 'Children under 5 (reduce dosage by half)'],
    difficultyLevel: DifficultyLevel.EASY, preparationTime: 15,
    tags: ['kadha', 'cold remedy', 'flu', 'covid', 'decoction'],
    isPublished: true, createdBy: botanistUser._id,
  });

  await Remedy.create({
    title: 'Neem Face Pack for Acne', slug: 'neem-face-pack-acne',
    description: 'A potent antibacterial and anti-inflammatory face pack using neem leaves. Neem\'s azadirachtin compounds target acne-causing bacteria (P. acnes) while its nimbidin reduces inflammation and redness. Combined with turmeric and honey, this creates a triple-action treatment for acne-prone skin.',
    plants: [plants[4]._id, plants[3]._id], dosage: 'Apply twice weekly. Leave on for 15 minutes.',
    ingredients: [
      { plantId: plants[4]._id, partUsed: PlantPart.LEAVES, quantity: '15-20', unit: 'leaves', notes: 'Fresh neem leaves, ground into paste' },
      { plantId: plants[3]._id, partUsed: PlantPart.ROOTS, quantity: '0.5', unit: 'teaspoon', notes: 'Turmeric powder' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Wash 15-20 fresh neem leaves and grind into a smooth paste using a mortar and pestle.', durationMinutes: 5 },
      { step: 2, instruction: 'Mix in ½ tsp turmeric powder and 1 tbsp raw honey.', durationMinutes: 2 },
      { step: 3, instruction: 'Apply evenly to clean face, avoiding the eye area.', durationMinutes: 2 },
      { step: 4, instruction: 'Leave on for 15 minutes. Rinse with lukewarm water and pat dry.', durationMinutes: 15 },
    ],
    contraindications: ['Sensitive skin (patch test first)', 'Open wounds on face', 'Neem allergy'],
    difficultyLevel: DifficultyLevel.EASY, preparationTime: 25,
    tags: ['acne', 'face pack', 'skin care', 'antibacterial'],
    isPublished: true, createdBy: adminUser._id,
  });
  console.log(`💊 Created 3 remedies with real Ayurvedic formulations`);

  // ═══════════════════════════════════════════
  // 6. REVIEWS
  // ═══════════════════════════════════════════
  const reviewsData = [
    { plant: plants[0]._id, user: normalUser._id, rating: 5, title: 'Tulsi changed my mornings', body: 'I drink Tulsi tea every morning and my seasonal allergies have reduced significantly. Highly recommend for anyone looking for natural immunity support.' },
    { plant: plants[1]._id, user: normalUser._id, rating: 5, title: 'Best natural stress reliever', body: 'After 3 months of Ashwagandha root powder (KSM-66), my cortisol levels dropped noticeably. Better sleep, less anxiety. Science-backed Ayurveda at its best.' },
    { plant: plants[3]._id, user: guestUser._id, rating: 4, title: 'Golden Milk is wonderful', body: 'My grandmother used to make haldi doodh every winter night. Now I understand the science behind it. Curcumin + piperine is a game changer.' },
    { plant: plants[5]._id, user: normalUser._id, rating: 5, title: 'Brahmi for exam preparation', body: 'Started taking Brahmi tablets during my CA exam prep. Focus and retention improved within 2 weeks. Ancient wisdom validated by modern neuroscience.' },
    { plant: plants[2]._id, user: guestUser._id, rating: 4, title: 'Healed my sunburn overnight', body: 'Applied fresh Aloe Vera gel from my plant on a bad sunburn. By morning the redness and pain were dramatically reduced. Every home should have one.' },
    { plant: plants[4]._id, user: normalUser._id, rating: 4, title: 'Neem water cleared my skin', body: 'Washing my face with neem-infused water for 1 month cleared persistent acne. Bitter taste if consumed, but topical application is fantastic.' },
  ];
  for (const r of reviewsData) { await Review.create(r); }
  console.log(`⭐ Created ${reviewsData.length} reviews`);

  // ═══════════════════════════════════════════
  // 7. BOOKMARKS
  // ═══════════════════════════════════════════
  await Bookmark.create({ user: normalUser._id, entityType: BookmarkEntityType.PLANT, entityId: plants[0]._id, notes: 'Want to grow Tulsi at home' });
  await Bookmark.create({ user: normalUser._id, entityType: BookmarkEntityType.PLANT, entityId: plants[1]._id, notes: 'Research Ashwagandha dosage' });
  await Bookmark.create({ user: normalUser._id, entityType: BookmarkEntityType.PLANT, entityId: plants[5]._id, collectionName: 'Brain Health' });
  await Bookmark.create({ user: guestUser._id, entityType: BookmarkEntityType.PLANT, entityId: plants[3]._id, notes: 'Try golden milk recipe' });
  console.log(`🔖 Created 4 bookmarks`);

  // ═══════════════════════════════════════════
  // 8. GARDENS
  // ═══════════════════════════════════════════
  await Garden.create({
    user: normalUser._id, name: 'My Ayurvedic Kitchen Garden', description: 'Growing essential Ayurvedic herbs at home for daily wellness.',
    plants: [
      { plant: plants[0]._id, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: 1, growthStage: GrowthStage.MATURE, plantedAt: new Date('2025-06-15'), notes: 'Tulsi plant near the entrance — thriving!' },
      { plant: plants[2]._id, position: { x: 3, y: 0, z: 0 }, rotation: { x: 0, y: 45, z: 0 }, scale: 0.8, growthStage: GrowthStage.YOUNG, plantedAt: new Date('2025-09-01'), notes: 'Aloe Vera on the windowsill' },
      { plant: plants[3]._id, position: { x: -2, y: 0, z: 3 }, rotation: { x: 0, y: 0, z: 0 }, scale: 1.2, growthStage: GrowthStage.FLOWERING, plantedAt: new Date('2025-04-01'), notes: 'Turmeric in a large pot — beautiful flowers!' },
    ],
  });
  console.log(`🏡 Created 1 virtual garden`);

  // ═══════════════════════════════════════════
  // 9. NOTIFICATIONS
  // ═══════════════════════════════════════════
  await Notification.create({ user: normalUser._id, type: NotificationType.SYSTEM, title: 'Welcome to Virtual Herbal Garden!', body: 'Explore 10+ medicinal plants, guided tours, and traditional Ayurvedic remedies. Start your journey today!', actionUrl: '/' });
  await Notification.create({ user: normalUser._id, type: NotificationType.REVIEW, title: 'Your review was helpful!', body: 'Your review on Tulsi received 5 helpful votes from the community.', actionUrl: '/plants/tulsi' });
  await Notification.create({ user: guestUser._id, type: NotificationType.ADMIN, title: 'Verify your email', body: 'Please verify your email address to unlock all features including bookmarks and the virtual garden.', actionUrl: '/settings' });
  console.log(`🔔 Created 3 notifications`);

  // ═══════════════════════════════════════════
  // 10. SYSTEM CONFIG
  // ═══════════════════════════════════════════
  await SystemConfig.create({
    _id: 'global',
    aiModelVersion: 'plant.id-v3',
    featuredPlantIds: [plants[0]._id, plants[1]._id, plants[3]._id, plants[5]._id],
    maintenanceMode: false,
    allowedDetectionsPerHour: 10,
    featureFlags: new Map([['3d_garden', true], ['ai_detection', true], ['guided_tours', true], ['dark_mode', true]]),
  });
  console.log(`⚙️  Created system config\n`);

  // ═══════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════
  console.log('═══════════════════════════════════════════');
  console.log('  ✅ DATABASE SEEDED SUCCESSFULLY');
  console.log('═══════════════════════════════════════════');
  console.log(`  👤 Users:         4  (admin / botanist / user / guest)`);
  console.log(`  📁 Categories:    6`);
  console.log(`  🌿 Plants:       ${plants.length}`);
  console.log(`  🗺️  Tours:         3`);
  console.log(`  💊 Remedies:      3`);
  console.log(`  ⭐ Reviews:       ${reviewsData.length}`);
  console.log(`  🔖 Bookmarks:     4`);
  console.log(`  🏡 Gardens:       1`);
  console.log(`  🔔 Notifications: 3`);
  console.log(`  ⚙️  SystemConfig:  1`);
  console.log('');
  console.log('  🔑 Login Credentials:');
  console.log('     Admin:    admin@virtualherbal.garden    / Test@1234');
  console.log('     Botanist: botanist@virtualherbal.garden / Test@1234');
  console.log('     User:     user@virtualherbal.garden     / Test@1234');
  console.log('═══════════════════════════════════════════');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
