// Library feature types — matches backend IPlant / IReview shapes

export interface PlantImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  type?: 'main' | 'detail' | 'infographic';
  thumbnailUrl?: string;
  cardUrl?: string;
}

export interface GrowingConditions {
  soil?: string;
  water?: string;
  sunlight?: string;
  climate?: string;
  hardinessZone?: string;
}

export interface LibraryPlant {
  _id: string;
  commonName: string;
  scientificName: string;
  slug: string;
  family: string;
  description: string;
  shortDescription: string | null;
  medicinalUses: string[];
  partsUsed: string[];
  toxicityLevel: 'NONE' | 'LOW' | 'MODERATE' | 'HIGH';
  ayurvedicNames: string[];
  aliases: string[];
  plantType: string | null;
  regionNative: string[];
  growingConditions: GrowingConditions;
  images: PlantImage[];
  model3dUrl: string | null;
  modelUrl: string | null;
  placement3d: {
    position: { x: number; y: number; z: number };
    scale: number;
  } | null;
  categories: { _id: string; name: string; slug: string }[];
  tags: string[];
  isPublished: boolean;
  isFeatured: boolean;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlantReview {
  _id: string;
  plant: string;
  user: { _id: string; displayName: string; avatarUrl?: string } | string;
  rating: number;
  title: string | null;
  body: string | null;
  helpfulCount: number;
  createdAt: string;
}

export interface AutocompleteResult {
  commonName: string;
  scientificName: string;
  slug: string;
  images: PlantImage[];
  aliases: string[];
}

export interface FacetBucket {
  name: string;
  count: number;
}

export interface LibraryMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  exactMatch: string | null;
  facets: {
    medicinalUse: FacetBucket[];
    region: FacetBucket[];
    type: FacetBucket[];
    health?: { slug: string; label: string; icon: string; count: number }[];
  };
}

export interface SearchParams {
  q?: string;
  medicinalUse?: string;
  health?: string;
  region?: string;
  type?: string;
  category?: string;
  sort?: 'relevance' | 'name' | 'newest' | 'rating';
  page?: number;
  limit?: number;
  view?: 'grid' | 'list';
  // open=1 triggers exactMatch auto-navigation from AI scanner
  open?: string;
}

export interface SearchResult {
  plants: LibraryPlant[];
  meta: LibraryMeta;
}
