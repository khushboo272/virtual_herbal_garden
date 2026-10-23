// Barrel exports for Tours Feature Module

// Public Pages
export { ToursHubPage } from './pages/ToursHubPage';
export { TourOverviewPage } from './pages/TourOverviewPage';
export { TourCheckpointPage } from './pages/TourCheckpointPage';
export { TourCompletionPage } from './pages/TourCompletionPage';

// Admin Pages
export { AdminToursListPage } from './admin/AdminToursListPage';
export { AdminTourEditorPage } from './admin/AdminTourEditorPage';
export { AdminTourAnalyticsPage } from './admin/AdminTourAnalyticsPage';

// Components
export { TourCard } from './components/TourCard';
export { AudioNarrationPlayer } from './components/AudioNarrationPlayer';
export { QuizSection } from './components/QuizSection';
export { ToursHero } from './components/ToursHero';
export { TourEducationalBanner } from './components/TourStates';

// Hooks
export { useTours } from './hooks/useTours';
export { useTour } from './hooks/useTour';
export { useTourProgress } from './hooks/useTourProgress';

// API
export {
  listTours,
  getTour,
  getMeProgress,
  getTourProgress,
  completeCheckpoint,
  submitQuiz,
  syncProgress,
  rateTour,
  restartTour,
  getAdminToursList,
  getAdminAnalytics,
  getTourAnalytics,
  createTour,
  updateTour,
  publishTour,
  unpublishTour,
  deleteTour,
  getToursByPlant,
} from './api/toursApi';

// Types
export type {
  Tour,
  TourSummary,
  TourLevel,
  TourCheckpoint,
  TourProgress,
  TourFacets,
  TourListParams,
  TourListResponse,
  QuizQuestion,
  QuizSubmissionResult,
  TourAdminListItem,
  TourAdminAnalytics,
  TourDetailAnalytics,
} from './types/tour.types';
