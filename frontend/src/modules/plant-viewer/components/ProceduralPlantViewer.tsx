import React, { useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { LibraryPlant } from '../../../features/library/types/library.types';
import type { IShowcasePlant } from '../../../features/3d-garden/types';
import { ProceduralPlant } from '../../../features/3d-garden/components/ProceduralPlant';
import { resolvePlantParts } from '../utils/resolveParts';
import type { PartMeshAnchor } from '../types';
import { PlantLabels } from './PlantLabels';

interface ProceduralPlantViewerProps {
  plant: LibraryPlant;
  wireframe?: boolean;
  isolatedPart?: string | null;
  showLabels?: boolean;
  selectedPart?: string | null;
  onSelectPart: (part: string) => void;
  onAnchorsResolved?: (anchors: PartMeshAnchor[]) => void;
  onModelLoaded?: (box: THREE.Box3) => void;
}

export const ProceduralPlantViewer: React.FC<ProceduralPlantViewerProps> = ({
  plant,
  wireframe = false,
  isolatedPart = null,
  showLabels = true,
  selectedPart = null,
  onSelectPart,
  onAnchorsResolved,
  onModelLoaded,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  // Map LibraryPlant to IShowcasePlant expected by ProceduralPlant
  const showcasePlant: IShowcasePlant = useMemo(() => {
    const v = plant.visual || {};
    return {
      id: plant._id || plant.slug || 'procedural-plant',
      slug: plant.slug,
      commonName: plant.commonName,
      scientificName: plant.scientificName,
      plantType: plant.plantType || 'HERB',
      healthCategories: [],
      visual: {
        habit: (v.habit as any) || (plant.plantType === 'TREE' ? 'TREE' : plant.plantType === 'SHRUB' ? 'SHRUB' : 'HERB'),
        heightM: Math.max(0.4, v.heightM || 0.8),
        spreadM: Math.max(0.3, v.spreadM || 0.6),
        foliageColor: v.foliageColor || '#2d7a3a',
        flowerColor: v.flowerColor || '#e91e63',
        leafShape: (v.leafShape as any) || 'OVATE',
      },
      modelUrl: null,
      lodUrl: null,
      modelVersion: 0,
      modelStatus: 'NONE',
      modelTransform: {
        scale: 1,
        rotationY: 0,
        offsetY: 0,
        targetHeightM: v.heightM || 1,
      },
    };
  }, [plant]);

  // Compute bounding box and resolve anatomical part anchors
  const anchors = useMemo(() => {
    const height = Math.max(0.4, showcasePlant.visual.heightM);
    const width = Math.max(0.3, showcasePlant.visual.spreadM);
    
    // Create an anchor bounding dummy
    const dummy = new THREE.Object3D();
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, width));
    boxMesh.position.set(0, height / 2, 0);
    dummy.add(boxMesh);

    return resolvePlantParts(dummy, plant.partsUsed || []);
  }, [showcasePlant.visual, plant.partsUsed]);

  useEffect(() => {
    if (onAnchorsResolved) {
      onAnchorsResolved(anchors);
    }
    if (onModelLoaded) {
      const height = Math.max(0.4, showcasePlant.visual.heightM);
      const width = Math.max(0.3, showcasePlant.visual.spreadM);
      const box = new THREE.Box3(
        new THREE.Vector3(-width / 2, 0, -width / 2),
        new THREE.Vector3(width / 2, height, width / 2)
      );
      onModelLoaded(box);
    }
  }, [anchors, showcasePlant.visual, onAnchorsResolved, onModelLoaded]);

  // Handle wireframe on procedural meshes
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          if (mat) mat.wireframe = wireframe;
        }
      }
    });
  }, [wireframe]);

  return (
    <group ref={groupRef}>
      <ProceduralPlant plant={showcasePlant} position={[0, 0, 0]} />
      <PlantLabels
        anchors={anchors}
        selectedPart={selectedPart}
        onSelectPart={onSelectPart}
        visible={showLabels}
      />
    </group>
  );
};

