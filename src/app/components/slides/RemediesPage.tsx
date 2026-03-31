import { useState } from "react";
import { Search, Thermometer, Wind, HeartPulse, Brain, Droplets, Pill, Leaf } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { motion } from "motion/react";

interface Remedy {
  id: number;
  problem: string;
  category: string;
  icon: typeof Thermometer;
  recommendedPlant: string;
  botanicalName: string;
  plantImage: string;
  preparation: string[];
  dosage: string;
  precautions: string[];
  effectiveness: number;
}

const remedies: Remedy[] = [
  {
    id: 1,
    problem: "Common Cold & Cough",
    category: "Respiratory",
    icon: Wind,
    recommendedPlant: "Tulsi (Holy Basil)",
    botanicalName: "Ocimum sanctum",
    plantImage: "https://images.unsplash.com/photo-1754493930441-2550a605e805?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dWxzaSUyMGJhc2lsJTIwcGxhbnR8ZW58MXx8fHwxNzY2OTk0ODY2fDA&ixlib=rb-4.1.0&q=80&w=400",
    preparation: [
      "Boil 10-15 fresh Tulsi leaves in 2 cups of water",
      "Add a pinch of black pepper and ginger",
      "Simmer for 10 minutes",
      "Strain and add honey to taste",
      "Drink warm 2-3 times daily"
    ],
    dosage: "1 cup, 2-3 times daily",
    precautions: ["Avoid if pregnant", "May lower blood sugar"],
    effectiveness: 92
  },
  {
    id: 2,
    problem: "Stress & Anxiety",
    category: "Mental Health",
    icon: Brain,
    recommendedPlant: "Lavender",
    botanicalName: "Lavandula angustifolia",
    plantImage: "https://images.unsplash.com/photo-1541927634837-a7d5c4892527?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXZlbmRlciUyMGZsb3dlcnN8ZW58MXx8fHwxNzY2OTMyNTQwfDA&ixlib=rb-4.1.0&q=80&w=400",
    preparation: [
      "Take 1-2 teaspoons of dried lavender flowers",
      "Steep in 1 cup of hot water for 5-10 minutes",
      "Cover to preserve essential oils",
      "Strain and drink before bedtime",
      "Alternatively, use lavender essential oil for aromatherapy"
    ],
    dosage: "1 cup of tea before bed or 2-3 drops of oil for aromatherapy",
    precautions: ["May cause drowsiness", "Dilute essential oil before use"],
    effectiveness: 88
  },
  {
    id: 3,
    problem: "Digestive Issues & Nausea",
    category: "Digestive",
    icon: Droplets,
    recommendedPlant: "Ginger",
    botanicalName: "Zingiber officinale",
    plantImage: "https://images.unsplash.com/photo-1758335583617-ec83e95904ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnaW5nZXIlMjByb290JTIwcGxhbnR8ZW58MXx8fHwxNzY2OTk0ODY3fDA&ixlib=rb-4.1.0&q=80&w=400",
    preparation: [
      "Grate 1 inch of fresh ginger root",
      "Boil in 2 cups of water for 10 minutes",
      "Add lemon juice and honey",
      "Drink warm after meals",
      "Can also chew small piece of fresh ginger"
    ],
    dosage: "1 cup, 2-3 times daily after meals",
    precautions: ["May cause heartburn in high doses", "Consult doctor if on blood thinners"],
    effectiveness: 90
  },
  {
    id: 4,
    problem: "Skin Irritation & Burns",
    category: "Skin Care",
    icon: HeartPulse,
    recommendedPlant: "Aloe Vera",
    botanicalName: "Aloe barbadensis miller",
    plantImage: "https://images.unsplash.com/photo-1684913127590-54e08d09a34b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbG9lJTIwdmVyYSUyMHBsYW50fGVufDF8fHx8MTc2Njk5NDg2NXww&ixlib=rb-4.1.0&q=80&w=400",
    preparation: [
      "Cut a mature aloe vera leaf",
      "Extract the clear gel from inside",
      "Rinse the gel to remove latex",
      "Apply directly to affected area",
      "Leave on for 20-30 minutes, rinse with cool water"
    ],
    dosage: "Apply 2-3 times daily as needed",
    precautions: ["Avoid oral consumption without medical advice", "May cause skin irritation in some"],
    effectiveness: 94
  },
  {
    id: 5,
    problem: "Joint Pain & Inflammation",
    category: "Pain Relief",
    icon: Thermometer,
    recommendedPlant: "Turmeric",
    botanicalName: "Curcuma longa",
    plantImage: "https://images.unsplash.com/photo-1761567523932-6c461c249729?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0dXJtZXJpYyUyMHJvb3R8ZW58MXx8fHwxNzY2OTk0ODY2fDA&ixlib=rb-4.1.0&q=80&w=400",
    preparation: [
      "Mix 1 teaspoon turmeric powder with warm milk",
      "Add a pinch of black pepper (enhances absorption)",
      "Add honey to taste",
      "Drink warm before bedtime",
      "For topical use, make a paste with water and apply"
    ],
    dosage: "1 cup of golden milk daily",
    precautions: ["May interact with blood thinners", "High doses may cause stomach upset"],
    effectiveness: 89
  },
  {
    id: 6,
    problem: "Headache & Tension",
    category: "Pain Relief",
    icon: Brain,
    recommendedPlant: "Peppermint",
    botanicalName: "Mentha piperita",
    plantImage: "https://images.unsplash.com/photo-1760074057726-e94ee8ff1eb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZXJiYWwlMjB0ZWElMjBsZWF2ZXN8ZW58MXx8fHwxNzY2OTA1NDYxfDA&ixlib=rb-4.1.0&q=80&w=400",
    preparation: [
      "Steep 1 tablespoon dried peppermint leaves in hot water",
      "Cover and let steep for 10 minutes",
      "Strain and drink warm",
      "For topical relief, dilute peppermint oil with carrier oil",
      "Apply to temples and neck"
    ],
    dosage: "1-2 cups of tea or topical application as needed",
    precautions: ["May cause heartburn", "Keep oil away from eyes"],
    effectiveness: 85
  }
];

