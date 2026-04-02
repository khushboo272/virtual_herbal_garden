import { useState } from "react";
import {
  MapPin,
  Volume2,
  VolumeOff,
  Info,
  Maximize2,
  Map,
  Eye,
  Leaf,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Compass
} from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { PlantViewer3DModal } from "../PlantViewer3DModal";

interface PlantMarker {
  id: number;
  name: string;
  botanicalName: string;
  position: { x: number; y: number };
  description: string;
  uses: string[];
  color: string;
}

const plantMarkers: PlantMarker[] = [
  {
    id: 1,
    name: "Tulsi (Holy Basil)",
    botanicalName: "Ocimum sanctum",
    position: { x: 25, y: 40 },
    description: "Sacred medicinal plant known for boosting immunity",
    uses: ["Immunity", "Stress Relief", "Respiratory Health"],
    color: "emerald"
  },
  {
    id: 2,
    name: "Aloe Vera",
    botanicalName: "Aloe barbadensis miller",
    position: { x: 60, y: 30 },
    description: "Succulent plant excellent for skin care and healing",
    uses: ["Skin Care", "Burns", "Digestive Health"],
    color: "green"
  },
  {
    id: 3,
    name: "Turmeric",
    botanicalName: "Curcuma longa",
    position: { x: 70, y: 65 },
    description: "Golden spice with powerful anti-inflammatory properties",
    uses: ["Anti-inflammatory", "Joint Pain", "Antioxidant"],
    color: "yellow"
  },
  {
    id: 4,
    name: "Lavender",
    botanicalName: "Lavandula angustifolia",
    position: { x: 35, y: 70 },
    description: "Fragrant herb that promotes relaxation and sleep",
    uses: ["Relaxation", "Sleep Aid", "Aromatherapy"],
    color: "purple"
  },
  {
    id: 5,
    name: "Ginger",
    botanicalName: "Zingiber officinale",
    position: { x: 80, y: 45 },
    description: "Warming root that aids digestion and reduces nausea",
    uses: ["Digestion", "Nausea Relief", "Anti-inflammatory"],
    color: "orange"
  }
];

