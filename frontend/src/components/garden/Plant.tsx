// ─────────────────────────────────────────────────────
// Plant.tsx — Interactive plant wrapper
// Hover effects, click handling, glow ring, name label
// ─────────────────────────────────────────────────────
import { useState, useRef, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';

import { PlantModel } from './PlantModel';
import { FallbackPlant } from './FallbackPlant';
import type { ScenePlant } from '../Garden3DScene';

interface PlantProps {
  plant: ScenePlant;
  onSelect: (plant: ScenePlant) => void;
}

export function Plant({ plant, onSelect }: PlantProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Smooth scale lerp for hover
  useFrame(() => {
    if (groupRef.current) {
      const s = hovered ? 1.08 : 1.0;
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect(plant);
  };

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
      {/* Plant model or fallback */}
      <Suspense fallback={<FallbackPlant position={plant.position} color={plant.color} />}>
        {plant.modelUrl
          ? <PlantModel modelUrl={plant.modelUrl} position={plant.position} scale={plant.scale} />
          : <FallbackPlant position={plant.position} color={plant.color} />
        }
      </Suspense>

      {/* Hover glow ring */}
      {hovered && (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[plant.position[0], 0.02, plant.position[2]]}
        >
          <ringGeometry args={[0.8, 1.1, 32]} />
          <meshBasicMaterial color="#88ffaa" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Floating name label */}
      <Billboard position={[plant.position[0], plant.position[1] + 3, plant.position[2]]}>
        <Text
          fontSize={0.35}
          color="white"
          outlineWidth={0.02}
          outlineColor="black"
          anchorX="center"
          anchorY="middle"
        >
          {plant.name}
        </Text>
      </Billboard>
    </group>
  );
}
