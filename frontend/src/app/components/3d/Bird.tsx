// ─────────────────────────────────────────────────────
// Bird.tsx — Enhanced animated birds with detailed
// geometry, banking turns, altitude variation, gliding
// ─────────────────────────────────────────────────────
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BirdProps {
  radius?: number;
  speed?: number;
  height?: number;
  offset?: number;
  isLeader?: boolean;
}

function SingleBird({
  radius = 15,
  speed = 0.3,
  height = 12,
  offset = 0,
  isLeader = false,
}: BirdProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const bodyColor = useMemo(() => {
    const colors = ["#2c2c2c", "#3d3d3d", "#1a1a2e", "#2d3436", "#362c28"];
    return colors[Math.floor(Math.abs(offset * 100) % colors.length)];
  }, [offset]);

  const wingColor = useMemo(() => {
    const c = new THREE.Color(bodyColor);
    c.lerp(new THREE.Color("#555555"), 0.3);
    return `#${c.getHexString()}`;
  }, [bodyColor]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + offset;

    if (groupRef.current) {
      // Circular flight path with altitude variation
      const altNoise = Math.sin(t * 1.3) * 0.8 + Math.cos(t * 0.7) * 0.4;
      groupRef.current.position.x = Math.cos(t) * radius;
      groupRef.current.position.z = Math.sin(t) * radius;
      groupRef.current.position.y = height + altNoise;

      // Face direction of movement
      const nextT = t + 0.02;
      const nextX = Math.cos(nextT) * radius;
      const nextZ = Math.sin(nextT) * radius;
      const nextY = height + Math.sin(nextT * 1.3) * 0.8 + Math.cos(nextT * 0.7) * 0.4;
      groupRef.current.lookAt(nextX, nextY, nextZ);

      // Banking into turns — roll based on turn rate
      const turnRate = -Math.sin(t) * speed * radius;
      groupRef.current.rotation.z = turnRate * 0.008;
    }

    // Wing animation — flap with occasional glide
    const flapTime = clock.getElapsedTime() * 8 + offset;
    const glidePhase = Math.sin(clock.getElapsedTime() * 0.5 + offset * 3);
    const isGliding = glidePhase > 0.7;

    const flapAngle = isGliding
      ? 0.05 // Wings slightly raised during glide
      : Math.sin(flapTime) * 0.5;

    if (leftWingRef.current) {
      leftWingRef.current.rotation.z = -flapAngle;
    }
    if (rightWingRef.current) {
      rightWingRef.current.rotation.z = flapAngle;
    }
  });

  const bodyScale = isLeader ? 1.15 : 1;

  return (
    <group ref={groupRef} scale={bodyScale}>
      {/* Body — tapered capsule */}
      <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.04, 0.22, 4, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.02, -0.14]} castShadow>
        <sphereGeometry args={[0.045, 6, 5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>

      {/* Beak */}
      <mesh position={[0, 0, -0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.015, 0.06, 4]} />
        <meshStandardMaterial color="#e8a030" roughness={0.4} />
      </mesh>

      {/* Tail feathers */}
      <mesh position={[0, 0.01, 0.14]} rotation={[-0.2, 0, 0]}>
        <planeGeometry args={[0.06, 0.1]} />
        <meshStandardMaterial color={bodyColor} side={THREE.DoubleSide} roughness={0.7} />
      </mesh>

      {/* Left wing group */}
      <group ref={leftWingRef} position={[0.04, 0, 0]}>
        {/* Inner wing */}
        <mesh position={[0.1, 0, -0.02]} rotation={[0, 0, 0.15]}>
          <planeGeometry args={[0.2, 0.1]} />
          <meshStandardMaterial color={wingColor} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
        {/* Outer wing (tip) */}
        <mesh position={[0.22, 0.02, -0.01]} rotation={[0, 0, 0.25]}>
          <planeGeometry args={[0.12, 0.06]} />
          <meshStandardMaterial color={bodyColor} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      </group>

      {/* Right wing group */}
      <group ref={rightWingRef} position={[-0.04, 0, 0]}>
        <mesh position={[-0.1, 0, -0.02]} rotation={[0, 0, -0.15]}>
          <planeGeometry args={[0.2, 0.1]} />
          <meshStandardMaterial color={wingColor} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
        <mesh position={[-0.22, 0.02, -0.01]} rotation={[0, 0, -0.25]}>
          <planeGeometry args={[0.12, 0.06]} />
          <meshStandardMaterial color={bodyColor} side={THREE.DoubleSide} roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Flock with V-formation grouping ──────────────── */

export function Birds() {
  return (
    <group>
      {/* Main flock — loose V-formation */}
      <SingleBird radius={18} speed={0.25} height={14} offset={0} isLeader />
      <SingleBird radius={18} speed={0.25} height={14.3} offset={0.25} />
      <SingleBird radius={18} speed={0.25} height={14.2} offset={-0.25} />

      {/* Secondary pair */}
      <SingleBird radius={22} speed={0.18} height={17} offset={2} />
      <SingleBird radius={22} speed={0.18} height={17.4} offset={2.3} />

      {/* Solo scouts */}
      <SingleBird radius={14} speed={0.32} height={12} offset={4} />
      <SingleBird radius={25} speed={0.15} height={19} offset={5.5} />
    </group>
  );
}
