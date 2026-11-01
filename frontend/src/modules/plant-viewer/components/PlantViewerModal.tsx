import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Sparkles, AlertCircle, Camera } from 'lucide-react';
import type { LibraryPlant } from '../../../features/library/types/library.types';
import type { PlantViewerModalProps, ViewerControlsState, ViewPreset } from '../types';
import { PlantViewerCanvas, PlantViewerCanvasRef } from './PlantViewerCanvas';
import { PlantViewerControls } from './PlantViewerControls';
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
          // If not in database or network error, provide fallback plant with provided names
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

  // Keyboard shortcut listener: Escape closes modal, F toggles fullscreen
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          toggleFullscreen();
        }
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
    toast.success('Screenshot downloaded!');
  }, [plant]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-7xl h-[94vh] max-h-[950px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-emerald-200/80 dark:border-emerald-900/60 flex flex-col overflow-hidden"
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {plant ? plant.commonName : 'Botanical 3D Specimen'}
                </h2>
                <span className="text-xs italic text-emerald-600 dark:text-emerald-400 font-serif">
                  ({plant?.scientificName || 'Species'})
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Interactive real-time botanical monograph and 3D organ explorer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTakeScreenshot}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-gray-800 transition cursor-pointer"
              title="Snapshot PNG"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Screenshot</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Modal Content Grid ── */}
        {isLoadingPlant ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 space-x-2">
            <Sparkles className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Loading plant monograph...</span>
          </div>
        ) : loadError || !plant ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {loadError || 'Plant not found'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
            >
              Close Viewer
            </button>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden relative">
            {/* Left Controls (Desktop) */}
            <div className="hidden lg:block lg:col-span-3 xl:col-span-3 p-4 overflow-y-auto border-r border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/20">
              <PlantViewerControls
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
              />
            </div>

            {/* Center 3D Canvas */}
            <div className="lg:col-span-5 xl:col-span-5 relative h-full flex flex-col min-h-[350px]">
              {webGLError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2 bg-gray-50 dark:bg-gray-800">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                  <p className="text-sm font-semibold">3D Hardware Acceleration Unavailable</p>
                  <p className="text-xs text-gray-500 max-w-sm">
                    Switching to the photographic monograph view.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('photos')}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg mt-2"
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

            {/* Right Information Panel */}
            <div className="lg:col-span-4 xl:col-span-4 h-full min-h-0 overflow-hidden flex flex-col">
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
          </div>
        )}
      </div>
    </div>
  );
};
