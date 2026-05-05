// ─────────────────────────────────────────────────────
// Birds.tsx — 5 bird entities on circular animated paths
// ─────────────────────────────────────────────────────
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ── Single Bird ──────────────────────────────────── */

function Bird({ offset = 0, radius = 20, height = 18, speed = 0.3 }: {
  offset?: number;
  radius?: number;
  height?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const wingLeftRef = useRef<THREE.Mesh>(null);
  const wingRightRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * speed + offset;

    // Circular flight path
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = height + Math.sin(t * 3) * 0.5;

    // Face forward along path
    ref.current.rotation.y = -t + Math.PI / 2;

    // Wing flapping
    const wingAngle = Math.sin(t * 8) * 0.3;
    if (wingLeftRef.current) wingLeftRef.current.rotation.x = wingAngle;
    if (wingRightRef.current) wingRightRef.current.rotation.x = -wingAngle;
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.1, 0.15]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Left wing */}
      <mesh ref={wingLeftRef} position={[0, 0, 0.22]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.25]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Right wing */}
      <mesh ref={wingRightRef} position={[0, 0, -0.22]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.25]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Tail */}
      <mesh position={[-0.35, 0.02, 0]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.15, 0.03, 0.12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
}

/* ── Birds Group — 5 birds ────────────────────────── */

export function Birds() {
  return (
    <>
      {[0, 2.1, 4.2, 6.0, 8.5].map((offset, i) => (
        <Bird
          key={i}
          offset={offset}
          radius={18 + i * 2}
          height={16 + i}
          speed={0.25 + i * 0.03}
        />
      ))}
    </>
  );
}
