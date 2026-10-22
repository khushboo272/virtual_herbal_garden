import { useState, useCallback } from 'react';
import { Grid3x3, List, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { FiltersSidebar } from '../components/FiltersSidebar';
import { PlantCard } from '../components/PlantCard';
import { LibrarySkeleton, EmptyResults, LibraryError } from '../components/LibraryStates';
import { usePlantSearch } from '../hooks/usePlantSearch';
import { useDebounce } from '../hooks/useDebounce';
import { PlantViewer3DModal } from '../../../app/components/PlantViewer3DModal';
import type { LibraryPlant } from '../types/library.types';

export function LibraryPage() {
  const {
    params,
    setQ,
    setMedicinalUse,
    setHealth,
    setRegion,
    setType,
    setSort,
    setPage,
    setView,
    clearFilters,
    plants,
    meta,
    isLoading,
    error,
    retry,
  } = usePlantSearch();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selected3DPlant, setSelected3DPlant] = useState<LibraryPlant | null>(null);

  // Debounced search — only triggers URL update after 350ms inactivity
  const debouncedSetQ = useDebounce(useCallback((q: string) => setQ(q), [setQ]), 350);

  const viewMode = params.view ?? 'grid';
  const currentPage = params.page ?? 1;
  const totalPages = meta?.totalPages ?? 1;
  const totalResults = meta?.total ?? 0;

  const sortOptions: { value: 'newest' | 'relevance' | 'name' | 'rating'; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'relevance', label: 'Relevance' },
    { value: 'name', label: 'Name A–Z' },
    { value: 'rating', label: 'Top Rated' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/60 via-emerald-50/30 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Page Header ─────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-900 mb-2">Plant Library</h1>
          <p className="text-green-600">
            Browse our comprehensive collection of medicinal plants
          </p>
          {/* Health category active-filter chip */}
          {params.health && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-green-700">Filtered by:</span>
              <button
                type="button"
                id="library-health-chip"
                onClick={() => setHealth('')}
                className="flex items-center gap-1.5 px-3 py-1 bg-green-100 border border-green-300 text-green-800 text-sm rounded-full hover:bg-green-200 transition-colors"
              >
                {params.health.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                <span aria-hidden className="text-green-500 ml-1">&times;</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Search + Controls row ────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <SearchBar
              value={params.q ?? ''}
              onChange={debouncedSetQ}
              placeholder="Search by name, use, or region…"
            />
          </div>

          {/* Sort */}
          <select
            id="library-sort"
            value={params.sort ?? 'newest'}
            onChange={(e) => setSort(e.target.value as typeof params.sort)}
            className="border-2 border-green-200 bg-white text-green-800 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-400 transition-colors cursor-pointer"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex gap-1 p-1 bg-green-100 rounded-xl">
            <button
              type="button"
              id="library-view-grid"
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-green-700' : 'text-green-500 hover:text-green-700'}`}
              aria-label="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="library-view-list"
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-green-700' : 'text-green-500 hover:text-green-700'}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile filter toggle */}
          <button
            type="button"
            id="library-filter-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            className="lg:hidden flex items-center gap-2 border-2 border-green-200 bg-white text-green-700 text-sm px-4 py-2.5 rounded-xl hover:bg-green-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        <div className="flex gap-8">
          {/* ── Filters Sidebar ─────────────────────────────────────── */}
          <aside
            className={`lg:block ${sidebarOpen ? 'block' : 'hidden'} w-full lg:w-64 flex-shrink-0`}
          >
            <FiltersSidebar
              params={params}
              meta={meta}
              onMedicinalUse={setMedicinalUse}
              onRegion={setRegion}
              onType={setType}
              onClear={clearFilters}
            />
          </aside>

          {/* ── Main Content ─────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Results count */}
            <div className="mb-4 flex items-center justify-between">
              {!isLoading && (
                <p className="text-sm text-green-600">
                  {totalResults > 0 ? (
                    <>
                      Showing{' '}
                      <strong className="text-green-800">
                        {Math.min((currentPage - 1) * 12 + plants.length, totalResults)}
                      </strong>{' '}
                      of <strong className="text-green-800">{totalResults}</strong> plants
                    </>
                  ) : null}
                </p>
              )}
            </div>

            {/* Plants grid/list or states */}
            {isLoading ? (
              <LibrarySkeleton count={12} viewMode={viewMode} />
            ) : error ? (
              <LibraryError message={error} onRetry={retry} />
            ) : plants.length === 0 ? (
              <EmptyResults query={params.q} onReset={clearFilters} />
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {plants.map((plant) => (
                  <PlantCard
                    key={plant._id}
                    plant={plant}
                    viewMode={viewMode}
                    onView3D={setSelected3DPlant}
                  />
                ))}
              </div>
            )}

            {/* ── Pagination ──────────────────────────────────────────── */}
            {!isLoading && !error && totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  type="button"
                  id="library-prev-page"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm border-2 border-green-200 rounded-xl text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    // Show smart page range around currentPage
                    const midpoint = Math.min(Math.max(currentPage, 4), totalPages - 3);
                    const start = Math.max(1, midpoint - 3);
                    const page = start + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        type="button"
                        id={`library-page-${page}`}
                        onClick={() => setPage(page)}
                        className={`w-9 h-9 text-sm rounded-lg border-2 transition-colors ${
                          page === currentPage
                            ? 'bg-green-600 border-green-600 text-white font-semibold'
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  id="library-next-page"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm border-2 border-green-200 rounded-xl text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 3D Plant Viewer Modal */}
      {selected3DPlant && (
        <PlantViewer3DModal
          isOpen={!!selected3DPlant}
          onClose={() => setSelected3DPlant(null)}
          plantName={selected3DPlant.commonName}
          botanicalName={selected3DPlant.scientificName}
        />
      )}
    </div>
  );
}
