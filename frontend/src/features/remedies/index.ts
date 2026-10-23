// Remedies Feature Module — barrel exports

// Pages
export { RemediesPage } from './pages/RemediesPage';
export { RemedyDetailPage } from './pages/RemedyDetailPage';

// Components
export { RemedyCard } from './components/RemedyCard';
export { RemediesHero } from './components/RemediesHero';
export {
  RemediesSkeleton,
  EmptyRemedies,
  RemediesError,
  MedicalSafetyDisclaimer,
} from './components/RemedyStates';

// Hooks
export { useRemedySearch } from './hooks/useRemedySearch';
export { useRemedy } from './hooks/useRemedy';
export { useRemedyFavorite, useShare } from './hooks/useRemedyFavorite';

// API
export {
  listRemedies,
  getRemedy,
  getRelatedRemedies,
  getRemediesByPlant,
  addRemedyFavorite,
  removeRemedyFavorite,
  getRemedyBookmarks,
} from './api/remediesApi';

// Types
export type {
  Remedy,
  RemedyIngredient,
  RemedyPreparationStep,
  RemedySearchParams,
  RemedyMeta,
  HealthFacet,
  DifficultyFacet,
  PlantSummary,
} from './types/remedy.types';
