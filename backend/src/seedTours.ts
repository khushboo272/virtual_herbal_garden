import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Tour from './modules/tours/Tour.model';
import User from './modules/users/User.model';
import Plant from './modules/library/Plant.model';
import Remedy from './modules/remedies/Remedy.model';
import { UserRole } from './types';
import { connectDB, disconnectDB } from './core/config/db';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const TOURS_SEED_DATA = [
  {
    slug: 'virtual-herbal-garden-tour',
    title: 'Virtual Herbal Garden Tour',
    summary: 'A comprehensive foundational journey through botanical medicine, traditional wellness systems, and safe home remedies.',
    description: 'A comprehensive foundational journey through botanical medicine, traditional wellness systems, and safe home remedies.',
    level: 'BEGINNER',
    difficulty: 'EASY',
    healthCategory: 'immunity',
    tags: ['introduction', 'basics', 'ayurveda', 'botanical medicine'],
    estimatedMinutes: 27,
    sequential: true,
    isPublished: true,
    isFeatured: true,
    sortOrder: 1,
    coverImage: 'https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=1200&q=80',
    checkpoints: [
      {
        key: 'cp1',
        order: 1,
        title: 'Welcome to the Garden',
        summary: 'Introduction to medicinal plants and the origins of herbal traditions.',
        body: 'Welcome to your journey through the Virtual Herbal Garden. For thousands of years, humans have observed the healing power of plants across diverse traditional systems including Ayurveda, Traditional Chinese Medicine, and indigenous folk practices.\n\nNearly a quarter of all modern pharmaceutical medications trace their origin to botanical compounds. Secondary metabolites such as flavonoids, alkaloids, and polyphenols serve protective functions for the plant while providing bioactivity in humans. In traditional practice, herbs are rarely treated as isolated silver bullets; they are integrated with nutrition and balanced daily rhythms.\n\n*Traditional Caution:* Natural does not mean completely harmless. Always verify correct botanical identification and consult a healthcare practitioner before beginning regular use.',
        durationMinutes: 3,
        plantSlugs: ['aloe-vera'],
        remedySlugs: ['aloe-vera-burn-salve'],
        keyTakeaways: [
          'Plants produce medicinal secondary metabolites for environmental defense and resilience.',
          'Approximately 25% of modern drugs originate from plant compounds.',
          'Safe traditional herbal practice emphasizes gradual support rather than heroic dosing.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Approximately what percentage of modern pharmaceuticals are derived from plant compounds?',
              options: ['5%', '10%', '25%', '60%'],
              correctIndex: 2,
              explanation: 'About 25% of modern pharmaceutical compounds originate from botanical sources.',
            },
            {
              prompt: 'Which plant parts often produce protective secondary metabolites in botanical medicine?',
              options: ['Leaves and roots', 'Flowers and bark', 'All plant parts depending on species', 'Only synthetic extracts'],
              correctIndex: 2,
              explanation: 'Depending on the species, active secondary metabolites can concentrate in leaves, roots, bark, or flowers.',
            },
            {
              prompt: 'What is the primary guiding safety principle of traditional herbalism?',
              options: ['Consume maximum dosages immediately', 'Natural substances never have side effects', 'Consult professionals and respect precautions', 'Only consume raw unwashed plants'],
              correctIndex: 2,
              explanation: 'Traditional wellness emphasizes moderation, respect for precautions, and medical consultation.',
            },
          ],
        },
      },
      {
        key: 'cp2',
        order: 2,
        title: 'Immunity Boosters',
        summary: 'Explore botanicals traditionally revered for seasonal immune and respiratory vitality.',
        body: 'The immune system operates as an intricate, dynamic network of tissues, cells, and biochemical messengers. Rather than over-stimulating immunity, traditional herbs such as Tulsi and Giloy are classified as immunomodulators.\n\nTulsi (Ocimum tenuiflorum) contains eugenol, rosmarinic acid, and caryophyllene, which possess mild antimicrobial and respiratory-soothing attributes. In Ayurvedic texts, it is called Surasa and traditionally brewed during changing seasons to alleviate throat scratchiness and chilliness.\n\n*Traditional Caution:* Individuals with known bleeding disorders or those scheduled for surgery should limit high-dose Tulsi intake due to mild antiplatelet effects.',
        durationMinutes: 5,
        plantSlugs: ['tulsi', 'giloy', 'amla'],
        remedySlugs: ['tulsi-kadha-herbal-decoction', 'giloy-amla-immunity-shot'],
        keyTakeaways: [
          'Immunomodulators support the body natural resilience without aggressive over-stimulation.',
          'Tulsi provides warm, respiratory-clearing aromatic oils.',
          'Amla delivers natural vitamin C in a shelf-stable tannin complex.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'How is Tulsi traditionally classified in classical Ayurvedic terminology?',
              options: ['A harsh laxative', 'A rejuvenating rasayana and immunomodulator', 'A synthetic stimulant', 'A sedative narcotic'],
              correctIndex: 1,
              explanation: 'Tulsi is revered as a rasayana (rejuvenator) that harmonizes bodily functions.',
            },
            {
              prompt: 'Which vitamin is exceptionally abundant in fresh Amla (Indian Gooseberry)?',
              options: ['Vitamin D', 'Vitamin C', 'Vitamin B12', 'Vitamin K2'],
              correctIndex: 1,
              explanation: 'Amla is one of the richest known natural sources of heat-stable Vitamin C.',
            },
            {
              prompt: 'Why are herbs like Giloy and Tulsi called immunomodulators?',
              options: ['They temporarily paralyze immune cells', 'They support balanced immune function', 'They replace white blood cells entirely', 'They eliminate the need for clean water'],
              correctIndex: 1,
              explanation: 'Immunomodulators help normalize and balance immune system responses.',
            },
          ],
        },
      },
      {
        key: 'cp3',
        order: 3,
        title: 'Stress & Sleep Herbs',
        summary: 'Discover adaptogenic roots and calming nervines that help restore emotional equilibrium.',
        body: 'In modern life, chronic mental tension and disrupted sleep patterns trigger sustained elevations of cortisol, impairing digestion, focus, and cardiovascular recovery.\n\nAshwagandha (Withania somnifera) is among the most clinically researched adaptogens. Its withanolides interact with the hypothalamic-pituitary-adrenal (HPA) axis, helping the body buffer emotional and physiological stressors. Brahmi (Bacopa monnieri) complements this by supporting neurotransmitter synthesis and mental clarity without caffeine.\n\n*Traditional Caution:* Ashwagandha may stimulate thyroid hormone production and should be avoided by individuals with hyperthyroidism or during pregnancy.',
        durationMinutes: 5,
        plantSlugs: ['ashwagandha', 'brahmi'],
        remedySlugs: ['ashwagandha-moon-milk', 'brahmi-memory-ghee', 'chamomile-lavender-calm-infusion'],
        keyTakeaways: [
          'Adaptogens normalize bodily reactions to physical and mental stress.',
          'Withanolides in Ashwagandha gently moderate prolonged cortisol spikes.',
          'Brahmi is traditionally prepared in warm milk or ghee for cognitive relaxation.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Which active chemical group gives Ashwagandha its adaptogenic efficacy?',
              options: ['Caffeine crystals', 'Withanolides', 'Menthol esters', 'Capsaicin'],
              correctIndex: 1,
              explanation: 'Withanolides are steroidal lactones found in Withania somnifera that support adrenal resilience.',
            },
            {
              prompt: 'What organ system do adaptogenic herbs primarily help balance during prolonged stress?',
              options: ['The skeletal joints only', 'The HPA (Hypothalamic-Pituitary-Adrenal) axis', 'The dental enamel', 'The outer epidermis'],
              correctIndex: 1,
              explanation: 'Adaptogens modulate the endocrine HPA axis responsible for the systemic stress response.',
            },
            {
              prompt: 'When should Ashwagandha generally be avoided or approached with medical guidance?',
              options: ['During intense physical workouts', 'During pregnancy or untreated hyperthyroidism', 'When drinking water', 'After a healthy meal'],
              correctIndex: 1,
              explanation: 'Due to mild uterine stimulation and thyroid effects, pregnancy and hyperthyroidism warrant caution.',
            },
          ],
        },
      },
      {
        key: 'cp4',
        order: 4,
        title: 'Digestive Herbs',
        summary: 'Learn about botanical carminatives and digestive stimulants used across traditional cuisines.',
        body: 'In traditional medicine, healthy digestion (termed "Agni" or digestive fire in Ayurveda) is considered the cornerstone of systemic health. When digestion falters, metabolic sluggishness and discomfort follow.\n\nTurmeric (Curcuma longa) stimulates bile secretion and supports gut barrier integrity through its curcuminoid pigments. Combining turmeric with black pepper (piperine) enhances curcumin absorption by up to 2,000%. Licorice root (Mulethi) provides soothing demulcent protection to mucosal linings.\n\n*Traditional Caution:* High doses of curcumin or turmeric supplements may irritate existing gallstones or biliary tract obstructions.',
        durationMinutes: 5,
        plantSlugs: ['turmeric', 'mulethi'],
        remedySlugs: ['golden-milk-haldi-doodh', 'triphala-digestive-tea', 'peppermint-fennel-bloat-relief'],
        keyTakeaways: [
          'Carminative spices facilitate smooth gastrointestinal mobility.',
          'Piperine from black pepper dramatically amplifies turmeric bioavailability.',
          'Demulcent herbs like Mulethi coat and soothe irritated stomach linings.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Why is black pepper frequently paired with turmeric in traditional preparations?',
              options: ['To bleach the yellow color', 'Piperine enhances curcumin bioavailability', 'To add sugar content', 'To prevent herbs from dissolving'],
              correctIndex: 1,
              explanation: 'Piperine inhibits hepatic and intestinal glucuronidation, vastly increasing curcumin absorption.',
            },
            {
              prompt: 'What role does a demulcent herb such as Mulethi (Licorice) play in digestion?',
              options: ['It strips the stomach lining', 'It coats and protects mucous membranes', 'It causes intense vomiting', 'It acts as an antibiotic bleach'],
              correctIndex: 1,
              explanation: 'Demulcents contain mucilage and soothing glycyrrhizin that protect delicate gut membranes.',
            },
            {
              prompt: 'Which condition requires medical consultation before using concentrated turmeric supplements?',
              options: ['Active gallbladder or bile duct obstruction', 'Drinking herbal tea', 'Normal appetite', 'Walking in sunshine'],
              correctIndex: 0,
              explanation: 'Because turmeric promotes bile flow, active gallstones or biliary obstructions require medical care.',
            },
          ],
        },
      },
      {
        key: 'cp5',
        order: 5,
        title: 'Skin & Wound Healing',
        summary: 'Discover time-honored topical herbs that nurture epidermal repair and soothe inflammation.',
        body: 'Skin constitutes our largest organ, defending our internal environment against pathogens, ultraviolet radiation, and mechanical abrasions.\n\nAloe Vera inner leaf gel contains polysaccharides, acemannan, and enzymes that deliver cooling hydration to minor household burns and sunburns. Neem (Azadirachta indica), celebrated across South Asia as "the village pharmacy," contains nimbidin and gedunin, offering topical astringency and antibacterial support for blemish-prone complexions.\n\n*Traditional Caution:* Pure neem oil must never be ingested by young children, and unpasteurized Aloe latex from outer leaf rinds acts as a harsh irritant.',
        durationMinutes: 4,
        plantSlugs: ['aloe-vera', 'neem'],
        remedySlugs: ['aloe-vera-burn-salve', 'neem-face-pack-acne'],
        keyTakeaways: [
          'Acemannan in Aloe vera gel retains tissue moisture and supports collagen repair.',
          'Neem provides bitter astringent properties valuable for oily, blemish-prone skin.',
          'Always patch test topical botanical preparations on a small forearm area first.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Which clear polysaccharide in Aloe vera gel supports skin hydration and cellular recovery?',
              options: ['Acemannan', 'Caffeine', 'Sodium chloride', 'Starch'],
              correctIndex: 0,
              explanation: 'Acemannan is the primary bioactive polysaccharide in inner leaf Aloe gel.',
            },
            {
              prompt: 'Why has Neem traditionally been termed "the village pharmacy" in rural India?',
              options: ['It was sold in glass bottles', 'Every part has documented traditional wellness uses', 'It only grows inside drugstores', 'It replaces modern surgical hospitals'],
              correctIndex: 1,
              explanation: 'Neem bark, leaves, seeds, and flowers all have rich histories in traditional medicine.',
            },
            {
              prompt: 'What simple safety practice is recommended before applying a new herbal mask or paste?',
              options: ['Apply to the eyelids immediately', 'Conduct a 24-hour forearm patch test', 'Heat the paste until boiling', 'Combine with synthetic bleach'],
              correctIndex: 1,
              explanation: 'Patch testing on the inner forearm identifies potential allergic contact dermatitis before facial use.',
            },
          ],
        },
      },
      {
        key: 'cp6',
        order: 6,
        title: 'Herbs for Heart Health',
        summary: 'Traditional lifestyle tonics and botanical supports for cardiovascular vitality.',
        body: 'The human heart contracts over 100,000 times daily, distributing nutrients across tens of thousands of miles of vasculature.\n\nIn classical traditions, heart health is approached holistically through stress reduction, moderate physical movement, and gentle dietary botanicals. Classical herbal tonics utilize garlic and ginger for circulation, while adaptogens like Shatavari provide soothing systemic nourishment.\n\n*Traditional Caution:* Cardiovascular conditions (such as hypertension, arrhythmias, or heart failure) are serious medical conditions. Never discontinue or substitute prescribed cardiac medication with herbs without cardiologist supervision.',
        durationMinutes: 5,
        plantSlugs: ['shatavari', 'amla'],
        remedySlugs: ['garlic-honey-heart-syrup', 'shatavari-hormone-nourisher'],
        keyTakeaways: [
          'Cardiovascular botanicals support vascular elasticity and micro-circulation.',
          'Stress management is as vital to heart health as dietary botanicals.',
          'Botanical remedies must complement, never displace, emergency cardiac care.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What is the most crucial rule regarding herbal supplements and prescribed heart medications?',
              options: ['Always discontinue pharmaceuticals immediately', 'Herbs can never interact with blood thinners', 'Always consult your cardiologist before combining herbs with medications', 'Only take herbs in large unmeasured doses'],
              correctIndex: 2,
              explanation: 'Herbal compounds can interact with anticoagulants, beta-blockers, and blood pressure medications.',
            },
            {
              prompt: 'Which lifestyle practice is considered an indispensable companion to botanical heart tonics?',
              options: ['Chronic sleep deprivation', 'Stress moderation and gentle physical movement', 'Sedentary living', 'Excessive sodium intake'],
              correctIndex: 1,
              explanation: 'Traditional systems emphasize daily movement and emotional equanimity alongside herbal nutrition.',
            },
            {
              prompt: 'What organ system works in direct physiological harmony with the vascular system in distributing oxygen?',
              options: ['The respiratory lungs', 'The skeletal fingernails', 'The hair follicles', 'The tooth enamel'],
              correctIndex: 0,
              explanation: 'The cardiopulmonary circuit directly links pulmonary respiration with oxygen delivery.',
            },
          ],
        },
      },
    ],
  },
  {
    slug: 'kitchen-pharmacy-tour',
    title: 'Your Kitchen Pharmacy',
    summary: 'The most potent botanical allies often sit on your spice rack. Learn how turmeric, aloe, and neem support daily wellness.',
    description: 'The most powerful medicines may already be in your kitchen. Discover the healing properties of Turmeric, Aloe Vera, and common Indian herbs.',
    level: 'BEGINNER',
    difficulty: 'EASY',
    healthCategory: 'digestion',
    tags: ['kitchen', 'spices', 'ayurveda', 'digestion', 'home remedies'],
    estimatedMinutes: 14,
    sequential: true,
    isPublished: true,
    isFeatured: true,
    sortOrder: 2,
    coverImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80',
    checkpoints: [
      {
        key: 'kp-turmeric',
        order: 1,
        title: 'Turmeric — The Golden Rhizome',
        summary: 'Explore curcumin, the yellow polyphenolic compound celebrated across Asian cuisine and traditional medicine.',
        body: 'Turmeric (Curcuma longa) has been cultivated across the Indian subcontinent for over four millennia. Its rhizomes are dried and pulverized to produce the golden powder essential to curries and traditional poultices.\n\nModern research focuses heavily on curcuminoids, which demonstrate potent free-radical scavenging and inflammation-modulating properties. In Ayurvedic cooking, turmeric is lightly sauteed in ghee or oil; this ancient culinary technique has a scientific rationale, as curcumin is fat-soluble and requires dietary lipids for systemic absorption.\n\n*Traditional Caution:* Excessive consumption of raw turmeric powder on an empty stomach can cause mild stomach upset in sensitive individuals.',
        durationMinutes: 4,
        plantSlugs: ['turmeric'],
        remedySlugs: ['golden-milk-haldi-doodh', 'turmeric-joint-soother-paste'],
        keyTakeaways: [
          'Turmeric contains fat-soluble curcuminoids that support tissue balance.',
          'Cooking turmeric in healthy fats enhances its absorption.',
          'Golden Milk combines warm milk, turmeric, and black pepper for evening comfort.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Why is turmeric traditionally sauteed in oil or simmered with milk?',
              options: ['To change the color to blue', 'Curcumin is fat-soluble and absorbs better with dietary lipids', 'To evaporate the nutrients', 'To make it bitter'],
              correctIndex: 1,
              explanation: 'Lipids facilitate the absorption of hydrophobic curcumin across the gut wall.',
            },
            {
              prompt: 'Which plant part of Curcuma longa is utilized in cooking and traditional preparations?',
              options: ['The seeds', 'The rhizome (underground stem)', 'The thorns', 'The pollen'],
              correctIndex: 1,
              explanation: 'The fleshy underground rhizome stores the active yellow pigments and essential oils.',
            },
            {
              prompt: 'What common spice is paired with turmeric to optimize bioavailability?',
              options: ['Sugar cubes', 'Black pepper', 'Refined salt', 'Artificial food coloring'],
              correctIndex: 1,
              explanation: 'Piperine in black pepper inhibits enzymatic degradation of curcumin.',
            },
          ],
        },
      },
      {
        key: 'kp-aloe',
        order: 2,
        title: 'Aloe Vera — The Cooling Succulent',
        summary: 'How household aloe plants soothe burns, hydrate skin, and support digestive comfort.',
        body: 'Aloe vera thrives on sunny windowsills and dry gardens with minimal water requirements. When sliced open, the thick succulent leaves yield a mucilaginous, nutrient-rich inner gel.\n\nIn addition to topical burn care, traditional practitioners prepare diluted inner fillet juice to cool internal heat and promote bowel regularity. The gel contains enzymes like bradykinase, which helps reduce cutaneous irritation when applied topically after sun exposure.\n\n*Traditional Caution:* The yellow sap located directly beneath the green rind contains aloin, a strong stimulant laxative that should not be consumed by pregnant women or children.',
        durationMinutes: 3,
        plantSlugs: ['aloe-vera'],
        remedySlugs: ['aloe-vera-burn-salve'],
        keyTakeaways: [
          'Inner gel is cooling and protective; outer yellow latex is a harsh irritant.',
          'Widely used as immediate soothing relief for superficial heat and minor burns.',
          'Succulent leaves can be harvested sustainably by cutting the lowest outer leaves.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Which part of the Aloe vera leaf provides safe, cooling hydration for burns?',
              options: ['The yellow bitter latex', 'The clear inner fillet gel', 'The spiky outer leaf thorns', 'The root hairs'],
              correctIndex: 1,
              explanation: 'The clear inner gel is rich in polysaccharides and safe for topical soothing.',
            },
            {
              prompt: 'What substance in the outer rind of Aloe leaves should be rinsed away before culinary use?',
              options: ['Aloin (yellow bitter sap)', 'Pure water', 'Chlorophyll', 'Vitamin C'],
              correctIndex: 0,
              explanation: 'Aloin is an anthraquinone that can cause intense cramping and abdominal pain.',
            },
            {
              prompt: 'How should outer Aloe leaves be harvested to allow the plant to continue growing?',
              options: ['Uproot the entire plant', 'Cut the mature outermost leaves near the base', 'Cut off the top growth tip', 'Strip all leaves at once'],
              correctIndex: 1,
              explanation: 'Harvesting bottom outer leaves preserves the central meristem for continuous growth.',
            },
          ],
        },
      },
      {
        key: 'kp-neem',
        order: 3,
        title: 'Neem — The Purifying Tree',
        summary: 'Discover the bitter compounds that make neem leaves and oil legendary for skin balance.',
        body: 'Neem (Azadirachta indica) is widely planted throughout subtropical regions as a shade tree and traditional remedy. In Indian households, dried neem leaves are placed in grain stores to deter insects, while fresh twigs have been used as natural toothbrushes (datun) for centuries.\n\nNeem paste delivers strong astringent and antimicrobial qualities for managing acne and superficial skin rashes. Its profound bitterness is classified in Ayurveda as "Tikta rasa," renowned for pacifying excess Pitta (heat) and Kapha (congestion).\n\n*Traditional Caution:* Neem oil is for external use only. Internal ingestion of neem seed extracts is unsafe for children and pregnant individuals.',
        durationMinutes: 4,
        plantSlugs: ['neem'],
        remedySlugs: ['neem-face-pack-acne'],
        keyTakeaways: [
          'Neem provides bitter, cooling, and astringent botanical qualities.',
          'Traditional dental datun twigs help maintain gum health and oral hygiene.',
          'Never ingest pure neem seed oil; use topical preparations appropriately diluted.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What taste (rasa) is overwhelmingly dominant in neem leaves and bark?',
              options: ['Sweet', 'Salty', 'Bitter (Tikta)', 'Sour'],
              correctIndex: 2,
              explanation: 'Neem is exceptionally bitter, giving it cooling and astringent Ayurvedic attributes.',
            },
            {
              prompt: 'For what traditional hygienic purpose were neem twigs historically chewed in rural villages?',
              options: ['As tooth-cleaning twigs (datun)', 'To replace drinking water', 'As a substitute for rice', 'As candy'],
              correctIndex: 0,
              explanation: 'Fibrous neem twigs release antimicrobial sap while brushing teeth and gums.',
            },
            {
              prompt: 'What safety guideline applies to concentrated neem seed oil?',
              options: ['Drink three glasses daily', 'External application only; do not ingest', 'Feed to infants', 'Heat in frying pans for cooking'],
              correctIndex: 1,
              explanation: 'Neem seed oil is strictly for topical external use and must not be consumed.',
            },
          ],
        },
      },
      {
        key: 'kp-mulethi',
        order: 4,
        title: 'Mulethi — The Sweet Root',
        summary: 'Soften raspy throats and support mucosal health with sweet licorice root.',
        body: 'Mulethi (Glycyrrhiza glabra), or licorice root, has been dried and chewed by vocalists, teachers, and public speakers for generations. Its sweetness stems from glycyrrhizin, a saponin compound fifty times sweeter than sucrose without causing dental decay.\n\nWhen boiled into a warm tea, licorice root releases demulcent compounds that coat irritated pharyngeal tissues. It is a key constituent of Ayurvedic syrups and decoctions formulated for dry, tickling coughs.\n\n*Traditional Caution:* Prolonged excessive intake of real licorice root (more than 4-6 weeks continuously) can cause potassium depletion and elevated blood pressure.',
        durationMinutes: 3,
        plantSlugs: ['mulethi'],
        remedySlugs: ['mulethi-licorice-cough-syrup'],
        keyTakeaways: [
          'Glycyrrhizin provides soothing natural sweetness and mucosal barrier support.',
          'Ideal for dry, irritated throat conditions and hoarseness.',
          'Avoid excessive, long-term consumption if you have hypertension.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What active constituent makes Mulethi (Licorice) naturally sweet?',
              options: ['Refined sucrose', 'Glycyrrhizin', 'Saccharin', 'High fructose syrup'],
              correctIndex: 1,
              explanation: 'Glycyrrhizin is a natural glycoside with intense sweetness and demulcent action.',
            },
            {
              prompt: 'What throat sensation is Mulethi tea especially renowned for soothing?',
              options: ['Dry, raspy tickles and vocal strain', 'Cold sensations from ice cream', 'Tooth enamel sensitivity', 'Tongue temperature'],
              correctIndex: 0,
              explanation: 'Mulethi coats and hydrates dry, irritated pharyngeal mucous membranes.',
            },
            {
              prompt: 'Why should individuals with high blood pressure monitor excessive licorice root consumption?',
              options: ['It lowers blood pressure to zero', 'Glycyrrhizin can cause potassium loss and fluid retention', 'It makes blood transparent', 'It dissolves blood cells'],
              correctIndex: 1,
              explanation: 'Chronic high intake can mimic aldosterone excess, retaining sodium and elevating blood pressure.',
            },
          ],
        },
      },
    ],
  },
  {
    slug: 'stress-relief-adaptogens',
    title: 'Stress Relief & Adaptogens',
    summary: 'Explore science-backed adaptogenic botanicals that support nervous system balance and adrenal recovery.',
    description: 'Explore the science-backed adaptogenic herbs of Ayurveda. Understand how Ashwagandha, Brahmi, and Shatavari help your nervous system adapt to stress without side effects.',
    level: 'INTERMEDIATE',
    difficulty: 'MEDIUM',
    healthCategory: 'stress',
    tags: ['stress', 'adaptogens', 'nervines', 'sleep', 'ashwagandha', 'brahmi'],
    estimatedMinutes: 18,
    sequential: true,
    isPublished: true,
    isFeatured: true,
    sortOrder: 3,
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    checkpoints: [
      {
        key: 'sra-ashwagandha',
        order: 1,
        title: 'Ashwagandha — Restoring Adrenal Vitality',
        summary: 'The king of Ayurvedic adaptogens for physical vitality and balanced cortisol levels.',
        body: 'Ashwagandha (Withania somnifera) translates to "scent of a horse," conveying traditional beliefs that the root imparts vigor and endurance. Classified as a Medhya Rasayana, it has been prescribed in classical texts for general debility and nervous exhaustion.\n\nModern double-blind clinical trials suggest that standardized root extracts modulate circulating cortisol, promote sustained sleep architecture, and reduce self-reported anxiety scores. It acts as an amphoteric herb — calming excessive agitation while gently restoring vitality.\n\n*Traditional Caution:* May potentiate sedative and thyroid medications; consult your doctor before combining.',
        durationMinutes: 5,
        plantSlugs: ['ashwagandha'],
        remedySlugs: ['ashwagandha-moon-milk'],
        keyTakeaways: [
          'Helps maintain balanced cortisol levels during periods of ongoing stress.',
          'Supports restorative, uninterrupted sleep without morning grogginess.',
          'Traditionally combined with warm spiced milk before bedtime.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What physiological hormone is primarily modulated by adaptogens like Ashwagandha?',
              options: ['Insulin alone', 'Cortisol', 'Melanin', 'Gastric acid'],
              correctIndex: 1,
              explanation: 'Adaptogenic withanolides help buffer elevated cortisol produced by chronic stress.',
            },
            {
              prompt: 'How is Ashwagandha traditionally ingested in evening Ayurvedic wellness rituals?',
              options: ['Brewed with ice water', 'Simmered in warm milk with cardamom and nutmeg', 'Fried in refined sugar', 'Inhaled as smoke'],
              correctIndex: 1,
              explanation: 'Warm milk and warming spices like nutmeg support relaxation and absorption.',
            },
            {
              prompt: 'What does the term "amphoteric" signify in botanical medicine?',
              options: ['Toxic to amphibians', 'Able to normalize function in either direction (calming or tonifying)', 'Synthetic chemical compound', 'Soluble only in alcohol'],
              correctIndex: 1,
              explanation: 'Amphoteric herbs help the body adapt whether an endocrine response is hypo- or hyper-active.',
            },
          ],
        },
      },
      {
        key: 'sra-brahmi',
        order: 2,
        title: 'Brahmi — Clarity and Focus',
        summary: 'Nurture mental stamina, neural plasticity, and cognitive ease with water hyssop.',
        body: 'Brahmi (Bacopa monnieri) is a small creeping perennial native to marshlands and riverbanks across India. Named in reverence to Brahma, the Hindu creator of cosmic knowledge, it is the premier botanical for memory consolidation and neural clarity.\n\nActive bacoside compounds in Brahmi enhance dendritic branching in brain neurons, supporting synaptic communication and mental endurance. Unlike stimulant herbs, Brahmi provides tranquil focus without causing heart rate acceleration or agitation.\n\n*Traditional Caution:* May cause mild stomach cramps or nausea if taken on an empty stomach; consume alongside a meal.',
        durationMinutes: 4,
        plantSlugs: ['brahmi'],
        remedySlugs: ['brahmi-memory-ghee'],
        keyTakeaways: [
          'Bacosides support synaptic transmission and cognitive resilience.',
          'Provides clear, calm focus without jitters or palpitations.',
          'Best taken with dietary fats for optimal absorption and gastric tolerance.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Which natural habitat is native to the growth of Brahmi (Bacopa monnieri)?',
              options: ['Arid desert dunes', 'Moist marshlands and wetland margins', 'High alpine glaciers', 'Salt ocean trenches'],
              correctIndex: 1,
              explanation: 'Bacopa monnieri is a semi-aquatic wetland herb that thrives in damp, nutrient-rich soils.',
            },
            {
              prompt: 'What active saponin compounds in Brahmi support cognitive communication?',
              options: ['Bacosides', 'Capsaicinoids', 'Nicotine', 'Lycopene'],
              correctIndex: 0,
              explanation: 'Bacosides A and B are the extensively studied triterpenoid saponins in Bacopa.',
            },
            {
              prompt: 'Why is Brahmi traditionally infused into clarified butter (ghee)?',
              options: ['Ghee crosses the blood-brain barrier and aids lipophilic compound absorption', 'To make it turn solid green', 'Because water destroys all plants', 'To add sugar'],
              correctIndex: 0,
              explanation: 'Ayurvedic pharmacology uses medicated ghees (Ghritas) to deliver neuro-active botanicals.',
            },
          ],
        },
      },
      {
        key: 'sra-shatavari',
        order: 3,
        title: 'Shatavari — Deep Nourishment',
        summary: 'Rejuvenate depleted tissues and restore hormonal and emotional stability.',
        body: 'Shatavari (Asparagus racemosus) produces long, succulent tuberous roots that symbolize deep nourishment and replenishment. It is revered in Ayurveda as a premier female tonic, yet its adaptogenic and nervine qualities benefit all individuals recovering from physical exhaustion.\n\nRich in steroidal saponins, Shatavari coats and hydrates dried, depleted tissues. It exerts a gentle calming influence on the nervous system, helping alleviate stress-induced sleep disturbances and emotional volatility.\n\n*Traditional Caution:* Individuals with known allergies to plants in the Asparagaceae family should avoid Shatavari.',
        durationMinutes: 4,
        plantSlugs: ['shatavari'],
        remedySlugs: ['shatavari-hormone-nourisher'],
        keyTakeaways: [
          'Hydrates and replenishes bodily tissues depleted by chronic burnout.',
          'Contains bio-compatible steroidal saponins that support endocrine balance.',
          'Balances excess heat and agitation in the mind and digestive tract.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What botanical family does Shatavari (Asparagus racemosus) belong to?',
              options: ['Asparagaceae (Asparagus family)', 'Cactaceae (Cactus family)', 'Pinaceae (Pine family)', 'Fungi kingdom'],
              correctIndex: 0,
              explanation: 'Shatavari is a climbing perennial member of the Asparagaceae family.',
            },
            {
              prompt: 'In classical Ayurvedic medicine, what quality (guna) does Shatavari predominantly impart?',
              options: ['Drying and depleting', 'Heavy, cooling, and deeply nourishing (Snigdha and Sheeta)', 'Burning hot', 'Corrosive'],
              correctIndex: 1,
              explanation: 'Its sweet and cooling attributes soothe internal heat and restore depleted bodily reserves.',
            },
            {
              prompt: 'Which part of the Shatavari plant holds the therapeutic reserves?',
              options: ['The fibrous underground tuberous roots', 'The sharp leaf spines', 'The pollen grains', 'The bark of the tree'],
              correctIndex: 0,
              explanation: 'The succulent tuberous roots store saponins, minerals, and mucilage.',
            },
          ],
        },
      },
      {
        key: 'sra-tulsi',
        order: 4,
        title: 'Tulsi — Emotional Upliftment',
        summary: 'Clear mental fog and uplift low spirits with adaptogenic Holy Basil tea.',
        body: 'In addition to its physical immune attributes, Tulsi is celebrated for its uplifting psychological effects. Its fragrant, aromatic leaves contain linalool and eugenol, which exert a grounding, clarifying influence on the senses.\n\nDaily sipping of Tulsi tea is a cornerstone ritual in Ayurvedic homes to transition between workday stress and evening peace. It gently reduces stress-related tension headaches and clears mental fatigue.\n\n*Traditional Caution:* Holy basil may mildly lower blood glucose levels; diabetic individuals monitoring medication should remain attentive.',
        durationMinutes: 5,
        plantSlugs: ['tulsi'],
        remedySlugs: ['tulsi-kadha-herbal-decoction', 'chamomile-lavender-calm-infusion'],
        keyTakeaways: [
          'Aromatic terpenes in Tulsi provide gentle psychological upliftment.',
          'An excellent caffeine-free evening ritual to unwind after mental strain.',
          'Cultivates presence, emotional calm, and clear respiration.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Which aromatic terpene found in Tulsi contributes to its relaxing aroma?',
              options: ['Linalool', 'Cyanide', 'Sulfuric acid', 'Formaldehyde'],
              correctIndex: 0,
              explanation: 'Linalool is a naturally occurring terpene alcohol famous for its calming scent profile.',
            },
            {
              prompt: 'Why is Tulsi tea preferred over caffeinated tea during evening stress unwinding?',
              options: ['It causes intense sleeplessness', 'It is caffeine-free and promotes calm without disrupting melatonin', 'It contains artificial sleep sedatives', 'It requires three hours to brew'],
              correctIndex: 1,
              explanation: 'Free of caffeine, Tulsi tea supports autonomic relaxation before bedtime.',
            },
            {
              prompt: 'What mild metabolic effect of Tulsi warrants attention in diabetic patients taking medication?',
              options: ['It may mildly assist in reducing blood glucose', 'It turns blood into vinegar', 'It triples blood sugar in minutes', 'It disables insulin completely'],
              correctIndex: 0,
              explanation: 'Because Tulsi has mild glucose-balancing effects, monitoring prevents unexpected hypoglycemia.',
            },
          ],
        },
      },
    ],
  },
  {
    slug: 'ayurvedic-immunity-garden',
    title: 'Ayurvedic Immunity Garden',
    summary: 'Walk through classical herbs documented in ancient texts to foster resilient bodily defenses and vitality.',
    description: 'Walk through the most potent immunity-boosting herbs documented in the Charaka Samhita. Learn how Tulsi, Giloy, and Amla work synergistically to strengthen your natural defenses.',
    level: 'BEGINNER',
    difficulty: 'EASY',
    healthCategory: 'immunity',
    tags: ['immunity', 'ayurveda', 'tulsi', 'giloy', 'amla', 'ojas'],
    estimatedMinutes: 16,
    sequential: true,
    isPublished: true,
    isFeatured: true,
    sortOrder: 4,
    coverImage: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
    checkpoints: [
      {
        key: 'aig-tulsi',
        order: 1,
        title: 'Tulsi — The Sacred Shield',
        summary: 'Begin your journey with the queen of herbs, revered for millennia as an immune modulator.',
        body: 'Tulsi (Holy Basil) occupies a sanctified place in Indian courtyards, where it is planted for environmental purification and family wellness. Its leaves contain eugenol, rosmarinic acid, and ursolic acid, which provide natural antioxidant defense against environmental free radicals.\n\nTraditional physicians recommend chewing five to seven fresh leaves each morning or sipping a warm water infusion to support upper respiratory vitality during seasonal weather transitions.\n\n*Traditional Caution:* Avoid chewing fresh leaves with fragile dental restorations as the natural compounds may mildly stain tooth enamel; swallowing with warm water or brewing as tea is preferred.',
        durationMinutes: 4,
        plantSlugs: ['tulsi'],
        remedySlugs: ['tulsi-kadha-herbal-decoction'],
        keyTakeaways: [
          'Known as the "Queen of Herbs" for versatile adaptogenic resilience.',
          'Provides antioxidant defense against environmental oxidants.',
          'Traditionally prepared as warm tea with ginger during monsoons and winter.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What honorific botanical title is frequently bestowed upon Tulsi across India?',
              options: ['The Poison Ivy', 'The Queen of Herbs', 'The Desert Thistle', 'The Timber Giant'],
              correctIndex: 1,
              explanation: 'Tulsi is revered throughout Ayurveda as the supreme "Queen of Herbs" for daily health.',
            },
            {
              prompt: 'Which season traditionally sees the highest ceremonial and medicinal consumption of Tulsi tea?',
              options: ['During extreme arid heat only', 'Seasonal weather changes (monsoon and winter transitions)', 'Only during midnight hours', 'Never during daytime'],
              correctIndex: 1,
              explanation: 'Seasonal weather transitions historically challenge immunity, prompting warm Tulsi brews.',
            },
            {
              prompt: 'What compound in Tulsi leaves provides their signature warm, clove-like aromatic scent?',
              options: ['Eugenol', 'Menthol', 'Camphor', 'Capsaicin'],
              correctIndex: 0,
              explanation: 'Eugenol is the phenolic aromatic compound responsible for the warm aroma and mild numbing quality.',
            },
          ],
        },
      },
      {
        key: 'aig-giloy',
        order: 2,
        title: 'Giloy — The Root of Immortality',
        summary: 'Discover Amrita, the climbing vine recommended for cellular vitality and fever resilience.',
        body: 'Giloy (Tinospora cordifolia) is a large, glabrous climbing shrub with heart-shaped leaves. Its Sanskrit name Amrita literally means "nectar of immortality," reflecting legends that drops of divine nectar fell to earth to germinate this resilient plant.\n\nGiloy is celebrated for balancing all three Ayurvedic doshas. It acts as an antipyretic (fever-reducing) rasayana and supports liver detoxification pathways. During seasonal viral outbreaks, decoctions of the bitter mature stems are widely consumed to maintain balanced leukocyte counts.\n\n*Traditional Caution:* Because Giloy stimulates immune cell proliferation, individuals with active autoimmune conditions should use it under physician supervision.',
        durationMinutes: 4,
        plantSlugs: ['giloy'],
        remedySlugs: ['giloy-amla-immunity-shot'],
        keyTakeaways: [
          'Revered as "Amrita" for its cellular detoxifying and rejuvenating attributes.',
          'Mature vine stems contain the highest concentration of bitter tinosporin glycosides.',
          'Balances body temperature and supports natural liver defense.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What does the classical Sanskrit name for Giloy ("Amrita") translate to in English?',
              options: ['Nectar of Immortality', 'Deadly Poison', 'Sweet Sugarcane', 'Mountain Stone'],
              correctIndex: 0,
              explanation: 'Amrita translates to nectar of immortality, celebrating its revitalizing rasayana properties.',
            },
            {
              prompt: 'Which part of the climbing Giloy vine is primarily harvested for traditional decoctions?',
              options: ['The aerial flowers', 'The mature woody green stems', 'The underground seeds', 'The thorn tips'],
              correctIndex: 1,
              explanation: 'The succulent mature stems contain the active bitter glycosides and alkaloids.',
            },
            {
              prompt: 'What bodily organ system relies on Giloy for natural metabolic filtering and detoxification?',
              options: ['The skeletal joints', 'The liver and lymphatic system', 'The hair roots', 'The outer fingernails'],
              correctIndex: 1,
              explanation: 'Giloy demonstrates hepatoprotective properties, supporting liver clearance mechanisms.',
            },
          ],
        },
      },
      {
        key: 'aig-amla',
        order: 3,
        title: 'Amla — Nature’s Vitamin C Powerhouse',
        summary: 'End with the cornerstone of Chyawanprash, rich in bioflavonoids and stable ascorbic acid.',
        body: 'Amla (Phyllanthus emblica), also known as Indian Gooseberry, is considered by many Ayurvedic scholars to be the most potent fruit on earth. A single small fruit contains as much natural Vitamin C as twenty fresh oranges.\n\nCrucially, the Vitamin C in Amla is bound within a dense matrix of hydrolyzable tannins (such as emblicanin A and B). This unique molecular architecture prevents ascorbic acid degradation even when the fruit is cooked or dried, ensuring sustained antioxidant protection.\n\n*Traditional Caution:* Due to its sour astringency, eating raw Amla before sleep may occasionally cause mild throat dryness.',
        durationMinutes: 4,
        plantSlugs: ['amla'],
        remedySlugs: ['giloy-amla-immunity-shot'],
        keyTakeaways: [
          'Contains up to 20 times the Vitamin C concentration of fresh oranges.',
          'Natural tannins preserve ascorbic acid against heat degradation.',
          'Foundational primary ingredient in classical Chyawanprash jam.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Why does the Vitamin C in Amla remain stable even after boiling or drying?',
              options: ['It is a synthetic plastic compound', 'It is protected within a complex tannin and bioflavonoid matrix', 'It has zero vitamin content', 'Because the fruit is frozen'],
              correctIndex: 1,
              explanation: 'Tannins protect ascorbic acid molecules from oxidation and thermal breakdown.',
            },
            {
              prompt: 'What legendary ancient herbal jam features Amla as its primary central ingredient?',
              options: ['Strawberry preserve', 'Chyawanprash', 'Orange marmalade', 'Peanut butter'],
              correctIndex: 1,
              explanation: 'Chyawanprash is formulated around fresh Amla pulp cooked with ghee, honey, and herbs.',
            },
            {
              prompt: 'How many of the six Ayurvedic tastes (shad rasa) does Amla possess?',
              options: ['Only one (salty)', 'Five out of six (lacking only salty)', 'Zero', 'All six tastes simultaneously'],
              correctIndex: 1,
              explanation: 'Amla possesses sweet, sour, bitter, pungent, and astringent tastes, lacking only salty.',
            },
          ],
        },
      },
      {
        key: 'aig-turmeric',
        order: 4,
        title: 'Turmeric & Pepper — Synergistic Support',
        summary: 'Understand the traditional combination that maximizes botanical absorption.',
        body: 'Classical formulas rarely rely on a solitary herb. Ayurveda emphasizes "Samyoga" — the art of combining botanicals so their individual bioactivities reinforce one another while buffering potential side effects.\n\nThe pairing of Turmeric with Amla and Ginger represents classical synergy in practice. While turmeric modulates systemic inflammation, black pepper and ginger stimulate digestive enzymes to ensure complete assimilation.\n\n*Traditional Caution:* Always prepare botanical tonics with filtered water and wholesome natural ingredients.',
        durationMinutes: 4,
        plantSlugs: ['turmeric'],
        remedySlugs: ['golden-milk-haldi-doodh'],
        keyTakeaways: [
          'Synergistic formulation combines complementary herbs to amplify benefits.',
          'Warming spices optimize nutrient absorption across gastrointestinal membranes.',
          'Consistency in daily wellness habits yields superior results compared to acute bursts.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What Ayurvedic formulation principle describes the harmonious synergy of combining herbs?',
              options: ['Samyoga (synergistic combination)', 'Solitary isolation', 'Random mixing', 'Artificial distillation'],
              correctIndex: 0,
              explanation: 'Samyoga is the science of harmoniously pairing botanicals for mutual enhancement.',
            },
            {
              prompt: 'Why are warming carminatives often added to tonic formulations?',
              options: ['To destroy all active nutrients', 'To support circulation and gastrointestinal absorption', 'To freeze the decoction', 'To make it smell like vinegar'],
              correctIndex: 1,
              explanation: 'Warming herbs enhance digestive Agni, ensuring complete assimilation of heavy tonics.',
            },
            {
              prompt: 'What is the most effective approach to botanical wellness for long-term health?',
              options: ['Irregular massive doses once a year', 'Gentle, consistent daily routines with appropriate rest', 'Never drinking clean water', 'Ignoring all precautions'],
              correctIndex: 1,
              explanation: 'Traditional longevity emphasizes rhythmic, balanced daily habits over extreme measures.',
            },
          ],
        },
      },
    ],
  },
  {
    slug: 'skin-wound-healing-trail',
    title: 'Skin & Wound Healing Trail',
    summary: 'A guided walk through topical botanical allies that support cutaneous repair, soothe irritations, and protect skin barrier health.',
    description: 'A guided walk through topical botanical allies that support cutaneous repair, soothe irritations, and protect skin barrier health.',
    level: 'BEGINNER',
    difficulty: 'EASY',
    healthCategory: 'skin-care',
    tags: ['skin', 'wound healing', 'aloe-vera', 'neem', 'turmeric', 'topical'],
    estimatedMinutes: 15,
    sequential: true,
    isPublished: true,
    isFeatured: false,
    sortOrder: 5,
    coverImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
    checkpoints: [
      {
        key: 'swh-aloe',
        order: 1,
        title: 'Aloe Vera — Immediate Burn Comfort',
        summary: 'Explore how succulent gel provides moisture barrier support for minor abrasions and thermal burns.',
        body: 'Aloe vera has stood as humanity premier superficial burn remedy across Mediterranean, African, and Asian civilizations. Its thick parenchyma tissue stores 99% water bound in structural glucomannans.\n\nApplying cold, freshly harvested inner leaf gel to clean minor first-degree burns reduces localized tissue temperature and accelerates epithelial re-growth without sealing in heat.\n\n*Traditional Caution:* Deep, blistered second-degree or third-degree burns require emergency medical triage, not home plant gel.',
        durationMinutes: 4,
        plantSlugs: ['aloe-vera'],
        remedySlugs: ['aloe-vera-burn-salve'],
        keyTakeaways: [
          'Ideal immediate cooling support for minor household kitchen burns and sunburn.',
          'Never apply unwashed leaf skin or greasy butter to fresh burns.',
          'Seek immediate medical care for extensive or blistering thermal injuries.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'For what severity of burn is Aloe vera gel suitable as a supportive home measure?',
              options: ['Deep third-degree muscle burns', 'Minor superficial first-degree redness and sunburn', 'Chemical eye burns', 'Electrical high-voltage injuries'],
              correctIndex: 1,
              explanation: 'Only mild superficial sunburns or minor kitchen heat redness should be managed at home.',
            },
            {
              prompt: 'What common kitchen mistake should be avoided on fresh thermal burns?',
              options: ['Applying cold running water', 'Applying heavy butter or grease that traps heat', 'Keeping the area clean', 'Staying hydrated'],
              correctIndex: 1,
              explanation: 'Grease and heavy fats insulate tissue, preventing heat escape and worsening burn depth.',
            },
            {
              prompt: 'What component of Aloe vera leaf gel holds its moisture against evaporation?',
              options: ['Complex polysaccharides and glucomannans', 'Fine sand particles', 'Alcohol vapor', 'Iron filings'],
              correctIndex: 0,
              explanation: 'Glucomannans form a hydrophilic mesh that seals in hydration.',
            },
          ],
        },
      },
      {
        key: 'swh-turmeric',
        order: 2,
        title: 'Turmeric Paste — Traditional Antiseptic',
        summary: 'Learn the ancient science behind applying yellow rhizome paste to minor cuts and scrapes.',
        body: 'In rural Indian communities, a small cut or skin scrape is immediately dusted with pure dry turmeric powder. The astringent curcuminoids assist in minor wound closure while discouraging bacterial colonization.\n\nModern dermatology has validated turmeric topical anti-inflammatory properties, demonstrating that curcumin modulates inflammatory cytokines like TNF-alpha and promotes local fibroblast migration.\n\n*Traditional Caution:* Turmeric creates a vivid golden-yellow stain on clothing and skin that can persist for several days.',
        durationMinutes: 3,
        plantSlugs: ['turmeric'],
        remedySlugs: ['turmeric-joint-soother-paste'],
        keyTakeaways: [
          'Possesses mild natural astringent and antibacterial properties.',
          'Assists in drying weepy minor skin abrasions.',
          'Be prepared for significant yellow staining on textiles.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What traditional property of turmeric helps dry minor surface abrasions?',
              options: ['Its astringent, tissue-toning nature', 'Its lubricating motor oil', 'Its ability to melt skin', 'Its sweet sugar crystallization'],
              correctIndex: 0,
              explanation: 'Astringent compounds gently contract superficial capillaries and dry minor weeping.',
            },
            {
              prompt: 'What temporary cosmetic side effect occurs when applying turmeric topically?',
              options: ['Skin turns bright blue forever', 'Vivid yellow staining that washes off after a few days', 'Hair growth stops immediately', 'Skin turns into glass'],
              correctIndex: 1,
              explanation: 'Curcumin pigments naturally dye the epidermis and clothing a vibrant yellow.',
            },
            {
              prompt: 'Why should deep, puncture wounds never be sealed with raw home powders?',
              options: ['They always turn into gold', 'Deep puncture wounds can harbor anaerobic tetanus bacteria requiring medical attention', 'Because turmeric smells like mint', 'It prevents sunlight'],
              correctIndex: 1,
              explanation: 'Deep or dirty puncture wounds require professional irrigation and tetanus vaccination.',
            },
          ],
        },
      },
      {
        key: 'swh-neem',
        order: 3,
        title: 'Neem Clarifying Wash',
        summary: 'Target blemishes and soothe itchy scalp issues with boiled neem leaf water.',
        body: 'Boiling fresh neem leaves produces a light emerald infusion renowned in traditional dermatology. Used as a cooling face splash or scalp rinse, neem water helps regulate excess sebum without stripping the skin natural lipid barrier.\n\nIts active triterpenoids, azadirachtin and nimbin, inhibit acne-associated bacteria while reducing localized redness and itching.\n\n*Traditional Caution:* Avoid getting neem infusion into the eyes as its bitter astringency causes intense temporary stinging.',
        durationMinutes: 4,
        plantSlugs: ['neem'],
        remedySlugs: ['neem-face-pack-acne'],
        keyTakeaways: [
          'A gentle botanical face splash for oily and blemish-prone complexions.',
          'Helps soothe itchy scalp and minor dandruff issues.',
          'Flush eyes with plain water if accidental contact occurs.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'How is fresh neem leaf water traditionally prepared for dermatological cleansing?',
              options: ['By deep frying in butter', 'By simmering washed leaves in water and allowing to cool', 'By mixing with gasoline', 'By freezing overnight with salt'],
              correctIndex: 1,
              explanation: 'Simmering leaves extracts water-soluble tannins and bitter limonoids safely.',
            },
            {
              prompt: 'What skin type benefits most from the clarifying, astringent qualities of neem?',
              options: ['Severe cracking xerosis', 'Oily, congested, and blemish-prone skin', 'Burned open blisters', 'Infant diaper rash'],
              correctIndex: 1,
              explanation: 'Neem bitter and astringent profile helps regulate excess sebum and oiliness.',
            },
            {
              prompt: 'What simple precaution should be observed when rinsing the face with neem water?',
              options: ['Keep eyes tightly closed to prevent stinging', 'Drink the dirty bath water', 'Never wash with clean water again', 'Apply direct heat torches'],
              correctIndex: 0,
              explanation: 'Neem tannins can cause harmless but uncomfortable ocular stinging.',
            },
          ],
        },
      },
      {
        key: 'swh-shatavari',
        order: 4,
        title: 'Hydrating Botanical Barrier Support',
        summary: 'Learn how internal hydration and soothing roots reflect upon dermal radiance.',
        body: 'Traditional healers always observed that radiant, supple skin begins with internal systemic hydration and gut equilibrium. When internal heat or dehydration prevails, topical treatments provide only temporary cosmetic relief.\n\nNourishing herbs like Shatavari and Amla provide foundational hydration and antioxidant support from within, defending cellular membranes against premature oxidative wear.\n\n*Traditional Caution:* Always drink adequate clean water alongside herbal supplements to support kidney and skin elimination pathways.',
        durationMinutes: 4,
        plantSlugs: ['shatavari', 'amla'],
        remedySlugs: ['shatavari-hormone-nourisher'],
        keyTakeaways: [
          'External skin integrity mirrors internal hydration and nutritional vitality.',
          'Antioxidants from Amla protect cutaneous collagen from oxidative breakdown.',
          'Balanced sleep and hydration remain the ultimate foundation of dermatological wellness.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What internal lifestyle factor is most directly reflected in skin elasticity and barrier resilience?',
              options: ['Chronic dehydration', 'Adequate cellular hydration and balanced nutrition', 'Excessive alcohol intake', 'Zero dietary sleep'],
              correctIndex: 1,
              explanation: 'True epidermal moisture and elasticity depend fundamentally on internal fluid balance.',
            },
            {
              prompt: 'How does Amla antioxidant profile benefit structural skin proteins like collagen?',
              options: ['It dissolves collagen into liquid', 'Vitamin C and polyphenols assist in collagen synthesis and protect against free radicals', 'It converts collagen into bone', 'It turns skin green'],
              correctIndex: 1,
              explanation: 'Vitamin C is an essential enzymatic cofactor for stable collagen polypeptide cross-linking.',
            },
            {
              prompt: 'What constitutes the best long-term strategy for skin health?',
              options: ['Relying solely on expensive concealer', 'Holistic synergy of nutrition, hydration, sleep, and gentle botanicals', 'Never washing the face', 'Smoking tobacco'],
              correctIndex: 1,
              explanation: 'Dermatological radiance is an emergent property of whole-body balance and healthy habits.',
            },
          ],
        },
      },
    ],
  },
  {
    slug: 'digestive-health-trail',
    title: 'Digestive Health Trail',
    summary: 'A journey into digestive vitality, gut soothing botanicals, and traditional spices that kindle comfortable digestion.',
    description: 'A journey into digestive vitality, gut soothing botanicals, and traditional spices that kindle comfortable digestion.',
    level: 'INTERMEDIATE',
    difficulty: 'MEDIUM',
    healthCategory: 'digestion',
    tags: ['digestion', 'gut', 'spices', 'ayurveda', 'turmeric', 'mulethi', 'aloe-vera'],
    estimatedMinutes: 16,
    sequential: true,
    isPublished: true,
    isFeatured: false,
    sortOrder: 6,
    coverImage: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80',
    checkpoints: [
      {
        key: 'dht-agni',
        order: 1,
        title: 'The Concept of Agni (Digestive Fire)',
        summary: 'Discover the ancient Ayurvedic perspective on metabolic assimilation and vitality.',
        body: 'In classical Ayurveda, "Agni" represents the metabolic fire responsible for digesting not only physical food, but also sensory experiences and emotions. When Agni burns steadily, nutrients are converted into clear vitality (Ojas); when it is smothered or turbulent, undigested residues (Ama) accumulate.\n\nWarming spices like ginger, black pepper, and turmeric are traditionally utilized before meals to gently awaken gastric enzyme secretion without causing acid irritation.\n\n*Traditional Caution:* Individuals with active peptic ulcers or acute acid reflux should avoid pungent heating spices.',
        durationMinutes: 4,
        plantSlugs: ['turmeric'],
        remedySlugs: ['triphala-digestive-tea', 'clove-ginger-digestive-drops'],
        keyTakeaways: [
          'Agni governs nutrient breakdown, cellular absorption, and waste clearance.',
          'Gentle carminatives stimulate digestive enzymes ahead of heavy meals.',
          'Eat main meals when digestive capacity is strongest around midday.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What does the term "Agni" represent in classical Ayurvedic physiology?',
              options: ['Cold ice water', 'The digestive and metabolic fire of the body', 'A bone disorder', 'A musical instrument'],
              correctIndex: 1,
              explanation: 'Agni encompasses all enzymatic, gastric, and cellular metabolic transformation.',
            },
            {
              prompt: 'What metabolic consequence is said to occur when digestive fire is chronically sluggish?',
              options: ['Superhuman strength', 'Accumulation of toxic, undigested residues (Ama)', 'Complete immunity from illness', 'Immediate weight loss'],
              correctIndex: 1,
              explanation: 'Ama refers to stagnant metabolic byproducts resulting from incomplete digestion.',
            },
            {
              prompt: 'When is natural digestive fire traditionally considered to peak during the 24-hour cycle?',
              options: ['At 2:00 AM midnight', 'Around midday when the sun is highest (12:00 PM - 1:30 PM)', 'Only after sunset', 'Never during daytime'],
              correctIndex: 1,
              explanation: 'Solar rhythms correlate with peak gastrointestinal motility and pancreatic enzyme release.',
            },
          ],
        },
      },
      {
        key: 'dht-mulethi',
        order: 2,
        title: 'Mulethi — Protecting the Mucosal Lining',
        summary: 'Explore licorice root soothing effects on gastric acidity and stomach membranes.',
        body: 'While warming spices awaken sluggish digestion, demulcent herbs protect and soothe sensitive stomachs prone to burning sensations. Mulethi (Licorice root) is celebrated for its ability to increase the lifespan of gastric mucosal cells.\n\nIts glycyrrhizin and flavonoids stimulate the formation of protective mucin layers that shield the stomach wall from gastric hydrochloric acid. Chewing a small piece of licorice root twenty minutes before eating is a beloved folk remedy for post-meal heart-burn.\n\n*Traditional Caution:* Do not consume deglycyrrhizinated licorice or whole root in excess if you have kidney compromise or heart failure.',
        durationMinutes: 4,
        plantSlugs: ['mulethi'],
        remedySlugs: ['mulethi-licorice-cough-syrup'],
        keyTakeaways: [
          'Demulcent herbs provide physical coating protection to delicate epithelial linings.',
          'Encourages natural mucin secretion to resist aggressive stomach acids.',
          'Best taken shortly before meals to prepare the digestive barrier.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'How does Mulethi (Licorice) protect the delicate inner lining of the stomach?',
              options: ['By mechanically scraping the stomach with rough wood', 'By encouraging protective mucin secretion against stomach acids', 'By paralyzing digestion completely', 'By freezing gastric fluids'],
              correctIndex: 1,
              explanation: 'Mulethi stimulates mucosal goblet cells to secrete a thicker protective barrier layer.',
            },
            {
              prompt: 'When is demulcent licorice traditionally taken to prevent post-prandial acid burning?',
              options: ['Midnight while asleep', 'Approximately 15-20 minutes before meals', 'Three days after eating', 'Never before food'],
              correctIndex: 1,
              explanation: 'Taking demulcents before meals prepares a protective barrier ahead of acid secretion.',
            },
            {
              prompt: 'What electrolyte can become depleted with excessive whole licorice root consumption?',
              options: ['Potassium', 'Lead', 'Mercury', 'Titanium'],
              correctIndex: 0,
              explanation: 'High glycyrrhizin levels can inhibit 11-beta-HSD2, leading to renal potassium excretion.',
            },
          ],
        },
      },
      {
        key: 'dht-aloe',
        order: 3,
        title: 'Aloe Vera Juice — Cooling Gut Inflammation',
        summary: 'Discover how fresh inner fillet aloe supports regular elimination and GI comfort.',
        body: 'For individuals suffering from intestinal heat, irritable bowel sensations, or sporadic constipation, pure inner fillet Aloe vera juice provides gentle, cooling relief.\n\nRich in bio-active enzymes, amino acids, and soothing acemannan, Aloe helps calm colonic inflammation while gently softening stool consistency. In traditional Ayurvedic medicine, it is known as Kumari — the youthful rejuvenator — and considered a gentle pacifier of aggravated Pitta.\n\n*Traditional Caution:* Commercial aloe drinks loaded with refined sugar worsen gut dysbiosis; choose pure decolorized inner fillet juice.',
        durationMinutes: 4,
        plantSlugs: ['aloe-vera'],
        remedySlugs: ['aloe-vera-burn-salve', 'triphala-digestive-tea'],
        keyTakeaways: [
          'Inner fillet juice cools intestinal irritation and encourages regular transit.',
          'Avoid artificially sweetened commercial juices containing artificial preservatives.',
          'Discontinue if loose cramping stools develop.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What Sanskrit name is given to Aloe vera, reflecting its youthful revitalizing properties?',
              options: ['Kumari', 'Visha (Poison)', 'Shushka (Dry)', 'Nidra (Sleep)'],
              correctIndex: 0,
              explanation: 'Kumari means young maiden, emphasizing its rejuvenating effects on vitality and skin.',
            },
            {
              prompt: 'Which commercial additive in flavored aloe beverages should be avoided for gut health?',
              options: ['Filtered pure water', 'High fructose corn syrup and refined sugars', 'Trace natural minerals', 'Citric acid preservatives'],
              correctIndex: 1,
              explanation: 'Heavy refined sugar feeds pathogenic gut bacteria and promotes intestinal inflammation.',
            },
            {
              prompt: 'What should you do if taking aloe juice causes abdominal cramping or diarrhea?',
              options: ['Double the dose immediately', 'Reduce the amount or discontinue use', 'Stop drinking water', 'Take sleeping pills'],
              correctIndex: 1,
              explanation: 'Cramping indicates excessive laxative stimulation, warranting dosage reduction or cessation.',
            },
          ],
        },
      },
      {
        key: 'dht-turmeric',
        order: 4,
        title: 'Turmeric & The Microbiome',
        summary: 'Learn how curcuminoids nourish beneficial intestinal flora and modulate mucosal immunity.',
        body: 'Over seventy percent of the human immune system resides in the gut-associated lymphoid tissue (GALT). Emerging microbiological research highlights that curcumin acts as a prebiotic, favoring the growth of beneficial Bifidobacteria and Lactobacilli while reducing endotoxin-producing bacteria.\n\nBy modulating NF-kappa-B signaling in enterocytes, regular dietary turmeric helps seal loose epithelial junctions, supporting what modern science calls gut barrier integrity.\n\n*Traditional Caution:* Always enjoy turmeric as part of a diversified, fiber-rich plant-forward diet.',
        durationMinutes: 4,
        plantSlugs: ['turmeric'],
        remedySlugs: ['golden-milk-haldi-doodh', 'peppermint-fennel-bloat-relief'],
        keyTakeaways: [
          'Supports the abundance of beneficial probiotic strains in the human colon.',
          'Helps maintain tight junctions between intestinal epithelial cells.',
          'Integrates seamlessly into daily soups, broths, and cooked grains.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'Where is approximately 70% of the body immune system tissue located?',
              options: ['In the fingernails', 'In the gut-associated lymphoid tissue (GALT)', 'In the outer tooth enamel', 'In the hair shafts'],
              correctIndex: 1,
              explanation: 'The GALT lining the intestinal mucosa comprises the largest reservoir of immune cells.',
            },
            {
              prompt: 'How does dietary turmeric positively influence the intestinal microbiome?',
              options: ['It sterilizes and kills all gut bacteria completely', 'It acts as a prebiotic supporting beneficial bacterial species', 'It converts bacteria into plastic', 'It stops digestion forever'],
              correctIndex: 1,
              explanation: 'Polyphenols act as prebiotics, selectively fostering health-promoting bacterial populations.',
            },
            {
              prompt: 'What structural feature of the intestinal wall is supported by curcuminoid intake?',
              options: ['Tight junctions between epithelial enterocytes', 'The outer abdominal muscles', 'The pelvic bones', 'The rib cage'],
              correctIndex: 0,
              explanation: 'Curcumin supports tight junction proteins (like claudin and occludin), mitigating "leaky gut" permeability.',
            },
          ],
        },
      },
    ],
  },
  {
    slug: 'respiratory-relief-walk',
    title: 'Respiratory Relief Walk',
    summary: 'A seasonal walk through herbs that clear airways, soothe persistent coughs, and ease bronchial constriction.',
    description: 'A seasonal walk through herbs that clear airways, soothe persistent coughs, and ease bronchial constriction.',
    level: 'BEGINNER',
    difficulty: 'EASY',
    healthCategory: 'respiratory',
    tags: ['respiratory', 'lungs', 'cough', 'cold', 'tulsi', 'mulethi', 'steam'],
    estimatedMinutes: 15,
    sequential: true,
    isPublished: true,
    isFeatured: false,
    sortOrder: 7,
    coverImage: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=1200&q=80',
    checkpoints: [
      {
        key: 'rrw-tulsi',
        order: 1,
        title: 'Tulsi Steam Inhalation',
        summary: 'Clear congested nasal passages and sinuses using aromatic herbal steam.',
        body: 'When seasonal colds strike, nasal mucous membranes become swollen and dry. Steam inhalation (Swedana in Ayurveda) delivers immediate warmth and moisture deep into the upper respiratory tract.\n\nCrushing fresh Tulsi leaves into a bowl of steaming hot water releases volatile terpenes like camphene, eugenol, and cineole. Inhaling these vapors for five to ten minutes loosens stubborn mucus and eases sinus congestion naturally.\n\n*Traditional Caution:* Always keep eyes closed during steam inhalation and maintain a safe distance of 10-12 inches from the hot water to prevent facial steam burns.',
        durationMinutes: 4,
        plantSlugs: ['tulsi'],
        remedySlugs: ['tulsi-kadha-herbal-decoction', 'eucalyptus-steam-inhalation'],
        keyTakeaways: [
          'Steam hydration immediately liquefies thick, stagnant sinus mucus.',
          'Volatile terpenes in Tulsi act as gentle topical bronchodilators.',
          'Exercise great caution with hot water to avoid accidental burns.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What physical distance should be maintained between your face and a hot steam bowl?',
              options: ['Touch your nose directly into the boiling water', 'Keep a safe buffer of 10 to 12 inches', 'Ten yards away in another room', 'Wear a scuba diving suit'],
              correctIndex: 1,
              explanation: 'A distance of 10-12 inches prevents scalding steam burns to facial tissues.',
            },
            {
              prompt: 'Which aromatic terpene found in Tulsi vapors aids in opening bronchial passages?',
              options: ['Cineole', 'Vinegar', 'Ammonia', 'Carbon monoxide'],
              correctIndex: 0,
              explanation: 'Cineole (also common in eucalyptus) assists in clearing congested respiratory pathways.',
            },
            {
              prompt: 'Why should eyes be kept closed during aromatic herbal steam inhalation?',
              options: ['To fall asleep instantly', 'To avoid irritation from concentrated volatile essential oils', 'Because eyes cannot see steam', 'To change eye color'],
              correctIndex: 1,
              explanation: 'Volatile aromatic vapors can cause temporary eye tearing and conjunctival stinging.',
            },
          ],
        },
      },
      {
        key: 'rrw-mulethi',
        order: 2,
        title: 'Mulethi Tea for Dry Coughs',
        summary: 'Quiet the tickle of non-productive coughs with sweet licorice decoction.',
        body: 'A persistent, dry "tickling" cough often lingers long after an acute cold has resolved. Such coughs are driven by raw, hypersensitive nerve endings in the larynx and upper trachea.\n\nMulethi root tea provides demulcent polysaccharides that coat these sensitized pharyngeal nerve receptors, significantly reducing the reflexive cough urge while moistening dry bronchial passages.\n\n*Traditional Caution:* If a cough produces yellow-green purulent sputum or is accompanied by high fever or shortness of breath, consult a physician promptly.',
        durationMinutes: 4,
        plantSlugs: ['mulethi'],
        remedySlugs: ['mulethi-licorice-cough-syrup'],
        keyTakeaways: [
          'Demulcent herbs physically cushion hypersensitive cough receptors.',
          'Provides warm, non-sedating relief for dry throat tickles.',
          'Productive coughs accompanied by fever require medical evaluation.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What type of cough is especially suited for soothing demulcent Mulethi tea?',
              options: ['Dry, non-productive tickling throat coughs', 'Heavy bacterial pneumonia', 'Coughs due to foreign object choking', 'Coughing up bright red blood'],
              correctIndex: 0,
              explanation: 'Dry, tickling post-viral coughs benefit immensely from coating demulcent teas.',
            },
            {
              prompt: 'What red-flag symptom requires immediate medical evaluation rather than home herbal tea?',
              options: ['Mild throat dryness after speaking', 'High fever, shortness of breath, or coughing blood', 'Enjoying a warm cup of water', 'Sneezing once in spring'],
              correctIndex: 1,
              explanation: 'Dyspnea, high persistent fever, or hemoptysis are medical emergencies.',
            },
            {
              prompt: 'How does licorice root reduce the reflex urge to cough?',
              options: ['By paralyzing the brain diaphragm center', 'By coating and soothing exposed pharyngeal nerve endings', 'By inducing unconsciousness', 'By drying up all saliva'],
              correctIndex: 1,
              explanation: 'Demulcent mucilage shields raw laryngeal mucosal receptors that trigger the cough reflex.',
            },
          ],
        },
      },
      {
        key: 'rrw-kadha',
        order: 3,
        title: 'Classical Kadha (Spiced Herbal Decoction)',
        summary: 'Learn the principles of simmering warming spices and Tulsi for seasonal resilience.',
        body: 'Kadha is the ancient Ayurvedic decoction formulated by boiling herbs in water until the liquid volume is reduced by half or three-quarters. This concentration technique pulls both water-soluble saponins and volatile aromatic compounds into a potent elixir.\n\nA classic monsoon Kadha combines fresh Tulsi leaves, crushed ginger root, black peppercorns, and a hint of clove. The decoction is strained, slightly cooled, and finished with a spoonful of raw honey.\n\n*Traditional Caution:* Never boil honey; classical Ayurveda warns that heating honey above 40 degrees Celsius alters its structure and creates metabolic residues.',
        durationMinutes: 4,
        plantSlugs: ['tulsi'],
        remedySlugs: ['tulsi-kadha-herbal-decoction'],
        keyTakeaways: [
          'Simmering on gentle low heat concentrates botanical bioactives.',
          'Reduction by half yields optimal extraction without scorching leaves.',
          'Add honey only after the tea has cooled to comfortable drinking temperature.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What classical Ayurvedic decoction involves boiling herbs until the water is reduced by half?',
              options: ['Kadha (Kashayam)', 'Synthetic soda', 'Raw fruit juice', 'Fermented alcohol'],
              correctIndex: 0,
              explanation: 'Kadha (or Kashayam) is a concentrated water extraction boiled down over low heat.',
            },
            {
              prompt: 'Why should honey only be added after herbal tea has cooled to comfortable drinking temperature?',
              options: ['Honey explodes in boiling water', 'Classical traditions advise against boiling honey to prevent heat damage', 'Honey makes hot water turn to stone', 'Honey evaporates into thin air'],
              correctIndex: 1,
              explanation: 'Traditional Ayurveda cautions that boiling honey alters its enzymatic profile.',
            },
            {
              prompt: 'Which quartet of botanicals forms the traditional backbone of an immune-supporting Kadha?',
              options: ['Tulsi, ginger, black pepper, and clove', 'Ice, salt, white sugar, and vinegar', 'Coffee, chocolate, milk, and butter', 'Flour, yeast, water, and egg'],
              correctIndex: 0,
              explanation: 'Tulsi, ginger, black pepper, and clove provide the classic warming, antimicrobial Kadha formula.',
            },
          ],
        },
      },
      {
        key: 'rrw-breathing',
        order: 4,
        title: 'Pranayama & Botanical Rest',
        summary: 'Integrate mindful rhythmic breathing with herbal wellness to support vital lung capacity.',
        body: 'Herbs work most effectively when matched with supportive physiological practices. "Pranayama" — the yogic science of breath control — strengthens diaphragmatic excursion, improves ventilation-perfusion matching, and calms sympathetic nervous arousal.\n\nPractices like Nadi Shodhana (alternate nostril breathing) or gentle diaphragmatic breathing for ten minutes daily expand lower lung lobes that remain under-utilized during shallow chest breathing.\n\n*Traditional Caution:* Practice pranayama gently without forceful breath retention if you experience dizziness or have unmanaged hypertension.',
        durationMinutes: 3,
        plantSlugs: ['tulsi', 'mulethi'],
        remedySlugs: ['tulsi-kadha-herbal-decoction', 'eucalyptus-steam-inhalation'],
        keyTakeaways: [
          'Diaphragmatic breathing oxygenates lower lung lobes and soothes the nervous system.',
          'Combines harmoniously with warm botanical steam and teas.',
          'Breathe gently through the nose to filter, humidify, and warm inspired air.',
        ],
        quiz: {
          passScore: 0.6,
          questions: [
            {
              prompt: 'What natural function do the nasal passages perform that mouth-breathing bypasses?',
              options: ['None at all', 'Filtering, humidifying, and warming inspired air', 'Cooling air to sub-zero temperatures', 'Stopping all air intake'],
              correctIndex: 1,
              explanation: 'Nasal turbinates filter particulate matter and humidify incoming air before it reaches delicate alveoli.',
            },
            {
              prompt: 'What physiological muscle is the primary engine of deep, calming diaphragmatic breathing?',
              options: ['The bicep', 'The diaphragm', 'The tongue', 'The jaw masseter'],
              correctIndex: 1,
              explanation: 'The dome-shaped diaphragm muscle draws air deeply into lung bases when properly engaged.',
            },
            {
              prompt: 'How does daily rhythmic breathwork complement herbal respiratory remedies?',
              options: ['It cancels all herbal benefits', 'It enhances oxygenation, lymphatic flow, and nervous equanimity', 'It turns herbal tea into water', 'It requires hospital admission'],
              correctIndex: 1,
              explanation: 'Conscious breathing and botanical medicine synergize to support respiratory biomechanics and systemic calm.',
            },
          ],
        },
      },
    ],
  },
];

