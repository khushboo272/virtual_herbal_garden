// ─────────────────────────────────────────────────────
// Garden3DScene.tsx — AAA-quality 3D garden Canvas wrapper
// Photorealistic lighting, PBR terrain, HDRI environment,
// atmospheric effects, post-processing
// ─────────────────────────────────────────────────────
import { Suspense, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import type { Plant as FullPlant } from '../lib/types';

import { RealisticGround } from './garden/RealisticGround';
import { PersonalizedZone } from './garden/PersonalizedZone';
import { River } from './garden/River';
import { GardenPath } from './garden/Path';
import { Plant } from './garden/Plant';
import { Rocks } from './garden/Rocks';
import { GrassField } from './garden/GrassField';
import { Flowers } from './garden/Flowers';
import { Birds } from './garden/Birds';
import { AudioSystem } from './garden/AudioSystem';
import { Loader } from './garden/Loader';
import { Controls } from '../app/components/3d/Controls';
import { MinimapPlayerTracker } from '../app/components/3d/Minimap';
import { PostProcessingStack } from './garden/PostProcessingStack';
import { useMediaQuery } from '../hooks/useMediaQuery';

// New dynamic systems
import { windSystem } from './garden/WindSystem';
import { DayNightSystem } from './garden/DayNightSystem';
import { ProceduralCloudSystem } from './garden/ProceduralCloudSystem';
import { NightElements } from './garden/NightElements';

/* ── Types ────────────────────────────────────────── */

export interface ScenePlant {
  id: string;
  name: string;
  position: [number, number, number];
  modelUrl: string | null;
  scale: number;
  color: string;
}

interface Garden3DSceneProps {
  plants: ScenePlant[];
  onPlantSelect: (plant: ScenePlant) => void;
  selectedPlant?: FullPlant | null;
  cameraMode?: 'fps' | 'orbit';
  ghostPosition?: [number, number, number] | null;
  audioEnabled?: boolean;
  isLocked?: boolean;
  onLock?: () => void;
  onUnlock?: () => void;
  onGroundMove?: (position: [number, number, number]) => void;
  onGroundClick?: (position: [number, number, number]) => void;
  isFullGardenView?: boolean;
}

/* ── Scene Loader Fallback ────────────────────────── */

function SceneLoader() {
  return (
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshBasicMaterial color="#81c784" wireframe />
    </mesh>
  );
}

/* ── Global Updaters ────────────────────────── */
function GlobalUpdaters() {
  useFrame(({ clock }) => {
    windSystem.update(clock.getElapsedTime());
  });
  return null;
}

/* ── Main Garden3DScene ───────────────────────────── */

export default function Garden3DScene({ plants, onPlantSelect, selectedPlant, cameraMode = 'fps', ghostPosition, audioEnabled = false, isLocked = false, onLock, onUnlock, onGroundMove, onGroundClick, isFullGardenView }: Garden3DSceneProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const qualityTier = isMobile ? 'low' : 'high';

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 2, 12], fov: 65, near: 0.1, far: 500 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={isMobile ? [1, 1] : [1, 1.5]}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={<SceneLoader />}>
          <GlobalUpdaters />
          
          <DayNightSystem />
          <ProceduralCloudSystem />
          <NightElements />

          <Physics gravity={[0, -9.81, 0]}>
            {/* ── Terrain ── */}
            <RealisticGround 
              onPointerMove={(e) => {
                if (onGroundMove) {
                  e.stopPropagation();
                  onGroundMove([e.point.x, e.point.y, e.point.z]);
                }
              }}
              onClick={(e) => {
                if (onGroundClick) {
                  e.stopPropagation();
                  onGroundClick([e.point.x, e.point.y, e.point.z]);
                }
              }}
            />
            <PersonalizedZone />
            <River />
            <GardenPath />

            {/* ── Plants from API ── */}
            {plants.map((plant) => (
              <Plant key={plant.id} plant={plant} onSelect={onPlantSelect} />
            ))}

            {/* ── Environment details ── */}
            <Suspense fallback={null}>
              <Rocks />
              <GrassField />
              <Flowers />
            </Suspense>

            {/* ── Placement Ghost ── */}
            {ghostPosition && (
              <group position={ghostPosition}>
                <mesh position={[0, 0.5, 0]}>
                  <cylinderGeometry args={[0.2, 0.2, 1, 16]} />
                  <meshBasicMaterial color="#ffeb3b" transparent opacity={0.6} wireframe />
                </mesh>
                <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.5, 0.8, 32]} />
                  <meshBasicMaterial color="#ffeb3b" transparent opacity={0.8} />
                </mesh>
              </group>
            )}
          </Physics>

          {/* ── Birds ── */}
          <Birds />

          {/* ── Audio ── */}
          {audioEnabled && (
            <Suspense fallback={null}>
              <AudioSystem />
            </Suspense>
          )}

          {/* ── Controls & Minimap Tracker ── */}
          <Controls 
            enabled={!isLocked} 
            selectedPlant={selectedPlant}
            mode={cameraMode}
            onLock={onLock} 
            onUnlock={onUnlock} 
            isFullGardenView={isFullGardenView}
          />
          <MinimapPlayerTracker />

          {/* ── Post-Processing ── */}
          <PostProcessingStack quality={qualityTier} />
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      <Loader />
    </>
  );
}
