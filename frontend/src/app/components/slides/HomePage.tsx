import { Search, Leaf, Heart, Sparkles, Shield } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Link } from "react-router-dom";

interface HomePageProps {
  heroImage: string;
  featuredPlants: Array<{
    id: string;
    name: string;
    botanicalName: string;
    image: string;
    category: string;
  }>;
}

export function HomePage({ heroImage, featuredPlants }: HomePageProps) {
  const categories = [
    { name: "Immunity", icon: Shield, color: "bg-emerald-100 text-emerald-700", count: 24 },
    { name: "Digestion", icon: Leaf, color: "bg-green-100 text-green-700", count: 18 },
    { name: "Skin Care", icon: Sparkles, color: "bg-teal-100 text-teal-700", count: 32 },
    { name: "Heart Health", icon: Heart, color: "bg-lime-100 text-lime-700", count: 15 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50/50 to-emerald-50/30">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-300">
                Explore 200+ Medicinal Plants
              </Badge>
              <h1 className="text-5xl text-green-900 leading-tight">
                Discover the Healing Power of Nature
              </h1>
              <p className="text-lg text-green-700">
                Learn about medicinal plants through interactive 3D models, virtual tours, 
                and comprehensive botanical information.
              </p>
              
              {/* Search Bar */}
              <div className="flex gap-3 p-2 bg-white rounded-xl shadow-lg border border-green-200">
                <Search className="w-5 h-5 text-green-600 ml-2 mt-2.5" />
                <Input 
                  placeholder="Search for medicinal plants..." 
                  className="border-0 focus-visible:ring-0 text-base"
                />
                <Button className="bg-green-600 hover:bg-green-700">Search</Button>
              </div>
            </div>

            {/* 3D Plant Visualization Placeholder */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                <img 
                  src={heroImage} 
                  alt="Medicinal Herbs" 
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-900/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30">
                    Interactive 3D View
                  </Badge>
                </div>
              </div>
              {/* Floating decoration */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-green-200 rounded-full blur-3xl opacity-50"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-50"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl text-green-900 mb-2">Browse by Category</h2>
            <p className="text-green-600">Explore plants based on their medicinal properties</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.name} to="/library" className="no-underline">
              <Card 
                className="group hover:shadow-xl transition-all cursor-pointer border-2 border-green-100 hover:border-green-300 bg-white h-full"
              >
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <category.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg text-green-900 mb-1">{category.name}</h3>
                  <p className="text-sm text-green-600">{category.count} plants</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Plants Carousel */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl text-green-900 mb-2">Featured Medicinal Plants</h2>
          <p className="text-green-600">Popular and widely studied herbal remedies</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredPlants.slice(0, 3).map((plant) => (
            <Card 
              key={plant.id} 
              className="group overflow-hidden border-2 border-green-100 hover:border-green-300 hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="relative overflow-hidden">
                <img 
                  src={plant.image} 
                  alt={plant.name}
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/90 backdrop-blur-sm text-green-700 border-green-200">
                    {plant.category}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl text-green-900 mb-1">{plant.name}</h3>
                <p className="text-sm italic text-green-600 mb-4">{plant.botanicalName}</p>
                <Link to={`/plant/${plant.id}`}>
                  <Button variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-50">
                    Explore Plant
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
