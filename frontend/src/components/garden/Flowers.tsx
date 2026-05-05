// ─────────────────────────────────────────────────────
// Flowers.tsx — 80 small flower props in 5 colors
// ─────────────────────────────────────────────────────
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const FLOWER_COLORS = ['#ff6b6b', '#ffcc44', '#cc44ff', '#ff88aa', '#44ddff'];

/* ── Single Flower ────────────────────────────────── */

function SingleFlower({ position, color }: {
  position: [number, number, number];
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.8 + position[0] * 10) * 0.05;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Stem */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#3a7a1a" />
      </mesh>

      {/* Petals */}
      {[0, 1, 2, 3, 4].map((j) => {
        const a = (j / 5) * Math.PI * 2;
        return (
          <mesh
            key={j}
            position={[Math.cos(a) * 0.06, 0.32, Math.sin(a) * 0.06]}
            rotation={[0.3, a, 0]}
          >
            <circleGeometry args={[0.06, 6]} />
            <meshStandardMaterial
              color={color}
              roughness={0.5}
              side={THREE.DoubleSide}
              emissive={color}
              emissiveIntensity={0.08}
            />
          </mesh>
        );
      })}

      {/* Center pistil */}
      <mesh position={[0, 0.33, 0]}>
        <sphereGeometry args={[0.04, 6, 4]} />
        <meshStandardMaterial color="#ffd54f" roughness={0.4} emissive="#ffd54f" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

/* ── Flowers — 80 instances ───────────────────────── */

export function Flowers() {
  const flowers = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      pos: [
        (seededRandom(i * 23) - 0.5) * 80,
        0,
        (seededRandom(i * 31) - 0.5) * 80,
      ] as [number, number, number],
      color: FLOWER_COLORS[i % FLOWER_COLORS.length],
    }))
  , []);

  return (
    <group>
      {flowers.map((f, i) => (
        <SingleFlower key={i} position={f.pos} color={f.color} />
      ))}
    </group>
  );
}
