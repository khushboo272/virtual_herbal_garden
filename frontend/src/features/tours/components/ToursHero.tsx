import { Search, Compass, Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TourEducationalBanner } from './TourStates';
import type { TourFacets, TourLevel, Tour } from '../types/tour.types';

interface ToursHeroProps {
  searchInput: string;
  onSearchChange: (text: string) => void;
  activeHealth?: string;
  onSelectHealth: (slug?: string) => void;
  activeLevel?: TourLevel;
  onSelectLevel: (level?: TourLevel) => void;
  activeSort: 'featured' | 'newest' | 'shortest';
  onSelectSort: (sort: 'featured' | 'newest' | 'shortest') => void;
  facets: TourFacets;
  continueTour?: {
    tour: Tour;
    percent: number;
    lastCheckpointTitle?: string;
  } | null;
}

const LEVELS: Array<{ id?: TourLevel; label: string }> = [
  { id: undefined, label: 'All Levels' },
  { id: 'BEGINNER', label: 'Beginner' },
  { id: 'INTERMEDIATE', label: 'Intermediate' },
  { id: 'ADVANCED', label: 'Advanced' },
];

export function ToursHero({
  searchInput,
  onSearchChange,
  activeHealth,
  onSelectHealth,
  activeLevel,
  onSelectLevel,
  activeSort,
  onSelectSort,
  facets,
  continueTour,
}: ToursHeroProps) {
  return (
    <div className="mb-10">
      {/* Educational Safety Banner */}
      <TourEducationalBanner />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-4">
          <Compass className="w-3.5 h-3.5" />
          Interactive Learning Pathways
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-green-950 tracking-tight mb-4">
          Guided Virtual Tours
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Embark on structured botanical journeys through ancient traditional systems, step-by-step checkpoints, and server-scored knowledge quizzes.
        </p>
      </div>

      {/* "Continue where you left off" Card */}
      {continueTour && continueTour.percent < 100 && (
        <div className="mb-8 max-w-3xl mx-auto bg-gradient-to-r from-emerald-900 to-green-800 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-300 uppercase mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                Continue Where You Left Off
              </div>
              <h3 className="text-xl font-bold text-white mb-1">
                {continueTour.tour.title}
              </h3>
              <p className="text-sm text-emerald-100/90 mb-3">
                {continueTour.lastCheckpointTitle
                  ? `Last stop: ${continueTour.lastCheckpointTitle}`
                  : `${continueTour.percent}% Completed`}
              </p>
              <div className="w-48 h-2 bg-emerald-950/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${continueTour.percent}%` }}
                />
              </div>
            </div>

            <Link
              to={`/virtual-tour/${continueTour.tour.slug}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-white text-emerald-950 hover:bg-emerald-50 transition-colors shrink-0 shadow-xs"
            >
              <Play className="w-4 h-4 fill-emerald-950" />
              Resume Tour
            </Link>
          </div>
        </div>
      )}

      {/* Search & Sort Row */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tours by herb, topic, or keyword..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-green-50/50 border border-green-200/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-600 focus:bg-white text-gray-900 placeholder-gray-400 transition-all"
            />
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label htmlFor="tour-sort" className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Sort by:
            </label>
            <select
              id="tour-sort"
              value={activeSort}
              onChange={(e) => onSelectSort(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-600 cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="newest">Newest Releases</option>
              <option value="shortest">Shortest Duration</option>
            </select>
          </div>
        </div>

        {/* Filter Chips: Level & Health Facets */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-400 mr-1 uppercase tracking-wider">Level:</span>
          {LEVELS.map((lvl) => {
            const isSelected = activeLevel === lvl.id;
            return (
              <button
                key={lvl.label}
                onClick={() => onSelectLevel(lvl.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-green-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {lvl.label}
              </button>
            );
          })}

          <div className="w-full sm:w-auto my-1 sm:my-0 sm:border-l sm:border-gray-200 sm:pl-3" />

          <span className="text-xs font-semibold text-gray-400 mr-1 uppercase tracking-wider">Categories:</span>
          <button
            onClick={() => onSelectHealth(undefined)}
            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
              !activeHealth
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            All
          </button>
          {facets.health.map((cat) => {
            const isSelected = activeHealth === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => onSelectHealth(isSelected ? undefined : cat.slug)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {cat.label}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-200/70 text-emerald-900'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
