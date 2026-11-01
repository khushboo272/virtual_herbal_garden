import type { LibraryPlant } from '../../../features/library/types/library.types';

export type PlantPartType =
  | 'leaves'
  | 'roots'
  | 'stem'
  | 'bark'
  | 'flowers'
  | 'seeds'
  | 'fruit'
  | 'resin'
  | 'whole_plant';

export interface PartMeshAnchor {
  part: string;
  label: string;
  position: [number, number, number];
  hasRealMesh: boolean;
  meshName?: string;
  targetObject?: any;
}

export type LightingPreset = 'studio' | 'garden' | 'greenhouse' | 'night';
export type BackgroundPreset = 'gradient' | 'white' | 'transparent' | 'garden' | 'sky';
export type ViewPreset = 'front' | 'side' | 'top' | 'closeup' | 'roots';
export type LabelDisplayMode = 'all' | 'pins' | 'off';
export type ViewerQualityTier = 'auto' | 'low' | 'medium' | 'high';
export type ViewerActiveTool = 'orbit' | 'pan' | 'measure';

export interface ViewerControlsState {
  zoom: number; // 10 to 100
  distanceM?: number; // real physical distance in meters
  rotation: number; // 0 to 360
  autoRotate: boolean;
  autoRotateSpeed: number;
  showLabels: boolean;
  labelMode?: LabelDisplayMode;
  isolatedPart: string | null;
  explodeAmount?: number; // 0 to 1
  clipPlaneY?: number | null; // cross-section plane
  wireframe: boolean;
  showGroundGrid: boolean;
  showScaleReference: boolean;
  activeTool?: ViewerActiveTool;
  qualityTier?: ViewerQualityTier;
  lightingPreset: LightingPreset;
  backgroundPreset: BackgroundPreset;
  growthStage?: string;
}

export interface PlantViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant?: LibraryPlant | null;
  plantSlug?: string;
  plantName?: string;
  botanicalName?: string;
  initialPart?: string;
}

export interface PlantViewer3DProps {
  plant: LibraryPlant;
  height?: string | number;
  interactive?: boolean;
  onSelectPart?: (part: string) => void;
  selectedPart?: string | null;
  className?: string;
}
