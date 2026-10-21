interface PlantCardSkeletonProps {
  viewMode?: 'grid' | 'list';
}

function Shimmer({ className }: { className: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-green-50 via-green-100 to-green-50 animate-pulse rounded-lg ${className}`}
    />
  );
}

export function PlantCardSkeleton({ viewMode = 'grid' }: PlantCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-start gap-4 bg-white rounded-xl border-2 border-green-50 p-4">
        <Shimmer className="w-24 h-20 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-3/4" />
          <div className="flex gap-2 pt-1">
            <Shimmer className="h-7 w-20" />
            <Shimmer className="h-7 w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-green-50 overflow-hidden">
      <Shimmer className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Shimmer className="h-4 w-3/4" />
        <Shimmer className="h-3 w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <Shimmer className="h-5 w-16" />
          <Shimmer className="h-5 w-20" />
        </div>
        <div className="flex gap-2 pt-2">
          <Shimmer className="h-9 flex-1" />
          <Shimmer className="h-9 flex-1" />
        </div>
      </div>
    </div>
  );
}

interface LibrarySkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export function LibrarySkeleton({ count = 12, viewMode = 'grid' }: LibrarySkeletonProps) {
  return (
    <div
      className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
          : 'space-y-4'
      }
    >
      {Array.from({ length: count }, (_, i) => (
        <PlantCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  );
}

interface EmptyResultsProps {
  query?: string;
  onReset: () => void;
}

export function EmptyResults({ query, onReset }: EmptyResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">🌿</div>
      <h3 className="text-xl font-semibold text-green-900 mb-2">No plants found</h3>
      {query ? (
        <p className="text-green-600 mb-6 max-w-xs">
          No results for <strong>"{query}"</strong>. Try a different search term or clear filters.
        </p>
      ) : (
        <p className="text-green-600 mb-6 max-w-xs">
          No plants match the selected filters. Try clearing some filters.
        </p>
      )}
      <button
        type="button"
        onClick={onReset}
        id="library-reset-button"
        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors shadow-md"
      >
        Clear all filters
      </button>
    </div>
  );
}

interface LibraryErrorProps {
  message: string;
  onRetry: () => void;
}

export function LibraryError({ message, onRetry }: LibraryErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h3 className="text-xl font-semibold text-green-900 mb-2">Something went wrong</h3>
      <p className="text-green-600 mb-6 max-w-xs">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        id="library-retry-button"
        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors shadow-md"
      >
        Try again
      </button>
    </div>
  );
}
