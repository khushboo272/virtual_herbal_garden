// ─────────────────────────────────────────────────────
// FallbackPlant.tsx — Geometric placeholder plant
// Shown when no GLTF model is available (modelUrl is null)
// ─────────────────────────────────────────────────────
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FallbackPlantProps {
  position: [number, number, number];
  color?: string;
}

export function FallbackPlant({ position, color = '#2d7a3a' }: FallbackPlantProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle wind sway matching PlantModel behavior
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(t * 0.6 + position[0] * 0.3) * 0.025;
      groupRef.current.rotation.x = Math.cos(t * 0.4 + position[2] * 0.3) * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Roots */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.3;
        return (
          <mesh key={`root-${i}`} position={[Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15]} rotation={[0.3, a, 0.5]}>
            <cylinderGeometry args={[0.02, 0.04, 0.25, 4]} />
            <meshStandardMaterial color="#4e3a2a" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Trunk */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.12, 1.2, 8]} />
        <meshStandardMaterial color="#5c3a1a" roughness={0.9} />
      </mesh>

      {/* Branch */}
      <mesh castShadow position={[0.15, 1.0, 0.05]} rotation={[0.1, 0, 0.5]}>
        <cylinderGeometry args={[0.025, 0.04, 0.5, 5]} />
        <meshStandardMaterial color="#5d4037" roughness={0.85} />
      </mesh>

      {/* Main canopy */}
      <mesh castShadow position={[0, 1.5, 0]}>
        <dodecahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial color={color} roughness={0.65} metalness={0.02} />
      </mesh>

      {/* Secondary canopy layers */}
      <mesh castShadow position={[0.35, 1.3, 0.2]}>
        <dodecahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial
          color={new THREE.Color(color).multiplyScalar(0.7).getStyle()}
          roughness={0.7}
        />
      </mesh>
      <mesh castShadow position={[-0.28, 1.4, -0.18]}>
        <dodecahedronGeometry args={[0.38, 1]} />
        <meshStandardMaterial
          color={new THREE.Color(color).lerp(new THREE.Color('#a5d6a7'), 0.35).getStyle()}
          roughness={0.72}
        />
      </mesh>
    </group>
  );
}
