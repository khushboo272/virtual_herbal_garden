import * as THREE from 'three';
import type { PartMeshAnchor } from '../types';

export const PART_MATCH_PATTERNS: Record<string, RegExp> = {
  leaves: /(?:part[_-])?(?:leaves?|foliage|leaf)/i,
  roots: /(?:part[_-])?(?:roots?|rhizome|tuber|bulb)/i,
  stem: /(?:part[_-])?(?:stem|stalk|trunk|branch|shoot)/i,
  bark: /(?:part[_-])?(?:bark|wood)/i,
  flowers: /(?:part[_-])?(?:flowers?|petals?|blossom|blooms?)/i,
  seeds: /(?:part[_-])?(?:seeds?|pod|grain)/i,
  fruit: /(?:part[_-])?(?:fruits?|berry|berries|drupe)/i,
  resin: /(?:part[_-])?(?:resin|sap|latex|gum)/i,
  whole_plant: /(?:part[_-])?(?:whole|plant|specimen)/i,
};

export const PART_DISPLAY_NAMES: Record<string, string> = {
  leaves: 'Leaves',
  roots: 'Roots',
  stem: 'Stem',
  bark: 'Bark',
  flowers: 'Flowers',
  seeds: 'Seeds',
  fruit: 'Fruit',
  resin: 'Resin',
  whole_plant: 'Whole Plant',
};

/**
 * Normalizes a raw string to recognized standard plant part keys
 */
export function normalizePartKey(raw: string): string {
  const clean = raw.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (clean === 'leaf') return 'leaves';
  if (clean === 'root') return 'roots';
  if (clean === 'flower') return 'flowers';
  if (clean === 'seed') return 'seeds';
  return clean;
}

/**
 * Resolves 3D positions for the plant's actual partsUsed.
 * If meshes with matching names exist in the GLB scene, anchors directly to the mesh center.
 * Otherwise, calculates proportional bounding-box anchor positions.
 */
export function resolvePlantParts(
  scene: THREE.Object3D,
  partsUsed: string[] = []
): PartMeshAnchor[] {
  // Update matrix world so positions are accurate
  scene.updateMatrixWorld(true);

  // Compute overall scene bounds
  const sceneBox = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  sceneBox.getSize(size);
  const center = new THREE.Vector3();
  sceneBox.getCenter(center);

  const minX = sceneBox.min.x;
  const maxX = sceneBox.max.x;
  const minY = sceneBox.min.y;
  const maxY = sceneBox.max.y;
  const height = Math.max(0.1, size.y);
  const width = Math.max(0.1, size.x);
  const depth = Math.max(0.1, size.z);

  // Gather all meshes in the scene
  const sceneMeshes: THREE.Mesh[] = [];
  scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      sceneMeshes.push(obj as THREE.Mesh);
    }
  });

  // Only resolve parts that are in partsUsed (defaults to leaves and stem if empty)
  const activeParts = partsUsed.length > 0
    ? partsUsed.map(normalizePartKey)
    : ['leaves', 'stem'];

  const results: PartMeshAnchor[] = [];

  for (const partKey of activeParts) {
    const pattern = PART_MATCH_PATTERNS[partKey];
    let matchedMesh: THREE.Mesh | null = null;

    if (pattern) {
      for (const mesh of sceneMeshes) {
        if (pattern.test(mesh.name)) {
          matchedMesh = mesh;
          break;
        }
      }
    }

    if (matchedMesh) {
      // Calculate center of the matched mesh
      const meshBox = new THREE.Box3().setFromObject(matchedMesh);
      const meshCenter = new THREE.Vector3();
      meshBox.getCenter(meshCenter);

      results.push({
        part: partKey,
        label: PART_DISPLAY_NAMES[partKey] || partKey.charAt(0).toUpperCase() + partKey.slice(1),
        position: [meshCenter.x, meshCenter.y, meshCenter.z],
        hasRealMesh: true,
        meshName: matchedMesh.name,
        targetObject: matchedMesh,
      });
    } else {
      // Calculate anatomical anchor points with angular and vertical distribution
      const anchor = getPartAnchorPoint(
        partKey,
        center,
        minY,
        height,
        width,
        depth,
        results.length,
        activeParts.length
      );
      results.push({
        part: partKey,
        label: PART_DISPLAY_NAMES[partKey] || partKey.charAt(0).toUpperCase() + partKey.slice(1),
        position: anchor,
        hasRealMesh: false,
      });
    }
  }

  return results;
}

/**
 * Calculates anchor point based on standard botanical anatomy proportions
 * with radial and angular distribution to prevent label overlapping
 */
export function getPartAnchorPoint(
  partKey: string,
  center: THREE.Vector3,
  minY: number,
  height: number,
  width: number,
  depth: number,
  index = 0,
  totalParts = 1
): [number, number, number] {
  let relativeY = 0.5;
  let radialFactor = 0.35;

  switch (partKey) {
    case 'roots':
      relativeY = 0.08;
      radialFactor = 0.2;
      break;
    case 'bark':
      relativeY = 0.3;
      radialFactor = 0.28;
      break;
    case 'stem':
      relativeY = 0.45;
      radialFactor = 0.22;
      break;
    case 'resin':
      relativeY = 0.52;
      radialFactor = 0.3;
      break;
    case 'leaves':
      relativeY = 0.8;
      radialFactor = 0.38;
      break;
    case 'fruit':
      relativeY = 0.72;
      radialFactor = 0.4;
      break;
    case 'seeds':
      relativeY = 0.78;
      radialFactor = 0.38;
      break;
    case 'flowers':
      relativeY = 0.86;
      radialFactor = 0.42;
      break;
    case 'whole_plant':
    default:
      relativeY = 0.5;
      radialFactor = 0.3;
      break;
  }

  // Radiate angularly around the plant perimeter based on index
  const angle = (2 * Math.PI * index) / Math.max(1, totalParts) + Math.PI / 6;
  const radiusX = Math.max(0.12, width * radialFactor);
  const radiusZ = Math.max(0.12, depth * radialFactor);

  const posX = center.x + Math.cos(angle) * radiusX;
  const posY = minY + height * relativeY;
  const posZ = center.z + Math.sin(angle) * radiusZ;

  return [posX, posY, posZ];
}

