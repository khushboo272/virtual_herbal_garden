// Library feature — barrel exports
// Pages
export { LibraryPage } from './pages/LibraryPage';
export { PlantDetailPage } from './pages/PlantDetailPage';

// Components
export { PlantImage } from './components/PlantImage';
export { PlantCard } from './components/PlantCard';
export { SearchBar } from './components/SearchBar';
export { FiltersSidebar } from './components/FiltersSidebar';
export { LibrarySkeleton, PlantCardSkeleton, EmptyResults, LibraryError } from './components/LibraryStates';

// Hooks
export { usePlantSearch } from './hooks/usePlantSearch';
export { usePlant, usePlantReviews } from './hooks/usePlant';
export { useAutocomplete } from './hooks/useAutocomplete';
export { useFavorite, useShare } from './hooks/useFavorite';
export { useDebounce } from './hooks/useDebounce';

// Types
export type {
  LibraryPlant,
  PlantImage as PlantImageType,
  PlantReview,
  AutocompleteResult,
  LibraryMeta,
  SearchParams,
  SearchResult,
  FacetBucket,
  GrowingConditions,
} from './types/library.types';
