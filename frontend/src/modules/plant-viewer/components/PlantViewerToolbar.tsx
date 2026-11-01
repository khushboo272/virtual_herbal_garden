import React, { useState } from 'react';
import {
  RotateCcw,
  Play,
  Pause,
  Compass,
  Tag,
  Layers,
  Box,
  CircleDot,
  User,
  Sun,
  Sliders,
  Camera,
  Video,
  Info,
  Maximize2,
  Minimize2,
  HelpCircle,
  Eye,
  EyeOff,
  Crosshair,
  Gauge,
  Sparkles,
} from 'lucide-react';
import type {
  ViewerControlsState,
  ViewPreset,
  LightingPreset,
  BackgroundPreset,
  LabelDisplayMode,
  ViewerQualityTier,
} from '../types';

interface PlantViewerToolbarProps {
  state: ViewerControlsState;
  onChange: (updater: Partial<ViewerControlsState> | ((prev: ViewerControlsState) => ViewerControlsState)) => void;
  onRotateStep: (deltaDeg: number) => void;
  onApplyPreset: (preset: ViewPreset) => void;
  onResetView: () => void;
  onTakeScreenshot: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
  onRecordTurntable?: () => void;
  isRecording?: boolean;
  onOpenShortcuts?: () => void;
}

export const PlantViewerToolbar: React.FC<PlantViewerToolbarProps> = ({
  state,
  onChange,
  onRotateStep,
  onApplyPreset,
  onResetView,
  onTakeScreenshot,
  isFullscreen,
  onToggleFullscreen,
  onToggleInspector,
  isInspectorOpen = false,
  onRecordTurntable,
  isRecording = false,
  onOpenShortcuts,
}) => {
  const [activePopover, setActivePopover] = useState<
    'presets' | 'environment' | 'quality' | 'explode' | 'speed' | null
  >(null);

  const togglePopover = (name: 'presets' | 'environment' | 'quality' | 'explode' | 'speed') => {
    setActivePopover((prev) => (prev === name ? null : name));
  };

  const handleNextLabelMode = () => {
    const current = state.labelMode || (state.showLabels ? 'all' : 'off');
    let next: LabelDisplayMode = 'pins';
    if (current === 'all') next = 'pins';
    else if (current === 'pins') next = 'off';
    else next = 'all';

    onChange({
      labelMode: next,
      showLabels: next !== 'off',
    });
  };

  return (
    <aside
      aria-label="3D Viewer Controls"
      className="absolute top-16 left-4 z-20 flex flex-col items-center gap-1.5 p-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 shadow-xl text-gray-700 dark:text-gray-300 pointer-events-auto"
    >
      {/* ── 1. Reset View [R] ── */}
      <button
        type="button"
        onClick={onResetView}
        title="Reset View [R]"
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600 transition cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* ── 2. View Presets Popover ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => togglePopover('presets')}
          title="Camera View Presets [1-5]"
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
            activePopover === 'presets'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
          }`}
        >
          <Compass className="w-4 h-4" />
        </button>

        {activePopover === 'presets' && (
          <div className="absolute left-12 top-0 z-30 w-36 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-800 p-2 space-y-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-2 py-0.5">
              View Angle
            </div>
            {(
              [
                { id: 'front', label: 'Front (1)' },
                { id: 'side', label: 'Side (2)' },
                { id: 'top', label: 'Top (3)' },
                { id: 'closeup', label: 'Close-up (4)' },
                { id: 'roots', label: 'Roots (5)' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onApplyPreset(p.id);
                  setActivePopover(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Auto-rotate Toggle [Space] ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => onChange((prev) => ({ autoRotate: !prev.autoRotate }))}
          onContextMenu={(e) => {
            e.preventDefault();
            togglePopover('speed');
          }}
          title={state.autoRotate ? 'Pause Rotation [Space]' : 'Auto-rotate [Space]'}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
            state.autoRotate
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/40'
              : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
          }`}
        >
          {state.autoRotate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>

        {activePopover === 'speed' && (
          <div className="absolute left-12 top-0 z-30 w-44 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-800 p-3 space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Rotation Speed</span>
              <span className="font-mono text-emerald-600">{state.autoRotateSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.5"
              value={state.autoRotateSpeed}
              onChange={(e) => onChange({ autoRotateSpeed: Number(e.target.value) })}
              className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* ── 4. Labels Mode Toggle [L] ── */}
      <button
        type="button"
        onClick={handleNextLabelMode}
        title={`Labels Mode: ${state.labelMode || 'all'} [L]`}
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
          state.showLabels
            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/40'
            : 'text-gray-400 hover:bg-emerald-50 dark:hover:bg-gray-800'
        }`}
      >
        <Tag className="w-4 h-4" />
      </button>

      {/* ── 5. Isolate / Explode Popover [I] ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => togglePopover('explode')}
          title="Isolate & Explode Organs [I]"
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
            state.isolatedPart || (state.explodeAmount && state.explodeAmount > 0)
              ? 'bg-emerald-600 text-white'
              : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {activePopover === 'explode' && (
          <div className="absolute left-12 top-0 z-30 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-800 p-3 space-y-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-medium">
              <span>Organ Explode</span>
              <span className="font-mono text-emerald-600">
                {Math.round((state.explodeAmount || 0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.explodeAmount || 0}
              onChange={(e) => onChange({ explodeAmount: Number(e.target.value) })}
              className="w-full accent-emerald-600 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
            {state.isolatedPart && (
              <button
                type="button"
                onClick={() => onChange({ isolatedPart: null })}
                className="w-full py-1 text-center text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 transition"
              >
                Clear Part Isolation
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 6. Wireframe Toggle ── */}
      <button
        type="button"
        onClick={() => onChange((prev) => ({ wireframe: !prev.wireframe }))}
        title="Toggle Wireframe"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
          state.wireframe
            ? 'bg-emerald-600 text-white'
            : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
        }`}
      >
        <Box className="w-4 h-4" />
      </button>

      {/* ── 7. Ground Grid Toggle ── */}
      <button
        type="button"
        onClick={() => onChange((prev) => ({ showGroundGrid: !prev.showGroundGrid }))}
        title="Toggle Ground Grid"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
          state.showGroundGrid
            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
            : 'text-gray-400 hover:bg-emerald-50 dark:hover:bg-gray-800'
        }`}
      >
        <CircleDot className="w-4 h-4" />
      </button>

      {/* ── 8. Human Scale & Dimensions ── */}
      <button
        type="button"
        onClick={() => onChange((prev) => ({ showScaleReference: !prev.showScaleReference }))}
        title="Toggle 1.7m Human Scale Reference"
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
          state.showScaleReference
            ? 'bg-emerald-600 text-white'
            : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
        }`}
      >
        <User className="w-4 h-4" />
      </button>

      <div className="w-6 h-px bg-gray-200 dark:bg-gray-800 my-0.5" />

      {/* ── 9. Environment Lighting Popover ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => togglePopover('environment')}
          title="Lighting & Background Presets"
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
            activePopover === 'environment'
              ? 'bg-emerald-600 text-white'
              : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
          }`}
        >
          <Sun className="w-4 h-4" />
        </button>

        {activePopover === 'environment' && (
          <div className="absolute left-12 top-0 z-30 w-44 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-800 p-2.5 space-y-2 backdrop-blur-md">
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-1">
              Lighting
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  { id: 'studio', label: 'Studio' },
                  { id: 'garden', label: 'Garden' },
                  { id: 'greenhouse', label: 'Greenhouse' },
                  { id: 'night', label: 'Night' },
                ] as const
              ).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onChange({ lightingPreset: l.id })}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition ${
                    state.lightingPreset === l.id
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-1 pt-1 border-t border-gray-100 dark:border-gray-800">
              Backdrop
            </div>
            <div className="grid grid-cols-2 gap-1">
              {(
                [
                  { id: 'gradient', label: 'Gradient' },
                  { id: 'sky', label: 'Sky' },
                  { id: 'garden', label: 'Deep' },
                  { id: 'white', label: 'White' },
                ] as const
              ).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onChange({ backgroundPreset: b.id })}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center transition ${
                    state.backgroundPreset === b.id
                      ? 'bg-emerald-600 text-white font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 10. Quality Settings Popover ── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => togglePopover('quality')}
          title="Rendering Quality"
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
            activePopover === 'quality'
              ? 'bg-emerald-600 text-white'
              : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>

        {activePopover === 'quality' && (
          <div className="absolute left-12 top-0 z-30 w-36 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-800 p-2 space-y-1 backdrop-blur-md">
            <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400 px-2 py-0.5">
              Quality Tier
            </div>
            {(
              [
                { id: 'auto', label: 'Auto (Adaptive)' },
                { id: 'high', label: 'High (Antialiased)' },
                { id: 'medium', label: 'Medium' },
                { id: 'low', label: 'Low (Battery)' },
              ] as const
            ).map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  onChange({ qualityTier: q.id });
                  setActivePopover(null);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                  (state.qualityTier || 'auto') === q.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 11. Screenshot PNG [S] ── */}
      <button
        type="button"
        onClick={onTakeScreenshot}
        title="Capture Screenshot PNG [S]"
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600 transition cursor-pointer"
      >
        <Camera className="w-4 h-4" />
      </button>

      {/* ── 12. Turntable Recording ── */}
      {onRecordTurntable && (
        <button
          type="button"
          onClick={onRecordTurntable}
          title={isRecording ? 'Recording turntable...' : 'Record 5s Turntable WebM'}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
          }`}
        >
          <Video className="w-4 h-4" />
        </button>
      )}

      {/* ── 13. Model Inspector ── */}
      {onToggleInspector && (
        <button
          type="button"
          onClick={onToggleInspector}
          title="3D Model Inspector & Geometry Telemetry"
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition cursor-pointer ${
            isInspectorOpen
              ? 'bg-emerald-600 text-white'
              : 'hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600'
          }`}
        >
          <Info className="w-4 h-4" />
        </button>
      )}

      {/* ── 14. Fullscreen [F] ── */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen [F]' : 'Enter Fullscreen [F]'}
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600 transition cursor-pointer"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* ── 15. Keyboard Shortcuts [?] ── */}
      {onOpenShortcuts && (
        <button
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts [?]"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600 transition cursor-pointer text-gray-400"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}
    </aside>
  );
};
