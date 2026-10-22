import { logger } from '../../core/utils/logger';
import Remedy from '../remedies/Remedy.model';
import {
  getFeaturedPlants,
  getRecentPlants,
  getPublishedPlantCount,
  getPlantOfTheDay,
  getHealthCategoryCounts,
} from '../library/plant.service';
import { getFeaturedRemedies } from '../remedies/remedy.service';
import { getFeaturedTours, getPublishedTourCount } from '../tours/tour.service';
import { HomeResponse, toHomePlant } from './home.types';

// ── In-memory cache ───────────────────────────────────────────────────────────
// One response object + the timestamp it was built. TTL = 60 seconds.
let cachedResponse: HomeResponse | null = null;
let cacheBuiltAt = 0;
const CACHE_TTL_MS = 60 * 1000;

export async function buildHomePayload(): Promise<HomeResponse> {
  // Return cached payload if still fresh
  if (cachedResponse && Date.now() - cacheBuiltAt < CACHE_TTL_MS) {
    return cachedResponse;
  }

  // ── All sections run independently ───────────────────────────────────────
  const [
    plantCount,
    rawFeatured,
    rawRecent,
    rawPlantOfDay,
    rawCategories,
    rawRemedies,
    rawTours,
    remedyCount,
    tourCount,
  ] = await Promise.all([
    getPublishedPlantCount().catch((e) => { logger.error('home: plantCount error', e); return 0; }),
    getFeaturedPlants(6).catch((e) => { logger.error('home: featuredPlants error', e); return []; }),
    getRecentPlants(6).catch((e) => { logger.error('home: recentPlants error', e); return []; }),
    getPlantOfTheDay().catch((e) => { logger.error('home: plantOfDay error', e); return null; }),
    getHealthCategoryCounts().catch((e) => { logger.error('home: categories error', e); return []; }),
    getFeaturedRemedies(3).catch((e) => { logger.error('home: remedies error', e); return []; }),
    getFeaturedTours(3).catch((e) => { logger.error('home: tours error', e); return []; }),
    Remedy.countDocuments({ isPublished: true, isDeleted: false }).catch(() => 0),
    getPublishedTourCount().catch(() => 0),
  ]);

  const featuredPlants = rawFeatured.map(toHomePlant);
  const recentPlants = rawRecent.map(toHomePlant);
  const plantOfTheDay = rawPlantOfDay ? toHomePlant(rawPlantOfDay) : null;

  // ── Popular searches: top featured plant names + top category labels ──────
  const popularSearches = [
    ...featuredPlants.slice(0, 3).map((p) => ({ label: p.commonName, query: p.commonName })),
    ...rawCategories.slice(0, 3).map((c) => ({ label: c.label, query: c.label })),
  ].slice(0, 6);

  const response: HomeResponse = {
    stats: {
      plants: plantCount,
      remedies: remedyCount,
      tours: tourCount,
      categories: rawCategories.length,
    },
    categories: rawCategories.map((c) => ({
      slug: c.slug,
      label: c.label,
      icon: c.icon,
      plantCount: c.count,
    })),
    featuredPlants,
    recentPlants,
    plantOfTheDay,
    featuredRemedies: rawRemedies as HomeResponse['featuredRemedies'],
    featuredTours: rawTours as HomeResponse['featuredTours'],
    popularSearches,
  };

  cachedResponse = response;
  cacheBuiltAt = Date.now();
  return response;
}

/** Evict the in-memory cache (call after any plant/remedy/tour mutation) */
export function invalidateHomeCache(): void {
  cachedResponse = null;
  cacheBuiltAt = 0;
}
