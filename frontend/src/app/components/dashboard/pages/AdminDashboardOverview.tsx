// ──────────────────────────────────────────────────────────
// Admin Dashboard Overview — stats + quick actions (home)
// Rendered at /dashboard for ADMIN / SUPER_ADMIN
// ──────────────────────────────────────────────────────────

import { Plus, Users, Eye, Leaf, TrendingUp, Clock, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { StatCard } from '../StatCard';
import { useAdminStats, useAdminPlants } from '../../../../hooks/useAdmin';
import { useAdminDashboard } from '../../../../hooks/useDashboard';
import { PlantUploadModal } from '../../3d/PlantUploadModal';
import { useState } from 'react';

export function AdminDashboardOverview() {
  const { stats: apiStats } = useAdminStats();
  const { plants: apiPlants } = useAdminPlants();
  const { data: dashData } = useAdminDashboard();
  const navigate = useNavigate();

  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const stats = [
    { label: 'Total Users', value: dashData?.stats?.totalUsers ?? apiStats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-100 text-blue-700', delta: dashData?.deltas?.newUsersThisWeek ? `+${dashData.deltas.newUsersThisWeek} this week` : undefined },
    { label: 'Active Today', value: dashData?.stats?.activeToday ?? 0, icon: Eye, color: 'bg-green-100 text-green-700' },
    { label: 'Published Plants', value: dashData?.stats?.publishedPlants ?? apiStats?.totalPlants ?? 0, icon: Leaf, color: 'bg-emerald-100 text-emerald-700', delta: dashData?.deltas?.newPlantsThisWeek ? `+${dashData.deltas.newPlantsThisWeek} this week` : undefined },
    { label: 'AI Scans Today', value: dashData?.stats?.aiScansToday ?? apiStats?.totalDetections ?? 0, icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
    { label: 'Pending Review', value: dashData?.stats?.pendingReview ?? 0, icon: Clock, color: 'bg-amber-100 text-amber-700' },
    { label: 'Tours Published', value: dashData?.stats?.toursPublished ?? 0, icon: Map, color: 'bg-teal-100 text-teal-700' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-green-900">Admin Dashboard</h1>
          <p className="text-green-600 mt-1">Manage your Virtual Herbal Garden content and users</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setUploadModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Plant
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/dashboard/users')}
          className="p-6 rounded-xl border-2 border-green-200 bg-white hover:border-green-400 hover:shadow-md transition-all text-left"
        >
          <Users className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-green-900">User Management</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage {dashData?.stats?.totalUsers ?? 0} users</p>
        </button>
        <button
          onClick={() => navigate('/dashboard/moderation')}
          className="p-6 rounded-xl border-2 border-green-200 bg-white hover:border-green-400 hover:shadow-md transition-all text-left"
        >
          <Clock className="w-8 h-8 text-amber-600 mb-3" />
          <h3 className="font-semibold text-green-900">Moderation Queue</h3>
          <p className="text-sm text-gray-500 mt-1">{dashData?.stats?.pendingReview ?? 0} items pending review</p>
        </button>
        <button
          onClick={() => navigate('/dashboard/analytics')}
          className="p-6 rounded-xl border-2 border-green-200 bg-white hover:border-green-400 hover:shadow-md transition-all text-left"
        >
          <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-green-900">Analytics</h3>
          <p className="text-sm text-gray-500 mt-1">Platform insights and reports</p>
        </button>
      </div>

      <PlantUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        plant={null}
        onSuccess={() => {}}
      />
    </div>
  );
}
