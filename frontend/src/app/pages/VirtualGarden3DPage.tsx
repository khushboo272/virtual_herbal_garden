// ─────────────────────────────────────────────────────
// VirtualGarden3DPage.tsx — Full immersive 3D garden
// Now uses Garden3DScene (AAA-quality Canvas wrapper)
// Keeps all existing UI: HUD, Minimap, PlantInfoPanel
// ─────────────────────────────────────────────────────
import { useState, useCallback } from 'react';

// AAA 3D Scene
import Garden3DScene from '../../components/Garden3DScene';
import type { ScenePlant } from '../../components/Garden3DScene';

// UI overlays (kept intact)
import { HUD } from '../components/3d/HUD';
import { MinimapOverlay } from '../components/3d/Minimap';
import { PlantInfoPanel } from '../components/3d/PlantInfoPanel';

// Hooks
import { usePlants } from '../../hooks/usePlants';
import type { Plant } from '../../lib/types';

export function VirtualGarden3DPage() {
  const { plants } = usePlants({ limit: 50 });
  const [isLocked, setIsLocked] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);

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
    const fullPlant = plants.find((p) => p._id === scenePlant.id);
    if (fullPlant) {
      setSelectedPlant(fullPlant);
      document.exitPointerLock?.();
    }
  }, [plants]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#1a1a2e' }}>
      {/* AAA 3D Garden Scene */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Garden3DScene
          plants={mappedPlants}
          onPlantSelect={handlePlantSelect}
          audioEnabled={audioEnabled}
          isLocked={!!selectedPlant}
          onLock={() => setIsLocked(true)}
          onUnlock={() => setIsLocked(false)}
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
      />

      {/* Minimap — unchanged */}
      <MinimapOverlay plants={plants} visible={showMinimap && !selectedPlant} />

      {/* Plant info side panel — unchanged */}
      <PlantInfoPanel
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
      />
    </div>
  );
}
