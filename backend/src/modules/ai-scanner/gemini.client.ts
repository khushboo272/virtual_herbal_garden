import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../core/config/env';
import { AppError } from '../../core/utils/apiResponse';
import { logger } from '../../core/utils/logger';
import { PLANT_IDENTIFICATION_PROMPT } from './prompts';
import { PlantIdentificationSchema } from './types';
import type { PlantIdentification } from './types';
import { systemService } from '../system/system.service';

const REQUEST_TIMEOUT_MS = 30_000;

function buildClient(): GoogleGenAI {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    throw new AppError('AI service is not configured', 503, 'AI_NOT_CONFIGURED');
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function identifyPlant(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<PlantIdentification> {
  if (!env.GEMINI_API_KEY) {
    throw new AppError('AI service is not configured', 503, 'AI_NOT_CONFIGURED');
  }

  const client = buildClient();
  const base64Image = imageBuffer.toString('base64');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const activeModel = await systemService.getActiveAIModel();
    const response = await client.models.generateContent({
      model: activeModel,
      contents: [
        {
          role: 'user',
          parts: [
            { text: PLANT_IDENTIFICATION_PROMPT },
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isPlant: { type: Type.BOOLEAN },
            commonName: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            family: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            description: { type: Type.STRING },
            medicinalUses: { type: Type.ARRAY, items: { type: Type.STRING } },
            keyBenefits: { type: Type.ARRAY, items: { type: Type.STRING } },
            partsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            precautions: { type: Type.ARRAY, items: { type: Type.STRING } },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  commonName: { type: Type.STRING },
                  scientificName: { type: Type.STRING },
                  confidence: { type: Type.NUMBER },
                },
              },
            },
            imageQualityNote: { type: Type.STRING },
          },
        },
      },
    });

    clearTimeout(timeoutId);

    const text = response.text;
    if (!text) {
      throw new AppError('Could not analyze this image', 422, 'EMPTY_RESPONSE');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error('[GeminiClient] Failed to parse JSON response:', text.slice(0, 200));
      throw new AppError('Invalid response from AI service', 502, 'INVALID_JSON');
    }

    const validated = PlantIdentificationSchema.safeParse(parsed);
    if (!validated.success) {
      logger.error('[GeminiClient] Schema validation failed:', validated.error.flatten());
      throw new AppError('Invalid response from AI service', 502, 'INVALID_JSON');
    }

    return validated.data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    // Re-throw our own AppErrors directly
    if (err instanceof AppError) {
      throw err;
    }

    const error = err as { name?: string; status?: number; message?: string };

    // Aborted (timeout)
    if (error.name === 'AbortError' || controller.signal.aborted) {
      throw new AppError('AI service timed out', 504, 'AI_TIMEOUT');
    }

    const message = error.message || '';

    // Safety block
    if (message.includes('SAFETY') || message.includes('blocked')) {
      throw new AppError('Could not analyze this image', 422, 'SAFETY_BLOCK');
    }

    // Quota exceeded
    if (error.status === 429 || message.includes('429') || message.includes('quota')) {
      throw new AppError('AI service is busy, try again in a minute', 429, 'AI_QUOTA');
    }

    // Network / unknown
    logger.error('[GeminiClient] Unexpected error:', err);
    throw new AppError('AI service request failed', 504, 'AI_NETWORK_ERROR');
  }
}
