// ──────────────────────────────────────────────────────────
// __tests__/terrainGenerator.test.ts — Unit tests for Terrain Elevation & Classification
// ──────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { getGroundY, getTerrainSurfaceType, perlin2d } from '../utils/terrainGenerator';
import { GARDEN_CONFIG } from '../gardenConfig';

describe('terrainGenerator', () => {
  it('generates continuous Perlin noise values in [-1, 1]', () => {
    for (let x = -20; x <= 20; x += 5) {
      for (let y = -20; y <= 20; y += 5) {
        const val = perlin2d(x * 0.1, y * 0.1);
        expect(val).toBeGreaterThanOrEqual(-1.0);
        expect(val).toBeLessThanOrEqual(1.0);
        expect(Number.isNaN(val)).toBe(false);
      }
    }
  });

  it('keeps the central plaza flat at Y = 0.0', () => {
    expect(getGroundY(0, 0)).toBeCloseTo(0.0, 2);
    expect(getGroundY(3, 3)).toBeCloseTo(0.0, 1);
    expect(getGroundY(-4, 2)).toBeCloseTo(0.0, 1);
    expect(getTerrainSurfaceType(0, 0)).toBe('PLAZA');
  });

  it('flattens terrain under botanical zones to their designated terrace elevation', () => {
    for (const zone of GARDEN_CONFIG.zones) {
      const [zx, expectedY, zz] = zone.center;
      const actualY = getGroundY(zx, zz);
      expect(actualY).toBeCloseTo(expectedY, 1);
      expect(getTerrainSurfaceType(zx, zz)).toBe('BED');
    }
  });

  it('carves a smooth basin depression under the pond', () => {
    const [px, , pz] = GARDEN_CONFIG.terrain.pondCenter;
    const pondCenterY = getGroundY(px, pz);
    expect(pondCenterY).toBeLessThan(-0.5); // Deep water depression
    expect(getTerrainSurfaceType(px, pz)).toBe('POND');
  });

  it('guarantees numerical continuity without jumps or NaN values', () => {
    let prevY = getGroundY(-40, 0);
    for (let x = -40; x <= 40; x += 0.5) {
      const y = getGroundY(x, 0);
      expect(Number.isNaN(y)).toBe(false);
      expect(Math.abs(y - prevY)).toBeLessThan(1.5); // Smooth elevation step
      prevY = y;
    }
  });
});

