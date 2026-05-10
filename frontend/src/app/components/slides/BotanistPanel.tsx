import { FlaskConical, FileText, CheckCircle, Clock, AlertCircle, Plus, Leaf, Eye, TrendingUp } from "lucide-react";
import { StatCard } from "../dashboard/StatCard";
import { StatusBadge, type ContentStatus } from "../dashboard/StatusBadge";
import { DashboardEmptyState } from "../dashboard/DashboardEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useBotanistDrafts, useBotanistPlants, useBotanistStats } from "../../../hooks/useBotanist";

export function BotanistPanel() {
  const { stats } = useBotanistStats();
  const { drafts } = useBotanistDrafts();
  const { plants: allPlants } = useBotanistPlants();

  const summaryStats = [
    {
      label: "Pending Review",
      value: String(stats?.pendingReview ?? 0),
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Published",
      value: String(stats?.totalPublished ?? 0),
      icon: CheckCircle,
      color: "bg-green-100 text-green-700",
    },
    {
      label: "Total Drafts",
      value: String(stats?.totalDrafts ?? 0),
      icon: FileText,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: "Corrections",
      value: String(stats?.totalCorrections ?? 0),
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  const getStatusBadge = (plant: { isPublished: boolean; status?: string }) => {
    const status: ContentStatus = plant.isPublished ? 'PUBLISHED'
      : (plant.status === 'IN_REVIEW' ? 'IN_REVIEW'
      : plant.status === 'REJECTED' ? 'REJECTED'
      : 'DRAFT');
    return <StatusBadge status={status} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-green-50/30">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FlaskConical className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl text-gray-900 font-bold mb-1">Botanist Console</h1>
                <p className="text-purple-600">Contribute to the Virtual Herbal Garden knowledge base</p>
              </div>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Submit New Plant
            </Button>
          </div>
        </div>

        {/* Stats Grid — PRD §4.3.2 Section 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={Number(stat.value)}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="drafts" className="space-y-6">
          <TabsList className="bg-purple-100">
            <TabsTrigger value="drafts" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">
              <FileText className="w-4 h-4 mr-1.5" />
              My Drafts
            </TabsTrigger>
            <TabsTrigger value="published" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Published
            </TabsTrigger>
            <TabsTrigger value="submit" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">
              <Plus className="w-4 h-4 mr-1.5" />
              Submit Plant
            </TabsTrigger>
          </TabsList>

          {/* My Drafts Tab */}
          <TabsContent value="drafts">
            <Card className="border-2 border-purple-200/60 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Pending Submissions
                  <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-300">
                    {drafts.length} pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {drafts.length === 0 ? (
                  <div className="text-center py-12">
                    <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No pending drafts</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Start contributing by submitting a new plant to the knowledge base.
                    </p>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Submit Your First Plant
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-purple-200/60 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-purple-50">
                        <TableRow>
                          <TableHead className="text-purple-800">Plant Name</TableHead>
                          <TableHead className="text-purple-800">Scientific Name</TableHead>
                          <TableHead className="text-purple-800">Category</TableHead>
                          <TableHead className="text-purple-800">Status</TableHead>
                          <TableHead className="text-purple-800">Submitted</TableHead>
                          <TableHead className="text-purple-800 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drafts.map((plant) => (
                          <TableRow key={plant._id} className="hover:bg-purple-50/50">
                            <TableCell className="font-medium text-gray-900">{plant.commonName}</TableCell>
                            <TableCell className="text-gray-600 italic">{plant.scientificName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-purple-300 text-purple-700">
                                {plant.tags?.[0] || "General"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(plant)}</TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(plant.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Published Tab */}
          <TabsContent value="published">
            <Card className="border-2 border-purple-200/60 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Your Published Contributions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allPlants.filter(p => p.isPublished).length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No published plants yet</h3>
                    <p className="text-sm text-gray-500">
                      Your approved submissions will appear here once reviewed by an admin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allPlants.filter(p => p.isPublished).map((plant) => (
                      <Card key={plant._id} className="border-2 border-green-200 hover:shadow-md transition-shadow cursor-pointer group">
                        <CardContent className="p-0">
                          {plant.images?.[0]?.url && (
                            <img
                              src={plant.images[0].url}
                              alt={plant.commonName}
                              className="w-full h-40 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                          <div className="p-4">
                            <h4 className="font-medium text-gray-900 mb-1">{plant.commonName}</h4>
                            <p className="text-sm text-gray-500 italic mb-2">{plant.scientificName}</p>
                            <div className="flex items-center justify-between">
                              <Badge className="bg-green-100 text-green-700 border-green-300">Published</Badge>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {plant.viewCount?.toLocaleString() ?? 0}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Plant Tab */}
          <TabsContent value="submit">
            <Card className="border-2 border-purple-200/60 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Plus className="w-5 h-5 text-purple-600" />
                  Submit a New Medicinal Plant
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Your submission will be reviewed by an admin before being published.
                </p>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="commonName" className="text-gray-800">Common Name *</Label>
                      <Input
                        id="commonName"
                        placeholder="e.g., Tulsi"
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="scientificName" className="text-gray-800">Scientific Name *</Label>
                      <Input
                        id="scientificName"
                        placeholder="e.g., Ocimum sanctum"
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="family" className="text-gray-800">Plant Family</Label>
                      <Input
                        id="family"
                        placeholder="e.g., Lamiaceae"
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-gray-800">Native Region</Label>
                      <Input
                        id="region"
                        placeholder="e.g., Indian subcontinent"
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-800">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide a detailed description of the plant, including its physical characteristics, habitat, and traditional significance..."
                      rows={4}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicinalUses" className="text-gray-800">Medicinal Uses</Label>
                    <Textarea
                      id="medicinalUses"
                      placeholder="List each medicinal use on a separate line, e.g.:&#10;Boosts immunity&#10;Reduces inflammation&#10;Treats respiratory conditions"
                      rows={3}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partsUsed" className="text-gray-800">Parts Used</Label>
                    <Input
                      id="partsUsed"
                      placeholder="e.g., Leaves, Seeds, Root (comma-separated)"
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>

                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800 mb-1">Review Process</h4>
                        <p className="text-xs text-amber-700">
                          All submissions are reviewed by an administrator before being published.
                          You will be notified once your plant entry is approved or if any changes are requested.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      <FlaskConical className="w-4 h-4 mr-2" />
                      Submit for Review
                    </Button>
                    <Button type="button" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                      Save as Draft
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
