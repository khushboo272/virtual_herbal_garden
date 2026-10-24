import mongoose from 'mongoose';
import Plant, { IPlant } from '../library/Plant.model';
import Remedy, { IRemedy } from '../remedies/Remedy.model';
import Review from '../library/Review.model';
import Bookmark from '../users/Bookmark.model';
import ActivityLog from '../notifications/ActivityLog.model';
import { notificationService } from '../notifications/notification.service';
import { validateObjectContentSafety } from '../../core/validators/contentSafety';
import { AppError } from '../../core/utils/apiResponse';
import { ContentStatus, NotificationType, ActivityType } from '../../types';
import {
  ContributionSummary,
  ContributionListItem,
  ContributionDetailItem,
  ContributionRecentItem,
} from './contribution.types';
import { ContributionQuery } from './contribution.validators';

export class ContributionService {
  /**
   * Aggregates stats across botanist's own authored plants and remedies.
   */
  async getSummary(userId: string): Promise<ContributionSummary> {
    const userObjId = new mongoose.Types.ObjectId(userId);
    const ownerMatch = {
      $or: [{ owner: userObjId }, { createdBy: userObjId }],
      isDeleted: false,
    };

    const [userPlants, userRemedies] = await Promise.all([
      Plant.find(ownerMatch).select('_id commonName slug status isPublished updatedAt images').lean(),
      Remedy.find(ownerMatch).select('_id title slug status isPublished updatedAt image images').lean(),
    ]);

    const allItems = [
      ...userPlants.map((p) => ({
        id: p._id.toString(),
        type: 'plant' as const,
        title: p.commonName,
        slug: p.slug,
        status: (p.status || (p.isPublished ? ContentStatus.PUBLISHED : ContentStatus.DRAFT)) as ContentStatus,
        updatedAt: p.updatedAt || new Date(),
        coverImage: p.images?.[0]?.url || p.images?.[0]?.thumbnailUrl,
      })),
      ...userRemedies.map((r) => ({
        id: r._id.toString(),
        type: 'remedy' as const,
        title: r.title,
        slug: r.slug,
        status: (r.status || (r.isPublished ? ContentStatus.PUBLISHED : ContentStatus.DRAFT)) as ContentStatus,
        updatedAt: r.updatedAt || new Date(),
        coverImage: r.image || r.images?.[0]?.url,
      })),
    ];

    let pendingReview = 0;
    let published = 0;
    let drafts = 0;
    let changesRequested = 0;
    let rejected = 0;

    for (const item of allItems) {
      if (item.status === ContentStatus.PENDING_REVIEW) pendingReview++;
      else if (item.status === ContentStatus.PUBLISHED) published++;
      else if (item.status === ContentStatus.DRAFT) drafts++;
      else if (item.status === ContentStatus.CHANGES_REQUESTED) changesRequested++;
      else if (item.status === ContentStatus.REJECTED) rejected++;
    }

    // Reviews received on contributor's plants
    const plantIds = userPlants.map((p) => p._id);
    const reviewsReceivedOnMyPlants =
      plantIds.length > 0 ? await Review.countDocuments({ plant: { $in: plantIds } }) : 0;

    // Bookmarks on contributor's content
    const allEntityIds = [...plantIds, ...userRemedies.map((r) => r._id)];
    const bookmarksOnMyContent =
      allEntityIds.length > 0
        ? await Bookmark.countDocuments({ entityId: { $in: allEntityIds } })
        : 0;

    // Sort recent items by updatedAt descending
    allItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const recent: ContributionRecentItem[] = allItems.slice(0, 5);

    return {
      pendingReview,
      published,
      drafts,
      changesRequested,
      rejected,
      reviewsReceivedOnMyPlants,
      bookmarksOnMyContent,
      recent,
    };
  }

