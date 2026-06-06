// ──────────────────────────────────────────────────────────
// Analytics Overview Page — /dashboard/analytics
// ──────────────────────────────────────────────────────────

import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { useAdminPlants } from '../../../../hooks/useAdmin';
import { useAdminDashboard } from '../../../../hooks/useDashboard';

export function AnalyticsOverviewPage() {
  const { plants: apiPlants } = useAdminPlants();
  const { data: dashData } = useAdminDashboard();

  const sortedPlants = [...apiPlants]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-green-900">Platform Analytics</h1>
        <p className="text-green-600 mt-1">Insights and metrics for your platform</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-green-200 bg-white">
          <CardHeader>
            <CardTitle className="text-green-900">Most Viewed Plants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedPlants.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No plant data available yet.</p>
              ) : (
                sortedPlants.map((plant, idx) => (
                  <div key={plant._id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-green-900 font-medium">{plant.commonName}</p>
                      <p className="text-xs text-green-600">{(plant.viewCount || 0).toLocaleString()} views</p>
                    </div>
                  </div>
                ))
              )}
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
                <Badge className="bg-green-600 text-white">{dashData?.stats?.activeToday ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-800">Total Users</span>
                <Badge className="bg-green-600 text-white">{dashData?.stats?.totalUsers ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-800">AI Scans Today</span>
                <Badge className="bg-green-600 text-white">{dashData?.stats?.aiScansToday ?? 0}</Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-800">New Users This Week</span>
                <Badge className="bg-green-600 text-white">{dashData?.deltas?.newUsersThisWeek ?? 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
