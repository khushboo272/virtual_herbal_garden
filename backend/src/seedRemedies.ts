import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Remedy from './modules/remedies/Remedy.model';
import Plant from './modules/library/Plant.model';
import User from './modules/users/User.model';
import { PlantPart, DifficultyLevel } from './types';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const REMEDIES_DATA = [
  {
    title: 'Golden Milk (Haldi Doodh)',
    slug: 'golden-milk-haldi-doodh',
    description:
      'A traditional Ayurvedic preparation combining turmeric with warm milk and a pinch of black pepper. Traditionally used to support restful sleep and joint comfort.',
    plantNames: ['Turmeric'],
    ingredients: [
      { name: 'Turmeric powder', quantity: '1', unit: 'teaspoon', partUsed: PlantPart.ROOTS, notes: 'Curcuma longa powder' },
      { name: 'Warm milk or almond milk', quantity: '1', unit: 'cup', notes: 'Whole milk or plant milk' },
      { name: 'Black pepper', quantity: '1', unit: 'pinch', notes: 'Enhances absorption' },
      { name: 'Honey', quantity: '1', unit: 'teaspoon', notes: 'Optional, add after warm' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Heat 1 cup of milk in a small saucepan over medium-low heat.', durationMinutes: 3 },
      { step: 2, instruction: 'Whisk in turmeric powder and a pinch of black pepper.', durationMinutes: 1 },
      { step: 3, instruction: 'Simmer gently for 4-5 minutes without boiling.', durationMinutes: 4 },
      { step: 4, instruction: 'Remove from heat, allow to cool slightly, then stir in honey if desired.', durationMinutes: 1 },
    ],
    dosage: '1 warm cup before bedtime',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 10,
    prepTimeMinutes: 10,
    usage: 'INTERNAL',
    traditionalSource: 'Charaka Samhita',
    tags: ['immunity', 'pain-relief', 'stress-sleep', 'anti-inflammatory'],
    precautions: ['Use culinary amounts only', 'Consult a doctor if symptoms persist'],
    contraindications: ['Gallbladder obstruction', 'Allergies to turmeric or dairy', 'Bleeding disorders or blood-thinning medications'],
  },
  {
    title: 'Tulsi Ginger Kadha',
    slug: 'tulsi-ginger-kadha',
    description:
      'A classic Ayurvedic herbal decoction of Holy Basil and fresh ginger. Traditionally brewed to soothe throat irritation and support upper respiratory wellness during seasonal changes.',
    plantNames: ['Holy Basil', 'Ginger'],
    ingredients: [
      { name: 'Fresh Tulsi leaves', quantity: '10-12', unit: 'leaves', partUsed: PlantPart.LEAVES, notes: 'Ocimum sanctum' },
      { name: 'Fresh crushed ginger', quantity: '1', unit: 'inch', partUsed: PlantPart.ROOTS, notes: 'Zingiber officinale' },
      { name: 'Black peppercorns', quantity: '3-4', unit: 'pieces', notes: 'Crushed' },
      { name: 'Water', quantity: '2', unit: 'cups' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Bring 2 cups of clean water to a boil in a saucepan.', durationMinutes: 3 },
      { step: 2, instruction: 'Add washed Tulsi leaves, crushed ginger, and peppercorns.', durationMinutes: 1 },
      { step: 3, instruction: 'Simmer on low heat until water reduces by half (about 8-10 minutes).', durationMinutes: 9 },
      { step: 4, instruction: 'Strain through a sieve and drink warm.', durationMinutes: 1 },
    ],
    dosage: 'Half to one cup twice daily',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 15,
    prepTimeMinutes: 15,
    usage: 'INTERNAL',
    traditionalSource: 'Ayurvedic Pharmacopoeia of India',
    tags: ['respiratory', 'immunity', 'fever', 'cough'],
    precautions: ['Do not boil honey directly with hot liquid', 'Consult a healthcare professional for prolonged fever or cough'],
    contraindications: ['Pregnancy in medicinal concentrations', 'Concurrent use with anticoagulant medication', 'Severe hypoglycemic tendencies'],
  },
  {
    title: 'Neem Clarifying Face Pack',
    slug: 'neem-clarifying-face-pack',
    description:
      'A gentle topical mask formulated with ground neem leaves and rose water. Traditionally applied to oily and acne-prone skin to soothe minor skin redness and blemishes.',
    plantNames: ['Neem'],
    ingredients: [
      { name: 'Neem leaf powder or paste', quantity: '1', unit: 'tablespoon', partUsed: PlantPart.LEAVES, notes: 'Azadirachta indica' },
      { name: 'Rose water', quantity: '1-2', unit: 'tablespoons', notes: 'Pure floral water' },
      { name: 'Multani mitti (Fuller\'s earth)', quantity: '1', unit: 'teaspoon', notes: 'Optional base' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Mix neem powder and Fuller\'s earth in a ceramic or glass bowl.', durationMinutes: 2 },
      { step: 2, instruction: 'Slowly add rose water to form a smooth, spreadable paste.', durationMinutes: 2 },
      { step: 3, instruction: 'Apply a thin layer to clean face, avoiding delicate eye contours.', durationMinutes: 2 },
      { step: 4, instruction: 'Leave on for 12-15 minutes until almost dry, then rinse gently with cool water.', durationMinutes: 15 },
    ],
    dosage: 'Apply topically 1-2 times weekly',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 10,
    prepTimeMinutes: 10,
    usage: 'TOPICAL',
    traditionalSource: 'Sushruta Samhita',
    tags: ['skin-care', 'acne', 'antibacterial'],
    precautions: ['Perform a patch test on forearm 24 hours before facial use', 'For external topical use only', 'Do not ingest'],
    contraindications: ['Open wounds or broken skin', 'Known hypersensitivity to Meliaceae family plants'],
  },
  {
    title: 'Ashwagandha Moon Milk for Rest',
    slug: 'ashwagandha-moon-milk-rest',
    description:
      'An adaptogenic evening beverage infused with Ashwagandha root powder and aromatic nutmeg. Traditionally used in Ayurveda to help calm the mind and ease nighttime tension.',
    plantNames: ['Ashwagandha'],
    ingredients: [
      { name: 'Ashwagandha root powder', quantity: '0.5', unit: 'teaspoon', partUsed: PlantPart.ROOTS, notes: 'Withania somnifera' },
      { name: 'Warm milk or oat milk', quantity: '1', unit: 'cup' },
      { name: 'Ground nutmeg', quantity: '1', unit: 'pinch' },
      { name: 'Cardamom powder', quantity: '1', unit: 'pinch' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Heat milk gently in a small pot over low flame.', durationMinutes: 3 },
      { step: 2, instruction: 'Whisk in Ashwagandha powder, nutmeg, and cardamom thoroughly.', durationMinutes: 2 },
      { step: 3, instruction: 'Simmer on low heat for 5 minutes, stirring occasionally.', durationMinutes: 5 },
      { step: 4, instruction: 'Pour into a mug and enjoy warm 30 minutes before sleep.', durationMinutes: 1 },
    ],
    dosage: '1 cup in the evening before bed',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 12,
    prepTimeMinutes: 12,
    usage: 'INTERNAL',
    traditionalSource: 'Bhavaprakasha',
    tags: ['stress-sleep', 'adaptogen', 'relaxing'],
    precautions: ['Avoid operating machinery if feeling drowsy', 'Consult doctor if insomnia persists'],
    contraindications: ['Pregnancy and breastfeeding', 'Autoimmune thyroid disorders without medical supervision', 'Sedative medication interaction'],
  },
  {
    title: 'Cumin Coriander Fennel Digestive Tea (CCF Tea)',
    slug: 'cumin-coriander-fennel-tea',
    description:
      'A tridoshic digestive infusion made by simmering equal parts cumin, coriander, and fennel seeds. Traditionally consumed between meals to support digestion and ease bloating.',
    plantNames: [],
    ingredients: [
      { name: 'Whole cumin seeds', quantity: '0.5', unit: 'teaspoon', partUsed: PlantPart.SEEDS },
      { name: 'Whole coriander seeds', quantity: '0.5', unit: 'teaspoon', partUsed: PlantPart.SEEDS },
      { name: 'Whole fennel seeds', quantity: '0.5', unit: 'teaspoon', partUsed: PlantPart.SEEDS },
      { name: 'Water', quantity: '3', unit: 'cups' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Combine seeds with water in a saucepan.', durationMinutes: 1 },
      { step: 2, instruction: 'Bring to a gentle boil, then reduce heat and cover.', durationMinutes: 3 },
      { step: 3, instruction: 'Simmer for 8-10 minutes until aromatic.', durationMinutes: 9 },
      { step: 4, instruction: 'Strain into a thermos and sip warm throughout the afternoon.', durationMinutes: 1 },
    ],
    dosage: '1 cup warm after meals',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 15,
    prepTimeMinutes: 15,
    usage: 'INTERNAL',
    traditionalSource: 'Ashtanga Hridaya',
    tags: ['digestion', 'stomach', 'bloating'],
    precautions: ['Drink freshly brewed', 'Consult a doctor if severe abdominal pain occurs'],
    contraindications: ['Severe acid reflux in acute flare', 'Known allergy to Umbelliferae family spices'],
  },
  {
    title: 'Aloe Vera & Mint Soothing Gel',
    slug: 'aloe-vera-mint-soothing-gel',
    description:
      'A cooling botanical preparation combining fresh Aloe Vera inner fillet with crushed mint essence. Traditionally used topically to relieve mild sunburn and calm warm weather skin irritation.',
    plantNames: ['Aloe Vera', 'Peppermint'],
    ingredients: [
      { name: 'Fresh Aloe Vera inner leaf gel', quantity: '3', unit: 'tablespoons', partUsed: PlantPart.LEAVES, notes: 'Clear inner parenchyma only' },
      { name: 'Fresh mint leaves', quantity: '5-6', unit: 'leaves', partUsed: PlantPart.LEAVES, notes: 'Finely crushed' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Carefully harvest clear gel from aloe leaf, ensuring yellowish aloin latex is washed off.', durationMinutes: 5 },
      { step: 2, instruction: 'Blend or whip the clear gel until smooth.', durationMinutes: 2 },
      { step: 3, instruction: 'Stir in the crushed mint extract and refrigerate for 15 minutes before application.', durationMinutes: 15 },
      { step: 4, instruction: 'Smooth gently over irritated skin areas.', durationMinutes: 2 },
    ],
    dosage: 'Apply topically 2 times daily',
    difficulty: 'MEDIUM',
    difficultyLevel: DifficultyLevel.MEDIUM,
    preparationTime: 25,
    prepTimeMinutes: 25,
    usage: 'TOPICAL',
    traditionalSource: 'Traditional folk herbalism',
    tags: ['skin-care', 'sunburn', 'cooling'],
    precautions: ['Ensure latex layer is completely rinsed away', 'External use only', 'Patch test first'],
    contraindications: ['Deep open lacerations or infected burns', 'Allergy to aloe or liliaceous plants'],
  },
  {
    title: 'Ginger Lemongrass Inhalation Steam',
    slug: 'ginger-lemongrass-inhalation-steam',
    description:
      'An aromatic warm steam inhalation featuring bruised lemongrass stalks and sliced ginger. Traditionally inhaled to help clear nasal passages and ease head heaviness.',
    plantNames: ['Ginger', 'Lemongrass'],
    ingredients: [
      { name: 'Fresh ginger slices', quantity: '1', unit: 'inch', partUsed: PlantPart.ROOTS },
      { name: 'Bruised lemongrass stalk', quantity: '1', unit: 'stalk', partUsed: PlantPart.LEAVES },
      { name: 'Boiling water', quantity: '4', unit: 'cups' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Boil water in a wide heat-proof ceramic bowl.', durationMinutes: 5 },
      { step: 2, instruction: 'Add sliced ginger and bruised lemongrass stalk.', durationMinutes: 1 },
      { step: 3, instruction: 'Drape a clean towel over the head, forming a tent 12 inches above the bowl.', durationMinutes: 1 },
      { step: 4, instruction: 'Inhale the aromatic vapor gently through the nose with eyes closed for 5-8 minutes.', durationMinutes: 7 },
    ],
    dosage: 'Once daily as needed during nasal congestion',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 15,
    prepTimeMinutes: 15,
    usage: 'INHALATION',
    traditionalSource: 'Siddha traditional practice',
    tags: ['respiratory', 'cough', 'congestion'],
    precautions: ['Keep eyes closed during steam inhalation', 'Ensure water is not boiling hot to avoid vapor burns', 'Supervise closely around children'],
    contraindications: ['Asthma flare or acute bronchospasm', 'Severe facial rosacea or broken capillaries'],
  },
  {
    title: 'Amla & Honey Morning Tonic',
    slug: 'amla-honey-morning-tonic',
    description:
      'A revitalizing morning mixture of fresh Indian Gooseberry (Amla) juice and raw honey. Traditionally valued in Ayurvedic Rasayana practice for its high natural Vitamin C and antioxidant qualities.',
    plantNames: ['Amla'],
    ingredients: [
      { name: 'Fresh Amla juice or powder', quantity: '1', unit: 'tablespoon', partUsed: PlantPart.SEEDS, notes: 'Phyllanthus emblica' },
      { name: 'Lukewarm water', quantity: '0.5', unit: 'cup' },
      { name: 'Raw honey', quantity: '1', unit: 'teaspoon' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Extract juice from 2 fresh Amla fruits, or mix 1 tsp dried Amla powder in lukewarm water.', durationMinutes: 4 },
      { step: 2, instruction: 'Add 1 teaspoon of raw honey and stir until thoroughly dissolved.', durationMinutes: 1 },
      { step: 3, instruction: 'Drink on an empty stomach in the morning.', durationMinutes: 1 },
    ],
    dosage: 'Half cup once daily in the morning',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 8,
    prepTimeMinutes: 8,
    usage: 'INTERNAL',
    traditionalSource: 'Charaka Samhita Rasayana Adhyaya',
    tags: ['immunity', 'skin-care', 'antioxidant'],
    precautions: ['Take with lukewarm water, never boiling water with honey', 'Consult doctor if diabetic'],
    contraindications: ['Uncontrolled hyperacidity in acute stages', 'Concurrent hypoglycemic medications without monitoring'],
  },
  {
    title: 'Brahmi Herbal Infusion for Focus',
    slug: 'brahmi-herbal-infusion-focus',
    description:
      'A gentle cognitive tonic prepared with dried Brahmi leaves. Traditionally revered as a Medhya Rasayana to promote mental clarity, memory retention, and nervous system balance.',
    plantNames: ['Brahmi'],
    ingredients: [
      { name: 'Dried Brahmi leaves', quantity: '1', unit: 'teaspoon', partUsed: PlantPart.LEAVES, notes: 'Bacopa monnieri' },
      { name: 'Fresh water', quantity: '1.5', unit: 'cups' },
      { name: 'Cardamom pod', quantity: '1', unit: 'piece', notes: 'Lightly crushed' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Boil water in a small pot with the crushed cardamom pod.', durationMinutes: 3 },
      { step: 2, instruction: 'Remove from heat, add dried Brahmi leaves, and cover with a lid.', durationMinutes: 1 },
      { step: 3, instruction: 'Allow to steep for 7-10 minutes to extract bitter saponins gently.', durationMinutes: 8 },
      { step: 4, instruction: 'Strain and consume warm in the morning.', durationMinutes: 1 },
    ],
    dosage: '1 cup in the morning',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 12,
    prepTimeMinutes: 12,
    usage: 'INTERNAL',
    traditionalSource: 'Sushruta Samhita',
    tags: ['stress-sleep', 'memory', 'mental-clarity'],
    precautions: ['May cause mild stomach upset if taken on an empty stomach by sensitive individuals', 'Consult physician if taking psychiatric medications'],
    contraindications: ['Bradycardia or slow heart rate', 'Pregnancy and lactation', 'Peptic ulcer disease'],
  },
  {
    title: 'Fenugreek Seed Water for Blood Sugar Support',
    slug: 'fenugreek-seed-water-balance',
    description:
      'An overnight seed soak of methi (fenugreek) seeds. Traditionally consumed in the morning to assist in healthy glycemic metabolism and digestive regularity.',
    plantNames: ['Fenugreek'],
    ingredients: [
      { name: 'Whole Fenugreek seeds', quantity: '1', unit: 'teaspoon', partUsed: PlantPart.SEEDS, notes: 'Trigonella foenum-graecum' },
      { name: 'Drinking water', quantity: '1', unit: 'glass' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Rinse 1 teaspoon of fenugreek seeds in fresh water.', durationMinutes: 1 },
      { step: 2, instruction: 'Soak the seeds in 1 glass of room-temperature water overnight (8 hours).', durationMinutes: 2 },
      { step: 3, instruction: 'In the morning, strain the water and drink on an empty stomach.', durationMinutes: 1 },
      { step: 4, instruction: 'The softened seeds can also be chewed for extra dietary fiber.', durationMinutes: 1 },
    ],
    dosage: '1 glass daily in the morning',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 5,
    prepTimeMinutes: 5,
    usage: 'INTERNAL',
    traditionalSource: 'Ayurvedic domestic practices',
    tags: ['blood-sugar', 'digestion', 'metabolism'],
    precautions: ['Regularly monitor blood sugar levels if taking diabetic medications', 'Consult doctor before daily use'],
    contraindications: ['Pregnancy (may stimulate uterine contractions)', 'Known allergy to legumes/peanuts'],
  },
  {
    title: 'Moringa Leaf Broth for Vitality',
    slug: 'moringa-leaf-broth-vitality',
    description:
      'A nutrient-rich green broth prepared by simmering fresh or dried Moringa leaves with garlic and a hint of cumin. Traditionally prepared as a nourishing restorative soup.',
    plantNames: ['Moringa'],
    ingredients: [
      { name: 'Fresh Moringa leaves or powder', quantity: '0.5', unit: 'cup', partUsed: PlantPart.LEAVES, notes: 'Moringa oleifera' },
      { name: 'Crushed garlic cloves', quantity: '2', unit: 'pieces' },
      { name: 'Cumin powder', quantity: '0.25', unit: 'teaspoon' },
      { name: 'Water', quantity: '2', unit: 'cups' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'In a saucepan, bring 2 cups of water to a gentle boil with crushed garlic and cumin.', durationMinutes: 4 },
      { step: 2, instruction: 'Add washed Moringa leaves and a small pinch of salt.', durationMinutes: 1 },
      { step: 3, instruction: 'Simmer gently for 6-8 minutes until leaves are tender and broth turns light green.', durationMinutes: 7 },
      { step: 4, instruction: 'Strain into a soup bowl and sip warm.', durationMinutes: 1 },
    ],
    dosage: '1 bowl with lunch or dinner',
    difficulty: 'MEDIUM',
    difficultyLevel: DifficultyLevel.MEDIUM,
    preparationTime: 15,
    prepTimeMinutes: 15,
    usage: 'INTERNAL',
    traditionalSource: 'Siddha and folk medicine',
    tags: ['immunity', 'vitality', 'heart-health'],
    precautions: ['Use cultivated leaves from clean sources', 'Do not consume roots or bark in culinary preparations'],
    contraindications: ['Pregnancy in high quantities', 'Severe renal impairment requiring potassium restriction'],
  },
  {
    title: 'Peppermint & Chamomile Comfort Brew',
    slug: 'peppermint-chamomile-comfort-brew',
    description:
      'A carminative and antispasmodic botanical infusion pairing peppermint leaves with chamomile flowers. Traditionally consumed after heavy meals to ease abdominal cramps and discomfort.',
    plantNames: ['Peppermint'],
    ingredients: [
      { name: 'Dried peppermint leaves', quantity: '1', unit: 'tablespoon', partUsed: PlantPart.LEAVES, notes: 'Mentha piperita' },
      { name: 'Dried chamomile flowers', quantity: '1', unit: 'tablespoon', notes: 'Matricaria chamomilla' },
      { name: 'Boiling water', quantity: '2', unit: 'cups' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Place herbs in a heat-resistant glass teapot or infuser.', durationMinutes: 1 },
      { step: 2, instruction: 'Pour freshly boiled water over herbs and cover immediately to retain essential oils.', durationMinutes: 1 },
      { step: 3, instruction: 'Steep for 7 minutes.', durationMinutes: 7 },
      { step: 4, instruction: 'Strain and serve warm, unsweetened or with a drop of honey.', durationMinutes: 1 },
    ],
    dosage: '1 cup as needed after meals',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 10,
    prepTimeMinutes: 10,
    usage: 'INTERNAL',
    traditionalSource: 'European and Greco-Arab Herbalism',
    tags: ['digestion', 'pain-relief', 'stress-sleep'],
    precautions: ['Steep covered to preserve volatile oils', 'Consult doctor if severe gastric symptoms persist'],
    contraindications: ['Severe gastroesophageal reflux disease (GERD) as mint may relax esophageal sphincter', 'Gallstones'],
  },
  {
    title: 'Shatavari Nourishing Elixir for Women',
    slug: 'shatavari-nourishing-elixir',
    description:
      'A classical Ayurvedic formulation featuring Shatavari root simmered with milk and saffron. Traditionally used across all stages of womanhood to support reproductive vitality and hormonal balance.',
    plantNames: ['Shatavari'],
    ingredients: [
      { name: 'Shatavari root powder', quantity: '1', unit: 'teaspoon', partUsed: PlantPart.ROOTS, notes: 'Asparagus racemosus' },
      { name: 'Warm organic cow milk or oat milk', quantity: '1', unit: 'cup' },
      { name: 'Saffron strands', quantity: '2-3', unit: 'strands' },
      { name: 'Ghee', quantity: '0.25', unit: 'teaspoon', notes: 'Clarified butter' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Warm milk in a small saucepan with saffron strands on low heat.', durationMinutes: 3 },
      { step: 2, instruction: 'Whisk in Shatavari powder and clarified butter (ghee).', durationMinutes: 2 },
      { step: 3, instruction: 'Simmer gently for 4 minutes to ensure root saponins integrate into the fats.', durationMinutes: 4 },
      { step: 4, instruction: 'Pour into a mug and drink warm.', durationMinutes: 1 },
    ],
    dosage: '1 cup daily with breakfast or before sleep',
    difficulty: 'MEDIUM',
    difficultyLevel: DifficultyLevel.MEDIUM,
    preparationTime: 12,
    prepTimeMinutes: 12,
    usage: 'INTERNAL',
    traditionalSource: 'Ashtanga Sangraha',
    tags: ['womens-health', 'reproductive', 'vitality'],
    precautions: ['Best absorbed when taken with healthy fats (ghee/milk)', 'Consult an obstetrician if pregnant'],
    contraindications: ['Estrogen-sensitive conditions without medical oversight', 'Known allergy to asparagus family plants'],
  },
  {
    title: 'Giloy & Black Pepper Immune Decoction',
    slug: 'giloy-pepper-immune-decoction',
    description:
      'A traditional bitter water decoction of Guduchi (Giloy) stem. Known traditionally in Ayurveda as Amrita for its potent immunomodulatory and antipyretic properties.',
    plantNames: ['Giloy'],
    ingredients: [
      { name: 'Giloy stem pieces or powder', quantity: '1', unit: 'teaspoon', partUsed: PlantPart.BARK, notes: 'Tinospora cordifolia' },
      { name: 'Black peppercorns', quantity: '2', unit: 'pieces', notes: 'Crushed' },
      { name: 'Water', quantity: '2', unit: 'cups' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Combine water, Giloy, and crushed pepper in an open pot.', durationMinutes: 2 },
      { step: 2, instruction: 'Boil on medium heat until the liquid reduces to half of its original volume.', durationMinutes: 10 },
      { step: 3, instruction: 'Filter through a fine mesh strainer.', durationMinutes: 1 },
      { step: 4, instruction: 'Allow to cool to lukewarm temperature before drinking.', durationMinutes: 2 },
    ],
    dosage: 'Quarter to half cup once daily',
    difficulty: 'MEDIUM',
    difficultyLevel: DifficultyLevel.MEDIUM,
    preparationTime: 18,
    prepTimeMinutes: 18,
    usage: 'INTERNAL',
    traditionalSource: 'Ayurvedic Formulary of India',
    tags: ['immunity', 'fever', 'antipyretic'],
    precautions: ['Bitter taste is an indicator of active alkaloids', 'Consult a doctor if high fever continues beyond 2 days'],
    contraindications: ['Autoimmune disorders without physician guidance', 'Pre-existing liver conditions without monitoring', 'Pregnancy'],
  },
  {
    title: 'Mulethi Throat Soothing Licorice Infusion',
    slug: 'mulethi-throat-soothing-infusion',
    description:
      'A naturally sweet root decoction of licorice (Mulethi). Traditionally used as a demulcent to coat the pharynx, soothe hoarseness, and calm dry throat irritation.',
    plantNames: ['Mulethi'],
    ingredients: [
      { name: 'Mulethi root stick or coarse powder', quantity: '1', unit: 'teaspoon', partUsed: PlantPart.ROOTS, notes: 'Glycyrrhiza glabra' },
      { name: 'Water', quantity: '2', unit: 'cups' },
      { name: 'Crushed green cardamom', quantity: '1', unit: 'piece' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Crush the licorice root lightly to expose interior fibers.', durationMinutes: 2 },
      { step: 2, instruction: 'Add to boiling water along with crushed cardamom.', durationMinutes: 1 },
      { step: 3, instruction: 'Simmer on low heat for 8 minutes to extract glycyrrhizin compounds.', durationMinutes: 8 },
      { step: 4, instruction: 'Strain and sip warm or use as a soothing gargle.', durationMinutes: 2 },
    ],
    dosage: '1 cup up to 2 times daily for short durations',
    difficulty: 'EASY',
    difficultyLevel: DifficultyLevel.EASY,
    preparationTime: 14,
    prepTimeMinutes: 14,
    usage: 'INTERNAL',
    traditionalSource: 'Dravyaguna Vijnana',
    tags: ['respiratory', 'cough', 'throat', 'digestion'],
    precautions: ['Do not use continuously for more than 4-6 weeks without a break', 'Consult physician if on hypertension medication'],
    contraindications: ['Hypertension (high blood pressure)', 'Hypokalemia (low potassium)', 'Chronic kidney or liver disease', 'Pregnancy'],
  },
  {
    title: 'Arjuna Bark Heart Tonic Infusion',
    slug: 'arjuna-bark-heart-tonic',
    description:
      'A classical Ayurvedic kshirapaka preparation of Terminalia arjuna bark simmered in water and milk. Traditionally prized for supporting cardiac muscle function and vascular tone.',
    plantNames: [],
    ingredients: [
      { name: 'Arjuna tree bark powder', quantity: '1', unit: 'teaspoon', partUsed: PlantPart.BARK, notes: 'Terminalia arjuna' },
      { name: 'Milk', quantity: '0.5', unit: 'cup' },
      { name: 'Water', quantity: '1.5', unit: 'cups' },
    ],
    preparationSteps: [
      { step: 1, instruction: 'Combine water, milk, and Arjuna bark powder in a saucepan.', durationMinutes: 2 },
      { step: 2, instruction: 'Simmer gently over low heat, stirring occasionally.', durationMinutes: 3 },
      { step: 3, instruction: 'Boil until only the volume of milk remains (water completely evaporates).', durationMinutes: 12 },
      { step: 4, instruction: 'Strain through a cloth or fine strainer and drink warm.', durationMinutes: 2 },
    ],
    dosage: 'Half cup once daily',
    difficulty: 'HARD',
    difficultyLevel: DifficultyLevel.ADVANCED,
    preparationTime: 20,
    prepTimeMinutes: 20,
    usage: 'INTERNAL',
    traditionalSource: 'Chakradatta Hridroga Chikitsa',
    tags: ['heart-health', 'cardio', 'blood-pressure'],
    precautions: ['Always consume under guidance of an Ayurvedic doctor or cardiologist', 'Do not discontinue prescribed cardiac medications'],
    contraindications: ['Acute heart failure or cardiac emergency', 'Allergy to Terminalia species'],
  },
];

export async function seedRemedies() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB for Remedies Seed');

  // Find or create admin/botanist user to assign as createdBy
  let author = await User.findOne({ role: { $in: ['ADMIN', 'BOTANIST'] } });
  if (!author) {
    author = await User.findOne({});
  }
  if (!author) {
    author = await User.create({
      email: 'botanist@herbalgarden.org',
      passwordHash: '$2a$12$K8/9zD/12345678901234uFakeHashForSeedPurposesOnly',
      displayName: 'Botanical Content Team',
      role: 'BOTANIST',
      isEmailVerified: true,
      isActive: true,
    });
    console.log('Created botanical content author user');
  }

  let insertedCount = 0;
  let skippedCount = 0;

  for (const item of REMEDIES_DATA) {
    const existing = await Remedy.findOne({ slug: item.slug });
    if (existing) {
      skippedCount++;
      continue;
    }

    // Try to resolve matching plant ObjectIds
    const plantIds: mongoose.Types.ObjectId[] = [];
    if (item.plantNames && item.plantNames.length > 0) {
      for (const pName of item.plantNames) {
        const p = await Plant.findOne({
          $or: [
            { commonName: { $regex: new RegExp(`^${pName}$`, 'i') } },
            { aliases: { $regex: new RegExp(`^${pName}$`, 'i') } },
          ],
        }).select('_id');
        if (p) plantIds.push(p._id as mongoose.Types.ObjectId);
      }
    }

    // Map ingredients with plantId if match found
    const ingredientsWithPlantId = await Promise.all(
      item.ingredients.map(async (ing) => {
        const found = await Plant.findOne({
          $or: [
            { commonName: { $regex: new RegExp(ing.name.split(' ')[0], 'i') } },
            { aliases: { $regex: new RegExp(ing.name.split(' ')[0], 'i') } },
          ],
        }).select('_id');
        return {
          ...ing,
          plantId: found?._id as mongoose.Types.ObjectId | undefined,
        };
      }),
    );

    await Remedy.create({
      title: item.title,
      slug: item.slug,
      description: item.description,
      plants: plantIds,
      ingredients: ingredientsWithPlantId,
      preparationSteps: item.preparationSteps,
      dosage: item.dosage,
      difficulty: item.difficulty,
      difficultyLevel: item.difficultyLevel,
      preparationTime: item.preparationTime,
      prepTimeMinutes: item.prepTimeMinutes,
      usage: item.usage,
      traditionalSource: item.traditionalSource,
      tags: item.tags,
      precautions: item.precautions,
      contraindications: item.contraindications,
      isPublished: true,
      isDeleted: false,
      createdBy: author._id,
    });

    insertedCount++;
  }

  console.log(`\n🌿 Remedies Seeding Complete: ${insertedCount} inserted, ${skippedCount} skipped (already existed). Total in DB: ${await Remedy.countDocuments()}`);
  await mongoose.disconnect();
}

if (require.main === module) {
  seedRemedies()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
