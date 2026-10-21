import { Link } from 'react-router-dom';
import { Eye, Sparkles, MapPin, Star } from 'lucide-react';
import { PlantImage } from './PlantImage';
import type { LibraryPlant } from '../types/library.types';

interface PlantCardProps {
  plant: LibraryPlant;
  viewMode: 'grid' | 'list';
  onView3D: (plant: LibraryPlant) => void;
}

export function PlantCard({ plant, viewMode, onView3D }: PlantCardProps) {
  const primaryImage = plant.images?.find((img) => img.isPrimary)?.url ?? plant.images?.[0]?.url;
  const categoryName =
    typeof plant.categories?.[0] === 'object'
      ? plant.categories[0].name
      : plant.tags?.[0] ?? 'Medicinal';

  if (viewMode === 'list') {
    return (
      <div className="flex items-start gap-4 bg-white rounded-xl border-2 border-green-100 hover:border-green-300 hover:shadow-md transition-all p-4">
        <PlantImage
          src={primaryImage}
          alt={plant.commonName}
          heightClass="h-20"
          className="w-24 flex-shrink-0 rounded-lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-green-900 truncate">{plant.commonName}</h3>
              <p className="text-xs italic text-green-500 mb-1">{plant.scientificName}</p>
            </div>
            {plant.avgRating > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-amber-500 flex-shrink-0">
                <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                {plant.avgRating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-xs text-green-600 line-clamp-2 mb-2">{plant.shortDescription}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {plant.medicinalUses.slice(0, 3).map((use) => (
              <span
                key={use}
                className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full"
              >
                {use}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/plant/${plant.slug}`}
              className="flex items-center gap-1 text-xs text-green-700 border border-green-300 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Eye className="w-3 h-3" />
              Details
            </Link>
            <button
              type="button"
              onClick={() => onView3D(plant)}
              className="flex items-center gap-1 text-xs text-green-700 border border-green-300 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              3D
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid card
  return (
    <div className="group bg-white rounded-2xl border-2 border-green-100 hover:border-green-300 hover:shadow-xl transition-all overflow-hidden flex flex-col">
      <div className="relative">
        <PlantImage
          src={primaryImage}
          alt={plant.commonName}
          heightClass="h-48"
          className="w-full group-hover:scale-105 transition-transform duration-500"
        />
        {/* Category badge */}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-green-700 text-xs border border-green-200 px-2 py-0.5 rounded-full shadow-sm">
          {categoryName}
        </span>
        {/* Rating */}
        {plant.avgRating > 0 && (
          <span className="absolute bottom-3 left-3 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm text-amber-500 text-xs px-2 py-0.5 rounded-full shadow-sm">
            <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
            {plant.avgRating.toFixed(1)}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-green-900 mb-0.5 line-clamp-1">
          {plant.commonName}
        </h3>
        <p className="text-xs italic text-green-500 mb-2 line-clamp-1">{plant.scientificName}</p>

        {/* Region */}
        {plant.regionNative?.[0] && (
          <p className="flex items-center gap-1 text-xs text-green-500 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {plant.regionNative[0]}
          </p>
        )}

        {/* Medicinal use tags */}
        <div className="flex flex-wrap gap-1 mb-3 flex-1">
          {plant.medicinalUses.slice(0, 2).map((use) => (
            <span
              key={use}
              className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full"
            >
              {use}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/plant/${plant.slug}`}
            id={`plant-detail-${plant.slug}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm text-green-700 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 py-2 rounded-xl transition-all font-medium"
          >
            <Eye className="w-4 h-4" />
            Details
          </Link>
          <button
            type="button"
            id={`plant-3d-${plant.slug}`}
            onClick={() => onView3D(plant)}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm text-green-700 border-2 border-green-200 hover:border-green-400 hover:bg-green-50 py-2 rounded-xl transition-all font-medium"
          >
            <Sparkles className="w-4 h-4" />
            3D View
          </button>
        </div>
      </div>
    </div>
  );
}
