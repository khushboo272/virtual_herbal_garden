import mongoose from 'mongoose';
import Tour, { ITour } from './Tour.model';
import TourProgress from './TourProgress.model';
import '../library/Plant.model';
import ActivityLog from '../notifications/ActivityLog.model';
import { notificationService } from '../notifications/notification.service';
import { HEALTH_CATEGORIES } from '../library/health-categories';
import { PaginationMeta, UserRole, ActivityType, NotificationType, TourLevel } from '../../types';
import { generateSlug } from '../../core/utils/slug';
import { AppError } from '../../core/utils/apiResponse';
import { logger } from '../../core/utils/logger';
import { putImage, deleteObject } from '../../core/storage/r2Storage';
import { tourCoverKey, tourCoverThumbKey, tourCheckpointKey, publicUrl } from '../../core/storage/assetKeys';
import { validateImageMagicBytes, processTourCover, processTourCheckpointImage } from '../../core/utils/imageProcessor';

export interface TourListFilters {
  q?: string;
  health?: string;
  level?: TourLevel;
  plant?: string;
  sort?: 'featured' | 'newest' | 'shortest';
  page?: number;
  limit?: number;
}

export interface TourCardSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage: string | null;
  healthCategory?: string;
  level: TourLevel;
  estimatedMinutes: number;
  checkpointCount: number;
  isFeatured: boolean;
}

export interface ProgressSummary {
  tourId: string;
  slug: string;
  percent: number;
  completedKeys: string[];
  lastCheckpointKey?: string | null;
  completedAt?: Date | null;
  rating?: number | null;
  startedAt?: Date | null;
}

// In-memory sliding window rate limiter: 30 quiz attempts/min per user
const quizSubmissions = new Map<string, number[]>();

