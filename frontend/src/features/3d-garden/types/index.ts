// ──────────────────────────────────────────────────────────
// types/index.ts — 3D Garden Domain Types
// ──────────────────────────────────────────────────────────

export type PlantHabit = 'HERB' | 'SHRUB' | 'TREE' | 'GRASS' | 'CLIMBER' | 'SUCCULENT' | 'ROOT';
export type LeafShape = 'LANCEOLATE' | 'OVATE' | 'HEART' | 'PINNATE' | 'SPIKY' | 'ROUND';
export type ModelStatus = 'NONE' | 'READY' | 'FAILED';

export interface PlantVisual {
  habit: PlantHabit;
  heightM: number;
  spreadM: number;
  foliageColor: string;
  flowerColor: string;
  leafShape: LeafShape;
}

export interface ModelTransform {
  scale: number;
  rotationY: number;
  offsetY: number;
  targetHeightM: number;
}

export interface IShowcasePlant {
  id: string;
  slug: string;
  commonName: string;
  scientificName: string;
  plantType: string;
  healthCategories: string[];
  visual: PlantVisual;
  modelUrl: string | null;
  lodUrl: string | null;
  modelVersion: number;
  modelStatus: ModelStatus;
  modelTransform: ModelTransform;
  globalPosition3D?: [number, number, number] | null;
  thumbnail?: string | null;
  createdAt?: string;
}

export interface PlantPlacement {
  position: [number, number, number];
  rotationY: number;
  zoneId: string;
  zoneSlug: string;
  isOverride?: boolean;
}

export interface PlacedShowcasePlant extends IShowcasePlant {
  placement: PlantPlacement;
}

export interface SceneMetrics {
  fps: number;
  drawCalls: number;
  triangles: number;
  qualityTier: 'low' | 'medium' | 'high';
  realModelCount: number;
  placeholderCount: number;
  totalPlants: number;
}

