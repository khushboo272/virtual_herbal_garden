export interface PlantSummary {
  _id?: string;
  id?: string;
  commonName: string;
  scientificName?: string;
  slug: string;
  images?: { url: string; alt?: string }[];
  image?: string;
}

export interface RemedyIngredient {
  name?: string;
  partUsed?: string;
  quantity: string;
  unit?: string;
  notes?: string;
  plantId?: string;
}

export interface RemedyPreparationStep {
  step: number;
  instruction: string;
  durationMinutes?: number;
  imageUrl?: string;
}

export interface Remedy {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  description: string;
  plants: PlantSummary[];
  resolvedPlants?: PlantSummary[];
  ingredients: RemedyIngredient[];
  preparationSteps: RemedyPreparationStep[];
  dosage?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADVANCED';
  preparationTime: number;
  prepTimeMinutes?: number;
  usage?: 'INTERNAL' | 'TOPICAL' | 'INHALATION';
  traditionalSource?: string;
  image?: string;
  images?: { url: string; alt?: string; isPrimary?: boolean }[];
  tags?: string[];
  precautions?: string[];
  contraindications?: string[];
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RemedySearchParams {
  q?: string;
  health?: string;
  difficulty?: string;
  usage?: string;
  plant?: string;
  sort?: 'newest' | 'name' | 'quickest';
  page?: number;
  limit?: number;
}

export interface HealthFacet {
  slug: string;
  label: string;
  count: number;
}

export interface DifficultyFacet {
  name: string;
  count: number;
}

export interface RemedyMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  facets?: {
    health?: HealthFacet[];
    difficulty?: DifficultyFacet[];
  };
}

export interface RemedyListResponse {
  data: Remedy[];
  meta: RemedyMeta;
}
