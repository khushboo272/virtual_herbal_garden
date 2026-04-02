import { z } from 'zod';

const ingredientSchema = z.object({
  plantId: z.string().min(1),
  partUsed: z.enum(['leaves', 'roots', 'bark', 'seeds', 'flowers', 'resin']),
  quantity: z.string().min(1),
  unit: z.string().min(1),
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
  plants: z.array(z.string()).min(1), // ObjectId strings
  ingredients: z.array(ingredientSchema).min(1),
  preparationSteps: z.array(stepSchema).min(1),
  dosage: z.string().min(1),
  contraindications: z.array(z.string()).optional(),
  difficultyLevel: z.enum(['EASY', 'MEDIUM', 'ADVANCED']).default('EASY'),
  preparationTime: z.number().positive(),
  tags: z.array(z.string()).optional(),
});

export const updateRemedySchema = createRemedySchema.partial();

export const remedyQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  plant: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'ADVANCED']).optional(),
  tags: z.string().optional(),
  search: z.string().optional(),
});
