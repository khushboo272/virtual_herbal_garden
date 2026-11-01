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
      // Calculate anatomical anchor points based on height proportions
      const anchor = getPartAnchorPoint(partKey, center, minY, height, width, depth);
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
 */
export function getPartAnchorPoint(
  partKey: string,
  center: THREE.Vector3,
  minY: number,
  height: number,
  width: number,
  depth: number
): [number, number, number] {
  switch (partKey) {
    case 'leaves':
      return [center.x, minY + height * 0.8, center.z + depth * 0.15];
    case 'flowers':
      return [center.x + width * 0.2, minY + height * 0.75, center.z + depth * 0.2];
    case 'fruit':
      return [center.x - width * 0.2, minY + height * 0.65, center.z + depth * 0.2];
    case 'seeds':
      return [center.x, minY + height * 0.7, center.z - depth * 0.2];
    case 'bark':
      return [center.x + width * 0.15, minY + height * 0.35, center.z];
    case 'stem':
      return [center.x, minY + height * 0.45, center.z];
    case 'roots':
      return [center.x, minY + height * 0.05, center.z];
    case 'resin':
      return [center.x - width * 0.1, minY + height * 0.5, center.z + depth * 0.1];
    case 'whole_plant':
    default:
      return [center.x, minY + height * 0.5, center.z];
  }
}

