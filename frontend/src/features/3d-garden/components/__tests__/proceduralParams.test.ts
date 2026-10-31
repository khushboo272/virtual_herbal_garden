// ──────────────────────────────────────────────────────────
// components/__tests__/proceduralParams.test.ts — Unit tests for Procedural Generation
// ──────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { GARDEN_CONFIG } from '../../gardenConfig';
import { createSeededRandom } from '../../utils/leafCardGenerator';
import type { PlantHabit } from '../../types';

describe('procedural plant generation parameters', () => {
  const habits: PlantHabit[] = ['HERB', 'SHRUB', 'TREE', 'GRASS', 'CLIMBER', 'SUCCULENT', 'ROOT'];

  it('guarantees triangle budgets for all 7 habits (herb < 2k, tree < 8k)', () => {
    for (const habit of habits) {
      const instances = GARDEN_CONFIG.procedural.instancesPerHabit[habit];
      expect(instances).toBeGreaterThan(0);

      // Leaf quad = 2 triangles
      const leafTriangles = instances * 2;
      // Procedural props (trunk, trellis) have at most 100 triangles
      const totalEstimatedTriangles = leafTriangles + 120;

      if (habit === 'TREE') {
        expect(totalEstimatedTriangles).toBeLessThan(GARDEN_CONFIG.procedural.triangleBudget.tree);
      } else {
        expect(totalEstimatedTriangles).toBeLessThan(GARDEN_CONFIG.procedural.triangleBudget.herb);
      }
    }
  });

  it('generates deterministic seed sequences for identical plant IDs', () => {
    const rng1 = createSeededRandom('plant-tulsi-12345');
    const rng2 = createSeededRandom('plant-tulsi-12345');

    const seq1 = [rng1(), rng1(), rng1(), rng1()];
    const seq2 = [rng2(), rng2(), rng2(), rng2()];

    expect(seq1).toEqual(seq2);
  });

  it('generates distinct seed sequences for different plant IDs', () => {
    const rngA = createSeededRandom('plant-tulsi');
    const rngB = createSeededRandom('plant-neem');

    expect(rngA()).not.toEqual(rngB());
  });

  it('provides valid fallback colors for botanical rendering', () => {
    const { foliage, flower, trunk, trellis } = GARDEN_CONFIG.procedural.defaultColors;
    expect(foliage).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(flower).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(trunk).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(trellis).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

