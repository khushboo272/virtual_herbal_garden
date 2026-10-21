import { api } from '../../../lib/api';
import type { DetectionResult } from '../types/detection.types';

const HISTORY_LIMIT = 20;

export async function detectPlant(file: File): Promise<DetectionResult> {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api.upload<DetectionResult>('/ai/detect', formData);
  return res.data;
}

export async function getHistory(page = 1): Promise<DetectionResult[]> {
  const res = await api.get<DetectionResult[]>('/ai/history', { page, limit: HISTORY_LIMIT });
  return res.data;
}

export async function getDetection(id: string): Promise<DetectionResult> {
  const res = await api.get<DetectionResult>(`/ai/detect/${id}`);
  return res.data;
}
