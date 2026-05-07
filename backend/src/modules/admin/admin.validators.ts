import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['GUEST', 'USER', 'BOTANIST', 'ADMIN', 'SUPER_ADMIN']),
});

export const banUserSchema = z.object({
  isActive: z.boolean(),
  banReason: z.string().max(500).optional(),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  type: z.enum(['REVIEW', 'REPLY', 'ADMIN', 'SYSTEM']).default('SYSTEM'),
  actionUrl: z.string().url().optional(),
  targetRoles: z.array(z.enum(['GUEST', 'USER', 'BOTANIST', 'ADMIN', 'SUPER_ADMIN'])).optional(),
});

export const rejectPlantSchema = z.object({
  feedback: z.string().min(1).max(2000),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  role: z.enum(['GUEST', 'USER', 'BOTANIST', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const auditLogQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(50),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ROLE_CHANGE']).optional(),
  user: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const updateSystemConfigSchema = z.object({
  aiModelVersion: z.string().optional(),
  featuredPlantIds: z.array(z.string()).optional(),
  maintenanceMode: z.boolean().optional(),
  allowedDetectionsPerHour: z.number().positive().optional(),
  featureFlags: z.record(z.boolean()).optional(),
});
