import { z } from 'zod';

const vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const addGardenPlantSchema = z.object({
  plant: z.string().min(1), // ObjectId
  position: vector3Schema,
  rotation: vector3Schema.optional().default({ x: 0, y: 0, z: 0 }),
  scale: z.number().positive().default(1),
  growthStage: z.enum(['SEED', 'SPROUT', 'YOUNG', 'MATURE', 'FLOWERING']).default('SEED'),
  notes: z.string().optional(),
});

export const updateGardenPlantSchema = z.object({
  position: vector3Schema.optional(),
  rotation: vector3Schema.optional(),
  scale: z.number().positive().optional(),
  growthStage: z.enum(['SEED', 'SPROUT', 'YOUNG', 'MATURE', 'FLOWERING']).optional(),
  notes: z.string().optional(),
});

export const updateGardenSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});
