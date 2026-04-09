// ─────────────────────────────────────────────────────
// Decorations.tsx — Ambient garden decorations
// Grass tufts, background trees, stones, flowers
// ─────────────────────────────────────────────────────
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Scattered grass tufts */
export function GrassTufts() {
  const instances = useMemo(() => {
    const arr: Array<{ pos: [number, number, number]; scale: number; rotation: number }> = [];
    for (let i = 0; i < 300; i++) {
      arr.push({
        pos: [
          (seededRandom(i * 7) - 0.5) * 70,
          0,
          (seededRandom(i * 13) - 0.5) * 70,
        ],
        scale: 0.3 + seededRandom(i * 3) * 0.5,
        rotation: seededRandom(i * 11) * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {instances.map((g, i) => (
        <mesh
          key={i}
          position={g.pos}
          rotation={[0, g.rotation, 0]}
          scale={g.scale}
        >
          <coneGeometry args={[0.12, 0.4, 4]} />
          <meshStandardMaterial
            color={`hsl(${100 + seededRandom(i) * 30}, 60%, ${25 + seededRandom(i * 5) * 15}%)`}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Background trees at garden edges */
export function BackgroundTrees() {
  const trees = useMemo(() => {
    const arr: Array<{ pos: [number, number, number]; scale: number; color: string }> = [];
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const r = 30 + seededRandom(i * 17) * 15;
      arr.push({
        pos: [Math.cos(angle) * r, 0, Math.sin(angle) * r],
        scale: 1.5 + seededRandom(i * 7) * 2,
        color: `hsl(${110 + seededRandom(i * 3) * 30}, ${50 + seededRandom(i) * 20}%, ${20 + seededRandom(i * 9) * 10}%)`,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={t.pos} scale={t.scale}>
          {/* Trunk */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, 3, 6]} />
            <meshStandardMaterial color="#5d4037" roughness={0.85} />
          </mesh>
          {/* Canopy */}
          <mesh position={[0, 3.5, 0]} castShadow>
            <icosahedronGeometry args={[1.2, 1]} />
            <meshStandardMaterial color={t.color} roughness={0.8} />
          </mesh>
          <mesh position={[0.4, 3, 0.3]} castShadow>
            <icosahedronGeometry args={[0.8, 1]} />
            <meshStandardMaterial color={t.color} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Small flowers scattered around */
export function Flowers() {
  const flowers = useMemo(() => {
    const colors = ["#e91e63", "#ff9800", "#ffeb3b", "#ce93d8", "#ef5350", "#ffa726"];
    const arr: Array<{ pos: [number, number, number]; color: string; scale: number }> = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        pos: [
          (seededRandom(i * 23) - 0.5) * 50,
          0.15,
          (seededRandom(i * 31) - 0.5) * 50,
        ],
        color: colors[Math.floor(seededRandom(i * 19) * colors.length)],
        scale: 0.08 + seededRandom(i * 37) * 0.08,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {flowers.map((f, i) => (
        <mesh key={i} position={f.pos} scale={f.scale}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshStandardMaterial color={f.color} roughness={0.6} emissive={f.color} emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/** Garden path (flat curved ribbon) */
export function GardenPath() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-15, 0.03, 20),
      new THREE.Vector3(-5, 0.03, 10),
      new THREE.Vector3(0, 0.03, 5),
      new THREE.Vector3(5, 0.03, 0),
      new THREE.Vector3(10, 0.03, -5),
      new THREE.Vector3(5, 0.03, -12),
      new THREE.Vector3(-5, 0.03, -15),
    ]);
    const pts = curve.getPoints(60);

    const shape = new THREE.Shape();
    shape.moveTo(-0.6, 0);
    shape.lineTo(0.6, 0);

    const geo = new THREE.ExtrudeGeometry(shape, {
      steps: 60,
      bevelEnabled: false,
      extrudePath: curve,
    });
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#a1887f" roughness={0.95} />
    </mesh>
  );
}

/** Stones scattered along path */
export function Stones() {
  const stones = useMemo(() => {
    const arr: Array<{ pos: [number, number, number]; scale: [number, number, number]; rotation: number }> = [];
    for (let i = 0; i < 20; i++) {
      arr.push({
        pos: [
          (seededRandom(i * 41) - 0.5) * 40,
          0.05,
          (seededRandom(i * 47) - 0.5) * 40,
        ],
        scale: [
          0.15 + seededRandom(i * 53) * 0.2,
          0.1 + seededRandom(i * 59) * 0.1,
          0.15 + seededRandom(i * 61) * 0.2,
        ],
        rotation: seededRandom(i * 67) * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {stones.map((s, i) => (
        <mesh key={i} position={s.pos} scale={s.scale} rotation={[0, s.rotation, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={`hsl(30, 10%, ${40 + seededRandom(i) * 20}%)`}
            roughness={0.95}
          />
        </mesh>
      ))}
    </group>
  );
}
