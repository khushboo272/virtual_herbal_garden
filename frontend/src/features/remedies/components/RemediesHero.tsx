import { Search, X, Sparkles, SlidersHorizontal } from 'lucide-react';
import type { RemedySearchParams, RemedyMeta } from '../types/remedy.types';

interface RemediesHeroProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  params: RemedySearchParams;
  meta: RemedyMeta;
  onHealthSelect: (slug: string | null) => void;
  onDifficultySelect: (diff: string | null) => void;
  onSortSelect: (sort: 'newest' | 'name' | 'quickest') => void;
  onClearFilters: () => void;
}

export function RemediesHero({
  searchInput,
  onSearchChange,
  params,
  meta,
  onHealthSelect,
  onDifficultySelect,
  onSortSelect,
  onClearFilters,
}: RemediesHeroProps) {
  const healthFacets = meta.facets?.health || [];
  const difficultyFacets = meta.facets?.difficulty || [];
  const hasActiveFilters = Boolean(params.q || params.health || params.difficulty || params.plant || (params.sort && params.sort !== 'newest'));

  return (
    <div className="relative mb-8">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto pt-6 pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Evidence & Heritage Based Botanical Health
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-green-950 tracking-tight mb-3">
          Find Your Herbal Remedy
        </h1>
        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
          Explore time-honored traditional remedies prepared from authentic medicinal plants, documented for educational and botanical appreciation.
        </p>

        {/* Search Bar */}
        <div className="mt-8 max-w-2xl mx-auto relative">
          <div className="relative flex items-center shadow-md rounded-2xl overflow-hidden border-2 border-green-200 focus-within:border-green-600 bg-white transition-all">
            <div className="pl-4 text-gray-400">
              <Search className="w-5 h-5 text-green-700" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by health condition, plant, or ingredient (e.g. cold, turmeric, digestion)..."
              aria-label="Search remedies"
              className="w-full py-4 pl-3 pr-10 text-sm md:text-base text-gray-800 placeholder-gray-400 focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search query"
                className="pr-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Health Category Filter Chips (from API facets) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar">
        <button
          type="button"
          onClick={() => onHealthSelect(null)}
          className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all border ${
            !params.health
              ? 'bg-green-700 text-white border-green-700 shadow-xs'
              : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50/50'
          }`}
        >
          All Remedies ({meta.total || 0})
        </button>

        {healthFacets.map((facet) => {
          const isSelected = params.health === facet.slug;
          return (
            <button
              key={facet.slug}
              type="button"
              onClick={() => onHealthSelect(isSelected ? null : facet.slug)}
              className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-green-700 text-white border-green-700 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50/50'
              }`}
            >
              <span>{facet.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isSelected ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {facet.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Difficulty + Sort + Result Count */}
      <div className="mt-4 pt-4 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Difficulty Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Difficulty:</span>
            <select
              value={params.difficulty || ''}
              onChange={(e) => onDifficultySelect(e.target.value || null)}
              aria-label="Filter by difficulty"
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:border-green-600"
            >
              <option value="">All Levels</option>
              {difficultyFacets.length > 0 ? (
                difficultyFacets.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} ({d.count})
                  </option>
                ))
              ) : (
                <>
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </>
              )}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500 font-medium">Sort by:</span>
            <select
              value={params.sort || 'newest'}
              onChange={(e) => onSortSelect(e.target.value as any)}
              aria-label="Sort remedies"
              className="text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:border-green-600"
            >
              <option value="newest">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="quickest">Quickest Prep Time</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline transition-colors ml-2"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Count text */}
        <div className="text-xs text-gray-500 font-medium">
          Showing {meta.total > 0 ? `${(meta.page - 1) * meta.limit + 1}–${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}` : '0'} remedies
        </div>
      </div>
    </div>
  );
}
