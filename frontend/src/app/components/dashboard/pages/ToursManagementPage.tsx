// ──────────────────────────────────────────────────────────
// Tours Management Page — /dashboard/tours/manage
// Shows tours list — NOT plants
// ──────────────────────────────────────────────────────────

import { Map, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../../ui/table';

// Static tour data until backend tours API is implemented
const SAMPLE_TOURS = [
  { id: '1', name: 'Ayurvedic Essentials', description: 'Explore the core herbs of Ayurveda', stops: 8, status: 'Published', views: 342 },
  { id: '2', name: 'Kitchen Garden Herbs', description: 'Common herbs you can grow at home', stops: 6, status: 'Published', views: 215 },
  { id: '3', name: 'Immunity Boosters', description: 'Plants known for immune system support', stops: 5, status: 'Draft', views: 0 },
];

export function ToursManagementPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-900">Tours Management</h1>
          <p className="text-green-600 mt-1">Create and manage guided virtual tours</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate('/dashboard/tours/manage/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Tour
        </Button>
      </div>

      <Card className="border-2 border-green-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Map className="w-5 h-5 text-teal-600" />
            All Tours
            <Badge className="ml-auto bg-teal-100 text-teal-700 border-teal-300">
              {SAMPLE_TOURS.length} tours
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-green-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-green-50">
                <TableRow>
                  <TableHead className="text-green-800">Tour Name</TableHead>
                  <TableHead className="text-green-800">Description</TableHead>
                  <TableHead className="text-green-800">Stops</TableHead>
                  <TableHead className="text-green-800">Status</TableHead>
                  <TableHead className="text-green-800">Views</TableHead>
                  <TableHead className="text-green-800 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SAMPLE_TOURS.map((tour) => (
                  <TableRow key={tour.id} className="hover:bg-green-50/50">
                    <TableCell className="font-medium text-green-900">{tour.name}</TableCell>
                    <TableCell className="text-green-700 max-w-xs truncate">{tour.description}</TableCell>
                    <TableCell className="text-green-700">{tour.stops}</TableCell>
                    <TableCell>
                      <Badge className={
                        tour.status === 'Published'
                          ? 'bg-green-100 text-green-700 border-green-300'
                          : 'bg-amber-100 text-amber-700 border-amber-300'
                      }>
                        {tour.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-700">{tour.views.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
