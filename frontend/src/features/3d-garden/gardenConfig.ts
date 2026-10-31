// ─────────────────────────────────────────────────────
// gardenConfig.ts — All Tunable Parameters for 3D Garden
// Centralized configuration for scene, procedural engine,
// camera, zones, quality tiers, terrain, water, and lighting.
// ─────────────────────────────────────────────────────

export type QualityTierName = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export interface QualityTierConfig {
  name: QualityTierName;
  label: string;
  description: string;
  dpr: number;
  shadows: boolean;
  shadowMapSize: number;
  shadowDistance: number;
  grassDensity: number;
  treeCount: number;
  fillerCount: number;
  waterQuality: 'low' | 'medium' | 'high' | 'ultra';
  particles: boolean;
  n8ao: boolean;
  bloom: boolean;
  smaa: boolean;
}

export const GARDEN_QUALITY_TIERS: Record<QualityTierName, QualityTierConfig> = {
  LOW: {
    name: 'LOW',
    label: 'Low (Battery / Mobile)',
    description: 'Optimized for mobile devices and integrated GPUs. No shadows, fast shaders.',
    dpr: 1.0,
    shadows: false,
    shadowMapSize: 512,
    shadowDistance: 30,
    grassDensity: 0,
    treeCount: 6,
    fillerCount: 15,
    waterQuality: 'low',
    particles: false,
    n8ao: false,
    bloom: false,
    smaa: false,
  },
  MEDIUM: {
    name: 'MEDIUM',
    label: 'Medium (Balanced)',
    description: 'Targeted for 60 fps on mid-range laptops. Soft shadows, light grass, bloom.',
    dpr: 1.25,
    shadows: true,
    shadowMapSize: 1024,
    shadowDistance: 50,
    grassDensity: 7500,
    treeCount: 12,
    fillerCount: 35,
    waterQuality: 'medium',
    particles: true,
    n8ao: false,
    bloom: true,
    smaa: true,
  },
  HIGH: {
    name: 'HIGH',
    label: 'High (Recommended)',
    description: 'Crisp resolution, lush grass, N8AO ambient occlusion, reflective pond.',
    dpr: 1.5,
    shadows: true,
    shadowMapSize: 2048,
    shadowDistance: 75,
    grassDensity: 18000,
    treeCount: 20,
    fillerCount: 60,
    waterQuality: 'high',
    particles: true,
    n8ao: true,
    bloom: true,
    smaa: true,
  },
  ULTRA: {
    name: 'ULTRA',
    label: 'Ultra (Maximum Fidelity)',
    description: 'High-density botanical flora, maximum shadow distance, full post-processing.',
    dpr: 1.75, // Capped at 1.75 per hard rule
    shadows: true,
    shadowMapSize: 2048,
    shadowDistance: 100,
    grassDensity: 30000,
    treeCount: 28,
    fillerCount: 85,
    waterQuality: 'ultra',
    particles: true,
    n8ao: true,
    bloom: true,
    smaa: true,
  },
};

export interface GardenZoneConfig {
  id: string;
  slug: string;
  label: string;
  center: [number, number, number];
  bedSize: [number, number]; // [width (X), depth (Z)]
  shape: 'RECT' | 'OVAL';
  themeColor: string;
  signPosition: [number, number, number];
}

