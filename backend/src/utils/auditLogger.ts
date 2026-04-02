import { Request } from 'express';
import AuditLog from '../models/AuditLog';
import { AuditAction } from '../types';

interface AuditLogParams {
  req: Request;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const { req, action, entityType, entityId, oldValue, newValue } = params;
  const userId = req.user?.sub;

  if (!userId) return;

  await AuditLog.create({
    user: userId,
    action,
    entityType,
    entityId: entityId || null,
    oldValue: oldValue || null,
    newValue: newValue || null,
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  });
}
