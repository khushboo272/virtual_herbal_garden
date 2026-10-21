import { useState, useCallback, useEffect, useRef } from 'react';
import { ApiError } from '../../../lib/api';
import { detectPlant, getHistory, getDetection } from '../api/scannerApi';
import type { DetectionResult } from '../types/detection.types';

// ── Client-side validation constants ──
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export type ScanStatus = 'idle' | 'uploading' | 'success' | 'error';

interface ScanState {
  status: ScanStatus;
  result: DetectionResult | null;
  error: string | null;
  errorCode: string | null;
  history: DetectionResult[];
}

export function useDetection() {
  const [state, setState] = useState<ScanState>({
    status: 'idle',
    result: null,
    error: null,
    errorCode: null,
    history: [],
  });

  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, or WebP image.';
    }
    if (file.size > MAX_BYTES) {
      return 'Image must be 5 MB or smaller.';
    }
    return null;
  }, []);

  const analyze = useCallback(async (file: File) => {
    const validationError = validate(file);
    if (validationError) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: validationError,
        errorCode: 'VALIDATION',
      }));
      return;
    }

    // Cancel any previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      status: 'uploading',
      result: null,
      error: null,
      errorCode: null,
    }));

    try {
      const result = await detectPlant(file);
      setState((prev) => ({
        ...prev,
        status: 'success',
        result,
        // Prepend to history
        history: [result, ...prev.history].slice(0, 20),
      }));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Unmounted — silently discard
      }

      let message = 'Something went wrong. Please try again.';
      let code = 'UNKNOWN';

      if (err instanceof ApiError) {
        code = err.code;
        if (err.status === 429) {
          message = 'The AI scanner is busy. Please wait a minute and try again.';
        } else if (err.status === 503) {
          message = 'AI scanner is not configured. Please contact support.';
        } else if (err.status === 422) {
          message = 'Could not analyze this image. Try a clearer photo of a plant.';
        } else {
          message = err.message || message;
        }
      }

      setState((prev) => ({
        ...prev,
        status: 'error',
        error: message,
        errorCode: code,
      }));
    }
  }, [validate]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({
      ...prev,
      status: 'idle',
      result: null,
      error: null,
      errorCode: null,
    }));
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const history = await getHistory();
      setState((prev) => ({ ...prev, history }));
    } catch {
      // Silent fail — history is non-critical
    }
  }, []);

  const loadScan = useCallback(async (id: string) => {
    try {
      const result = await getDetection(id);
      setState((prev) => ({ ...prev, status: 'success', result }));
    } catch {
      // Silent fail
    }
  }, []);

  return {
    status: state.status,
    result: state.result,
    error: state.error,
    errorCode: state.errorCode,
    history: state.history,
    analyze,
    reset,
    loadHistory,
    loadScan,
  };
}
