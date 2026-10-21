import { z } from 'zod';

// ── Zod schema that validates Gemini's structured JSON output ──

const AlternativeSchema = z.object({
  commonName: z.string(),
  scientificName: z.string(),
  confidence: z.number().min(0).max(1),
});

export const PlantIdentificationSchema = z.object({
  isPlant: z.boolean(),
  commonName: z.string(),
  scientificName: z.string(),
  family: z.string(),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  medicinalUses: z.array(z.string()).max(6),
  keyBenefits: z.array(z.string()).max(6),
  partsUsed: z.array(z.string()),
  precautions: z.array(z.string()),
  alternatives: z.array(AlternativeSchema),
  imageQualityNote: z.string(),
});

export type PlantIdentification = z.infer<typeof PlantIdentificationSchema>;

// ── Response schema object for Gemini's responseMimeType "application/json" ──
// This is the schema structure expected by the @google/genai SDK's responseSchema field.
export const GEMINI_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    isPlant: { type: 'boolean' },
    commonName: { type: 'string' },
    scientificName: { type: 'string' },
    family: { type: 'string' },
    confidence: { type: 'number' },
    description: { type: 'string' },
    medicinalUses: { type: 'array', items: { type: 'string' } },
    keyBenefits: { type: 'array', items: { type: 'string' } },
    partsUsed: { type: 'array', items: { type: 'string' } },
    precautions: { type: 'array', items: { type: 'string' } },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          commonName: { type: 'string' },
          scientificName: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['commonName', 'scientificName', 'confidence'],
      },
    },
    imageQualityNote: { type: 'string' },
  },
  required: [
    'isPlant',
    'commonName',
    'scientificName',
    'family',
    'confidence',
    'description',
    'medicinalUses',
    'keyBenefits',
    'partsUsed',
    'precautions',
    'alternatives',
    'imageQualityNote',
  ],
};
