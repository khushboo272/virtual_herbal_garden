import { z } from 'zod';

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional(),
  type: z.enum(['main', 'detail', 'infographic']).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
});

const growingConditionsSchema = z.object({
  soil: z.string().optional(),
  water: z.string().optional(),
  sunlight: z.string().optional(),
  climate: z.string().optional(),
  hardinessZone: z.string().optional(),
});

export const createPlantSchema = z.object({
  commonName: z.string().min(1).max(200),
  scientificName: z.string().min(1).max(300),
  family: z.string().min(1).max(200),
  description: z.string().min(10),
  shortDescription: z.string().max(500).optional(),
  medicinalUses: z.array(z.string()).min(1),
  partsUsed: z.array(z.enum(['leaves', 'roots', 'bark', 'seeds', 'flowers', 'resin'])).optional(),
  toxicityLevel: z.enum(['NONE', 'LOW', 'MODERATE', 'HIGH']).default('NONE'),
  ayurvedicNames: z.array(z.string()).optional(),
  regionNative: z.array(z.string()).min(1),
  growingConditions: growingConditionsSchema.optional(),
  images: z.array(imageSchema).optional(),
  model3dUrl: z.string().url().optional(),
  categories: z.array(z.string()).optional(), // ObjectId strings
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const updatePlantSchema = createPlantSchema.partial();

export const plantQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  family: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  sort: z.enum(['name', 'rating', 'newest', 'views']).default('newest'),
  toxicity: z.enum(['NONE', 'LOW', 'MODERATE', 'HIGH']).optional(),
  region: z.string().optional(),
});

export const plantReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
});
