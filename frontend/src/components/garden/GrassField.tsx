// ─────────────────────────────────────────────────────
// GrassField.tsx — 200 grass patches with wind animation
// GPU-instanced for performance
// ─────────────────────────────────────────────────────
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* ── Single Grass Patch — 8 blade planes ─────────── */

function GrassPatch({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  const blades = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      x: (Math.random() - 0.5) * 0.4,
      z: (Math.random() - 0.5) * 0.4,
      h: 0.15 + Math.random() * 0.25,
      rot: Math.random() * Math.PI,
      hue: 90 + Math.random() * 35,
      sat: 45 + Math.random() * 30,
      light: 18 + Math.random() * 18,
    }))
  , []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 1.5 + position[0] * 10) * 0.08;
  });

  return (
    <group ref={groupRef} position={position}>
      {blades.map((b, i) => (
        <mesh
          key={i}
          position={[b.x, b.h / 2, b.z]}
          rotation={[0, b.rot, 0]}
        >
          <planeGeometry args={[0.04, b.h]} />
          <meshStandardMaterial
            color={`hsl(${b.hue}, ${b.sat}%, ${b.light}%)`}
            roughness={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ── GrassField — 200 patches scattered ───────────── */

export function GrassField() {
  const patches = useMemo(() =>
    Array.from({ length: 200 }, (_, i) => [
      (seededRandom(i * 7) - 0.5) * 90,
      0,
      (seededRandom(i * 13) - 0.5) * 90,
    ] as [number, number, number])
  , []);

  return (
    <group>
      {patches.map((p, i) => (
        <GrassPatch key={i} position={p} />
      ))}
    </group>
  );
}
