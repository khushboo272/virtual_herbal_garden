import { Types, FilterQuery } from 'mongoose';
import { AppError } from '../../../core/utils/apiResponse';
import { UserRole } from '../../../types';
import { getRegistryItem } from '../registry';
import { CollectionKey, FilterClause } from '../types';
import { dbWriteService, DbWriteContext } from './dbWrite.service';

export interface BrowseQueryParams {
  page?: number;
  limit?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: FilterClause[];
}

export class BrowserService {
  /**
   * Build MongoDB query from filters array
   */
  buildFilterQuery(collectionKey: CollectionKey, filters?: FilterClause[], search?: string): FilterQuery<any> {
    const reg = getRegistryItem(collectionKey);
    if (!reg) throw new AppError(`Unknown collection ${collectionKey}`, 400, 'INVALID_COLLECTION');

    const query: Record<string, any> = {};

    // 1. Text search across registry searchFields
    if (search && search.trim() && reg.searchFields.length > 0) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = reg.searchFields.map((field) => ({ [field]: regex }));
    }

    // 2. Structured filter clauses
    if (Array.isArray(filters)) {
      for (const f of filters) {
        if (!f.field) continue;
        const field = f.field;
        const val = f.value;

        switch (f.op) {
          case 'eq':
            query[field] = val;
            break;
          case 'ne':
            query[field] = { $ne: val };
            break;
          case 'in':
            query[field] = { $in: Array.isArray(val) ? val : [val] };
            break;
          case 'nin':
            query[field] = { $nin: Array.isArray(val) ? val : [val] };
            break;
          case 'contains':
          case 'regex':
            query[field] = { $regex: new RegExp(String(val), 'i') };
            break;
          case 'gt':
            query[field] = { $gt: val };
            break;
          case 'lt':
            query[field] = { $lt: val };
            break;
          case 'gte':
            query[field] = { $gte: val };
            break;
          case 'lte':
            query[field] = { $lte: val };
            break;
          case 'exists':
            query[field] = { $exists: Boolean(val) };
            break;
          case 'isTrue':
            query[field] = true;
            break;
          case 'isFalse':
            query[field] = false;
            break;
        }
      }
    }

