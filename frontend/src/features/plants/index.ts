// Plants feature module — now re-exports from the library feature module.
// Existing consumers (3D garden, dashboard) continue to work unchanged.
export { LibraryPage as PlantLibraryPage, PlantDetailPage } from '../library';
export { PlantImage } from '../library/components/PlantImage';
export { usePlantSearch, usePlant } from '../library';
