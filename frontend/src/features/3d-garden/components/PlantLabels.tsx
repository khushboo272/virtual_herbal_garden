// ──────────────────────────────────────────────────────────
// components/PlantLabels.tsx — SDF Text, Distance Fade, Ground Nameplate
// Sharp, readable botanical signage with selection feedback
// ──────────────────────────────────────────────────────────
import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { GARDEN_CONFIG } from '../gardenConfig';
import type { IShowcasePlant } from '../types';

interface PlantLabelsProps {
  plant: IShowcasePlant;
  position: [number, number, number];
  isHovered: boolean;
  isSelected: boolean;
  showLabels?: boolean;
}

export function PlantLabels({
  plant,
  position,
  isHovered,
  isSelected,
  showLabels = true,
}: PlantLabelsProps) {
  const { camera } = useThree();
  const [opacity, setOpacity] = useState(1);
  const [isVisible, setIsVisible] = useState(true);

  if (!showLabels && !isHovered && !isSelected) {
    return null;
  }

  const plantHeight = plant.visual?.heightM || 1.0;
  const spread = plant.visual?.spreadM || 0.6;
  const labelY = position[1] + plantHeight + 0.35;

  const worldPos = useRef(new THREE.Vector3(...position)).current;

  // Distance fade calculation in frame loop
  useFrame(() => {
    if (isHovered || isSelected) {
      if (!isVisible) setIsVisible(true);
      if (opacity !== 1) setOpacity(1);
      return;
    }

    const dist = camera.position.distanceTo(worldPos);
    const maxDist = GARDEN_CONFIG.labels.maxVisibleDistance;
    const fadeStart = GARDEN_CONFIG.labels.fadeStartDistance;

    if (dist > maxDist) {
      if (isVisible) setIsVisible(false);
    } else {
      if (!isVisible) setIsVisible(true);
      if (dist <= fadeStart) {
        setOpacity(1.0);
      } else {
        const factor = (maxDist - dist) / (maxDist - fadeStart);
        setOpacity(Math.max(0, Math.min(1, factor)));
      }
    }
  });

  return (
    <group>
      {/* Floating SDF Billboard Label */}
      {isVisible && (
        <Billboard position={[position[0], labelY, position[2]]}>
          <Text
            fontSize={GARDEN_CONFIG.labels.fontSize}
            color={GARDEN_CONFIG.labels.textColor}
            outlineWidth={GARDEN_CONFIG.labels.outlineWidth}
            outlineColor={GARDEN_CONFIG.labels.outlineColor}
            anchorX="center"
            anchorY="middle"
            fillOpacity={opacity}
            outlineOpacity={opacity}
          >
            {plant.commonName}
          </Text>
        </Billboard>
      )}

      {/* Ground Botanical Nameplate (Slate / Wood stake) */}
      <group position={[position[0], position[1] + 0.05, position[2] + spread * 0.45 + 0.2]}>
        {/* Support stake */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.16, 6]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>

        {/* Angled plate */}
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 4, 0, 0]}>
          <boxGeometry args={[0.55, 0.24, 0.018]} />
          <meshStandardMaterial
            color={isSelected ? '#065f46' : GARDEN_CONFIG.labels.plateColor}
            roughness={0.8}
          />
        </mesh>

        {/* Ground plate text */}
        <group position={[0, 0.165, 0.01]} rotation={[-Math.PI / 4, 0, 0]}>
          <Text
            position={[0, 0.04, 0.01]}
            fontSize={0.052}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.5}
          >
            {plant.commonName}
          </Text>
          <Text
            position={[0, -0.04, 0.01]}
            fontSize={0.038}
            fontStyle="italic"
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.5}
          >
            {plant.scientificName}
          </Text>
        </group>
      </group>

      {/* Hover & Selection Ground Rings */}
      {(isHovered || isSelected) && (
        <mesh
          position={[position[0], position[1] + 0.02, position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry
            args={[
              spread * 0.5 + 0.05,
              spread * 0.5 + 0.2,
              32,
            ]}
          />
          <meshBasicMaterial
            color={isSelected ? GARDEN_CONFIG.rendering.selectionOutlineColor : GARDEN_CONFIG.rendering.ringColor}
            transparent
            opacity={isSelected ? 0.75 : 0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

