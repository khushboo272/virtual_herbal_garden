import mongoose from 'mongoose';
import Plant, { IPlant } from '../models/Plant';
import Review, { IReview } from '../models/Review';
import ActivityLog from '../models/ActivityLog';
import { ActivityType, PaginationMeta } from '../types';
import { generateSlug } from '../utils/slug';
import { AppError } from '../utils/apiResponse';
import { redis } from '../config/redis';

interface PlantFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  family?: string;
  tags?: string;
  sort?: string;
  toxicity?: string;
  region?: string;
}

export class PlantService {
  async list(
    filters: PlantFilters,
  ): Promise<{ plants: IPlant[]; meta: PaginationMeta }> {
    const { page, limit, search, category, family, tags, sort, toxicity, region } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { isPublished: true, isDeleted: false };

    if (family) query.family = family;
    if (toxicity) query.toxicityLevel = toxicity;
    if (category) query.categories = new mongoose.Types.ObjectId(category);
    if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim().toLowerCase()) };
    if (region) query.regionNative = { $in: [region] };

    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === 'name') sortObj = { commonName: 1 };
    else if (sort === 'rating') sortObj = { avgRating: -1 };
    else if (sort === 'views') sortObj = { viewCount: -1 };

    // If search, try Atlas Search first, fall back to regex
    if (search) {
      query.$or = [
        { commonName: { $regex: search, $options: 'i' } },
        { scientificName: { $regex: search, $options: 'i' } },
        { medicinalUses: { $regex: search, $options: 'i' } },
      ];
    }

    const [plants, total] = await Promise.all([
      Plant.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('categories', 'name slug')
        .lean(),
      Plant.countDocuments(query),
    ]);

    return {
      plants: plants as unknown as IPlant[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFeatured(): Promise<IPlant[]> {
    // Check Redis cache
    const cached = await redis.get('plants:featured');
    if (cached) return JSON.parse(cached);

    const plants = await Plant.find({
      isFeatured: true,
      isPublished: true,
      isDeleted: false,
    })
      .populate('categories', 'name slug')
      .lean();

    await redis.setex('plants:featured', 300, JSON.stringify(plants)); // 5-min cache
    return plants as unknown as IPlant[];
  }

  async autocomplete(query: string): Promise<Partial<IPlant>[]> {
    // Use regex for autocomplete (Atlas Search in production)
    const results = await Plant.find({
      isPublished: true,
      isDeleted: false,
      $or: [
        { commonName: { $regex: query, $options: 'i' } },
        { scientificName: { $regex: query, $options: 'i' } },
      ],
    })
      .select('commonName scientificName slug images')
      .limit(5)
      .lean();

    return results as unknown as Partial<IPlant>[];
  }

  async getBySlug(slug: string, userId?: string): Promise<IPlant> {
    const plant = await Plant.findOneAndUpdate(
      { slug, isDeleted: false },
      { $inc: { viewCount: 1 } },
      { new: true },
    )
      .populate('categories', 'name slug')
      .populate('createdBy', 'displayName avatarUrl');

    if (!plant) {
      throw new AppError('Plant not found', 404, 'NOT_FOUND');
    }

    // Log activity
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
      ],
    })
      .limit(6)
      .select('commonName slug images avgRating family')
      .lean();

    return related as unknown as IPlant[];
  }

  async create(data: Partial<IPlant>, userId: string): Promise<IPlant> {
    const slug = generateSlug(data.commonName || '');

    const plant = await Plant.create({
      ...data,
      slug,
      createdBy: userId,
    });

    // Invalidate featured cache
    await redis.del('plants:featured');

    return plant;
  }

  async update(plantId: string, data: Partial<IPlant>, userId: string, userRole: string): Promise<IPlant> {
    const plant = await Plant.findById(plantId);
    if (!plant || plant.isDeleted) {
      throw new AppError('Plant not found', 404, 'NOT_FOUND');
    }

    // BOTANIST can only update own plants
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

    const review = await Review.create({
      plant: plantId,
      user: userId,
      ...data,
    });

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
