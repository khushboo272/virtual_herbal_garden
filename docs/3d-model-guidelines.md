# 3D Botanical Model Guidelines — Virtual Herbal Garden

This document defines the naming conventions, geometry constraints, and asset preparation guidelines for 3D GLB/GLTF models in the Virtual Herbal Garden.

---

## 1. Node Naming Conventions for Interactive Parts

The **Plant 3D Viewer** automatically links botanical parts defined in the plant monograph (`partsUsed`) to meshes in the 3D scene using node names.

Uploaders and 3D artists must name object nodes using the `part_<name>` prefix or standard botanical terms:

| Botanical Part | Preferred Node Name | Alternative Accepted Substrings |
| :--- | :--- | :--- |
| **Leaves** | `part_leaves` | `leaf`, `leaves`, `foliage` |
| **Roots** | `part_roots` | `root`, `roots`, `rhizome`, `tuber`, `bulb` |
| **Stem / Trunk** | `part_stem` | `stem`, `stalk`, `trunk`, `branch`, `shoot` |
| **Bark** | `part_bark` | `bark`, `wood` |
| **Flowers** | `part_flowers` | `flower`, `flowers`, `petal`, `blossom`, `bloom` |
| **Seeds** | `part_seeds` | `seed`, `seeds`, `pod`, `grain` |
| **Fruit** | `part_fruit` | `fruit`, `fruits`, `berry`, `drupe` |
| **Resin / Sap** | `part_resin` | `resin`, `sap`, `latex`, `gum` |

> [!TIP]
> If a 3D model does not have separated or named mesh nodes, the viewer gracefully falls back to anatomical proportional anchors based on the plant's bounding volume. However, named nodes ensure 100% precision when highlighting parts.

---

## 2. Geometry & Origin Requirements

- **Origin**: Base center at `(0, 0, 0)` on the ground plane (Y=0). Roots may extend below `Y = 0`.
- **Scale**: Real-world scale in **meters** (e.g. 0.6m for a small Tulsi shrub, 1.8m for a large shrub, 4m for Neem tree).
- **Triangle Budget**:
  - Herbs & small shrubs: $\le 15,000$ triangles
  - Medium plants & climbers: $\le 30,000$ triangles
  - Trees: $\le 60,000$ triangles
- **Foliage Materials**:
  - Double-sided rendering enabled (`DoubleSide`).
  - Transparent foliage with crisp alpha clipping (`alphaTest: 0.5`).
  - Base color textures encoded in **sRGB**.

---

## 3. Compression & File Formats

- Container format: **Binary glTF (`.glb`)**.
- Preferred compression: **Draco geometry compression** or **Meshopt** for reduced network payload.
- File size limit: Under **15 MB** (ideally $\le 5$ MB).
- Storage layout in Cloudflare R2: `models/<plant-slug>.glb`.

