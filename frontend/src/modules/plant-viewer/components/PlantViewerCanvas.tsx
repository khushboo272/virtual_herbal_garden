import React, { Suspense, useRef, useEffect, useState, useMemo, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useProgress, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { LibraryPlant } from '../../../features/library/types/library.types';
import type { ViewerControlsState, PartMeshAnchor, ViewPreset } from '../types';
import { PlantModel } from './PlantModel';
import { ProceduralPlantViewer } from './ProceduralPlantViewer';
import { ScaleReference } from './ScaleReference';

interface PlantViewerCanvasProps {
  plant: LibraryPlant;
  controlsState: ViewerControlsState;
  onControlsChange: (updater: Partial<ViewerControlsState> | ((prev: ViewerControlsState) => ViewerControlsState)) => void;
  selectedPart: string | null;
  onSelectPart: (part: string) => void;
  onProceduralActive?: (active: boolean) => void;
  onModelLoadTime?: (ms: number) => void;
}

export interface PlantViewerCanvasRef {
  resetView: () => void;
  applyPreset: (preset: ViewPreset) => void;
  rotateStep: (deltaDeg: number) => void;
  takeScreenshot: () => string | null;
}

/**
 * Loading progress bar displayed in 3D center while GLB is streaming
 */
function ModelLoadingProgress() {
  const { progress, active } = useProgress();
  if (!active && progress === 100) return null;

  return (
    <Html center>
      <div className="bg-white/95 dark:bg-gray-900/95 p-4 rounded-2xl shadow-xl border border-emerald-200 dark:border-emerald-800 text-center space-y-2 min-w-[200px] backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          <span>Loading 3D Specimen</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Html>
  );
}

/**
 * Controller inner component for camera gliding and controls syncing
 */
function CameraAndControls({
  controlsState,
  onControlsChange,
  targetPosition,
  orbitRef,
}: {
  controlsState: ViewerControlsState;
  onControlsChange: (updater: Partial<ViewerControlsState> | ((prev: ViewerControlsState) => ViewerControlsState)) => void;
  targetPosition: [number, number, number] | null;
  orbitRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const lerpTarget = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (targetPosition) {
      lerpTarget.current = new THREE.Vector3(...targetPosition);
    } else {
      lerpTarget.current = new THREE.Vector3(0, 0.75, 0);
    }
  }, [targetPosition]);

  useFrame((_, delta) => {
    if (orbitRef.current && lerpTarget.current) {
      orbitRef.current.target.lerp(lerpTarget.current, Math.min(1.0, delta * 4));
      orbitRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={orbitRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.5}
      maxDistance={6.0}
      maxPolarAngle={Math.PI / 2 + 0.05} // don't go below ground
      autoRotate={controlsState.autoRotate}
      autoRotateSpeed={controlsState.autoRotateSpeed || 1.8}
      onChange={() => {
        if (orbitRef.current) {
          const dist = camera.position.distanceTo(orbitRef.current.target);
          const computedZoom = Math.round(Math.max(15, Math.min(180, (2.5 / dist) * 100)));
          onControlsChange({ zoom: computedZoom });
        }
      }}
    />
  );
}

export const PlantViewerCanvas = forwardRef<PlantViewerCanvasRef, PlantViewerCanvasProps>(
  (
    {
      plant,
      controlsState,
      onControlsChange,
      selectedPart,
      onSelectPart,
      onProceduralActive,
      onModelLoadTime,
    },
    ref
  ) => {
    const orbitRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [anchors, setAnchors] = useState<PartMeshAnchor[]>([]);
    const [hasLoadError, setHasLoadError] = useState(false);
    const [loadStartTime] = useState(Date.now());

    const modelUrl = plant.model3dUrl || plant.modelUrl;
    const shouldUseProcedural = !modelUrl || hasLoadError;

    useEffect(() => {
      if (onProceduralActive) {
        onProceduralActive(shouldUseProcedural);
      }
    }, [shouldUseProcedural, onProceduralActive]);

    // Camera target anchor point for selected part
    const targetAnchorPosition = useMemo(() => {
      if (!selectedPart) return null;
      const found = anchors.find((a) => a.part === selectedPart);
      return found ? found.position : null;
    }, [selectedPart, anchors]);

    // Imperative control handles
    useImperativeHandle(ref, () => ({
      resetView: () => {
        if (orbitRef.current) {
          orbitRef.current.reset();
          orbitRef.current.target.set(0, 0.75, 0);
          onControlsChange({ zoom: 50, autoRotate: false });
        }
      },
      applyPreset: (preset: ViewPreset) => {
        if (!orbitRef.current) return;
        const camera = orbitRef.current.object as THREE.PerspectiveCamera;
        const dist = 2.4;

        switch (preset) {
          case 'front':
            camera.position.set(0, 0.8, dist);
            orbitRef.current.target.set(0, 0.75, 0);
            break;
          case 'side':
            camera.position.set(dist, 0.8, 0);
            orbitRef.current.target.set(0, 0.75, 0);
            break;
          case 'top':
            camera.position.set(0, dist * 1.3, 0.01);
            orbitRef.current.target.set(0, 0.5, 0);
            break;
          case 'closeup':
            camera.position.set(0, 0.9, dist * 0.45);
            orbitRef.current.target.set(0, 0.8, 0);
            break;
        }
        orbitRef.current.update();
      },
      rotateStep: (deltaDeg: number) => {
        if (!orbitRef.current) return;
        const camera = orbitRef.current.object as THREE.Camera;
        const target = orbitRef.current.target as THREE.Vector3;
        const angleRad = (deltaDeg * Math.PI) / 180;

        const offset = new THREE.Vector3().subVectors(camera.position, target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad);
        camera.position.copy(target).add(offset);
        orbitRef.current.update();
      },
      takeScreenshot: () => {
        if (!canvasRef.current) return null;
        try {
          return canvasRef.current.toDataURL('image/png');
        } catch {
          return null;
        }
      },
    }));

    // Keyboard controls (Arrows rotate, +/- zoom, R reset)
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          ref && 'current' in ref && ref.current?.rotateStep(-15);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          ref && 'current' in ref && ref.current?.rotateStep(15);
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          ref && 'current' in ref && ref.current?.resetView();
        } else if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          onControlsChange((prev) => ({ zoom: Math.min(180, prev.zoom + 10) }));
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          onControlsChange((prev) => ({ zoom: Math.max(15, prev.zoom - 10) }));
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [ref, onControlsChange]);

    // Background preset style
    const bgClass = {
      gradient: 'bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-green-100/60 dark:from-gray-950 dark:via-emerald-950/20 dark:to-gray-900',
      white: 'bg-white dark:bg-gray-900',
      transparent: 'bg-transparent',
      garden: 'bg-gradient-to-b from-emerald-950 via-teal-950 to-green-950',
    }[controlsState.backgroundPreset || 'gradient'];

    return (
      <div className={`relative w-full h-full overflow-hidden ${bgClass}`}>
        <Canvas
          shadows
          camera={{ position: [0, 1.2, 2.6], fov: 45 }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            powerPreference: 'high-performance',
          }}
          dpr={[1, 2]}
          frameloop={controlsState.autoRotate ? 'always' : 'demand'}
          onCreated={({ gl }) => {
            canvasRef.current = gl.domElement;
            if (onModelLoadTime) {
              onModelLoadTime(Date.now() - loadStartTime);
            }
          }}
        >
          {/* Lighting Presets */}
          {controlsState.lightingPreset === 'studio' && (
            <>
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow shadow-mapSize={1024} />
              <directionalLight position={[-5, 4, -5]} intensity={0.6} color="#e0f2fe" />
              <pointLight position={[0, -2, 2]} intensity={0.4} color="#f0fdf4" />
            </>
          )}

          {controlsState.lightingPreset === 'garden' && (
            <>
              <ambientLight intensity={0.9} color="#e8f5e9" />
              <directionalLight position={[6, 9, 4]} intensity={2.0} color="#fffbeb" castShadow shadow-mapSize={1024} />
              <directionalLight position={[-4, 3, -3]} intensity={0.7} color="#a7f3d0" />
            </>
          )}

          {controlsState.lightingPreset === 'night' && (
            <>
              <ambientLight intensity={0.4} color="#1e293b" />
              <directionalLight position={[4, 7, 4]} intensity={0.9} color="#93c5fd" castShadow shadow-mapSize={1024} />
              <pointLight position={[0, 1.2, 0]} intensity={1.2} color="#fef08a" distance={3} />
            </>
          )}

          {/* Plant Model (Real GLB or Procedural Fallback) */}
          <Suspense fallback={<ModelLoadingProgress />}>
            {!shouldUseProcedural && modelUrl ? (
              <PlantModel
                plant={plant}
                modelUrl={modelUrl}
                wireframe={controlsState.wireframe}
                isolatedPart={controlsState.isolatedPart}
                showLabels={controlsState.showLabels}
                selectedPart={selectedPart}
                onSelectPart={onSelectPart}
                onAnchorsResolved={setAnchors}
              />
            ) : (
              <ProceduralPlantViewer
                plant={plant}
                wireframe={controlsState.wireframe}
                isolatedPart={controlsState.isolatedPart}
                showLabels={controlsState.showLabels}
                selectedPart={selectedPart}
                onSelectPart={onSelectPart}
                onAnchorsResolved={setAnchors}
              />
            )}
          </Suspense>

          {/* Ground Contact Shadow Disc */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.65}
            scale={4.0}
            blur={2.0}
            far={1.5}
            color="#064e3b"
          />

          {/* Optional Ground Grid Disc */}
          {controlsState.showGroundGrid && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
              <circleGeometry args={[1.8, 64]} />
              <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.25} />
            </mesh>
          )}

          {/* Optional 1.7m Human Scale Reference */}
          {controlsState.showScaleReference && (
            <ScaleReference plantHeightM={plant.visual?.heightM || 1.2} />
          )}

          {/* Orbit Controls & Smooth Lerp Target */}
          <CameraAndControls
            controlsState={controlsState}
            onControlsChange={onControlsChange}
            targetPosition={targetAnchorPosition}
            orbitRef={orbitRef}
          />
        </Canvas>
      </div>
    );
  }
);
PlantViewerCanvas.displayName = 'PlantViewerCanvas';

