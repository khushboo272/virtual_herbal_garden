import { Types } from 'mongoose';
import Plant from '../library/Plant.model';
import Remedy from '../remedies/Remedy.model';
import Tour from '../tours/Tour.model';
import Garden from '../garden/Garden.model';
import Bookmark from '../users/Bookmark.model';
import { BookmarkEntityType, ContentStatus } from '../../types';
import { AppError } from '../../core/errors/AppError';
import { writeAuditLog } from '../../core/utils/auditLogger';

export interface ContentQueryFilters {
  status?: string;
  owner?: string;
  featured?: boolean | string;
  q?: string;
  sort?: string;
  page?: number | string;
  limit?: number | string;
}

function normalizeContentType(type: string): 'plants' | 'remedies' {
  const lower = String(type).toLowerCase();
  return lower === 'plant' || lower === 'plants' ? 'plants' : 'remedies';
}

export class AdminContentService {
  /**
   * List all content (plants or remedies) across all statuses with filtering and search
   */
  async listContent(type: 'plants' | 'remedies' | string, filters: ContentQueryFilters) {
    const targetType = normalizeContentType(type);
    const page = Math.max(1, parseInt(String(filters.page || 1), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(filters.limit || 20), 10)));
    const skip = (page - 1) * limit;

    const query: any = { isDeleted: { $ne: true } };

    if (filters.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }

    if (filters.owner && Types.ObjectId.isValid(filters.owner)) {
      query.$or = [{ owner: new Types.ObjectId(filters.owner) }, { createdBy: new Types.ObjectId(filters.owner) }];
    }

    if (filters.featured !== undefined && filters.featured !== '') {
      query.isFeatured = filters.featured === true || filters.featured === 'true';
    }

    if (filters.q && filters.q.trim()) {
      const regex = new RegExp(filters.q.trim(), 'i');
      if (targetType === 'plants') {
        query.$or = [
          { commonName: regex },
          { scientificName: regex },
          { family: regex },
          { slug: regex },
        ];
      } else {
        query.$or = [{ title: regex }, { slug: regex }, { description: regex }];
      }
    }

    let sortObj: any = { createdAt: -1 };
    switch (filters.sort) {
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'updated':
        sortObj = { updatedAt: -1 };
        break;
      case 'name_asc':
        sortObj = type === 'plants' ? { commonName: 1 } : { title: 1 };
        break;
      case 'name_desc':
        sortObj = type === 'plants' ? { commonName: -1 } : { title: -1 };
        break;
      case 'newest':
      default:
        sortObj = { createdAt: -1 };
        break;
    }

    const Model = type === 'plants' ? Plant : (Remedy as any);

    const [items, total] = await Promise.all([
      Model.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('owner', 'name displayName email avatar role')
        .populate('createdBy', 'name displayName email avatar role')
        .lean(),
      Model.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Publish an item
   */
  async publish(type: 'plants' | 'remedies' | string, id: string, adminUser: any, req?: any) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);

    const targetType = normalizeContentType(type);
    const Model = targetType === 'plants' ? Plant : (Remedy as any);
    const item = await Model.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) throw new AppError(`${targetType === 'plants' ? 'Plant' : 'Remedy'} not found`, 404);

    const prevPublished = item.isPublished;
    item.isPublished = true;
    item.status = ContentStatus.PUBLISHED;
    if (targetType === 'plants') {
      (item as any).publishedAt = new Date();
    }
    await item.save();

    await writeAuditLog({
      actor: adminUser._id,
      action: 'CONTENT_PUBLISHED',
      targetModel: targetType === 'plants' ? 'Plant' : 'Remedy',
      targetId: item._id,
      details: {
        slug: item.slug,
        title: (item as any).commonName || (item as any).title,
        before: { isPublished: prevPublished },
        after: { isPublished: true },
      },
      req,
    });

