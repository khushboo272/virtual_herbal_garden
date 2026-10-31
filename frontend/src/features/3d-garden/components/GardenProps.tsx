// ──────────────────────────────────────────────────────────
// components/GardenProps.tsx — Benches, Birdbath, Stepping Stones, Rocks & Wildlife
// High-detail garden props, stone lanterns, butterflies and birdbath
// ──────────────────────────────────────────────────────────
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GARDEN_CONFIG } from '../gardenConfig';
import { getGroundY } from '../utils/terrainGenerator';

interface GardenPropsProps {
  reducedMotion?: boolean;
}

export function GardenProps({ reducedMotion = false }: GardenPropsProps) {
  const butterfliesRef = useRef<THREE.InstancedMesh>(null);

  // Weathered Teak Benches
  const benches = useMemo(() => {
    // 3 picturesque rest positions near path viewpoints
    const positions: [number, number, number][] = [
      [5.5, 0, 7.5],
      [-6.5, 0, -6.0],
      [11.0, 0, 4.0],
    ];

    return positions.map(([bx, , bz], idx) => {
      const by = getGroundY(bx, bz);
      const rotY = idx * 1.8;

      return (
        <group key={`bench-${idx}`} position={[bx, by, bz]} rotation={[0, rotY, 0]}>
          {/* Seat slats */}
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.5, 0.05, 0.55]} />
            <meshStandardMaterial color="#5c3821" roughness={0.8} />
          </mesh>
          {/* Backrest */}
          <mesh position={[0, 0.85, -0.24]} rotation={[0.1, 0, 0]} castShadow>
            <boxGeometry args={[1.5, 0.5, 0.05]} />
            <meshStandardMaterial color="#5c3821" roughness={0.8} />
          </mesh>
          {/* Cast stone legs */}
          {[-0.6, 0.6].map((lx) => (
            <mesh key={`leg-${lx}`} position={[lx, 0.22, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.08, 0.44, 0.48]} />
              <meshStandardMaterial color="#78716c" roughness={0.9} />
            </mesh>
          ))}
        </group>
      );
    });
  }, []);

  // Central Plaza Birdbath
  const birdbath = useMemo(() => {
    const by = getGroundY(0, 0);

    return (
      <group position={[0, by, 0]}>
        {/* Tiered Pedestal Base */}
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.55, 0.65, 0.2, 16]} />
          <meshStandardMaterial color="#78716c" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.14, 0.22, 0.7, 12]} />
          <meshStandardMaterial color="#64748b" roughness={0.85} />
        </mesh>
        {/* Basin Bowl */}
        <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 0.35, 0.22, 24]} />
          <meshStandardMaterial color="#78716c" roughness={0.85} />
        </mesh>
        {/* Shallow Reflective Water Dish */}
        <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.82, 24]} />
          <meshStandardMaterial
            color="#00695c"
            roughness={0.15}
            metalness={0.1}
          />
        </mesh>
      </group>
    );
  }, []);

  // Stepping stones along path crossings
  const steppingStones = useMemo(() => {
    const list: JSX.Element[] = [];
    const positions: [number, number][] = [
      [2, 3], [2.8, 3.8], [3.6, 4.6],
      [-2, -3], [-2.8, -3.8], [-3.6, -4.6],
      [14, 12], [14.8, 12.8], [15.6, 13.6],
    ];

    positions.forEach(([sx, sz], i) => {
      const sy = getGroundY(sx, sz);
      list.push(
        <mesh
          key={`step-${i}`}
          position={[sx, sy + 0.025, sz]}
          rotation={[-Math.PI / 2, 0, i * 0.7]}
          receiveShadow
        >
          <circleGeometry args={[0.42 + (i % 2) * 0.08, 7]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
      );
    });
    return list;
  }, []);

  // Butterflies fluttering around flower beds
  const { butterflyCount, butterflyMatrices } = useMemo(() => {
    const count = 12;
    const dummy = new THREE.Object3D();
    const matrices = new Float32Array(count * 16);

    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const r = 5 + (i % 4) * 3.5;
      const x = Math.cos(ang) * r;
      const z = Math.sin(ang) * r;
      const y = getGroundY(x, z) + 0.9 + (i % 3) * 0.3;

      dummy.position.set(x, y, z);
      dummy.scale.set(0.12, 0.08, 0.12);
      dummy.updateMatrix();
      dummy.matrix.toArray(matrices, i * 16);
    }
    return { butterflyCount: count, butterflyMatrices: matrices };
  }, []);

  useFrame(({ clock }) => {
    if (butterfliesRef.current && !reducedMotion) {
      const t = clock.getElapsedTime();
      butterfliesRef.current.position.y = Math.sin(t * 3.0) * 0.12;
      butterfliesRef.current.rotation.y = t * 0.8;
    }
  });

  return (
    <group>
      {benches}
      {birdbath}
      {steppingStones}

      {/* Fluttering Butterflies */}
      <instancedMesh
        ref={butterfliesRef}
        args={[new THREE.PlaneGeometry(1, 1), undefined, butterflyCount]}
      >
        <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
}

