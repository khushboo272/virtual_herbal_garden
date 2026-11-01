import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Play,
  Pause,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Camera,
  Grid,
  User,
  Sun,
  Moon,
  Sparkles,
  Layers,
  Compass,
} from 'lucide-react';
import type { ViewerControlsState, LightingPreset, BackgroundPreset, ViewPreset } from '../types';

interface PlantViewerControlsProps {
  state: ViewerControlsState;
  onChange: (updater: Partial<ViewerControlsState> | ((prev: ViewerControlsState) => ViewerControlsState)) => void;
  onRotateStep: (deltaDeg: number) => void;
  onApplyPreset: (preset: ViewPreset) => void;
  onResetView: () => void;
  onTakeScreenshot: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  isARSupported?: boolean;
  onLaunchAR?: () => void;
  collapsedMobile?: boolean;
}

export const PlantViewerControls: React.FC<PlantViewerControlsProps> = ({
  state,
  onChange,
  onRotateStep,
  onApplyPreset,
  onResetView,
  onTakeScreenshot,
  isFullscreen,
  onToggleFullscreen,
  isARSupported = false,
  onLaunchAR,
  collapsedMobile = false,
}) => {
  return (
    <div
      className={`space-y-4 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-lg text-gray-800 dark:text-gray-200 transition-all ${
        collapsedMobile ? 'hidden md:block' : 'block'
      }`}
    >
      {/* ── Zoom Controls ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1.5">
            <ZoomIn className="w-3.5 h-3.5 text-emerald-600" />
            Zoom
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">{Math.round(state.zoom)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange((prev) => ({ zoom: Math.max(15, prev.zoom - 15) }))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition cursor-pointer"
            title="Zoom out (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="15"
            max="180"
            value={state.zoom}
            onChange={(e) => onChange({ zoom: Number(e.target.value) })}
            className="flex-1 accent-emerald-600 cursor-pointer h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg"
          />
          <button
            type="button"
            onClick={() => onChange((prev) => ({ zoom: Math.min(180, prev.zoom + 15) }))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition cursor-pointer"
            title="Zoom in (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Rotation & Angle ── */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
            Rotation
          </span>
          <button
            type="button"
            onClick={() => onChange((prev) => ({ autoRotate: !prev.autoRotate }))}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium transition cursor-pointer ${
              state.autoRotate
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
            }`}
          >
            {state.autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{state.autoRotate ? 'Rotating' : 'Auto-spin'}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onRotateStep(-45)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-800 font-medium transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>-45°</span>
          </button>
          <button
            type="button"
            onClick={() => onRotateStep(45)}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-800 font-medium transition cursor-pointer"
          >
            <RotateCw className="w-3 h-3" />
            <span>+45°</span>
          </button>
        </div>
      </div>

      {/* ── Camera View Presets ── */}
      <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-600" />
          View Presets
        </div>
        <div className="grid grid-cols-4 gap-1 text-[11px]">
          {(['front', 'side', 'top', 'closeup'] as ViewPreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className="py-1 px-1.5 text-center capitalize rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-800 hover:border-emerald-300 font-medium transition cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* ── Environment & Lighting ── */}
      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
          <span className="flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-emerald-600" />
            Environment
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[11px]">
          {(['studio', 'garden', 'night'] as LightingPreset[]).map((light) => (
            <button
              key={light}
              type="button"
              onClick={() => onChange({ lightingPreset: light })}
              className={`py-1 px-1 rounded-lg border capitalize font-medium transition cursor-pointer text-center ${
                state.lightingPreset === light
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {light}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toggles ── */}
      <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          Display Layers
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onChange((prev) => ({ showLabels: !prev.showLabels }))}
            className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left font-medium transition cursor-pointer ${
              state.showLabels
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {state.showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Labels</span>
          </button>

          <button
            type="button"
            onClick={() => onChange((prev) => ({ showScaleReference: !prev.showScaleReference }))}
            className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left font-medium transition cursor-pointer ${
              state.showScaleReference
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
            title="1.7m Human silhouette scale"
          >
            <User className="w-3.5 h-3.5" />
            <span>Human 1.7m</span>
          </button>

          <button
            type="button"
            onClick={() => onChange((prev) => ({ showGroundGrid: !prev.showGroundGrid }))}
            className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left font-medium transition cursor-pointer ${
              state.showGroundGrid
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Grid Disc</span>
          </button>

          <button
            type="button"
            onClick={() => onChange((prev) => ({ wireframe: !prev.wireframe }))}
            className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-left font-medium transition cursor-pointer ${
              state.wireframe
                ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wireframe</span>
          </button>
        </div>
      </div>

      {/* ── Actions: Reset, Screenshot, Fullscreen, AR ── */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onResetView}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
            <span>Reset View</span>
          </button>

          <button
            type="button"
            onClick={onTakeScreenshot}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-800 text-emerald-700 dark:text-emerald-300 font-medium transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>PNG Snapshot</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 font-semibold transition cursor-pointer"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen (F)'}</span>
        </button>

        {isARSupported && onLaunchAR && (
          <button
            type="button"
            onClick={onLaunchAR}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold shadow-md hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>View in Your Space (AR)</span>
          </button>
        )}
      </div>
    </div>
  );
};

