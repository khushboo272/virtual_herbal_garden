// ──────────────────────────────────────────────────────────
// components/PlantInstance.tsx — Unified Plant Scene Component
// Switches between ModelPlant and ProceduralPlant; manages hover/selection
// ──────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GARDEN_CONFIG } from '../gardenConfig';
import type { PlacedShowcasePlant } from '../types';
import { ModelPlant } from './ModelPlant';
import { ProceduralPlant } from './ProceduralPlant';
import { PlantLabels } from './PlantLabels';

interface PlantInstanceProps {
  plant: PlacedShowcasePlant;
  isSelected: boolean;
  onSelect: (plant: PlacedShowcasePlant) => void;
  showLabels?: boolean;
}

export function PlantInstance({ plant, isSelected, onSelect, showLabels = true }: PlantInstanceProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const pos = plant.placement.position;
  const rotY = plant.placement.rotationY;

  // Hover scale animation
  useFrame(() => {
    if (groupRef.current) {
      const targetScale = hovered ? GARDEN_CONFIG.rendering.hoverScale : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(plant);
  };

  const hasRealModel = Boolean(plant.modelUrl && plant.modelStatus !== 'FAILED');

  return (
    <group
      ref={groupRef}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
      onClick={handleClick}
    >
      {/* 3D Representation */}
      {hasRealModel ? (
        <ModelPlant plant={plant} position={pos} rotationY={rotY} />
      ) : (
        <ProceduralPlant plant={plant} position={pos} rotationY={rotY} />
      )}

      {/* Billboards, nameplate, ground rings */}
      <PlantLabels
        plant={plant}
        position={pos}
        isHovered={hovered}
        isSelected={isSelected}
        showLabels={showLabels}
      />
    </group>
  );
}

