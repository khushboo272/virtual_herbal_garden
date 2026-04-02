import Tour, { ITour } from '../models/Tour';
import { PaginationMeta } from '../types';
import { generateSlug } from '../utils/slug';
import { AppError } from '../utils/apiResponse';

export class TourService {
  async list(page: number, limit: number): Promise<{ tours: ITour[]; meta: PaginationMeta }> {
    const skip = (page - 1) * limit;
    const [tours, total] = await Promise.all([
      Tour.find({ isPublished: true, isDeleted: false })
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('stops.plant', 'commonName slug images').lean(),
      Tour.countDocuments({ isPublished: true, isDeleted: false }),
    ]);
    return { tours: tours as unknown as ITour[], meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getBySlug(slug: string): Promise<ITour> {
    const tour = await Tour.findOne({ slug, isDeleted: false })
      .populate('stops.plant', 'commonName slug images scientificName model3dUrl')
      .populate('createdBy', 'displayName avatarUrl');
    if (!tour) throw new AppError('Tour not found', 404, 'NOT_FOUND');
    return tour;
  }

  async create(data: Partial<ITour>, userId: string): Promise<ITour> {
    return Tour.create({ ...data, slug: generateSlug(data.title || ''), createdBy: userId });
  }

  async update(tourId: string, data: Partial<ITour>): Promise<ITour> {
    const tour = await Tour.findById(tourId);
    if (!tour || tour.isDeleted) throw new AppError('Tour not found', 404, 'NOT_FOUND');
    if (data.title && data.title !== tour.title) data.slug = generateSlug(data.title);
    Object.assign(tour, data);
    await tour.save();
    return tour;
  }

  async softDelete(tourId: string): Promise<void> {
    const r = await Tour.findByIdAndUpdate(tourId, { isDeleted: true });
    if (!r) throw new AppError('Tour not found', 404, 'NOT_FOUND');
  }

  async publish(tourId: string): Promise<ITour> {
    const tour = await Tour.findById(tourId);
    if (!tour) throw new AppError('Tour not found', 404, 'NOT_FOUND');
    tour.isPublished = !tour.isPublished;
    await tour.save();
    return tour;
  }
}

export const tourService = new TourService();
