import mongoose from 'mongoose';
import Remedy, { IRemedy } from './Remedy.model';
import Plant from '../library/Plant.model';
import { HEALTH_CATEGORIES } from '../library/health-categories';
import { findPlantsByNames, ResolvedPlantSummary } from '../library/plant.service';
import { PaginationMeta, UserRole } from '../../types';
import { generateSlug } from '../../core/utils/slug';
import { AppError } from '../../core/utils/apiResponse';
import { putImage, deleteObject } from '../../core/storage/r2Storage';
import { remedyCoverKey, publicUrl } from '../../core/storage/assetKeys';
import { validateImageMagicBytes, processRemedyCover } from '../../core/utils/imageProcessor';
import { assertCanModifyContent } from '../../core/policies/contentOwnership';

export interface RemedyFilters {
  page?: number;
  limit?: number;
  q?: string;
  search?: string;
  health?: string;
  difficulty?: string;
  usage?: string;
  plant?: string;
  tags?: string;
  sort?: 'newest' | 'name' | 'quickest';
}

export interface RemedyDetailResult extends Omit<Partial<IRemedy>, 'plants'> {
  resolvedPlants: ResolvedPlantSummary[];
  plants: any[];
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

export class RemedyService {
  async list(
    filters: RemedyFilters,
  ): Promise<{ remedies: IRemedy[]; meta: PaginationMeta }> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(filters.limit) || 12));
    const skip = (page - 1) * limit;

    const searchTerm = (filters.q || filters.search || '').trim();
    const query: Record<string, unknown> = { isPublished: true, isDeleted: false };
    const andClauses: Record<string, unknown>[] = [];

    // Search query matching title, description, tags, ingredient names/notes
    if (searchTerm) {
      const escaped = escapeRegex(searchTerm);
      andClauses.push({
        $or: [
          { title: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { tags: { $regex: escaped, $options: 'i' } },
          { 'ingredients.name': { $regex: escaped, $options: 'i' } },
          { 'ingredients.notes': { $regex: escaped, $options: 'i' } },
        ],
      });
    }

    // Health category filter using library HEALTH_CATEGORIES keywords
    if (filters.health) {
      const cat = HEALTH_CATEGORIES.find((c) => c.slug === filters.health);
      if (cat && cat.keywords.length > 0) {
        const keywordOrs = cat.keywords.map((kw) => {
          const esc = escapeRegex(kw);
          return {
            $or: [
              { tags: { $regex: esc, $options: 'i' } },
              { title: { $regex: esc, $options: 'i' } },
              { description: { $regex: esc, $options: 'i' } },
              { 'ingredients.name': { $regex: esc, $options: 'i' } },
              { 'ingredients.notes': { $regex: esc, $options: 'i' } },
            ],
          };
        });
        andClauses.push({ $or: keywordOrs });
      }
    }

    // Difficulty filter
    if (filters.difficulty) {
      andClauses.push({
        $or: [
          { difficulty: filters.difficulty },
          { difficultyLevel: filters.difficulty },
        ],
      });
    }

    // Usage filter
    if (filters.usage) {
      andClauses.push({ usage: filters.usage });
    }

    // Tags filter
    if (filters.tags) {
      const tagList = filters.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (tagList.length > 0) {
        andClauses.push({ tags: { $in: tagList } });
      }
    }

    // Plant filter: by plant slug or ID or ingredient name
    if (filters.plant) {
      const plantParam = filters.plant.trim();
      const isObjectId = mongoose.Types.ObjectId.isValid(plantParam);

      // Look up plant in the Plant model to get names and aliases
      const plantDoc = await Plant.findOne({
        $or: [
          { slug: plantParam },
          ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(plantParam) }] : []),
        ],
      })
        .select('commonName scientificName aliases _id')
        .lean();

      if (plantDoc) {
        const plantNames = [
          plantDoc.commonName,
          plantDoc.scientificName,
          ...(plantDoc.aliases || []),
        ].filter(Boolean);

        const plantNameOrs = plantNames.map((name) => {
          const esc = escapeRegex(name);
          return {
            $or: [
              { plants: plantDoc._id },
              { 'ingredients.name': { $regex: esc, $options: 'i' } },
              { 'ingredients.notes': { $regex: esc, $options: 'i' } },
              { title: { $regex: esc, $options: 'i' } },
              { description: { $regex: esc, $options: 'i' } },
            ],
          };
        });
        andClauses.push({ $or: plantNameOrs });
      } else if (isObjectId) {
        andClauses.push({ plants: new mongoose.Types.ObjectId(plantParam) });
      } else {
        const esc = escapeRegex(plantParam);
        andClauses.push({
          $or: [
            { 'ingredients.name': { $regex: esc, $options: 'i' } },
            { 'ingredients.notes': { $regex: esc, $options: 'i' } },
            { title: { $regex: esc, $options: 'i' } },
          ],
        });
      }
    }

    if (andClauses.length > 0) {
      query.$and = andClauses;
    }

    // Sort mapping
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (filters.sort === 'name') {
      sortObj = { title: 1 };
    } else if (filters.sort === 'quickest') {
      sortObj = { prepTimeMinutes: 1, preparationTime: 1 };
    }

    const [remedies, total, healthFacets, difficultyFacets] = await Promise.all([
      Remedy.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('plants', 'commonName slug images scientificName')
        .lean(),
      Remedy.countDocuments(query),
      computeHealthFacets(),
      computeDifficultyFacets(),
    ]);

    return {
      remedies: remedies as unknown as IRemedy[],
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        facets: {
          health: healthFacets,
          difficulty: difficultyFacets,
        },
      },
    };
  }

  async getBySlugOrId(
    slugOrId: string,
    userId?: string,
    userRole?: string,
    isPreview = false,
  ): Promise<RemedyDetailResult> {
    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    const remedy = await Remedy.findOne({
      $or: [
        { slug: slugOrId },
        ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(slugOrId) }] : []),
      ],
      isDeleted: false,
    })
      .populate('plants', 'commonName slug images scientificName')
      .populate('createdBy', 'displayName avatarUrl')
      .lean();

    if (!remedy) throw new AppError('Remedy not found', 404, 'NOT_FOUND');

    if (!remedy.isPublished) {
      const isOwner =
        userId &&
        (remedy.owner?.toString() === userId || remedy.createdBy?.toString() === userId);
      const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
      if (!isPreview || (!isOwner && !isAdmin)) {
        throw new AppError('Remedy not found', 404, 'NOT_FOUND');
      }
    }

    // Resolve plants from ingredient names using the library export
    const ingredientNames = (remedy.ingredients || [])
      .map((i) => i.name || i.notes || '')
      .filter((n) => n.trim().length > 0);

    const resolvedByName = await findPlantsByNames(ingredientNames);

    // Merge with any already-populated plants
    const plantMap = new Map<string, ResolvedPlantSummary>();
    for (const p of resolvedByName) {
      plantMap.set(p.id, p);
    }

    if (Array.isArray(remedy.plants)) {
      for (const p of remedy.plants as any[]) {
        if (p && p._id) {
          const idStr = p._id.toString();
          if (!plantMap.has(idStr)) {
            plantMap.set(idStr, {
              id: idStr,
              slug: p.slug,
              commonName: p.commonName,
              scientificName: p.scientificName,
              image: p.images?.[0]?.url || '',
            });
          }
        }
      }
    }

    return {
      ...remedy,
      resolvedPlants: Array.from(plantMap.values()),
    } as unknown as RemedyDetailResult;
  }

  // Alias for backward compatibility with existing tests/callers
  async getBySlug(
    slug: string,
    userId?: string,
    userRole?: string,
    isPreview = false,
  ): Promise<RemedyDetailResult> {
    return this.getBySlugOrId(slug, userId, userRole, isPreview);
  }

  async getRelated(remedyIdOrSlug: string, limit = 3): Promise<IRemedy[]> {
    const isObjectId = mongoose.Types.ObjectId.isValid(remedyIdOrSlug);
    const target = await Remedy.findOne({
      $or: [
        { slug: remedyIdOrSlug },
        ...(isObjectId ? [{ _id: new mongoose.Types.ObjectId(remedyIdOrSlug) }] : []),
      ],
      isDeleted: false,
    })
      .select('_id plants tags')
      .lean();

    if (!target) return [];

    const conditions: Record<string, unknown>[] = [];
    if (target.plants && target.plants.length > 0) {
      conditions.push({ plants: { $in: target.plants } });
    }
    if (target.tags && target.tags.length > 0) {
      conditions.push({ tags: { $in: target.tags } });
    }

    const query: Record<string, unknown> = {
      _id: { $ne: target._id },
      isPublished: true,
      isDeleted: false,
    };

    if (conditions.length > 0) {
      query.$or = conditions;
    }

    const related = await Remedy.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('plants', 'commonName slug images scientificName')
      .lean();

    return related as unknown as IRemedy[];
  }

  async create(data: Partial<IRemedy>, userId: string): Promise<IRemedy> {
    const slug = generateSlug(data.title || '');
    const remedy = await Remedy.create({
      ...data,
      slug,
      createdBy: userId,
      owner: userId,
    });
    return remedy;
  }

  async update(
    remedyId: string,
    data: Partial<IRemedy>,
    userId: string,
    userRole: string,
  ): Promise<IRemedy> {
    const remedy = await Remedy.findById(remedyId);
    if (!remedy || remedy.isDeleted) {
      throw new AppError('Remedy not found', 404, 'NOT_FOUND');
    }

    assertCanModifyContent(remedy, userId, userRole, 'update');

    if (data.title && data.title !== remedy.title) {
      data.slug = generateSlug(data.title);
    }

    Object.assign(remedy, data);
    await remedy.save();
    return remedy;
  }

  async softDelete(remedyId: string): Promise<void> {
    const result = await Remedy.findByIdAndUpdate(remedyId, { isDeleted: true });
    if (!result) throw new AppError('Remedy not found', 404, 'NOT_FOUND');
  }

  async publish(remedyId: string): Promise<IRemedy> {
    const remedy = await Remedy.findById(remedyId);
    if (!remedy) throw new AppError('Remedy not found', 404, 'NOT_FOUND');
    remedy.isPublished = !remedy.isPublished;
    await remedy.save();
    return remedy;
  }

  async uploadImage(
    idOrSlug: string,
    buffer: Buffer,
    userId?: string,
    userRole?: string,
  ): Promise<{ imageUrl: string }> {
    const mime = validateImageMagicBytes(buffer);
    if (!mime) {
      throw new AppError('Invalid image format. Accepted: JPEG, PNG, WebP', 400, 'INVALID_FORMAT');
    }

    let query: any;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug, isDeleted: false };
    } else {
      query = { slug: idOrSlug, isDeleted: false };
    }
    const remedy = await Remedy.findOne(query);
    if (!remedy) throw new AppError('Remedy not found', 404, 'NOT_FOUND');

    if (userId && userRole) {
      assertCanModifyContent(remedy, userId, userRole, 'upload');
    }

    const processed = await processRemedyCover(buffer);
    const coverKey = remedyCoverKey(remedy.slug);

    await putImage({ key: coverKey, buffer: processed, contentType: 'image/webp' });

    const url = publicUrl(coverKey, Date.now());
    remedy.image = url;
    remedy.images = [{ url, isPrimary: true, alt: remedy.title }];
    await remedy.save();

    return { imageUrl: url };
  }

  async deleteImage(idOrSlug: string, userId?: string, userRole?: string): Promise<void> {
    let query: any;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug, isDeleted: false };
    } else {
      query = { slug: idOrSlug, isDeleted: false };
    }
    const remedy = await Remedy.findOne(query);
    if (!remedy) throw new AppError('Remedy not found', 404, 'NOT_FOUND');

    if (userId && userRole) {
      assertCanModifyContent(remedy, userId, userRole, 'delete');
    }

    const coverKey = remedyCoverKey(remedy.slug);
    await deleteObject(coverKey);

    remedy.image = '';
    remedy.images = [];
    await remedy.save();
  }
}

