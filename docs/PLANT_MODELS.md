# Botanical 3D Asset Guidelines (`PLANT_MODELS.md`)

This guide specifies technical standards for 3D digital botanical assets uploaded to the **Virtual Herbal Garden** platform.

---

## 1. Supported File Format & Size Limits

- **Format:** Binary glTF (`.glb` only). glTF JSON (`.gltf` + `.bin`) is rejected by backend magic byte inspection.
- **Maximum File Size:** 15 MB per model file (LOD0); 5 MB for LOD1/LOD2.
- **Compression:** Draco geometry compression and Meshopt compression are supported by the frontend decoders.

---

## 2. Geometry & Polycount Budget

Botanical specimens are rendered in a real-time interactive 3D garden alongside dozens of other active species. Assets must adhere strictly to these triangle budgets:

| Level of Detail | Triangle Budget | View Distance | Purpose |
|-----------------|-----------------|---------------|---------|
| **LOD 0** (High Detail) | < 40,000 triangles | 0 m – 25 m | Close inspection, first-person exploration |
| **LOD 1** (Medium Detail) | < 10,000 triangles | 25 m – 60 m | Mid-ground garden view |
| **LOD 2** (Low Detail / Billboards) | < 2,000 triangles | 60 m+ | Horizon / background rendering |

---

## 3. Pivot, Origin, and Scale Conventions

- **Origin (Pivot Point):** The model base-center must be placed at local `(0, 0, 0)`.
  - Base of the trunk or root crown must sit on the ground plane ($Y = 0$).
  - Underground root structures (if included) should extend into negative $Y$ ($Y < 0$).
- **Up Axis:** $+Y$ Up, $+Z$ Forward.
- **Scale:** Modeled in 1 unit = 1 meter real-world scale (e.g., a 0.6 m Tulsi plant is 0.6 units high).
  - Even if arbitrary scale is provided, the platform's `normalizeModel()` engine automatically fits the model to `targetHeightM` or `visual.heightM`, but modeling to 1:1 scale is strongly recommended.

---

## 4. Materials & Textures

- **Material Model:** PBR Metallic-Roughness (`MeshStandardMaterial`).
- **Texture Resolutions:**
  - Base Color / Alpha: 2048 × 2048 maximum (1024 × 1024 preferred for herbs).
  - Roughness / Metallic / Ambient Occlusion (packed ORM): 1024 × 1024.
  - Normal Map: 1024 × 1024.
- **Alpha Cards & Foliage:**
  - Double-sided materials enabled by platform runtime.
  - Transparent leaf cards must use clean alpha masks with `alphaTest >= 0.05` to prevent sorting artifacts.

---

## 5. Upload Workflow

1. Navigate to **Botanist Portal** or **Admin Content Management**.
2. Edit or create a medicinal plant entry.
3. Open the **3D Model & Appearance** section:
   - Configure **Growth Habit** (`HERB`, `SHRUB`, `TREE`, `GRASS`, `CLIMBER`, `SUCCULENT`, `ROOT`).
   - Set expected **Height (m)** and **Spread (m)**.
   - Upload the primary `.glb` file.
   - (Optional) Upload the secondary `.glb` LOD file.
   - Adjust fine transforms: **Scale Multiplier**, **Y Rotation**, **Vertical Offset**, and **Target Height**.
4. Save the entry. Upon publishing, the plant immediately hot-swaps live in the 3D garden via WebSockets without requiring a page reload.

