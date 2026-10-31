# 3D Garden Configuration & Tuning Guide (`GARDEN_TUNING.md`)

All operational, botanical, and visual parameters of the 3D Herbal Garden are centralized in [`frontend/src/features/3d-garden/gardenConfig.ts`](file:///frontend/src/features/3d-garden/gardenConfig.ts).

This document serves as the authoritative reference guide explaining each configuration property, safe tuning ranges, performance budgets, and texture expansion conventions.

---

## 1. Graphics Quality Tiers (`GARDEN_QUALITY_TIERS`)

The garden features four distinct rendering quality tiers designed to scale from battery-saving mobile devices to high-end desktop workstations:

| Quality Property | `LOW` (Mobile) | `MEDIUM` (Integrated GPU) | `HIGH` (Recommended) | `ULTRA` (Dedicated GPU) | Unit / Description |
|---|---|---|---|---|---|
| **Max DPR Cap** | `1.0` | `1.25` | `1.5` | `1.75` | Device Pixel Ratio limit (budget strictly capped $\le 1.75$). |
| **Shadows Enabled** | `false` | `true` | `true` | `true` | Directional sun soft shadow mapping. |
| **Shadow Map Size** | `512` | `1024` | `2048` | `2048` | Shadow map resolution in pixels. |
| **Shadow Distance** | `30m` | `50m` | `75m` | `90m` | Shadow frustum depth tracking around the player. |
| **Instanced Grass Blades** | `0` | `7,500` | `18,000` | `32,000` | Single-draw-call living meadow grass blades. |
| **Decorative Botanical Trees** | `6` | `12` | `20` | `28` | Willow, Cherry, Pine, Oak trees replacing blobs. |
| **Ornamental Filler Planting** | `15` | `35` | `60` | `90` | Hydrangeas, Lavender, Fountain Grasses & Groundcover. |
| **Water Quality** | `low` | `medium` | `high` | `ultra` | Procedural ripple detail & shoreline foam resolution. |
| **Ambient Particles** | `false` | `true` | `true` | `true` | Waterfall spray and night fireflies. |
| **N8AO Ambient Occlusion** | `false` | `false` | `true` | `true` | Screen-space contact shadows and depth shading. |
| **Post-Processing Bloom** | `false` | `true` | `true` | `true` | Subtle glint on lanterns and sunlight water ripples. |
| **SMAA Anti-Aliasing** | `false` | `true` | `true` | `true` | Subpixel Morphological Anti-Aliasing (zero blur). |

---

## 2. Atmosphere, Sky & Diurnal Cycle (`atmosphere`)

| Parameter | Default | Safe Range | Description |
|-----------|---------|------------|-------------|
| `sunDistance` | `250` | `150 – 500` | Distance of the directional sun light from garden center in meters. |
| `fogNear` | `25` | `10 – 60` | Near distance for atmospheric height fog. |
| `fogFar` | `140` | `80 – 250` | Far distance where fog reaches full atmospheric density. |
| `toneMappingExposure` | `1.05` | `0.7 – 1.4` | Base ACES Filmic exposure; automatically adjusted between 0.35 (midnight) and 1.15 (noon). |
| `maxPointLights` | `6` | `4 – 8` | Strictly enforces the performance cap on active nocturnal lantern point lights. |

---

## 3. Topography, Terrain & Pathways (`terrain`, `structures`)

The terrain is computed continuously via deterministic Simplex noise and exported as `getGroundY(x, z)` and `getTerrainSurfaceType(x, z)`:

| Parameter | Default | Safe Range | Description |
|-----------|---------|------------|-------------|
| `terrain.size` | `110m` | `80 – 200m` | Overall width and depth of the terrain mesh plane. |
| `terrain.resolution` | `128` | `64 – 256` | Vertex subdivision count along each edge (16,384 quads). |
| `terrain.heightScale` | `2.8m` | `1.0 – 6.0m` | Maximum vertical displacement for peripheral rolling berms. |
| `terrain.noiseScale` | `0.038` | `0.01 – 0.08` | Frequency of Simplex topographical displacement noise. |
| `terrain.plazaRadius` | `10.5m` | `8.0 – 16.0m` | Radius of the leveled central stone promenade. |
| `structures.pathWidth` | `2.2m` | `1.5 – 3.5m` | Width of the graded gravel paths radiating to each zone bed. |
| `structures.retainingWallRadius` | `10.8m` | `9.0 – 18.0m` | Curved split-level stone wall bordering the plaza. |
| `structures.raisedBedStoneHeight` | `0.45m` | `0.2 – 0.8m` | Height of the limestone kerbing surrounding each medicinal bed. |

---

## 4. Water Sanctuary (`water`)

| Parameter | Default | Safe Range | Description |
|-----------|---------|------------|-------------|
| `waterLevel` | `-0.28m` | `-0.8 – 0.2m` | Y-elevation of the pond water surface mesh. |
| `waterColor` | `#104e5b` | Hex Color | Deep aquatic absorption tint. |
| `waterShallowColor` | `#48cae4` | Hex Color | Translucent shoreline color. |
| `foamColor` | `#f0fdfa` | Hex Color | Crest foam and edge boundary contact color. |
| `waveSpeed` | `0.85` | `0.2 – 2.0` | Time frequency of the procedural Gerstner ripple shader. |
| `waterfallHeight` | `2.6m` | `1.5 – 4.5m` | Elevation of the upper rock cascade shelf. |

---

## 5. Post-Processing Chain (`postProcessing`)

To completely eliminate image blur and chromatic aberration while retaining cinematic realism:

- **ChromaticAberration:** Completely removed from all runtime pipelines.
- **Global Blur / Bokeh:** Depth of Field is disabled during standard navigation and active **only** during Photo Mode.
- **Anti-Aliasing:** SMAA replaces low-grade FXAA/TAA for sharp botanical foliage edges without ghosting.
- **Bloom:**
  - `bloomThreshold: 0.92` (strictly $\ge 0.90$ to avoid washed-out grass or sky).
  - `bloomIntensity: 0.28` (strictly $\le 0.35$ for subtle glint on water and lanterns).
- **Ambient Occlusion (N8AO):**
  - `n8aoRadius: 1.8m`
  - `n8aoIntensity: 1.4` (only enabled on `HIGH` and `ULTRA` tiers).
- **Vignette:**
  - `vignetteDarkness: 0.18` (strictly $\le 0.20$ to avoid dark borders).

---

## 6. Camera & Navigation Controls (`camera`)

| Parameter | Default | Safe Range | Description |
|-----------|---------|------------|-------------|
| `fov` | `65` | `45 – 85` | Field of view in degrees. |
| `near` | `0.1m` | `0.05 – 0.2m` | Near clipping plane in meters. |
| `far` | `3000m` | `1000 – 5000m` | Far clipping plane (ensures procedural sky dome is never clipped). |
| `initialPosition` | `[0, 2.5, 12]` | Any vector | Starting spawn coordinates in the central plaza facing north. |
| `walkSpeed` | `4.5 m/s` | `2.0 – 8.0` | Base walking velocity in FPS mode. |
| `runSpeed` | `8.0 m/s` | `5.0 – 14.0` | Sprint velocity when holding `Shift`. |
| `eyeHeight` | `1.75m` | `1.4 – 2.0m` | Vertical eye offset above the continuous ground elevation `getGroundY(x, z)`. |
| `worldBounds` | `48m` | `30 – 100m` | Radius from garden center where the perimeter boundary wall halts movement. |

---

## 7. How to Add CC0 PBR Textures (Zero-Code Drop-In)

The procedural canvas textures serve as zero-asset fallbacks. To upgrade the garden with photorealistic CC0 PBR textures (e.g. from AmbientCG or PolyHaven):

1. Place 1k or 2k texture maps in the `frontend/public/garden/textures/` folder:
   ```
   frontend/public/garden/textures/
   ├── pavers_diffuse.jpg
   ├── pavers_normal.jpg
   ├── pavers_roughness.jpg
   ├── gravel_diffuse.jpg
   ├── gravel_normal.jpg
   ├── grass_diffuse.jpg
   ├── grass_normal.jpg
   ├── stone_diffuse.jpg
   ├── stone_normal.jpg
   └── bark_diffuse.jpg
   ```
2. When these image files are present, `GardenTerrain.tsx` and `GardenStructures.tsx` automatically bind the image textures in place of the procedural HTML5 canvas noise generator.

---

## 8. Performance Budget Guidelines

- **Target Framerate:** 60 FPS on mid-range laptops (`MEDIUM`), 30+ FPS on mobile devices (`LOW`).
- **Instancing:** Never instantiate individual foliage meshes; all grass blades and leaves must use `THREE.InstancedMesh`.
- **Active Lights:** Never exceed 6 active point lights in the scene.
- **GPU Resource Disposal:** Always call `.dispose()` on geometries, materials, and canvas textures on component unmount.