export function VirtualGarden3D() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<PlantMarker | null>(null);
  const [hoveredPlant, setHoveredPlant] = useState<number | null>(null);
  const [viewer3DPlant, setViewer3DPlant] = useState<PlantMarker | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-green-200">
      {/* Background - Sky and Environment */}
      <div className="absolute inset-0">
        {/* Sky with animated clouds */}
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-sky-400 to-sky-200">
          <motion.div
            animate={{ x: [0, 100, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute top-10 left-10 w-32 h-16 bg-white/40 rounded-full blur-xl"
          />
          <motion.div
            animate={{ x: [0, -80, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-20 right-20 w-40 h-20 bg-white/30 rounded-full blur-xl"
          />
          <motion.div
            animate={{ x: [0, 120, 0] }}
            transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            className="absolute top-32 left-1/3 w-36 h-18 bg-white/35 rounded-full blur-xl"
          />
        </div>

        {/* Ground - Grass field */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-400 to-green-600">
          {/* Grass texture pattern */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity }}
                className="absolute w-1 h-2 bg-green-800 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: `${Math.random() * 50}%`
                }}
              />
            ))}
          </div>
        </div>

        {/* River */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 opacity-60">
          <motion.div
            animate={{ x: [-100, 100] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="h-full bg-white/20 blur-sm"
          />
        </div>

        {/* Trees silhouettes */}
        <div className="absolute left-10 bottom-32 w-24 h-32 bg-green-800/40 rounded-t-full" />
        <div className="absolute right-20 bottom-40 w-20 h-28 bg-green-800/40 rounded-t-full" />
        <div className="absolute left-1/3 bottom-36 w-16 h-24 bg-green-800/40 rounded-t-full" />
      </div>

      {/* Plant Markers */}
      <div className="absolute inset-0">
        {plantMarkers.map((plant) => (
          <motion.div
            key={plant.id}
            className="absolute cursor-pointer"
            style={{
              left: `${plant.position.x}%`,
              top: `${plant.position.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            whileHover={{ scale: 1.2 }}
            onHoverStart={() => setHoveredPlant(plant.id)}
            onHoverEnd={() => setHoveredPlant(null)}
            onClick={() => setSelectedPlant(plant)}
          >
            {/* Glowing marker */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-6 h-6 bg-${plant.color}-400 rounded-full shadow-lg`}
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 w-6 h-6 bg-${plant.color}-400/30 rounded-full`}
            />

            {/* Plant icon */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-${plant.color}-600 rounded-full flex items-center justify-center`}>
              <Leaf className="w-2 h-2 text-white" />
            </div>

            {/* Tooltip on hover */}
            <AnimatePresence>
              {hoveredPlant === plant.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                >
                  <div className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg shadow-xl border-2 border-green-200">
                    <p className="text-sm font-semibold text-green-900">{plant.name}</p>
                    <p className="text-xs text-green-600">Click to explore</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* UI Overlay - Top Bar */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-start justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-green-200 px-6 py-4"
        >
          <h1 className="text-2xl font-bold text-green-900 flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-600" />
            Virtual Herbal Garden
          </h1>
          <p className="text-sm text-green-600 mt-1">Explore healing plants in 3D</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2"
        >
          <Button
            variant="outline"
            size="icon"
            className="bg-white/95 backdrop-blur-md border-2 border-green-200 hover:bg-green-50"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-green-600" />
            ) : (
              <VolumeOff className="w-5 h-5 text-green-600" />
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/95 backdrop-blur-md border-2 border-green-200 hover:bg-green-50"
          >
            <Info className="w-5 h-5 text-green-600" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="bg-white/95 backdrop-blur-md border-2 border-green-200 hover:bg-green-50"
          >
            <Maximize2 className="w-5 h-5 text-green-600" />
          </Button>
        </motion.div>
      </div>

      {/* Movement Controls - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-6 left-6 z-20"
      >
        <Card className="bg-white/95 backdrop-blur-md border-2 border-green-200 p-4">
          <div className="text-center mb-3">
            <Badge className="bg-green-100 text-green-700 border-green-300">
              <Compass className="w-3 h-3 mr-1" />
              Movement
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div />
            <Button
              variant="outline"
              size="icon"
              className="border-green-300 hover:bg-green-50"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <div />
            <Button
              variant="outline"
              size="icon"
              className="border-green-300 hover:bg-green-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-green-300 hover:bg-green-50"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-green-300 hover:bg-green-50"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-green-600 text-center mt-3">
            Use WASD or arrows
          </p>
        </Card>
      </motion.div>

      {/* Mini Map - Bottom Right */}
      {showMiniMap && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute bottom-6 right-6 z-20"
        >
          <Card className="bg-white/95 backdrop-blur-md border-2 border-green-200 p-4 w-48">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                <Map className="w-3 h-3 mr-1" />
                Map
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowMiniMap(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="relative w-full h-32 bg-green-100 rounded-lg border-2 border-green-300">
              {plantMarkers.map((plant) => (
                <div
                  key={plant.id}
                  className={`absolute w-2 h-2 bg-${plant.color}-500 rounded-full`}
                  style={{
                    left: `${plant.position.x}%`,
                    top: `${plant.position.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              ))}
              {/* Player position */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Tooltip floating */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
      >
        <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border-2 border-green-200">
          <p className="text-green-900 font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            Click on glowing markers to explore plants
          </p>
        </div>
      </motion.div>

      {/* Plant Info Popup */}
      <AnimatePresence>
        {selectedPlant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 flex items-center justify-center p-6"
            onClick={() => setSelectedPlant(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border-2 border-green-200 p-8 max-w-lg w-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-green-900 mb-2">
                    {selectedPlant.name}
                  </h2>
                  <p className="text-green-600">{selectedPlant.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPlant(null)}
                  className="hover:bg-green-50"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-green-900 mb-3">Primary Uses</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPlant.uses.map((use, index) => (
                    <Badge
                      key={index}
                      className="bg-green-100 text-green-700 border-green-300"
                    >
                      {use}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Details
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    setViewer3DPlant(selectedPlant);
                    setSelectedPlant(null);
                  }}
                >
                  <Leaf className="w-4 h-4 mr-2" />
                  Open 3D Model
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Sound Indicator */}
      {soundEnabled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="bg-green-100/80 backdrop-blur-sm px-4 py-2 rounded-full border border-green-300 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700">Ambient sounds: Birds & River</span>
          </div>
        </motion.div>
      )}

      {/* 3D Plant Viewer Modal */}
      {viewer3DPlant && (
        <PlantViewer3DModal
          isOpen={!!viewer3DPlant}
          onClose={() => setViewer3DPlant(null)}
          plantName={viewer3DPlant.name}
          botanicalName={viewer3DPlant.botanicalName}
        />
      )}
    </div>
  );
}
