import { Types } from 'mongoose';
import AuditLog from '../../admin/AuditLog.model';
import { UserRole } from '../../../types';
import { AppError } from '../../../core/utils/apiResponse';
import { getRegistryItem, isContentCollection } from '../registry';
import { CollectionKey } from '../types';

export interface DbWriteContext {
  actorId: string;
  actorRole: UserRole;
  ipAddress: string;
  userAgent: string;
  reauthToken?: string;
}

export interface DbWriteOptions {
  batchId?: string;
  skipAudit?: boolean;
}

export class DbWriteService {
  /**
   * Verify server-side permissions before performing any DB mutation
   */
  assertPermission(
    collectionKey: CollectionKey,
    op: 'insert' | 'update' | 'delete' | 'bulk_delete' | 'restore' | 'replace' | 'drop',
    ctx: DbWriteContext,
    affectedCount = 1
  ): void {
    const reg = getRegistryItem(collectionKey);
    if (!reg) {
      throw new AppError(`Unknown collection: ${collectionKey}`, 400, 'INVALID_COLLECTION');
    }

    // 1. SUPER_ADMIN has access to all actions
    if (ctx.actorRole === UserRole.SUPER_ADMIN) {
      return;
    }

    // 2. ADMIN restrictions
    if (ctx.actorRole === UserRole.ADMIN) {
      // Must be a content collection
      if (!isContentCollection(collectionKey)) {
        throw new AppError(
          `Admins are only permitted to manage content collections (${collectionKey} is restricted)`,
          403,
          'FORBIDDEN_COLLECTION'
        );
      }

      // Prohibited ops for ADMIN
      if (op === 'restore' || op === 'drop' || op === 'replace') {
        throw new AppError(`Admins cannot perform ${op} operations`, 403, 'FORBIDDEN_OPERATION');
      }

      // No delete-many over 50 docs
      if (op === 'bulk_delete' && affectedCount > 50) {
        throw new AppError(
          `Admins cannot bulk delete more than 50 documents at once (requested: ${affectedCount})`,
          403,
          'DELETE_LIMIT_EXCEEDED'
        );
      }

      return;
    }

    // All other roles are strictly denied
    throw new AppError('Insufficient permissions for database write operations', 403, 'FORBIDDEN');
  }

  /**
   * Log write operation into AuditLog. If audit fails, throw error to BLOCK the write.
   */
  async logAudit(
    collectionKey: CollectionKey,
    action: string,
    entityId: Types.ObjectId | null,
    oldValue: any,
    newValue: any,
    ctx: DbWriteContext,
    options?: DbWriteOptions
  ): Promise<void> {
    if (options?.skipAudit) return;

    try {
      await AuditLog.create({
        user: new Types.ObjectId(ctx.actorId),
        action: `DB_${action.toUpperCase()}`,
        entityType: collectionKey,
        entityId: entityId || null,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        severity: action.includes('DELETE') || action.includes('DROP') || action.includes('RESTORE') ? 'CRITICAL' : 'INFO',
        requestId: options?.batchId || null,
        ipAddress: ctx.ipAddress || 'unknown',
        userAgent: ctx.userAgent || 'unknown',
      });
    } catch (auditErr: any) {
      // Audit failure blocks the write per prompt specifications!
      throw new AppError(
        `Database write aborted: Audit logging failure (${auditErr?.message || 'unknown'})`,
        500,
        'AUDIT_FAILURE'
      );
    }
  }

  /**
   * Safe document insert
   */
  async insertOne(
    collectionKey: CollectionKey,
    data: any,
    ctx: DbWriteContext,
    options?: DbWriteOptions
  ): Promise<any> {
    this.assertPermission(collectionKey, 'insert', ctx, 1);
    const reg = getRegistryItem(collectionKey)!;

    const doc = new reg.model(data);
    await doc.save();

    await this.logAudit(
      collectionKey,
      'INSERT',
      doc._id as Types.ObjectId,
      null,
      doc.toObject(),
      ctx,
      options
    );

    return doc;
  }

  /**
   * Safe document update with diff
   */
  async updateOne(
    collectionKey: CollectionKey,
    idOrSlug: string,
    updateData: any,
    ctx: DbWriteContext,
    options?: DbWriteOptions
  ): Promise<any> {
    this.assertPermission(collectionKey, 'update', ctx, 1);
    const reg = getRegistryItem(collectionKey)!;

    const query = Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { [reg.uniqueKey]: idOrSlug }] }
      : { [reg.uniqueKey]: idOrSlug };

    const oldDoc = await reg.model.findOne(query).lean();
    if (!oldDoc) {
      throw new AppError(`Document not found in ${collectionKey}`, 404, 'NOT_FOUND');
    }

    const updatedDoc = await reg.model.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    await this.logAudit(
      collectionKey,
      'UPDATE',
      (oldDoc as any)._id as Types.ObjectId,
      oldDoc,
      updatedDoc?.toObject(),
      ctx,
      options
    );

    return updatedDoc;
  }

  /**
   * Safe document delete (soft delete if supported, else hard delete)
   */
  async deleteOne(
    collectionKey: CollectionKey,
    idOrSlug: string,
    ctx: DbWriteContext,
    options?: DbWriteOptions
  ): Promise<any> {
    this.assertPermission(collectionKey, 'delete', ctx, 1);
    const reg = getRegistryItem(collectionKey)!;

    const query = Types.ObjectId.isValid(idOrSlug)
      ? { $or: [{ _id: idOrSlug }, { [reg.uniqueKey]: idOrSlug }] }
      : { [reg.uniqueKey]: idOrSlug };

    const oldDoc = await reg.model.findOne(query).lean();
    if (!oldDoc) {
      throw new AppError(`Document not found in ${collectionKey}`, 404, 'NOT_FOUND');
    }

    if (reg.softDelete && 'isDeleted' in (reg.model.schema.paths || {})) {
      await reg.model.updateOne(query, { $set: { isDeleted: true } });
    } else {
      await reg.model.deleteOne(query);
    }

    await this.logAudit(
      collectionKey,
      'DELETE',
      (oldDoc as any)._id as Types.ObjectId,
      oldDoc,
      null,
      ctx,
      options
    );

    return oldDoc;
  }
}

export const dbWriteService = new DbWriteService();
