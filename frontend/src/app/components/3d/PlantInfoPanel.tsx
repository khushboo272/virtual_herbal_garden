// ─────────────────────────────────────────────────────
// PlantInfoPanel.tsx — Right-side overlay when plant is clicked
// ─────────────────────────────────────────────────────
import { motion, AnimatePresence } from "motion/react";
import { X, Leaf, FlaskConical, MapPin, Info, ExternalLink } from "lucide-react";
import type { Plant } from "../../../lib/types";

interface PlantInfoPanelProps {
  plant: Plant | null;
  onClose: () => void;
}

export function PlantInfoPanel({ plant, onClose }: PlantInfoPanelProps) {
  return (
    <AnimatePresence>
      {plant && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-[380px] z-50 flex flex-col"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(232,245,233,0.96))",
            backdropFilter: "blur(20px)",
            borderLeft: "2px solid rgba(129,199,132,0.4)",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header image */}
          <div className="relative h-48 overflow-hidden">
            {plant.images?.[0]?.url ? (
              <img
                src={plant.images[0].url}
                alt={plant.commonName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                <Leaf className="w-16 h-16 text-white/60" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-3 left-4">
              <h2 className="text-xl font-bold text-white drop-shadow-md">
                {plant.commonName}
              </h2>
              <p className="text-sm text-green-100 italic drop-shadow-sm">
                {plant.scientificName}
              </p>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Family */}
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Info className="w-4 h-4" />
              <span>Family: <strong>{plant.family}</strong></span>
            </div>

            {/* Short Description */}
            {plant.shortDescription && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {plant.shortDescription}
              </p>
            )}

            {/* Medicinal Uses */}
            {plant.medicinalUses?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-green-900 mb-2">
                  <FlaskConical className="w-4 h-4" />
                  Medicinal Uses
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {plant.medicinalUses.map((use, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-green-100 text-green-800 text-xs rounded-full border border-green-200"
                    >
                      {use}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ayurvedic Names */}
            {plant.ayurvedicNames?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-green-900 mb-2">
                  <Leaf className="w-4 h-4" />
                  Ayurvedic Names
                </h3>
                <p className="text-sm text-gray-600">
                  {plant.ayurvedicNames.join(", ")}
                </p>
              </div>
            )}

            {/* Region */}
            {plant.regionNative?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-green-900 mb-2">
                  <MapPin className="w-4 h-4" />
                  Native Region
                </h3>
                <p className="text-sm text-gray-600">
                  {plant.regionNative.join(", ")}
                </p>
              </div>
            )}

            {/* Toxicity */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Toxicity:</span>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  plant.toxicityLevel === "NONE"
                    ? "bg-green-100 text-green-800"
                    : plant.toxicityLevel === "LOW"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-orange-100 text-orange-800"
                }`}
              >
                {plant.toxicityLevel}
              </span>
            </div>

            {/* View Full Details link */}
            <a
              href={`/plant/${plant.slug}`}
              className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Plant Profile
            </a>
          </div>

          {/* Bottom gradient fade */}
          <div className="h-6 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
