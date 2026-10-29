import { Request } from 'express';
import AuditLog from '../../modules/admin/AuditLog.model';
import { AuditAction } from '../../types';

export interface AuditLogParams {
  req?: Request | any;
  userId?: string | any;
  actor?: string | any;
  action: AuditAction | string;
  entityType?: string;
  targetModel?: string;
  entityId?: string | any;
  targetId?: string | any;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  details?: Record<string, unknown> | null;
  severity?: 'INFO' | 'WARN' | 'CRITICAL';
  requestId?: string | null;
  ipAddress?: string;
  userAgent?: string;
}

const SENSITIVE_KEY_REGEX = /(password|passwordhash|token|refreshtoken|accesstoken|reauthtoken|totpsecret|secret|backupcode|backupcodes|codehash)/i;

export function sanitizeAuditData(obj: unknown): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeAuditData);

  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'object' && val !== null) {
      clean[key] = sanitizeAuditData(val);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const {
      req,
      action,
      entityType,
      targetModel,
      entityId,
      targetId,
      oldValue,
      newValue,
      details,
      userId,
      actor,
      severity = 'INFO',
      requestId,
      ipAddress,
      userAgent,
    } = params;

    const effectiveUserId = userId || actor || req?.user?.sub || req?.user?._id || null;
    const effectiveEntityType = entityType || targetModel || 'System';
    const effectiveEntityId = entityId || targetId || null;
    const rawNewValue = newValue || details || null;

    const sanitizedOldValue = oldValue ? sanitizeAuditData(oldValue) : null;
    const sanitizedNewValue = rawNewValue ? sanitizeAuditData(rawNewValue) : null;

    await AuditLog.create({
      user: effectiveUserId,
      action: action as AuditAction,
      entityType: effectiveEntityType,
      entityId: effectiveEntityId,
      oldValue: sanitizedOldValue,
      newValue: sanitizedNewValue,
      severity,
      requestId: requestId || req?.headers?.['x-request-id'] || null,
      ipAddress: ipAddress || req?.ip || req?.socket?.remoteAddress || 'unknown',
      userAgent: userAgent || req?.headers?.['user-agent'] || 'unknown',
    });
  } catch (err) {
    // Safety rule: Audit writes must NEVER break the action being audited
    console.error('Audit log write error (swallowed):', err);
  }
}

export const writeAuditLog = createAuditLog;
