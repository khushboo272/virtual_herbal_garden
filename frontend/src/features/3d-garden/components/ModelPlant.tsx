// ──────────────────────────────────────────────────────────
// components/ModelPlant.tsx — Real GLB/GLTF Plant Model Loader
// Draco + meshopt decoders, URL versioning, normalization,
// LOD support, error boundary with fallback, disposal on unmount
// ──────────────────────────────────────────────────────────
import React, { Component, Suspense, useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Detailed } from '@react-three/drei';
import * as THREE from 'three';
import { GARDEN_CONFIG } from '../gardenConfig';
import type { IShowcasePlant } from '../types';
import { normalizeModel } from '../utils/normalizeModel';
import { ProceduralPlant } from './ProceduralPlant';
import { reportModelError } from '../api/gardenShowcaseApi';

// Session set to avoid duplicate error reports
const reportedPlants = new Set<string>();

interface ModelPlantProps {
  plant: IShowcasePlant;
  position: [number, number, number];
  rotationY?: number;
}

/**
 * Inner loader component for the GLB model
 */
function ModelLoaderInner({ plant, position, rotationY = 0 }: ModelPlantProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [growProgress, setGrowProgress] = useState(0);

  const versionedUrl = useMemo(() => {
    if (!plant.modelUrl) return '';
    const v = plant.modelVersion || 1;
    return plant.modelUrl.includes('?')
      ? `${plant.modelUrl}&v=${v}`
      : `${plant.modelUrl}?v=${v}`;
  }, [plant.modelUrl, plant.modelVersion]);

  const versionedLodUrl = useMemo(() => {
    if (!plant.lodUrl) return null;
    const v = plant.modelVersion || 1;
    return plant.lodUrl.includes('?')
      ? `${plant.lodUrl}&v=${v}`
      : `${plant.lodUrl}?v=${v}`;
  }, [plant.lodUrl, plant.modelVersion]);

  // Load primary GLB
  const gltf = useGLTF(versionedUrl);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // Normalize model
  const targetHeight =
    plant.modelTransform?.targetHeightM && plant.modelTransform.targetHeightM > 0
      ? plant.modelTransform.targetHeightM
      : plant.visual?.heightM || 1.0;

  useMemo(() => {
    normalizeModel(clonedScene, targetHeight, plant.modelTransform);
  }, [clonedScene, targetHeight, plant.modelTransform]);

  // Disposal on unmount
  useEffect(() => {
    return () => {
      clonedScene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (mesh.material) {
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            for (const m of mats) m.dispose();
          }
        }
      });
    };
  }, [clonedScene]);

  // Grow-in / crossfade animation
  useFrame((_, delta) => {
    if (growProgress < 1.0) {
      setGrowProgress((prev) => Math.min(1.0, prev + delta * 2.5));
    }
    if (groupRef.current) {
      const scale = THREE.MathUtils.lerp(0.01, 1.0, growProgress);
      groupRef.current.scale.set(scale, scale, scale);

      // Subtle wind sway
      const t = performance.now() * 0.001 * GARDEN_CONFIG.procedural.windSwaySpeed;
      const sway = GARDEN_CONFIG.procedural.windSwayStrength * 0.4;
      groupRef.current.rotation.z = Math.sin(t + position[0] * 0.5) * sway;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]}>
      {versionedLodUrl ? (
        <Detailed distances={[0, GARDEN_CONFIG.rendering.lodDistance]}>
          <primitive object={clonedScene} />
          <LodSubModel url={versionedLodUrl} targetHeight={targetHeight} />
        </Detailed>
      ) : (
        <primitive object={clonedScene} />
      )}
    </group>
  );
}

/**
 * Secondary LOD Model Loader
 */
function LodSubModel({ url, targetHeight }: { url: string; targetHeight: number }) {
  const gltf = useGLTF(url);
  const cloned = useMemo(() => {
    const s = gltf.scene.clone(true);
    normalizeModel(s, targetHeight);
    return s;
  }, [gltf.scene, targetHeight]);

  return <primitive object={cloned} />;
}

/**
 * Error boundary that catches GLTF loading/parsing errors,
 * reports them to backend, and gracefully falls back to ProceduralPlant.
 */
class ModelErrorBoundary extends Component<
  ModelPlantProps & { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: ModelPlantProps & { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    const plantId = this.props.plant.id;
    if (!reportedPlants.has(plantId)) {
      reportedPlants.add(plantId);
      const msg = error?.message || 'GLB load/parse failure';
      reportModelError(plantId, msg);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ProceduralPlant
          plant={this.props.plant}
          position={this.props.position}
          rotationY={this.props.rotationY}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * ModelPlant entrypoint with fallback & error handling
 */
export function ModelPlant(props: ModelPlantProps) {
  return (
    <ModelErrorBoundary {...props}>
      <Suspense
        fallback={
          <ProceduralPlant
            plant={props.plant}
            position={props.position}
            rotationY={props.rotationY}
          />
        }
      >
        <ModelLoaderInner {...props} />
      </Suspense>
    </ModelErrorBoundary>
  );
}

/**
 * Helper to preload nearest N models
 */
export function preloadPlantModels(plants: IShowcasePlant[], maxCount: number = 8): void {
  let loaded = 0;
  for (const plant of plants) {
    if (loaded >= maxCount) break;
    if (plant.modelUrl && plant.modelStatus !== 'FAILED') {
      const v = plant.modelVersion || 1;
      const url = plant.modelUrl.includes('?') ? `${plant.modelUrl}&v=${v}` : `${plant.modelUrl}?v=${v}`;
      useGLTF.preload(url);
      loaded++;
    }
  }
}

