import { AlertTriangle, Compass, Info, RefreshCw } from 'lucide-react';
import { Button } from '../../../app/components/ui/button';

export function TourEducationalBanner() {
  return (
    <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-4 mb-8 text-amber-900 shadow-xs flex items-start gap-3">
      <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
      <div className="text-sm leading-relaxed">
        <span className="font-semibold">Educational Exploration:</span> Virtual herbal garden tours are designed solely for botanical education and traditional cultural heritage. Information regarding plants and preparation methods does not constitute medical advice or clinical claims.
      </div>
    </div>
  );
}

export function ToursSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
          <div className="aspect-[16/9] bg-gray-200 rounded-xl mb-4" />
          <div className="h-4 bg-gray-200 rounded-md w-1/3 mb-2" />
          <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-3" />
          <div className="h-4 bg-gray-100 rounded-md w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded-md w-2/3 mb-6" />
          <div className="h-10 bg-gray-200 rounded-xl w-full" />
        </div>
      ))}
    </div>
  );
}

interface EmptyToursProps {
  onClear: () => void;
}

export function EmptyTours({ onClear }: EmptyToursProps) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-3xl border border-green-100 shadow-xs max-w-lg mx-auto">
      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 text-green-700">
        <Compass className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Guided Tours Found</h3>
      <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
        We could not find any guided botanical tours matching your active search filters. Try adjusting your query or resetting all filters.
      </p>
      <Button
        onClick={onClear}
        className="bg-green-700 hover:bg-green-800 text-white rounded-xl px-6 py-2.5 font-medium shadow-xs"
      >
        Clear all filters
      </Button>
    </div>
  );
}

interface ToursErrorProps {
  error: string;
  onRetry: () => void;
}

export function ToursError({ error, onRetry }: ToursErrorProps) {
  return (
    <div className="text-center py-16 px-4 bg-red-50/50 rounded-3xl border border-red-200/80 max-w-lg mx-auto">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Tours</h3>
      <p className="text-red-700 text-sm mb-6 max-w-md mx-auto leading-relaxed">
        {error}
      </p>
      <Button
        onClick={onRetry}
        className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 py-2.5 font-medium inline-flex items-center gap-2 shadow-xs"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </Button>
    </div>
  );
}
