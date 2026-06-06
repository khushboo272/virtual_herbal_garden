const R2_BASE = import.meta.env.VITE_R2_PUBLIC_URL;
const R2_PREFIX = `${R2_BASE}/assets-for-r2`;

export const ASSETS = {
  hdri: {
    day: `${R2_PREFIX}/hdri/forest_day.hdr`,
    sunset: `${R2_PREFIX}/hdri/sunset_mountain.hdr`,
    night: `${R2_PREFIX}/hdri/night_stars.hdr`,
  },
  models: {
    plants: {
      tulsi: `${R2_PREFIX}/models/plants/tulsi.glb`,
      aloevera: `${R2_PREFIX}/models/plants/aloevera.glb`,
      bamboo: `${R2_PREFIX}/models/plants/bamboo.glb`,
      lungwort: `${R2_PREFIX}/models/plants/lungwort_spring.glb`,
    },
    environment: {
      river: `${R2_PREFIX}/models/environment/river_bed.glb`,
      rocks: `${R2_PREFIX}/models/environment/rocks_set.glb`,
      birds: `${R2_PREFIX}/models/environment/bird_flock.glb`,
      fence: `${R2_PREFIX}/models/environment/bamboo_fence.glb`,
      cottage: `${R2_PREFIX}/models/environment/cottage_backdrop.glb`,
      path: `${R2_PREFIX}/models/environment/stone_path.glb`,
    },
    props: {
      bench: `${R2_PREFIX}/models/props/garden_bench.glb`,
      lantern: `${R2_PREFIX}/models/props/stone_lantern.glb`,
      tree: `${R2_PREFIX}/models/props/tree_01.glb`,
    },
  },
  sounds: {
    river: `${R2_PREFIX}/sounds/river_loop.mp3`,
    windLight: `${R2_PREFIX}/sounds/wind_light.mp3`,
    windStrong: `${R2_PREFIX}/sounds/wind_strong.mp3`,
    birds: `${R2_PREFIX}/sounds/birds_day.mp3`,
    crickets: `${R2_PREFIX}/sounds/crickets_night.mp3`,
    night: `${R2_PREFIX}/sounds/night_ambient.mp3`,
    leafClick: `${R2_PREFIX}/sounds/leaf_click.mp3`,
    planted: `${R2_PREFIX}/sounds/plant_placed.mp3`,
    uiClick: `${R2_PREFIX}/sounds/ui_click.mp3`,
  },
  textures: {
    grassDiff: `${R2_PREFIX}/textures/grass/grass_diff_2k.jpg`,
    grassNormal: `${R2_PREFIX}/textures/grass/grass_nor_gl_2k.jpg`,
    grassRough: `${R2_PREFIX}/textures/grass/grass_rough_2k.jpg`,
    waterNormals: `${R2_PREFIX}/textures/waternormals.jpg`,
    cobblestone: `${R2_PREFIX}/textures/stone/cobblestone_diff_2k.jpg`,
    dirt: `${R2_PREFIX}/textures/dirt/dirt_diff_2k.jpg`,
  },
};

export const getPlantModelUrl = (slug: string) =>
  `${R2_PREFIX}/models/plants/${slug}.glb`;