export const remedyService = new RemedyService();

/**
 * Returns up to `limit` published remedies for the home page,
 * prioritizing remedies flagged with isFeatured: true, and falling back to newest published if none are flagged.
 */
export async function getFeaturedRemedies(limit = 3): Promise<IRemedy[]> {
  const fields = 'title slug description tags preparationTime prepTimeMinutes difficulty difficultyLevel plants image images isFeatured createdAt';
  
  // 1. Fetch featured published remedies
  const featured = await Remedy.find({ isFeatured: true, isPublished: true, isDeleted: false })
    .sort({ updatedAt: -1, createdAt: -1 })
    .select(fields)
    .populate('plants', 'commonName slug images')
    .limit(limit)
    .lean();

  if (featured.length > 0) return featured as unknown as IRemedy[];

  // 2. Only if no remedies are flagged as featured, fall back to newest published remedies
  const fallback = await Remedy.find({
    isPublished: true,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .select(fields)
    .populate('plants', 'commonName slug images')
    .limit(limit)
    .lean();

  return fallback as unknown as IRemedy[];
}

/**
 * Computes health category counts for remedies based on library keywords
 */
async function computeHealthFacets(): Promise<{ slug: string; label: string; count: number }[]> {
  const facets = await Promise.all(
    HEALTH_CATEGORIES.map(async (cat) => {
      const regexList = cat.keywords.map((kw) => {
        const esc = escapeRegex(kw);
        return {
          $or: [
            { tags: { $regex: esc, $options: 'i' } },
            { title: { $regex: esc, $options: 'i' } },
            { description: { $regex: esc, $options: 'i' } },
            { 'ingredients.name': { $regex: esc, $options: 'i' } },
            { 'ingredients.notes': { $regex: esc, $options: 'i' } },
          ],
        };
      });

      const count = await Remedy.countDocuments({
        isPublished: true,
        isDeleted: false,
        $or: regexList,
      });

      return { slug: cat.slug, label: cat.label, count };
    }),
  );

  return facets.filter((f) => f.count > 0);
}

/**
 * Computes difficulty facets for remedies
 */
async function computeDifficultyFacets(): Promise<{ name: string; count: number }[]> {
  const counts = await Promise.all([
    Remedy.countDocuments({
      isPublished: true,
      isDeleted: false,
      $or: [{ difficulty: 'EASY' }, { difficultyLevel: 'EASY' }],
    }),
    Remedy.countDocuments({
      isPublished: true,
      isDeleted: false,
      $or: [{ difficulty: 'MEDIUM' }, { difficultyLevel: 'MEDIUM' }],
    }),
    Remedy.countDocuments({
      isPublished: true,
      isDeleted: false,
      $or: [
        { difficulty: 'HARD' },
        { difficultyLevel: 'HARD' },
        { difficultyLevel: 'ADVANCED' },
      ],
    }),
  ]);

  return [
    { name: 'EASY', count: counts[0] },
    { name: 'MEDIUM', count: counts[1] },
    { name: 'HARD', count: counts[2] },
  ].filter((f) => f.count > 0);
}
