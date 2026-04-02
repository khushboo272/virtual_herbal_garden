import { z } from 'zod';

export const detectionFeedbackSchema = z.object({
  isCorrect: z.boolean(),
  correctPlant: z.string().optional(), // ObjectId if incorrect
  notes: z.string().max(1000).optional(),
});
