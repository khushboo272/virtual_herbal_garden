import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../../core/config/env';
import { AppError } from '../../core/utils/apiResponse';
import { logger } from '../../core/utils/logger';
import { PLANT_IDENTIFICATION_PROMPT } from './prompts';
import { PlantIdentificationSchema } from './types';
import type { PlantIdentification } from './types';
import { systemService } from '../system/system.service';

const MODEL_TIMEOUT_MS = 25_000;

function buildClient(): GoogleGenAI {
  const key = env.GEMINI_API_KEY;
  if (!key) {
    throw new AppError('AI service is not configured', 503, 'AI_NOT_CONFIGURED');
  }
  return new GoogleGenAI({ apiKey: key });
}

async function callGenerateContentWithTimeout(
  client: GoogleGenAI,
  modelName: string,
  base64Image: string,
  mimeType: string,
  timeoutMs: number,
  temperature = 0.3,
  maxOutputTokens = 2048,
): Promise<string> {
  let timer: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`AI model ${modelName} timed out after ${timeoutMs}ms`);
      err.name = 'TimeoutError';
      reject(err);
    }, timeoutMs);
  });

  const apiPromise = client.models.generateContent({
    model: modelName,
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
      temperature,
      maxOutputTokens,
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

  try {
    const response = await Promise.race([apiPromise, timeoutPromise]);
    return response.text || '';
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function handleGeminiError(err: unknown, modelName: string): never {
  if (err instanceof AppError) {
    throw err;
  }

  const error = err as { name?: string; status?: number; message?: string };
  const message = error.message || '';

  // Timeout
  if (error.name === 'TimeoutError' || message.includes('timed out')) {
    throw new AppError(
      `AI identification timed out on model ${modelName}. The service is under heavy load, please try again.`,
      504,
      'AI_TIMEOUT',
    );
  }

  // High demand / service unavailable (503)
  if (error.status === 503 || message.includes('high demand') || message.includes('UNAVAILABLE')) {
    throw new AppError(
      `Gemini AI model ${modelName} is currently experiencing high demand. Please try again shortly.`,
      503,
      'AI_BUSY',
    );
  }

  // Safety block
  if (message.includes('SAFETY') || message.includes('blocked')) {
    throw new AppError('Could not analyze this image due to safety filters', 422, 'SAFETY_BLOCK');
  }

  // Quota exceeded (429)
  if (error.status === 429 || message.includes('429') || message.includes('quota')) {
    throw new AppError('AI service is busy or rate limit reached, try again in a minute', 429, 'AI_QUOTA');
  }

  // Not found (404)
  if (error.status === 404 || message.includes('NOT_FOUND') || message.includes('no longer available')) {
    throw new AppError(
      `AI model ${modelName} is not available on this API endpoint. Please switch model in Dashboard System Config.`,
      502,
      'MODEL_NOT_FOUND',
    );
  }

  logger.error(`[GeminiClient] Unexpected error on model ${modelName}:`, err);
  throw new AppError('AI service request failed: ' + (message || 'Unknown network error'), 502, 'AI_NETWORK_ERROR');
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

  const aiSettings = await systemService.getAIModelSettings();
  const primaryModel = aiSettings.activeModel;
  const fallbackModel = aiSettings.fallbackModel || 'gemini-1.5-flash';

  let rawText = '';

  try {
    rawText = await callGenerateContentWithTimeout(
      client,
      primaryModel,
      base64Image,
      mimeType,
      MODEL_TIMEOUT_MS,
      aiSettings.temperature,
      aiSettings.maxTokens,
    );
  } catch (primaryErr: any) {
    const errMsg = primaryErr?.message || '';
    const errStatus = primaryErr?.status;
    const isRecoverable =
      primaryErr?.name === 'TimeoutError' ||
      errStatus === 503 ||
      errStatus === 429 ||
      errStatus === 404 ||
      errMsg.includes('high demand') ||
      errMsg.includes('UNAVAILABLE') ||
      errMsg.includes('timed out') ||
      errMsg.includes('quota') ||
      errMsg.includes('not available');

    if (isRecoverable && fallbackModel && fallbackModel !== primaryModel) {
      logger.warn(
        `[GeminiClient] Primary model "${primaryModel}" encountered high load/error (${errMsg}). Automatically retrying with fallback model "${fallbackModel}"...`,
      );
      try {
        rawText = await callGenerateContentWithTimeout(
          client,
          fallbackModel,
          base64Image,
          mimeType,
          MODEL_TIMEOUT_MS,
          aiSettings.temperature,
          aiSettings.maxTokens,
        );
      } catch (fallbackErr: any) {
        logger.error(`[GeminiClient] Fallback model "${fallbackModel}" also failed:`, fallbackErr);
        handleGeminiError(fallbackErr, fallbackModel);
      }
    } else {
      handleGeminiError(primaryErr, primaryModel);
    }
  }

  if (!rawText) {
    throw new AppError('Could not analyze this image', 422, 'EMPTY_RESPONSE');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    logger.error('[GeminiClient] Failed to parse JSON response:', rawText.slice(0, 200));
    throw new AppError('Invalid response from AI service', 502, 'INVALID_JSON');
  }

  const validated = PlantIdentificationSchema.safeParse(parsed);
  if (!validated.success) {
    logger.error('[GeminiClient] Schema validation failed:', validated.error.flatten());
    throw new AppError('Invalid response from AI service', 502, 'INVALID_JSON');
  }

  return validated.data;
}
