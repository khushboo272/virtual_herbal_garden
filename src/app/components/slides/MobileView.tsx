import { Home, Search, BookmarkIcon, User, Leaf, Camera, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface MobileViewProps {
  plants: Array<{
    id: number;
    name: string;
    image: string;
    category: string;
  }>;
}

export function MobileView({ plants }: MobileViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 max-w-md mx-auto">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 pt-12 pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-white mb-1">Virtual Garden</h1>
            <p className="text-sm text-green-100">Explore medicinal plants</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <Leaf className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Mobile Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
          <Input 
            placeholder="Search plants..." 
            className="w-full pl-12 pr-12 py-6 bg-white border-0 shadow-lg rounded-2xl"
          />
          <Button 
            size="icon" 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 hover:bg-green-700 rounded-xl"
          >
            <Camera className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-6 py-6 overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {['All', 'Immunity', 'Digestion', 'Skin Care', 'Heart Health'].map((category) => (
            <Badge 
              key={category}
              className={`px-4 py-2 rounded-full whitespace-nowrap cursor-pointer ${
                category === 'All' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-green-700 border-2 border-green-200 hover:border-green-400'
              }`}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 mb-4 flex items-center justify-between">
        <h2 className="text-lg text-green-900">Featured Plants</h2>
        <Button size="sm" variant="outline" className="border-green-300 text-green-700">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Mobile Plant Cards */}
      <div className="px-6 pb-24 space-y-4">
        {plants.map((plant) => (
          <Card 
            key={plant.id}
            className="overflow-hidden border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all active:scale-95"
          >
            <CardContent className="p-0">
              <div className="flex gap-4">
                <img 
                  src={plant.image} 
                  alt={plant.name}
                  className="w-32 h-32 object-cover"
                />
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <Badge className="mb-2 bg-green-100 text-green-700 border-green-300 text-xs">
                      {plant.category}
                    </Badge>
                    <h3 className="text-base text-green-900 mb-2">{plant.name}</h3>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 w-full rounded-lg"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t-2 border-green-200 shadow-2xl rounded-t-3xl">
        <div className="grid grid-cols-4 gap-2 px-6 py-4">
          <button className="flex flex-col items-center gap-1 text-green-600 active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
            <span className="text-xs">Home</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-green-700 active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center">
              <Search className="w-6 h-6" />
            </div>
            <span className="text-xs">Search</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-green-700 active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center">
              <BookmarkIcon className="w-6 h-6" />
            </div>
            <span className="text-xs">Saved</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-green-700 active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-transparent rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}
