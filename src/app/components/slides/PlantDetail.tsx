import { useState } from "react";
import { ArrowLeft, Leaf, MapPin, Calendar, AlertCircle, BookOpen, Video, Volume2, Heart, Share2, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PlantViewer3DModal } from "../PlantViewer3DModal";
import { Link } from "react-router-dom";

interface PlantDetailProps {
  plant: {
    name: string;
    botanicalName: string;
    image: string;
    category: string;
    region: string;
    description: string;
    medicinalUses: string[];
    cultivation: string;
    partsUsed: string[];
    precautions: string[];
  };
}

export function PlantDetail({ plant }: PlantDetailProps) {
  const [show3DViewer, setShow3DViewer] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link to="/library">
          <Button 
            variant="ghost" 
            className="mb-6 text-green-700 hover:text-green-800 hover:bg-green-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </Link>

        {/* Header Section */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* 3D Model Viewer */}
          <div className="relative">
            <Card className="overflow-hidden border-4 border-white shadow-2xl bg-gradient-to-br from-green-100 to-emerald-100">
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={plant.image} 
                    alt={plant.name}
                    className="w-full h-[500px] object-cover"
                  />
                  {/* 3D Interactive View Button */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 shadow-2xl"
                      onClick={() => setShow3DViewer(true)}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Open 3D Interactive View
                    </Button>
                  </div>
                  
                  {/* Hotspot markers */}
                  <div className="absolute top-20 right-20 w-8 h-8 bg-green-500 rounded-full animate-pulse border-4 border-white shadow-lg cursor-pointer"></div>
                  <div className="absolute bottom-32 left-16 w-8 h-8 bg-emerald-500 rounded-full animate-pulse border-4 border-white shadow-lg cursor-pointer"></div>
                </div>
              </CardContent>
            </Card>

            {/* Multimedia Panel */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Card className="border-2 border-green-200 hover:border-green-400 cursor-pointer transition-colors bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Video className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs text-green-700">Video Tour</span>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200 hover:border-green-400 cursor-pointer transition-colors bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Volume2 className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs text-green-700">Audio Info</span>
                </CardContent>
              </Card>
              <Card className="border-2 border-green-200 hover:border-green-400 cursor-pointer transition-colors bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-xs text-green-700">Resources</span>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Plant Information */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Badge className="mb-3 bg-green-100 text-green-700 border-green-300">
                    {plant.category}
                  </Badge>
                  <h1 className="text-4xl text-green-900 mb-2">{plant.name}</h1>
                  <p className="text-xl italic text-green-600">{plant.botanicalName}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="border-green-300 text-green-700">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="border-green-300 text-green-700">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="border-2 border-green-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Region</p>
                        <p className="text-sm text-green-900">{plant.region}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-green-200 bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-green-600">Type</p>
                        <p className="text-sm text-green-900">Herb</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabbed Information */}
            <Tabs defaultValue="uses" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-green-100">
                <TabsTrigger value="uses" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
                  Medicinal Uses
                </TabsTrigger>
                <TabsTrigger value="cultivation" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
                  Cultivation
                </TabsTrigger>
                <TabsTrigger value="precautions" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
                  Precautions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="uses" className="space-y-4 mt-4">
                <Card className="border-2 border-green-200 bg-white">
                  <CardContent className="p-6">
                    <p className="text-green-700 mb-4">{plant.description}</p>
                    <h4 className="text-sm text-green-800 mb-3">Key Benefits:</h4>
                    <ul className="space-y-2">
                      {plant.medicinalUses.map((use, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                          <Leaf className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {use}
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-6">
                      <h4 className="text-sm text-green-800 mb-3">Parts Used:</h4>
                      <div className="flex flex-wrap gap-2">
                        {plant.partsUsed.map((part, idx) => (
                          <Badge 
                            key={idx}
                            variant="outline"
                            className="border-green-300 text-green-700"
                          >
                            {part}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="cultivation" className="space-y-4 mt-4">
                <Card className="border-2 border-green-200 bg-white">
                  <CardContent className="p-6">
                    <p className="text-green-700">{plant.cultivation}</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="precautions" className="space-y-4 mt-4">
                <Card className="border-2 border-amber-200 bg-amber-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-green-900 mb-2">Important Safety Information</h4>
                        <ul className="space-y-2">
                          {plant.precautions.map((precaution, idx) => (
                            <li key={idx} className="text-sm text-green-700">
                              • {precaution}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 3D Plant Viewer Modal */}
      <PlantViewer3DModal
        isOpen={show3DViewer}
        onClose={() => setShow3DViewer(false)}
        plantName={plant.name}
        botanicalName={plant.botanicalName}
      />
    </div>
  );
}
