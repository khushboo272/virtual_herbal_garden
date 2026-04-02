import { useState } from "react";
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Leaf,
  Move,
  Info,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { motion, AnimatePresence } from "motion/react";

interface PlantPart {
  name: string;
  description: string;
  position: { x: number; y: number };
}

const plantParts: PlantPart[] = [
  {
    name: "Leaves",
    description: "Primary medicinal component, rich in essential oils",
    position: { x: 50, y: 25 }
  },
  {
    name: "Stem",
    description: "Provides structural support and nutrient transport",
    position: { x: 50, y: 50 }
  },
  {
    name: "Root",
    description: "Contains bioactive compounds, used in traditional medicine",
    position: { x: 50, y: 75 }
  }
];

interface PlantViewer3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantName: string;
  botanicalName: string;
}

export function PlantViewer3DModal({ isOpen, onClose, plantName, botanicalName }: PlantViewer3DModalProps) {
  const [zoomLevel, setZoomLevel] = useState([50]);
  const [rotation, setRotation] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedPart, setSelectedPart] = useState<PlantPart | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleZoomIn = () => {
    setZoomLevel([Math.min(100, zoomLevel[0] + 10)]);
  };

  const handleZoomOut = () => {
    setZoomLevel([Math.max(0, zoomLevel[0] - 10)]);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 45) % 360);
  };

  const handleReset = () => {
    setZoomLevel([50]);
    setRotation(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-white/90 backdrop-blur-md border-b-2 border-green-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-green-900 flex items-center gap-2">
                  <Leaf className="w-8 h-8 text-green-600" />
                  3D Plant Viewer
                </h2>
                <p className="text-green-600 mt-1">
                  Interactive 3D model of {plantName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-2">
                  <Eye className="w-4 h-4 mr-2" />
                  3D Mode
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-green-100 h-10 w-10"
                >
                  <X className="w-6 h-6 text-green-700" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Controls Panel - Left */}
              <div className="lg:col-span-1 space-y-4">
                {/* Zoom Controls */}
                <Card className="p-4 bg-white/90 backdrop-blur-sm border-2 border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-sm">
                    <ZoomIn className="w-4 h-4" />
                    Zoom Level
                  </h3>
                  <div className="space-y-3">
                    <Slider
                      value={zoomLevel}
                      onValueChange={setZoomLevel}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomOut}
                        className="border-green-300 text-green-700 hover:bg-green-50 h-8 px-2"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-sm font-medium text-green-700">
                        {zoomLevel[0]}%
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleZoomIn}
                        className="border-green-300 text-green-700 hover:bg-green-50 h-8 px-2"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Rotation Controls */}
                <Card className="p-4 bg-white/90 backdrop-blur-sm border-2 border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-sm">
                    <RotateCw className="w-4 h-4" />
                    Rotation
                  </h3>
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {rotation}°
                      </div>
                      <p className="text-xs text-green-600 mt-1">Current angle</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                      onClick={handleRotate}
                    >
                      <RotateCw className="w-4 h-4 mr-2" />
                      Rotate 45°
                    </Button>
                  </div>
                </Card>

                {/* View Options */}
                <Card className="p-4 bg-white/90 backdrop-blur-sm border-2 border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4" />
                    View Options
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant={showLabels ? "default" : "outline"}
                      size="sm"
                      className={`w-full ${
                        showLabels
                          ? "bg-green-600 hover:bg-green-700"
                          : "border-green-300 text-green-700 hover:bg-green-50"
                      }`}
                      onClick={() => setShowLabels(!showLabels)}
                    >
                      <Info className="w-4 h-4 mr-2" />
                      {showLabels ? "Hide" : "Show"} Labels
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset View
                    </Button>
                  </div>
                </Card>

                {/* Instructions */}
                <Card className="p-3 bg-green-50 border-2 border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2 text-xs flex items-center gap-2">
                    <Move className="w-3 h-3" />
                    Controls
                  </h4>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• <strong>Drag</strong> to rotate</li>
                    <li>• <strong>Scroll</strong> to zoom</li>
                    <li>• <strong>Click parts</strong> for info</li>
                  </ul>
                </Card>
              </div>

              {/* 3D Viewer - Center */}
              <div className="lg:col-span-2">
                <Card className="p-6 bg-white/90 backdrop-blur-sm border-2 border-green-200 h-full min-h-[500px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-900">
                      Interactive 3D Model
                    </h3>
                    <Badge className="bg-green-100 text-green-700 border-green-300 text-sm">
                      <Move className="w-3 h-3 mr-1" />
                      Drag to rotate
                    </Badge>
                  </div>

                  {/* 3D Viewer Container */}
                  <div
                    className="relative bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border-2 border-green-300 overflow-hidden"
                    style={{ height: 'calc(100% - 60px)' }}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                  >
                    {/* 3D Plant Representation */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      animate={{
                        rotate: rotation,
                        scale: zoomLevel[0] / 50
                      }}
                      transition={{ type: "spring", damping: 20 }}
                      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    >
                      {/* Plant Visual */}
                      <div className="relative">
                        {/* Leaves */}
                        <motion.div
                          className="relative z-10"
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedPart(plantParts[0])}
                        >
                          <svg width="200" height="120" viewBox="0 0 200 120">
                            {/* Multiple leaves */}
                            <ellipse cx="100" cy="40" rx="35" ry="25" fill="#4ade80" opacity="0.9" />
                            <ellipse cx="70" cy="50" rx="30" ry="22" fill="#22c55e" opacity="0.85" />
                            <ellipse cx="130" cy="50" rx="30" ry="22" fill="#22c55e" opacity="0.85" />
                            <ellipse cx="85" cy="65" rx="28" ry="20" fill="#16a34a" opacity="0.8" />
                            <ellipse cx="115" cy="65" rx="28" ry="20" fill="#16a34a" opacity="0.8" />
                            <ellipse cx="100" cy="75" rx="32" ry="23" fill="#15803d" opacity="0.75" />

                            {/* Leaf veins */}
                            {[100, 70, 130, 85, 115, 100].map((x, i) => (
                              <line
                                key={i}
                                x1={x}
                                y1={40 + i * 8}
                                x2={x}
                                y2={55 + i * 8}
                                stroke="#166534"
                                strokeWidth="1"
                                opacity="0.3"
                              />
                            ))}
                          </svg>
                          {showLabels && (
                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-green-300 text-xs font-semibold text-green-900 whitespace-nowrap">
                              Leaves
                            </div>
                          )}
                        </motion.div>

                        {/* Stem */}
                        <motion.div
                          className="relative z-5"
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedPart(plantParts[1])}
                        >
                          <svg width="200" height="200" viewBox="0 0 200 200" className="-mt-12">
                            <rect x="92" y="0" width="16" height="180" fill="#16a34a" rx="8" />
                            <rect x="94" y="0" width="4" height="180" fill="#22c55e" opacity="0.5" />
                            <rect x="75" y="60" width="12" height="3" fill="#16a34a" rx="1.5" />
                            <rect x="113" y="80" width="12" height="3" fill="#16a34a" rx="1.5" />
                            <rect x="70" y="100" width="14" height="3" fill="#16a34a" rx="1.5" />
                          </svg>
                          {showLabels && (
                            <div className="absolute -left-20 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-green-300 text-xs font-semibold text-green-900 whitespace-nowrap">
                              Stem
                            </div>
                          )}
                        </motion.div>

                        {/* Root */}
                        <motion.div
                          className="relative z-0"
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedPart(plantParts[2])}
                        >
                          <svg width="200" height="100" viewBox="0 0 200 100" className="-mt-36">
                            <path d="M100,0 Q85,30 75,80" stroke="#a16207" strokeWidth="8" fill="none" />
                            <path d="M100,0 Q100,25 100,80" stroke="#854d0e" strokeWidth="10" fill="none" />
                            <path d="M100,0 Q115,30 125,80" stroke="#a16207" strokeWidth="8" fill="none" />
                            <path d="M100,20 Q80,40 70,70" stroke="#ca8a04" strokeWidth="5" fill="none" />
                            <path d="M100,20 Q120,40 130,70" stroke="#ca8a04" strokeWidth="5" fill="none" />
                          </svg>
                          {showLabels && (
                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-green-300 text-xs font-semibold text-green-900 whitespace-nowrap">
                              Root
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Grid background */}
                    <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16a34a" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                </Card>
              </div>

              {/* Information Panel - Right */}
              <div className="lg:col-span-1 space-y-4">
                {/* Plant Info */}
                <Card className="p-4 bg-white/90 backdrop-blur-sm border-2 border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-sm">
                    <Leaf className="w-4 h-4 text-green-600" />
                    Plant Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-green-600 mb-1">Common Name</p>
                      <p className="font-semibold text-green-900 text-sm">{plantName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 mb-1">Botanical Name</p>
                      <p className="font-semibold text-green-900 italic text-sm">{botanicalName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-600 mb-1">Parts Used</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                          Leaves
                        </Badge>
                        <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                          Seeds
                        </Badge>
                        <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                          Roots
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Selected Part Info */}
                {selectedPart ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className="p-4 bg-green-50 border-2 border-green-300">
                      <h3 className="font-semibold text-green-900 mb-2 text-sm">
                        {selectedPart.name}
                      </h3>
                      <p className="text-xs text-green-700 mb-3">
                        {selectedPart.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-green-300 text-green-700 hover:bg-green-100 text-xs"
                        onClick={() => setSelectedPart(null)}
                      >
                        Clear Selection
                      </Button>
                    </Card>
                  </motion.div>
                ) : (
                  <Card className="p-4 bg-green-50 border-2 border-green-200">
                    <p className="text-xs text-green-600 text-center">
                      Click on plant parts to view detailed information
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
