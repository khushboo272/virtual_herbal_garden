import { AlertTriangle, RefreshCw, SearchX, ShieldAlert } from 'lucide-react';

export function RemediesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl w-full" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-full" />
            <div className="h-3.5 bg-gray-200 rounded w-5/6" />
          </div>
          <div className="h-10 bg-gray-200 rounded-xl w-full mt-4" />
        </div>
      ))}
    </div>
  );
}

export function EmptyRemedies({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear: () => void;
}) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-200/80 shadow-xs max-w-xl mx-auto my-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No remedies found</h3>
      <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
        {searchTerm
          ? `We couldn't find any remedies matching "${searchTerm}". Try another search term or clear active filters.`
          : 'No remedies match your current filter selections. Try broadening your criteria.'}
      </p>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-medium text-sm transition-colors shadow-xs"
      >
        Clear All Filters
      </button>
    </div>
  );
}

export function RemediesError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-red-100 max-w-xl mx-auto my-8 shadow-xs">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
        <AlertTriangle className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to load remedies</h3>
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white font-medium text-sm transition-colors shadow-xs"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}

export function MedicalSafetyDisclaimer() {
  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 md:p-5 flex items-start gap-3.5 mb-8 text-amber-900 shadow-xs">
      <div className="p-2 rounded-xl bg-amber-100/90 text-amber-800 flex-shrink-0 mt-0.5">
        <ShieldAlert className="w-5 h-5" />
      </div>
      <div className="text-xs md:text-sm leading-relaxed">
        <strong className="font-semibold block mb-0.5 text-amber-950">Educational Resource & Medical Disclaimer</strong>
        Traditional remedies are shared for education only and are not medical advice. Talk to a doctor before use, especially if you are pregnant, taking medicine, or treating a child.
      </div>
    </div>
  );
}
