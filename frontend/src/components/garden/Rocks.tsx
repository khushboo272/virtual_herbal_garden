// ─────────────────────────────────────────────────────
// Rocks.tsx — 30 randomly placed rock meshes
// ─────────────────────────────────────────────────────
import { useMemo } from 'react';
import * as THREE from 'three';
import { useMediaQuery } from '../../hooks/useMediaQuery';

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function Rocks() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const rocks = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      pos: [
        (seededRandom(i * 41) - 0.5) * 80,
        0,
        (seededRandom(i * 47) - 0.5) * 80,
      ] as [number, number, number],
      scale: [
        0.15 + seededRandom(i * 53) * 0.35,
        0.1 + seededRandom(i * 59) * 0.2,
        0.15 + seededRandom(i * 61) * 0.35,
      ] as [number, number, number],
      rot: seededRandom(i * 67) * Math.PI * 2,
      hasMoss: seededRandom(i * 73) > 0.5,
      colorL: 35 + seededRandom(i * 5) * 20,
    }))
  , []);

  return (
    <group>
      {rocks.map((r, i) => (
        <group key={i} position={r.pos} rotation={[0, r.rot, 0]} scale={r.scale}>
          <mesh castShadow={!isMobile} receiveShadow={!isMobile}>
            <dodecahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={`hsl(25, ${8 + seededRandom(i) * 8}%, ${r.colorL}%)`}
              roughness={0.95}
              metalness={0.05}
            />
          </mesh>
          {r.hasMoss && (
            <mesh position={[0, 0.6, 0]} scale={[1.1, 0.3, 1.1]}>
              <sphereGeometry args={[0.6, 6, 4]} />
              <meshStandardMaterial color="#4a7a3a" roughness={0.9} transparent opacity={0.7} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
