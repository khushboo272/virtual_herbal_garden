import { Request } from 'express';
import mongoose from 'mongoose';
import Plant from '../library/Plant.model';
import Remedy from '../remedies/Remedy.model';
import RoleApplication, { RoleApplicationStatus } from './RoleApplication.model';
import { ContentStatus, AuditAction, NotificationType, PaginationMeta } from '../../types';
import { AppError } from '../../core/utils/apiResponse';
import { createAuditLog } from '../../core/utils/auditLogger';
import { notificationService } from '../notifications/notification.service';
import { validateObjectContentSafety, ContentSafetyResult } from '../../core/validators/contentSafety';
import { redis } from '../../core/config/redis';

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function normalizeType(type: string): 'plant' | 'remedy' {
  const lower = String(type).toLowerCase();
  return lower === 'plants' || lower === 'plant' ? 'plant' : 'remedy';
}

export function getPendingReviewPredicate(extraConditions: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    status: ContentStatus.PENDING_REVIEW,
    isDeleted: false,
    ...extraConditions,
  };
}

export class ModerationService {
  /**
   * Summary of pending items across plants, remedies, and role applications.
   * NOTE: Tours are not part of moderation.
   */
  async getSummary(): Promise<{ plants: number; remedies: number; applications: number; total: number }> {
    const [plants, remedies, applications] = await Promise.all([
      Plant.countDocuments(getPendingReviewPredicate()),
      Remedy.countDocuments(getPendingReviewPredicate()),
      RoleApplication.countDocuments({ status: RoleApplicationStatus.PENDING }),
    ]);

    return {
      plants,
      remedies,
      applications,
      total: plants + remedies + applications,
    };
  }

