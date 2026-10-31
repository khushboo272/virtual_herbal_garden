// ──────────────────────────────────────────────────────────
// __tests__/layoutShowcase.test.ts — Unit tests for layoutShowcase
// ──────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { layoutShowcase, determineZoneSlug } from '../utils/layoutShowcase';
import { GARDEN_CONFIG } from '../gardenConfig';
import type { IShowcasePlant } from '../types';

function createMockPlant(overrides: Partial<IShowcasePlant> = {}): IShowcasePlant {
  return {
    id: `plant-${Math.random().toString(36).substring(2, 9)}`,
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
    modelTransform: {
      scale: 1,
      rotationY: 0,
      offsetY: 0,
      targetHeightM: 0.6,
    },
    ...overrides,
  };
}

describe('layoutShowcase', () => {
  it('returns empty array when input is empty', () => {
    expect(layoutShowcase([])).toEqual([]);
  });

  it('produces stable, identical placement for same input', () => {
    const plants = [
      createMockPlant({ id: 'p1', healthCategories: ['immunity'], createdAt: '2026-01-01' }),
      createMockPlant({ id: 'p2', healthCategories: ['digestion'], createdAt: '2026-01-02' }),
      createMockPlant({ id: 'p3', healthCategories: ['immunity'], createdAt: '2026-01-03' }),
    ];

    const run1 = layoutShowcase(plants);
    const run2 = layoutShowcase(plants);

    expect(run1.length).toBe(3);
    expect(run1).toEqual(run2);
  });

  it('matches zone assignment to healthCategory priority', () => {
    const pImmunity = createMockPlant({ id: 'p-imm', healthCategories: ['immunity'] });
    const pDigestion = createMockPlant({ id: 'p-dig', healthCategories: ['digestion'] });
    const pBoth = createMockPlant({
      id: 'p-both',
      healthCategories: ['skin-care', 'immunity'], // immunity has higher priority than skin-care
    });

    const placed = layoutShowcase([pImmunity, pDigestion, pBoth]);

    const immPlaced = placed.find((p) => p.id === 'p-imm')!;
    const digPlaced = placed.find((p) => p.id === 'p-dig')!;
    const bothPlaced = placed.find((p) => p.id === 'p-both')!;

    expect(immPlaced.placement.zoneSlug).toBe('immunity');
    expect(digPlaced.placement.zoneSlug).toBe('digestion');
    expect(bothPlaced.placement.zoneSlug).toBe('immunity');
  });

  it('honors globalPosition3D override', () => {
    const overridePos: [number, number, number] = [15.5, 0.2, -7.8];
    const pOverride = createMockPlant({
      id: 'p-override',
      globalPosition3D: overridePos,
      healthCategories: ['immunity'],
    });

    const placed = layoutShowcase([pOverride]);
    expect(placed[0].placement.isOverride).toBe(true);
    expect(placed[0].placement.position).toEqual(overridePos);
  });

  it('falls back to meadow zone when category is missing or unknown', () => {
    const pUnknown = createMockPlant({ id: 'p-unk', healthCategories: ['unknown-category'] });
    const pEmpty = createMockPlant({ id: 'p-emp', healthCategories: [] });

    const placed = layoutShowcase([pUnknown, pEmpty]);
    expect(placed[0].placement.zoneSlug).toBe('meadow');
    expect(placed[1].placement.zoneSlug).toBe('meadow');
  });

  it('ensures no overlapping plants (distance >= sum of spreads / 2)', () => {
    // Generate 12 plants in the same zone
    const plants: IShowcasePlant[] = [];
    for (let i = 0; i < 12; i++) {
      plants.push(
        createMockPlant({
          id: `p-overlap-${i}`,
          healthCategories: ['immunity'],
          visual: {
            habit: 'HERB',
            heightM: 0.4 + (i % 3) * 0.2,
            spreadM: 0.6 + (i % 2) * 0.2, // spreads 0.6 to 0.8
            foliageColor: '#2d7a3a',
            flowerColor: '#ffffff',
            leafShape: 'OVATE',
          },
        })
      );
    }

    const placed = layoutShowcase(plants);
    expect(placed.length).toBe(12);

    // Pairwise distance check between plants in the same zone
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        if (a.placement.zoneSlug === b.placement.zoneSlug) {
          const dist = Math.hypot(
            a.placement.position[0] - b.placement.position[0],
            a.placement.position[2] - b.placement.position[2]
          );
          const minSpreadDist = (a.visual.spreadM + b.visual.spreadM) / 2;
          expect(dist).toBeGreaterThanOrEqual(minSpreadDist);
        }
      }
    }
  });
});

