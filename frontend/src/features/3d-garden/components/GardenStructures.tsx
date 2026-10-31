// ──────────────────────────────────────────────────────────
// components/GardenStructures.tsx — Landscaped Architectural Elements
// Terraced retaining walls, timber pergola, raised stone beds, perimeter fence
// ──────────────────────────────────────────────────────────
import { useMemo } from 'react';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { GARDEN_CONFIG } from '../gardenConfig';
import { getGroundY } from '../utils/terrainGenerator';

/**
 * Creates raised stone borders and mulch mounds for each botanical zone bed
 */
function RaisedBedBorders() {
  const { stoneBorders, mulchMounds } = useMemo(() => {
    const borders: JSX.Element[] = [];
    const mounds: JSX.Element[] = [];

    GARDEN_CONFIG.zones.forEach((zone) => {
      const [cx, cy, cz] = zone.center;
      const [w, d] = zone.bedSize;
      const stoneHeight = GARDEN_CONFIG.structures.raisedBedStoneHeight;

      if (zone.shape === 'OVAL') {
        const rx = w / 2;
        const rz = d / 2;
        // Oval stone rim
        borders.push(
          <group key={`border-${zone.id}`} position={[cx, cy, cz]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, stoneHeight / 2, 0]} castShadow receiveShadow>
              <ringGeometry args={[Math.min(rx, rz) * 0.98, Math.max(rx, rz) * 1.05, 48]} />
              <meshStandardMaterial color="#64748b" roughness={0.88} />
            </mesh>
            {/* Raised organic mulch core */}
            <mesh position={[0, stoneHeight * 0.4, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[rx * 0.94, rx * 0.96, stoneHeight * 0.8, 36]} />
              <meshStandardMaterial color="#2d1e12" roughness={0.95} />
            </mesh>
          </group>
        );
      } else {
        // Rectangular stone kerbing
        const wallThick = 0.28;
        borders.push(
          <group key={`border-${zone.id}`} position={[cx, cy, cz]}>
            {/* North & South border walls */}
            <mesh position={[0, stoneHeight / 2, -d / 2]} castShadow receiveShadow>
              <boxGeometry args={[w + wallThick * 2, stoneHeight, wallThick]} />
              <meshStandardMaterial color="#64748b" roughness={0.88} />
            </mesh>
            <mesh position={[0, stoneHeight / 2, d / 2]} castShadow receiveShadow>
              <boxGeometry args={[w + wallThick * 2, stoneHeight, wallThick]} />
              <meshStandardMaterial color="#64748b" roughness={0.88} />
            </mesh>
            {/* East & West border walls */}
            <mesh position={[-w / 2, stoneHeight / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[wallThick, stoneHeight, d]} />
              <meshStandardMaterial color="#64748b" roughness={0.88} />
            </mesh>
            <mesh position={[w / 2, stoneHeight / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[wallThick, stoneHeight, d]} />
              <meshStandardMaterial color="#64748b" roughness={0.88} />
            </mesh>
            {/* Raised organic mulch mound */}
            <mesh position={[0, stoneHeight * 0.45, 0]} castShadow receiveShadow>
              <boxGeometry args={[w * 0.96, stoneHeight * 0.8, d * 0.96]} />
              <meshStandardMaterial color="#2d1e12" roughness={0.95} />
            </mesh>
          </group>
        );
      }
    });

    return { stoneBorders: borders, mulchMounds: mounds };
  }, []);

  return (
    <group>
      {stoneBorders}
      {mulchMounds}
    </group>
  );
}

/**
 * Terraced Stone Retaining Walls circling the central plaza
 */
function PlazaRetainingWall() {
  const segments = useMemo(() => {
    const list: JSX.Element[] = [];
    const radius = GARDEN_CONFIG.structures.retainingWallRadius;
    const count = 32;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // Leave openings for the main radiating paths
      const deg = (angle * 180) / Math.PI;
      const isPathOpening = (deg > 340 || deg < 20) || (deg > 70 && deg < 110) || (deg > 160 && deg < 200) || (deg > 250 && deg < 290);
      if (isPathOpening) continue;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getGroundY(x, z);

      list.push(
        <mesh
          key={`wall-${i}`}
          position={[x, y + 0.35, z]}
          rotation={[0, -angle + Math.PI / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[2.2, 0.7, 0.38]} />
          <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>
      );
    }
    return list;
  }, []);

  return <group>{segments}</group>;
}

/**
 * Grand Timber Pergola & Floral Entrance Gate
 */
function EntrancePergola() {
  const [px, , pz] = GARDEN_CONFIG.structures.pergolaPosition;
  const py = getGroundY(px, pz);

  return (
    <group position={[px, py, pz]}>
      {/* 4 Sturdy timber columns */}
      {[-1.6, 1.6].map((x) =>
        [-0.9, 0.9].map((z) => (
          <mesh key={`post-${x}-${z}`} position={[x, 1.6, z]} castShadow receiveShadow>
            <boxGeometry args={[0.22, 3.2, 0.22]} />
            <meshStandardMaterial color="#451a03" roughness={0.8} />
          </mesh>
        ))
      )}

      {/* Longitudinal Support Beams */}
      {[-1.6, 1.6].map((x) => (
        <mesh key={`beam-long-${x}`} position={[x, 3.2, 0]} castShadow>
          <boxGeometry args={[0.24, 0.28, 2.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
      ))}

      {/* Transverse Cross Rafters */}
      {[-1.1, -0.55, 0, 0.55, 1.1].map((z, idx) => (
        <mesh key={`rafter-${idx}`} position={[0, 3.38, z]} castShadow>
          <boxGeometry args={[3.8, 0.18, 0.14]} />
          <meshStandardMaterial color="#78350f" roughness={0.78} />
        </mesh>
      ))}

      {/* Climbing Jasmine / Rose Vine on timber posts */}
      {[-1.6, 1.6].map((x) => (
        <group key={`vine-${x}`} position={[x, 1.5, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.28, 0.35, 2.8, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.7} />
          </mesh>
          {/* Subtle blossom flowers */}
          <mesh position={[0, 0.4, 0.15]}>
            <sphereGeometry args={[0.15, 6, 6]} />
            <meshStandardMaterial color="#f472b6" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Perimeter boundary fence / rustic hedgerow preventing walking off terrain
 */
function PerimeterFence() {
  const posts = useMemo(() => {
    const list: JSX.Element[] = [];
    const radius = GARDEN_CONFIG.camera.worldBounds;
    const count = 48;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getGroundY(x, z);

      list.push(
        <group key={`fence-${i}`} position={[x, y, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
          {/* Post */}
          <mesh position={[0, 0.65, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 1.3, 6]} />
            <meshStandardMaterial color="#57534e" roughness={0.9} />
          </mesh>
          {/* Rail */}
          <mesh position={[1.5, 0.7, 0]} castShadow>
            <boxGeometry args={[3.2, 0.08, 0.06]} />
            <meshStandardMaterial color="#78716c" roughness={0.9} />
          </mesh>
          <mesh position={[1.5, 0.35, 0]} castShadow>
            <boxGeometry args={[3.2, 0.08, 0.06]} />
            <meshStandardMaterial color="#78716c" roughness={0.9} />
          </mesh>
        </group>
      );
    }
    return list;
  }, []);

  return (
    <group>
      {posts}
      {/* Invisible boundary physics barrier */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh position={[0, 5, 0]} visible={false}>
          <cylinderGeometry args={[GARDEN_CONFIG.camera.worldBounds, GARDEN_CONFIG.camera.worldBounds, 12, 32, 1, true]} />
          <meshBasicMaterial side={THREE.DoubleSide} />
        </mesh>
      </RigidBody>
    </group>
  );
}

export function GardenStructures() {
  return (
    <group>
      <PlazaRetainingWall />
      <RaisedBedBorders />
      <EntrancePergola />
      <PerimeterFence />
    </group>
  );
}

