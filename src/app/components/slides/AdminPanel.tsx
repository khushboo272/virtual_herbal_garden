import { Plus, Upload, Edit, Trash2, Users, TrendingUp, BarChart2, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function AdminPanel() {
  const stats = [
    { label: "Total Plants", value: "156", change: "+12", icon: BarChart2, color: "bg-green-100 text-green-700" },
    { label: "Active Users", value: "1,247", change: "+89", icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "Total Views", value: "24.5K", change: "+2.4K", icon: Eye, color: "bg-purple-100 text-purple-700" },
    { label: "Growth Rate", value: "18.2%", change: "+3.1%", icon: TrendingUp, color: "bg-emerald-100 text-emerald-700" },
  ];

  const recentPlants = [
    { id: 1, name: "Tulsi", botanical: "Ocimum sanctum", category: "Immunity", status: "Published", views: 1234 },
    { id: 2, name: "Aloe Vera", botanical: "Aloe barbadensis", category: "Skin Care", status: "Published", views: 2341 },
    { id: 3, name: "Turmeric", botanical: "Curcuma longa", category: "Anti-inflammatory", status: "Draft", views: 0 },
    { id: 4, name: "Ginger", botanical: "Zingiber officinale", category: "Digestion", status: "Published", views: 1876 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl text-green-900 mb-2">Admin Dashboard</h1>
              <p className="text-green-600">Manage your Virtual Herbal Garden content and users</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Plant
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-2 border-green-200 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    {stat.change}
                  </Badge>
                </div>
                <div className="text-3xl text-green-900 mb-1">{stat.value}</div>
                <p className="text-sm text-green-600">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="plants" className="space-y-6">
          <TabsList className="bg-green-100">
            <TabsTrigger value="plants" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
              Manage Plants
            </TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
              Add New Plant
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Manage Plants */}
          <TabsContent value="plants">
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-green-900">Plant Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input 
                    placeholder="Search plants..." 
                    className="max-w-md border-green-200"
                  />
                </div>
                
                <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-green-50">
                      <TableRow>
                        <TableHead className="text-green-800">Plant Name</TableHead>
                        <TableHead className="text-green-800">Botanical Name</TableHead>
                        <TableHead className="text-green-800">Category</TableHead>
                        <TableHead className="text-green-800">Status</TableHead>
                        <TableHead className="text-green-800">Views</TableHead>
                        <TableHead className="text-green-800 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentPlants.map((plant) => (
                        <TableRow key={plant.id} className="hover:bg-green-50/50">
                          <TableCell className="text-green-900">{plant.name}</TableCell>
                          <TableCell className="text-green-700 italic">{plant.botanical}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              {plant.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              plant.status === 'Published' 
                                ? 'bg-green-100 text-green-700 border-green-300' 
                                : 'bg-amber-100 text-amber-700 border-amber-300'
                            }>
                              {plant.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-green-700">{plant.views.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add New Plant Form */}
          <TabsContent value="add">
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="text-green-900">Add New Medicinal Plant</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="plantName" className="text-green-800">Plant Name</Label>
                      <Input 
                        id="plantName" 
                        placeholder="e.g., Tulsi" 
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="botanicalName" className="text-green-800">Botanical Name</Label>
                      <Input 
                        id="botanicalName" 
                        placeholder="e.g., Ocimum sanctum" 
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="text-green-800">Category</Label>
                      <Input 
                        id="category" 
                        placeholder="e.g., Immunity" 
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-green-800">Region</Label>
                      <Input 
                        id="region" 
                        placeholder="e.g., Tropical" 
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-green-800">Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Enter detailed description of the plant and its properties..." 
                      rows={4}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicinalUses" className="text-green-800">Medicinal Uses</Label>
                    <Textarea 
                      id="medicinalUses" 
                      placeholder="List medicinal uses (one per line)" 
                      rows={3}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cultivation" className="text-green-800">Cultivation Information</Label>
                    <Textarea 
                      id="cultivation" 
                      placeholder="Describe growing conditions, climate, soil type, etc." 
                      rows={3}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-800">Upload Images</Label>
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer bg-green-50/50">
                      <Upload className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <p className="text-sm text-green-700 mb-1">Click to upload or drag and drop</p>
                      <p className="text-xs text-green-600">PNG, JPG up to 10MB</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-green-800">Upload 3D Model (GLTF)</Label>
                    <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors cursor-pointer bg-green-50/50">
                      <Upload className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <p className="text-sm text-green-700 mb-1">Upload 3D model file</p>
                      <p className="text-xs text-green-600">GLTF, GLB format</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Plant
                    </Button>
                    <Button type="button" variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
                      Save as Draft
                    </Button>
                    <Button type="button" variant="ghost" className="text-green-700">
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-2 border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-900">Most Viewed Plants</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPlants.sort((a, b) => b.views - a.views).map((plant, idx) => (
                      <div key={plant.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-green-900">{plant.name}</p>
                          <p className="text-xs text-green-600">{plant.views.toLocaleString()} views</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-green-900">User Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">Daily Active Users</span>
                      <Badge className="bg-green-600 text-white">342</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">Avg. Session Duration</span>
                      <Badge className="bg-green-600 text-white">8.5 min</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">Tours Completed Today</span>
                      <Badge className="bg-green-600 text-white">47</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">New Registrations</span>
                      <Badge className="bg-green-600 text-white">23</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
