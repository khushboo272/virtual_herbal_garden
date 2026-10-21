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
  aliases: z.array(z.string()).optional(),
  plantType: z.string().optional(),
  regionNative: z.array(z.string()).min(1),
  growingConditions: growingConditionsSchema.optional(),
  images: z.array(imageSchema).optional(),
  model3dUrl: z.string().url().optional(),
  categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.unknown()).optional(),
});

export const updatePlantSchema = createPlantSchema.partial();

// Query params for GET /plants
// q              — full-text search string (safe, escaped on service layer)
// medicinalUse   — one or more comma-separated use strings
// region         — filter by regionNative value
// type           — filter by plantType value
// category       — Mongo ObjectId of a Category
// sort           — relevance | name | newest | rating
// page / limit
export const plantQuerySchema = z.object({
  q: z.string().max(200).optional(),
  // Keep legacy "search" param as alias so existing consumers don't break
  search: z.string().max(200).optional(),
  medicinalUse: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(',')))
    .optional(),
  region: z.string().max(100).optional(),
  type: z.string().max(100).optional(),
  category: z.string().optional(),
  family: z.string().optional(),
  tags: z.string().optional(),
  sort: z.enum(['relevance', 'name', 'newest', 'rating', 'views']).default('newest'),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(48).default(12),
});

export const plantReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  body: z.string().max(2000).optional(),
});
