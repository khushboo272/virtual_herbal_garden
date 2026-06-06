// ─────────────────────────────────────────────────────
// PersonalizedZone.tsx — Glowing border for user plants
// ─────────────────────────────────────────────────────
import * as THREE from 'three';

export function PersonalizedZone() {
  return (
    <group position={[0, 0.05, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[9.8, 10, 64]} />
        <meshStandardMaterial 
          color="#81c784" 
          emissive="#81c784" 
          emissiveIntensity={2.0} 
          transparent 
          opacity={0.6} 
          side={THREE.DoubleSide} 
        />
      </mesh>
    </group>
  );
}
