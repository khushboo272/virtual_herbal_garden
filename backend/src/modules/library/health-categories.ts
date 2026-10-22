/**
 * HEALTH_CATEGORIES — the canonical set of category slugs used across
 * the Home endpoint and the /plants?health= filter param.
 *
 * keywords[]  — case-insensitive partial matches against
 *               plant.medicinalUses[] and plant.tags[]
 * icon        — lucide icon name (used verbatim on the frontend)
 */
export interface HealthCategory {
  slug: string;
  label: string;
  icon: string;
  keywords: string[];
}

export const HEALTH_CATEGORIES: HealthCategory[] = [
  {
    slug: 'immunity',
    label: 'Immunity',
    icon: 'Shield',
    keywords: ['immunity', 'immune'],
  },
  {
    slug: 'digestion',
    label: 'Digestion',
    icon: 'Leaf',
    keywords: ['digestion', 'digestive', 'gastric', 'stomach', 'appetite'],
  },
  {
    slug: 'skin-care',
    label: 'Skin Care',
    icon: 'Sparkles',
    keywords: ['skin', 'wound', 'acne'],
  },
  {
    slug: 'respiratory',
    label: 'Respiratory',
    icon: 'Wind',
    keywords: ['respiratory', 'cough', 'cold', 'asthma', 'throat'],
  },
  {
    slug: 'pain-relief',
    label: 'Pain Relief',
    icon: 'Zap',
    keywords: ['pain', 'anti-inflammatory', 'arthritis', 'headache'],
  },
  {
    slug: 'stress-sleep',
    label: 'Stress & Sleep',
    icon: 'Moon',
    keywords: ['stress', 'anxiety', 'sleep', 'adaptogen', 'calming'],
  },
  {
    slug: 'heart-health',
    label: 'Heart Health',
    icon: 'Heart',
    keywords: ['heart', 'cardio', 'cholesterol', 'blood pressure'],
  },
  {
    slug: 'womens-health',
    label: "Women's Health",
    icon: 'Flower2',
    keywords: ['women', 'reproductive', 'lactation', 'menstrual'],
  },
  {
    slug: 'blood-sugar',
    label: 'Blood Sugar',
    icon: 'Activity',
    keywords: ['diabetes', 'blood sugar'],
  },
  {
    slug: 'fever',
    label: 'Fever',
    icon: 'Thermometer',
    keywords: ['fever', 'antipyretic'],
  },
];

/**
 * Look up a HealthCategory by slug. Returns undefined if not found.
 */
export function getCategoryBySlug(slug: string): HealthCategory | undefined {
  return HEALTH_CATEGORIES.find((c) => c.slug === slug);
}
