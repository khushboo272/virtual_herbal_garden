import { z } from 'zod';

const quizQuestionSchema = z
  .object({
    prompt: z.string().min(1, 'Question prompt is required'),
    options: z.array(z.string().min(1)).min(2, 'At least 2 options required').max(5, 'At most 5 options allowed'),
    correctIndex: z.number().int().min(0),
    explanation: z.string().optional().default(''),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: 'correctIndex must be within options range',
    path: ['correctIndex'],
  });

export const checkpointInputSchema = z.object({
  key: z.string().min(1, 'Checkpoint key is required'),
  order: z.number().int().positive(),
  title: z.string().min(1, 'Checkpoint title is required').max(200),
  summary: z.string().optional().default(''),
  body: z.string().optional().default(''),
  durationMinutes: z.number().positive().optional().default(3),
  plantSlugs: z.array(z.string()).optional().default([]),
  remedySlugs: z.array(z.string()).optional().default([]),
  keyTakeaways: z.array(z.string()).optional().default([]),
  audioUrl: z.string().optional(),
  quiz: z
    .object({
      passScore: z.number().min(0).max(1).optional().default(0.6),
      questions: z.array(quizQuestionSchema).optional().default([]),
    })
    .optional(),
});

export const createTourSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(300),
    slug: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    coverImageUrl: z.string().optional(),
    healthCategory: z.string().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional().default('BEGINNER'),
    difficulty: z.string().optional().default('EASY'),
    tags: z.array(z.string()).optional().default([]),
    estimatedMinutes: z.number().positive().optional(),
    estimatedDuration: z.number().positive().optional(),
    sequential: z.boolean().optional().default(true),
    isPublished: z.boolean().optional().default(false),
    isFeatured: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
    checkpoints: z.array(checkpointInputSchema).optional().default([]),
    stops: z.array(z.any()).optional().default([]),
  })
  .refine(
    (data) => {
      if (!data.checkpoints || data.checkpoints.length === 0) return true;
      const keys = data.checkpoints.map((c) => c.key);
      return new Set(keys).size === keys.length;
    },
    { message: 'Checkpoint keys must be unique within a tour', path: ['checkpoints'] },
  );

export const updateTourSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    slug: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    coverImage: z.string().optional(),
    coverImageUrl: z.string().optional(),
    healthCategory: z.string().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    difficulty: z.string().optional(),
    tags: z.array(z.string()).optional(),
    estimatedMinutes: z.number().positive().optional(),
    estimatedDuration: z.number().positive().optional(),
    sequential: z.boolean().optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    checkpoints: z.array(checkpointInputSchema).optional(),
    stops: z.array(z.any()).optional(),
  })
  .refine(
    (data) => {
      if (!data.checkpoints || data.checkpoints.length === 0) return true;
      const keys = data.checkpoints.map((c) => c.key);
      return new Set(keys).size === keys.length;
    },
    { message: 'Checkpoint keys must be unique within a tour', path: ['checkpoints'] },
  );

export const tourQuerySchema = z.object({
  q: z.string().optional(),
  health: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  plant: z.string().optional(),
  sort: z.enum(['featured', 'newest', 'shortest']).optional().default('featured'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(48).default(12),
  preview: z.coerce.string().optional(),
});

export const quizAnswerSchema = z.object({
  answers: z.array(z.number().int().min(0)),
});

export const progressSyncSchema = z.object({
  completedKeys: z.array(z.string().min(1)),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});
