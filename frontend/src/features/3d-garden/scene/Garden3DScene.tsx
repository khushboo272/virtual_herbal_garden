// ──────────────────────────────────────────────────────────
// scene/Garden3DScene.tsx — Photorealistic Landscaped 3D Botanical Sanctuary
// Terraces, curved paths, stone walls, pond & waterfall, soft diurnal light, quality tiers
// ──────────────────────────────────────────────────────────
import { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import {
  GARDEN_CONFIG,
  GARDEN_QUALITY_TIERS,
  type QualityTierConfig,
  type GardenZoneConfig,
} from '../gardenConfig';
import type { PlacedShowcasePlant, SceneMetrics } from '../types';

// Landscaped Environments & Systems
import { GardenTerrain } from '../components/GardenTerrain';
import { GardenStructures } from '../components/GardenStructures';
import { InstancedGrass } from '../components/InstancedGrass';
import { GardenPond } from '../components/GardenPond';
import { DecorativeTrees } from '../components/DecorativeTrees';
import { FillerPlanting } from '../components/FillerPlanting';
import { GardenProps } from '../components/GardenProps';
import { GardenAtmosphere } from './GardenAtmosphere';
import { GardenPostProcessing } from './GardenPostProcessing';
import { GardenControls } from '../components/GardenControls';

// Plant Pipeline & Monitoring
import { PlantInstance } from '../components/PlantInstance';
import { SceneMetricsCollector } from '../components/DebugOverlay';
import { preloadPlantModels } from '../components/ModelPlant';

// Wildlife & Audio
import { Birds } from '../../../components/garden/Birds';
import { AudioSystem } from '../../../components/garden/AudioSystem';
import { Loader } from '../../../components/garden/Loader';

export interface Garden3DSceneProps {
  plants: PlacedShowcasePlant[];
  onPlantSelect: (plant: PlacedShowcasePlant) => void;
  selectedPlant?: PlacedShowcasePlant | null;
  cameraMode?: 'fps' | 'orbit';
  ghostPosition?: [number, number, number] | null;
  audioEnabled?: boolean;
  audioVolume?: number;
  isLocked?: boolean;
  onLock?: () => void;
  onUnlock?: () => void;
  onGroundMove?: (position: [number, number, number]) => void;
  onGroundClick?: (position: [number, number, number]) => void;
  isFullGardenView?: boolean;
  onMetricsUpdate?: (metrics: Partial<SceneMetrics>) => void;

  // Visual Overhaul & Graphics Settings (G2)
  quality?: QualityTierConfig;
  timeOfDayHours?: number;
  isPhotoMode?: boolean;
  reducedMotion?: boolean;
  showLabels?: boolean;
  teleportTarget?: [number, number, number] | null;
  onTeleportComplete?: () => void;
  onPlayerMove?: (position: [number, number, number], headingRad: number) => void;
}

function SceneLoaderFallback() {
  return (
    <mesh position={[0, 1, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#10b981" wireframe />
    </mesh>
  );
}

/**
 * Botanical Zone Signs placed at each bed entrance with crisp Billboard Text
 */
function BotanicalZoneSigns({ zones }: { zones: readonly GardenZoneConfig[] }) {
  return (
    <group>
      {zones.map((zone) => (
        <group key={zone.id} position={zone.signPosition}>
          {/* Post */}
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 0.8, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.85} />
          </mesh>
          {/* Plaque */}
          <mesh position={[0, 0.82, 0]} rotation={[-0.2, 0, 0]} castShadow>
            <boxGeometry args={[1.6, 0.38, 0.04]} />
            <meshStandardMaterial color="#0f172a" roughness={0.7} />
          </mesh>
          {/* Sign Border Accent */}
          <mesh position={[0, 0.82, 0.022]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[1.56, 0.34, 0.005]} />
            <meshBasicMaterial color={zone.themeColor} />
          </mesh>
          {/* Text */}
          <Billboard position={[0, 0.83, 0.035]}>
            <Text
              fontSize={0.11}
              color="#f8fafc"
              anchorX="center"
              anchorY="middle"
              maxWidth={1.5}
            >
              {zone.label}
            </Text>
          </Billboard>
        </group>
      ))}
    </group>
  );
}

export function Garden3DScene({
  plants,
  onPlantSelect,
  selectedPlant,
  cameraMode = 'fps',
  ghostPosition,
  audioEnabled = false,
  audioVolume = 0.7,
  isLocked = false,
  onLock,
  onUnlock,
  onGroundMove,
  onGroundClick,
  isFullGardenView = false,
  onMetricsUpdate,
  quality = GARDEN_QUALITY_TIERS['MEDIUM'],
  timeOfDayHours = 12.0,
  isPhotoMode = false,
  reducedMotion = false,
  showLabels = true,
  teleportTarget,
  onTeleportComplete,
  onPlayerMove,
}: Garden3DSceneProps) {
  // Preload any GLB models present in the showcase plants
  useEffect(() => {
    preloadPlantModels(plants);
  }, [plants]);

  const handleTerrainPointerMove = (e: any) => {
    if (onGroundMove && e.point) {
      onGroundMove([e.point.x, e.point.y, e.point.z]);
    }
  };

  const handleTerrainClick = (e: any) => {
    if (onGroundClick && e.point) {
      onGroundClick([e.point.x, e.point.y, e.point.z]);
    }
  };

  const activeCameraMode = isFullGardenView ? 'orbit' : cameraMode;

  return (
    <>
      <Canvas
        camera={{
          position: GARDEN_CONFIG.camera.initialPosition,
          fov: GARDEN_CONFIG.camera.fov,
          near: GARDEN_CONFIG.camera.near,
          far: GARDEN_CONFIG.camera.far,
        }}
        dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, quality.dpr)}
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: GARDEN_CONFIG.atmosphere.toneMappingExposure,
          preserveDrawingBuffer: true, // Required for photo mode PNG capture
        }}
        shadows={quality.shadows ? { type: THREE.PCFSoftShadowMap } : false}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Suspense fallback={<SceneLoaderFallback />}>
          {/* Diurnal Sky, Soft Directional Sun, Procedural Lightformers & Stars */}
          <GardenAtmosphere
            timeOfDayHours={timeOfDayHours}
            shadowsEnabled={quality.shadows}
            shadowMapSize={quality.shadowMapSize}
            shadowDistance={quality.shadowDistance}
          />

          <Physics gravity={[0, -9.81, 0]}>
            {/* Rolling Heightmapped Ground with Zone & Path Blending */}
            <GardenTerrain
              onPointerMove={handleTerrainPointerMove}
              onClick={handleTerrainClick}
            />

            {/* Landscaped Architectural Elements: Retaining Walls, Pergola, Bed Kerbs, Fence */}
            <GardenStructures />

            {/* Water Sanctuary: Procedural Water Shader Pond & Waterfall */}
            <GardenPond reducedMotion={reducedMotion} />
          </Physics>

          {/* Masked Instanced Meadow Grass */}
          <InstancedGrass
            density={quality.grassDensity}
            reducedMotion={reducedMotion}
          />

          {/* Botanical Trees (Willow, Cherry, Pine, Oak) Replacing Blobs */}
          <DecorativeTrees count={quality.treeCount} />

          {/* Ornamental Filler Planting (Hydrangeas, Lavender, Ornamental Grasses) */}
          <FillerPlanting count={quality.fillerCount} />

          {/* High-Detail Garden Props (Teak Benches, Birdbath, Stepping Stones, Wildlife) */}
          <GardenProps reducedMotion={reducedMotion} />

          {/* Curated Botanical Zone Entrance Signs */}
          <BotanicalZoneSigns zones={GARDEN_CONFIG.zones} />

          {/* Placed Database Medicinal Plants (Real Models or Procedural botanical specimens) */}
          <group name="ShowcasePlants">
            {plants.map((plant) => (
              <PlantInstance
                key={plant.id}
                plant={plant}
                isSelected={selectedPlant?.id === plant.id}
                onSelect={onPlantSelect}
                showLabels={showLabels}
              />
            ))}
          </group>

          {/* Placement Mode Ghost Indicator */}
          {ghostPosition && (
            <mesh position={ghostPosition}>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color="#10b981" transparent opacity={0.6} wireframe />
            </mesh>
          )}

          {/* Garden Navigation & Collision Controls */}
          <GardenControls
            enabled={!isLocked}
            mode={activeCameraMode}
            onLock={onLock}
            onUnlock={onUnlock}
            teleportTarget={teleportTarget}
            onTeleportComplete={onTeleportComplete}
            onPlayerMove={onPlayerMove}
          />

          {/* Ambient Birds */}
          <Birds />

          {/* Clean Post-Processing Chain (SMAA, Subtle Bloom, N8AO, DOF in Photo Mode) */}
          <GardenPostProcessing
            quality={quality}
            isPhotoMode={isPhotoMode}
            enabled={true}
          />

          {/* Debug & Performance Metrics Collector */}
          <SceneMetricsCollector plants={plants} onMetricsUpdate={onMetricsUpdate} />

          {/* 3D Positional & Procedural Audio System (INSIDE Canvas) */}
          <AudioSystem
            isAudioEnabled={audioEnabled}
            isNight={timeOfDayHours < 5.5 || timeOfDayHours > 19.5}
            volume={audioVolume}
          />
        </Suspense>
      </Canvas>

      {/* HTML Scene Loading Progress Screen */}
      <Loader />
    </>
  );
}
