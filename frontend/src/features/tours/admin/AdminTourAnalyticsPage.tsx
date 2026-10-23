import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Compass,
  ArrowLeft,
  ChevronRight,
  Star,
  Award,
} from 'lucide-react';
import { getAdminAnalytics, getAdminToursList, getTourAnalytics } from '../api/toursApi';
import type { TourAdminAnalytics, TourAdminListItem, TourDetailAnalytics } from '../types/tour.types';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export function AdminTourAnalyticsPage() {
  useDocumentTitle('Tour Engagement Analytics | Admin Dashboard');

  const [overview, setOverview] = useState<TourAdminAnalytics | null>(null);
  const [toursList, setToursList] = useState<TourAdminListItem[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [detailAnalytics, setDetailAnalytics] = useState<TourDetailAnalytics | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  useEffect(() => {
    Promise.all([getAdminAnalytics(), getAdminToursList()])
      .then(([analytics, list]) => {
        setOverview(analytics);
        setToursList(list);
        if (list.length > 0) {
          setSelectedTourId(list[0].id);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTourId) return;
    setIsDetailLoading(true);
    getTourAnalytics(selectedTourId)
      .then((data) => setDetailAnalytics(data))
      .catch(() => setDetailAnalytics(null))
      .finally(() => setIsDetailLoading(false));
  }, [selectedTourId]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-gray-500 animate-pulse">
        Loading analytics dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard/tours/manage"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 hover:text-green-950 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tours Management
          </Link>
          <h1 className="text-3xl font-extrabold text-green-950">Tour Analytics & Funnels</h1>
          <p className="text-sm text-green-700 mt-1">
            Real-time engagement, completion metrics, and drop-off analysis aggregated from TourProgress records.
          </p>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tours</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-gray-900">{overview?.totalTours || 0}</div>
          <div className="text-xs text-gray-400 mt-1">{overview?.published || 0} published</div>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Starts</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-gray-900">{overview?.totalStarts || 0}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">Unique learner sessions</div>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completions</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-3xl font-black text-gray-900">{overview?.totalCompletions || 0}</div>
          <div className="text-xs text-green-600 font-medium mt-1">All checkpoints cleared</div>
        </div>

        <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-gray-900">{overview?.completionRate || 0}%</div>
          <div className="text-xs text-purple-600 font-medium mt-1">Starts to completion</div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tour Selection Table */}
        <div className="bg-white rounded-3xl border border-green-100 shadow-sm overflow-hidden p-4">
          <h2 className="text-sm font-bold text-gray-900 px-2 py-2 mb-2">Select Tour</h2>
          <div className="space-y-1">
            {toursList.map((t) => {
              const isSelected = selectedTourId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTourId(t.id)}
                  className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 border border-emerald-300 text-emerald-950 font-semibold shadow-xs'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs truncate">{t.title}</div>
                    <div className="text-[10px] text-gray-400 font-normal">
                      {t.startedCount} starts • {t.completedCount} completed
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Per-Checkpoint Drop-off Funnel */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-green-100 p-6 sm:p-8 shadow-sm">
          {isDetailLoading ? (
            <div className="text-center py-12 text-sm text-gray-400 animate-pulse">
              Aggregating checkpoint progression data...
            </div>
          ) : !detailAnalytics ? (
            <div className="text-center py-12 text-sm text-gray-500">
              Select a tour from the left to view detailed drop-off funnel metrics.
            </div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{detailAnalytics.title}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {detailAnalytics.started} started • {detailAnalytics.completed} completed ({detailAnalytics.completionRate}% completion rate)
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200/60">
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Avg Rating</div>
                    <div className="text-sm font-bold text-gray-900 flex items-center justify-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {detailAnalytics.avgRating || '—'}
                    </div>
                  </div>
                  <div className="h-6 w-px bg-gray-200" />
                  <div className="text-center">
                    <div className="text-xs text-gray-400">Avg Quiz Score</div>
                    <div className="text-sm font-bold text-emerald-800 flex items-center justify-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      {detailAnalytics.avgQuizScore}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Funnel Progress Bars */}
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4">
                Checkpoint Drop-Off Funnel
              </h4>

              <div className="space-y-5">
                {detailAnalytics.perCheckpoint.map((cp) => {
                  const pct =
                    detailAnalytics.started > 0
                      ? Math.round((cp.completed / detailAnalytics.started) * 100)
                      : 0;

                  return (
                    <div key={cp.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-gray-800">
                          {cp.order}. {cp.title}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">
                            {cp.completed} / {detailAnalytics.started} completed ({pct}%)
                          </span>
                          {cp.dropOffPct > 0 && (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                              -{cp.dropOffPct}% drop
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
