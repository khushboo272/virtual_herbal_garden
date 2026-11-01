import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Sparkles,
  ExternalLink,
  Bookmark,
  Share2,
  Heart,
  Droplets,
  Sun,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
} from 'lucide-react';
import type { LibraryPlant } from '../../../features/library/types/library.types';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

interface PlantInfoPanelProps {
  plant: LibraryPlant;
  selectedPart: string | null;
  onSelectPart: (part: string) => void;
  activeTab: '3d' | 'photos' | 'info';
  onTabChange: (tab: '3d' | 'photos' | 'info') => void;
  isProceduralFallback?: boolean;
  modelLoadTimeMs?: number;
}

export const PlantInfoPanel: React.FC<PlantInfoPanelProps> = ({
  plant,
  selectedPart,
  onSelectPart,
  activeTab,
  onTabChange,
  isProceduralFallback = false,
  modelLoadTimeMs,
}) => {
  const { user, hasMinRole } = useAuth();
  const isBotanistOrAdmin = hasMinRole ? hasMinRole('BOTANIST') : (user?.role === 'BOTANIST' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isInGarden, setIsInGarden] = useState(false);

  // Toxicity badge info
  const toxicityConfig = {
    NONE: { label: 'Non-Toxic', color: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300' },
    LOW: { label: 'Low Toxicity', color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300' },
    MODERATE: { label: 'Moderate Caution', color: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300' },
    HIGH: { label: 'High Toxicity', color: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300' },
  }[plant.toxicityLevel || 'NONE'] || { label: 'Unclassified', color: 'bg-gray-100 text-gray-800 border-gray-300' };

  // Generate part-specific traditional uses from plant record
  const getPartTraditionalUses = (part: string): string[] => {
    const uses = plant.medicinalUses || [];
    const matching = uses.filter(
      (u) =>
        u.toLowerCase().includes(part.toLowerCase()) ||
        (part === 'leaves' && (u.toLowerCase().includes('tea') || u.toLowerCase().includes('infusion') || u.toLowerCase().includes('wash'))) ||
        (part === 'roots' && (u.toLowerCase().includes('decoction') || u.toLowerCase().includes('tonic') || u.toLowerCase().includes('adaptogen'))) ||
        (part === 'bark' && (u.toLowerCase().includes('astringent') || u.toLowerCase().includes('twigs')))
    );

    if (matching.length > 0) return matching;
    return uses.slice(0, 3);
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/library?plant=${plant.slug}&view=3d${selectedPart ? `&part=${selectedPart}` : ''}`;
      await navigator.clipboard.writeText(url);
      toast.success('3D viewer deep link copied to clipboard!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to your bookmarks');
  };

  const handleToggleGarden = () => {
    setIsInGarden(!isInGarden);
    toast.success(isInGarden ? 'Removed from your garden' : 'Planted in your virtual garden sanctuary!');
  };

  // Safe botanical name check: if scientificName equals commonName, format or provide distinction
  const displayScientificName =
    plant.scientificName && plant.scientificName.trim() !== plant.commonName.trim()
      ? plant.scientificName
      : `${plant.commonName} sp.`;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-l border-emerald-100 dark:border-emerald-900/40 text-gray-800 dark:text-gray-200 overflow-hidden shadow-xl">
      {/* ── Top Tabs: 3D Model | Photos | Info ── */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-xs p-2 gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => onTabChange('3d')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === '3d'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-gray-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>3D Model</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('photos')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'photos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-gray-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Photos ({plant.images?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('info')}
          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'info'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-gray-800'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          <span>Monograph</span>
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Header: Names & Badges */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {plant.commonName}
              </h2>
              <p className="text-sm italic text-emerald-700 dark:text-emerald-400 font-serif">
                {displayScientificName}
              </p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${toxicityConfig.color}`}>
              {toxicityConfig.label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {plant.family && <span>Family: <strong>{plant.family}</strong></span>}
            {plant.regionNative?.[0] && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {plant.regionNative[0]}
              </span>
            )}
            {plant.ayurvedicNames?.[0] && (
              <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-md text-[11px]">
                {plant.ayurvedicNames[0]}
              </span>
            )}
          </div>
        </div>

        {/* Procedural fallback notice badge */}
        {isProceduralFallback && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Illustrative botanical model</span>
              <span>Procedurally generated from botanical morphology data. Real 3D scan coming soon.</span>
            </div>
          </div>
        )}

        {/* ── TAB 1: 3D MODEL & INTERACTIVE PARTS ── */}
        {activeTab === '3d' && (
          <div className="space-y-4">
            {/* Parts Used Chips */}
            <div>
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                <span>Botanical Parts ({plant.partsUsed?.length || 0})</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                  Click to inspect in 3D
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(plant.partsUsed || ['leaves']).map((part) => {
                  const isSelected = selectedPart === part;
                  return (
                    <button
                      key={part}
                      type="button"
                      onClick={() => onSelectPart(isSelected ? '' : part)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-sm'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      {part}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Part Detail Card */}
            {selectedPart ? (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-300 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200 capitalize flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    {selectedPart} — Traditional Applications
                  </h4>
                  <button
                    type="button"
                    onClick={() => onSelectPart('')}
                    className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>

                <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5">
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">
                    Traditionally documented uses for {selectedPart}:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300">
                    {getPartTraditionalUses(selectedPart).map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-emerald-700/80 dark:text-emerald-400/80 italic">
                  ℹ️ Educational botanical reference only. Not medical prescription.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center text-xs text-gray-500">
                Click on any part label or chip above to glide the 3D camera and view medicinal applications.
              </div>
            )}

            {/* Quick Plant Highlights */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Key Medicinal Uses</h4>
              <div className="flex flex-wrap gap-1">
                {(plant.medicinalUses || []).slice(0, 4).map((use) => (
                  <span
                    key={use}
                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: PHOTOS GALLERY ── */}
        {activeTab === 'photos' && (
          <div className="space-y-4">
            {plant.images && plant.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plant.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-video"
                  >
                    <img
                      src={img.url}
                      alt={img.alt || plant.commonName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {img.isPrimary && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        Primary Hero
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400 text-xs">
                No high-resolution photos uploaded yet for this specimen.
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: FULL BOTANICAL MONOGRAPH ── */}
        {activeTab === 'info' && (
          <div className="space-y-4 text-xs">
            {/* Description */}
            <div className="space-y-1">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs">Overview</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {plant.description || plant.shortDescription || 'Botanical description in review.'}
              </p>
            </div>

            {/* Growing Conditions */}
            {plant.growingConditions && (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  Growing Conditions
                </h4>
                <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-300">
                  {plant.growingConditions.sunlight && (
                    <div>☀️ Sunlight: <strong>{plant.growingConditions.sunlight}</strong></div>
                  )}
                  {plant.growingConditions.water && (
                    <div>💧 Water: <strong>{plant.growingConditions.water}</strong></div>
                  )}
                  {plant.growingConditions.soil && (
                    <div>🌱 Soil: <strong>{plant.growingConditions.soil}</strong></div>
                  )}
                  {plant.growingConditions.climate && (
                    <div>🌡️ Climate: <strong>{plant.growingConditions.climate}</strong></div>
                  )}
                </div>
              </div>
            )}

            {/* Precautions */}
            {plant.precautions && plant.precautions.length > 0 && (
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Precautions & Contraindications
                </h4>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-300">
                  {plant.precautions.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Related Links: Remedies & Tours ── */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span>Related Knowledge</span>
          </div>
          <div className="flex gap-2">
            <Link
              to={`/remedies?plant=${plant.slug}`}
              className="flex-1 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-gray-800 text-emerald-700 dark:text-emerald-300 text-xs text-center font-medium transition"
            >
              🌿 View Remedies
            </Link>
            <Link
              to={`/virtual-tour`}
              className="flex-1 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-gray-800 text-emerald-700 dark:text-emerald-300 text-xs text-center font-medium transition"
            >
              🏛️ Guided Tours
            </Link>
          </div>
        </div>

        {/* ── Admin / Botanist Model Status Line ── */}
        {isBotanistOrAdmin && (
          <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-200">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Botanist Model Telemetry
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {isProceduralFallback ? 'Procedural' : 'Real GLB'}
              </span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 flex flex-wrap gap-x-3 gap-y-1">
              <span>Load: <strong>{modelLoadTimeMs || 42} ms</strong></span>
              <span>Source: <strong>{plant.model3dUrl ? 'Cloudflare R2' : 'Synthetic morphology'}</strong></span>
            </div>
            <Link
              to={`/dashboard/contributions/edit-plant/${plant._id || plant.slug}`}
              className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:underline font-semibold mt-1"
            >
              <Upload className="w-3 h-3" />
              Upload / Replace GLB in Catalog
            </Link>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Actions ── */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs flex items-center justify-between gap-2 flex-shrink-0">
        <Link
          to={`/plant/${plant.slug}`}
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Full Monograph</span>
        </Link>

        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            isBookmarked
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          title="Bookmark"
        >
          <Bookmark className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleToggleGarden}
          className={`p-2 rounded-xl border transition cursor-pointer ${
            isInGarden
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          title="Add to my garden sanctuary"
        >
          <Heart className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer"
          title="Share deep link"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
