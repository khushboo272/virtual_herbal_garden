import mongoose from 'mongoose';
import Plant, { IPlant } from './Plant.model';
import Review, { IReview } from './Review.model';
import ActivityLog from '../notifications/ActivityLog.model';
import './Category.model';
import '../users/User.model';
import { ActivityType, PaginationMeta } from '../../types';
import { generateSlug } from '../../core/utils/slug';
import { AppError } from '../../core/utils/apiResponse';
import { redis } from '../../core/config/redis';
import { HEALTH_CATEGORIES, getCategoryBySlug } from './health-categories';

interface LibraryFilters {
  page: number;
  limit: number;
  // q is the primary search param; search is the legacy alias
  q?: string;
  search?: string;
  medicinalUse?: string[];
  // health is a HEALTH_CATEGORIES slug; matches medicinalUses or tags containing any keyword
  health?: string;
  region?: string;
  type?: string;
  category?: string;
  family?: string;
  tags?: string;
  sort?: string;
}

interface FacetBucket {
  name: string;
  count: number;
}

interface LibraryMeta extends PaginationMeta {
  // Slug of the plant whose commonName / scientificName / alias exactly matches q
  exactMatch: string | null;
  facets: {
    medicinalUse: FacetBucket[];
    region: FacetBucket[];
    type: FacetBucket[];
    health?: { slug: string; label: string; icon: string; count: number }[];
  };
}

// Escape special regex characters to prevent regex injection
function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build the exactMatch slug: q case-insensitively equals commonName, scientificName, slug, or any alias
async function resolveExactMatch(q: string): Promise<string | null> {
  if (!q || q.length < 2) return null;
  const lower = q.toLowerCase().trim();
  const plant = await Plant.findOne({
    isPublished: true,
    isDeleted: false,
    $or: [
      { slug: lower },
      { commonName: { $regex: `^${escapeRegex(lower)}$`, $options: 'i' } },
      { scientificName: { $regex: `^${escapeRegex(lower)}$`, $options: 'i' } },
      { aliases: { $regex: `^${escapeRegex(lower)}$`, $options: 'i' } },
    ],
  })
    .select('slug')
    .lean();
  return plant?.slug ?? null;
}