    return query;
  }

  /**
   * Redact sensitive fields from document object
   */
  redactDoc(doc: any, redactFields: string[]): any {
    if (!doc || typeof doc !== 'object') return doc;
    const clean = { ...doc };
    for (const f of redactFields) {
      if (f.includes('.')) {
        const parts = f.split('.');
        let curr = clean;
        for (let i = 0; i < parts.length - 1; i++) {
          if (curr[parts[i]]) curr = curr[parts[i]];
        }
        delete curr[parts[parts.length - 1]];
      } else {
        delete clean[f];
      }
    }
    return clean;
  }

  /**
   * Browse collection documents with pagination, sorting, search, filtering
   */
  async browse(collectionKey: CollectionKey, params: BrowseQueryParams, userRole: UserRole) {
    const reg = getRegistryItem(collectionKey);
    if (!reg) throw new AppError(`Collection not found: ${collectionKey}`, 404, 'NOT_FOUND');

    if (!reg.readRoles.includes(userRole)) {
      throw new AppError(`Role ${userRole} is not permitted to view ${collectionKey}`, 403, 'FORBIDDEN');
    }

    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const query = this.buildFilterQuery(collectionKey, params.filters, params.search);

    const sortField = params.sortField || 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [total, docs] = await Promise.all([
      reg.model.countDocuments(query),
      reg.model.find(query).sort(sort).skip(skip).limit(limit).lean(),
    ]);

    const sanitizedDocs = docs.map((d: any) => this.redactDoc(d, reg.redactFields));

    return {
      docs: sanitizedDocs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single document by ID or unique slug
   */
  async getByIdOrSlug(collectionKey: CollectionKey, idOrSlug: string, userRole: UserRole) {
    const reg = getRegistryItem(collectionKey);
    if (!reg) throw new AppError(`Collection not found: ${collectionKey}`, 404, 'NOT_FOUND');

    if (!reg.readRoles.includes(userRole)) {
      throw new AppError(`Access forbidden to ${collectionKey}`, 403, 'FORBIDDEN');
    }

    const query = Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { [reg.uniqueKey]: idOrSlug }] }
      : { [reg.uniqueKey]: idOrSlug };

    const doc = await reg.model.findOne(query).lean();
    if (!doc) throw new AppError(`Document not found in ${collectionKey}`, 404, 'NOT_FOUND');

    return this.redactDoc(doc, reg.redactFields);
  }

  /**
   * Find backlinks (other documents referencing this document)
   */
  async getBacklinks(collectionKey: CollectionKey, docId: string) {
    const backlinks: Array<{
      collection: CollectionKey;
      field: string;
      id: string;
      title: string;
    }> = [];

    const oid = new Types.ObjectId(docId);

    if (collectionKey === 'plants') {
      const RemedyModel = getRegistryItem('remedies')!.model;
      const TourModel = getRegistryItem('tours')!.model;

      const [remedies, tours] = await Promise.all([
        RemedyModel.find({ plants: oid }, '_id title slug').lean(),
        TourModel.find({ 'stops.plant': oid }, '_id title slug').lean(),
      ]);

      for (const r of remedies) {
        backlinks.push({
          collection: 'remedies',
          field: 'plants',
          id: (r._id as Types.ObjectId).toString(),
          title: (r as any).title || (r as any).slug,
        });
      }

      for (const t of tours) {
        backlinks.push({
          collection: 'tours',
          field: 'stops.plant',
          id: (t._id as Types.ObjectId).toString(),
          title: (t as any).title || (t as any).slug,
        });
      }
    }

    return backlinks;
  }

  /**
   * Update document with optimistic concurrency check (__v or updatedAt)
   */
  async updateWithConcurrency(
    collectionKey: CollectionKey,
    idOrSlug: string,
    updateData: any,
    expectedVersion: { __v?: number; updatedAt?: string },
    ctx: DbWriteContext
  ) {
    const reg = getRegistryItem(collectionKey);
    if (!reg) throw new AppError(`Collection not found: ${collectionKey}`, 404, 'NOT_FOUND');

    const query = Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { [reg.uniqueKey]: idOrSlug }] }
      : { [reg.uniqueKey]: idOrSlug };

    const currentDoc = await reg.model.findOne(query).lean();
    if (!currentDoc) throw new AppError(`Document not found`, 404, 'NOT_FOUND');

    // Concurrency check
    const currentTimestamp = (currentDoc as any).updatedAt || (currentDoc as any).createdAt;
    if (expectedVersion.__v !== undefined && (currentDoc as any).__v !== undefined) {
      if ((currentDoc as any).__v !== expectedVersion.__v) {
        throw new AppError(
          'Someone else has modified this document since you opened it. Please refresh and review differences.',
          409,
          'CONCURRENCY_CONFLICT'
        );
      }
    } else if (expectedVersion.updatedAt && currentTimestamp) {
      const docTime = new Date(currentTimestamp).getTime();
      const expectedTime = new Date(expectedVersion.updatedAt).getTime();
      if (Math.abs(docTime - expectedTime) > 1000) {
        throw new AppError(
          'Document was updated concurrently. Please refresh before saving.',
          409,
          'CONCURRENCY_CONFLICT'
        );
      }
    }

    return dbWriteService.updateOne(collectionKey, idOrSlug, updateData, ctx);
  }

  /**
   * Bulk actions (change status, publish/unpublish, set category/tags, delete)
   */
  async bulkAction(
    collectionKey: CollectionKey,
    docIds: string[],
    action: 'publish' | 'unpublish' | 'set_status' | 'delete' | 'add_tag' | 'remove_tag',
    payload: any,
    ctx: DbWriteContext
  ) {
    const reg = getRegistryItem(collectionKey);
    if (!reg) throw new AppError(`Collection not found: ${collectionKey}`, 404, 'NOT_FOUND');

    dbWriteService.assertPermission(collectionKey, action === 'delete' ? 'bulk_delete' : 'update', ctx, docIds.length);

    const oids = docIds.map((id) => new Types.ObjectId(id));
    const filter = { _id: { $in: oids } };

    let updateRes: any;
    if (action === 'publish') {
      updateRes = await reg.model.updateMany(filter, { $set: { isPublished: true } });
    } else if (action === 'unpublish') {
      updateRes = await reg.model.updateMany(filter, { $set: { isPublished: false } });
    } else if (action === 'add_tag' && payload?.tag) {
      updateRes = await reg.model.updateMany(filter, { $addToSet: { tags: payload.tag } });
    } else if (action === 'remove_tag' && payload?.tag) {
      updateRes = await reg.model.updateMany(filter, { $pull: { tags: payload.tag } });
    } else if (action === 'delete') {
      if (reg.softDelete && 'isDeleted' in (reg.model.schema.paths || {})) {
        updateRes = await reg.model.updateMany(filter, { $set: { isDeleted: true } });
      } else {
        updateRes = await reg.model.deleteMany(filter);
      }
    }

    await dbWriteService.logAudit(
      collectionKey,
      `BULK_${action.toUpperCase()}`,
      null,
      { count: docIds.length, ids: docIds },
      { action, payload, modifiedCount: updateRes?.modifiedCount || updateRes?.deletedCount },
      ctx
    );

    return {
      success: true,
      affectedCount: updateRes?.modifiedCount ?? updateRes?.deletedCount ?? 0,
    };
  }
}

export const browserService = new BrowserService();