export async function seedTours(): Promise<void> {
  console.log('🌱 Connecting to database...');
  await connectDB();
  const dbName = mongoose.connection.name;
  console.log(`Connected to database: ${dbName}`);

  const toursBefore = await Tour.find({ isDeleted: false });
  console.log(`\n=== BEFORE TOURS SEED: ${toursBefore.length} tours ===`);
  for (const t of toursBefore) {
    console.log(`- "${t.title}" (${t.slug}): checkpoints=${t.checkpoints?.length ?? 0}, stops=${t.stops?.length ?? 0}`);
  }

  const admin = await User.findOne({ role: UserRole.ADMIN }) || await User.findOne();
  if (!admin) {
    console.error('❌ No user found in database to assign as tour creator. Run seedAtlas.ts first.');
    await disconnectDB();
    process.exit(1);
  }

  console.log(`👤 Using user ${admin.displayName} (${admin._id}) as author.`);

  // Query existing plant and remedy slugs in database
  const existingPlants = await Plant.find().select('slug').lean();
  const existingPlantSlugs = new Set(existingPlants.map((p: any) => p.slug));

  const existingRemedies = await Remedy.find().select('slug').lean();
  const existingRemedySlugs = new Set(existingRemedies.map((r: any) => r.slug));

  const missingPlantSlugs = new Set<string>();
  const missingRemedySlugs = new Set<string>();

  let createdCount = 0;
  let updatedCount = 0;

  for (const tourData of TOURS_SEED_DATA) {
    // Filter plantSlugs and remedySlugs only when they exist in database
    const filteredCheckpoints = tourData.checkpoints.map((cp) => {
      const plantSlugs = (cp.plantSlugs || []).filter((s) => {
        if (existingPlantSlugs.has(s)) return true;
        missingPlantSlugs.add(s);
        return false;
      });
      const remedySlugs = (cp.remedySlugs || []).filter((s) => {
        if (existingRemedySlugs.has(s)) return true;
        missingRemedySlugs.add(s);
        return false;
      });
      return {
        ...cp,
        plantSlugs,
        remedySlugs,
      };
    });

    let existing = await Tour.findOne({ slug: tourData.slug });
    if (!existing) {
      existing = await Tour.findOne({ title: { $regex: new RegExp(`^${tourData.title}$`, 'i') } });
      if (existing) {
        console.log(`🔄 Found existing tour by title "${existing.title}". Updating slug from "${existing.slug}" to "${tourData.slug}".`);
        existing.slug = tourData.slug;
      }
    }

    if (!existing) {
      await Tour.create({
        ...tourData,
        checkpoints: filteredCheckpoints,
        createdBy: admin._id,
      });
      console.log(`✅ Created tour: "${tourData.title}" (${tourData.slug}) with ${filteredCheckpoints.length} checkpoints.`);
      createdCount++;
    } else {
      let modified = false;

      // Fill in or upgrade checkpoints if missing, empty, or legacy without quizzes
      const needsCheckpoints =
        !existing.checkpoints ||
        existing.checkpoints.length === 0 ||
        existing.checkpoints.length < filteredCheckpoints.length ||
        !existing.checkpoints.some((c: any) => c.quiz?.questions?.length > 0);

      if (needsCheckpoints) {
        existing.checkpoints = filteredCheckpoints as any;
        modified = true;
      }

      if (!existing.healthCategory && tourData.healthCategory) {
        existing.healthCategory = tourData.healthCategory;
        modified = true;
      }
      if (!existing.level && tourData.level) {
        existing.level = tourData.level as any;
        modified = true;
      }
      if (!existing.summary && tourData.summary) {
        existing.summary = tourData.summary;
        modified = true;
      }
      if (!existing.coverImage && tourData.coverImage) {
        existing.coverImage = tourData.coverImage;
        modified = true;
      }
      if (!existing.estimatedMinutes && tourData.estimatedMinutes) {
        existing.estimatedMinutes = tourData.estimatedMinutes;
        modified = true;
      }
      if (existing.sequential === undefined && tourData.sequential !== undefined) {
        existing.sequential = tourData.sequential;
        modified = true;
      }

      if (modified) {
        await existing.save();
        console.log(`🔄 Updated tour with checkpoints & fields: "${existing.title}" (${existing.slug}) -> ${existing.checkpoints?.length} checkpoints.`);
        updatedCount++;
      } else {
        console.log(`⏭️  Tour already up-to-date: "${existing.title}" (${existing.slug}). Skipped.`);
      }
    }
  }

  // Report missing slugs
  console.log('\n=== SLUG VERIFICATION REPORT ===');
  console.log(`Missing plant slugs (${missingPlantSlugs.size}):`, Array.from(missingPlantSlugs).join(', ') || 'None (all plant slugs found)');
  console.log(`Missing remedy slugs (${missingRemedySlugs.size}):`, Array.from(missingRemedySlugs).join(', ') || 'None (all remedy slugs found)');

  const toursAfter = await Tour.find({ isDeleted: false });
  console.log(`\n=== AFTER TOURS SEED: ${toursAfter.length} tours (Created: ${createdCount}, Updated: ${updatedCount}) ===`);
  for (const t of toursAfter) {
    console.log(`- "${t.title}" (${t.slug}): checkpoints=${t.checkpoints?.length ?? 0}, stops=${t.stops?.length ?? 0}, level=${t.level ?? 'undefined'}`);
  }

  console.log(`\n🎉 Tour seeding complete! Total tours in collection: ${toursAfter.length}`);
  await disconnectDB();
}

if (require.main === module) {
  seedTours()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error during tour seeding:', err);
      process.exit(1);
    });
}