const categories = [
  { name: "All", icon: Pill },
  { name: "Respiratory", icon: Wind },
  { name: "Digestive", icon: Droplets },
  { name: "Skin Care", icon: HeartPulse },
  { name: "Pain Relief", icon: Thermometer },
  { name: "Mental Health", icon: Brain }
];

export function RemediesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRemedy, setSelectedRemedy] = useState<Remedy | null>(null);

  const filteredRemedies = remedies.filter((remedy) => {
    const matchesSearch = remedy.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      remedy.recommendedPlant.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || remedy.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-4">
            <Pill className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Natural Remedies</span>
          </div>
          <h1 className="text-5xl font-bold text-green-900 mb-4">
            Find Your Herbal Remedy
          </h1>
          <p className="text-xl text-green-600 max-w-2xl mx-auto">
            Search by health condition to discover natural plant-based treatments
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            <Input
              type="text"
              placeholder="Search by condition (e.g., cold, stress, pain)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 text-lg border-2 border-green-300 focus:border-green-500 rounded-xl"
            />
          </div>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mt-6"
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? "default" : "outline"}
                className={`${
                  selectedCategory === category.name
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-green-300 text-green-700 hover:bg-green-50"
                }`}
                onClick={() => setSelectedCategory(category.name)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.name}
              </Button>
            );
          })}
        </motion.div>
      </div>

      {/* Remedies Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRemedies.map((remedy, index) => {
            const Icon = remedy.icon;
            return (
              <motion.div
                key={remedy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-2 border-green-200 hover:border-green-400 transition-all hover:shadow-xl cursor-pointer group">
                  {/* Plant Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={remedy.plantImage}
                      alt={remedy.recommendedPlant}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-600 text-white border-0">
                        {remedy.effectiveness}% Effective
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-bold text-lg">{remedy.recommendedPlant}</h3>
                      <p className="text-green-100 text-sm italic">{remedy.botanicalName}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Icon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <Badge className="mb-2 bg-green-100 text-green-700 border-green-300">
                          {remedy.category}
                        </Badge>
                        <h4 className="font-bold text-green-900">{remedy.problem}</h4>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Dosage:</span>
                        <span className="text-green-900 font-medium">{remedy.dosage}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setSelectedRemedy(remedy)}
                    >
                      <Leaf className="w-4 h-4 mr-2" />
                      View Preparation Steps
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filteredRemedies.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Search className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-green-900 mb-2">No remedies found</h3>
            <p className="text-green-600">Try adjusting your search or filter criteria</p>
          </motion.div>
        )}
      </div>

      {/* Remedy Detail Modal */}
      {selectedRemedy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedRemedy(null)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header Image */}
            <div className="relative h-64">
              <img
                src={selectedRemedy.plantImage}
                alt={selectedRemedy.recommendedPlant}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {selectedRemedy.problem}
                </h2>
                <p className="text-green-100 text-lg">
                  Using {selectedRemedy.recommendedPlant}
                </p>
              </div>
            </div>

            <div className="p-8">
              {/* Preparation Steps */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Preparation Method
                </h3>
                <ol className="space-y-3">
                  {selectedRemedy.preparation.map((step, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </span>
                      <span className="text-green-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Dosage */}
              <div className="mb-6 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Recommended Dosage</h4>
                <p className="text-green-700">{selectedRemedy.dosage}</p>
              </div>

              {/* Precautions */}
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  ⚠️ Precautions
                </h4>
                <ul className="space-y-1">
                  {selectedRemedy.precautions.map((precaution, index) => (
                    <li key={index} className="text-yellow-800 text-sm">
                      • {precaution}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => setSelectedRemedy(null)}
                >
                  Got It
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <Leaf className="w-4 h-4 mr-2" />
                  View Plant Details
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
