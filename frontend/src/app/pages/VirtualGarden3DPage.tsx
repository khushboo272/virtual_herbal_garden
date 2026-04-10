// ─────────────────────────────────────────────────────
// VirtualGarden3DPage.tsx — Full immersive 3D garden
// Combines Canvas, Scene, Controls, Plants, Overlays
// Enhanced with Suspense, audio state, AAA rendering
// ─────────────────────────────────────────────────────
import { useState, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

// 3D components
import { Scene } from "../components/3d/Scene";
import { Controls } from "../components/3d/Controls";
import { River } from "../components/3d/River";
import { Birds } from "../components/3d/Bird";
import { Plant3D } from "../components/3d/Plant3D";
import { GrassTufts, BackgroundTrees, Flowers, GardenPath, Stones, Mushrooms } from "../components/3d/Decorations";
import { MinimapPlayerTracker, MinimapOverlay } from "../components/3d/Minimap";
import { AmbientAudio } from "../components/3d/AmbientAudio";

// UI overlays
import { HUD } from "../components/3d/HUD";
import { PlantInfoPanel } from "../components/3d/PlantInfoPanel";

// Hooks
import { usePlants } from "../../hooks/usePlants";
import type { Plant } from "../../lib/types";

/* ── Loading fallback inside Canvas ───────────────── */

function SceneLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#81c784" wireframe />
    </mesh>
  );
}

export function VirtualGarden3DPage() {
  const { plants } = usePlants({ limit: 50 });
  const [isLocked, setIsLocked] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const handlePlantClick = (plant: Plant) => {
    setSelectedPlant(plant);
    document.exitPointerLock?.();
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: "#1a1a2e" }}>
      {/* WebGL Canvas — AAA rendering config */}
      <Canvas
        shadows
        camera={{ fov: 65, near: 0.1, far: 200, position: [0, 2, 20] }}
        style={{ position: "absolute", inset: 0 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.75,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#b0c8d8"), 1);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={<SceneLoader />}>
          {/* Scene — lighting, sky, ground */}
          <Scene />
          <River />
          <Birds />

          {/* Decorations */}
          <GrassTufts />
          <BackgroundTrees />
          <Flowers />
          <GardenPath />
          <Stones />
          <Mushrooms />

          {/* Plants from API */}
          {plants.map((plant) => (
            <Plant3D
              key={plant._id}
              plant={plant}
              onClick={handlePlantClick}
            />
          ))}

          {/* Audio system */}
          <AmbientAudio enabled={audioEnabled} />

          {/* Controls */}
          <Controls
            enabled={!selectedPlant}
            onLock={() => setIsLocked(true)}
            onUnlock={() => setIsLocked(false)}
          />

          {/* Minimap player tracker (inside canvas) */}
          <MinimapPlayerTracker />
        </Suspense>
      </Canvas>

      {/* HUD overlays */}
      <HUD
        isLocked={isLocked}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        plantCount={plants.length}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
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
