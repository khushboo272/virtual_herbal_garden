// ─────────────────────────────────────────────────────
// Plant3D.tsx — AAA-quality individual plant in the garden
// Multi-branch trunk, layered canopy, wind system,
// enhanced hover/click, particle effects
// ─────────────────────────────────────────────────────
import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Plant } from "../../../lib/types";

interface Plant3DProps {
  plant: Plant;
  onClick: (plant: Plant) => void;
}

// Deterministic colour from plant name
function plantColor(name: string): string {
  const colors = [
    "#2e7d32", "#388e3c", "#43a047", "#66bb6a",
    "#1b5e20", "#4caf50", "#81c784", "#558b2f",
    "#33691e", "#689f38",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Derive secondary/tertiary colors from base
function deriveColors(base: string) {
  const c = new THREE.Color(base);
  const darker = c.clone().multiplyScalar(0.7);
  const lighter = c.clone().lerp(new THREE.Color("#a5d6a7"), 0.35);
  return {
    base,
    darker: `#${darker.getHexString()}`,
    lighter: `#${lighter.getHexString()}`,
  };
}

export function Plant3D({ plant, onClick }: Plant3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const pos = plant.placement3d?.position ?? { x: 0, y: 0, z: 0 };
  const scale = plant.placement3d?.scale ?? 1;
  const { base, darker, lighter } = useMemo(
    () => deriveColors(plantColor(plant.commonName)),
    [plant.commonName],
  );

  // Smoothed hover scale
  const currentScale = useRef(scale);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // Multi-frequency wind sway
    const sway1 = Math.sin(t * 0.6 + pos.x * 0.3) * 0.025;
    const sway2 = Math.sin(t * 1.2 + pos.z * 0.5) * 0.012;
    const sway3 = Math.cos(t * 0.4 + pos.x + pos.z) * 0.015;
    groupRef.current.rotation.z = sway1 + sway2;
    groupRef.current.rotation.x = sway3;

    // Smooth scale lerp for hover
    const targetScale = hovered ? scale * 1.12 : scale;
    currentScale.current += (targetScale - currentScale.current) * 0.1;
    groupRef.current.scale.setScalar(currentScale.current);
  });

  const emissiveColor = hovered ? base : "#000000";
  const emissiveIntensity = hovered ? 0.35 : 0;

  return (
    <group
      ref={groupRef}
      position={[pos.x, pos.y, pos.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(plant);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {/* ── Root system ── */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.3;
        return (
          <mesh
            key={`root-${i}`}
            position={[Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15]}
            rotation={[0.3, a, 0.5]}
          >
            <cylinderGeometry args={[0.02, 0.04, 0.25, 4]} />
            <meshStandardMaterial color="#4e3a2a" roughness={0.9} />
          </mesh>
        );
      })}

      {/* ── Main trunk ── */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.12, 1.2, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.85} />
      </mesh>

      {/* ── Branch 1 ── */}
      <mesh position={[0.15, 1.0, 0.05]} rotation={[0.1, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.5, 5]} />
        <meshStandardMaterial color="#5d4037" roughness={0.85} />
      </mesh>

      {/* ── Branch 2 ── */}
      <mesh position={[-0.12, 0.9, -0.08]} rotation={[-0.15, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.02, 0.035, 0.45, 5]} />
        <meshStandardMaterial color="#5d4037" roughness={0.85} />
      </mesh>

      {/* ── Main canopy (large) ── */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <dodecahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial
          color={base}
          roughness={0.65}
          metalness={0.02}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* ── Secondary canopy layers ── */}
      <mesh position={[0.35, 1.3, 0.2]} castShadow>
        <dodecahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial
          color={darker}
          roughness={0.7}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.7}
        />
      </mesh>
      <mesh position={[-0.28, 1.4, -0.18]} castShadow>
        <dodecahedronGeometry args={[0.38, 1]} />
        <meshStandardMaterial
          color={lighter}
          roughness={0.72}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.7}
        />
      </mesh>
      <mesh position={[0.1, 1.85, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.32, 1]} />
        <meshStandardMaterial
          color={base}
          roughness={0.68}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.5}
        />
      </mesh>

      {/* ── Small leaf clusters ── */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        const r = 0.5 + seededRandom(pos.x + i * 7) * 0.2;
        return (
          <mesh
            key={`leaf-${i}`}
            position={[Math.cos(a) * r, 1.2 + seededRandom(i * 13) * 0.5, Math.sin(a) * r]}
            castShadow
          >
            <dodecahedronGeometry args={[0.18, 0]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? darker : lighter}
              roughness={0.75}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity * 0.4}
            />
          </mesh>
        );
      })}

      {/* ── Hover glow ring ── */}
      {hovered && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.2, 32]} />
          <meshBasicMaterial
            color="#ffd54f"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ── Hover particle dots ── */}
      {hovered && <FloatingParticles />}

      {/* ── Name plate ── */}
      <NamePlate name={plant.commonName} hovered={hovered} />
    </group>
  );
}

/* ── Floating leaf particles on hover ─────────────── */

function FloatingParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    const arr: Array<{ offset: number; speed: number; radius: number }> = [];
    for (let i = 0; i < 6; i++) {
      arr.push({
        offset: (i / 6) * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        radius: 0.5 + Math.random() * 0.4,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i];
      child.position.x = Math.cos(t * p.speed + p.offset) * p.radius;
      child.position.y = 1.0 + Math.sin(t * p.speed * 1.5 + p.offset) * 0.5 + 0.5;
      child.position.z = Math.sin(t * p.speed + p.offset) * p.radius;
    });
  });

  return (
    <group ref={groupRef}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.03, 4, 3]} />
          <meshBasicMaterial
            color="#a5d6a7"
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ── Canvas-texture name plate ────────────────────── */

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function NamePlate({ name, hovered }: { name: string; hovered: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 64);

    // Background
    ctx.fillStyle = hovered ? "rgba(255, 238, 88, 0.92)" : "rgba(255, 255, 255, 0.88)";
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.fill();

    // Border
    ctx.strokeStyle = hovered ? "#fdd835" : "#81c784";
    ctx.lineWidth = 2;
    ctx.roundRect(4, 4, 248, 56, 12);
    ctx.stroke();

    // Text
    ctx.fillStyle = hovered ? "#1b5e20" : "#2e7d32";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, 128, 32, 240);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [name, hovered]);

  return (
    <sprite position={[0, 2.5, 0]} scale={[2, 0.5, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}