function checkQuizRateLimit(userId: string): void {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 30;

  const timestamps = quizSubmissions.get(userId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxAttempts) {
    throw new AppError('Too many quiz attempts. Please wait a minute before retrying.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  validTimestamps.push(now);
  quizSubmissions.set(userId, validTimestamps);
}

export function normalizeTourDoc(tourDoc: any): any {
  const tour = tourDoc.toObject ? tourDoc.toObject() : { ...tourDoc };

  // Normalize level
  tour.level =
    tour.level ||
    (tour.difficulty === 'EASY'
      ? 'BEGINNER'
      : tour.difficulty === 'MEDIUM'
      ? 'INTERMEDIATE'
      : tour.difficulty === 'HARD'
      ? 'ADVANCED'
      : undefined) ||
    'BEGINNER';

  // Normalize summary / description
  tour.summary = tour.summary || tour.description || '';
  tour.description = tour.description || tour.summary || '';

  // Normalize coverImage
  tour.coverImage = tour.coverImage || tour.coverImageUrl || null;
  tour.coverImageUrl = tour.coverImageUrl || tour.coverImage || null;

  // Normalize estimatedMinutes
  tour.estimatedMinutes = tour.estimatedMinutes || tour.estimatedDuration || 10;
  tour.estimatedDuration = tour.estimatedDuration || tour.estimatedMinutes || 10;

  // Convert legacy stops to checkpoints if checkpoints missing or empty
  if ((!tour.checkpoints || tour.checkpoints.length === 0) && Array.isArray(tour.stops) && tour.stops.length > 0) {
    tour.checkpoints = tour.stops.map((stop: any, idx: number) => {
      const title = stop.title || `Stop ${stop.order || idx + 1}`;
      const baseKey = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const key = baseKey || `cp-${stop.order || idx + 1}`;

      const plantSlugs: string[] = [];
      if (stop.plant) {
        if (typeof stop.plant === 'object' && stop.plant.slug) {
          plantSlugs.push(stop.plant.slug);
        } else if (typeof stop.plant === 'string' && !mongoose.Types.ObjectId.isValid(stop.plant)) {
          plantSlugs.push(stop.plant);
        }
      }

      return {
        key,
        order: stop.order || idx + 1,
        title,
        summary: stop.description || '',
        body: stop.description || '',
        durationMinutes: 3,
        plantSlugs,
        remedySlugs: [],
        keyTakeaways: [],
      };
    });
  }

  return tour;
}

function sanitizeTourForClient(tourDoc: any): any {
  const tour = normalizeTourDoc(tourDoc);
  if (tour.checkpoints && Array.isArray(tour.checkpoints)) {
    tour.checkpoints = tour.checkpoints.map((cp: any) => {
      const sanitizedCp = { ...cp };
      if (sanitizedCp.quiz && Array.isArray(sanitizedCp.quiz.questions)) {
        sanitizedCp.quiz = {
          passScore: sanitizedCp.quiz.passScore ?? 0.6,
          questions: sanitizedCp.quiz.questions.map((q: any) => ({
            prompt: q.prompt,
            options: q.options,
          })),
        };
      }
      return sanitizedCp;
    });
  }
  return tour;
}

export class TourService {
  /**
   * Public tour listing with filtering, sorting, facets, and pagination.
   */
  async list(filters: TourListFilters): Promise<{ tours: TourCardSummary[]; meta: PaginationMeta }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(48, Math.max(1, filters.limit || 12));
    const skip = (page - 1) * limit;

    const conditions: any[] = [
      { isPublished: true },
      { isDeleted: false },
      {
        $or: [
          { 'checkpoints.0': { $exists: true } },
          { 'stops.0': { $exists: true } },
        ],
      },
    ];

    // Text search
    if (filters.q && filters.q.trim()) {
      const escaped = filters.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      conditions.push({
        $or: [
          { title: searchRegex },
          { summary: searchRegex },
          { description: searchRegex },
          { tags: searchRegex },
          { 'checkpoints.title': searchRegex },
          { 'checkpoints.summary': searchRegex },
          { 'checkpoints.body': searchRegex },
          { 'checkpoints.plantSlugs': searchRegex },
          { 'checkpoints.remedySlugs': searchRegex },
          { 'stops.title': searchRegex },
          { 'stops.description': searchRegex },
        ],
      });
    }

    // Health Category filter
    if (filters.health && filters.health.trim()) {
      const healthSlug = filters.health.trim().toLowerCase();
      const matchedCat = HEALTH_CATEGORIES.find((c) => c.slug.toLowerCase() === healthSlug);
      if (matchedCat) {
        const keywordRegexes = matchedCat.keywords.map((kw) => new RegExp(kw, 'i'));
        conditions.push({
          $or: [
            { healthCategory: healthSlug },
            { tags: { $in: matchedCat.keywords } },
            { summary: { $in: keywordRegexes } },
            { description: { $in: keywordRegexes } },
          ],
        });
      } else {
        conditions.push({ healthCategory: healthSlug });
      }
    }

    // Level filter
    if (filters.level) {
      conditions.push({
        $or: [
          { level: filters.level },
          { difficulty: filters.level === 'BEGINNER' ? 'EASY' : filters.level === 'INTERMEDIATE' ? 'MEDIUM' : 'HARD' },
        ],
      });
    }

    // Plant filter (matches plant slug)
    if (filters.plant && filters.plant.trim()) {
      const plantSlug = filters.plant.trim().toLowerCase();
      conditions.push({
        $or: [
          { 'checkpoints.plantSlugs': plantSlug },
          { tags: plantSlug },
        ],
      });
    }

    const query = conditions.length > 1 ? { $and: conditions } : conditions[0];

    // Sorting
    let sortObj: Record<string, 1 | -1> = { isFeatured: -1, sortOrder: 1, createdAt: -1 };
    if (filters.sort === 'newest') {
      sortObj = { createdAt: -1 };
    } else if (filters.sort === 'shortest') {
      sortObj = { estimatedMinutes: 1, estimatedDuration: 1 };
    }

    const [toursDocs, total, allPublishedTours] = await Promise.all([
      Tour.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      Tour.countDocuments(query),
      Tour.find({
        isPublished: true,
        isDeleted: false,
        $or: [
          { 'checkpoints.0': { $exists: true } },
          { 'stops.0': { $exists: true } },
        ],
      })
        .select('healthCategory level difficulty tags summary description checkpoints stops')
        .lean(),
    ]);

    // Facet calculations
    const healthFacets: Array<{ slug: string; label: string; count: number }> = HEALTH_CATEGORIES.map((cat) => {
      const count = allPublishedTours.filter((t: any) => {
        if (t.healthCategory && t.healthCategory.toLowerCase() === cat.slug.toLowerCase()) return true;
        if (t.tags && Array.isArray(t.tags)) {
          if (cat.keywords.some((kw) => t.tags.map((tg: string) => tg.toLowerCase()).includes(kw.toLowerCase()))) return true;
        }
        return false;
      }).length;
      return { slug: cat.slug, label: cat.label, count };
    }).filter((f) => f.count > 0);

    const levelCounts: Record<string, number> = { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0 };
    for (const t of allPublishedTours as any[]) {
      const lvl = t.level || (t.difficulty === 'EASY' ? 'BEGINNER' : t.difficulty === 'MEDIUM' ? 'INTERMEDIATE' : 'ADVANCED') || 'BEGINNER';
      if (levelCounts[lvl] !== undefined) {
        levelCounts[lvl]++;
      }
    }
    const levelFacets = Object.entries(levelCounts).map(([name, count]) => ({ name, count }));

    const tourSummaries: TourCardSummary[] = toursDocs.map((t: any) => {
      const norm = normalizeTourDoc(t);
      const checkpoints = norm.checkpoints || [];
      const cpDuration = checkpoints.reduce((acc: number, c: any) => acc + (c.durationMinutes || 0), 0);
      const estMin = norm.estimatedMinutes || (cpDuration > 0 ? cpDuration : 10);
      const count = checkpoints.length;

      return {
        id: String(norm._id),
        slug: norm.slug,
        title: norm.title,
        summary: norm.summary,
        coverImage: norm.coverImage,
        healthCategory: norm.healthCategory,
        level: norm.level as TourLevel,
        estimatedMinutes: estMin,
        checkpointCount: count,
        isFeatured: Boolean(norm.isFeatured),
      };
    });

    return {
      tours: tourSummaries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        facets: {
          health: healthFacets,
          level: levelFacets,
        },
      },
    };
  }

  /**
   * Public tour detail by slug or ObjectId.
   * Strips quiz answers & explanations from questions.
   * Draft tours require ?preview=1 and user role ADMIN+.
   */
  async getBySlugOrId(
    slugOrId: string,
    options: { preview?: boolean; userRole?: UserRole } = {},
  ): Promise<any> {
    const isId = mongoose.Types.ObjectId.isValid(slugOrId);
    const filter = isId ? { _id: slugOrId, isDeleted: false } : { slug: slugOrId, isDeleted: false };

    const tour = await Tour.findOne(filter)
      .populate('createdBy', 'displayName avatarUrl')
      .populate('stops.plant', 'slug title name')
      .lean();

    if (!tour) {
      throw new AppError('Tour not found', 404, 'NOT_FOUND');
    }

    if (!tour.isPublished) {
      const isAdmin = options.userRole === UserRole.ADMIN || options.userRole === UserRole.SUPER_ADMIN;
      if (!options.preview || !isAdmin) {
        throw new AppError('Tour not found', 404, 'NOT_FOUND');
      }
    }

    return sanitizeTourForClient(tour);
  }

  /**
   * Internal retrieval of raw tour with full quiz answers for scoring.
   */
  async getRawTourBySlug(slug: string): Promise<ITour> {
    const tour = await Tour.findOne({ slug, isDeleted: false }).populate('stops.plant', 'slug title name');
    if (!tour) throw new AppError('Tour not found', 404, 'NOT_FOUND');

    if ((!tour.checkpoints || tour.checkpoints.length === 0) && tour.stops && tour.stops.length > 0) {
      const normalized = normalizeTourDoc(tour);
      tour.checkpoints = normalized.checkpoints;
      tour.level = normalized.level;
    }

    return tour;
  }

  /**
   * Returns all progress summaries for a user.
   */
  async getMeProgress(userId: string): Promise<ProgressSummary[]> {
    const progressList = await TourProgress.find({ userId })
      .populate('tourId', 'slug checkpoints')
      .lean();

    return progressList.map((p: any) => {
      const tour = p.tourId;
      const totalCheckpoints = tour?.checkpoints?.length || 1;
      const completedCount = p.completedKeys?.length || 0;
      const percent = Math.min(100, Math.round((completedCount / totalCheckpoints) * 100));

      return {
        tourId: String(tour?._id || p.tourId),
        slug: tour?.slug || '',
        percent,
        completedKeys: p.completedKeys || [],
        lastCheckpointKey: p.lastCheckpointKey || null,
        completedAt: p.completedAt || null,
        rating: p.rating || null,
        startedAt: p.startedAt || null,
      };
    });
  }

  /**
   * Returns progress for a specific tour by slug for the current user.
   */
  async getTourProgress(userId: string, slug: string): Promise<any> {
    const tour = await Tour.findOne({ slug, isDeleted: false }).select('_id slug checkpoints').lean();
    if (!tour) throw new AppError('Tour not found', 404, 'NOT_FOUND');

    const progress = await TourProgress.findOne({ userId, tourId: tour._id }).lean();
    const totalCheckpoints = tour.checkpoints?.length || 1;

    if (!progress) {
      return {
        tourId: String(tour._id),
        slug: tour.slug,
        percent: 0,
        completedKeys: [],
        quizResults: {},
        lastCheckpointKey: null,
        startedAt: null,
        completedAt: null,
        rating: null,
        ratingComment: null,
      };
    }

    const completedCount = progress.completedKeys?.length || 0;
    const percent = Math.min(100, Math.round((completedCount / totalCheckpoints) * 100));

    // Convert quizResults Map if necessary
    const quizMap = progress.quizResults instanceof Map ? Object.fromEntries(progress.quizResults) : progress.quizResults || {};

    return {
      tourId: String(tour._id),
      slug: tour.slug,
      percent,
      completedKeys: progress.completedKeys || [],
      quizResults: quizMap,
      lastCheckpointKey: progress.lastCheckpointKey || null,
      startedAt: progress.startedAt || null,
      completedAt: progress.completedAt || null,
      rating: progress.rating || null,
      ratingComment: progress.ratingComment || null,
    };
  }

  /**
   * Complete a checkpoint without quiz. Enforces sequential progress.
   */
  async completeCheckpoint(userId: string, slug: string, key: string): Promise<any> {
    const tour = await this.getRawTourBySlug(slug);
    const checkpoints = tour.checkpoints || [];
    const checkpoint = checkpoints.find((c) => c.key === key);

    if (!checkpoint) {
      throw new AppError(`Checkpoint "${key}" not found in this tour`, 404, 'CHECKPOINT_NOT_FOUND');
    }

    if (checkpoint.quiz && checkpoint.quiz.questions && checkpoint.quiz.questions.length > 0) {
      throw new AppError('This checkpoint contains a quiz and must be completed by submitting the quiz', 400, 'QUIZ_REQUIRED');
    }

    let progress = await TourProgress.findOne({ userId, tourId: tour._id });
    if (!progress) {
      progress = new TourProgress({
        userId,
        tourId: tour._id,
        completedKeys: [],
        quizResults: new Map(),
        startedAt: new Date(),
      });
    }

    // Check sequential requirement
    if (tour.sequential !== false && checkpoint.order > 1) {
      const prevOrder = checkpoint.order - 1;
      const prevCheckpoint = checkpoints.find((c) => c.order === prevOrder);
      if (prevCheckpoint && !progress.completedKeys.includes(prevCheckpoint.key)) {
        throw new AppError(`You must complete "${prevCheckpoint.title}" before advancing`, 400, 'SEQUENTIAL_LOCK');
      }
    }

    if (!progress.completedKeys.includes(key)) {
      progress.completedKeys.push(key);
    }
    progress.lastCheckpointKey = key;

    // Check if tour is now fully completed
    const allCompleted = checkpoints.length > 0 && checkpoints.every((c) => progress!.completedKeys.includes(c.key));
    if (allCompleted && !progress.completedAt) {
      progress.completedAt = new Date();
      await this.recordTourCompletion(userId, tour);
    }

    await progress.save();
    return this.getTourProgress(userId, slug);
  }

  /**
   * Submits quiz answers for server scoring.
   */
  async submitQuiz(
    userId: string,
    slug: string,
    key: string,
    answers: number[],
  ): Promise<{ score: number; total: number; passed: boolean; results: Array<{ correct: boolean; explanation: string }> }> {
    checkQuizRateLimit(userId);

    const tour = await this.getRawTourBySlug(slug);
    const checkpoints = tour.checkpoints || [];
    const checkpoint = checkpoints.find((c) => c.key === key);

    if (!checkpoint || !checkpoint.quiz || !checkpoint.quiz.questions || checkpoint.quiz.questions.length === 0) {
      throw new AppError(`Checkpoint "${key}" does not have an active quiz`, 400, 'NO_QUIZ_FOUND');
    }

    const questions = checkpoint.quiz.questions;
    let score = 0;
    const results = questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correctIndex;
      if (isCorrect) score++;
      return {
        correct: isCorrect,
        explanation: q.explanation || '',
      };
    });

    const total = questions.length;
    const passThreshold = checkpoint.quiz.passScore ?? 0.6;
    const passed = (score / total) >= passThreshold;

    let progress = await TourProgress.findOne({ userId, tourId: tour._id });
    if (!progress) {
      progress = new TourProgress({
        userId,
        tourId: tour._id,
        completedKeys: [],
        quizResults: new Map(),
        startedAt: new Date(),
      });
    }

    // Update quizResults Map
    const existing = progress.quizResults ? progress.quizResults.get(key) : null;
    const prevBest = existing ? existing.bestScore : 0;
    const prevAttempts = existing ? existing.attempts : 0;
    const prevPassed = existing ? existing.passed : false;

    progress.quizResults.set(key, {
      bestScore: Math.max(prevBest, score),
      total,
      attempts: prevAttempts + 1,
      passed: prevPassed || passed,
      lastAt: new Date(),
    });

    if (passed) {
      if (!progress.completedKeys.includes(key)) {
        progress.completedKeys.push(key);
      }
      progress.lastCheckpointKey = key;

      const allCompleted = checkpoints.length > 0 && checkpoints.every((c) => progress!.completedKeys.includes(c.key));
      if (allCompleted && !progress.completedAt) {
        progress.completedAt = new Date();
        await this.recordTourCompletion(userId, tour);
      }
    }

    await progress.save();

    return {
      score,
      total,
      passed,
      results,
    };
  }

  /**
   * Imports guest localStorage progress into user account.
   */
  async syncProgress(userId: string, slug: string, guestCompletedKeys: string[]): Promise<any> {
    const tour = await this.getRawTourBySlug(slug);
    const checkpoints = (tour.checkpoints || []).slice().sort((a, b) => a.order - b.order);
    const validTourKeys = new Set(checkpoints.map((c) => c.key));

    let progress = await TourProgress.findOne({ userId, tourId: tour._id });
    if (!progress) {
      progress = new TourProgress({
        userId,
        tourId: tour._id,
        completedKeys: [],
        quizResults: new Map(),
        startedAt: new Date(),
      });
    }

    const currentKeys = new Set(progress.completedKeys);

    if (tour.sequential !== false) {
      // In sequential tours, only import contiguous keys starting from order 1
      for (const cp of checkpoints) {
        if (guestCompletedKeys.includes(cp.key) && validTourKeys.has(cp.key)) {
          currentKeys.add(cp.key);
          progress.lastCheckpointKey = cp.key;
        } else {
          break; // Stop at first missing checkpoint
        }
      }
    } else {
      for (const k of guestCompletedKeys) {
        if (validTourKeys.has(k)) {
          currentKeys.add(k);
          progress.lastCheckpointKey = k;
        }
      }
    }

    progress.completedKeys = Array.from(currentKeys);

    const allCompleted = checkpoints.length > 0 && checkpoints.every((c) => progress!.completedKeys.includes(c.key));
    if (allCompleted && !progress.completedAt) {
      progress.completedAt = new Date();
      await this.recordTourCompletion(userId, tour);
    }

    await progress.save();
    return this.getTourProgress(userId, slug);
  }

  /**
   * Submits a rating for a completed tour.
   */
  async rateTour(userId: string, slug: string, rating: number, comment?: string): Promise<any> {
    const tour = await this.getRawTourBySlug(slug);
    const progress = await TourProgress.findOne({ userId, tourId: tour._id });

    if (!progress || (!progress.completedAt && (tour.checkpoints?.length || 0) !== progress.completedKeys.length)) {
      throw new AppError('You can only rate a tour after completing all checkpoints', 400, 'TOUR_NOT_COMPLETED');
    }

    progress.rating = rating;
    if (comment !== undefined) {
      progress.ratingComment = comment.trim();
    }
    await progress.save();

    return { message: 'Thank you for your rating!', rating: progress.rating };
  }

  /**
   * Resets progress for a tour.
   */
  async restartTour(userId: string, slug: string): Promise<any> {
    const tour = await this.getRawTourBySlug(slug);
    const progress = await TourProgress.findOne({ userId, tourId: tour._id });

    if (progress) {
      progress.completedKeys = [];
      progress.quizResults = new Map();
      progress.lastCheckpointKey = undefined;
      progress.completedAt = undefined;
      await progress.save();
    }

    return { message: 'Tour progress restarted successfully', percent: 0, completedKeys: [] };
  }

  /**
   * ADMIN+: List all tours with started and completed counts.
   */
  async getAdminList(): Promise<any[]> {
    const tours = await Tour.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    const tourIds = tours.map((t) => t._id);

    const stats = await TourProgress.aggregate([
      { $match: { tourId: { $in: tourIds } } },
      {
        $group: {
          _id: '$tourId',
          startedCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = new Map<string, { startedCount: number; completedCount: number }>();
    for (const s of stats) {
      statsMap.set(String(s._id), { startedCount: s.startedCount, completedCount: s.completedCount });
    }

    return tours.map((t: any) => {
      const tourStat = statsMap.get(String(t._id)) || { startedCount: 0, completedCount: 0 };
      const cpCount = t.checkpoints?.length || t.stops?.length || 0;
      return {
        id: String(t._id),
        slug: t.slug,
        title: t.title,
        summary: t.summary || t.description || '',
        healthCategory: t.healthCategory,
        level: t.level || (t.difficulty === 'EASY' ? 'BEGINNER' : t.difficulty === 'MEDIUM' ? 'INTERMEDIATE' : 'ADVANCED'),
        isPublished: Boolean(t.isPublished),
        isFeatured: Boolean(t.isFeatured),
        checkpointCount: cpCount,
        startedCount: tourStat.startedCount,
        completedCount: tourStat.completedCount,
        createdAt: t.createdAt,
      };
    });
  }

  /**
   * ADMIN+: Aggregate system tour analytics.
   */
  async getAdminAnalytics(): Promise<any> {
    const [totalTours, publishedTours, featuredTours, progressStats, ratedStats] = await Promise.all([
      Tour.countDocuments({ isDeleted: false }),
      Tour.countDocuments({ isPublished: true, isDeleted: false }),
      Tour.countDocuments({ isFeatured: true, isDeleted: false }),
      TourProgress.aggregate([
        {
          $group: {
            _id: null,
            totalStarts: { $sum: 1 },
            totalCompletions: {
              $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] },
            },
          },
        },
      ]),
      TourProgress.aggregate([
        { $match: { rating: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalStarts = progressStats[0]?.totalStarts || 0;
    const totalCompletions = progressStats[0]?.totalCompletions || 0;
    const completionRate = totalStarts > 0 ? Math.round((totalCompletions / totalStarts) * 100) : 0;
    const drafts = Math.max(0, totalTours - publishedTours);
    const overallAvgRating = ratedStats[0]?.avgRating ? Number(ratedStats[0].avgRating.toFixed(1)) : 0;
    const totalRatingsCount = ratedStats[0]?.totalRatings || 0;

    return {
      totalTours,
      published: publishedTours,
      drafts,
      featured: featuredTours,
      totalStarts,
      totalCompletions,
      completionRate,
      overallAvgRating,
      totalRatingsCount,
    };
  }

  /**
   * ADMIN+: Per-tour drop-off funnel and engagement analytics.
   */
  async getTourAnalytics(tourId: string): Promise<any> {
    const tour = await Tour.findById(tourId).lean();
    if (!tour || tour.isDeleted) throw new AppError('Tour not found', 404, 'NOT_FOUND');

    const progressDocs = await TourProgress.find({ tourId: tour._id })
      .populate('userId', 'displayName email avatarUrl role')
      .sort({ updatedAt: -1 })
      .lean();

    const started = progressDocs.length;
    const completed = progressDocs.filter((p) => p.completedAt != null).length;
    const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

    const ratedDocs = progressDocs.filter((p) => p.rating != null);
    const avgRating = ratedDocs.length > 0
      ? Number((ratedDocs.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedDocs.length).toFixed(1))
      : 0;

    // Rating distribution (5 to 1)
    const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const p of ratedDocs) {
      const r = Math.min(5, Math.max(1, Math.round(p.rating || 0)));
      ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
    }

    // Learner ratings & reviews list
    const ratingsList = ratedDocs.map((p) => {
      const user = (p.userId && typeof p.userId === 'object') ? (p.userId as any) : null;
      return {
        id: String(p._id),
        rating: p.rating,
        comment: p.ratingComment || null,
        user: {
          displayName: user?.displayName || 'Learner',
          email: user?.email || '',
          avatarUrl: user?.avatarUrl || null,
        },
        createdAt: (p.updatedAt || p.createdAt || new Date()).toISOString(),
      };
    });

    // Quiz score average across all completed quizzes
    let totalQuizScores = 0;
    let totalQuizzes = 0;
    for (const p of progressDocs) {
      if (p.quizResults) {
        const qMap = p.quizResults instanceof Map ? Object.fromEntries(p.quizResults) : p.quizResults;
        for (const res of Object.values(qMap) as any[]) {
          if (res && res.total > 0) {
            totalQuizScores += (res.bestScore / res.total);
            totalQuizzes++;
          }
        }
      }
    }
    const avgQuizScore = totalQuizzes > 0 ? Math.round((totalQuizScores / totalQuizzes) * 100) : 0;

    // Checkpoints list
    const checkpoints = (tour.checkpoints || []).slice().sort((a, b) => a.order - b.order);

    // Per-checkpoint drop-off funnel & quiz pass rates
    const perCheckpoint = checkpoints.map((cp) => {
      const completedCp = progressDocs.filter((p) => p.completedKeys?.includes(cp.key)).length;
      const reached = progressDocs.filter((p) => p.completedKeys?.includes(cp.key) || p.lastCheckpointKey === cp.key).length;
      const dropOffPct = started > 0 ? Math.round(((started - reached) / started) * 100) : 0;

      // Quiz analytics for this checkpoint
      const hasQuiz = Boolean(cp.quiz && cp.quiz.questions && cp.quiz.questions.length > 0);
      let quizAttempts = 0;
      let quizPassed = 0;
      let quizScoreSum = 0;

      for (const p of progressDocs) {
        if (p.quizResults) {
          const qMap = p.quizResults instanceof Map ? Object.fromEntries(p.quizResults) : p.quizResults;
          const qRes = qMap[cp.key] as any;
          if (qRes && qRes.total > 0) {
            quizAttempts++;
            if (qRes.passed) quizPassed++;
            quizScoreSum += (qRes.bestScore / qRes.total);
          }
        }
      }

      const quizPassRate = quizAttempts > 0 ? Math.round((quizPassed / quizAttempts) * 100) : null;
      const quizAvgScore = quizAttempts > 0 ? Math.round((quizScoreSum / quizAttempts) * 100) : null;

      return {
        key: cp.key,
        title: cp.title,
        order: cp.order,
        durationMinutes: cp.durationMinutes || 3,
        reached,
        completed: completedCp,
        dropOffPct: Math.max(0, dropOffPct),
        hasQuiz,
        quizQuestionsCount: cp.quiz?.questions?.length || 0,
        quizAttempts,
        quizPassRate,
        quizAvgScore,
        plantSlugs: cp.plantSlugs || [],
        remedySlugs: cp.remedySlugs || [],
        keyTakeaways: cp.keyTakeaways || [],
        hasAudio: Boolean(cp.audioUrl),
      };
    });

    // Recent learner sessions list
    const recentSessions = progressDocs.slice(0, 50).map((p) => {
      const user = (p.userId && typeof p.userId === 'object') ? (p.userId as any) : null;
      const completedCpCount = p.completedKeys?.length || 0;
      const totalCp = checkpoints.length;
      const percent = totalCp > 0 ? Math.min(100, Math.round((completedCpCount / totalCp) * 100)) : (p.completedAt ? 100 : 0);

      let userQuizScore = 0;
      let userQuizCount = 0;
      if (p.quizResults) {
        const qMap = p.quizResults instanceof Map ? Object.fromEntries(p.quizResults) : p.quizResults;
        for (const res of Object.values(qMap) as any[]) {
          if (res && res.total > 0) {
            userQuizScore += (res.bestScore / res.total);
            userQuizCount++;
          }
        }
      }
      const sessionAvgQuiz = userQuizCount > 0 ? Math.round((userQuizScore / userQuizCount) * 100) : null;

      return {
        id: String(p._id),
        user: {
          id: user?._id ? String(user._id) : undefined,
          displayName: user?.displayName || 'Learner',
          email: user?.email || '',
          avatarUrl: user?.avatarUrl || null,
        },
        percent,
        completedCount: completedCpCount,
        totalCheckpoints: totalCp,
        isCompleted: Boolean(p.completedAt),
        lastCheckpointKey: p.lastCheckpointKey || null,
        rating: p.rating || null,
        avgQuizScore: sessionAvgQuiz,
        startedAt: (p.startedAt || p.createdAt || new Date()).toISOString(),
        completedAt: p.completedAt ? p.completedAt.toISOString() : null,
        updatedAt: (p.updatedAt || p.createdAt || new Date()).toISOString(),
      };
    });

    return {
      tourId: String(tour._id),
      slug: tour.slug,
      title: tour.title,
      started,
      completed,
      completionRate,
      avgRating,
      avgQuizScore,
      tour: {
        id: String(tour._id),
        title: tour.title,
        slug: tour.slug,
        summary: tour.summary || '',
        level: tour.level || 'BEGINNER',
        healthCategory: tour.healthCategory || 'General',
        isPublished: tour.isPublished,
        isFeatured: tour.isFeatured || false,
        coverImageUrl: tour.coverImageUrl || null,
        estimatedMinutes: tour.estimatedMinutes || tour.estimatedDuration || 10,
        checkpointsCount: checkpoints.length,
      },
      ratingDistribution,
      ratingsList,
      recentSessions,
      perCheckpoint,
    };
  }

  /**
   * ADMIN+: Create new tour.
   */
  async create(data: Partial<ITour>, userId: string): Promise<ITour> {
    const slug = data.slug?.trim() || generateSlug(data.title || 'untitled-tour');

    const existing = await Tour.findOne({ slug });
    if (existing) {
      throw new AppError(`A tour with slug "${slug}" already exists`, 409, 'SLUG_CONFLICT');
    }

    const checkpoints = data.checkpoints || [];
    const cpDuration = checkpoints.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);
    const estimatedMinutes = data.estimatedMinutes || (cpDuration > 0 ? cpDuration : data.estimatedDuration) || 10;

    const tour = await Tour.create({
      ...data,
      slug,
      estimatedMinutes,
      estimatedDuration: estimatedMinutes,
      createdBy: userId,
    });

    return tour;
  }

  /**
   * ADMIN+: Update tour.
   */
  async update(tourId: string, data: Partial<ITour>): Promise<ITour> {
    const tour = await Tour.findById(tourId);
    if (!tour || tour.isDeleted) throw new AppError('Tour not found', 404, 'NOT_FOUND');

    if (data.slug && data.slug !== tour.slug) {
      const existing = await Tour.findOne({ slug: data.slug, _id: { $ne: tour._id } });
      if (existing) throw new AppError(`A tour with slug "${data.slug}" already exists`, 409, 'SLUG_CONFLICT');
    }

    if (data.checkpoints && data.checkpoints.length > 0) {
      const cpDuration = data.checkpoints.reduce((acc, c) => acc + (c.durationMinutes || 0), 0);
      if (!data.estimatedMinutes) {
        data.estimatedMinutes = cpDuration > 0 ? cpDuration : tour.estimatedMinutes;
      }
    }

    Object.assign(tour, data);
    await tour.save();
    return tour;
  }

  /**
   * ADMIN+: Publish tour. Validates at least 1 checkpoint exists.
   */
  async publish(tourId: string): Promise<ITour> {
    const tour = await Tour.findById(tourId);
    if (!tour || tour.isDeleted) throw new AppError('Tour not found', 404, 'NOT_FOUND');

    const checkpointCount = (tour.checkpoints?.length || 0) + (tour.stops?.length || 0);
    if (checkpointCount === 0) {
      throw new AppError('Cannot publish tour without at least 1 checkpoint', 400, 'NO_CHECKPOINTS');
    }

    tour.isPublished = true;
    await tour.save();
    return tour;
  }

  /**
   * ADMIN+: Unpublish tour.
   */
  async unpublish(tourId: string): Promise<ITour> {
    const tour = await Tour.findById(tourId);
    if (!tour || tour.isDeleted) throw new AppError('Tour not found', 404, 'NOT_FOUND');

    tour.isPublished = false;
    await tour.save();
    return tour;
  }

  /**
   * ADMIN+: Soft delete.
   */
  async softDelete(tourId: string): Promise<void> {
    const tour = await Tour.findByIdAndUpdate(tourId, { isDeleted: true });
    if (!tour) throw new AppError('Tour not found', 404, 'NOT_FOUND');
  }

  /**
   * Helper to write ActivityLog and Notification on completion.
   */
  private async recordTourCompletion(userId: string, tour: ITour): Promise<void> {
    try {
      await ActivityLog.create({
        user: new mongoose.Types.ObjectId(userId),
        activityType: ActivityType.COMPLETE_TOUR,
        entityId: tour._id,
        metadata: {
          tourSlug: tour.slug,
          tourTitle: tour.title,
        },
      });

      await notificationService.createNotification(
        userId,
        NotificationType.SYSTEM,
        `Tour Completed: ${tour.title}`,
        `Congratulations! You have completed all checkpoints in the "${tour.title}" guided tour.`,
        `/virtual-tour/${tour.slug}`,
      );
    } catch (err) {
      logger.error('Failed to log tour completion or notify user', err);
    }
  }

  /**
   * Uploads and processes a high-res cover and thumbnail to Cloudflare R2.
   */
  async uploadTourCover(idOrSlug: string, buffer: Buffer): Promise<{ coverImage: string; coverThumb: string }> {
    const mime = validateImageMagicBytes(buffer);
    if (!mime) {
      throw new AppError('Invalid image format. Accepted: JPEG, PNG, WebP', 400, 'INVALID_FORMAT');
    }

    const tour = await this.getRawTour(idOrSlug);
    const { full, thumb } = await processTourCover(buffer);

    const coverKey = tourCoverKey(tour.slug);
    const thumbKey = tourCoverThumbKey(tour.slug);

    await Promise.all([
      putImage({ key: coverKey, buffer: full, contentType: 'image/webp' }),
      putImage({ key: thumbKey, buffer: thumb, contentType: 'image/webp' }),
    ]);

    const version = Date.now();
    const coverUrl = publicUrl(coverKey, version);
    const thumbUrl = publicUrl(thumbKey, version);

    tour.coverImage = coverUrl;
    tour.coverImageUrl = coverUrl;
    await tour.save();

    return { coverImage: coverUrl, coverThumb: thumbUrl };
  }

  /**
   * Deletes the tour cover and thumbnail from Cloudflare R2 and clears tour model fields.
   */
  async deleteTourCover(idOrSlug: string): Promise<void> {
    const tour = await this.getRawTour(idOrSlug);
    const coverKey = tourCoverKey(tour.slug);
    const thumbKey = tourCoverThumbKey(tour.slug);

    await Promise.all([
      deleteObject(coverKey),
      deleteObject(thumbKey),
    ]);

    tour.coverImage = '';
    tour.coverImageUrl = '';
    await tour.save();
  }

  /**
   * Uploads and optimizes a checkpoint image to Cloudflare R2.
   */
  async uploadCheckpointImage(idOrSlug: string, checkpointKeyStr: string, buffer: Buffer): Promise<{ imageUrl: string }> {
    const mime = validateImageMagicBytes(buffer);
    if (!mime) {
      throw new AppError('Invalid image format. Accepted: JPEG, PNG, WebP', 400, 'INVALID_FORMAT');
    }

    const tour = await this.getRawTour(idOrSlug);
    const cp = (tour.checkpoints || []).find((c: any) => c.key === checkpointKeyStr);
    if (!cp) {
      throw new AppError(`Checkpoint "${checkpointKeyStr}" not found in tour`, 404, 'CHECKPOINT_NOT_FOUND');
    }

    const processed = await processTourCheckpointImage(buffer);
    const cpKey = tourCheckpointKey(tour.slug, checkpointKeyStr);

    await putImage({ key: cpKey, buffer: processed, contentType: 'image/webp' });

    const url = publicUrl(cpKey, Date.now());
    cp.imageUrl = url;
    await tour.save();

    return { imageUrl: url };
  }

  private async getRawTour(idOrSlug: string): Promise<any> {
    let query: any;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      query = { _id: idOrSlug, isDeleted: false };
    } else {
      query = { slug: idOrSlug, isDeleted: false };
    }
    const tour = await Tour.findOne(query);
    if (!tour) {
      throw new AppError('Tour not found', 404, 'TOUR_NOT_FOUND');
    }
    return tour;
  }
}

export const tourService = new TourService();

/**
 * Returns up to `limit` published tours for the home page.
 * Standalone export so the home service stays decoupled.
 */
export async function getFeaturedTours(limit = 3): Promise<any[]> {
  const tours = await Tour.find({
    isPublished: true,
    isDeleted: false,
    $or: [
      { 'checkpoints.0': { $exists: true } },
      { 'stops.0': { $exists: true } },
    ],
  })
    .sort({ isFeatured: -1, createdAt: -1 })
    .select('title slug description summary difficulty level estimatedDuration estimatedMinutes coverImage coverImageUrl checkpoints stops')
    .limit(limit)
    .lean();

  return tours.map((t: any) => {
    const norm = normalizeTourDoc(t);
    return {
      _id: norm._id,
      id: String(norm._id),
      title: norm.title,
      slug: norm.slug,
      description: norm.summary,
      summary: norm.summary,
      difficulty: norm.difficulty || 'EASY',
      level: norm.level,
      estimatedDuration: norm.estimatedMinutes,
      estimatedMinutes: norm.estimatedMinutes,
      coverImageUrl: norm.coverImage,
    };
  });
}

/** Returns total published tour count with at least one checkpoint */
export async function getPublishedTourCount(): Promise<number> {
  return Tour.countDocuments({
    isPublished: true,
    isDeleted: false,
    $or: [
      { 'checkpoints.0': { $exists: true } },
      { 'stops.0': { $exists: true } },
    ],
  });
}

