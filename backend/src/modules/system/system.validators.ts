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

export const emailOrMailboxSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val || val === '') return true;
      const match = val.match(/<([^>]+)>$/);
      const emailToTest = match ? match[1].trim() : val.trim();
      return z.string().email().safeParse(emailToTest).success;
    },
    { message: 'Invalid email address or mailbox format' }
  )
  .optional();

export const updateSystemConfigurationSchema = z.object({
  ai: z
    .object({
      model: z.string().optional(),
      endpoint: z.string().optional(),
      temperature: z.number().min(0).max(1).optional(),
      maxTokens: z.number().min(256).max(8192).optional(),
      confidenceThreshold: z.number().min(1).max(100).optional(),
      fallbackModel: z.string().optional(),
    })
    .optional(),
  storage: z
    .object({
      provider: z.enum(['S3', 'R2', 'LOCAL']).optional(),
      bucket: z.string().optional(),
      region: z.string().optional(),
      cdnBaseUrl: z.string().optional(),
      maxUploadSizeMb: z.number().min(1).max(100).optional(),
      allowedMimeTypes: z.array(z.string()).optional(),
    })
    .optional(),
  email: z
    .object({
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpUser: z.string().optional(),
      senderName: z.string().optional(),
      senderEmail: emailOrMailboxSchema,
      isSecure: z.boolean().optional(),
      digestFrequency: z.enum(['DAILY', 'WEEKLY', 'NEVER']).optional(),
    })
    .optional(),
  security: z
    .object({
      allowedDetectionsPerHour: z.number().min(1).max(500).optional(),
      apiRateLimitPerMin: z.number().min(10).max(2000).optional(),
      authRateLimitPer15Min: z.number().min(1).max(50).optional(),
      jwtAccessExpiry: z.string().optional(),
      jwtRefreshExpiry: z.string().optional(),
      require2faForAdmins: z.boolean().optional(),
      maxConcurrentSessions: z.number().min(1).max(20).optional(),
    })
    .optional(),
  general: z
    .object({
      platformName: z.string().min(1).optional(),
      supportEmail: emailOrMailboxSchema,
      defaultTaxonomy: z.string().optional(),
      autoPublishConfidence: z.number().min(50).max(100).optional(),
    })
    .optional(),
});

