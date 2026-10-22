/** Mirrors backend HomeResponse */
export interface HomeStats {
  plants: number;
  remedies: number;
  tours: number;
  categories: number;
}

export interface HomeCategory {
  slug: string;
  label: string;
  icon: string;
  plantCount: number;
}

export interface HomePlant {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  image: string;
  tags: string[];
}

export interface PopularSearch {
  label: string;
  query: string;
}

export interface FeaturedRemedy {
  _id?: string;
  slug?: string;
  title?: string;
  description?: string;
  tags?: string[];
  preparationTime?: number;
  difficultyLevel?: string;
}

export interface FeaturedTour {
  _id?: string;
  slug?: string;
  title?: string;
  description?: string;
  difficulty?: string;
  estimatedDuration?: number;
}

export interface HomeData {
  stats: HomeStats;
  categories: HomeCategory[];
  featuredPlants: HomePlant[];
  recentPlants: HomePlant[];
  plantOfTheDay: HomePlant | null;
  featuredRemedies: FeaturedRemedy[];
  featuredTours: FeaturedTour[];
  popularSearches: PopularSearch[];
}
