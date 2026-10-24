import { Request } from 'express';
import AuditLog from '../../modules/admin/AuditLog.model';
import { AuditAction } from '../../types';

export interface AuditLogParams {
  req?: Request | any;
  userId?: string;
  actor?: string | any;
  action: AuditAction | string;
  entityType?: string;
  targetModel?: string;
  entityId?: string | any;
  targetId?: string | any;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  details?: Record<string, unknown> | null;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const { req, action, entityType, targetModel, entityId, targetId, oldValue, newValue, details, userId, actor } = params;
  const effectiveUserId = userId || actor || req?.user?.sub || req?.user?._id;

  if (!effectiveUserId) return;

  const effectiveEntityType = entityType || targetModel || 'System';
  const effectiveEntityId = entityId || targetId || null;
  const effectiveNewValue = newValue || details || null;

  await AuditLog.create({
    user: effectiveUserId,
    action: action as AuditAction,
    entityType: effectiveEntityType,
    entityId: effectiveEntityId,
    oldValue: oldValue || null,
    newValue: effectiveNewValue,
    ipAddress: req?.ip || req?.socket?.remoteAddress || 'unknown',
    userAgent: req?.headers?.['user-agent'] || 'unknown',
  });
}

export const writeAuditLog = createAuditLog;
