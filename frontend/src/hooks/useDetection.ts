import { useState, useCallback } from 'react';
import { api, ApiError } from '../lib/api';
import type { Detection } from '../lib/types';

export function useDetection() {
  const [detection, setDetection] = useState<Detection | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectPlant = useCallback(async (imageFile: File) => {
    setIsAnalyzing(true);
    setError(null);
    setDetection(null);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const res = await api.upload<Detection>('/ai/detect', formData);
      setDetection(res.data);
      return res.data;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Detection failed';
      setError(msg);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDetection(null);
    setError(null);
    setIsAnalyzing(false);
  }, []);

  return { detection, isAnalyzing, error, detectPlant, reset };
}

export function useDetectionHistory() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ detections: Detection[] }>('/ai/detections');
      setDetections(res.data.detections || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load detection history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { detections, isLoading, error, fetchHistory };
}
