import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { LibraryPlant } from '../../../features/library/types/library.types';
import type { PartMeshAnchor } from '../types';
import { normalizeViewerModel } from '../utils/normalizeViewerModel';
import { resolvePlantParts, PART_MATCH_PATTERNS } from '../utils/resolveParts';
import { PlantLabels } from './PlantLabels';

interface PlantModelProps {
  plant: LibraryPlant;
  modelUrl: string;
  wireframe?: boolean;
  isolatedPart?: string | null;
  showLabels?: boolean;
  selectedPart?: string | null;
  onSelectPart: (part: string) => void;
  onAnchorsResolved?: (anchors: PartMeshAnchor[]) => void;
  onModelLoaded?: (box: THREE.Box3) => void;
}

export const PlantModel: React.FC<PlantModelProps> = ({
  plant,
  modelUrl,
  wireframe = false,
  isolatedPart = null,
  showLabels = true,
  selectedPart = null,
  onSelectPart,
  onAnchorsResolved,
  onModelLoaded,
}) => {
  const gltf = useGLTF(modelUrl);

  // Clone scene so we don't mutate cached GLTF across instances
  const clonedScene = useMemo(() => {
    return gltf.scene.clone(true);
  }, [gltf.scene]);

  // Target height in meters from visual or default 1.5m
  const targetHeightM = Math.max(0.3, plant.visual?.heightM || 1.5);

  // Normalize and resolve parts
  const { anchors, box } = useMemo(() => {
    normalizeViewerModel(clonedScene, targetHeightM, true);
    const sceneBox = new THREE.Box3().setFromObject(clonedScene);
    const resolved = resolvePlantParts(clonedScene, plant.partsUsed || []);
    return { anchors: resolved, box: sceneBox };
  }, [clonedScene, targetHeightM, plant.partsUsed]);

  // Notify parent of resolved anchors & bounding box for camera framing
  useEffect(() => {
    if (onAnchorsResolved) {
      onAnchorsResolved(anchors);
    }
    if (onModelLoaded) {
      onModelLoaded(box);
    }
  }, [anchors, box, onAnchorsResolved, onModelLoaded]);

  // Apply wireframe and isolation / dimming effects
  useEffect(() => {
    const isolatePattern = isolatedPart ? PART_MATCH_PATTERNS[isolatedPart] : null;

    clonedScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        const isMatchingPart = isolatePattern ? isolatePattern.test(mesh.name) : true;

        for (const mat of materials) {
          if (mat) {
            mat.wireframe = wireframe;

            if (isolatedPart) {
              if (isMatchingPart) {
                mat.transparent = false;
                mat.opacity = 1.0;
                if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  (mat as THREE.MeshStandardMaterial).emissive = new THREE.Color('#10b981');
                  (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0.35;
                }
              } else {
                mat.transparent = true;
                mat.opacity = 0.15;
                if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                  (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0;
                }
              }
            } else {
              mat.transparent = false;
              mat.opacity = 1.0;
              if ((mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
                (mat as THREE.MeshStandardMaterial).emissiveIntensity = 0;
              }
            }
          }
        }
      }
    });
  }, [clonedScene, wireframe, isolatedPart]);

  // Cleanup on unmount (prevent WebGL memory leaks)
  useEffect(() => {
    return () => {
      clonedScene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) m.dispose();
          }
        }
      });
    };
  }, [clonedScene]);

  return (
    <group>
      <primitive object={clonedScene} />
      <PlantLabels
        anchors={anchors}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        visible={showLabels}
      />
    </group>
  );
};

