// ─────────────────────────────────────────────────────
// Garden3DScene.tsx — AAA-quality 3D garden Canvas wrapper
// Photorealistic lighting, PBR terrain, HDRI environment,
// atmospheric effects, post-processing
// ─────────────────────────────────────────────────────
import { Suspense, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Environment, Billboard, Text } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';

// Garden sub-components
import { RealisticGround } from './garden/RealisticGround';
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
  audioEnabled?: boolean;
  isLocked?: boolean;
  onLock?: () => void;
  onUnlock?: () => void;
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

/* ── Main Garden3DScene ───────────────────────────── */

export default function Garden3DScene({ plants, onPlantSelect, audioEnabled = false, isLocked = false, onLock, onUnlock }: Garden3DSceneProps) {
  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 2, 12], fov: 65, near: 0.1, far: 300 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%' }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Suspense fallback={<SceneLoader />}>
          {/* ── Lighting ── */}

          {/* Low ambient so shadows read properly */}
          <ambientLight intensity={0.3} />

          {/* Sun — warm, directional, with high-res shadow map */}
          <directionalLight
            position={[50, 80, 30]}
            intensity={2.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-far={200}
            shadow-camera-left={-60}
            shadow-camera-right={60}
            shadow-camera-top={60}
            shadow-camera-bottom={-60}
            shadow-bias={-0.0001}
          />

          {/* Sky/ground hemisphere for natural color bleed */}
          <hemisphereLight
            args={['#87ceeb', '#2d5a1a', 0.4]}
          />

          {/* ── Atmosphere ── */}

          {/* Physical sun sky dome */}
          <Sky
            distance={450000}
            sunPosition={[1, 0.3, 0]}
            inclination={0.49}
            azimuth={0.25}
            turbidity={8}
            rayleigh={0.5}
          />

          {/* Atmospheric perspective fog */}
          <fog attach="fog" args={['#c8dff0', 60, 200]} />

          {/* HDRI environment — falls back to preset if file not found */}
          <Environment
            preset="forest"
            background={false}
          />

          {/* ── Terrain ── */}
          <RealisticGround />
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
            onLock={onLock} 
            onUnlock={onUnlock} 
          />
          <MinimapPlayerTracker />

          {/* ── Post-Processing ── */}
          <EffectComposer>
            <Bloom
              luminanceThreshold={0.9}
              luminanceSmoothing={0.9}
              intensity={0.4}
            />
            <SMAA />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Loading overlay */}
      <Loader />
    </>
  );
}
