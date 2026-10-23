import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useTours } from '../hooks/useTours';
import { getMeProgress } from '../api/toursApi';
import { useAuth } from '../../../contexts/AuthContext';
import { ToursHero } from '../components/ToursHero';
import { TourCard } from '../components/TourCard';
import { ToursSkeleton, EmptyTours, ToursError } from '../components/TourStates';
import type { Tour } from '../types/tour.types';

export function ToursHubPage() {
  useDocumentTitle('Guided Virtual Tours | Virtual Herbal Garden');

  const {
    tours,
    meta,
    isLoading,
    error,
    params,
    searchInput,
    setQuery,
    setHealth,
    setLevel,
    setSort,
    setPage,
    clearFilters,
    reload,
  } = useTours();

  const { isAuthenticated } = useAuth();
  const [continueTour, setContinueTour] = useState<{
    tour: Tour;
    percent: number;
    lastCheckpointTitle?: string;
  } | null>(null);

  // Keep a stable ref to tours so the effect below can read the latest list
  // without adding the array itself as a dependency (new reference every fetch).
  const toursRef = useRef<Tour[]>(tours);
  toursRef.current = tours;

  // Check for any in-progress tour to resume
  useEffect(() => {
    if (tours.length === 0) return;

    if (isAuthenticated) {
      getMeProgress()
        .then((progressList) => {
          const inProgress = progressList.find((p) => p.percent > 0 && p.percent < 100);
          if (inProgress) {
            const matchedTour = toursRef.current.find((t) => t.slug === inProgress.slug);
            if (matchedTour) {
              setContinueTour({
                tour: matchedTour,
                percent: inProgress.percent,
              });
            }
          }
        })
        .catch(() => {});
    } else {
      // Check guest localStorage across tours
      for (const t of toursRef.current) {
        try {
          const raw = localStorage.getItem(`herb_tour_${t.slug}_progress`);
          if (raw) {
            const parsed = JSON.parse(raw);
            const total = t.checkpointCount || t.checkpoints?.length || 1;
            const pct = Math.round((parsed.completedKeys.length / total) * 100);
            if (pct > 0 && pct < 100) {
              setContinueTour({
                tour: t,
                percent: pct,
              });
              break;
            }
          }
        } catch {}
      }
    }
  // Only depend on tours.length (primitive) and isAuthenticated (primitive)
  // instead of the full `tours` array which has a new reference every fetch.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tours.length, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/40 via-white to-green-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <ToursHero
          searchInput={searchInput}
          onSearchChange={setQuery}
          activeHealth={params.health}
          onSelectHealth={setHealth}
          activeLevel={params.level}
          onSelectLevel={setLevel}
          activeSort={params.sort as any}
          onSelectSort={setSort}
          facets={meta.facets}
          continueTour={continueTour}
        />

        {/* Content Section */}
        {isLoading ? (
          <ToursSkeleton />
        ) : error ? (
          <ToursError error={error} onRetry={reload} />
        ) : tours.length === 0 ? (
          <EmptyTours onClear={clearFilters} />
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
              <div>
                Showing <span className="font-semibold text-gray-900">{tours.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{meta.total}</span> guided tours
              </div>
            </div>

            {/* Tours Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {tours.map((t) => (
                <TourCard key={t.id || t.slug} tour={t} />
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-100">
                <button
                  disabled={meta.page <= 1}
                  onClick={() => setPage(meta.page - 1)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page <span className="font-semibold text-gray-900">{meta.page}</span> of{' '}
                  <span className="font-semibold text-gray-900">{meta.totalPages}</span>
                </span>
                <button
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage(meta.page + 1)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
