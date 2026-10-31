// ──────────────────────────────────────────────────────────
// utils/normalizeModel.ts — 3D Model Bounding-Box Normalization
// Uniform scaling to target height, base-center at y=0, material fixes
// ──────────────────────────────────────────────────────────
import * as THREE from 'three';
import type { ModelTransform } from '../types';

export interface NormalizedModelResult {
  scale: number;
  offsetY: number;
  rotationY: number;
  boundingBox: {
    width: number;
    height: number;
    depth: number;
  };
}

/**
 * Normalizes a GLTF scene object:
 * 1. Computes bounding box.
 * 2. Centers the base at y = 0.
 * 3. Uniformly scales so object height matches targetHeightM.
 * 4. Applies optional ModelTransform overrides.
 * 5. Configures shadows and fixes material properties (envMapIntensity, roughness/metalness sanity).
 */
export function normalizeModel(
  scene: THREE.Object3D,
  targetHeightM: number,
  transform?: Partial<ModelTransform>,
  enableShadows: boolean = true
): NormalizedModelResult {
  // Ensure matrices are up to date
  scene.updateMatrixWorld(true);

  // Compute bounding box
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const rawHeight = size.y > 0.001 ? size.y : 1.0;
  const uniformScale = (targetHeightM > 0 ? targetHeightM : 1.0) / rawHeight;
  const userScale = transform?.scale ?? 1.0;
  const finalScale = uniformScale * userScale;

  // Base-center point
  const baseCenterX = (box.min.x + box.max.x) / 2;
  const baseY = box.min.y;
  const baseCenterZ = (box.min.z + box.max.z) / 2;

  // Reposition children so that base-center is exactly at local [0, 0, 0]
  scene.position.set(-baseCenterX * finalScale, -baseY * finalScale + (transform?.offsetY ?? 0), -baseCenterZ * finalScale);
  scene.scale.set(finalScale, finalScale, finalScale);
  if (transform?.rotationY) {
    scene.rotation.y = transform.rotationY;
  }

  // Material fixes and shadow setup
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      if (enableShadows) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const std = mat as THREE.MeshStandardMaterial;
            std.envMapIntensity = 1.0;
            // Prevent inverted or invisible backfaces on plant leaves
            std.side = THREE.DoubleSide;
            // Ensure alpha testing for cutout textures
            if (std.transparent || std.map) {
              std.alphaTest = Math.max(std.alphaTest, 0.05);
            }
          }
        }
      }
    }
  });

  return {
    scale: finalScale,
    offsetY: transform?.offsetY ?? 0,
    rotationY: transform?.rotationY ?? 0,
    boundingBox: {
      width: size.x * finalScale,
      height: size.y * finalScale,
      depth: size.z * finalScale,
    },
  };
}

