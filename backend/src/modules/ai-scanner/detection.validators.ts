import { z } from 'zod';

export const detectionFeedbackSchema = z
  .object({
    verdict: z.enum(['CORRECT', 'INCORRECT', 'NOT_A_PLANT', 'UNSURE']).optional(),
    correctPlantId: z.string().optional(),
    comment: z.string().max(1000).optional(),
    isCorrect: z.boolean().optional(),
    correctPlant: z.string().optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => data.verdict !== undefined || data.isCorrect !== undefined, {
    message: 'Either verdict or isCorrect must be provided',
  });

export const feedbackQueueQuerySchema = z.object({
  state: z.enum(['pending', 'reviewed', 'all']).default('pending'),
  confidence: z.enum(['low', 'all']).default('all'),
  isPlant: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});