  /**
   * Lists contributor's own items with status filters, search, and pagination.
   */
  async list(
    userId: string,
    query: ContributionQuery,
  ): Promise<{ items: ContributionListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { type, status, q, sort = 'newest', page = 1, limit = 20 } = query;
    const userObjId = new mongoose.Types.ObjectId(userId);

    const baseOwnerMatch: Record<string, unknown> = {
      $or: [{ owner: userObjId }, { createdBy: userObjId }],
      isDeleted: false,
    };

    if (status) {
      baseOwnerMatch.status = status;
    }

    const items: ContributionListItem[] = [];

    // 1. Fetch plants if type is 'plant' or undefined
    if (!type || type === 'plant') {
      const plantQuery: Record<string, unknown> = { ...baseOwnerMatch };
      if (q && q.trim()) {
        const regex = new RegExp(q.trim(), 'i');
        plantQuery.$and = [
          { $or: baseOwnerMatch.$or },
          { $or: [{ commonName: regex }, { scientificName: regex }, { aliases: regex }] },
        ];
        delete plantQuery.$or;
      }

      const plants = await Plant.find(plantQuery)
        .select('commonName scientificName slug status isPublished images createdAt updatedAt submittedAt reviewNotes references')
        .lean();

      for (const p of plants) {
        const lastNote = p.reviewNotes?.[p.reviewNotes.length - 1];
        items.push({
          id: p._id.toString(),
          type: 'plant',
          title: p.commonName,
          scientificName: p.scientificName,
          slug: p.slug,
          status: (p.status || (p.isPublished ? ContentStatus.PUBLISHED : ContentStatus.DRAFT)) as ContentStatus,
          coverImage: p.images?.[0]?.url || p.images?.[0]?.thumbnailUrl,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          submittedAt: p.submittedAt,
          lastReviewComment: lastNote?.comment || null,
          referencesCount: p.references?.length || 0,
        });
      }
    }

    // 2. Fetch remedies if type is 'remedy' or undefined
    if (!type || type === 'remedy') {
      const remedyQuery: Record<string, unknown> = { ...baseOwnerMatch };
      if (q && q.trim()) {
        const regex = new RegExp(q.trim(), 'i');
        remedyQuery.$and = [
          { $or: baseOwnerMatch.$or },
          { $or: [{ title: regex }, { description: regex }, { tags: regex }] },
        ];
        delete remedyQuery.$or;
      }

      const remedies = await Remedy.find(remedyQuery)
        .select('title slug status isPublished image images createdAt updatedAt submittedAt reviewNotes references')
        .lean();

      for (const r of remedies) {
        const lastNote = r.reviewNotes?.[r.reviewNotes.length - 1];
        items.push({
          id: r._id.toString(),
          type: 'remedy',
          title: r.title,
          slug: r.slug,
          status: (r.status || (r.isPublished ? ContentStatus.PUBLISHED : ContentStatus.DRAFT)) as ContentStatus,
          coverImage: r.image || r.images?.[0]?.url,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          submittedAt: r.submittedAt,
          lastReviewComment: lastNote?.comment || null,
          referencesCount: r.references?.length || 0,
        });
      }
    }

    // Sort items
    items.sort((a, b) => {
      if (sort === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sort === 'status') {
        return a.status.localeCompare(b.status);
      }
      // default: newest
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const total = items.length;
    const skip = (page - 1) * limit;
    const paginated = items.slice(skip, skip + limit);

    return {
      items: paginated,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves single contribution item with its full review notes timeline.
   */
  async getOne(userId: string, type: 'plant' | 'remedy', id: string): Promise<ContributionDetailItem> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query: Record<string, unknown> = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    let item: any;
    let title = '';

    if (type === 'plant') {
      item = await Plant.findOne(query).populate('categories', 'name slug');
      if (!item) throw new AppError('Plant not found', 404, 'NOT_FOUND');
      title = item.commonName;
    } else {
      item = await Remedy.findOne(query).populate('plants', 'commonName slug images');
      if (!item) throw new AppError('Remedy not found', 404, 'NOT_FOUND');
      title = item.title;
    }

    const ownerId = item.owner?.toString() || item.createdBy?.toString();
    if (ownerId !== userId) {
      throw new AppError('You can only view your own contributions', 403, 'FORBIDDEN');
    }

    return {
      id: item._id.toString(),
      type,
      title,
      slug: item.slug,
      status: (item.status || (item.isPublished ? ContentStatus.PUBLISHED : ContentStatus.DRAFT)) as ContentStatus,
      reviewNotes: item.reviewNotes || [],
      data: item.toObject(),
    };
  }

  /**
   * Submits a contribution for review after verifying readiness, content safety, and duplicates.
   */
  async submit(
    userId: string,
    type: 'plant' | 'remedy',
    id: string,
  ): Promise<{ message: string; status: ContentStatus }> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query: Record<string, unknown> = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    const fieldErrors: { field: string; message: string }[] = [];

    if (type === 'plant') {
      const plant = await Plant.findOne(query);
      if (!plant) throw new AppError('Plant not found', 404, 'NOT_FOUND');

      const ownerId = plant.owner?.toString() || plant.createdBy?.toString();
      if (ownerId !== userId) {
        throw new AppError('You can only submit your own contributions', 403, 'FORBIDDEN');
      }

      if (plant.status === ContentStatus.PENDING_REVIEW) {
        throw new AppError('This plant is already under review', 400, 'ALREADY_SUBMITTED');
      }
      if (plant.status === ContentStatus.PUBLISHED) {
        throw new AppError('This plant is already published. Use correction request instead.', 400, 'ALREADY_PUBLISHED');
      }

      // ── Strict Field Validation ──
      if (!plant.commonName || !plant.commonName.trim()) {
        fieldErrors.push({ field: 'commonName', message: 'Common name is required' });
      }
      if (!plant.scientificName || !plant.scientificName.trim()) {
        fieldErrors.push({ field: 'scientificName', message: 'Scientific name is required' });
      }
      if (!plant.family || !plant.family.trim()) {
        fieldErrors.push({ field: 'family', message: 'Family is required' });
      }
      if (!plant.description || plant.description.trim().length < 20) {
        fieldErrors.push({ field: 'description', message: 'Description must be at least 20 characters' });
      }
      if (!plant.medicinalUses || plant.medicinalUses.length === 0) {
        fieldErrors.push({ field: 'medicinalUses', message: 'At least one medicinal use is required' });
      }
      if (!plant.partsUsed || plant.partsUsed.length === 0) {
        fieldErrors.push({ field: 'partsUsed', message: 'At least one plant part used is required' });
      }
      if (!plant.toxicityLevel) {
        fieldErrors.push({ field: 'toxicityLevel', message: 'Toxicity level is required' });
      }
      if (!plant.images || plant.images.length === 0) {
        fieldErrors.push({ field: 'images', message: 'At least one image is required for review' });
      }
      if (!plant.references || plant.references.length === 0) {
        fieldErrors.push({ field: 'references', message: 'At least 1 reliable source or scientific reference is required to submit for review' });
      }

      // ── Duplicate Scientific Name Check ──
      if (plant.scientificName) {
        const duplicate = await Plant.findOne({
          _id: { $ne: plant._id },
          scientificName: { $regex: new RegExp(`^${plant.scientificName.trim()}$`, 'i') },
          isDeleted: false,
        }).select('slug commonName');

        if (duplicate) {
          fieldErrors.push({
            field: 'scientificName',
            message: `A plant with scientific name "${plant.scientificName}" already exists in the library: ${duplicate.commonName} (/plant/${duplicate.slug}).`,
          });
        }
      }

      // ── Content Safety Check ──
      const safetyResult = validateObjectContentSafety(plant.toObject());
      if (!safetyResult.isValid) {
        for (const violation of safetyResult.violations) {
          fieldErrors.push({ field: 'safety', message: violation });
        }
      }

      if (fieldErrors.length > 0) {
        throw new AppError(
          'Please complete all required fields and resolve content safety guidelines before submitting.',
          400,
          'SUBMISSION_VALIDATION_FAILED',
          fieldErrors,
        );
      }

      // Update state
      plant.status = ContentStatus.PENDING_REVIEW;
      plant.submittedAt = new Date();
      plant.isPublished = false;
      plant.reviewNotes.push({
        at: new Date(),
        byUserId: new mongoose.Types.ObjectId(userId),
        action: 'SUBMITTED',
        comment: 'Submitted for editorial review',
      });

      await plant.save();

      // Notify Admins
      await notificationService.notifyAdmins(
        NotificationType.ADMIN,
        'New Plant Submission',
        `Botanist submitted "${plant.commonName}" (${plant.scientificName}) for review.`,
        `/plants/${plant.slug}?preview=1`,
      );

      return { message: 'Plant submitted for review successfully', status: ContentStatus.PENDING_REVIEW };
    } else {
      // ── Remedy Submission ──
      const remedy = await Remedy.findOne(query);
      if (!remedy) throw new AppError('Remedy not found', 404, 'NOT_FOUND');

      const ownerId = remedy.owner?.toString() || remedy.createdBy?.toString();
      if (ownerId !== userId) {
        throw new AppError('You can only submit your own contributions', 403, 'FORBIDDEN');
      }

      if (remedy.status === ContentStatus.PENDING_REVIEW) {
        throw new AppError('This remedy is already under review', 400, 'ALREADY_SUBMITTED');
      }
      if (remedy.status === ContentStatus.PUBLISHED) {
        throw new AppError('This remedy is already published. Use correction request instead.', 400, 'ALREADY_PUBLISHED');
      }

      // ── Strict Field Validation ──
      if (!remedy.title || !remedy.title.trim()) {
        fieldErrors.push({ field: 'title', message: 'Title is required' });
      }
      if (!remedy.description || remedy.description.trim().length < 20) {
        fieldErrors.push({ field: 'description', message: 'Description must be at least 20 characters' });
      }
      if (!remedy.dosage || !remedy.dosage.trim()) {
        fieldErrors.push({ field: 'dosage', message: 'Traditional dosage/preparation guidance is required' });
      }
      if (!remedy.ingredients || remedy.ingredients.length === 0) {
        fieldErrors.push({ field: 'ingredients', message: 'At least one ingredient is required' });
      }
      if (!remedy.preparationSteps || remedy.preparationSteps.length === 0) {
        fieldErrors.push({ field: 'preparationSteps', message: 'At least one preparation step is required' });
      }
      if (!remedy.preparationTime && !remedy.prepTimeMinutes) {
        fieldErrors.push({ field: 'preparationTime', message: 'Estimated preparation time is required' });
      }
      const hasSource = Boolean(remedy.traditionalSource && remedy.traditionalSource.trim().length > 3);
      const hasRefs = Boolean(remedy.references && remedy.references.length > 0);
      if (!hasSource && !hasRefs) {
        fieldErrors.push({
          field: 'references',
          message: 'At least 1 traditional source or authoritative reference is required to submit for review',
        });
      }

      // ── Content Safety Check ──
      const safetyResult = validateObjectContentSafety(remedy.toObject());
      if (!safetyResult.isValid) {
        for (const violation of safetyResult.violations) {
          fieldErrors.push({ field: 'safety', message: violation });
        }
      }

      if (fieldErrors.length > 0) {
        throw new AppError(
          'Please complete all required fields and resolve content safety guidelines before submitting.',
          400,
          'SUBMISSION_VALIDATION_FAILED',
          fieldErrors,
        );
      }

      // Update state
      remedy.status = ContentStatus.PENDING_REVIEW;
      remedy.submittedAt = new Date();
      remedy.isPublished = false;
      remedy.reviewNotes.push({
        at: new Date(),
        byUserId: new mongoose.Types.ObjectId(userId),
        action: 'SUBMITTED',
        comment: 'Submitted for editorial review',
      });

      await remedy.save();

      // Notify Admins
      await notificationService.notifyAdmins(
        NotificationType.ADMIN,
        'New Remedy Submission',
        `Botanist submitted "${remedy.title}" for review.`,
        `/remedies/${remedy.slug}?preview=1`,
      );

      return { message: 'Remedy submitted for review successfully', status: ContentStatus.PENDING_REVIEW };
    }
  }

  /**
   * Withdraws a pending submission back to DRAFT status.
   */
  async withdraw(userId: string, type: 'plant' | 'remedy', id: string): Promise<{ message: string; status: ContentStatus }> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query: Record<string, unknown> = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    const item = type === 'plant' ? await Plant.findOne(query) : await Remedy.findOne(query);
    if (!item) throw new AppError(`${type === 'plant' ? 'Plant' : 'Remedy'} not found`, 404, 'NOT_FOUND');

    const ownerId = item.owner?.toString() || item.createdBy?.toString();
    if (ownerId !== userId) {
      throw new AppError('You can only withdraw your own contributions', 403, 'FORBIDDEN');
    }

    if (item.status !== ContentStatus.PENDING_REVIEW) {
      throw new AppError('Only items currently under review can be withdrawn', 400, 'INVALID_STATE');
    }

    item.status = ContentStatus.DRAFT;
    item.reviewNotes.push({
      at: new Date(),
      byUserId: new mongoose.Types.ObjectId(userId),
      action: 'WITHDRAWN',
      comment: 'Withdrawn by contributor for further edits',
    });

    await item.save();
    return { message: `${type === 'plant' ? 'Plant' : 'Remedy'} withdrawn to draft`, status: ContentStatus.DRAFT };
  }

  /**
   * Soft-deletes a draft, changes-requested, or rejected item.
   */
  async delete(userId: string, type: 'plant' | 'remedy', id: string): Promise<void> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query: Record<string, unknown> = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    const item = type === 'plant' ? await Plant.findOne(query) : await Remedy.findOne(query);
    if (!item) throw new AppError(`${type === 'plant' ? 'Plant' : 'Remedy'} not found`, 404, 'NOT_FOUND');

    const ownerId = item.owner?.toString() || item.createdBy?.toString();
    if (ownerId !== userId) {
      throw new AppError('You can only delete your own contributions', 403, 'FORBIDDEN');
    }

    const deletableStatuses: string[] = [
      ContentStatus.DRAFT,
      ContentStatus.CHANGES_REQUESTED,
      ContentStatus.REJECTED,
    ];

    if (!deletableStatuses.includes(item.status)) {
      throw new AppError(`Cannot delete item in ${item.status} status. Only drafts or rejected items may be deleted.`, 400, 'CANNOT_DELETE');
    }

    item.isDeleted = true;
    await item.save();
  }

