import { Link, useNavigate } from 'react-router-dom';
import { Clock, Flame, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { PlantImage } from '../../library';
import type { Remedy } from '../types/remedy.types';
import { useRemedyFavorite } from '../hooks/useRemedyFavorite';

interface RemedyCardProps {
  remedy: Remedy;
  compact?: boolean;
}

export function RemedyCard({ remedy, compact = false }: RemedyCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggle, isAuthenticated } = useRemedyFavorite(remedy._id || remedy.id || '');

  // Resolve best image URL: remedy.image -> first image in remedy.images -> first plant's image
  const imageUrl =
    remedy.image ||
    remedy.images?.[0]?.url ||
    remedy.plants?.[0]?.images?.[0]?.url ||
    remedy.resolvedPlants?.[0]?.image ||
    '';

  const diff = remedy.difficulty || remedy.difficultyLevel || 'EASY';
  const prepTime = remedy.prepTimeMinutes || remedy.preparationTime || 15;
  const usage = remedy.usage || 'INTERNAL';

  const diffColor =
    diff === 'HARD' || diff === 'ADVANCED'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : diff === 'MEDIUM'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    toggle();
  };

  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-green-100 hover:border-green-300 hover:shadow-md transition-all overflow-hidden flex flex-col h-full group">
        <div className="relative">
          <PlantImage
            src={imageUrl}
            alt={remedy.title}
            heightClass="h-32"
            className="w-full"
          />
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite
                  ? 'fill-rose-500 stroke-rose-500 text-rose-500'
                  : 'stroke-gray-400 hover:stroke-rose-500'
              }`}
            />
          </button>
        </div>
        <div className="p-3.5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-1.5 text-xs">
            <span className={`px-2 py-0.5 rounded-full font-medium border text-[10px] ${diffColor}`}>
              {diff}
            </span>
            <span className="flex items-center gap-1 text-gray-500 text-[11px]">
              <Clock className="w-3 h-3 text-green-600" />
              {prepTime}m
            </span>
          </div>
          <h4 className="font-semibold text-green-950 text-sm line-clamp-1 group-hover:text-green-700 transition-colors mb-1">
            {remedy.title}
          </h4>
          <p className="text-xs text-gray-600 line-clamp-2 mb-3 flex-1">
            {remedy.description}
          </p>
          <Link
            to={`/remedies/${remedy.slug}`}
            className="text-xs font-semibold text-green-700 hover:text-green-900 flex items-center justify-between pt-2 border-t border-gray-100 mt-auto"
          >
            <span>View Remedy</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-green-100/80 shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-200 overflow-hidden flex flex-col h-full group">
      {/* Top Image + Badges */}
      <div className="relative overflow-hidden bg-green-50">
        <PlantImage
          src={imageUrl}
          alt={remedy.title}
          heightClass="h-48"
          className="w-full transform group-hover:scale-105 transition-transform duration-300"
        />

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow hover:bg-white transition-all transform active:scale-90"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite
                ? 'fill-rose-500 stroke-rose-500 text-rose-500'
                : 'stroke-gray-500 hover:stroke-rose-500'
            }`}
          />
        </button>

        {/* Quick Badges Overlay */}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-xs backdrop-blur-md bg-white/95 ${diffColor}`}>
            {diff}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-200 bg-white/95 text-gray-700 flex items-center gap-1 shadow-xs">
            <Clock className="w-3 h-3 text-green-600" />
            {prepTime} mins
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200 bg-emerald-50/95 text-emerald-800 shadow-xs uppercase text-[10px] tracking-wide">
            {usage}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-green-950 text-lg leading-snug mb-1.5 group-hover:text-green-700 transition-colors">
          <Link to={`/remedies/${remedy.slug}`} className="hover:underline">
            {remedy.title}
          </Link>
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 flex-1">
          {remedy.description}
        </p>

        {/* Linked Plants Chips */}
        {((remedy.plants && remedy.plants.length > 0) || (remedy.resolvedPlants && remedy.resolvedPlants.length > 0)) && (
          <div className="mb-4 pt-3 border-t border-gray-100">
            <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Key Botanical Ingredients
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(remedy.plants && remedy.plants.length > 0 ? remedy.plants : (remedy.resolvedPlants || [])).slice(0, 3).map((p, idx) => (
                <Link
                  key={p._id || p.id || p.slug || idx}
                  to={`/plant/${p.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-green-50 text-green-800 hover:bg-green-100 hover:text-green-950 transition-colors border border-green-200/50"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {p.commonName}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link
          to={`/remedies/${remedy.slug}`}
          className="w-full mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 hover:bg-green-700 text-green-800 hover:text-white font-semibold text-sm transition-all duration-150 group/btn border border-green-200 hover:border-transparent"
        >
          <span>View Remedy</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
