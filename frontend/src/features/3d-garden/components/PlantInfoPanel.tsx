// ──────────────────────────────────────────────────────────
// components/PlantInfoPanel.tsx — Plant Details Drawer
// Displays botanical info, 3D Real/Placeholder status, and details link
// ──────────────────────────────────────────────────────────
import { motion, AnimatePresence } from 'motion/react';
import { X, Leaf, FlaskConical, MapPin, Info, ExternalLink, Box, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { IShowcasePlant } from '../types';

interface PlantInfoPanelProps {
  plant: (IShowcasePlant & { _id?: string; images?: any[]; family?: string; shortDescription?: string; medicinalUses?: string[]; toxicityLevel?: string; regionNative?: string[]; ayurvedicNames?: string[] }) | null;
  onClose: () => void;
}

export function PlantInfoPanel({ plant, onClose }: PlantInfoPanelProps) {
  const [, setSearchParams] = useSearchParams();

  const isRealModel = Boolean(plant?.modelUrl && plant?.modelStatus !== 'FAILED');
  const plantId = plant?.id || plant?._id;

  return (
    <AnimatePresence>
      {plant && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-[380px] z-50 flex flex-col"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,253,244,0.97))',
            backdropFilter: 'blur(20px)',
            borderLeft: '2px solid rgba(16,185,129,0.3)',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.2)',
          }}
        >
          {/* Header image / banner */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800">
            {plant.thumbnail || plant.images?.[0]?.url ? (
              <img
                src={plant.thumbnail || plant.images?.[0]?.url}
                alt={plant.commonName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Leaf className="w-16 h-16 text-emerald-200/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4 right-4">
              <div className="flex items-center gap-2 mb-1">
                {isRealModel ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/90 text-white backdrop-blur-sm shadow-sm">
                    <Box className="w-3 h-3" /> Real 3D Model
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/90 text-white backdrop-blur-sm shadow-sm">
                      <Sparkles className="w-3 h-3" /> Procedural Plant
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-900/70 text-slate-200">
                      3D model coming soon
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-white drop-shadow-md truncate">
                {plant.commonName}
              </h2>
              <p className="text-sm text-emerald-100 italic drop-shadow-sm truncate">
                {plant.scientificName}
              </p>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Quick Actions */}
            {plantId && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSearchParams((prev) => {
                      prev.set('placePlantId', plantId);
                      return prev;
                    });
                    onClose();
                  }}
                  className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-emerald-200/60"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Reposition in Garden
                </button>
              </div>
            )}

            {/* Botanical Type & Habit */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-500 block">Growth Habit</span>
                <strong className="text-slate-800">{plant.visual?.habit || plant.plantType || 'HERB'}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="text-slate-500 block">Dimensions</span>
                <strong className="text-slate-800">
                  {plant.visual?.heightM ?? 0.6}m H × {plant.visual?.spreadM ?? 0.5}m W
                </strong>
              </div>
            </div>

            {/* Health Categories */}
            {plant.healthCategories?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  Health Categories
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {plant.healthCategories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full border border-emerald-200 capitalize"
                    >
                      {cat.replace('-', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Short Description */}
            {plant.shortDescription && (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                {plant.shortDescription}
              </p>
            )}

            {/* Medicinal Uses */}
            {plant.medicinalUses && plant.medicinalUses.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                  Medicinal Uses
                </h3>
                <div className="flex flex-wrap gap-1">
                  {plant.medicinalUses.map((use, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-teal-50 text-teal-800 text-xs rounded border border-teal-200"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* View Full Profile link */}
            <div className="pt-2">
              <a
                href={`/plant/${plant.slug}`}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-900 font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Full Plant Profile →
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

