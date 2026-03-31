import { Search, SlidersHorizontal, Grid3x3, List, X, Eye, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useState } from "react";
import { PlantViewer3DModal } from "../PlantViewer3DModal";
import { Link } from "react-router-dom";

interface Plant {
  id: number;
  name: string;
  botanicalName: string;
  image: string;
  category: string;
  region: string;
  uses: string[];
}

interface PlantLibraryProps {
  plants: Plant[];
}

export function PlantLibrary({ plants }: PlantLibraryProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected3DPlant, setSelected3DPlant] = useState<Plant | null>(null);

  const filters = {
    categories: ["Immunity", "Digestion", "Skin Care", "Pain Relief", "Respiratory"],
    regions: ["Tropical", "Temperate", "Desert", "Mediterranean"],
    plantTypes: ["Herb", "Shrub", "Tree", "Climber"],
    partsUsed: ["Leaves", "Roots", "Flowers", "Bark", "Seeds"]
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => setSelectedFilters([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl text-green-900 mb-3">Plant Library</h1>
          <p className="text-lg text-green-600">
            Browse our comprehensive collection of medicinal plants
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-2 border-green-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg text-green-900">Filters</h3>
                  {selectedFilters.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="text-green-600 hover:text-green-700"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                {/* Active Filters */}
                {selectedFilters.length > 0 && (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {selectedFilters.map(filter => (
                      <Badge 
                        key={filter}
                        className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                        onClick={() => toggleFilter(filter)}
                      >
                        {filter}
                        <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Filter Groups */}
                <div className="space-y-6">
                  {/* Categories */}
                  <div>
                    <h4 className="text-sm text-green-800 mb-3">Medicinal Use</h4>
                    <div className="space-y-2">
                      {filters.categories.map(category => (
                        <label key={category} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedFilters.includes(category)}
                            onChange={() => toggleFilter(category)}
                            className="rounded border-green-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Regions */}
                  <div>
                    <h4 className="text-sm text-green-800 mb-3">Region</h4>
                    <div className="space-y-2">
                      {filters.regions.map(region => (
                        <label key={region} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedFilters.includes(region)}
                            onChange={() => toggleFilter(region)}
                            className="rounded border-green-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-700">{region}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Plant Type */}
                  <div>
                    <h4 className="text-sm text-green-800 mb-3">Plant Type</h4>
                    <div className="space-y-2">
                      {filters.plantTypes.map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={selectedFilters.includes(type)}
                            onChange={() => toggleFilter(type)}
                            className="rounded border-green-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm text-green-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and View Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-green-600" />
                <Input 
                  placeholder="Search plants by name..." 
                  className="pl-10 border-green-200 bg-white focus:border-green-400"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-green-600' : 'border-green-300 text-green-700'}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-green-600' : 'border-green-300 text-green-700'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-4">
              <p className="text-sm text-green-600">
                Showing {plants.length} plants
              </p>
            </div>

            {/* Plants Grid */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {plants.map((plant) => (
                <Card 
                  key={plant.id}
                  className="group overflow-hidden border-2 border-green-100 hover:border-green-300 hover:shadow-xl transition-all cursor-pointer bg-white"
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={plant.image} 
                      alt={plant.name}
                      className={`w-full object-cover group-hover:scale-110 transition-transform duration-500 ${
                        viewMode === 'grid' ? 'h-48' : 'h-32'
                      }`}
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white/90 backdrop-blur-sm text-green-700 border-green-200 text-xs">
                        {plant.category}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-lg text-green-900 mb-1">{plant.name}</h3>
                    <p className="text-sm italic text-green-600 mb-3">{plant.botanicalName}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {plant.uses.slice(0, 2).map((use, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs border-green-300 text-green-700"
                        >
                          {use}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/plant/${plant.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 w-full border-green-300 text-green-700 hover:bg-green-50"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected3DPlant(plant);
                        }}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        View in 3D
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Plant Viewer Modal */}
      {selected3DPlant && (
        <PlantViewer3DModal
          isOpen={!!selected3DPlant}
          onClose={() => setSelected3DPlant(null)}
          plantName={selected3DPlant.name}
          botanicalName={selected3DPlant.botanicalName}
        />
      )}
    </div>
  );
}
