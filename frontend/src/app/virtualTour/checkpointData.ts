// ──────────────────────────────────────────────────────────
// Virtual Herbal Garden Tour — Checkpoint Data (All 6)
// ──────────────────────────────────────────────────────────

import type { Checkpoint } from './types';

export const CHECKPOINTS: Checkpoint[] = [
  // ─── Checkpoint 1 ──────────────────────────────────────
  {
    id: 'cp1',
    order: 1,
    title: 'Welcome to the Garden',
    description: 'Introduction to medicinal plants and their importance',
    durationMinutes: 3,
    plants: ['Aloe Vera', 'Chamomile', 'Peppermint'],
    intro:
      'Welcome to your journey into the world of medicinal plants! In this introductory tour, you\'ll learn about the fascinating history of herbal medicine and how plants have been used for healing throughout human civilization. From ancient Egyptian papyri documenting herbal remedies to modern pharmaceutical research, plants have been humanity\'s first pharmacy.',
    learning: [
      'The history of medicinal plants in traditional medicine systems worldwide',
      'How plants produce bioactive healing compounds through secondary metabolism',
      'The importance of sustainable harvesting and conservation of medicinal species',
      'Safety considerations and contraindications when using herbal remedies',
    ],
    activityLabel: 'Quiz — Plant identification basics',
    audioText:
      'Welcome to the Virtual Herbal Garden Tour. For thousands of years, humans have turned to the natural world for healing. Ancient civilizations — from Egypt to China to India — documented hundreds of plant-based remedies. Today, nearly 25% of modern pharmaceuticals are derived from plant compounds. In this garden, you will meet three foundational herbs. Aloe Vera, with over 75 active compounds, has been called the "plant of immortality" by ancient Egyptians. Chamomile, used since ancient Egypt for its calming properties, contains the powerful anti-inflammatory compound bisabolol. And Peppermint, whose active ingredient menthol has been used for over 10,000 years, remains one of the world\'s most popular medicinal herbs. Let us begin our journey through the healing garden.',
    quiz: [
      {
        q: 'What percentage of modern pharmaceuticals are derived from plant compounds?',
        opts: ['5%', '10%', '25%', '50%'],
        ans: 2,
        exp: 'Approximately 25% of modern pharmaceuticals are derived from plant compounds, highlighting the critical importance of botanical research.',
      },
      {
        q: 'Which ancient civilization called Aloe Vera the "plant of immortality"?',
        opts: ['Greek', 'Roman', 'Chinese', 'Egyptian'],
        ans: 3,
        exp: 'The ancient Egyptians called Aloe Vera the "plant of immortality" and it was a common gift to pharaohs.',
      },
      {
        q: 'What is the active anti-inflammatory compound found in Chamomile?',
        opts: ['Menthol', 'Curcumin', 'Bisabolol', 'Allicin'],
        ans: 2,
        exp: 'Bisabolol is the powerful anti-inflammatory compound found in Chamomile, contributing to its soothing properties.',
      },
    ],
  },

  // ─── Checkpoint 2 ──────────────────────────────────────
  {
    id: 'cp2',
    order: 2,
    title: 'Immunity Boosters',
    description: 'Explore plants that strengthen immune system response',
    durationMinutes: 5,
    plants: ['Echinacea', 'Elderberry', 'Ginger'],
    intro:
      'Your immune system is your body\'s first line of defense. In this checkpoint, you\'ll discover three powerful plants that have been scientifically studied for their ability to enhance immune function. From the purple coneflower of the North American prairies to the dark berries of the elder tree, nature has provided remarkable immune-supporting allies.',
    learning: [
      'How Echinacea stimulates white blood cell production and enhances immune response',
      'Elderberry anthocyanins and their role in reducing viral replication duration',
      'Ginger\'s dual action: anti-inflammatory gingerols and immune-modulating shogaols',
      'Safe practices for combining immune-boosting herbs into daily wellness routines',
    ],
    activityLabel: 'Quiz — Identify immune-boosting compounds',
    audioText:
      'The immune system is a complex network of cells, tissues, and organs that work together to defend the body. Certain plants contain bioactive compounds that can enhance this natural defense. Echinacea, the purple coneflower native to North American prairies, has been shown to increase white blood cell production by up to 30%. It contains alkamides and polysaccharides that activate macrophages, your immune system\'s first responders. Elderberry, known scientifically as Sambucus nigra, contains powerful anthocyanins — dark-pigmented antioxidants that have been shown to reduce the duration and severity of colds by 2 to 4 days. Studies show elderberry extract can inhibit viral replication in the early stages of infection. Ginger, one of the world\'s oldest medicinal spices, contains gingerols and shogaols — compounds that reduce inflammation and modulate immune cell activity. Fresh ginger has been shown to enhance the body\'s natural killer cell response.',
    quiz: [
      {
        q: 'By how much can Echinacea increase white blood cell production?',
        opts: ['Up to 10%', 'Up to 20%', 'Up to 30%', 'Up to 50%'],
        ans: 2,
        exp: 'Research has shown Echinacea can increase white blood cell production by up to 30%, activating macrophages and enhancing immune response.',
      },
      {
        q: 'What are the dark-pigmented antioxidants found in Elderberry called?',
        opts: ['Flavonoids', 'Anthocyanins', 'Carotenoids', 'Tannins'],
        ans: 1,
        exp: 'Elderberry contains powerful anthocyanins — dark-pigmented antioxidants that can inhibit viral replication and reduce cold duration.',
      },
      {
        q: 'Which compound in Ginger has anti-inflammatory properties?',
        opts: ['Curcumin', 'Allicin', 'Gingerols', 'Menthol'],
        ans: 2,
        exp: 'Gingerols are the primary bioactive compounds in ginger responsible for its anti-inflammatory and immune-modulating effects.',
      },
    ],
  },

  // ─── Checkpoint 3 ──────────────────────────────────────
  {
    id: 'cp3',
    order: 3,
    title: 'Stress & Sleep Herbs',
    description: 'Discover adaptogens and relaxants for mind-body balance',
    durationMinutes: 4,
    plants: ['Ashwagandha', 'Lavender', 'Valerian'],
    intro:
      'In our modern, fast-paced world, stress and sleep disorders affect millions. Nature offers powerful solutions through adaptogenic and calming herbs. This checkpoint explores three remarkable plants that have been used for centuries to promote relaxation, reduce anxiety, and improve sleep quality through their unique mechanisms of action on the nervous system.',
    learning: [
      'How Ashwagandha acts as an adaptogen to regulate cortisol and reduce chronic stress',
      'Lavender\'s mechanism of modulating GABA receptors for anxiety reduction',
      'Valerian root\'s interaction with sleep receptors and its role in improving sleep onset',
      'Creating effective bedtime herbal routines for better sleep hygiene',
    ],
    activityLabel: 'Quiz — Match herbs to stress-relief mechanisms',
    audioText:
      'Stress is not just a mental state — it triggers a cascade of hormonal responses that affect every system in your body. Adaptogenic herbs offer a unique solution by helping your body adapt to stress rather than simply masking symptoms. Ashwagandha, known as Withania somnifera, is one of the most powerful adaptogens in Ayurvedic medicine. Clinical studies show it can reduce cortisol levels by 30% and significantly decrease anxiety scores. Its active compounds, withanolides, regulate the hypothalamic-pituitary-adrenal axis. Lavender, the beloved purple flower, works through a different mechanism. Its primary compound, linalool, modulates GABA-A receptors in the brain — the same receptors targeted by anti-anxiety medications, but without the side effects. Simply inhaling lavender essential oil for 15 minutes has been shown to reduce anxiety by 20%. Valerian root has been used since ancient Greece as a sleep aid. Its valerenic acid binds to GABA-B receptors, promoting drowsiness and reducing the time it takes to fall asleep by an average of 15 to 20 minutes.',
    quiz: [
      {
        q: 'By what percentage can Ashwagandha reduce cortisol levels?',
        opts: ['10%', '20%', '30%', '50%'],
        ans: 2,
        exp: 'Clinical studies have shown that Ashwagandha can reduce cortisol levels by approximately 30%, making it one of the most effective natural stress relievers.',
      },
      {
        q: 'Which brain receptors does Lavender\'s linalool modulate?',
        opts: ['Dopamine receptors', 'Serotonin receptors', 'GABA-A receptors', 'Opioid receptors'],
        ans: 2,
        exp: 'Linalool in Lavender modulates GABA-A receptors, the same receptors targeted by pharmaceutical anti-anxiety medications, providing natural anxiety relief.',
      },
      {
        q: 'How much can Valerian root reduce the time to fall asleep?',
        opts: ['5–10 minutes', '15–20 minutes', '30–40 minutes', '45–60 minutes'],
        ans: 1,
        exp: 'Valerian root\'s valerenic acid, by binding to GABA-B receptors, can reduce sleep onset time by an average of 15 to 20 minutes.',
      },
    ],
  },

  // ─── Checkpoint 4 ──────────────────────────────────────
  {
    id: 'cp4',
    order: 4,
    title: 'Digestive Herbs',
    description: 'Herbs that soothe, heal, and optimize the gut microbiome',
    durationMinutes: 5,
    plants: ['Turmeric', 'Fennel', 'Licorice Root'],
    intro:
      'The digestive system is often called the body\'s "second brain," and for good reason — it contains over 100 million nerve cells and produces 95% of the body\'s serotonin. This checkpoint explores three remarkable herbs that support digestive health through different but complementary mechanisms, from reducing inflammation to protecting the mucosal lining.',
    learning: [
      'How Turmeric\'s curcumin reduces gut inflammation and supports the microbiome',
      'Fennel\'s carminative action: relieving gas, bloating, and digestive spasms',
      'Licorice Root\'s protective effect on the stomach\'s mucosal lining',
      'The gut-brain axis: how digestive herbs can influence mood and cognition',
    ],
    activityLabel: 'Quiz — Digestive herb knowledge',
    audioText:
      'Your digestive system is far more than a food-processing tube. It houses over 100 million nerve cells and produces 95% of your body\'s serotonin. When your gut is healthy, your entire body benefits. Turmeric, the golden spice of India, contains curcumin — a compound that has been the subject of over 12,000 peer-reviewed studies. Curcumin reduces gut inflammation by inhibiting NF-kappa-B, a molecule that activates inflammatory genes. It also promotes the growth of beneficial gut bacteria. Fennel, with its sweet, anise-like flavor, has been used for digestive relief since ancient Rome. Its primary compound, anethole, relaxes smooth muscle in the digestive tract, relieving gas and bloating. Fennel is classified as a carminative herb — meaning it prevents the formation of gas in the gastrointestinal tract. Licorice Root, known as "the great harmonizer" in Chinese medicine, contains glycyrrhizin which stimulates the production of protective mucus in the stomach lining. This creates a barrier against stomach acid, making it valuable for those with gastritis or ulcers. Its anti-inflammatory properties also support overall digestive comfort.',
    quiz: [
      {
        q: 'How many peer-reviewed studies have been conducted on curcumin?',
        opts: ['Over 1,000', 'Over 5,000', 'Over 12,000', 'Over 20,000'],
        ans: 2,
        exp: 'Curcumin from Turmeric has been the subject of over 12,000 peer-reviewed studies, making it one of the most researched natural compounds.',
      },
      {
        q: 'What type of herb is Fennel classified as?',
        opts: ['Adaptogenic', 'Carminative', 'Nervine', 'Diuretic'],
        ans: 1,
        exp: 'Fennel is classified as a carminative herb, meaning it prevents the formation of gas in the gastrointestinal tract and relieves bloating.',
      },
      {
        q: 'What does Licorice Root\'s glycyrrhizin stimulate in the stomach?',
        opts: ['Acid production', 'Enzyme release', 'Protective mucus', 'Bile secretion'],
        ans: 2,
        exp: 'Glycyrrhizin in Licorice Root stimulates the production of protective mucus in the stomach lining, creating a barrier against stomach acid.',
      },
    ],
  },

  // ─── Checkpoint 5 ──────────────────────────────────────
  {
    id: 'cp5',
    order: 5,
    title: 'Skin & Wound Healing',
    description: 'Topical and internal herbs for skin health and repair',
    durationMinutes: 4,
    plants: ['Calendula', 'Tea Tree', 'Comfrey'],
    intro:
      'Your skin is your body\'s largest organ, covering approximately 20 square feet and serving as the first barrier against environmental threats. For thousands of years, healers have applied botanical preparations to wounds, burns, and skin conditions. This checkpoint explores three of the most powerful skin-healing herbs, each with distinct and scientifically validated mechanisms of action.',
    learning: [
      'Calendula\'s flavonoids and triterpenoids that accelerate wound healing and tissue regeneration',
      'Tea Tree oil\'s broad-spectrum antimicrobial terpinen-4-ol against bacteria and fungi',
      'Comfrey\'s allantoin compound that stimulates cell proliferation and bone/tissue repair',
      'Safe topical application methods and which herbs should never be taken internally',
    ],
    activityLabel: 'Quiz — Identify skin herb applications',
    audioText:
      'Your skin is a remarkable organ — approximately 20 square feet of living tissue that regenerates itself every 27 days. When it is damaged, the right botanical compounds can dramatically accelerate healing. Calendula, also known as pot marigold, has been used since the 12th century for wound healing. Modern research has identified its mechanism: flavonoids and triterpenoids in Calendula stimulate collagen production and increase blood flow to damaged tissue. Clinical studies show Calendula cream can accelerate wound closure by 40% compared to conventional treatments. Tea Tree, native to Australia, produces an essential oil rich in terpinen-4-ol — a compound with remarkable antimicrobial properties. It is effective against over 30 different types of bacteria and 12 types of fungi. Tea Tree oil at a 5% concentration has been shown to be as effective as benzoyl peroxide for acne, but with fewer side effects. Comfrey, once called "knit-bone" by medieval healers, contains allantoin — a compound that stimulates cell proliferation and accelerates tissue repair. Research shows allantoin can increase the rate of cell division by up to 30%, making it valuable for healing bruises, sprains, and minor fractures.',
    quiz: [
      {
        q: 'By what percentage can Calendula cream accelerate wound closure?',
        opts: ['10%', '20%', '40%', '60%'],
        ans: 2,
        exp: 'Clinical studies show Calendula cream can accelerate wound closure by 40% compared to conventional treatments, thanks to its flavonoids and triterpenoids.',
      },
      {
        q: 'What is the key antimicrobial compound in Tea Tree oil?',
        opts: ['Linalool', 'Terpinen-4-ol', 'Eugenol', 'Thymol'],
        ans: 1,
        exp: 'Terpinen-4-ol is the primary antimicrobial compound in Tea Tree oil, effective against over 30 types of bacteria and 12 types of fungi.',
      },
      {
        q: 'What compound in Comfrey stimulates cell proliferation?',
        opts: ['Bisabolol', 'Glycyrrhizin', 'Allantoin', 'Curcumin'],
        ans: 2,
        exp: 'Allantoin in Comfrey stimulates cell proliferation and can increase the rate of cell division by up to 30%, earning it the historical name "knit-bone."',
      },
    ],
  },

  // ─── Checkpoint 6 ──────────────────────────────────────
  {
    id: 'cp6',
    order: 6,
    title: 'Herbs for Heart Health',
    description: 'Cardiovascular support through plant-based medicine',
    durationMinutes: 6,
    plants: ['Hawthorn', 'Garlic', 'Motherwort'],
    intro:
      'Cardiovascular disease remains the leading cause of death worldwide, yet many traditional herbal remedies have shown remarkable potential for supporting heart health. This final checkpoint explores three herbs with centuries of traditional use and growing bodies of modern scientific evidence supporting their cardiovascular benefits. From strengthening blood vessels to regulating heart rhythm, these herbs offer complementary approaches to heart wellness.',
    learning: [
      'Hawthorn\'s oligomeric proanthocyanidins (OPCs) that strengthen coronary arteries and improve blood flow',
      'Garlic\'s allicin compound and its effect on cholesterol reduction and blood pressure',
      'Motherwort\'s leonurine alkaloid and its role in regulating heart rhythm and reducing palpitations',
      'How to combine cardiovascular herbs safely with conventional medications',
    ],
    activityLabel: 'Quiz — Heart herb knowledge',
    audioText:
      'The heart beats approximately 100,000 times per day, pumping 2,000 gallons of blood through 60,000 miles of blood vessels. Supporting this remarkable organ with plant-based medicine has a tradition spanning thousands of years. Hawthorn, known as Crataegus in botanical medicine, has been used for heart conditions since the first century. Its berries and leaves contain oligomeric proanthocyanidins — OPCs — which strengthen the walls of coronary arteries and improve blood flow to the heart muscle. Clinical trials have shown Hawthorn extract can improve exercise tolerance in heart failure patients by 20%. Garlic, perhaps the most widely studied medicinal plant in the world, contains allicin — a sulfur compound released when garlic is crushed. Allicin has been shown to reduce total cholesterol by 10 to 15% and lower blood pressure by 7 to 8 millimeters of mercury. Just 2 to 3 cloves of raw garlic per day can provide cardiovascular benefits. Motherwort, named for its traditional use during childbirth, contains leonurine — an alkaloid that acts as a mild calcium channel blocker. This helps regulate heart rhythm and reduce palpitations. In Traditional Chinese Medicine, Motherwort has been prescribed for cardiovascular conditions for over 2,000 years. Congratulations on completing the Virtual Herbal Garden Tour! You now have a foundational understanding of medicinal plants and their healing properties.',
    quiz: [
      {
        q: 'What are the compounds in Hawthorn that strengthen coronary arteries?',
        opts: ['Flavonoids', 'Anthocyanins', 'Oligomeric proanthocyanidins (OPCs)', 'Tannins'],
        ans: 2,
        exp: 'Hawthorn contains oligomeric proanthocyanidins (OPCs) which strengthen coronary artery walls and can improve exercise tolerance by 20% in heart failure patients.',
      },
      {
        q: 'By how much can Garlic reduce total cholesterol?',
        opts: ['1–5%', '10–15%', '20–25%', '30–35%'],
        ans: 1,
        exp: 'Garlic\'s allicin compound has been shown to reduce total cholesterol by 10 to 15% and can also lower blood pressure significantly.',
      },
      {
        q: 'What mechanism does Motherwort\'s leonurine use to regulate heart rhythm?',
        opts: ['Beta-blocker', 'ACE inhibitor', 'Calcium channel blocker', 'Sodium channel blocker'],
        ans: 2,
        exp: 'Leonurine in Motherwort acts as a mild calcium channel blocker, helping regulate heart rhythm and reduce palpitations naturally.',
      },
    ],
  },
];
