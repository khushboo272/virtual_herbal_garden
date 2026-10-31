// ──────────────────────────────────────────────────────────
// pages/VirtualGarden3DPage.tsx — Photorealistic Landscaped 3D Sanctuary
// Real database plants from useShowcasePlants, quality tiers (LOW..ULTRA),
// diurnal clock slider, radar minimap, teleport menu, photo mode, and debug overlay.
// ──────────────────────────────────────────────────────────
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Leaf, RefreshCw, Settings, Camera, Sparkles, X } from 'lucide-react';

import { Garden3DScene } from '../scene/Garden3DScene';
import { useShowcasePlants } from '../hooks/useShowcasePlants';
import { layoutShowcase } from '../utils/layoutShowcase';
import type { PlacedShowcasePlant, SceneMetrics } from '../types';
import { PlantInfoPanel } from '../components/PlantInfoPanel';
import { DebugOverlay } from '../components/DebugOverlay';

// Quality & Landscape Controls
import { useGardenQuality } from '../hooks/useGardenQuality';
import { GardenSettingsModal } from '../components/GardenSettingsModal';
import { GardenTeleportMenu } from '../components/GardenTeleportMenu';
import { GardenMinimap } from '../components/GardenMinimap';
import { gardenSoundscape } from '../utils/proceduralAudio';
import { GARDEN_CONFIG } from '../gardenConfig';

// UI Overlays & API
import { HUD } from '../../../app/components/3d/HUD';
import { api } from '../../../lib/api';

