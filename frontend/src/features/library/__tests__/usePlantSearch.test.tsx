/**
 * Frontend tests for usePlantSearch hook.
 * Tests URL-driven state, filter setters, and exactMatch navigation.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePlantSearch } from '../hooks/usePlantSearch';
import * as libraryApi from '../api/libraryApi';

// Mock the libraryApi
vi.mock('../api/libraryApi');

const mockSearchPlants = vi.mocked(libraryApi.searchPlants);

const defaultMeta = {
  total: 1,
  page: 1,
  limit: 12,
  totalPages: 1,
  exactMatch: null,
  facets: { medicinalUse: [], region: [], type: [] },
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter>;
}

describe('usePlantSearch', () => {
  beforeEach(() => {
    mockSearchPlants.mockResolvedValue({
      plants: [
        {
          _id: '1',
          commonName: 'Tulsi',
          scientificName: 'Ocimum tenuiflorum',
          slug: 'tulsi',
          family: 'Lamiaceae',
          description: 'Test',
          shortDescription: null,
          medicinalUses: ['Immunity'],
          partsUsed: [],
          toxicityLevel: 'NONE',
          ayurvedicNames: [],
          aliases: [],
          plantType: null,
          regionNative: ['India'],
          growingConditions: {},
          images: [],
          model3dUrl: null,
          modelUrl: null,
          placement3d: null,
          categories: [],
          tags: [],
          isPublished: true,
          isFeatured: true,
          avgRating: 0,
          reviewCount: 0,
          viewCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: defaultMeta,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns plants from the API', async () => {
    const { result } = renderHook(() => usePlantSearch(), { wrapper });

    await waitFor(() => {
      expect(result.current.plants.length).toBe(1);
    });

    expect(result.current.plants[0].commonName).toBe('Tulsi');
  });

  it('sets loading state during fetch', async () => {
    const { result } = renderHook(() => usePlantSearch(), { wrapper });
    // isLoading starts true
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('handles API errors gracefully', async () => {
    mockSearchPlants.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePlantSearch(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.plants).toEqual([]);
    });
  });

  it('clearFilters resets filter state', async () => {
    const { result } = renderHook(() => usePlantSearch(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setMedicinalUse('Immunity');
    });

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.params.medicinalUse).toBeUndefined();
  });

  it('meta returned from API is exposed via hook', async () => {
    mockSearchPlants.mockResolvedValueOnce({
      plants: [],
      meta: {
        ...defaultMeta,
        total: 42,
        totalPages: 4,
        facets: {
          medicinalUse: [{ name: 'Immunity', count: 5 }],
          region: [],
          type: [],
        },
      },
    });

    const { result } = renderHook(() => usePlantSearch(), { wrapper });

    await waitFor(() => {
      expect(result.current.meta?.total).toBe(42);
    });

    expect(result.current.meta?.facets.medicinalUse[0].name).toBe('Immunity');
  });
});
