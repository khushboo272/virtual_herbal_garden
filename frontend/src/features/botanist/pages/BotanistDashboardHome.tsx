import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  FileEdit,
  AlertTriangle,
  Plus,
  Leaf,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Bookmark,
  TrendingUp,
  FlaskConical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { StatusBadge } from '../components/StatusBadge';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { getContributionSummary, getAIFeedbackStats } from '../api/contributionsApi';
import type { IContributionSummary, IAIFeedbackStats } from '../types';

export function BotanistDashboardHome() {
  useDocumentTitle('Botanist Console | Virtual Herbal Garden');
  const navigate = useNavigate();

  const [summary, setSummary] = useState<IContributionSummary | null>(null);
  const [aiStats, setAiStats] = useState<IAIFeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sumData, aiData] = await Promise.all([
        getContributionSummary().catch(() => null),
        getAIFeedbackStats().catch(() => null),
      ]);
      setSummary(sumData);
      setAiStats(aiData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load botanist metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const statCards = [
    {
      title: 'Pending Review',
      value: summary?.pendingReview ?? 0,
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-700 border-amber-200',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      title: 'Published',
      value: summary?.published ?? 0,
      icon: CheckCircle2,
      color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'My Drafts',
      value: summary?.drafts ?? 0,
      icon: FileEdit,
      color: 'bg-blue-500/10 text-blue-700 border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Changes Requested',
      value: summary?.changesRequested ?? 0,
      icon: AlertTriangle,
      color: 'bg-orange-500/10 text-orange-700 border-orange-200',
      badgeColor: 'bg-orange-100 text-orange-800',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-emerald-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-purple-200 text-xs font-semibold backdrop-blur-xs mb-3">
              <FlaskConical className="w-3.5 h-3.5 text-purple-300" />
              Botanist Contributor Workspace
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Medicinal Knowledge Console
            </h1>
            <p className="text-purple-200 text-sm mt-1 max-w-xl">
              Curate botanical profiles, document traditional remedies, and verify AI identification scans with scientific rigor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate('/dashboard/contributions/new-plant')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md flex items-center gap-2 h-10 px-4"
            >
              <Leaf className="w-4 h-4" />
              New Plant Draft
            </Button>
            <Button
              onClick={() => navigate('/dashboard/contributions/new-remedy')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-md flex items-center gap-2 h-10 px-4"
            >
              <Plus className="w-4 h-4" />
              New Remedy Draft
            </Button>
            <Button
              onClick={() => navigate('/dashboard/ai-feedback')}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-medium text-xs rounded-xl flex items-center gap-2 h-10 px-4 backdrop-blur-xs"
            >
              <Sparkles className="w-4 h-4 text-purple-300" />
              Review AI Scans
            </Button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card
              key={idx}
              className="border border-slate-200/80 bg-white/95 backdrop-blur-xs shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden"
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-purple-100 bg-purple-50/50 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-purple-700 font-medium">Community Reviews Received</p>
              <p className="text-xl font-bold text-purple-950 mt-0.5">
                {summary?.reviewsReceivedOnMyPlants ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-100 bg-emerald-50/50 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-medium">Bookmarks on My Content</p>
              <p className="text-xl font-bold text-emerald-950 mt-0.5">
                {summary?.bookmarksOnMyContent ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-indigo-100 bg-indigo-50/50 rounded-2xl">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-indigo-700 font-medium">Pending AI Scan Queue</p>
                <p className="text-xl font-bold text-indigo-950 mt-0.5">
                  {aiStats?.pendingCount ?? 0}
                </p>
              </div>
            </div>
            <Link
              to="/dashboard/ai-feedback"
              className="text-xs text-indigo-700 font-semibold hover:text-indigo-900 inline-flex items-center gap-1"
            >
              Verify <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Changes Requested Action Alert (if any) */}
      {(summary?.changesRequested ?? 0) > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50/90 p-5 shadow-xs">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-orange-950">
                Action Required: {summary?.changesRequested} item(s) need revision
              </h3>
              <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                Reviewers have requested revisions on your submitted contributions. Inspect reviewer feedback and update your entries to proceed with publication.
              </p>
              <div className="mt-3">
                <Button
                  size="sm"
                  onClick={() => navigate('/dashboard/contributions?status=CHANGES_REQUESTED')}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-xl"
                >
                  View Items Requiring Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Submissions Table & Reviewer Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Contributions List */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Recent Contributions
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Your latest draft and submitted items</p>
              </div>
              <Link
                to="/dashboard/contributions"
                className="text-xs font-semibold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading submissions...</div>
              ) : !summary?.recent || summary.recent.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Leaf className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-700">No contributions yet</p>
                  <p className="text-xs text-slate-400">
                    Get started by creating your first plant or remedy draft.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {summary.recent.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            item.type === 'plant'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {item.type === 'plant' ? (
                            <Leaf className="w-4 h-4" />
                          ) : (
                            <FileEdit className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">
                            {item.subtitle || `${item.type.toUpperCase()} • Updated ${new Date(item.updatedAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={item.status} />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (item.status === 'PUBLISHED') {
                              navigate(`/dashboard/contributions/${item.type}/${item.slug || item.id}/review`);
                            } else {
                              navigate(`/dashboard/contributions/${item.type}/${item.slug || item.id}`);
                            }
                          }}
                          className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Latest Reviewer Comments & Guidance */}
        <div className="space-y-6">
          <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Latest Reviewer Feedback
            </h3>
            {summary?.recent?.find((r) => r.lastReviewComment) ? (
              <div className="space-y-3">
                {summary.recent
                  .filter((r) => r.lastReviewComment)
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-xs text-purple-950 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span>{item.title}</span>
                        <StatusBadge status={item.status} className="scale-90" />
                      </div>
                      <p className="text-slate-700 italic">"{item.lastReviewComment}"</p>
                      <div className="pt-1">
                        <Link
                          to={`/dashboard/contributions/${item.type}/${item.slug || item.id}`}
                          className="text-[11px] font-semibold text-purple-700 hover:underline inline-flex items-center gap-1"
                        >
                          Open Editor to Address &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3">
                No reviewer comments received on your recent submissions.
              </p>
            )}
          </Card>

          {/* Review Process Guidelines Card */}
          <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-gradient-to-br from-slate-50 to-purple-50/30 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Botanical Review Standards
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
              <li>Scientific binomial must be valid and verified with index.</li>
              <li>Every submission requires at least 1 reputable bibliographic citation.</li>
              <li>Restricted phrases ("cures", "100% effective") will be blocked by safety filters.</li>
              <li>High-resolution authentic plant photographs are required for publication.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
