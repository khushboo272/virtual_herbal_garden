import { z } from 'zod';

const tourStopSchema = z.object({
  order: z.number().int().positive(),
  plant: z.string().min(1), // ObjectId
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'PANORAMA']).optional(),
  coordinates3d: z
    .object({ x: z.number(), y: z.number(), z: z.number() })
    .optional(),
});

export const createTourSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(10),
  difficulty: z.string().default('EASY'),
  estimatedDuration: z.number().positive(),
  coverImageUrl: z.string().url().optional(),
  stops: z.array(tourStopSchema).min(1),
});

export const updateTourSchema = createTourSchema.partial();

export const tourQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(50).default(10),
});
