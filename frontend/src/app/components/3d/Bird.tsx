// ─────────────────────────────────────────────────────
// Bird.tsx — Simple animated birds (circular flight)
// ─────────────────────────────────────────────────────
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BirdProps {
  radius?: number;
  speed?: number;
  height?: number;
  offset?: number;
}

function SingleBird({ radius = 15, speed = 0.3, height = 12, offset = 0 }: BirdProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;

    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t) * radius;
      groupRef.current.position.z = Math.sin(t) * radius;
      groupRef.current.position.y = height + Math.sin(t * 2) * 0.5;

      // Face direction of movement
      const nextX = Math.cos(t + 0.01) * radius;
      const nextZ = Math.sin(t + 0.01) * radius;
      groupRef.current.lookAt(nextX, height, nextZ);
    }

    // Wing flap
    if (wingRef.current) {
      wingRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 8 + offset) * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.05, 0.2, 4, 8]} />
        <meshStandardMaterial color="#2c2c2c" />
      </mesh>
      {/* Wings */}
      <group ref={wingRef}>
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, 0.3]}>
          <planeGeometry args={[0.3, 0.08]} />
          <meshStandardMaterial color="#3a3a3a" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, -0.3]}>
          <planeGeometry args={[0.3, 0.08]} />
          <meshStandardMaterial color="#3a3a3a" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

export function Birds() {
  return (
    <group>
      <SingleBird radius={18} speed={0.25} height={14} offset={0} />
      <SingleBird radius={22} speed={0.2} height={16} offset={2} />
      <SingleBird radius={14} speed={0.35} height={12} offset={4} />
      <SingleBird radius={20} speed={0.18} height={18} offset={1} />
      <SingleBird radius={16} speed={0.28} height={13} offset={3} />
    </group>
  );
}
