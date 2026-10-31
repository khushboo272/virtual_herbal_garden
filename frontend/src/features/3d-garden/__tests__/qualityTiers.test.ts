import { describe, it, expect, beforeEach } from 'vitest';
import { GARDEN_QUALITY_TIERS, type QualityTierName } from '../gardenConfig';
import { renderHook, act } from '@testing-library/react';
import { useGardenQuality } from '../hooks/useGardenQuality';

describe('GARDEN_QUALITY_TIERS Configuration', () => {
  const tiers: QualityTierName[] = ['ULTRA', 'HIGH', 'MEDIUM', 'LOW'];

  it('enforces monotonic decrease or equality of graphics fidelity from ULTRA to LOW', () => {
    for (let i = 0; i < tiers.length - 1; i++) {
      const current = GARDEN_QUALITY_TIERS[tiers[i]];
      const next = GARDEN_QUALITY_TIERS[tiers[i + 1]];

      // DPR decreases or stays equal
      expect(current.dpr).toBeGreaterThanOrEqual(next.dpr);

      // Grass density decreases
      expect(current.grassDensity).toBeGreaterThanOrEqual(next.grassDensity);

      // Decorative trees count decreases
      expect(current.treeCount).toBeGreaterThanOrEqual(next.treeCount);

      // Decorative shrubs count decreases
      expect(current.fillerCount).toBeGreaterThanOrEqual(next.fillerCount);

      // Shadow map resolution decreases
      expect(current.shadowMapSize).toBeGreaterThanOrEqual(next.shadowMapSize);
    }
  });

  it('strictly caps maximum DPR at 1.75 to honor the performance budget', () => {
    tiers.forEach((tier) => {
      expect(GARDEN_QUALITY_TIERS[tier].dpr).toBeLessThanOrEqual(1.75);
    });
  });

  it('disables expensive SSAO / N8AO on LOW and MEDIUM tiers', () => {
    expect(GARDEN_QUALITY_TIERS['LOW'].n8ao).toBe(false);
    expect(GARDEN_QUALITY_TIERS['MEDIUM'].n8ao).toBe(false);
    expect(GARDEN_QUALITY_TIERS['HIGH'].n8ao).toBe(true);
    expect(GARDEN_QUALITY_TIERS['ULTRA'].n8ao).toBe(true);
  });

  it('disables post-processing bloom on LOW tier', () => {
    expect(GARDEN_QUALITY_TIERS['LOW'].bloom).toBe(false);
    expect(GARDEN_QUALITY_TIERS['MEDIUM'].bloom).toBe(true);
    expect(GARDEN_QUALITY_TIERS['HIGH'].bloom).toBe(true);
    expect(GARDEN_QUALITY_TIERS['ULTRA'].bloom).toBe(true);
  });
});

describe('useGardenQuality Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to desktop tier when no preference is saved', () => {
    const { result } = renderHook(() => useGardenQuality());
    expect(['HIGH', 'MEDIUM']).toContain(result.current.tier);
    expect(result.current.config).toBeDefined();
    expect(result.current.config.name).toBe(result.current.tier);
  });

  it('persists manual tier selection to localStorage', () => {
    const { result } = renderHook(() => useGardenQuality());

    act(() => {
      result.current.setTier('LOW');
    });

    expect(result.current.tier).toBe('LOW');
    expect(result.current.config.name).toBe('LOW');
    expect(localStorage.getItem('vhg_garden_quality')).toBe('LOW');
  });

  it('recovers saved tier from localStorage on mount', () => {
    localStorage.setItem('vhg_garden_quality', 'ULTRA');
    const { result } = renderHook(() => useGardenQuality());

    expect(result.current.tier).toBe('ULTRA');
    expect(result.current.config.name).toBe('ULTRA');
  });
});