  /**
   * Submits a correction request for an already-published item.
   * Does not mutate published content directly; notifies administrators.
   */
  async requestCorrection(
    userId: string,
    type: 'plant' | 'remedy',
    id: string,
    note: string,
  ): Promise<{ message: string }> {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query: Record<string, unknown> = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    const item = type === 'plant' ? await Plant.findOne(query) : await Remedy.findOne(query);
    if (!item) throw new AppError(`${type === 'plant' ? 'Plant' : 'Remedy'} not found`, 404, 'NOT_FOUND');

    const ownerId = item.owner?.toString() || item.createdBy?.toString();
    if (ownerId !== userId) {
      throw new AppError('You can only request corrections for your own contributions', 403, 'FORBIDDEN');
    }

    const isPublished = item.status === ContentStatus.PUBLISHED || item.isPublished;
    if (!isPublished) {
      throw new AppError('Correction requests are for published items only. For drafts, edit the document directly.', 400, 'NOT_PUBLISHED');
    }

    const title = type === 'plant' ? (item as IPlant).commonName : (item as IRemedy).title;

    // Record activity log
    await ActivityLog.create({
      user: userId,
      activityType: ActivityType.CORRECTION_REQUEST,
      entityId: item._id,
      metadata: {
        type,
        title,
        note,
      },
    });

    // Notify administrators
    await notificationService.notifyAdmins(
      NotificationType.ADMIN,
      `Correction Request: ${title}`,
      `Botanist requested a correction on published ${type} "${title}": ${note}`,
      type === 'plant' ? `/plants/${item.slug}` : `/remedies/${item.slug}`,
    );

    return { message: 'Correction request submitted to administrators.' };
  }
}

export const contributionService = new ContributionService();
