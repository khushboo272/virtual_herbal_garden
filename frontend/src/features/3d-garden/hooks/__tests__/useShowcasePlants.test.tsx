// ──────────────────────────────────────────────────────────
// hooks/__tests__/useShowcasePlants.test.tsx — Unit tests for useShowcasePlants
// ──────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useShowcasePlants } from '../useShowcasePlants';
import * as apiModule from '../../api/gardenShowcaseApi';
import * as socketModule from '../../../../lib/socket';
import type { IShowcasePlant } from '../../types';

vi.mock('../../api/gardenShowcaseApi');
vi.mock('../../../../lib/socket');

const mockPlant: IShowcasePlant = {
  id: 'p-1',
  slug: 'tulsi',
  commonName: 'Holy Basil',
  scientificName: 'Ocimum tenuiflorum',
  plantType: 'Herb',
  healthCategories: ['immunity'],
  visual: {
    habit: 'HERB',
    heightM: 0.6,
    spreadM: 0.5,
    foliageColor: '#2d7a3a',
    flowerColor: '#ffffff',
    leafShape: 'OVATE',
  },
  modelUrl: null,
  lodUrl: null,
  modelVersion: 1,
  modelStatus: 'NONE',
  modelTransform: { scale: 1, rotationY: 0, offsetY: 0, targetHeightM: 0.6 },
};

describe('useShowcasePlants', () => {
  let socketCallbacks: Record<string, Function> = {};
  const mockSocket = {
    connected: true,
    connect: vi.fn(),
    on: vi.fn((event: string, cb: Function) => {
      socketCallbacks[event] = cb;
    }),
    off: vi.fn((event: string) => {
      delete socketCallbacks[event];
    }),
  };

  beforeEach(() => {
    socketCallbacks = {};
    vi.mocked(socketModule.getSocket).mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches plants on mount and sets loading state', async () => {
    vi.mocked(apiModule.getShowcasePlants).mockResolvedValue([mockPlant]);

    const { result } = renderHook(() => useShowcasePlants());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plants).toEqual([mockPlant]);
    expect(result.current.error).toBeNull();
  });

  it('handles empty state when backend returns 0 plants', async () => {
    vi.mocked(apiModule.getShowcasePlants).mockResolvedValue([]);

    const { result } = renderHook(() => useShowcasePlants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plants).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('updates state dynamically when garden:plantsChanged socket event arrives', async () => {
    vi.mocked(apiModule.getShowcasePlants).mockResolvedValue([mockPlant]);

    const { result } = renderHook(() => useShowcasePlants());

    await waitFor(() => {
      expect(result.current.plants.length).toBe(1);
    });

    // Simulate ADDED event
    const newPlant: IShowcasePlant = {
      ...mockPlant,
      id: 'p-2',
      commonName: 'Ashwagandha',
      slug: 'ashwagandha',
    };

    act(() => {
      socketCallbacks['garden:plantsChanged']({
        type: 'ADDED',
        plant: newPlant,
      });
    });

    await waitFor(() => {
      expect(result.current.plants.length).toBe(2);
    });

    // Simulate REMOVED event
    act(() => {
      socketCallbacks['garden:plantsChanged']({
        type: 'REMOVED',
        plant: { id: 'p-1' } as any,
      });
    });

    await waitFor(() => {
      expect(result.current.plants.length).toBe(1);
      expect(result.current.plants[0].id).toBe('p-2');
    });
  });
});