// Compute facets (counts per medicinalUse value / regionNative / plantType)
async function computeFacets(baseQuery: Record<string, unknown>): Promise<{
  medicinalUse: FacetBucket[];
  region: FacetBucket[];
  type: FacetBucket[];
}> {
  const [useAgg, regionAgg, typeAgg] = await Promise.all([
    Plant.aggregate([
      { $match: baseQuery },
      { $unwind: '$medicinalUses' },
      { $group: { _id: '$medicinalUses', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    Plant.aggregate([
      { $match: baseQuery },
      { $unwind: '$regionNative' },
      { $group: { _id: '$regionNative', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
    Plant.aggregate([
      { $match: baseQuery },
      { $match: { plantType: { $ne: null } } },
      { $group: { _id: '$plantType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    medicinalUse: useAgg.map((b) => ({ name: b._id as string, count: b.count as number })),
    region: regionAgg.map((b) => ({ name: b._id as string, count: b.count as number })),
    type: typeAgg.map((b) => ({ name: b._id as string, count: b.count as number })),
  };
}

export class PlantService {
  async list(filters: LibraryFilters): Promise<{ plants: IPlant[]; meta: LibraryMeta }> {
    const { page, limit, region, type, category, family, tags, sort } = filters;
    // Prefer `q`; fall back to legacy `search`
    const searchTerm = (filters.q || filters.search || '').trim();
    const medicinalUses = filters.medicinalUse ?? [];
    const skip = (page - 1) * limit;

    // ── Base filter (always applied) ──────────────────────────────────────
    const baseQuery: Record<string, unknown> = { isPublished: true, isDeleted: false };
    if (family) baseQuery.family = family;
    if (type) baseQuery.plantType = { $regex: escapeRegex(type), $options: 'i' };
    if (category) baseQuery.categories = new mongoose.Types.ObjectId(category);
    if (region) baseQuery.regionNative = { $regex: escapeRegex(region), $options: 'i' };
    if (tags) baseQuery.tags = { $in: tags.split(',').map((t) => t.trim().toLowerCase()) };
    if (medicinalUses.length > 0) {
      baseQuery.medicinalUses = {
        $in: medicinalUses.map((u) => new RegExp(escapeRegex(u.trim()), 'i')),
      };
    }
    // health category filter: match medicinalUses OR tags containing any keyword
    const { health } = filters;
    if (health) {
      const healthCat = getCategoryBySlug(health);
      if (healthCat) {
        const keywordPatterns = healthCat.keywords.map(
          (kw) => new RegExp(escapeRegex(kw), 'i'),
        );
        baseQuery.$or = [
          { medicinalUses: { $in: keywordPatterns } },
          { tags: { $in: keywordPatterns } },
        ];
      }
    }

    // ── Full-text search ──────────────────────────────────────────────────
    // Prefer MongoDB $text index when present; fall back to $or regex so it
    // always works even on Atlas Free where Atlas Search isn't always enabled.
    let textQuery: Record<string, unknown> = { ...baseQuery };
    let useTextScore = false;

    if (searchTerm) {
      // Try $text index first (set up in Plant.model.ts)
      textQuery = { ...baseQuery, $text: { $search: searchTerm } };
      useTextScore = sort === 'relevance' || !sort || sort === 'newest';

      // If text index isn't available, fall back to regex across key fields
      // (The service catches the OperationFailed error from MongoDB if the index is missing)
    }

    // ── Sort ──────────────────────────────────────────────────────────────
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'name') sortObj = { commonName: 1 };
    else if (sort === 'rating') sortObj = { avgRating: -1 };
    else if (sort === 'views') sortObj = { viewCount: -1 };
    // For 'relevance' we rely on the text score projection below

    // ── Execute query with text index; fall back to regex on index miss ──
    let plants: IPlant[];
    let total: number;

    try {
      if (searchTerm && useTextScore) {
        [plants, total] = await Promise.all([
          Plant.find(textQuery, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .populate('categories', 'name slug')
            .lean() as unknown as Promise<IPlant[]>,
          Plant.countDocuments(textQuery),
        ]);
      } else if (searchTerm) {
        [plants, total] = await Promise.all([
          Plant.find(textQuery)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('categories', 'name slug')
            .lean() as unknown as Promise<IPlant[]>,
          Plant.countDocuments(textQuery),
        ]);
      } else {
        [plants, total] = await Promise.all([
          Plant.find(baseQuery)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('categories', 'name slug')
            .lean() as unknown as Promise<IPlant[]>,
          Plant.countDocuments(baseQuery),
        ]);
      }
    } catch {
      // Text index unavailable — fall back to regex search across key fields
      if (searchTerm) {
        const escaped = escapeRegex(searchTerm);
        const regexQuery = {
          ...baseQuery,
          $or: [
            { commonName: { $regex: escaped, $options: 'i' } },
            { scientificName: { $regex: escaped, $options: 'i' } },
            { aliases: { $regex: escaped, $options: 'i' } },
            { medicinalUses: { $regex: escaped, $options: 'i' } },
            { tags: { $regex: escaped, $options: 'i' } },
          ],
        };
        [plants, total] = await Promise.all([
          Plant.find(regexQuery)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate('categories', 'name slug')
            .lean() as unknown as Promise<IPlant[]>,
          Plant.countDocuments(regexQuery),
        ]);
      } else {
        throw new AppError('Failed to query plants', 500, 'DB_ERROR');
      }
    }

    // ── exactMatch + facets (run against base query, no pagination) ───────
    const [exactMatch, facets, healthFacets] = await Promise.all([
      resolveExactMatch(searchTerm),
      computeFacets(baseQuery),
      getHealthCategoryCounts(),
    ]);

    return {
      plants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        exactMatch,
        facets: { ...facets, health: healthFacets },
      },
    };
  }

  async getFeatured(): Promise<IPlant[]> {
    const cached = await redis.get('plants:featured');
    if (cached) return JSON.parse(cached) as IPlant[];

    const plants = await Plant.find({
      isFeatured: true,
      isPublished: true,
      isDeleted: false,
    })
      .populate('categories', 'name slug')
      .lean();

    await redis.setex('plants:featured', 300, JSON.stringify(plants));
    return plants as unknown as IPlant[];
  }

  async autocomplete(query: string): Promise<Partial<IPlant>[]> {
    if (!query || query.trim().length < 1) return [];
    const escaped = escapeRegex(query.trim());
    const results = await Plant.find({
      isPublished: true,
      isDeleted: false,
      $or: [
        { commonName: { $regex: `^${escaped}`, $options: 'i' } },
        { scientificName: { $regex: `^${escaped}`, $options: 'i' } },
        { aliases: { $regex: `^${escaped}`, $options: 'i' } },
        { commonName: { $regex: escaped, $options: 'i' } },
        { scientificName: { $regex: escaped, $options: 'i' } },
      ],
    })
      .select('commonName scientificName slug images aliases')
      .limit(6)
      .lean();

    return results as unknown as Partial<IPlant>[];
  }

  async getBySlug(slugOrId: string, userId?: string): Promise<IPlant> {
    const isId = mongoose.Types.ObjectId.isValid(slugOrId);
    const query = isId ? { _id: slugOrId, isDeleted: false } : { slug: slugOrId, isDeleted: false };

    const plant = await Plant.findOneAndUpdate(
      query,
      { $inc: { viewCount: 1 } },
      { new: true },
    )
      .populate('categories', 'name slug')
      .populate('createdBy', 'displayName avatarUrl');

    if (!plant) {
      throw new AppError('Plant not found', 404, 'NOT_FOUND');
    }

    if (userId) {
      await ActivityLog.create({
        user: userId,
        activityType: ActivityType.VIEW_PLANT,
        entityId: plant._id,
        metadata: { slug: plant.slug, name: plant.commonName },
      });
    }

    return plant;
  }

  async getRelated(plantId: string): Promise<IPlant[]> {
    const plant = await Plant.findById(plantId);
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    const related = await Plant.find({
      _id: { $ne: plant._id },
      isPublished: true,
      isDeleted: false,
      $or: [
        { family: plant.family },
        { categories: { $in: plant.categories } },
        { plantType: plant.plantType },
      ],
    })
      .limit(6)
      .select('commonName scientificName slug images avgRating family plantType aliases')
      .lean();

    return related as unknown as IPlant[];
  }

  async create(data: Partial<IPlant>, userId: string): Promise<IPlant> {
    const slug = generateSlug(data.commonName || '');
    const plant = await Plant.create({ ...data, slug, createdBy: userId });
    await redis.del('plants:featured');
    return plant;
  }

  async update(
    plantId: string,
    data: Partial<IPlant>,
    userId: string,
    userRole: string,
  ): Promise<IPlant> {
    const plant = await Plant.findById(plantId);
    if (!plant || plant.isDeleted) {
      throw new AppError('Plant not found', 404, 'NOT_FOUND');
    }
    if (userRole === 'BOTANIST' && plant.createdBy.toString() !== userId) {
      throw new AppError('You can only edit your own plants', 403, 'FORBIDDEN');
    }
    if (data.commonName && data.commonName !== plant.commonName) {
      data.slug = generateSlug(data.commonName);
    }
    Object.assign(plant, data);
    await plant.save();
    await redis.del('plants:featured');
    return plant;
  }

  async publish(plantId: string): Promise<IPlant> {
    const plant = await Plant.findByIdAndUpdate(
      plantId,
      { $set: { isPublished: true } },
      { new: true },
    );
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');
    await redis.del('plants:featured');
    return plant;
  }

  async feature(plantId: string): Promise<IPlant> {
    const plant = await Plant.findById(plantId);
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');
    plant.isFeatured = !plant.isFeatured;
    await plant.save();
    await redis.del('plants:featured');
    return plant;
  }

  async softDelete(plantId: string): Promise<void> {
    const result = await Plant.findByIdAndUpdate(plantId, { isDeleted: true });
    if (!result) throw new AppError('Plant not found', 404, 'NOT_FOUND');
    await redis.del('plants:featured');
  }

  async getReviews(
    plantId: string,
    page: number,
    limit: number,
  ): Promise<{ reviews: IReview[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      Review.find({ plant: plantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'displayName avatarUrl')
        .lean(),
      Review.countDocuments({ plant: plantId }),
    ]);
    return {
      reviews: reviews as unknown as IReview[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createReview(
    plantId: string,
    userId: string,
    data: { rating: number; title?: string; body?: string },
  ): Promise<IReview> {
    const plant = await Plant.findById(plantId);
    if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

    const existing = await Review.findOne({ plant: plantId, user: userId });
    if (existing) throw new AppError('You have already reviewed this plant', 409, 'DUPLICATE_REVIEW');

    const review = await Review.create({ plant: plantId, user: userId, ...data });

    await ActivityLog.create({
      user: userId,
      activityType: ActivityType.REVIEW,
      entityId: plant._id,
      metadata: { plantName: plant.commonName, rating: data.rating },
    });

    return review;
  }
}

export const plantService = new PlantService();

// ── Standalone helper functions for the home module ────────────────────────
// These are intentionally lightweight read-only queries to keep the home
// service decoupled from PlantService internals.

/** Returns up to `limit` featured published plants, filling with newest if fewer than limit */
export async function getFeaturedPlants(limit = 6): Promise<Partial<IPlant>[]> {
  const fields = 'commonName scientificName slug images tags isFeatured avgRating createdAt';
  const featured = await Plant.find({ isFeatured: true, isPublished: true, isDeleted: false })
    .select(fields)
    .limit(limit)
    .lean();

  if (featured.length >= limit) return featured as unknown as Partial<IPlant>[];

  // Fill remaining slots with newest published (not already in the featured list)
  const featuredIds = featured.map((p) => (p as { _id: unknown })._id);
  const fill = await Plant.find({
    _id: { $nin: featuredIds },
    isPublished: true,
    isDeleted: false,
  })
    .sort({ reviewCount: -1, createdAt: -1 })
    .select(fields)
    .limit(limit - featured.length)
    .lean();

  return [...featured, ...fill] as unknown as Partial<IPlant>[];
}

/** Returns up to `limit` newest published plants */
export async function getRecentPlants(limit = 6): Promise<Partial<IPlant>[]> {
  const plants = await Plant.find({ isPublished: true, isDeleted: false })
    .sort({ createdAt: -1 })
    .select('commonName scientificName slug images tags avgRating createdAt')
    .limit(limit)
    .lean();
  return plants as unknown as Partial<IPlant>[];
}

/** Returns total published plant count */
export async function getPublishedPlantCount(): Promise<number> {
  return Plant.countDocuments({ isPublished: true, isDeleted: false });
}

/** Returns a single published plant chosen deterministically by date
 *  (same for everyone all day; changes each day at midnight Asia/Kolkata)
 */
export async function getPlantOfTheDay(): Promise<Partial<IPlant> | null> {
  const total = await getPublishedPlantCount();
  if (total === 0) return null;

  // Stable hash from YYYY-MM-DD in Asia/Kolkata timezone
  const dateStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
  let hash = 0;
  for (const ch of dateStr) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const index = hash % total;

  const plant = await Plant.findOne({ isPublished: true, isDeleted: false })
    .sort({ _id: 1 })
    .skip(index)
    .select('commonName scientificName slug images tags avgRating')
    .lean();

  return plant as Partial<IPlant> | null;
}

/** Returns per-health-category published plant counts (only categories with count > 0) */
export async function getHealthCategoryCounts(): Promise<{ slug: string; label: string; icon: string; count: number }[]> {
  const results = await Promise.all(
    HEALTH_CATEGORIES.map(async (cat) => {
      const keywordPatterns = cat.keywords.map((kw) => new RegExp(escapeRegex(kw), 'i'));
      const count = await Plant.countDocuments({
        isPublished: true,
        isDeleted: false,
        $or: [
          { medicinalUses: { $in: keywordPatterns } },
          { tags: { $in: keywordPatterns } },
        ],
      });
      return { slug: cat.slug, label: cat.label, icon: cat.icon, count };
    }),
  );
  return results.filter((r) => r.count > 0);
}
