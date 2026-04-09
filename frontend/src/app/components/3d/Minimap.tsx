// ─────────────────────────────────────────────────────
// Minimap.tsx — 2D overhead minimap of the garden
// ─────────────────────────────────────────────────────
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Plant } from "../../../lib/types";

interface MinimapProps {
  plants: Plant[];
  visible: boolean;
}

const MAP_SIZE = 160;
const WORLD_SIZE = 40; // half-extent of garden

function worldToMinimap(x: number, z: number): { left: number; top: number } {
  return {
    left: ((x + WORLD_SIZE) / (WORLD_SIZE * 2)) * MAP_SIZE,
    top: ((z + WORLD_SIZE) / (WORLD_SIZE * 2)) * MAP_SIZE,
  };
}

/**
 * MinimapOverlay is an HTML component rendered inside <Canvas> via <Html>
 * but offset to bottom-right. We instead render it as a plain React
 * component outside the Canvas.
 */
export function MinimapOverlay({ plants, visible }: MinimapProps) {
  const playerRef = useRef<HTMLDivElement>(null);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: MAP_SIZE,
        height: MAP_SIZE,
        background: "rgba(27, 94, 32, 0.85)",
        borderRadius: 16,
        border: "2px solid rgba(129,199,132,0.6)",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      {/* Grid lines */}
      <svg
        width={MAP_SIZE}
        height={MAP_SIZE}
        style={{ position: "absolute", top: 0, left: 0, opacity: 0.15 }}
      >
        {[...Array(8)].map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={(i * MAP_SIZE) / 8}
            x2={MAP_SIZE}
            y2={(i * MAP_SIZE) / 8}
            stroke="white"
            strokeWidth={0.5}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <line
            key={`v${i}`}
            x1={(i * MAP_SIZE) / 8}
            y1={0}
            x2={(i * MAP_SIZE) / 8}
            y2={MAP_SIZE}
            stroke="white"
            strokeWidth={0.5}
          />
        ))}
      </svg>

      {/* River indicator */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: "100%",
          height: 4,
          background: "rgba(100, 181, 246, 0.6)",
          top: worldToMinimap(0, 25).top,
        }}
      />

      {/* Plant dots */}
      {plants.map((plant) => {
        const p = plant.placement3d?.position;
        if (!p) return null;
        const { left, top } = worldToMinimap(p.x, p.z);
        return (
          <div
            key={plant._id}
            title={plant.commonName}
            style={{
              position: "absolute",
              left: left - 4,
              top: top - 4,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#81c784",
              border: "1.5px solid #fff",
              boxShadow: "0 0 6px rgba(129,199,132,0.8)",
            }}
          />
        );
      })}

      {/* Player dot — will be updated by GardenPlayerDot */}
      <div
        ref={playerRef}
        id="minimap-player"
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#ffd54f",
          border: "2px solid #fff",
          boxShadow: "0 0 8px rgba(255,213,79,0.9)",
          transform: "translate(-50%, -50%)",
          left: MAP_SIZE / 2,
          top: MAP_SIZE / 2,
          zIndex: 2,
          transition: "left 0.1s, top 0.1s",
        }}
      />

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 4,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 9,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
      >
        Garden Map
      </div>
    </div>
  );
}

/**
 * Place this component INSIDE <Canvas> to drive the minimap player dot position.
 */
export function MinimapPlayerTracker() {
  const { camera } = useThree();

  useFrame(() => {
    const el = document.getElementById("minimap-player");
    if (!el) return;
    const left = ((camera.position.x + WORLD_SIZE) / (WORLD_SIZE * 2)) * MAP_SIZE;
    const top = ((camera.position.z + WORLD_SIZE) / (WORLD_SIZE * 2)) * MAP_SIZE;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  });

  return null;
}
