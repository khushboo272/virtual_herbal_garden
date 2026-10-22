import { IRemedy } from '../remedies/Remedy.model';
import { ITour } from '../tours/Tour.model';
import { IPlant } from '../library/Plant.model';

/** A single health category with its real plant count */
export interface HomeCategory {
  slug: string;
  label: string;
  icon: string;
  plantCount: number;
}

/** Minimal plant summary for home sections */
export interface HomePlant {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  /** Primary image URL or first image URL; empty string when none */
  image: string;
  tags: string[];
}

/** A popular search chip */
export interface PopularSearch {
  label: string;
  query: string;
}

/** The full home page API response */
export interface HomeResponse {
  stats: {
    plants: number;
    remedies: number;
    tours: number;
    categories: number;
  };
  categories: HomeCategory[];
  featuredPlants: HomePlant[];
  recentPlants: HomePlant[];
  plantOfTheDay: HomePlant | null;
  featuredRemedies: Partial<IRemedy>[];
  featuredTours: Partial<ITour>[];
  popularSearches: PopularSearch[];
}

/** Helper: extract the primary image URL from a plant's images array */
export function extractImageUrl(plant: Partial<IPlant>): string {
  const images = plant.images ?? [];
  return images.find((img) => img.isPrimary)?.url ?? images[0]?.url ?? '';
}

/** Helper: convert a Partial<IPlant> to HomePlant */
export function toHomePlant(plant: Partial<IPlant>): HomePlant {
  return {
    id: String((plant as { _id?: unknown })._id ?? ''),
    slug: plant.slug ?? '',
    commonName: plant.commonName ?? '',
    scientificName: plant.scientificName ?? '',
    image: extractImageUrl(plant),
    tags: plant.tags ?? [],
  };
}
