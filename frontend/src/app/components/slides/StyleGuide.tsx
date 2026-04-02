import { Leaf, Heart, Shield, Sparkles, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

export function StyleGuide() {
  const colorPalette = [
    { name: "Primary Green", hex: "#4a7c59", class: "bg-[#4a7c59]" },
    { name: "Secondary Green", hex: "#8fbc8f", class: "bg-[#8fbc8f]" },
    { name: "Light Green", hex: "#e8f5e9", class: "bg-[#e8f5e9]" },
    { name: "Accent Green", hex: "#d4edda", class: "bg-[#d4edda]" },
    { name: "Dark Text", hex: "#2d3a2e", class: "bg-[#2d3a2e]" },
    { name: "Light Background", hex: "#fafaf7", class: "bg-[#fafaf7]" },
  ];

  const icons = [
    { Icon: Leaf, name: "Leaf", usage: "Plants, Nature" },
    { Icon: Heart, name: "Heart", usage: "Health, Favorites" },
    { Icon: Shield, name: "Shield", usage: "Protection, Immunity" },
    { Icon: Sparkles, name: "Sparkles", usage: "Beauty, Enhancement" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl text-green-900">Virtual Herbal Garden</h1>
          </div>
          <p className="text-xl text-green-600 max-w-2xl mx-auto">
            Design System & Style Guide
          </p>
        </div>

        <div className="space-y-12">
          {/* Color Palette */}
          <section>
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-green-900">Color Palette</CardTitle>
                <p className="text-green-600">Earthy tones inspired by nature and botanical gardens</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {colorPalette.map((color) => (
                    <div key={color.name} className="space-y-3">
                      <div className={`w-full h-24 rounded-2xl ${color.class} shadow-lg border-4 border-white`}></div>
                      <div>
                        <p className="text-sm text-green-900">{color.name}</p>
                        <p className="text-xs text-green-600 font-mono">{color.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Typography */}
          <section>
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-green-900">Typography</CardTitle>
                <p className="text-green-600">Clean, modern, and highly readable typography</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <h1 className="text-green-900 mb-2">Heading 1 - Main Titles</h1>
                    <p className="text-sm text-green-600">Used for page titles and hero sections</p>
                  </div>
                  
                  <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <h2 className="text-green-900 mb-2">Heading 2 - Section Headers</h2>
                    <p className="text-sm text-green-600">Used for major section divisions</p>
                  </div>
                  
                  <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <h3 className="text-green-900 mb-2">Heading 3 - Subsections</h3>
                    <p className="text-sm text-green-600">Used for card titles and subsections</p>
                  </div>
                  
                  <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <p className="text-green-900 mb-2">Body Text - Regular content and descriptions</p>
                    <p className="text-sm text-green-600">Standard body text with optimal line height for readability</p>
                  </div>

                  <div className="p-6 bg-green-50 rounded-xl border-2 border-green-200">
                    <p className="italic text-green-700 mb-2">Botanical Names - Ocimum sanctum</p>
                    <p className="text-sm text-green-600">Italic text for scientific and botanical names</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Buttons */}
          <section>
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-green-900">Buttons & Interactive Elements</CardTitle>
                <p className="text-green-600">Consistent button styles with clear hierarchy</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-green-800 mb-3">Primary Buttons</p>
                      <div className="flex flex-wrap gap-3">
                        <Button className="bg-green-600 hover:bg-green-700">Primary Action</Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">Small</Button>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700">Large</Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-green-800 mb-3">Secondary Buttons</p>
                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                          Secondary Action
                        </Button>
                        <Button variant="ghost" className="text-green-700 hover:bg-green-100">
                          Ghost Button
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-green-800 mb-3">Icon Buttons</p>
                      <div className="flex flex-wrap gap-3">
                        <Button size="icon" className="bg-green-600 hover:bg-green-700">
                          <Leaf className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="outline" className="border-green-300 text-green-700">
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-green-800 mb-3">Badges</p>
                      <div className="flex flex-wrap gap-3">
                        <Badge className="bg-green-100 text-green-700 border-green-300">Category</Badge>
                        <Badge className="bg-green-600 text-white">Active</Badge>
                        <Badge variant="outline" className="border-green-300 text-green-700">Outline</Badge>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-green-800 mb-3">Form Inputs</p>
                      <Input 
                        placeholder="Search plants..." 
                        className="border-green-200 focus:border-green-400 mb-3"
                      />
                      <Input 
                        placeholder="With icon..." 
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Cards */}
          <section>
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-green-900">Card Components</CardTitle>
                <p className="text-green-600">Clean card designs with consistent spacing and borders</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Default Card */}
                  <Card className="border-2 border-green-200">
                    <CardContent className="p-6">
                      <h3 className="text-lg text-green-900 mb-2">Default Card</h3>
                      <p className="text-sm text-green-600">Standard card with border and padding</p>
                    </CardContent>
                  </Card>

                  {/* Elevated Card */}
                  <Card className="border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-lg text-green-900 mb-2">Elevated Card</h3>
                      <p className="text-sm text-green-600">Card with shadow and hover effect</p>
                    </CardContent>
                  </Card>

                  {/* Accent Card */}
                  <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardContent className="p-6">
                      <h3 className="text-lg text-green-900 mb-2">Accent Card</h3>
                      <p className="text-sm text-green-600">Card with gradient background</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Iconography */}
          <section>
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-green-900">Iconography</CardTitle>
                <p className="text-green-600">Nature-inspired icons using Lucide React</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {icons.map(({ Icon, name, usage }) => (
                    <div key={name} className="text-center p-6 bg-green-50 rounded-xl border-2 border-green-200">
                      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Icon className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-sm text-green-900 mb-1">{name}</p>
                      <p className="text-xs text-green-600">{usage}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Design Principles */}
          <section>
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="text-2xl text-green-900">Design Principles</CardTitle>
                <p className="text-green-600">Core values guiding the design system</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { title: "Natural & Calming", desc: "Use earthy tones and nature-inspired elements" },
                    { title: "Clean & Minimal", desc: "Avoid clutter, embrace white space" },
                    { title: "Educational Focus", desc: "Present information clearly and accessibly" },
                    { title: "Interactive", desc: "Encourage exploration through engaging UI" },
                    { title: "Consistent", desc: "Maintain visual harmony across all screens" },
                    { title: "Accessible", desc: "Ensure high readability and contrast" }
                  ].map((principle) => (
                    <div key={principle.title} className="flex gap-3 p-4 bg-white rounded-xl border-2 border-green-200">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm text-green-900 mb-1">{principle.title}</h4>
                        <p className="text-sm text-green-600">{principle.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
