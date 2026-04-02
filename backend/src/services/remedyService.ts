import mongoose from 'mongoose';
import Remedy, { IRemedy } from '../models/Remedy';
import { PaginationMeta } from '../types';
import { generateSlug } from '../utils/slug';
import { AppError } from '../utils/apiResponse';

interface RemedyFilters {
  page: number;
  limit: number;
  plant?: string;
  difficulty?: string;
  tags?: string;
  search?: string;
}

export class RemedyService {
  async list(
    filters: RemedyFilters,
  ): Promise<{ remedies: IRemedy[]; meta: PaginationMeta }> {
    const { page, limit, plant, difficulty, tags, search } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { isPublished: true, isDeleted: false };

    if (plant) query.plants = new mongoose.Types.ObjectId(plant);
    if (difficulty) query.difficultyLevel = difficulty;
    if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim().toLowerCase()) };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const [remedies, total] = await Promise.all([
      Remedy.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('plants', 'commonName slug images')
        .lean(),
      Remedy.countDocuments(query),
    ]);

    return {
      remedies: remedies as unknown as IRemedy[],
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBySlug(slug: string): Promise<IRemedy> {
    const remedy = await Remedy.findOne({ slug, isDeleted: false })
      .populate('plants', 'commonName slug images scientificName')
      .populate('createdBy', 'displayName avatarUrl');

    if (!remedy) throw new AppError('Remedy not found', 404, 'NOT_FOUND');
    return remedy;
  }

  async create(data: Partial<IRemedy>, userId: string): Promise<IRemedy> {
    const slug = generateSlug(data.title || '');
    const remedy = await Remedy.create({
      ...data,
      slug,
      createdBy: userId,
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

    if (userRole === 'BOTANIST' && remedy.createdBy.toString() !== userId) {
      throw new AppError('You can only edit your own remedies', 403, 'FORBIDDEN');
    }

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
}

export const remedyService = new RemedyService();
