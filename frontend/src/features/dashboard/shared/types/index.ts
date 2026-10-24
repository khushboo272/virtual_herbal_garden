export interface IBookmarkPopulatedItem {
  id: string;
  title: string;
  subtitle?: string;
  slug: string;
  image: string;
  type: 'plant' | 'remedy' | 'tour' | 'article';
}

export interface IBookmark {
  _id: string;
  entityType: 'PLANT' | 'REMEDY' | 'TOUR' | 'ARTICLE';
  entityId: string;
  createdAt: string;
  notes?: string;
  item?: IBookmarkPopulatedItem | null;
}

export interface IGardenPlant {
  _id: string;
  plant: {
    _id: string;
    commonName: string;
    scientificName?: string;
    slug: string;
    images?: { url: string }[];
    model3dUrl?: string;
  };
  position: { x: number; y: number; z: number };
  growthStage: 'SEED' | 'SPROUT' | 'YOUNG' | 'MATURE' | 'FLOWERING';
  plantedAt: string;
  notes?: string;
}

export interface IGarden {
  _id: string;
  name: string;
  plants: IGardenPlant[];
}

export interface ISupportRequest {
  _id: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
}

export interface IDashboardSearchResult {
  plants: {
    id: string;
    commonName: string;
    scientificName: string;
    slug: string;
  }[];
  remedies: {
    id: string;
    title: string;
    summary?: string;
    slug: string;
  }[];
}
