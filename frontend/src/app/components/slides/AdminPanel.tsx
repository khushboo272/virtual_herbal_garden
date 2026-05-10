import { Plus, Upload, Edit, Trash2, Users, TrendingUp, BarChart2, Eye, Shield, Settings, Flag, CheckCircle, XCircle, Leaf, Clock, Map } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { StatCard } from "../dashboard/StatCard";
import { StatusBadge, type ContentStatus } from "../dashboard/StatusBadge";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useAdminStats, useAdminPlants, useAdminUsers } from "../../../hooks/useAdmin";
import { useAdminDashboard } from "../../../hooks/useDashboard";
import { useAuth } from "../../../contexts/AuthContext";

export function AdminPanel() {
  const { stats: apiStats } = useAdminStats();
  const { plants: apiPlants } = useAdminPlants();
  const { users: adminUsers } = useAdminUsers();
  const { hasMinRole } = useAuth();
  const isSuperAdmin = hasMinRole('SUPER_ADMIN');

  const { data: dashData } = useAdminDashboard();

  const stats = [
    { label: "Total Users", value: dashData?.stats?.totalUsers ?? apiStats?.totalUsers ?? 0, icon: Users, color: "bg-blue-100 text-blue-700", delta: dashData?.deltas?.newUsersThisWeek ? `+${dashData.deltas.newUsersThisWeek} this week` : undefined },
    { label: "Active Today", value: dashData?.stats?.activeToday ?? 0, icon: Eye, color: "bg-green-100 text-green-700" },
    { label: "Published Plants", value: dashData?.stats?.publishedPlants ?? apiStats?.totalPlants ?? 0, icon: Leaf, color: "bg-emerald-100 text-emerald-700", delta: dashData?.deltas?.newPlantsThisWeek ? `+${dashData.deltas.newPlantsThisWeek} this week` : undefined },
    { label: "AI Scans Today", value: dashData?.stats?.aiScansToday ?? apiStats?.totalDetections ?? 0, icon: TrendingUp, color: "bg-purple-100 text-purple-700" },
    { label: "Pending Review", value: dashData?.stats?.pendingReview ?? 0, icon: Clock, color: "bg-amber-100 text-amber-700" },
    { label: "Tours Published", value: dashData?.stats?.toursPublished ?? 0, icon: Map, color: "bg-teal-100 text-teal-700" },
  ];

  const recentPlants = apiPlants.length > 0
    ? apiPlants.slice(0, 10).map((p) => ({
        id: p._id,
        name: p.commonName,
        botanical: p.scientificName,
        category: p.tags?.[0] || "General",
        status: p.isPublished ? "Published" : "Draft",
        views: p.viewCount || 0,
      }))
    : [
        { id: "1", name: "Tulsi", botanical: "Ocimum sanctum", category: "Immunity", status: "Published", views: 1234 },
        { id: "2", name: "Aloe Vera", botanical: "Aloe barbadensis", category: "Skin Care", status: "Published", views: 2341 },
        { id: "3", name: "Turmeric", botanical: "Curcuma longa", category: "Anti-inflammatory", status: "Draft", views: 0 },
        { id: "4", name: "Ginger", botanical: "Zingiber officinale", category: "Digestion", status: "Published", views: 1876 },
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

        {/* Stats — PRD §4.4.2 Section 2: 6 stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              delta={stat.delta}
            />
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="plants" className="space-y-6">
          <TabsList className="bg-green-100">
            <TabsTrigger value="plants" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
              Manage Plants
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
              <Users className="w-4 h-4 mr-1.5" />
              Users
            </TabsTrigger>
            <TabsTrigger value="moderation" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
              <Flag className="w-4 h-4 mr-1.5" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
              Add New Plant
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
              Analytics
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="system" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
                <Settings className="w-4 h-4 mr-1.5" />
                System
              </TabsTrigger>
            )}
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

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Users className="w-5 h-5 text-green-600" />
                  User Management
                  <Badge className="ml-auto bg-green-100 text-green-700 border-green-300">
                    {adminUsers.length} users
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-green-50">
                      <TableRow>
                        <TableHead className="text-green-800">Name</TableHead>
                        <TableHead className="text-green-800">Email</TableHead>
                        <TableHead className="text-green-800">Role</TableHead>
                        <TableHead className="text-green-800">Joined</TableHead>
                        <TableHead className="text-green-800">Status</TableHead>
                        <TableHead className="text-green-800 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {adminUsers.map((u) => {
                        const roleBadgeColor: Record<string, string> = {
                          GUEST: 'bg-gray-100 text-gray-700 border-gray-300',
                          USER: 'bg-blue-100 text-blue-700 border-blue-300',
                          BOTANIST: 'bg-purple-100 text-purple-700 border-purple-300',
                          ADMIN: 'bg-amber-100 text-amber-700 border-amber-300',
                          SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-300',
                        };
                        return (
                          <TableRow key={u._id} className="hover:bg-green-50/50">
                            <TableCell className="font-medium text-green-900">{u.displayName}</TableCell>
                            <TableCell className="text-green-700">{u.email}</TableCell>
                            <TableCell>
                              <Badge className={roleBadgeColor[u.role] || 'bg-gray-100 text-gray-700'}>
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-green-700">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge className={u.isActive ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
                                {u.isActive ? 'Active' : 'Banned'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {isSuperAdmin ? (
                                <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50">
                                  <Shield className="w-4 h-4 mr-1" />
                                  Change Role
                                </Button>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span>
                                        <Button size="sm" variant="outline" disabled className="opacity-50">
                                          <Shield className="w-4 h-4 mr-1" />
                                          Change Role
                                        </Button>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Only a Super Admin can change user roles.</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Moderation Tab */}
          <TabsContent value="moderation">
            <Card className="border-2 border-green-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <Flag className="w-5 h-5 text-amber-600" />
                  Content Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-green-800 mb-3">Pending Plant Approvals</h3>
                  {apiPlants.filter(p => !p.isPublished).length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                      <p className="text-green-600">No pending items to moderate.</p>
                    </div>
                  ) : (
                    <div className="border-2 border-green-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-amber-50">
                          <TableRow>
                            <TableHead className="text-amber-800">Plant Name</TableHead>
                            <TableHead className="text-amber-800">Scientific Name</TableHead>
                            <TableHead className="text-amber-800">Submitted</TableHead>
                            <TableHead className="text-amber-800 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {apiPlants.filter(p => !p.isPublished).map((plant) => (
                            <TableRow key={plant._id} className="hover:bg-amber-50/50">
                              <TableCell className="font-medium text-gray-900">{plant.commonName}</TableCell>
                              <TableCell className="text-gray-600 italic">{plant.scientificName}</TableCell>
                              <TableCell className="text-gray-600">{new Date(plant.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab — SUPER_ADMIN only */}
          {isSuperAdmin && (
            <TabsContent value="system">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 border-red-200 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Settings className="w-5 h-5 text-red-600" />
                      Feature Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: '3D Garden', description: 'Enable the immersive 3D garden experience', enabled: true },
                      { label: 'AI Plant Scanner', description: 'Enable AI-powered plant identification', enabled: true },
                      { label: 'Maintenance Mode', description: 'Show maintenance page to all users', enabled: false },
                    ].map((flag) => (
                      <div key={flag.label} className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-red-200 transition-colors">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{flag.label}</h4>
                          <p className="text-xs text-gray-500">{flag.description}</p>
                        </div>
                        <Badge className={flag.enabled ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-500 border-gray-300'}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-2 border-red-200 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Shield className="w-5 h-5 text-red-600" />
                      System Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-800">API Version</span>
                      <Badge className="bg-red-100 text-red-700">v1.0.0</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-800">AI Model</span>
                      <Badge className="bg-red-100 text-red-700">Gemini 2.5 Flash</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-800">Max Upload Size</span>
                      <Badge className="bg-red-100 text-red-700">10 MB</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-800">Detection TTL</span>
                      <Badge className="bg-red-100 text-red-700">90 days</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