export const GARDEN_CONFIG = {
  // ── Quality Defaults ──
  quality: {
    storageKey: 'vhg_garden_quality',
    defaultDesktopTier: 'HIGH' as QualityTierName,
    defaultMobileTier: 'LOW' as QualityTierName,
    featureFlagKey: 'experience.3dPostProcessing',
  },

  // ── Camera & Navigation ──
  camera: {
    fov: 65,
    near: 0.1,
    far: 3000, // Fixed clipping distance ensuring sky dome fits from every viewpoint
    initialPosition: [0, 2.5, 12] as [number, number, number],
    walkSpeed: 4.5,
    runSpeed: 8.0,
    eyeHeight: 1.75,
    orbitTarget: [0, 1.2, 0] as [number, number, number],
    worldBounds: 48, // meters from center before wall barrier
  },

  // ── Zones around central plaza (0, 0, 0) ──
  zones: [
    {
      id: 'zone-immunity',
      slug: 'immunity',
      label: 'Immunity Sanctuary',
      center: [0, 0.4, -13],
      bedSize: [10, 8],
      shape: 'OVAL',
      themeColor: '#10b981', // emerald
      signPosition: [0, 0.5, -8.0],
    },
    {
      id: 'zone-digestion',
      slug: 'digestion',
      label: 'Digestive Herb Bed',
      center: [13, 0.3, -9],
      bedSize: [10, 8],
      shape: 'RECT',
      themeColor: '#84cc16', // lime
      signPosition: [8.0, 0.5, -9],
    },
    {
      id: 'zone-skin-care',
      slug: 'skin-care',
      label: 'Skin & Beauty Glade',
      center: [15, 0.3, 6],
      bedSize: [10, 8],
      shape: 'OVAL',
      themeColor: '#f59e0b', // amber
      signPosition: [10.0, 0.5, 6],
    },
    {
      id: 'zone-respiratory',
      slug: 'respiratory',
      label: 'Respiratory Meadow',
      center: [9, 0.2, 14],
      bedSize: [10, 8],
      shape: 'RECT',
      themeColor: '#06b6d4', // cyan
      signPosition: [9, 0.5, 9.5],
    },
    {
      id: 'zone-pain-relief',
      slug: 'pain-relief',
      label: 'Pain & Inflammation Bed',
      center: [-9, 0.2, 14],
      bedSize: [10, 8],
      shape: 'RECT',
      themeColor: '#ef4444', // red
      signPosition: [-9, 0.5, 9.5],
    },
    {
      id: 'zone-stress-sleep',
      slug: 'stress-sleep',
      label: 'Stress Relief & Adaptogens',
      center: [-15, 0.3, 6],
      bedSize: [10, 8],
      shape: 'OVAL',
      themeColor: '#8b5cf6', // purple
      signPosition: [-10.0, 0.5, 6],
    },
    {
      id: 'zone-heart-health',
      slug: 'heart-health',
      label: 'Heart & Cardio Garden',
      center: [-13, 0.3, -9],
      bedSize: [10, 8],
      shape: 'RECT',
      themeColor: '#ec4899', // pink
      signPosition: [-8.0, 0.5, -9],
    },
    {
      id: 'zone-womens-health',
      slug: 'womens-health',
      label: "Women's Health Grove",
      center: [-6, 0.5, -19],
      bedSize: [10, 8],
      shape: 'OVAL',
      themeColor: '#f43f5e', // rose
      signPosition: [-6, 0.5, -14.0],
    },
    {
      id: 'zone-blood-sugar',
      slug: 'blood-sugar',
      label: 'Metabolic & Vitality Bed',
      center: [6, 0.5, -19],
      bedSize: [10, 8],
      shape: 'RECT',
      themeColor: '#3b82f6', // blue
      signPosition: [6, 0.5, -14.0],
    },
    {
      id: 'zone-fever',
      slug: 'fever',
      label: 'Antipyretic & Cooling Flora',
      center: [0, 0.2, 18],
      bedSize: [10, 8],
      shape: 'RECT',
      themeColor: '#f97316', // orange
      signPosition: [0, 0.5, 13.5],
    },
    // Overflow Meadow
    {
      id: 'zone-meadow',
      slug: 'meadow',
      label: 'Wild Botanical Meadow (Catalog Overflow)',
      center: [0, 0.4, 28],
      bedSize: [28, 16],
      shape: 'RECT',
      themeColor: '#22c55e', // green
      signPosition: [0, 0.5, 19.5],
    },
  ] as GardenZoneConfig[],

  // ── Terrain & Topography ──
  terrain: {
    size: 110, // width & depth in meters
    resolution: 128, // vertices along edge
    heightScale: 2.8,
    noiseScale: 0.038,
    plazaRadius: 10.5,
    plazaElevation: 0.0,
    pondCenter: [19, -0.9, 19] as [number, number, number],
    pondRadius: 8.5,
    wallHeight: 0.75,
    wallWidth: 0.4,
  },

  // ── Landscaped Structures ──
  structures: {
    pergolaPosition: [0, 0, 16] as [number, number, number],
    pathWidth: 2.1,
    retainingWallRadius: 10.8,
    raisedBedStoneHeight: 0.32,
    lanternRadius: 0.35,
    maxActivePointLights: 6, // Hard rule: capped at 6 active point lights
  },

  // ── Pond & Water Shader ──
  water: {
    waterColor: '#002b28',
    waterShallowColor: '#007065',
    foamColor: '#e0f7fa',
    distortionSpeed: 0.6,
    distortionStrength: 0.06,
    waterLevel: -0.25,
    waterfallPosition: [24, 2.4, 24] as [number, number, number],
  },

  // ── Sky, Atmosphere & Diurnal Light ──
  atmosphere: {
    skyDistance: 2500, // Safely within camera.far
    fogColorDay: '#cfe8e1',
    fogColorNight: '#040b15',
    fogDensityDay: 0.003,
    fogDensityNight: 0.006,
    dayCycleDurationSeconds: 180, // 3 min per full day/night cycle
    sunDistance: 150,
  },

  // ── Post Processing ──
  postProcessing: {
    bloomThreshold: 0.92,
    bloomIntensity: 0.28,
    n8aoRadius: 1.4,
    n8aoIntensity: 0.85,
    vignetteDarkness: 0.18, // Hard rule: <= 0.2
    vignetteOffset: 0.35,
    photoModeBokehScale: 3.0,
    photoModeFocalLength: 0.04,
  },

  // ── Plant Rendering & Model Pipeline ──
  rendering: {
    maxPreloadCount: 8,
    lodDistance: 25, // meters to switch to LOD or procedural cards
    maxDrawDistance: 90, // meters to cull non-vital plants
    modelSizeLimitBytes: 15 * 1024 * 1024,
    hoverScale: 1.08,
    selectionRingRadius: 0.9,
    selectionRingWidth: 0.25,
    ringColor: '#a7f3d0',
    selectionOutlineColor: '#10b981',
  },

  // ── Text & Labels ──
  labels: {
    fontSize: 0.26,
    maxVisibleDistance: 20, // fade out beyond this radius
    fadeStartDistance: 14,
    outlineWidth: 0.025,
    outlineColor: '#0f172a',
    textColor: '#ffffff',
    plateWidth: 1.2,
    plateHeight: 0.35,
    plateColor: '#1e293b',
  },

  // ── Procedural Botanical Engine ──
  procedural: {
    triangleBudget: {
      herb: 2000,
      tree: 8000,
    },
    instancesPerHabit: {
      HERB: 12,
      SHRUB: 20,
      TREE: 36,
      GRASS: 28,
      CLIMBER: 18,
      SUCCULENT: 14,
      ROOT: 14,
    },
    leafAlphaTextureResolution: 128,
    windSwaySpeed: 1.1,
    windSwayStrength: 0.022,
    defaultColors: {
      foliage: '#2d7a3a',
      flower: '#f8bbd0',
      trunk: '#4a3319',
      trellis: '#8d6e63',
    },
  },

  // ── Debug Overlay ──
  debug: {
    queryParam: 'debug',
    refreshRateMs: 400,
  },
} as const;
