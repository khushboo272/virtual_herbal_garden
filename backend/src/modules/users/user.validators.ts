import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
});

export const createBookmarkSchema = z.object({
  entityType: z.enum(['PLANT', 'REMEDY', 'ARTICLE', 'TOUR']),
  entityId: z.string().min(1), // ObjectId
  collectionName: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const updatePreferencesSchema = z.object({
  newSubmission: z.boolean().optional(),
  roleApplication: z.boolean().optional(),
  support: z.boolean().optional(),
  flaggedReview: z.boolean().optional(),
  security: z.boolean().optional(),
  system: z.boolean().optional(),
  notifications: z
    .object({
      newSubmission: z.boolean().optional(),
      roleApplication: z.boolean().optional(),
      support: z.boolean().optional(),
      flaggedReview: z.boolean().optional(),
      security: z.boolean().optional(),
      system: z.boolean().optional(),
    })
    .optional(),
});

