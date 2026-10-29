import { z } from 'zod';
import { UserRole } from '../../types';

export const updateSystemUserRoleSchema = z.object({
  role: z.enum([UserRole.USER, UserRole.BOTANIST, UserRole.ADMIN]),
});

export const systemAuditLogsQuerySchema = z.object({
  actor: z.string().optional(),
  action: z.union([z.string(), z.array(z.string())]).optional(),
  targetType: z.string().optional(),
  severity: z.enum(['INFO', 'WARN', 'CRITICAL']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
