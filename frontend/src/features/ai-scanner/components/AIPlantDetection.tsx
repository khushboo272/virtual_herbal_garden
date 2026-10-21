import { useState, useEffect, useRef } from "react";
import { Upload, Camera, Sparkles, Check, Leaf, Eye, AlertTriangle, RefreshCw, Search, Clock } from "lucide-react";
import { Button } from "../../../app/components/ui/button";
import { Card } from "../../../app/components/ui/card";
import { Badge } from "../../../app/components/ui/badge";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useDetection } from "../hooks/useDetection";
import type { DetectionResult } from "../types/detection.types";

interface AIPlantDetectionProps {
  onViewDetails?: (plantName: string) => void;
  isAuthenticated?: boolean;
}

// ── Sub-component: Analysis Results ──────────────────────────────────────────

function ResultCard({ result }: { result: DetectionResult }) {
  const navigate = useNavigate();
  const confidencePct = Math.round((result.topMatch?.confidence ?? 0) * 100);
  const isLowConfidence = (result.topMatch?.confidence ?? 0) < 0.5;
  const showAlternatives = (result.topMatch?.confidence ?? 1) < 0.7 && result.alternatives.length > 0;

  function handleViewDetails() {
    if (result.plantSlug) {
      navigate(`/plants/${result.plantSlug}`);
    } else if (result.topMatch?.scientificName) {
      navigate(`/library?q=${encodeURIComponent(result.topMatch.scientificName)}`);
    }
  }

  function handleViewIn3D() {
    if (result.plantId) {
      navigate(`/garden-3d?highlight=${result.plantId}`);
    }
  }

  // Not a plant
  if (!result.isPlant) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="p-6 bg-amber-100 rounded-full inline-flex mb-4">
              <Leaf className="w-12 h-12 text-amber-600" />
            </div>
            <p className="text-green-900 font-semibold text-lg">No plant detected in this image</p>
            {result.imageQualityNote && (
              <p className="text-green-600 text-sm mt-2">{result.imageQualityNote}</p>
            )}
            <p className="text-green-500 text-sm mt-2">
              Try uploading a clearer photo that clearly shows a plant.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Confidence Badge */}
      <div className="flex items-center justify-between">
        <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-2 text-lg">
          <Check className="w-4 h-4 mr-2" />
          {confidencePct}% Match
        </Badge>
      </div>

      {/* Low confidence notice */}
      {isLowConfidence && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Low confidence — try a clearer photo for a more accurate result.
        </div>
      )}

      {/* Plant identity */}
      <div>
        <h3 className="text-3xl font-bold text-green-900 mb-1">
          {result.topMatch?.commonName}
        </h3>
        {result.topMatch?.scientificName && (
          <p className="text-green-600 italic">{result.topMatch.scientificName}</p>
        )}
        {result.topMatch?.family && (
          <p className="text-green-500 text-sm">Family: {result.topMatch.family}</p>
        )}
      </div>

      {/* Description */}
      {result.description && (
        <p className="text-green-700 text-sm leading-relaxed">{result.description}</p>
      )}

      {/* Image quality note */}
      {result.imageQualityNote && (
        <p className="text-amber-700 text-xs italic border-l-2 border-amber-300 pl-3">
          {result.imageQualityNote}
        </p>
      )}

      {/* Medicinal Uses */}
      {result.medicinalUses.length > 0 && (
        <div>
          <h4 className="font-semibold text-green-900 mb-3">Medicinal Uses</h4>
          <div className="space-y-2">
            {result.medicinalUses.map((use, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="flex items-start gap-2"
              >
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-green-700 text-sm">{use}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Key Benefits */}
      {result.keyBenefits.length > 0 && (
        <div>
          <h4 className="font-semibold text-green-900 mb-3">Key Benefits</h4>
          <div className="grid grid-cols-2 gap-2">
            {result.keyBenefits.map((benefit, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-green-300 text-green-700 w-full justify-start text-xs"
              >
                {benefit}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Precautions */}
      {result.precautions.length > 0 && (
        <div>
          <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-1 text-sm">
            <AlertTriangle className="w-4 h-4" />
            Precautions
          </h4>
          <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
            {result.precautions.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {showAlternatives && (
        <div>
          <h4 className="font-semibold text-green-900 mb-2 text-sm">It could also be...</h4>
          <div className="space-y-1">
            {result.alternatives.map((alt, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-2 bg-green-50 rounded">
                <span className="text-green-800">
                  {alt.commonName}
                  {alt.scientificName && <span className="italic text-green-600 ml-1">({alt.scientificName})</span>}
                </span>
                <span className="text-green-600 font-medium">{Math.round(alt.confidence * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700"
          onClick={handleViewDetails}
          id="scanner-view-details-btn"
        >
          <Eye className="w-4 h-4 mr-2" />
          {result.plantSlug ? "View Full Details" : "Search in Library"}
          {!result.plantSlug && <Search className="w-3 h-3 ml-1" />}
        </Button>
        {result.plantId && (
          <Button
            variant="outline"
            className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
            onClick={handleViewIn3D}
            id="scanner-view-3d-btn"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            View in 3D
          </Button>
        )}
      </div>

      {/* Disclaimer footer */}
      <p className="text-xs text-green-500 border-t border-green-100 pt-3 leading-relaxed">
        AI identification can be wrong and is not medical advice. Confirm with an expert before using any plant medicinally.
      </p>
    </motion.div>
  );
}

// ── Sub-component: Recent Scans ───────────────────────────────────────────────

function RecentScans({
  history,
  onSelect,
}: {
  history: DetectionResult[];
  onSelect: (id: string) => void;
}) {
  const recent = history.slice(0, 5);
  if (recent.length === 0) return null;

  return (
    <div className="mt-8 max-w-6xl mx-auto">
      <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Recent Scans
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {recent.map((scan) => (
          <button
            key={scan.id}
            onClick={() => onSelect(scan.id)}
            className="group relative rounded-xl overflow-hidden border border-green-200 bg-white/80 hover:border-green-400 transition-all text-left"
            id={`recent-scan-${scan.id}`}
          >
            {scan.imageUrl ? (
              <img
                src={scan.imageUrl}
                alt={scan.topMatch?.commonName ?? "Scan"}
                className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-24 bg-green-100 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-green-400" />
              </div>
            )}
            <div className="p-2">
              <p className="text-xs font-medium text-green-900 truncate">
                {scan.topMatch?.commonName ?? (scan.isPlant === false ? "No plant" : "Unknown")}
              </p>
              {scan.topMatch && (
                <p className="text-xs text-green-600">
                  {Math.round((scan.topMatch.confidence) * 100)}%
                </p>
              )}
              <p className="text-xs text-green-400">
                {new Date(scan.createdAt).toLocaleDateString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AIPlantDetection({ onViewDetails: _onViewDetails }: AIPlantDetectionProps) {
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    result,
    error,
    errorCode,
    history,
    analyze,
    reset,
    loadHistory,
    loadScan,
  } = useDetection();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function handleFileSelected(file: File) {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    analyze(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  }

  function handleReset() {
    reset();
    setSelectedImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRetry() {
    if (selectedFile) {
      analyze(selectedFile);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">AI-Powered Plant Detection</span>
          </div>
          <h1 className="text-5xl font-bold text-green-900 mb-4">Identify Plants Instantly</h1>
          <p className="text-xl text-green-600 max-w-2xl mx-auto">
            Upload a plant image and let our AI identify it with detailed information about its medicinal properties
          </p>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-green-200">
            <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
              <Camera className="w-6 h-6" />
              Upload Plant Image
            </h2>

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                selectedImagePreview
                  ? "border-green-300 bg-green-50/50"
                  : "border-green-300 bg-white hover:bg-green-50/30 hover:border-green-400"
              }`}
            >
              {!selectedImagePreview ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-6 bg-green-100 rounded-full">
                      <Upload className="w-12 h-12 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-green-900 mb-2">
                      Drag & drop your plant image
                    </p>
                    <p className="text-green-600 mb-4">or click to browse</p>
                  </div>
                  <label htmlFor="image-upload">
                    <Button className="bg-green-600 hover:bg-green-700" asChild>
                      <span className="cursor-pointer">
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </span>
                    </Button>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleInputChange}
                  />
                  <p className="text-sm text-green-500 mt-4">Supports: JPG, PNG, WebP (Max 5 MB)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <img
                    src={selectedImagePreview}
                    alt="Uploaded plant"
                    className="max-h-64 mx-auto rounded-lg shadow-lg"
                  />
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    onClick={handleReset}
                    id="upload-different-btn"
                  >
                    Upload Different Image
                  </Button>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Tips for Best Results
              </h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Use clear, well-lit images</li>
                <li>• Focus on leaves and distinctive features</li>
                <li>• Avoid blurry or dark photos</li>
                <li>• Include the whole plant if possible</li>
              </ul>
            </div>
          </Card>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-8 bg-white/80 backdrop-blur-sm border-2 border-green-200 min-h-[500px]">
            <h2 className="text-2xl font-bold text-green-900 mb-6 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              Analysis Results
            </h2>

            {/* Idle state */}
            {status === "idle" && !result && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="p-6 bg-green-100 rounded-full inline-flex mb-4">
                    <Leaf className="w-12 h-12 text-green-600" />
                  </div>
                  <p className="text-green-600">Upload an image to see AI analysis results</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {status === "uploading" && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="p-6 bg-green-100 rounded-full inline-flex mb-4"
                  >
                    <Sparkles className="w-12 h-12 text-green-600" />
                  </motion.div>
                  <p className="text-green-900 font-medium">Analyzing your plant...</p>
                  <p className="text-green-600 text-sm mt-2">This may take a few seconds</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {status === "error" && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="p-6 bg-red-100 rounded-full inline-flex">
                    <AlertTriangle className="w-12 h-12 text-red-500" />
                  </div>
                  <p className="text-red-700 font-medium">{error}</p>
                  {errorCode !== "VALIDATION" && (
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleRetry}
                      id="scan-retry-btn"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Success state */}
            {status === "success" && result && <ResultCard result={result} />}
          </Card>
        </motion.div>
      </div>

      {/* Recent Scans */}
      <RecentScans history={history} onSelect={loadScan} />
    </div>
  );
}