export function VirtualGarden3DPage() {
  const { plants, isLoading, refetch } = useShowcasePlants();
  const { tier, config: qualityConfig, setTier } = useGardenQuality();

  const [isLocked, setIsLocked] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<PlacedShowcasePlant | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [cameraMode, setCameraMode] = useState<'fps' | 'orbit'>('fps');
  const [isFullGardenView, setIsFullGardenView] = useState(false);

  // Landscape & Experience Controls
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [teleportTarget, setTeleportTarget] = useState<[number, number, number] | null>(null);

  // Diurnal clock defaults to user's real local time (e.g. 14.5 = 2:30 PM)
  const [timeOfDay, setTimeOfDay] = useState<number>(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });

  // Track player position & orientation for minimap radar
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 1.7, 12]);
  const [playerHeading, setPlayerHeading] = useState<number>(0);

  const [searchParams, setSearchParams] = useSearchParams();
  const placePlantId = searchParams.get('placePlantId');
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>(null);

  const [metrics, setMetrics] = useState<SceneMetrics>({
    fps: 60,
    drawCalls: 0,
    triangles: 0,
    qualityTier: tier.toLowerCase(),
    realModelCount: 0,
    placeholderCount: 0,
    totalPlants: 0,
  });

  // Keep metrics in sync with quality tier
  useEffect(() => {
    setMetrics((prev) => ({ ...prev, qualityTier: tier.toLowerCase() }));
  }, [tier]);

  // Cleanup audio soundscape on unmount
  useEffect(() => {
    return () => {
      gardenSoundscape.stop();
    };
  }, []);

  // Deterministically layout showcase plants into landscaped zones
  const placedPlants = useMemo(() => {
    return layoutShowcase(plants);
  }, [plants]);

  // Handle plant selection from 3D scene
  const handlePlantSelect = useCallback(
    (plant: PlacedShowcasePlant) => {
      if (placePlantId || isPhotoMode) return;
      setIsFullGardenView(false);
      setSelectedPlant(plant);
      document.exitPointerLock?.();
    },
    [placePlantId, isPhotoMode]
  );

  const handleGroundMove = useCallback(
    (pos: [number, number, number]) => {
      if (placePlantId) {
        setGhostPosition(pos);
      }
    },
    [placePlantId]
  );

  const handleGroundClick = useCallback(
    async (pos: [number, number, number]) => {
      if (placePlantId) {
        try {
          await api.patch(`/plants/${placePlantId}/garden-position`, {
            position: { x: pos[0], y: pos[1], z: pos[2] },
            isVisibleInGarden: true,
          });
          refetch();
        } catch (e) {
          console.error('Failed to update garden position', e);
        }

        searchParams.delete('placePlantId');
        setSearchParams(searchParams);
        setGhostPosition(null);
      }
    },
    [placePlantId, searchParams, setSearchParams, refetch]
  );

  const handleMetricsUpdate = useCallback((newMetrics: Partial<SceneMetrics>) => {
    setMetrics((prev) => ({ ...prev, ...newMetrics }));
  }, []);

  const handlePlayerMove = useCallback((pos: [number, number, number], headingRad: number) => {
    setPlayerPos(pos);
    setPlayerHeading(headingRad);
    const [px, , pz] = GARDEN_CONFIG.terrain.pondCenter;
    const distPond = Math.hypot(pos[0] - px, pos[2] - pz);
    gardenSoundscape.updatePlayerDistanceToPond(distPond);
  }, []);

  // Photo Mode Screenshot Capture
  const handleCapturePhoto = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `botanical-garden-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture photo screenshot:', err);
    }
  };

  // Keyboard shortcut: Escape exits photo mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPhotoMode) {
        setIsPhotoMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPhotoMode]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: '#0a101d',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* 3D Garden Scene */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Garden3DScene
          plants={placedPlants}
          onPlantSelect={handlePlantSelect}
          selectedPlant={selectedPlant}
          cameraMode={cameraMode}
          ghostPosition={ghostPosition}
          audioEnabled={audioEnabled}
          audioVolume={audioVolume}
          isLocked={!!selectedPlant || isSettingsOpen}
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
          onGroundMove={handleGroundMove}
          onGroundClick={handleGroundClick}
          isFullGardenView={isFullGardenView}
          onMetricsUpdate={handleMetricsUpdate}
          quality={qualityConfig}
          timeOfDayHours={timeOfDay}
          isPhotoMode={isPhotoMode}
          reducedMotion={reducedMotion}
          showLabels={showLabels}
          teleportTarget={teleportTarget}
          onTeleportComplete={() => setTeleportTarget(null)}
          onPlayerMove={handlePlayerMove}
        />
      </div>

      {/* Floating Action Bar (Top Left) — Teleport, Settings, Photo Mode */}
      {!isPhotoMode && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {/* Botanical Teleporter */}
          <GardenTeleportMenu onTeleport={(pos) => setTeleportTarget(pos)} />

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="Experience & Graphics Settings"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <Settings style={{ width: 14, height: 14, color: '#38bdf8' }} />
            <span>Settings</span>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                padding: '1px 6px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {tier}
            </span>
          </button>

          {/* Photo Mode Toggle */}
          <button
            onClick={() => {
              setIsPhotoMode(true);
              document.exitPointerLock?.();
            }}
            title="Enter Botanical Photo Mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Camera style={{ width: 14, height: 14, color: '#f59e0b' }} />
            <span>Photo Mode</span>
          </button>
        </div>
      )}

      {/* Photo Mode Toolbar (Bottom Center) */}
      {isPhotoMode && (
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 30,
            padding: '8px 20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
            <Sparkles style={{ width: 16, height: 16 }} />
            <span>Photo Mode</span>
          </div>

          <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.2)' }} />

          <button
            onClick={handleCapturePhoto}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#f59e0b',
              color: '#0f172a',
              border: 'none',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Camera style={{ width: 14, height: 14 }} />
            <span>Save PNG Screenshot</span>
          </button>

          <button
            onClick={() => setIsPhotoMode(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'transparent',
              color: '#94a3b8',
              border: 'none',
              padding: '6px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <X style={{ width: 14, height: 14 }} />
            <span>Exit (Esc)</span>
          </button>
        </div>
      )}

      {/* Empty State Overlay if 0 published plants */}
      {!isLoading && plants.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 16,
            padding: '32px 40px',
            color: '#f8fafc',
            textAlign: 'center',
            maxWidth: 460,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              padding: 12,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.15)',
              marginBottom: 16,
            }}
          >
            <Leaf style={{ width: 32, height: 32, color: '#10b981' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#f8fafc' }}>
            Garden Nursery is Quiet
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
            No published medicinal plants are available in the catalog yet. Browse our plant library or contribute botanical data to see species flourish in the 3D sanctuary!
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => refetch()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                background: '#10b981',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <RefreshCw style={{ width: 14, height: 14 }} />
              Refresh Catalog
            </button>
            <a
              href="/library"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.08)',
                color: '#e2e8f0',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Open Library
            </a>
          </div>
        </div>
      )}

      {/* Main HUD overlay (hidden during Photo Mode) */}
      {!isPhotoMode && (
        <HUD
          isLocked={isLocked}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          plantCount={plants.length}
          audioEnabled={audioEnabled}
          onToggleAudio={() => setAudioEnabled(!audioEnabled)}
          cameraMode={cameraMode}
          onToggleCameraMode={() => setCameraMode((m) => (m === 'fps' ? 'orbit' : 'fps'))}
          onViewFullGarden={() => {
            setSelectedPlant(null);
            setIsFullGardenView(true);
            setCameraMode('orbit');
          }}
        />
      )}

      {/* Interactive Minimap Radar with Click-to-Teleport */}
      {!isPhotoMode && (
        <GardenMinimap
          playerPos={playerPos}
          playerHeadingRad={playerHeading}
          onTeleport={(target) => setTeleportTarget(target)}
          visible={showMinimap && !selectedPlant && !placePlantId}
        />
      )}

      {/* Botanical Placement Mode Banner */}
      {placePlantId && !isPhotoMode && (
        <div
          style={{
            position: 'absolute',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            padding: '12px 24px',
            borderRadius: 10,
            color: 'white',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 'bold', margin: '0 0 4px 0' }}>Botanical Placement Active</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 8px 0' }}>Click anywhere on the terrain to plant this specimen.</p>
          <button
            onClick={() => {
              searchParams.delete('placePlantId');
              setSearchParams(searchParams);
              setGhostPosition(null);
            }}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cancel Placement
          </button>
        </div>
      )}

      {/* Selected Plant Info Side Sheet */}
      {!isPhotoMode && (
        <PlantInfoPanel plant={selectedPlant as any} onClose={() => setSelectedPlant(null)} />
      )}

      {/* Experience & Graphics Settings Modal */}
      <GardenSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTier={tier}
        onSelectTier={(newTier) => setTier(newTier)}
        timeOfDay={timeOfDay}
        onChangeTimeOfDay={(t) => setTimeOfDay(t)}
        audioVolume={audioVolume}
        onChangeAudioVolume={(v) => setAudioVolume(v)}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((prev) => !prev)}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion((prev) => !prev)}
      />

      {/* Debug Overlay (?debug=1) */}
      {!isPhotoMode && <DebugOverlay metrics={metrics} />}
    </div>
  );
}

export default VirtualGarden3DPage;
