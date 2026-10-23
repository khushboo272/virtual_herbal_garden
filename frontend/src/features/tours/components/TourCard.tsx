import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { ThemedImage } from '../../../components/common/ThemedImage';
import type { Tour, TourLevel } from '../types/tour.types';

interface TourCardProps {
  tour: Tour;
  progressPercent?: number;
}

const LEVEL_COLORS: Record<TourLevel, { bg: string; text: string; border: string }> = {
  BEGINNER: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  INTERMEDIATE: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ADVANCED: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export function TourCard({ tour, progressPercent }: TourCardProps) {
  const levelStyle = LEVEL_COLORS[tour.level] || LEVEL_COLORS.BEGINNER;
  const imageUrl = tour.coverImage || tour.coverImageUrl || '';
  const checkpointCount = tour.checkpointCount || tour.checkpoints?.length || tour.stops?.length || 0;
  const isCompleted = progressPercent !== undefined && progressPercent >= 100;

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-green-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-200 overflow-hidden">
      {/* Cover Image & Badges */}
      <div className="relative aspect-[16/9] w-full bg-green-50 overflow-hidden">
        <ThemedImage
          src={imageUrl}
          alt={tour.title}
          title={tour.title}
          category={tour.healthCategory}
          aspectRatio="video"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Level badge */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border} shadow-xs backdrop-blur-xs`}
          >
            {tour.level}
          </span>
          {tour.isFeatured && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
              Featured
            </span>
          )}
        </div>

        {/* Completed badge */}
        {isCompleted && (
          <div className="absolute top-3 right-3 bg-green-600/90 text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata chips */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-green-600" />
              {tour.estimatedMinutes || tour.estimatedDuration || 10} min
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-green-600" />
              {checkpointCount} checkpoints
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-800 transition-colors line-clamp-1 mb-2">
            {tour.title}
          </h3>

          {/* Summary */}
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">
            {tour.summary || tour.description}
          </p>
        </div>

        <div>
          {/* Progress bar if started and not 100% */}
          {progressPercent !== undefined && progressPercent > 0 && progressPercent < 100 && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span className="font-semibold text-green-700">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full bg-green-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA Link */}
          <Link
            to={`/virtual-tour/${tour.slug}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm text-green-800 bg-green-50 hover:bg-green-600 hover:text-white transition-all duration-200"
          >
            {isCompleted ? 'Review Tour' : progressPercent && progressPercent > 0 ? 'Continue Tour' : 'Start Tour'}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