    return item;
  }

  /**
   * Unpublish an item
   */
  async unpublish(type: 'plants' | 'remedies' | string, id: string, adminUser: any, req?: any) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);

    const targetType = normalizeContentType(type);
    const Model = targetType === 'plants' ? Plant : (Remedy as any);
    const item = await Model.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) throw new AppError(`${targetType === 'plants' ? 'Plant' : 'Remedy'} not found`, 404);

    const prevPublished = item.isPublished;
    item.isPublished = false;
    item.status = ContentStatus.DRAFT;
    await item.save();

    await writeAuditLog({
      actor: adminUser._id,
      action: 'CONTENT_UNPUBLISHED',
      targetModel: targetType === 'plants' ? 'Plant' : 'Remedy',
      targetId: item._id,
      details: {
        slug: item.slug,
        title: (item as any).commonName || (item as any).title,
        before: { isPublished: prevPublished },
        after: { isPublished: false },
      },
      req,
    });

    return item;
  }

  /**
   * Toggle featured status
   */
  async toggleFeature(type: 'plants' | 'remedies', id: string, adminUser: any, req?: any) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);

    const Model = type === 'plants' ? Plant : (Remedy as any);
    const item = await Model.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) throw new AppError(`${type === 'plants' ? 'Plant' : 'Remedy'} not found`, 404);

    const prevFeatured = !!item.isFeatured;
    item.isFeatured = !prevFeatured;
    await item.save();

    await writeAuditLog({
      actor: adminUser._id,
      action: item.isFeatured ? 'CONTENT_FEATURED' : 'CONTENT_UNFEATURED',
      targetModel: type === 'plants' ? 'Plant' : 'Remedy',
      targetId: item._id,
      details: {
        slug: item.slug,
        isFeatured: item.isFeatured,
      },
      req,
    });

    return item;
  }

  /**
   * Impact calculation for content before deletion
   */
  async getImpact(type: 'plants' | 'remedies' | string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);
    const objId = new Types.ObjectId(id);
    const targetType = normalizeContentType(type);

    if (targetType === 'plants') {
      const [remediesCount, toursCount, gardensCount, bookmarksCount] = await Promise.all([
        Remedy.countDocuments({
          $or: [{ plants: objId }, { 'ingredients.plantId': objId }],
          isDeleted: { $ne: true },
        }),
        Tour.countDocuments({
          'checkpoints.plant': objId,
          isDeleted: { $ne: true },
        }),
        Garden.countDocuments({
          'plants.plant': objId,
        }),
        Bookmark.countDocuments({
          entityType: BookmarkEntityType.PLANT,
          entityId: objId,
        }),
      ]);

      return {
        remedies: remediesCount,
        remediesCount,
        tours: toursCount,
        toursCount,
        userGardens: gardensCount,
        gardensCount,
        bookmarks: bookmarksCount,
        bookmarksCount,
        total: remediesCount + toursCount + gardensCount + bookmarksCount,
      };
    } else {
      const bookmarksCount = await Bookmark.countDocuments({
        entityType: BookmarkEntityType.REMEDY,
        entityId: objId,
      });

      return {
        remedies: 0,
        remediesCount: 0,
        tours: 0,
        toursCount: 0,
        userGardens: 0,
        gardensCount: 0,
        bookmarks: bookmarksCount,
        bookmarksCount,
        total: bookmarksCount,
      };
    }
  }

  /**
   * Delete content (requires item to be unpublished first and confirm slug)
   */
  async deleteContent(
    type: 'plants' | 'remedies' | string,
    id: string,
    confirmSlug: string,
    adminUser: any,
    req?: any,
  ) {
    if (!Types.ObjectId.isValid(id)) throw new AppError('Invalid ID', 400);

    const targetType = normalizeContentType(type);
    const Model = targetType === 'plants' ? Plant : (Remedy as any);
    const item = await Model.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!item) throw new AppError(`${targetType === 'plants' ? 'Plant' : 'Remedy'} not found`, 404);

    if (item.isPublished) {
      throw new AppError(
        'Item must be unpublished before deletion. Please unpublish it first.',
        400,
        'ITEM_PUBLISHED',
      );
    }

    if (!confirmSlug || item.slug !== confirmSlug.trim()) {
      throw new AppError(
        `Confirmation slug does not match. Expected "${item.slug}"`,
        400,
        'SLUG_MISMATCH',
      );
    }

    item.isDeleted = true;
    (item as any).deletedAt = new Date();
    await item.save();

    await writeAuditLog({
      actor: adminUser._id,
      action: 'CONTENT_DELETED',
      targetModel: type === 'plants' ? 'Plant' : 'Remedy',
      targetId: item._id,
      details: {
        slug: item.slug,
        title: (item as any).commonName || (item as any).title,
      },
      req,
    });

    return { success: true, message: 'Item deleted successfully' };
  }

  /**
   * Bulk unpublish items (max 50)
   */
  async bulkUnpublish(type: 'plants' | 'remedies', ids: string[], adminUser: any, req?: any) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('IDs array is required', 400);
    }
    if (ids.length > 50) {
      throw new AppError('Bulk action limit is 50 items maximum', 400, 'LIMIT_EXCEEDED');
    }

    const Model = type === 'plants' ? Plant : (Remedy as any);
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const items = await Model.find({ _id: { $in: validIds }, isDeleted: { $ne: true } });

    for (const item of items) {
      if (item.isPublished) {
        item.isPublished = false;
        item.status = ContentStatus.DRAFT;
        await item.save();

        await writeAuditLog({
          actor: adminUser._id,
          action: 'CONTENT_UNPUBLISHED',
          targetModel: type === 'plants' ? 'Plant' : 'Remedy',
          targetId: item._id,
          details: { slug: item.slug, bulk: true },
          req,
        });
      }
    }

    return { processed: items.length, success: true };
  }

  /**
   * Bulk delete items (max 50, all must be unpublished)
   */
  async bulkDelete(type: 'plants' | 'remedies', ids: string[], adminUser: any, req?: any) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('IDs array is required', 400);
    }
    if (ids.length > 50) {
      throw new AppError('Bulk action limit is 50 items maximum', 400, 'LIMIT_EXCEEDED');
    }

    const Model = type === 'plants' ? Plant : (Remedy as any);
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const items = await Model.find({ _id: { $in: validIds }, isDeleted: { $ne: true } });

    const publishedItems = items.filter((it: any) => it.isPublished);
    if (publishedItems.length > 0) {
      throw new AppError(
        `Cannot delete: ${publishedItems.length} selected item(s) are still published. All items must be unpublished first.`,
        400,
        'ITEMS_PUBLISHED',
      );
    }

    for (const item of items) {
      item.isDeleted = true;
      (item as any).deletedAt = new Date();
      await item.save();

      await writeAuditLog({
        actor: adminUser._id,
        action: 'CONTENT_DELETED',
        targetModel: type === 'plants' ? 'Plant' : 'Remedy',
        targetId: item._id,
        details: { slug: item.slug, bulk: true },
        req,
      });
    }

    return { processed: items.length, success: true };
  }
}

export const adminContentService = new AdminContentService();
