// ──────────────────────────────────────────────────────────
// utils/layoutShowcase.ts — Deterministic Showcase Layout Engine
// Pure function: places database plants into themed botanical beds
// ──────────────────────────────────────────────────────────
import { GARDEN_CONFIG, type GardenZoneConfig } from '../gardenConfig';
import type { IShowcasePlant, PlacedShowcasePlant, PlantPlacement } from '../types';

export const HEALTH_CATEGORY_PRIORITY = [
  'immunity',
  'digestion',
  'skin-care',
  'respiratory',
  'pain-relief',
  'stress-sleep',
  'heart-health',
  'womens-health',
  'blood-sugar',
  'fever',
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Determine which zone slug a plant belongs to based on priority categories.
 */
export function determineZoneSlug(categories: string[] = []): string {
  const normalized = (categories || []).map((c) => c.toLowerCase().trim());
  for (const priority of HEALTH_CATEGORY_PRIORITY) {
    if (normalized.includes(priority)) {
      return priority;
    }
  }
  return 'meadow';
}

interface PlacedPoint {
  x: number;
  z: number;
  spread: number;
}

/**
 * Check if a candidate position overlaps any already-placed plant.
 */
function isOverlapping(x: number, z: number, spread: number, placed: PlacedPoint[]): boolean {
  for (const p of placed) {
    const minDist = (spread + p.spread) / 2 + 0.12; // 12cm safety margin
    if (Math.hypot(x - p.x, z - p.z) < minDist) {
      return true;
    }
  }
  return false;
}

/**
 * Pure layout function: maps IShowcasePlant[] to PlacedShowcasePlant[]
 */
export function layoutShowcase(
  plants: IShowcasePlant[],
  zones: readonly GardenZoneConfig[] = GARDEN_CONFIG.zones
): PlacedShowcasePlant[] {
  if (!plants || plants.length === 0) return [];

  const zoneMap = new Map<string, GardenZoneConfig>();
  for (const z of zones) {
    zoneMap.set(z.slug, z);
  }
  const meadowZone = zoneMap.get('meadow') || zones[zones.length - 1];

  const result: PlacedShowcasePlant[] = [];
  const overridePlants: IShowcasePlant[] = [];
  const zoneGroups = new Map<string, IShowcasePlant[]>();

  for (const z of zones) {
    zoneGroups.set(z.slug, []);
  }

  // Partition plants
  for (const plant of plants) {
    if (
      plant.globalPosition3D &&
      Array.isArray(plant.globalPosition3D) &&
      plant.globalPosition3D.length === 3
    ) {
      overridePlants.push(plant);
    } else {
      const slug = determineZoneSlug(plant.healthCategories);
      const targetSlug = zoneGroups.has(slug) ? slug : 'meadow';
      zoneGroups.get(targetSlug)!.push(plant);
    }
  }

  // Place override plants directly
  for (const plant of overridePlants) {
    const slug = determineZoneSlug(plant.healthCategories);
    const zone = zoneMap.get(slug) || meadowZone;
    result.push({
      ...plant,
      placement: {
        position: [
          plant.globalPosition3D![0],
          plant.globalPosition3D![1],
          plant.globalPosition3D![2],
        ],
        rotationY: plant.modelTransform?.rotationY ?? 0,
        zoneId: zone.id,
        zoneSlug: zone.slug,
        isOverride: true,
      },
    });
  }

  // Plants that overflow their zone bed move to the meadow
  const meadowOverflow: IShowcasePlant[] = [];

  // Sort helper: tall in back (placed later in radial direction), short in front
  const sortPlants = (a: IShowcasePlant, b: IShowcasePlant) => {
    const hA = a.visual?.heightM ?? 1.0;
    const hB = b.visual?.heightM ?? 1.0;
    if (Math.abs(hA - hB) > 0.05) {
      return hA - hB; // Shortest first -> front rows
    }
    const dateA = a.createdAt || '';
    const dateB = b.createdAt || '';
    const dateComp = dateA.localeCompare(dateB);
    if (dateComp !== 0) return dateComp;
    return a.id.localeCompare(b.id);
  };

  // Place plants for each non-meadow zone
  for (const zone of zones) {
    if (zone.slug === 'meadow') continue;

    const group = zoneGroups.get(zone.slug) || [];
    if (group.length === 0) continue;

    group.sort(sortPlants);

    const [cx, cy, cz] = zone.center;
    const [bedW, bedD] = zone.bedSize;

    // Unit vectors: radial points from plaza (0,0) to zone center
    const len = Math.hypot(cx, cz);
    const radX = len > 0.001 ? cx / len : 0;
    const radZ = len > 0.001 ? cz / len : 1;
    // Tangent perpendicular vector
    const tanX = -radZ;
    const tanZ = radX;

    const placedPoints: PlacedPoint[] = [];

    // Rows from front (-usableD/2) to back (+usableD/2)
    const margin = 0.8;
    const usableW = Math.max(2, bedW - margin * 2);
    const usableD = Math.max(2, bedD - margin * 2);

    // For oval beds, avoid extreme edge rows where availWidth is near 0
    const radialLimit = zone.shape === 'OVAL' ? (usableD / 2) * 0.85 : usableD / 2;
    let curRadial = -radialLimit;

    const getRowTangentBounds = (rad: number) => {
      if (zone.shape === 'OVAL') {
        const rFrac = Math.min(0.95, Math.abs(rad) / (usableD / 2));
        const span = (usableW / 2) * Math.sqrt(Math.max(0.05, 1 - rFrac * rFrac)) * 0.9;
        return { minT: -span, maxT: span };
      }
      return { minT: -usableW / 2, maxT: usableW / 2 };
    };

    let { minT, maxT } = getRowTangentBounds(curRadial);
    let curTangential = minT;
    let rowMaxSpread = 0.6;

    for (const plant of group) {
      const spread = Math.max(0.4, plant.visual?.spreadM ?? 0.8);
      const halfSpread = spread / 2;

      // Check if we need to advance to next row
      if (curTangential + spread > maxT && placedPoints.length > 0) {
        curRadial += Math.max(0.8, rowMaxSpread * 1.1);
        if (curRadial > radialLimit) {
          // Exceeds bed depth -> overflow to meadow
          meadowOverflow.push(plant);
          continue;
        }
        const bounds = getRowTangentBounds(curRadial);
        minT = bounds.minT;
        maxT = bounds.maxT;
        curTangential = minT;
        rowMaxSpread = spread;
      } else {
        rowMaxSpread = Math.max(rowMaxSpread, spread);
      }

      if (curRadial > radialLimit) {
        meadowOverflow.push(plant);
        continue;
      }

      const tanOffset = curTangential + halfSpread;
      const radOffset = curRadial;

      // Candidate world coordinates
      let candX = cx + tanX * tanOffset + radX * radOffset;
      let candZ = cz + tanZ * tanOffset + radZ * radOffset;

      // Check overlap with previously placed points in this bed
      if (isOverlapping(candX, candZ, spread, placedPoints)) {
        curTangential += 0.35;
        candX = cx + tanX * (curTangential + halfSpread) + radX * radOffset;
        candZ = cz + tanZ * (curTangential + halfSpread) + radZ * radOffset;
      }

      placedPoints.push({ x: candX, z: candZ, spread });

      const seed = hashString(plant.id);
      const rotY = (seed % 628) / 100;

      result.push({
        ...plant,
        placement: {
          position: [candX, cy, candZ],
          rotationY: rotY,
          zoneId: zone.id,
          zoneSlug: zone.slug,
        },
      });

      curTangential += spread + 0.35; // advance along tangent
    }
  }

  // Meadow Zone Placement (includes meadow plants + overflows)
  const meadowGroup = [...(zoneGroups.get('meadow') || []), ...meadowOverflow];
  if (meadowGroup.length > 0) {
    meadowGroup.sort(sortPlants);

    const [cx, cy, cz] = meadowZone.center;
    const [bedW, bedD] = meadowZone.bedSize;

    const len = Math.hypot(cx, cz);
    const radX = len > 0.001 ? cx / len : 0;
    const radZ = len > 0.001 ? cz / len : 1;
    const tanX = -radZ;
    const tanZ = radX;

    const placedPoints: PlacedPoint[] = [];
    const margin = 1.0;
    const usableW = Math.max(2, bedW - margin * 2);

    let curRadial = -bedD / 2 + margin;
    let curTangential = -usableW / 2;
    let rowMaxSpread = 0.8;

    for (const plant of meadowGroup) {
      const spread = Math.max(0.4, plant.visual?.spreadM ?? 0.8);
      const halfSpread = spread / 2;

      if (curTangential + halfSpread > usableW / 2 && placedPoints.length > 0) {
        curRadial += Math.max(1.0, rowMaxSpread * 1.15);
        curTangential = -usableW / 2;
        rowMaxSpread = spread;
      } else {
        rowMaxSpread = Math.max(rowMaxSpread, spread);
      }

      const tanOffset = curTangential + halfSpread;
      const radOffset = curRadial;

      const candX = cx + tanX * tanOffset + radX * radOffset;
      const candZ = cz + tanZ * tanOffset + radZ * radOffset;

      placedPoints.push({ x: candX, z: candZ, spread });

      const seed = hashString(plant.id);
      const rotY = (seed % 628) / 100;

      result.push({
        ...plant,
        placement: {
          position: [candX, cy, candZ],
          rotationY: rotY,
          zoneId: meadowZone.id,
          zoneSlug: meadowZone.slug,
        },
      });

      curTangential += spread + 0.45;
    }
  }

  return result;
}
