import { useState } from "react";
import { Upload, Camera, Sparkles, Check, Leaf, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { motion } from "motion/react";
import { PlantViewer3DModal } from "../PlantViewer3DModal";

interface AIPlantDetectionProps {
  onViewDetails?: (plantName: string) => void;
}

export function AIPlantDetection({ onViewDetails }: AIPlantDetectionProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [result, setResult] = useState<{
    name: string;
    botanicalName: string;
    confidence: number;
    uses: string[];
    benefits: string[];
  } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = () => {
    setIsAnalyzing(true);
    setResult(null);

    // Simulate AI analysis
    setTimeout(() => {
      setResult({
        name: "Tulsi (Holy Basil)",
        botanicalName: "Ocimum sanctum",
        confidence: 94.5,
        uses: [
          "Boosts immune system",
          "Reduces stress and anxiety",
          "Anti-inflammatory properties",
          "Respiratory health support"
        ],
        benefits: [
          "Rich in antioxidants",
          "Adaptogenic herb",
          "Supports overall wellness",
          "Natural antibacterial"
        ]
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  };

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
          <h1 className="text-5xl font-bold text-green-900 mb-4">
            Identify Plants Instantly
          </h1>
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
              className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all ${
                selectedImage
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-green-300 bg-white hover:bg-green-50/30 hover:border-green-400'
              }`}
            >
              {!selectedImage ? (
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
                    <p className="text-green-600 mb-4">
                      or click to browse
                    </p>
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
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-sm text-green-500 mt-4">
                    Supports: JPG, PNG, WebP (Max 10MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <img
                    src={selectedImage}
                    alt="Uploaded plant"
                    className="max-h-64 mx-auto rounded-lg shadow-lg"
                  />
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      setSelectedImage(null);
                      setResult(null);
                      setIsAnalyzing(false);
                    }}
                  >
                    Upload Different Image
                  </Button>
                </div>
              )}
            </div>

            {/* Quick Tips */}
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

            {!selectedImage && !isAnalyzing && !result && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="p-6 bg-green-100 rounded-full inline-flex mb-4">
                    <Leaf className="w-12 h-12 text-green-600" />
                  </div>
                  <p className="text-green-600">
                    Upload an image to see AI analysis results
                  </p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="p-6 bg-green-100 rounded-full inline-flex mb-4"
                  >
                    <Sparkles className="w-12 h-12 text-green-600" />
                  </motion.div>
                  <p className="text-green-900 font-medium">Analyzing plant...</p>
                  <p className="text-green-600 text-sm mt-2">This may take a few seconds</p>
                </div>
              </div>
            )}

            {result && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Confidence Badge */}
                <div className="flex items-center justify-between">
                  <Badge className="bg-green-100 text-green-700 border-green-300 px-4 py-2 text-lg">
                    <Check className="w-4 h-4 mr-2" />
                    {result.confidence}% Match
                  </Badge>
                </div>

                {/* Plant Info */}
                <div>
                  <h3 className="text-3xl font-bold text-green-900 mb-1">
                    {result.name}
                  </h3>
                  <p className="text-green-600 italic">{result.botanicalName}</p>
                </div>

                {/* Uses */}
                <div>
                  <h4 className="font-semibold text-green-900 mb-3">Medicinal Uses</h4>
                  <div className="space-y-2">
                    {result.uses.map((use, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-green-700">{use}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="font-semibold text-green-900 mb-3">Key Benefits</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {result.benefits.map((benefit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                      >
                        <Badge variant="outline" className="border-green-300 text-green-700 w-full justify-start">
                          {benefit}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => onViewDetails?.(result.name)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Full Details
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => setShow3DViewer(true)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    View in 3D
                  </Button>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* 3D Plant Viewer Modal */}
      {result && (
        <PlantViewer3DModal
          isOpen={show3DViewer}
          onClose={() => setShow3DViewer(false)}
          plantName={result.name}
          botanicalName={result.botanicalName}
        />
      )}
    </div>
  );
}
