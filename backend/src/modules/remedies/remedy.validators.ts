import { z } from 'zod';

const ingredientSchema = z.object({
  plantId: z.string().optional(),
  name: z.string().min(1).optional(),
  partUsed: z.enum(['leaves', 'roots', 'bark', 'seeds', 'flowers', 'resin', 'whole']).optional(),
  quantity: z.string().min(1),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

const stepSchema = z.object({
  step: z.number().int().positive(),
  instruction: z.string().min(1),
  durationMinutes: z.number().positive().optional(),
  imageUrl: z.string().url().optional(),
});

export const createRemedySchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(10),
  plants: z.array(z.string()).optional().default([]), // ObjectId strings
  ingredients: z.array(ingredientSchema).min(1),
  preparationSteps: z.array(stepSchema).min(1),
  dosage: z.string().min(1),
  contraindications: z.array(z.string()).optional(),
  precautions: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['EASY', 'MEDIUM', 'HARD', 'ADVANCED']).optional().default('EASY'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'ADVANCED']).optional().default('EASY'),
  preparationTime: z.number().positive().optional().default(15),
  prepTimeMinutes: z.number().positive().optional(),
  usage: z.enum(['INTERNAL', 'TOPICAL', 'INHALATION']).optional().default('INTERNAL'),
  traditionalSource: z.string().optional(),
  image: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateRemedySchema = createRemedySchema.partial();

export const remedyQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(48).default(12),
  q: z.string().trim().optional(),
  search: z.string().trim().optional(), // backward compat with older caller
  health: z.string().trim().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'ADVANCED']).optional(),
  usage: z.enum(['INTERNAL', 'TOPICAL', 'INHALATION']).optional(),
  plant: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  sort: z.enum(['newest', 'name', 'quickest']).default('newest'),
});

export type RemedyQueryParams = z.infer<typeof remedyQuerySchema>;
