// ─────────────────────────────────────────────────────
// VirtualGarden3DPage.tsx — Full immersive 3D garden
// Now uses Garden3DScene (AAA-quality Canvas wrapper)
// Keeps all existing UI: HUD, Minimap, PlantInfoPanel
// ─────────────────────────────────────────────────────
import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// AAA 3D Scene
import Garden3DScene from '../../components/Garden3DScene';
import type { ScenePlant } from '../../components/Garden3DScene';

// UI overlays (kept intact)
import { HUD } from '../components/3d/HUD';
import { MinimapOverlay } from '../components/3d/Minimap';
import { PlantInfoPanel } from '../components/3d/PlantInfoPanel';

// Hooks
import { useGardenPlants } from '../../hooks/useGardenPlants';
import type { Plant } from '../../lib/types';
import { api } from '../../lib/api';

export function VirtualGarden3DPage() {
  const { plants } = useGardenPlants();
  const [isLocked, setIsLocked] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cameraMode, setCameraMode] = useState<'fps' | 'orbit'>('fps');
  const [isFullGardenView, setIsFullGardenView] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const placePlantId = searchParams.get('placePlantId');
  const [ghostPosition, setGhostPosition] = useState<[number, number, number] | null>(null);

  // Map backend plant data to the shape expected by Garden3DScene
  const mappedPlants: ScenePlant[] = plants.map((p) => ({
    id: p._id,
    name: p.commonName,
    position: p.placement3d
      ? [p.placement3d.position.x, p.placement3d.position.y, p.placement3d.position.z] as [number, number, number]
      : [(Math.random() - 0.5) * 20, 0, (Math.random() - 0.5) * 20] as [number, number, number],
    modelUrl: p.model3dUrl ?? null,
    scale: p.placement3d?.scale ?? 1,
    color: p.color ?? '#2d7a3a',
  }));

  // Handle plant selection from 3D scene — find original plant data
  const handlePlantSelect = useCallback((scenePlant: ScenePlant) => {
    if (placePlantId) return; // Disable selection in placement mode
    setIsFullGardenView(false);
    const fullPlant = plants.find((p) => p._id === scenePlant.id);
    if (fullPlant) {
      setSelectedPlant(fullPlant);
      document.exitPointerLock?.();
    }
  }, [plants, placePlantId]);

  const handleGroundMove = useCallback((pos: [number, number, number]) => {
    if (placePlantId) {
      setGhostPosition(pos);
    }
  }, [placePlantId]);

  const handleGroundClick = useCallback(async (pos: [number, number, number]) => {
    if (placePlantId) {
      try {
        await api.patch(`/plants/${placePlantId}`, {
          placement3d: {
            position: { x: pos[0], y: pos[1], z: pos[2] },
            scale: 1.0,
            rotation: { x: 0, y: 0, z: 0 }
          },
          isVisibleInGarden: true
        });
        // The socket 'plant:updated' will handle adding it to the UI automatically.
      } catch (e) {
        console.error('Failed to place plant', e);
      }
      
      // Clean up param
      searchParams.delete('placePlantId');
      setSearchParams(searchParams);
      setGhostPosition(null);
    }
  }, [placePlantId, searchParams, setSearchParams]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#1a1a2e' }}>
      {/* AAA 3D Garden Scene */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Garden3DScene
          plants={mappedPlants}
          onPlantSelect={handlePlantSelect}
          selectedPlant={selectedPlant}
          cameraMode={cameraMode}
          ghostPosition={ghostPosition}
          audioEnabled={audioEnabled}
          isLocked={!!selectedPlant}
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
          onGroundMove={handleGroundMove}
          onGroundClick={handleGroundClick}
          isFullGardenView={isFullGardenView}
        />
      </div>

      {/* HUD overlays — unchanged */}
      <HUD
        isLocked={isLocked}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        plantCount={plants.length}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        cameraMode={cameraMode}
        onToggleCameraMode={() => setCameraMode(m => m === 'fps' ? 'orbit' : 'fps')}
        onViewFullGarden={() => {
          setSelectedPlant(null);
          setIsFullGardenView(true);
          setCameraMode('orbit'); // Full garden view makes more sense in orbit mode
        }}
      />

      {/* Minimap — unchanged */}
      <MinimapOverlay plants={plants} visible={showMinimap && !selectedPlant && !placePlantId} />

      {/* Placement mode overlay UI */}
      {placePlantId && (
        <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(0,0,0,0.7)', padding: '10px 20px', borderRadius: 8, color: 'white' }}>
          <h3>Placement Mode</h3>
          <p>Click on the ground to place the plant.</p>
          <button onClick={() => {
            searchParams.delete('placePlantId');
            setSearchParams(searchParams);
          }} style={{ background: 'red', color: 'white', padding: '5px 10px', borderRadius: 5 }}>Cancel</button>
        </div>
      )}

      {/* Plant info side panel — unchanged */}
      <PlantInfoPanel
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
      />
    </div>
  );
}
