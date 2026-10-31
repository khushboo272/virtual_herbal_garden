import { PlantIdentificationSchema } from '../src/modules/ai-scanner/types';

describe('PlantIdentificationSchema Non-Plant & Resiliency Tests', () => {
  it('validates a complete plant identification response', () => {
    const validData = {
      isPlant: true,
      commonName: 'Japanese Maple',
      scientificName: 'Acer palmatum',
      family: 'Sapindaceae',
      confidence: 0.95,
      description: 'Ornamental deciduous tree with lace-like leaves.',
      medicinalUses: ['Traditional decoctions for heat-clearing'],
      keyBenefits: ['Ornamental', 'Astringent bark'],
      partsUsed: ['Bark', 'Leaves'],
      precautions: ['Mainly ornamental'],
      alternatives: [
        {
          commonName: 'Sugar Maple',
          scientificName: 'Acer saccharum',
          confidence: 0.15,
        },
      ],
      imageQualityNote: 'Clear photo',
    };

    const result = PlantIdentificationSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commonName).toBe('Japanese Maple');
      expect(result.data.isPlant).toBe(true);
      expect(result.data.confidence).toBe(0.95);
    }
  });

  it('validates a non-plant response where optional fields are omitted by Gemini', () => {
    const nonPlantData = {
      isPlant: false,
    };

    const result = PlantIdentificationSchema.safeParse(nonPlantData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPlant).toBe(false);
      expect(result.data.commonName).toBe('');
      expect(result.data.confidence).toBe(0);
      expect(result.data.medicinalUses).toEqual([]);
      expect(result.data.alternatives).toEqual([]);
    }
  });

  it('validates a response with partial fields without throwing schema validation errors', () => {
    const partialData = {
      isPlant: true,
      commonName: 'Mystery Herb',
      confidence: 0.6,
    };

    const result = PlantIdentificationSchema.safeParse(partialData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.commonName).toBe('Mystery Herb');
      expect(result.data.scientificName).toBe('');
      expect(result.data.family).toBe('');
    }
  });
});

