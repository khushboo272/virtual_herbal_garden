import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock the scannerApi module ──
vi.mock('../api/scannerApi', () => ({
  detectPlant: vi.fn(),
  getHistory: vi.fn().mockResolvedValue([]),
  getDetection: vi.fn(),
}));

import { useDetection } from './useDetection';
import { detectPlant, getHistory } from '../api/scannerApi';
import { ApiError } from '../../../lib/api';
import type { DetectionResult } from '../types/detection.types';

const mockDetectPlant = detectPlant as ReturnType<typeof vi.fn>;
const mockGetHistory = getHistory as ReturnType<typeof vi.fn>;

function makeFakeResult(overrides: Partial<DetectionResult> = {}): DetectionResult {
  return {
    id: 'det-123',
    status: 'COMPLETE',
    isPlant: true,
    topMatch: {
      commonName: 'Tulsi',
      scientificName: 'Ocimum tenuiflorum',
      family: 'Lamiaceae',
      confidence: 0.92,
    },
    description: 'A sacred herb.',
    medicinalUses: ['Stress relief'],
    keyBenefits: ['Adaptogen'],
    partsUsed: ['Leaves'],
    precautions: [],
    alternatives: [],
    imageQualityNote: '',
    plantSlug: 'tulsi',
    plantId: 'plant-abc',
    imageUrl: 'https://cdn.example.com/img.jpg',
    processingTimeMs: 1200,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeFakeFile(type = 'image/jpeg', size = 100): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  return new File([blob], 'plant.jpg', { type });
}

describe('useDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetHistory.mockResolvedValue([]);
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useDetection());
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('success — analyze(file) sets status=success and result', async () => {
    const fakeResult = makeFakeResult();
    mockDetectPlant.mockResolvedValueOnce(fakeResult);

    const { result } = renderHook(() => useDetection());
    const file = makeFakeFile();

    await act(async () => {
      await result.current.analyze(file);
    });

    expect(result.current.status).toBe('success');
    expect(result.current.result?.id).toBe('det-123');
    expect(result.current.result?.topMatch?.commonName).toBe('Tulsi');
    expect(result.current.error).toBeNull();
  });

  it('error — 429 maps to busy message', async () => {
    mockDetectPlant.mockRejectedValueOnce(
      new ApiError('AI service is busy, try again in a minute', 429, 'AI_QUOTA'),
    );

    const { result } = renderHook(() => useDetection());
    const file = makeFakeFile();

    await act(async () => {
      await result.current.analyze(file);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('busy');
    expect(result.current.errorCode).toBe('AI_QUOTA');
  });

  it('invalid file type — sets validation error without calling API', async () => {
    const { result } = renderHook(() => useDetection());
    const badFile = makeFakeFile('image/gif');

    await act(async () => {
      await result.current.analyze(badFile);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('JPEG, PNG, or WebP');
    expect(mockDetectPlant).not.toHaveBeenCalled();
  });

  it('file too large — sets validation error without calling API', async () => {
    const { result } = renderHook(() => useDetection());
    // 6 MB — over the 5 MB limit
    const bigFile = makeFakeFile('image/jpeg', 6 * 1024 * 1024);

    await act(async () => {
      await result.current.analyze(bigFile);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toContain('5 MB');
    expect(mockDetectPlant).not.toHaveBeenCalled();
  });

  it('reset() returns to idle state', async () => {
    const fakeResult = makeFakeResult();
    mockDetectPlant.mockResolvedValueOnce(fakeResult);

    const { result } = renderHook(() => useDetection());
    const file = makeFakeFile();

    await act(async () => {
      await result.current.analyze(file);
    });

    expect(result.current.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
  });

  it('loadHistory() populates history', async () => {
    const historyItems = [makeFakeResult({ id: 'h1' }), makeFakeResult({ id: 'h2' })];
    mockGetHistory.mockResolvedValueOnce(historyItems);

    const { result } = renderHook(() => useDetection());

    await act(async () => {
      await result.current.loadHistory();
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].id).toBe('h1');
  });
});
