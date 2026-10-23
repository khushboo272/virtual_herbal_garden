import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { useRemedySearch } from '../hooks/useRemedySearch';
import { RemedyCard } from '../components/RemedyCard';
import { RemediesHero } from '../components/RemediesHero';
import {
  RemediesSkeleton,
  EmptyRemedies,
  RemediesError,
  MedicalSafetyDisclaimer,
} from '../components/RemedyStates';

export function RemediesPage() {
  useDocumentTitle('Traditional Herbal Remedies | Virtual Herbal Garden');

  const {
    remedies,
    meta,
    isLoading,
    error,
    params,
    searchInput,
    setQuery,
    setHealth,
    setDifficulty,
    setSort,
    setPage,
    clearFilters,
    reload,
  } = useRemedySearch();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/40 via-white to-green-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Medical Safety Banner */}
        <MedicalSafetyDisclaimer />

        {/* Hero & Interactive Controls */}
        <RemediesHero
          searchInput={searchInput}
          onSearchChange={setQuery}
          params={params}
          meta={meta}
          onHealthSelect={setHealth}
          onDifficultySelect={setDifficulty}
          onSortSelect={setSort}
          onClearFilters={clearFilters}
        />

        {/* Body State Rendering */}
        {isLoading ? (
          <RemediesSkeleton />
        ) : error ? (
          <RemediesError message={error} onRetry={reload} />
        ) : remedies.length === 0 ? (
          <EmptyRemedies searchTerm={params.q} onClear={clearFilters} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {remedies.map((remedy) => (
                <RemedyCard key={remedy._id || remedy.id || remedy.slug} remedy={remedy} />
              ))}
            </div>

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6 pb-12 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, meta.page - 1))}
                  disabled={meta.page <= 1}
                  aria-label="Previous Page"
                  className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: meta.totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrent = pageNum === meta.page;
                    // Only show first, last, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === meta.totalPages ||
                      (pageNum >= meta.page - 1 && pageNum <= meta.page + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setPage(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all ${
                            isCurrent
                              ? 'bg-green-700 text-white shadow-xs'
                              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (pageNum === meta.page - 2 || pageNum === meta.page + 2) {
                      return (
                        <span key={pageNum} className="px-1 text-gray-400 text-xs">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setPage(Math.min(meta.totalPages, meta.page + 1))}
                  disabled={meta.page >= meta.totalPages}
                  aria-label="Next Page"
                  className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
