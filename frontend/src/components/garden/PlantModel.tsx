// ─────────────────────────────────────────────────────
// PlantModel.tsx — GLTF model loader with wind animation
// Loads actual 3D models from public/models/ directory
// ─────────────────────────────────────────────────────
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface PlantModelProps {
  modelUrl: string;
  position: [number, number, number];
  scale?: number;
}

export function PlantModel({ modelUrl, position, scale = 1 }: PlantModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelUrl);
  const cloned = useMemo(() => scene.clone(), [scene]);

  // Enable shadows on all meshes
  useMemo(() => {
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [cloned]);

  // Wind effect — subtle sway
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(t * 0.8 + position[0] * 0.3) * 0.012;
      groupRef.current.rotation.x = Math.sin(t * 0.6 + position[2] * 0.5 + 1) * 0.008;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}
