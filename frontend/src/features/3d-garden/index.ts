// ──────────────────────────────────────────────────────────
// features/3d-garden/index.ts — 3D Garden Feature Barrel
// Clean modular export surface for the 3D botanical garden
// ──────────────────────────────────────────────────────────

export { VirtualGarden3DPage, default as VirtualGarden3DPageDefault } from './pages/VirtualGarden3DPage';
export { Garden3DScene } from './scene/Garden3DScene';
export { GardenAtmosphere } from './scene/GardenAtmosphere';
export { GardenPostProcessing } from './scene/GardenPostProcessing';

// Landscaped Environments & Interactive Components
export { GardenTerrain } from './components/GardenTerrain';
export { GardenStructures } from './components/GardenStructures';
export { InstancedGrass } from './components/InstancedGrass';
export { GardenPond } from './components/GardenPond';
export { DecorativeTrees } from './components/DecorativeTrees';
export { FillerPlanting } from './components/FillerPlanting';
export { GardenProps } from './components/GardenProps';
export { GardenControls } from './components/GardenControls';
export { GardenSettingsModal } from './components/GardenSettingsModal';
export { GardenTeleportMenu } from './components/GardenTeleportMenu';
export { GardenMinimap } from './components/GardenMinimap';

// Plant Pipeline & Inspection
export { PlantInstance } from './components/PlantInstance';
export { ModelPlant, preloadPlantModels } from './components/ModelPlant';
export { ProceduralPlant } from './components/ProceduralPlant';
export { PlantLabels } from './components/PlantLabels';
export { PlantInfoPanel } from './components/PlantInfoPanel';
export { DebugOverlay, SceneMetricsCollector } from './components/DebugOverlay';

// Hooks & API
export { useShowcasePlants } from './hooks/useShowcasePlants';
export { useGardenQuality } from './hooks/useGardenQuality';
export { getShowcasePlants, reportModelError } from './api/gardenShowcaseApi';

// Utilities & Config
export { layoutShowcase, determineZoneSlug, HEALTH_CATEGORY_PRIORITY } from './utils/layoutShowcase';
export { normalizeModel } from './utils/normalizeModel';
export { getProceduralLeafTexture, clearLeafTextureCache } from './utils/leafCardGenerator';
export { ProceduralGardenSoundscape, gardenSoundscape } from './utils/proceduralAudio';
export { getGroundY, getTerrainSurfaceType, samplePathCorridor } from './utils/terrainGenerator';
export {
  GARDEN_CONFIG,
  GARDEN_QUALITY_TIERS,
  type GardenZoneConfig,
  type QualityTierName,
  type QualityTierConfig,
} from './gardenConfig';

export type {
  PlantHabit,
  LeafShape,
  ModelStatus,
  PlantVisual,
  ModelTransform,
  IShowcasePlant,
  PlantPlacement,
  PlacedShowcasePlant,
  SceneMetrics,
} from './types';
