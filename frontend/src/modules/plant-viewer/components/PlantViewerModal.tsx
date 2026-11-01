import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Camera,
  Maximize2,
  Minimize2,
  Share2,
  PanelRightClose,
  PanelRightOpen,
  BookOpen,
  Activity,
  Layers,
} from 'lucide-react';
import type { LibraryPlant } from '../../../features/library/types/library.types';
import type { PlantViewerModalProps, ViewerControlsState, ViewPreset } from '../types';
import { PlantViewerCanvas, PlantViewerCanvasRef } from './PlantViewerCanvas';
import { PlantViewerToolbar } from './PlantViewerToolbar';
import { PlantInfoPanel } from './PlantInfoPanel';
import { libraryApi } from '../../../features/library/api/libraryApi';
import { toast } from 'sonner';

export const PlantViewerModal: React.FC<PlantViewerModalProps> = ({
  isOpen,
  onClose,
  plant: initialPlant,
  plantSlug,
  plantName,
  botanicalName,
  initialPart,
}) => {
  const canvasRef = useRef<PlantViewerCanvasRef>(null);
  const [plant, setPlant] = useState<LibraryPlant | null>(initialPlant || null);
  const [isLoadingPlant, setIsLoadingPlant] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPart, setSelectedPart] = useState<string | null>(initialPart || null);
  const [activeTab, setActiveTab] = useState<'3d' | 'photos' | 'info'>('3d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProcedural, setIsProcedural] = useState(false);
  const [modelLoadTimeMs, setModelLoadTimeMs] = useState<number | undefined>();
  const [webGLError, setWebGLError] = useState<string | null>(null);

  // Canvas-first layout state: collapsible info drawer & pro inspector
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  const [controlsState, setControlsState] = useState<ViewerControlsState>({
    zoom: 50,
    rotation: 0,
    autoRotate: true,
    autoRotateSpeed: 1.5,
    showLabels: true,
    isolatedPart: null,
    wireframe: false,
    showGroundGrid: true,
    showScaleReference: false,
    lightingPreset: 'garden',
    backgroundPreset: 'gradient',
    qualityTier: 'auto',
  });

  // Fetch plant by slug if plantSlug or plantName was provided instead of plant object
  useEffect(() => {
    if (initialPlant) {
      setPlant(initialPlant);
      return;
    }
    const targetSlug =
      plantSlug ||
      (plantName
        ? plantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : undefined);

    if (targetSlug) {
      setIsLoadingPlant(true);
      setLoadError(null);
      libraryApi
        .getPlantBySlug(targetSlug)
        .then((p) => setPlant(p as LibraryPlant))
        .catch((err) => {
          if (plantName || botanicalName) {
            setPlant({
              _id: `temp_${targetSlug}`,
              slug: targetSlug,
              commonName: plantName || 'Medicinal Specimen',
              scientificName: botanicalName || plantName || 'Botanical specimen',
              family: 'Herbal Flora',
              partsUsed: ['leaves'],
              medicinalUses: ['Traditional herbal infusion'],
              description: 'Interactive botanical specimen model.',
              toxicityLevel: 'NONE',
              images: [],
              model3dUrl: null,
              modelUrl: null,
            } as any);
          } else {
            setLoadError(err?.message || 'Failed to load plant');
          }
        })
        .finally(() => setIsLoadingPlant(false));
    }
  }, [initialPlant, plantSlug, plantName, botanicalName]);

  // Read URL search params for deep linking (?view=3d&part=leaves)
  useEffect(() => {
    if (!isOpen) return;
    const searchParams = new URLSearchParams(window.location.search);
    const urlPart = searchParams.get('part');
    if (urlPart) {
      setSelectedPart(urlPart);
    }
  }, [isOpen]);

  // Sync selectedPart to URL deep link without page reload
  useEffect(() => {
    if (!isOpen || !plant) return;
    const url = new URL(window.location.href);
    if (selectedPart) {
      url.searchParams.set('part', selectedPart);
    } else {
      url.searchParams.delete('part');
    }
    window.history.replaceState({}, '', url.toString());
  }, [selectedPart, isOpen, plant]);

  // Keyboard shortcuts: Escape closes modal, F toggles fullscreen, I toggles inspector, L toggles labels
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setIsInspectorOpen((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setControlsState((prev) => ({ ...prev, showLabels: !prev.showLabels }));
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        canvasRef.current?.resetView();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleTakeScreenshot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleFullscreen = () => {
    if (!modalRef.current) return;
    if (!document.fullscreenElement) {
      modalRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleShare = async () => {
    if (!plant) return;
    try {
      const url = `${window.location.origin}/library?plant=${plant.slug}&view=3d${
        selectedPart ? `&part=${selectedPart}` : ''
      }`;
      await navigator.clipboard.writeText(url);
      toast.success('3D viewer deep link copied to clipboard!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleTakeScreenshot = useCallback(() => {
    if (!canvasRef.current || !plant) return;
    const dataUrl = canvasRef.current.takeScreenshot();
    if (!dataUrl) {
      toast.error('Could not capture 3D view snapshot');
      return;
    }

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${plant.slug || 'plant'}-3d-view.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('High-resolution screenshot downloaded!');
  }, [plant]);

  // Turntable 5-second WebM Recording
  const handleRecordTurntable = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      toast.error('3D Canvas not found');
      return;
    }

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        setIsRecording(false);
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${plant?.slug || 'plant'}-turntable.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Turntable WebM video saved!');
      };

      setIsRecording(true);
      recorder.start();

      // Temporarily enable smooth auto-rotate while recording
      setControlsState((prev) => ({ ...prev, autoRotate: true, autoRotateSpeed: 3 }));
      toast.info('Recording 5s turntable showcase...');

      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 5000);
    } catch {
      toast.error('Turntable video capture unsupported on this browser');
      setIsRecording(false);
    }
  }, [plant]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-3 md:p-5 animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="relative w-full h-full max-w-[1700px] sm:h-[96vh] bg-slate-950 rounded-none sm:rounded-3xl shadow-2xl border border-emerald-900/40 flex flex-col overflow-hidden"
      >
        {/* ── 1. Slim Glass Top Bar ── */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                {plant ? plant.commonName : 'Botanical 3D Specimen'}
              </h2>
              <span className="hidden sm:inline text-xs italic text-emerald-600 dark:text-emerald-400 font-serif">
                ({plant?.scientificName || 'Species'})
              </span>
            </div>
            {plant?.toxicityLevel && (
              <span className="hidden md:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                {plant.toxicityLevel === 'NONE' ? 'Non-Toxic' : `${plant.toxicityLevel} Risk`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              title="Share 3D Deep Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleTakeScreenshot}
              className="p-2 rounded-xl text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              title="Capture Snapshot [S]"
            >
              <Camera className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen [F]' : 'Enter Fullscreen [F]'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              aria-label="Close modal"
              title="Close [Esc]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── 2. Full-Bleed 3D Canvas-First Viewport ── */}
        <div
          data-testid="plant-viewer-canvas-container"
          className="absolute inset-0 z-0 flex flex-col bg-gradient-to-b from-emerald-950/15 via-slate-900 to-black overflow-hidden"
        >
          {isLoadingPlant ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 space-x-2">
              <Sparkles className="w-5 h-5 animate-spin text-emerald-500" />
              <span className="text-sm">Loading 3D specimen and botanical data...</span>
            </div>
          ) : loadError || !plant ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 z-10">
              <AlertCircle className="w-10 h-10 text-red-500" />
              <p className="text-sm font-semibold text-gray-200">
                {loadError || 'Plant not found'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          ) : webGLError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 bg-gray-900 z-10">
              <AlertCircle className="w-8 h-8 text-amber-500" />
              <p className="text-sm font-semibold text-gray-200">3D Hardware Acceleration Unavailable</p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('photos');
                  setIsDrawerOpen(true);
                }}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg mt-2 cursor-pointer"
              >
                View High-Res Photos
              </button>
            </div>
          ) : (
            <PlantViewerCanvas
              ref={canvasRef}
              plant={plant}
              controlsState={controlsState}
              onControlsChange={(updater) =>
                setControlsState((prev) =>
                  typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
                )
              }
              selectedPart={selectedPart}
              onSelectPart={setSelectedPart}
              onProceduralActive={setIsProcedural}
              onModelLoadTime={setModelLoadTimeMs}
            />
          )}
        </div>

        {/* ── 3. Thin Floating 40px Left Toolbar ── */}
        <PlantViewerToolbar
          state={controlsState}
          onChange={(updater) =>
            setControlsState((prev) =>
              typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
            )
          }
          onRotateStep={(deg) => canvasRef.current?.rotateStep(deg)}
          onApplyPreset={(p) => canvasRef.current?.applyPreset(p)}
          onResetView={() => canvasRef.current?.resetView()}
          onTakeScreenshot={handleTakeScreenshot}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          isInspectorOpen={isInspectorOpen}
          onToggleInspector={() => setIsInspectorOpen((prev) => !prev)}
          isRecording={isRecording}
          onRecordTurntable={handleRecordTurntable}
        />

        {/* ── 4. Floating Drawer Open Button (when collapsed) ── */}
        {!isDrawerOpen && (
          <button
            type="button"
            data-testid="drawer-open-btn"
            onClick={() => setIsDrawerOpen(true)}
            className="absolute right-4 top-16 z-20 flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-emerald-200/80 dark:border-emerald-800/80 shadow-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-800 transition cursor-pointer"
            title="Open Specimen Monograph Drawer"
          >
            <PanelRightOpen className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Monograph</span>
          </button>
        )}

        {/* ── 5. Collapsible Slide-Over Right Info Drawer (≤ 380px) ── */}
        <div
          data-testid="plant-info-drawer"
          className={`absolute right-0 top-0 bottom-0 z-30 w-full sm:w-[360px] md:w-[380px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-l border-emerald-200/60 dark:border-emerald-800/60 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
            isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Collapse Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-950/40">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Specimen Monograph</span>
            </div>
            <button
              type="button"
              data-testid="drawer-close-btn"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              title="Collapse Monograph Drawer"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Plant Monograph Content */}
          {plant && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <PlantInfoPanel
                plant={plant}
                selectedPart={selectedPart}
                onSelectPart={setSelectedPart}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isProceduralFallback={isProcedural}
                modelLoadTimeMs={modelLoadTimeMs}
              />
            </div>
          )}
        </div>

        {/* ── 6. 3D Model Inspector Slide-Over / Popover ── */}
        {isInspectorOpen && (
          <div className="absolute left-16 top-16 z-20 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl border border-emerald-300/80 dark:border-emerald-800/80 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
              <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>3D Model Inspector</span>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Specimen Status:</span>
                <span className="font-semibold text-emerald-600">
                  {isProcedural ? 'Procedural Fallback' : 'Real GLB (Cloudflare R2)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Load Latency:</span>
                <span className="font-mono">{modelLoadTimeMs ? `${modelLoadTimeMs} ms` : 'Cached'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target Height:</span>
                <span>{plant?.visual?.heightM || 1.0} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Parts Used:</span>
                <span className="font-semibold">{plant?.partsUsed?.join(', ') || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Lighting Environment:</span>
                <span className="capitalize">{controlsState.lightingPreset}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rendering Tier:</span>
                <span className="uppercase">{controlsState.qualityTier || 'Auto'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-400">
              Binary glTF 2.0 with Draco / meshopt compression.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
