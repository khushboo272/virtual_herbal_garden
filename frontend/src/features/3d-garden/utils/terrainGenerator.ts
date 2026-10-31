// ──────────────────────────────────────────────────────────
// utils/terrainGenerator.ts — Procedural Topography & Elevation Engine
// Pure mathematical elevation function getGroundY(x, z)
// Terracing, plaza leveling, pond depression, and surface type classification.
// ──────────────────────────────────────────────────────────
import { GARDEN_CONFIG, type GardenZoneConfig } from '../gardenConfig';

// Deterministic permutation table for 2D Simplex/Perlin noise
const P = new Uint8Array(512);
const PERM_BASE = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
];
for (let i = 0; i < 256; i++) {
  P[i] = PERM_BASE[i];
  P[256 + i] = PERM_BASE[i];
}

function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

function grad2d(hash: number, x: number, y: number): number {
  const h = hash & 7;
  const u = h < 4 ? x : y;
  const v = h < 4 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

export function perlin2d(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  const u = fade(xf);
  const v = fade(yf);

  const aa = P[P[X] + Y];
  const ab = P[P[X] + Y + 1];
  const ba = P[P[X + 1] + Y];
  const bb = P[P[X + 1] + Y + 1];

  const x1 = lerp(grad2d(aa, xf, yf), grad2d(ba, xf - 1, yf), u);
  const x2 = lerp(grad2d(ab, xf, yf - 1), grad2d(bb, xf - 1, yf - 1), u);

  return lerp(x1, x2, v);
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export type SurfaceType = 'PLAZA' | 'PATH' | 'BED' | 'POND' | 'GRASS';

/**
 * Calculates smooth distance to path corridors radiating from plaza to each zone
 */
export function getDistanceToNearestPath(x: number, z: number): number {
  let minD = 999;
  const pathHalfW = GARDEN_CONFIG.structures.pathWidth / 2;

  // Radiating paths from plaza edge (r=9) to each zone center
  for (const zone of GARDEN_CONFIG.zones) {
    const [zx, , zz] = zone.center;
    // Segment from origin to zone center
    const len = Math.hypot(zx, zz);
    if (len < 0.1) continue;

    const dx = zx / len;
    const dz = zz / len;

    // Project point (x, z) onto ray (0,0) -> (zx, zz)
    const t = Math.max(0, Math.min(len, x * dx + z * dz));
    const px = dx * t;
    const pz = dz * t;
    const dist = Math.hypot(x - px, z - pz);
    minD = Math.min(minD, dist);
  }

  // Also perimeter promenade circle around plaza at r = 11.5
  const rad = Math.hypot(x, z);
  const ringDist = Math.abs(rad - 11.2);
  minD = Math.min(minD, ringDist);

  return minD;
}

export const samplePathCorridor = getDistanceToNearestPath;

/**
 * Classifies ground point into surface type for texturing and grass masking
 */
export function getTerrainSurfaceType(x: number, z: number): SurfaceType {
  const distOrigin = Math.hypot(x, z);
  if (distOrigin <= GARDEN_CONFIG.terrain.plazaRadius) {
    return 'PLAZA';
  }

  // Check pond
  const [px, , pz] = GARDEN_CONFIG.terrain.pondCenter;
  const distPond = Math.hypot(x - px, z - pz);
  if (distPond <= GARDEN_CONFIG.terrain.pondRadius) {
    return 'POND';
  }

  // Check zone beds
  for (const zone of GARDEN_CONFIG.zones) {
    const [zx, , zz] = zone.center;
    const [bw, bd] = zone.bedSize;
    const dx = Math.abs(x - zx);
    const dz = Math.abs(z - zz);

    if (zone.shape === 'OVAL') {
      const rx = bw / 2;
      const rz = bd / 2;
      if ((dx * dx) / (rx * rx) + (dz * dz) / (rz * rz) <= 1.05) {
        return 'BED';
      }
    } else {
      if (dx <= bw / 2 + 0.3 && dz <= bd / 2 + 0.3) {
        return 'BED';
      }
    }
  }

  // Check path
  if (getDistanceToNearestPath(x, z) <= GARDEN_CONFIG.structures.pathWidth * 0.55) {
    return 'PATH';
  }

  return 'GRASS';
}

/**
 * Pure continuous elevation function getGroundY(x, z).
 * All scene systems (terrain mesh, plants, props, camera, physics) share this single ground truth.
 */
export function getGroundY(x: number, z: number): number {
  const { noiseScale, heightScale, plazaRadius, plazaElevation, pondCenter, pondRadius } =
    GARDEN_CONFIG.terrain;

  // Base undulating natural landscape (2 octaves of smooth noise)
  const n1 = perlin2d(x * noiseScale, z * noiseScale);
  const n2 = perlin2d(x * noiseScale * 2.2 + 10.5, z * noiseScale * 2.2 + 10.5) * 0.4;
  let rawY = (n1 + n2) * heightScale;

  // 1. Smoothly flatten Central Plaza at Y = 0.0
  const distOrigin = Math.hypot(x, z);
  const plazaBlend = smoothstep(plazaRadius, plazaRadius + 4.5, distOrigin);
  let y = lerp(plazaElevation, rawY, plazaBlend);

  // 2. Smooth Path grading (paths lead from plaza to zone entrances)
  const pathDist = getDistanceToNearestPath(x, z);
  const pathHalfW = GARDEN_CONFIG.structures.pathWidth * 0.6;
  if (pathDist < pathHalfW + 2.0 && distOrigin > plazaRadius) {
    const pathBlend = smoothstep(pathHalfW, pathHalfW + 2.0, pathDist);
    const pathGradedY = y * 0.85 + 0.04;
    y = lerp(pathGradedY, y, pathBlend);
  }

  // 3. Terraced Botanical Zone Beds (flattened to the nearest zone's designated terrace elevation)
  let nearestZone: GardenZoneConfig | null = null;
  let minZoneDist = 999;
  for (const zone of GARDEN_CONFIG.zones) {
    const [zx, , zz] = zone.center;
    const d = Math.hypot(x - zx, z - zz);
    if (d < minZoneDist) {
      minZoneDist = d;
      nearestZone = zone;
    }
  }

  if (nearestZone) {
    const [, targetElev] = nearestZone.center;
    const [bw, bd] = nearestZone.bedSize;
    const radiusBed = Math.hypot(bw / 2, bd / 2);
    if (minZoneDist < radiusBed + 2.5) {
      const bedBlend = smoothstep(radiusBed * 0.75, radiusBed + 2.0, minZoneDist);
      y = lerp(targetElev, y, bedBlend);
    }
  }

  // 4. Pond Basin depression (carves a gentle smooth bowl down to -0.9m)
  const [px, , pz] = pondCenter;
  const distPond = Math.hypot(x - px, z - pz);
  if (distPond < pondRadius + 3.5) {
    const pondBlend = smoothstep(pondRadius * 0.4, pondRadius + 3.0, distPond);
    const bowlDepth = -0.95;
    y = lerp(bowlDepth, y, pondBlend);
  }

  // 5. Perimeter boundary elevation (gentle berm/hedgerow hill rising at world edge)
  const worldDist = Math.hypot(x, z);
  if (worldDist > 38) {
    const edgeRise = smoothstep(38, 48, worldDist) * 1.8;
    y += edgeRise;
  }

  return y;
}
