import * as THREE from 'three';

export interface NormalizedViewerResult {
  scale: number;
  offsetY: number;
  boundingBox: {
    width: number;
    height: number;
    depth: number;
  };
}

/**
 * Normalizes any loaded 3D GLB model for the viewer:
 * 1. Computes bounding box.
 * 2. Centers the base at y = 0.
 * 3. Uniformly scales so object height matches targetHeightM.
 * 4. Fixes material properties (double-sided leaves, alpha-clip, sRGB, roughness).
 * 5. Enables shadow casting and receiving.
 */
export function normalizeViewerModel(
  scene: THREE.Object3D,
  targetHeightM: number = 1.5,
  enableShadows: boolean = true
): NormalizedViewerResult {
  scene.updateMatrixWorld(true);

  // Compute raw bounding box
  const box = new THREE.Box3().setFromObject(scene);
  const size = new THREE.Vector3();
  box.getSize(size);

  const rawHeight = size.y > 0.001 ? size.y : 1.0;
  const scale = (targetHeightM > 0 ? targetHeightM : 1.5) / rawHeight;

  // Center horizontally, place base at y = 0
  const centerX = (box.min.x + box.max.x) / 2;
  const baseY = box.min.y;
  const centerZ = (box.min.z + box.max.z) / 2;

  scene.position.set(-centerX * scale, -baseY * scale, -centerZ * scale);
  scene.scale.set(scale, scale, scale);

  // Fix materials, shadows, and alpha clipping
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
          // Double-sided rendering so foliage leaves are visible from both sides
          mat.side = THREE.DoubleSide;
          if (mat.transparent || mat.alphaTest > 0) {
            mat.alphaTest = 0.5;
            mat.depthWrite = true;
          }
          if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
            const std = mat as THREE.MeshStandardMaterial;
            std.roughness = Math.min(Math.max(std.roughness, 0.35), 0.95);
            std.metalness = Math.min(std.metalness, 0.15);
          }
        }
      }
    }
  });

  return {
    scale,
    offsetY: -baseY * scale,
    boundingBox: {
      width: size.x * scale,
      height: size.y * scale,
      depth: size.z * scale,
    },
  };
}

