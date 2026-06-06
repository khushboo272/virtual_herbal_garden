// ─────────────────────────────────────────────────────
// PlantModel.tsx — GLTF model loader with LOD support
// Loads actual 3D models and handles Level of Detail
// ─────────────────────────────────────────────────────
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Detailed } from '@react-three/drei';
import * as THREE from 'three';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface PlantModelProps {
  modelUrl: string;
  position: [number, number, number];
  scale?: number;
}

export function PlantModel({ modelUrl, position, scale = 1 }: PlantModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const { scene } = useGLTF(modelUrl);
  const cloned = useMemo(() => scene.clone(), [scene]);

  // Enable shadows on all meshes (except mobile for performance)
  useMemo(() => {
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = !isMobile;
        child.receiveShadow = !isMobile;
      }
    });
  }, [cloned, isMobile]);

  // Wind effect — subtle sway
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(t * 0.8 + position[0] * 0.3) * 0.012;
      groupRef.current.rotation.x = Math.sin(t * 0.6 + position[2] * 0.5 + 1) * 0.008;
    }
  });

  // Low poly fallback for LOD (Level of Detail) at distance > 30 units
  const lowPolyFallback = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.2, 0.4, 2, 5);
    const mat = new THREE.MeshBasicMaterial({ color: '#2d7a3a' });
    return new THREE.Mesh(geo, mat);
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <Detailed distances={[0, 40]}>
        <primitive object={cloned} />
        <primitive object={lowPolyFallback} position={[0, 1, 0]} />
      </Detailed>
    </group>
  );
}
