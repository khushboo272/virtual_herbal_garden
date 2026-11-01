import React, { useState, useRef } from 'react';
import type { LibraryPlant } from '../../../features/library/types/library.types';
import type { ViewerControlsState, PlantViewer3DProps } from '../types';
import { PlantViewerCanvas, PlantViewerCanvasRef } from './PlantViewerCanvas';
import { RotateCw, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

export const PlantViewer3D: React.FC<PlantViewer3DProps> = ({
  plant,
  height = '420px',
  interactive = true,
  onSelectPart,
  selectedPart: externalSelectedPart,
  className = '',
}) => {
  const canvasRef = useRef<PlantViewerCanvasRef>(null);
  const [internalSelectedPart, setInternalSelectedPart] = useState<string | null>(null);
  const selectedPart = externalSelectedPart !== undefined ? externalSelectedPart : internalSelectedPart;

  const [controlsState, setControlsState] = useState<ViewerControlsState>({
    zoom: 50,
    rotation: 0,
    autoRotate: true,
    autoRotateSpeed: 1.2,
    showLabels: true,
    isolatedPart: null,
    wireframe: false,
    showGroundGrid: true,
    showScaleReference: false,
    lightingPreset: 'garden',
    backgroundPreset: 'gradient',
  });

  const handleSelectPart = (part: string) => {
    setInternalSelectedPart(part);
    if (onSelectPart) onSelectPart(part);
  };

  return (
    <div
      className={`relative rounded-3xl overflow-hidden border border-emerald-200 dark:border-emerald-800 shadow-md ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      <PlantViewerCanvas
        ref={canvasRef}
        plant={plant}
        controlsState={controlsState}
        onControlsChange={(updater) =>
          setControlsState((prev) => (typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }))
        }
        selectedPart={selectedPart}
        onSelectPart={handleSelectPart}
      />

      {interactive && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm text-xs">
          <button
            type="button"
            onClick={() => setControlsState((prev) => ({ autoRotate: !prev.autoRotate }))}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              controlsState.autoRotate
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Auto-rotate"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => canvasRef.current?.rotateStep(45)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition cursor-pointer"
            title="Rotate +45°"
          >
            <span className="font-mono text-[10px]">+45°</span>
          </button>

          <button
            type="button"
            onClick={() => canvasRef.current?.resetView()}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition cursor-pointer"
            title="Reset"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        </div>
      )}
    </div>
  );
};

