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

export type LightingPreset = 'studio' | 'garden' | 'night';
export type BackgroundPreset = 'gradient' | 'white' | 'transparent' | 'garden';
export type ViewPreset = 'front' | 'side' | 'top' | 'closeup';

export interface ViewerControlsState {
  zoom: number; // 10 to 100
  rotation: number; // 0 to 360
  autoRotate: boolean;
  autoRotateSpeed: number;
  showLabels: boolean;
  isolatedPart: string | null;
  wireframe: boolean;
  showGroundGrid: boolean;
  showScaleReference: boolean;
  lightingPreset: LightingPreset;
  backgroundPreset: BackgroundPreset;
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
