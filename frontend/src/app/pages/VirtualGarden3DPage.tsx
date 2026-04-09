// ─────────────────────────────────────────────────────
// VirtualGarden3DPage.tsx — Full immersive 3D garden
// Combines Canvas, Scene, Controls, Plants, Overlays
// ─────────────────────────────────────────────────────
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

// 3D components
import { Scene } from "../components/3d/Scene";
import { Controls } from "../components/3d/Controls";
import { River } from "../components/3d/River";
import { Birds } from "../components/3d/Bird";
import { Plant3D } from "../components/3d/Plant3D";
import { GrassTufts, BackgroundTrees, Flowers, GardenPath, Stones } from "../components/3d/Decorations";
import { MinimapPlayerTracker, MinimapOverlay } from "../components/3d/Minimap";

// UI overlays
import { HUD } from "../components/3d/HUD";
import { PlantInfoPanel } from "../components/3d/PlantInfoPanel";

// Hooks
import { usePlants } from "../../hooks/usePlants";
import type { Plant } from "../../lib/types";

export function VirtualGarden3DPage() {
  const { plants } = usePlants({ limit: 50 });
  const [isLocked, setIsLocked] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const handlePlantClick = (plant: Plant) => {
    setSelectedPlant(plant);
    document.exitPointerLock?.();
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#1a1a2e" }}>
      {/* WebGL Canvas */}
      <Canvas
        shadows
        camera={{ fov: 65, near: 0.1, far: 200, position: [0, 2, 20] }}
        style={{ position: "absolute", inset: 0 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        onCreated={({ gl }) => {
          // Sky-blue clear color so we always see something
          gl.setClearColor(new THREE.Color("#87CEEB"), 1);
        }}
      >
        {/* Scene — lighting, sky, ground (zero network deps) */}
        <Scene />
        <River />
        <Birds />

        {/* Decorations */}
        <GrassTufts />
        <BackgroundTrees />
        <Flowers />
        <GardenPath />
        <Stones />

        {/* Plants from API */}
        {plants.map((plant) => (
          <Plant3D
            key={plant._id}
            plant={plant}
            onClick={handlePlantClick}
          />
        ))}

        {/* Controls */}
        <Controls
          enabled={!selectedPlant}
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
        />

        {/* Minimap player tracker (inside canvas) */}
        <MinimapPlayerTracker />
      </Canvas>

      {/* HUD overlays */}
      <HUD
        isLocked={isLocked}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        plantCount={plants.length}
      />

      {/* Minimap */}
      <MinimapOverlay plants={plants} visible={showMinimap && !selectedPlant} />

      {/* Plant info side panel */}
      <PlantInfoPanel
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
      />
    </div>
  );
}
