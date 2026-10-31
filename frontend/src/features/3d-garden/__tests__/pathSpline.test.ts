import { describe, it, expect } from 'vitest';
import { samplePathCorridor, getTerrainSurfaceType } from '../utils/terrainGenerator';
import { GARDEN_CONFIG } from '../gardenConfig';

describe('Path Splines & Corridor Sampling', () => {
  it('correctly calculates distance to radiating path segments towards zone beds', () => {
    // Check points directly on the radial path towards zone 0 (Immunity at x=0, z=-13)
    const distOnCenterline = samplePathCorridor(0, -10);
    expect(distOnCenterline).toBeCloseTo(0, 2);

    // Points 0.8m perpendicular to centerline (x=0.8, z=-10)
    const distOffset = samplePathCorridor(0.8, -10);
    expect(distOffset).toBeCloseTo(0.8, 1);
  });

  it('detects the concentric perimeter promenade ring around the central plaza', () => {
    // Ring is at radius r ~ 11.2m
    const distOnPromenadeX = samplePathCorridor(11.2, 0);
    expect(distOnPromenadeX).toBeLessThan(0.1);

    const distOnPromenadeZ = samplePathCorridor(0, 11.2);
    expect(distOnPromenadeZ).toBeLessThan(0.1);
  });

  it('classifies points on paths as PATH surface type for texturing and grass masking', () => {
    // Point on promenade ring at (11.2, 0), outside plaza (r=10.5)
    const surface = getTerrainSurfaceType(11.2, 0);
    expect(surface).toBe('PATH');
  });

  it('classifies points far off paths as GRASS or other non-path surfaces', () => {
    // Far out in the perimeter grass (x=30, z=30)
    const distFar = samplePathCorridor(30, 30);
    expect(distFar).toBeGreaterThan(GARDEN_CONFIG.structures.pathWidth);

    const surface = getTerrainSurfaceType(30, 30);
    expect(surface).toBe('GRASS');
  });
});
