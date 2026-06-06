// ──────────────────────────────────────────────────────────
// Moderation Queue Page — /dashboard/moderation
// Supports ?type=plant|remedy|tour filtering
// ──────────────────────────────────────────────────────────

import { useSearchParams } from 'react-router-dom';
import { Flag, CheckCircle, XCircle, Leaf, FileText, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../ui/table';
import { useAdminPlants } from '../../../../hooks/useAdmin';

export function ModerationQueuePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterType = searchParams.get('type') || 'all';
  const { plants: apiPlants } = useAdminPlants();

  const pendingPlants = apiPlants.filter(p => !p.isPublished);

  const handleTabChange = (val: string) => {
    if (val === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ type: val });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Moderation Queue</h1>
        <p className="text-green-600 mt-1">Review and approve pending content submissions</p>
      </div>

      <Tabs value={filterType} onValueChange={handleTabChange}>
        <TabsList className="bg-green-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
            All Items
          </TabsTrigger>
          <TabsTrigger value="plant" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
            <Leaf className="w-4 h-4 mr-1.5" />
            Plants
          </TabsTrigger>
          <TabsTrigger value="remedy" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
            <FileText className="w-4 h-4 mr-1.5" />
            Remedies
          </TabsTrigger>
          <TabsTrigger value="tour" className="data-[state=active]:bg-white data-[state=active]:text-green-700">
            <Map className="w-4 h-4 mr-1.5" />
            Tours
          </TabsTrigger>
        </TabsList>

        {/* All / Plants */}
        <TabsContent value="all">
          <ModerationTable title="All Pending Items" plants={pendingPlants} />
        </TabsContent>

        <TabsContent value="plant">
          <ModerationTable title="Pending Plant Approvals" plants={pendingPlants} />
        </TabsContent>

        <TabsContent value="remedy">
          <Card className="border-2 border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <FileText className="w-5 h-5 text-blue-600" />
                Pending Remedy Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-green-600">No pending remedies to moderate.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tour">
          <Card className="border-2 border-green-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Map className="w-5 h-5 text-teal-600" />
                Pending Tour Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-green-600">No pending tours to moderate.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModerationTable({ title, plants }: { title: string; plants: any[] }) {
  return (
    <Card className="border-2 border-green-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-900">
          <Flag className="w-5 h-5 text-amber-600" />
          {title}
          <Badge className="ml-auto bg-amber-100 text-amber-700 border-amber-300">
            {plants.length} pending
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {plants.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-green-600">No pending items to moderate.</p>
          </div>
        ) : (
          <div className="border-2 border-green-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-amber-50">
                <TableRow>
                  <TableHead className="text-amber-800">Name</TableHead>
                  <TableHead className="text-amber-800">Scientific Name</TableHead>
                  <TableHead className="text-amber-800">Type</TableHead>
                  <TableHead className="text-amber-800">Submitted</TableHead>
                  <TableHead className="text-amber-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plants.map((plant) => (
                  <TableRow key={plant._id} className="hover:bg-amber-50/50">
                    <TableCell className="font-medium text-gray-900">{plant.commonName}</TableCell>
                    <TableCell className="text-gray-600 italic">{plant.scientificName}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 border-green-300">Plant</Badge>
                    </TableCell>
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
      </CardContent>
    </Card>
  );
}
