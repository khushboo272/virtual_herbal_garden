// ─────────────────────────────────────────────────────
// Plant3D.tsx — Individual plant in the 3D garden
// Procedural placeholder (trunk + canopy) with hover/click
// Uses only @react-three/fiber — no drei to avoid woff2 crash
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

export function Plant3D({ plant, onClick }: Plant3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const pos = plant.placement3d?.position ?? { x: 0, y: 0, z: 0 };
  const scale = plant.placement3d?.scale ?? 1;
  const color = useMemo(() => plantColor(plant.commonName), [plant.commonName]);

  // Gentle idle sway
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.rotation.z = Math.sin(t * 0.5 + pos.x) * 0.02;
      groupRef.current.rotation.x = Math.cos(t * 0.4 + pos.z) * 0.02;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[pos.x, pos.y, pos.z]}
      scale={hovered ? scale * 1.15 : scale}
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
      {/* Trunk */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 1.2, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>

      {/* Main canopy (sphere) */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <dodecahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.7}
          metalness={0.05}
          emissive={hovered ? color : "#000000"}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Secondary foliage */}
      <mesh position={[0.3, 1.2, 0.2]} castShadow>
        <dodecahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      <mesh position={[-0.25, 1.3, -0.15]} castShadow>
        <dodecahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>

      {/* Glow ring on hover */}
      {hovered && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.1, 32]} />
          <meshBasicMaterial
            color="#ffd54f"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Name plate — sprite with canvas texture */}
      <NamePlate name={plant.commonName} hovered={hovered} />
    </group>
  );
}

/** Canvas-texture name plate that doesn't depend on drei */
function NamePlate({ name, hovered }: { name: string; hovered: boolean }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 64);

    // Background
    ctx.fillStyle = hovered ? "rgba(255, 238, 88, 0.9)" : "rgba(255, 255, 255, 0.85)";
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
    <sprite position={[0, 2.4, 0]} scale={[2, 0.5, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} />
    </sprite>
  );
}
