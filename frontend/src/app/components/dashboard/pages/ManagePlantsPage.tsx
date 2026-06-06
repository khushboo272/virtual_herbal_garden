// ──────────────────────────────────────────────────────────
// Manage Plants Page — standalone page for plant management
// Route: used inside AdminDashboardOverview as its main content
// ──────────────────────────────────────────────────────────

import { Edit, Trash2, Cuboid } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../ui/table';
import { useAdminPlants } from '../../../../hooks/useAdmin';
import { PlantUploadModal } from '../../3d/PlantUploadModal';
import { useState } from 'react';

export function ManagePlantsPage() {
  const { plants: apiPlants } = useAdminPlants();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [search, setSearch] = useState('');

  const openUploadModal = (plant: any) => {
    const fullPlant = apiPlants.find(p => p._id === plant.id) || plant;
    setSelectedPlant(fullPlant);
    setUploadModalOpen(true);
  };

  const filteredPlants = apiPlants
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return p.commonName.toLowerCase().includes(q) || p.scientificName.toLowerCase().includes(q);
    })
    .slice(0, 20)
    .map(p => ({
      id: p._id,
      name: p.commonName,
      botanical: p.scientificName,
      category: p.tags?.[0] || 'General',
      status: p.isPublished ? 'Published' : 'Draft',
      views: p.viewCount || 0,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Manage Plants</h1>
        <p className="text-green-600 mt-1">View and manage all plant entries</p>
      </div>

      <Card className="border-2 border-green-200 bg-white">
        <CardHeader>
          <CardTitle className="text-green-900">Plant Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search plants..."
              className="max-w-md border-green-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                {filteredPlants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No plants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlants.map((plant) => (
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
                          <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700" onClick={() => openUploadModal(plant)}>
                            <Cuboid className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PlantUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        plant={selectedPlant}
        onSuccess={() => {}}
      />
    </div>
  );
}
