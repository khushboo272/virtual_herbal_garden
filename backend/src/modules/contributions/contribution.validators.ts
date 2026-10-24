import { z } from 'zod';
import { ContentStatus } from '../../types';

export const contributionQuerySchema = z.object({
  type: z.enum(['plant', 'remedy']).optional(),
  status: z.nativeEnum(ContentStatus).optional(),
  q: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'title', 'status']).optional().default('newest'),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const correctionRequestSchema = z.object({
  note: z.string().min(10, 'Correction note must be at least 10 characters long').max(2000),
});

export type ContributionQuery = z.infer<typeof contributionQuerySchema>;
export type CorrectionRequestInput = z.infer<typeof correctionRequestSchema>;