  /**
   * Retrieves pending review items for a given content type with search and pagination.
   */
  async listQueue(
    type: 'plant' | 'remedy' | string,
    filters: { status?: ContentStatus; q?: string; page?: number; limit?: number } = {},
  ): Promise<{ items: Record<string, unknown>[]; meta: PaginationMeta; pagination: PaginationMeta }> {
    const targetType = normalizeType(type);
    const status = filters.status || ContentStatus.PENDING_REVIEW;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(filters.limit) || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> =
      status === ContentStatus.PENDING_REVIEW
        ? getPendingReviewPredicate()
        : { status, isDeleted: false };

    if (filters.q && filters.q.trim()) {
      const regex = new RegExp(escapeRegex(filters.q.trim()), 'i');
      if (targetType === 'plant') {
        query.$or = [{ commonName: regex }, { scientificName: regex }];
      } else {
        query.$or = [{ title: regex }];
      }
    }

    const sortOption: Record<string, 1> = { submittedAt: 1 };

    let items: any[];
    let total: number;

    if (targetType === 'plant') {
      [items, total] = await Promise.all([
        Plant.find(query)
          .populate('owner', 'displayName email avatarUrl')
          .populate('createdBy', 'displayName email avatarUrl')
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean(),
        Plant.countDocuments(query),
      ]);
    } else {
      [items, total] = await Promise.all([
        Remedy.find(query)
          .populate('owner', 'displayName email avatarUrl')
          .populate('createdBy', 'displayName email avatarUrl')
          .sort(sortOption)
          .skip(skip)
          .limit(limit)
          .lean(),
        Remedy.countDocuments(query),
      ]);
    }

    const now = Date.now();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

    const formatted = items.map((doc) => {
      const submittedTime = doc.submittedAt ? new Date(doc.submittedAt).getTime() : new Date(doc.createdAt).getTime();
      const isOverdue = now - submittedTime > THREE_DAYS_MS;
      const daysAgo = Math.floor((now - submittedTime) / (24 * 60 * 60 * 1000));

      const ownerDoc = doc.owner || doc.createdBy;
      const owner = {
        id: ownerDoc?._id ? ownerDoc._id.toString() : 'unknown',
        displayName: ownerDoc?.displayName || 'Unknown user',
        email: ownerDoc?.email || '',
        avatarUrl: ownerDoc?.avatarUrl || null,
      };

      if (targetType === 'plant') {
        return {
          id: doc._id.toString(),
          type: 'plant',
          title: doc.commonName,
          subtitle: doc.scientificName,
          family: doc.family,
          slug: doc.slug,
          status: doc.status,
          isPublished: doc.isPublished,
          isFeatured: Boolean(doc.isFeatured),
          submittedAt: doc.submittedAt || doc.createdAt,
          daysAgo,
          isOverdue,
          owner,
          reviewNotesCount: Array.isArray(doc.reviewNotes) ? doc.reviewNotes.length : 0,
          flags: {
            hasImages: Array.isArray(doc.images) && doc.images.length > 0,
            hasMedicinalUses: Array.isArray(doc.medicinalUses) && doc.medicinalUses.length > 0,
            hasReferences: Array.isArray(doc.references) && doc.references.length > 0,
            has3D: Boolean(doc.model3dUrl || doc.modelUrl),
          },
        };
      } else {
        return {
          id: doc._id.toString(),
          type: 'remedy',
          title: doc.title,
          subtitle: doc.difficultyLevel || doc.difficulty || 'Remedy',
          slug: doc.slug,
          status: doc.status,
          isPublished: doc.isPublished,
          submittedAt: doc.submittedAt || doc.createdAt,
          daysAgo,
          isOverdue,
          owner,
          reviewNotesCount: Array.isArray(doc.reviewNotes) ? doc.reviewNotes.length : 0,
          flags: {
            hasIngredients: Array.isArray(doc.ingredients) && doc.ingredients.length > 0,
            hasPreparationSteps: Array.isArray(doc.preparationSteps) && doc.preparationSteps.length > 0,
            hasReferences: Array.isArray(doc.references) && doc.references.length > 0,
          },
        };
      }
    });

    return {
      items: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves full moderation detail for an item with duplicate detection,
   * content safety scanning, and review history.
   */
  async getItemDetail(type: 'plant' | 'remedy' | string, id: string): Promise<Record<string, unknown>> {
    const targetType = normalizeType(type);
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    let doc: any;
    let duplicateCandidates: Record<string, unknown>[] = [];

    if (targetType === 'plant') {
      doc = await Plant.findOne(query)
        .populate('owner', 'displayName email avatarUrl')
        .populate('createdBy', 'displayName email avatarUrl')
        .populate('categories', 'name slug')
        .lean();
      if (!doc) throw new AppError('Plant submission not found', 404, 'NOT_FOUND');

      // Duplicate detection
      const duplicateConditions: Record<string, unknown>[] = [];
      if (doc.scientificName) {
        duplicateConditions.push({
          scientificName: new RegExp(`^${escapeRegex(doc.scientificName.trim())}$`, 'i'),
        });
      }
      if (doc.commonName) {
        duplicateConditions.push({
          commonName: new RegExp(`^${escapeRegex(doc.commonName.trim())}$`, 'i'),
        });
      }

      if (duplicateConditions.length > 0) {
        const found = await Plant.find({
          _id: { $ne: doc._id },
          isDeleted: false,
          $or: duplicateConditions,
        })
          .select('commonName scientificName slug status isPublished images')
          .limit(5)
          .lean();

        duplicateCandidates = found.map((f) => ({
          id: f._id.toString(),
          title: f.commonName,
          subtitle: f.scientificName,
          slug: f.slug,
          isPublished: f.isPublished,
          status: f.status,
          thumbnail: f.images?.[0]?.url || f.images?.[0]?.cardUrl || null,
        }));
      }
    } else {
      doc = await Remedy.findOne(query)
        .populate('owner', 'displayName email avatarUrl')
        .populate('createdBy', 'displayName email avatarUrl')
        .populate('plants', 'commonName slug images')
        .lean();
      if (!doc) throw new AppError('Remedy submission not found', 404, 'NOT_FOUND');

      if (doc.title) {
        const found = await Remedy.find({
          _id: { $ne: doc._id },
          isDeleted: false,
          title: new RegExp(`^${escapeRegex(doc.title.trim())}$`, 'i'),
        })
          .select('title slug status isPublished image images')
          .limit(5)
          .lean();

        duplicateCandidates = found.map((f) => ({
          id: f._id.toString(),
          title: f.title,
          slug: f.slug,
          isPublished: f.isPublished,
          status: f.status,
          thumbnail: f.image || f.images?.[0]?.url || null,
        }));
      }
    }

    // Content safety findings
    const safetyResult: ContentSafetyResult = validateObjectContentSafety(doc);

    // Owner display
    const ownerDoc = doc.owner || doc.createdBy || {};
    const owner = {
      id: ownerDoc._id ? ownerDoc._id.toString() : 'unknown',
      displayName: ownerDoc.displayName || 'Botanist Contributor',
      email: ownerDoc.email || '',
      avatarUrl: ownerDoc.avatarUrl || null,
    };

    return {
      item: {
        ...doc,
        id: doc._id.toString(),
        type,
        owner,
      },
      duplicateCandidates,
      safetyFindings: {
        isValid: safetyResult.isValid,
        violations: safetyResult.violations,
      },
      reviewNotes: doc.reviewNotes || [],
    };
  }

  /**
   * Approves a submission, publishing it and optionally featuring it.
   */
  async approve(
    type: 'plant' | 'remedy' | string,
    id: string,
    adminUserOrId: any,
    options: { feature?: boolean; comment?: string } = {},
    req?: Request,
  ): Promise<{ message: string; status: ContentStatus }> {
    const targetType = normalizeType(type);
    const adminId = typeof adminUserOrId === 'object' ? (adminUserOrId?.sub || adminUserOrId?._id?.toString()) : adminUserOrId;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    let item: any;
    if (targetType === 'plant') {
      item = await Plant.findOne(query);
    } else {
      item = await Remedy.findOne(query);
    }

    if (!item) throw new AppError(`${targetType === 'plant' ? 'Plant' : 'Remedy'} not found`, 404, 'NOT_FOUND');

    const previousStatus = item.status;
    item.status = ContentStatus.PUBLISHED;
    item.isPublished = true;
    if (options.feature !== undefined) {
      item.isFeatured = Boolean(options.feature);
    }

    item.reviewNotes = item.reviewNotes || [];
    item.reviewNotes.push({
      at: new Date(),
      byUserId: new mongoose.Types.ObjectId(adminId),
      action: 'APPROVED',
      comment: options.comment?.trim() || 'Approved by editorial administrator',
    });

    await item.save();

    await redis.del('admin:dashboard-summary');
    await redis.del('plants:featured');

    // Audit log
    await createAuditLog({
      req,
      action: AuditAction.UPDATE,
      entityType: type === 'plant' ? 'Plant' : 'Remedy',
      entityId: item._id.toString(),
      oldValue: { status: previousStatus, isPublished: false },
      newValue: { status: ContentStatus.PUBLISHED, isPublished: true, isFeatured: item.isFeatured },
    });

    // Notify owner
    const ownerId = item.owner?.toString() || item.createdBy?.toString();
    if (ownerId) {
      const title = type === 'plant' ? item.commonName : item.title;
      await notificationService.createNotification(
        ownerId,
        NotificationType.SYSTEM,
        'Contribution Approved!',
        `Your ${type} "${title}" has been approved and published to the botanical library.`,
        `/dashboard/contributions/${type}/${item.slug || item._id}/review`,
      );
    }

    return { message: `${type === 'plant' ? 'Plant' : 'Remedy'} approved and published`, status: ContentStatus.PUBLISHED };
  }

  /**
   * Rejects a submission with a mandatory reason.
   */
  async reject(
    type: 'plant' | 'remedy' | string,
    id: string,
    adminUserOrId: any,
    reason: string,
    req?: Request,
  ): Promise<{ message: string; status: ContentStatus }> {
    if (!reason || !reason.trim()) {
      throw new AppError('A rejection reason is required', 400, 'REASON_REQUIRED');
    }

    const targetType = normalizeType(type);
    const adminId = typeof adminUserOrId === 'object' ? (adminUserOrId?.sub || adminUserOrId?._id?.toString()) : adminUserOrId;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    let item: any;
    if (targetType === 'plant') {
      item = await Plant.findOne(query);
    } else {
      item = await Remedy.findOne(query);
    }

    if (!item) throw new AppError(`${targetType === 'plant' ? 'Plant' : 'Remedy'} not found`, 404, 'NOT_FOUND');

    const previousStatus = item.status;
    item.status = ContentStatus.REJECTED;
    item.isPublished = false;

    item.reviewNotes = item.reviewNotes || [];
    item.reviewNotes.push({
      at: new Date(),
      byUserId: new mongoose.Types.ObjectId(adminId),
      action: 'REJECTED',
      comment: reason.trim(),
    });

    await item.save();

    await redis.del('admin:dashboard-summary');

    // Audit log
    await createAuditLog({
      req,
      action: AuditAction.UPDATE,
      entityType: type === 'plant' ? 'Plant' : 'Remedy',
      entityId: item._id.toString(),
      oldValue: { status: previousStatus },
      newValue: { status: ContentStatus.REJECTED, reason: reason.trim() },
    });

    // Notify owner
    const ownerId = item.owner?.toString() || item.createdBy?.toString();
    if (ownerId) {
      const title = type === 'plant' ? item.commonName : item.title;
      await notificationService.createNotification(
        ownerId,
        NotificationType.SYSTEM,
        'Contribution Rejected',
        `Your ${type} "${title}" was not approved: "${reason.trim()}".`,
        `/dashboard/contributions/${type}/${item.slug || item._id}/review`,
      );
    }

    return { message: `${type === 'plant' ? 'Plant' : 'Remedy'} rejected`, status: ContentStatus.REJECTED };
  }

  /**
   * Requests changes on a submission with mandatory feedback comment.
   */
  async requestChanges(
    type: 'plant' | 'remedy' | string,
    id: string,
    adminUserOrId: any,
    comment: string,
    req?: Request,
  ): Promise<{ message: string; status: ContentStatus }> {
    if (!comment || !comment.trim()) {
      throw new AppError('Feedback comment is required when requesting changes', 400, 'COMMENT_REQUIRED');
    }

    const targetType = normalizeType(type);
    const adminId = typeof adminUserOrId === 'object' ? (adminUserOrId?.sub || adminUserOrId?._id?.toString()) : adminUserOrId;
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = {
      $or: isObjectId ? [{ _id: id }, { slug: id }] : [{ slug: id }],
      isDeleted: false,
    };

    let item: any;
    if (targetType === 'plant') {
      item = await Plant.findOne(query);
    } else {
      item = await Remedy.findOne(query);
    }

    if (!item) throw new AppError(`${targetType === 'plant' ? 'Plant' : 'Remedy'} not found`, 404, 'NOT_FOUND');

    const previousStatus = item.status;
    item.status = ContentStatus.CHANGES_REQUESTED;
    item.isPublished = false;

    item.reviewNotes = item.reviewNotes || [];
    item.reviewNotes.push({
      at: new Date(),
      byUserId: new mongoose.Types.ObjectId(adminId),
      action: 'CHANGES_REQUESTED',
      comment: comment.trim(),
    });

    await item.save();

    await redis.del('admin:dashboard-summary');

    // Audit log
    await createAuditLog({
      req,
      action: AuditAction.UPDATE,
      entityType: type === 'plant' ? 'Plant' : 'Remedy',
      entityId: item._id.toString(),
      oldValue: { status: previousStatus },
      newValue: { status: ContentStatus.CHANGES_REQUESTED, comment: comment.trim() },
    });

    // Notify owner
    const ownerId = item.owner?.toString() || item.createdBy?.toString();
    if (ownerId) {
      const title = type === 'plant' ? item.commonName : item.title;
      await notificationService.createNotification(
        ownerId,
        NotificationType.SYSTEM,
        'Changes Requested on Contribution',
        `Reviewer feedback on "${title}": "${comment.trim()}". Open your draft to update and re-submit.`,
        `/dashboard/contributions/${type}/${item.slug || item._id}/review`,
      );
    }

    return { message: 'Changes requested successfully', status: ContentStatus.CHANGES_REQUESTED };
  }
}

export const moderationService = new ModerationService();
