import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Eye,
  Leaf,
  TrendingUp,
  Clock,
  Map,
  Plus,
  AlertCircle,
  FileText,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../app/components/ui/card';
import { Badge } from '../../../app/components/ui/badge';
import { StatCard } from '../../../app/components/dashboard/StatCard';
import { getDashboardSummary } from '../api/adminApi';
import type { DashboardSummaryData } from '../types/admin.types';

export function AdminDashboardHome() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await getDashboardSummary();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-10 bg-slate-200 rounded w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50/50 my-6">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h2 className="text-lg font-semibold text-red-900">Unable to load dashboard</h2>
          <p className="text-sm text-red-700 mt-1 mb-4">{error || 'Unknown error occurred'}</p>
          <Button variant="outline" onClick={fetchSummary} className="border-red-300 text-red-800 hover:bg-red-100">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { stats, deltas, needsAttention, recentActivity } = data;

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-100 text-blue-700',
      delta: deltas.newUsersThisWeek > 0 ? `+${deltas.newUsersThisWeek} this week (${deltas.userGrowthDeltaPercent > 0 ? `+${deltas.userGrowthDeltaPercent}%` : '0%'})` : undefined,
    },
    {
      label: 'Active Today',
      value: stats.activeToday,
      icon: Eye,
      color: 'bg-emerald-100 text-emerald-700',
      delta: 'Active in last 24h',
    },
    {
      label: 'Published Plants',
      value: stats.publishedPlants,
      icon: Leaf,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Published Remedies',
      value: stats.publishedRemedies,
      icon: FileText,
      color: 'bg-teal-100 text-teal-700',
    },
    {
      label: 'AI Scans Today',
      value: stats.aiScansToday,
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Pending Review',
      value: stats.pendingReview,
      icon: Clock,
      color: 'bg-amber-100 text-amber-700',
      delta: `${data.pendingByType.plants} plants, ${data.pendingByType.remedies} remedies`,
    },
    {
      label: 'Pending Applications',
      value: stats.pendingApplications,
      icon: ShieldCheck,
      color: 'bg-indigo-100 text-indigo-700',
    },
    {
      label: 'Tours Published',
      value: stats.toursPublished,
      icon: Map,
      color: 'bg-cyan-100 text-cyan-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600 mt-1">Platform moderation, content management, and operational overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate('/dashboard/contributions/new-plant?admin=true')}
            className="bg-green-700 hover:bg-green-800 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Plant
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((st) => (
          <StatCard
            key={st.label}
            label={st.label}
            value={st.value}
            icon={st.icon}
            color={st.color}
            delta={st.delta}
          />
        ))}
      </div>

      {/* Needs Attention Section */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-lg font-semibold text-slate-900">Needs Attention</CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-100 font-medium">
            {needsAttention.length} pending items
          </Badge>
        </CardHeader>
        <CardContent>
          {needsAttention.length === 0 ? (
            <div className="flex items-center gap-3 py-4 text-slate-600 text-sm">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Queue is clear! No items currently awaiting editorial review or role application decision.</span>
            </div>
          ) : (
            <div className="divide-y divide-amber-200/60">
              {needsAttention.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      className={
                        item.type === 'plant'
                          ? 'bg-green-100 text-green-800'
                          : item.type === 'remedy'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }
                    >
                      {item.type.toUpperCase()}
                    </Badge>
                    <span className="font-medium text-slate-900 truncate">{item.title}</span>
                    {item.isOverdue && (
                      <Badge variant="destructive" className="text-xs uppercase font-semibold">
                        Overdue (&gt;3 days)
                      </Badge>
                    )}
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-amber-300 hover:bg-amber-100 shrink-0">
                    <Link to={item.link}>
                      Review <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('/dashboard/moderation')}
          className="p-5 rounded-xl border border-slate-200 bg-white hover:border-green-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div>
            <Clock className="w-7 h-7 text-amber-600 mb-2" />
            <h3 className="font-semibold text-slate-900">Moderation Queue</h3>
            <p className="text-xs text-slate-500 mt-1">Review pending plants, remedies, and applications</p>
          </div>
          <span className="mt-4 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
            {stats.pendingReview + stats.pendingApplications} awaiting review
          </span>
        </button>

        <button
          onClick={() => navigate('/dashboard/users')}
          className="p-5 rounded-xl border border-slate-200 bg-white hover:border-green-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div>
            <Users className="w-7 h-7 text-blue-600 mb-2" />
            <h3 className="font-semibold text-slate-900">User Management</h3>
            <p className="text-xs text-slate-500 mt-1">RBAC controls, bans, details, and activity audits</p>
          </div>
          <span className="mt-4 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full w-fit">
            {stats.totalUsers} registered users
          </span>
        </button>

        <button
          onClick={() => navigate('/dashboard/content/plants')}
          className="p-5 rounded-xl border border-slate-200 bg-white hover:border-green-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div>
            <Leaf className="w-7 h-7 text-green-600 mb-2" />
            <h3 className="font-semibold text-slate-900">Content Management</h3>
            <p className="text-xs text-slate-500 mt-1">Publish, unpublish, feature, and impact analytics</p>
          </div>
          <span className="mt-4 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full w-fit">
            {stats.publishedPlants + stats.publishedRemedies} published entries
          </span>
        </button>

        <button
          onClick={() => navigate('/dashboard/tours/manage')}
          className="p-5 rounded-xl border border-slate-200 bg-white hover:border-green-400 hover:shadow-md transition-all text-left flex flex-col justify-between"
        >
          <div>
            <Map className="w-7 h-7 text-cyan-600 mb-2" />
            <h3 className="font-semibold text-slate-900">Tours Management</h3>
            <p className="text-xs text-slate-500 mt-1">Manage interactive 3D and audio botanical walks</p>
          </div>
          <span className="mt-4 text-xs font-semibold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full w-fit">
            {stats.toursPublished} active tours
          </span>
        </button>
      </div>

      {/* Recent Activity Audit Feed */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-700" />
            <CardTitle className="text-lg font-semibold text-slate-900">Recent Admin Activity</CardTitle>
          </div>
          <span className="text-xs text-slate-500">Last 10 mutations logged</span>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No recent activity logged yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs text-slate-700 bg-slate-50">
                      {log.action}
                    </Badge>
                    <span className="text-slate-800">
                      <strong className="font-semibold">{log.actor}</strong> on <span className="font-medium text-slate-600">{log.target}</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
