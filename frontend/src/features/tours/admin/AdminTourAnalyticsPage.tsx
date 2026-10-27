import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  CheckCircle2,
  Compass,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Star,
  Award,
  Search,
  Download,
  ExternalLink,
  Edit3,
  AlertTriangle,
  Clock,
  Sparkles,
  Volume2,
  BookOpen,
  HelpCircle,
  RefreshCw,
  FileSpreadsheet,
  Table,
  MessageSquare,
  Eye,
  Check,
} from 'lucide-react';
import {
  getAdminAnalytics,
  getAdminToursList,
  getTourAnalytics,
  updateTour,
  publishTour,
  unpublishTour,
} from '../api/toursApi';
import type {
  TourAdminAnalytics,
  TourAdminListItem,
  TourDetailAnalytics,
} from '../types/tour.types';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

type ViewMode = 'deep-dive' | 'benchmark';
type ActiveTab = 'funnel' | 'sessions' | 'ratings' | 'recommendations';
type StatusFilter = 'ALL' | 'PUBLISHED' | 'DRAFT' | 'FEATURED' | 'ACTIVE';
type SortOption = 'starts' | 'completionRate' | 'lowestCompletion' | 'rating' | 'alphabetical';

export function AdminTourAnalyticsPage() {
  useDocumentTitle('Tour Engagement Analytics | Admin Dashboard');

  const [overview, setOverview] = useState<TourAdminAnalytics | null>(null);
  const [toursList, setToursList] = useState<TourAdminListItem[]>([]);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [detailAnalytics, setDetailAnalytics] = useState<TourDetailAnalytics | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('deep-dive');
  const [activeTab, setActiveTab] = useState<ActiveTab>('funnel');

  // Sidebar filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('starts');

  // Sessions filter
  const [sessionsFilter, setSessionsFilter] = useState<'ALL' | 'COMPLETED' | 'IN_PROGRESS'>('ALL');

  // Expanded checkpoint keys in funnel
  const [expandedCheckpoints, setExpandedCheckpoints] = useState<Record<string, boolean>>({});

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 3500);
  };

  const loadData = useCallback(async (preserveSelectedId = true) => {
    try {
      const [analytics, list] = await Promise.all([
        getAdminAnalytics(),
        getAdminToursList(),
      ]);
      setOverview(analytics);
      setToursList(list);

      if (list.length > 0) {
        if (!preserveSelectedId || !selectedTourId || !list.some((t) => t.id === selectedTourId)) {
          setSelectedTourId(list[0].id);
        }
      }
    } catch {
      showNotification('Failed to load tour analytics data', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTourId]);

  useEffect(() => {
    loadData(false);
  }, []);

  const loadDetail = useCallback(async (tourId: string) => {
    setIsDetailLoading(true);
    try {
      const data = await getTourAnalytics(tourId);
      setDetailAnalytics(data);
    } catch {
      setDetailAnalytics(null);
      showNotification('Failed to load tour details', 'error');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedTourId) return;
    loadDetail(selectedTourId);
  }, [selectedTourId, loadDetail]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(true);
    if (selectedTourId) {
      await loadDetail(selectedTourId);
    }
    showNotification('Analytics data refreshed');
  };

  const selectedTourListItem = useMemo(
    () => toursList.find((t) => t.id === selectedTourId) || null,
    [toursList, selectedTourId]
  );

  // Filtered and sorted tours for sidebar
  const filteredTours = useMemo(() => {
    return toursList
      .filter((t) => {
        const matchesSearch =
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.healthCategory && t.healthCategory.toLowerCase().includes(searchQuery.toLowerCase()));

        if (!matchesSearch) return false;

        if (statusFilter === 'PUBLISHED') return t.isPublished;
        if (statusFilter === 'DRAFT') return !t.isPublished;
        if (statusFilter === 'FEATURED') return t.isFeatured;
        if (statusFilter === 'ACTIVE') return t.startedCount > 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'starts') return b.startedCount - a.startedCount;
        if (sortBy === 'completionRate') {
          const rateA = a.startedCount > 0 ? (a.completedCount / a.startedCount) : 0;
          const rateB = b.startedCount > 0 ? (b.completedCount / b.startedCount) : 0;
          return rateB - rateA;
        }
        if (sortBy === 'lowestCompletion') {
          const rateA = a.startedCount > 0 ? (a.completedCount / a.startedCount) : 0;
          const rateB = b.startedCount > 0 ? (b.completedCount / b.startedCount) : 0;
          return rateA - rateB;
        }
        if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [toursList, searchQuery, statusFilter, sortBy]);

  // Actions on Selected Tour
  const handleTogglePublish = async () => {
    if (!selectedTourId || !selectedTourListItem) return;
    try {
      if (selectedTourListItem.isPublished) {
        await unpublishTour(selectedTourId);
        showNotification(`"${selectedTourListItem.title}" unpublished`);
      } else {
        await publishTour(selectedTourId);
        showNotification(`"${selectedTourListItem.title}" published`);
      }
      await loadData(true);
      await loadDetail(selectedTourId);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update tour publish status', 'error');
    }
  };

  const handleToggleFeatured = async () => {
    if (!selectedTourId || !selectedTourListItem) return;
    try {
      const nextFeatured = !selectedTourListItem.isFeatured;
      await updateTour(selectedTourId, { isFeatured: nextFeatured });
      showNotification(
        nextFeatured
          ? `"${selectedTourListItem.title}" is now featured on the homepage`
          : `"${selectedTourListItem.title}" removed from featured tours`
      );
      await loadData(true);
      await loadDetail(selectedTourId);
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update featured status', 'error');
    }
  };

  // Export functions
  const exportTourCSV = () => {
    if (!detailAnalytics) return;
    const rows = [
      ['Metric', 'Value'],
      ['Tour Title', detailAnalytics.title],
      ['Tour Slug', detailAnalytics.slug],
      ['Total Starts', String(detailAnalytics.started)],
      ['Total Completions', String(detailAnalytics.completed)],
      ['Completion Rate (%)', `${detailAnalytics.completionRate}%`],
      ['Average Rating', String(detailAnalytics.avgRating || 'N/A')],
      ['Average Quiz Score (%)', `${detailAnalytics.avgQuizScore}%`],
      [],
      ['Checkpoint Order', 'Checkpoint Title', 'Duration (min)', 'Reached', 'Completed', 'Drop-off %', 'Quiz Pass Rate %', 'Quiz Avg Score %'],
      ...detailAnalytics.perCheckpoint.map((cp) => [
        String(cp.order),
        `"${cp.title.replace(/"/g, '""')}"`,
        String(cp.durationMinutes || 3),
        String(cp.reached),
        String(cp.completed),
        `${cp.dropOffPct}%`,
        cp.quizPassRate !== null && cp.quizPassRate !== undefined ? `${cp.quizPassRate}%` : 'N/A',
        cp.quizAvgScore !== null && cp.quizAvgScore !== undefined ? `${cp.quizAvgScore}%` : 'N/A',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${detailAnalytics.slug}-analytics-report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported tour analytics to CSV');
  };

  const exportAllToursCSV = () => {
    if (toursList.length === 0) return;
    const rows = [
      ['Title', 'Slug', 'Category', 'Level', 'Status', 'Featured', 'Checkpoints', 'Starts', 'Completions', 'Completion Rate (%)'],
      ...toursList.map((t) => [
        `"${t.title.replace(/"/g, '""')}"`,
        t.slug,
        t.healthCategory || 'General',
        t.level,
        t.isPublished ? 'Published' : 'Draft',
        t.isFeatured ? 'Yes' : 'No',
        String(t.checkpointCount),
        String(t.startedCount),
        String(t.completedCount),
        t.startedCount > 0 ? `${Math.round((t.completedCount / t.startedCount) * 100)}%` : '0%',
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `all-tours-benchmark-matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('Exported all tours benchmark matrix to CSV');
  };

  // Filtered learner sessions
  const filteredSessions = useMemo(() => {
    if (!detailAnalytics?.recentSessions) return [];
    if (sessionsFilter === 'COMPLETED') {
      return detailAnalytics.recentSessions.filter((s) => s.isCompleted);
    }
    if (sessionsFilter === 'IN_PROGRESS') {
      return detailAnalytics.recentSessions.filter((s) => !s.isCompleted);
    }
    return detailAnalytics.recentSessions;
  }, [detailAnalytics, sessionsFilter]);

  // Smart Recommendations Engine based on real tour data
  const recommendations = useMemo(() => {
    if (!detailAnalytics) return [];
    const list: Array<{
      id: string;
      title: string;
      type: 'warning' | 'tip' | 'success' | 'alert';
      description: string;
      actionText?: string;
      actionCallback?: () => void;
    }> = [];

    // 1. High drop-off bottleneck detection
    const highDropCheckpoint = detailAnalytics.perCheckpoint.find((cp) => cp.dropOffPct > 20);
    if (highDropCheckpoint) {
      list.push({
        id: 'dropoff-bottleneck',
        title: `High Drop-Off at Step ${highDropCheckpoint.order}: "${highDropCheckpoint.title}"`,
        type: 'warning',
        description: `Learners are dropping off by ${highDropCheckpoint.dropOffPct}% at this checkpoint. Consider shortening text explanations, adding audio narration, or breaking it into 2 smaller checkpoints.`,
      });
    }

    // 2. Low quiz performance detection
    const hardQuiz = detailAnalytics.perCheckpoint.find(
      (cp) => cp.hasQuiz && cp.quizPassRate !== null && cp.quizPassRate !== undefined && cp.quizPassRate < 70
    );
    if (hardQuiz) {
      list.push({
        id: 'hard-quiz',
        title: `Challenging Quiz at Step ${hardQuiz.order}: ${hardQuiz.quizPassRate}% Pass Rate`,
        type: 'alert',
        description: `Learners are struggling with the quiz on "${hardQuiz.title}". Review question prompts and provide clearer hints or explanations in the checkpoint body.`,
      });
    }

    // 3. High completion commendation
    if (detailAnalytics.started >= 5 && detailAnalytics.completionRate >= 75) {
      list.push({
        id: 'high-performer',
        title: 'Outstanding Tour Completion Rate',
        type: 'success',
        description: `This tour boasts a ${detailAnalytics.completionRate}% completion rate! Consider making it a Featured Tour on the homepage to maximize reach.`,
        actionText: selectedTourListItem?.isFeatured ? 'Already Featured' : 'Feature This Tour',
        actionCallback: selectedTourListItem?.isFeatured ? undefined : handleToggleFeatured,
      });
    }

    // 4. Missing audio accessibility
    const missingAudioCount = detailAnalytics.perCheckpoint.filter((cp) => !cp.hasAudio).length;
    if (missingAudioCount > 0) {
      list.push({
        id: 'missing-audio',
        title: `${missingAudioCount} Checkpoint${missingAudioCount > 1 ? 's' : ''} Missing Audio Narration`,
        type: 'tip',
        description: `Audio narration enhances engagement by up to 40% in virtual nature tours. Add audio voiceover URLs to checkpoints to improve accessibility.`,
      });
    }

    // 5. Rating prompt
    if (detailAnalytics.completed > 0 && (!detailAnalytics.ratingsList || detailAnalytics.ratingsList.length === 0)) {
      list.push({
        id: 'no-ratings-yet',
        title: 'Collect Learner Feedback',
        type: 'tip',
        description: `${detailAnalytics.completed} learner${detailAnalytics.completed > 1 ? 's have' : ' has'} completed this tour, but no written feedback has been recorded yet. Encourage reviews at completion.`,
      });
    }

    return list;
  }, [detailAnalytics, selectedTourListItem]);

  const toggleCheckpointExpand = (key: string) => {
    setExpandedCheckpoints((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-sm text-green-800 animate-pulse flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <span className="font-semibold">Loading tour analytics & metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Notification */}
      {actionMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-2.5 transition-all transform animate-in fade-in slide-in-from-bottom-3 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
              : 'bg-red-950 text-red-100 border-red-700'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard/tours/manage"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-800 hover:text-green-950 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tours Management
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-green-950">Tour Analytics & Funnels</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh Analytics Data"
              className="p-1.5 rounded-lg border border-green-200 text-green-800 hover:bg-green-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Real-time engagement, learner sessions, drop-off funnels, and ratings aggregated from TourProgress records.
          </p>
        </div>

        {/* View Switcher & Global Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200/80">
            <button
              onClick={() => setViewMode('deep-dive')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'deep-dive'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tour Deep-Dive
            </button>
            <button
              onClick={() => setViewMode('benchmark')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                viewMode === 'benchmark'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Benchmark Matrix
            </button>
          </div>

          <button
            onClick={exportAllToursCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export All CSV
          </button>

          <Link
            to="/dashboard/tours/manage/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition"
          >
            <Compass className="w-3.5 h-3.5" />
            New Tour
          </Link>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Tours</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-gray-900">{overview?.totalTours || 0}</div>
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-700 font-semibold">{overview?.published || 0} published</span>
            <span>•</span>
            <span className="text-amber-700">{overview?.drafts ?? Math.max(0, (overview?.totalTours || 0) - (overview?.published || 0))} drafts</span>
          </div>
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

        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl border border-green-100 p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Rating</span>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-gray-900 flex items-center gap-1.5">
            {overview?.overallAvgRating ? overview.overallAvgRating : '—'}
            {overview?.overallAvgRating ? <span className="text-base font-normal text-gray-400">/ 5</span> : null}
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            {overview?.totalRatingsCount ? `${overview.totalRatingsCount} review ratings` : 'Learner evaluations'}
          </div>
        </div>
      </div>

      {/* ── Mode 1: Benchmark Matrix View ── */}
      {viewMode === 'benchmark' ? (
        <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">All Tours Performance Comparison</h2>
              <p className="text-xs text-gray-500 mt-1">
                Comparative metrics across all {toursList.length} tours in your herbal garden platform.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter tours..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 uppercase font-bold text-[10px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Tour Title & Details</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Checkpoints</th>
                  <th className="py-3 px-3 text-right">Starts</th>
                  <th className="py-3 px-3 text-right">Completions</th>
                  <th className="py-3 px-3 text-center">Completion %</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTours.map((tour) => {
                  const rate = tour.startedCount > 0 ? Math.round((tour.completedCount / tour.startedCount) * 100) : 0;
                  return (
                    <tr key={tour.id} className="hover:bg-emerald-50/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900 text-sm">{tour.title}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                          <span>{tour.healthCategory || 'General Health'}</span>
                          <span>•</span>
                          <span className="uppercase text-[9px] font-semibold text-gray-500">{tour.level}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tour.isPublished
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {tour.isPublished ? 'Published' : 'Draft'}
                          </span>
                          {tour.isFeatured && (
                            <span className="p-0.5 bg-amber-100 text-amber-800 rounded-full" title="Featured Tour">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-gray-700">
                        {tour.checkpointCount}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-gray-900">
                        {tour.startedCount}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-gray-900">
                        {tour.completedCount}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="font-bold text-emerald-800 text-[11px] w-9 text-right">{rate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTourId(tour.id);
                              setViewMode('deep-dive');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer transition"
                          >
                            Deep-Dive
                          </button>
                          <Link
                            to={`/dashboard/tours/manage/${tour.id}`}
                            className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            title="Edit Tour"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <a
                            href={`/virtual-tour/${tour.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            title="Preview Live Tour"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Mode 2: Deep-Dive View ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tour Selection Table with Search & Filters */}
          <div className="bg-white rounded-3xl border border-green-100 shadow-sm p-4 flex flex-col h-full max-h-[920px]">
            <div className="pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-gray-900">Select Tour</h2>
                <span className="text-[11px] text-gray-400 font-medium">
                  {filteredTours.length} of {toursList.length}
                </span>
              </div>

              {/* Tour Search */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tours..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-emerald-600"
                />
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap gap-1 mb-2">
                {(['ALL', 'PUBLISHED', 'DRAFT', 'FEATURED'] as StatusFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer ${
                      statusFilter === f
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent font-semibold text-gray-800 border-none outline-none cursor-pointer"
                >
                  <option value="starts">Most Starts</option>
                  <option value="completionRate">Highest Completion %</option>
                  <option value="lowestCompletion">Lowest Completion (Bottlenecks)</option>
                  <option value="alphabetical">Title (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Tour List scrollable */}
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
              {filteredTours.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No tours matched your filters.
                </div>
              ) : (
                filteredTours.map((t) => {
                  const isSelected = selectedTourId === t.id;
                  const rate = t.startedCount > 0 ? Math.round((t.completedCount / t.startedCount) * 100) : 0;

                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTourId(t.id)}
                      className={`w-full text-left p-3 rounded-2xl transition-all flex flex-col gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/90 border border-emerald-300 text-emerald-950 font-semibold shadow-xs'
                          : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs font-bold truncate">{t.title}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          {t.isFeatured && (
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          )}
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              t.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {t.isPublished ? 'Pub' : 'Draft'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{t.startedCount} starts • {t.completedCount} completed</span>
                        <span className="font-bold text-emerald-700">{rate}%</span>
                      </div>

                      {/* Mini rate bar */}
                      <div className="h-1 w-full bg-gray-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Tour Analytics & Action Hub */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-green-100 p-6 sm:p-8 shadow-sm">
            {isDetailLoading ? (
              <div className="text-center py-24 text-sm text-gray-400 animate-pulse flex flex-col items-center justify-center">
                <RefreshCw className="w-7 h-7 animate-spin text-emerald-600 mb-3" />
                <span>Aggregating checkpoint progression and learner analytics...</span>
              </div>
            ) : !detailAnalytics ? (
              <div className="text-center py-20 text-sm text-gray-500">
                Select a tour from the left panel to inspect detailed drop-off funnels, ratings, and learner records.
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Tour Hero Bar with Action Buttons */}
                <div className="pb-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black text-gray-900">{detailAnalytics.title}</h3>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            selectedTourListItem?.isPublished
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {selectedTourListItem?.isPublished ? 'Published' : 'Draft'}
                        </span>
                        {selectedTourListItem?.isFeatured && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2 pt-1">
                        <span>{selectedTourListItem?.healthCategory || 'General Health'}</span>
                        <span>•</span>
                        <span className="uppercase font-semibold text-gray-600">{selectedTourListItem?.level || 'BEGINNER'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          ~{detailAnalytics.tour?.estimatedMinutes || 15} mins
                        </span>
                        <span>•</span>
                        <span>{detailAnalytics.perCheckpoint.length} checkpoints</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/dashboard/tours/manage/${detailAnalytics.tourId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Tour
                      </Link>

                      <a
                        href={`/virtual-tour/${detailAnalytics.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        Preview Live
                      </a>

                      <button
                        onClick={handleToggleFeatured}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                          selectedTourListItem?.isFeatured
                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${selectedTourListItem?.isFeatured ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                        {selectedTourListItem?.isFeatured ? 'Featured' : 'Feature'}
                      </button>

                      <button
                        onClick={handleTogglePublish}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer border ${
                          selectedTourListItem?.isPublished
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                        }`}
                      >
                        {selectedTourListItem?.isPublished ? 'Unpublish' : 'Publish'}
                      </button>

                      <button
                        onClick={exportTourCSV}
                        className="p-1.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                        title="Export Tour Report (CSV)"
                      >
                        <Download className="w-4 h-4" />
                        <span className="sr-only">Export</span>
                      </button>
                    </div>
                  </div>

                  {/* Tour Specific Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                    <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                      <div className="text-[11px] text-gray-400 font-semibold uppercase">Learner Starts</div>
                      <div className="text-xl font-black text-gray-900 mt-0.5">{detailAnalytics.started}</div>
                    </div>
                    <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                      <div className="text-[11px] text-gray-400 font-semibold uppercase">Completions</div>
                      <div className="text-xl font-black text-emerald-700 mt-0.5">
                        {detailAnalytics.completed} <span className="text-xs font-semibold text-gray-400">({detailAnalytics.completionRate}%)</span>
                      </div>
                    </div>
                    <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                      <div className="text-[11px] text-gray-400 font-semibold uppercase">Avg Rating</div>
                      <div className="text-xl font-black text-amber-600 mt-0.5 flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        {detailAnalytics.avgRating || '—'}
                      </div>
                    </div>
                    <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                      <div className="text-[11px] text-gray-400 font-semibold uppercase">Avg Quiz Score</div>
                      <div className="text-xl font-black text-purple-700 mt-0.5 flex items-center gap-1">
                        <Award className="w-4 h-4 text-purple-600" />
                        {detailAnalytics.avgQuizScore}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Analytical Sub-Tabs Navigation */}
                <div className="border-b border-gray-100 flex items-center gap-2 overflow-x-auto pb-1" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'funnel'}
                    onClick={() => setActiveTab('funnel')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeTab === 'funnel'
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Funnel & Drop-Off
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeTab === 'sessions'}
                    onClick={() => setActiveTab('sessions')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeTab === 'sessions'
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    Learner Sessions ({detailAnalytics.recentSessions?.length || 0})
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeTab === 'ratings'}
                    onClick={() => setActiveTab('ratings')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeTab === 'ratings'
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    Ratings & Feedback ({detailAnalytics.ratingsList?.length || 0})
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeTab === 'recommendations'}
                    onClick={() => setActiveTab('recommendations')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
                      activeTab === 'recommendations'
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Insights & Tips ({recommendations.length})
                  </button>
                </div>

                {/* ── Sub-Tab 1: Funnel & Drop-Off ── */}
                {activeTab === 'funnel' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-semibold text-gray-800">Retention by Checkpoint</span>
                      <span>Total Checkpoints: {detailAnalytics.perCheckpoint.length}</span>
                    </div>

                    <div className="space-y-3.5">
                      {detailAnalytics.perCheckpoint.map((cp) => {
                        const pct =
                          detailAnalytics.started > 0
                            ? Math.round((cp.completed / detailAnalytics.started) * 100)
                            : 0;

                        const isExpanded = Boolean(expandedCheckpoints[cp.key]);
                        const isSevereDrop = cp.dropOffPct > 20;

                        return (
                          <div
                            key={cp.key}
                            className={`rounded-2xl border transition-all p-4 ${
                              isSevereDrop
                                ? 'border-amber-200 bg-amber-50/20'
                                : 'border-gray-200/80 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-extrabold flex items-center justify-center shrink-0">
                                  {cp.order}
                                </span>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{cp.title}</div>
                                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      {cp.durationMinutes || 3} min
                                    </span>
                                    {cp.hasAudio && (
                                      <span className="inline-flex items-center gap-0.5 text-emerald-700 font-medium">
                                        <Volume2 className="w-3 h-3" /> Audio
                                      </span>
                                    )}
                                    {cp.hasQuiz && (
                                      <span className="inline-flex items-center gap-0.5 text-purple-700 font-medium">
                                        <HelpCircle className="w-3 h-3" /> Quiz ({cp.quizQuestionsCount} Qs)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-xs font-bold text-gray-900">
                                    {cp.completed} / {detailAnalytics.started} ({pct}%)
                                  </div>
                                  {cp.dropOffPct > 0 ? (
                                    <div
                                      className={`text-[10px] font-bold ${
                                        isSevereDrop ? 'text-red-700 font-extrabold' : 'text-gray-500'
                                      }`}
                                    >
                                      {isSevereDrop ? '⚠️ ' : ''}-{cp.dropOffPct}% drop-off
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-emerald-700 font-semibold">100% retention</div>
                                  )}
                                </div>

                                <button
                                  onClick={() => toggleCheckpointExpand(cp.key)}
                                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer transition"
                                  title="Toggle checkpoint details"
                                >
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </button>
                              </div>
                            </div>

                            {/* Progress bar */}
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-3">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  pct > 70 ? 'bg-emerald-600' : pct > 40 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Expanded Details Accordion */}
                            {isExpanded && (
                              <div className="mt-4 pt-3 border-t border-gray-100 text-xs space-y-2.5 animate-in fade-in duration-200">
                                {cp.hasQuiz && (
                                  <div className="flex items-center gap-4 bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                                    <div>
                                      <span className="text-[10px] text-purple-700 font-bold uppercase">Quiz Pass Rate: </span>
                                      <span className="font-extrabold text-purple-950">
                                        {cp.quizPassRate !== null && cp.quizPassRate !== undefined ? `${cp.quizPassRate}%` : 'N/A'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-purple-700 font-bold uppercase">Avg Score: </span>
                                      <span className="font-extrabold text-purple-950">
                                        {cp.quizAvgScore !== null && cp.quizAvgScore !== undefined ? `${cp.quizAvgScore}%` : 'N/A'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-purple-700 font-bold uppercase">Total Attempts: </span>
                                      <span className="font-extrabold text-purple-950">{cp.quizAttempts || 0}</span>
                                    </div>
                                  </div>
                                )}

                                {cp.keyTakeaways && cp.keyTakeaways.length > 0 && (
                                  <div>
                                    <div className="font-bold text-gray-700 text-[11px] mb-1">Key Takeaways:</div>
                                    <ul className="list-disc list-inside space-y-0.5 text-gray-600 pl-1">
                                      {cp.keyTakeaways.map((t, idx) => (
                                        <li key={idx}>{t}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {(cp.plantSlugs?.length || 0) > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-700 text-[11px]">Plants covered:</span>
                                    {cp.plantSlugs?.map((p) => (
                                      <span key={p} className="px-2 py-0.5 bg-green-50 text-green-800 rounded-md font-semibold text-[10px]">
                                        {p}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Sub-Tab 2: Learner Sessions ── */}
                {activeTab === 'sessions' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                      <div className="text-xs text-gray-500">
                        Recent learner sessions and checkpoint achievements.
                      </div>

                      {/* Sessions filter */}
                      <div className="inline-flex rounded-xl bg-gray-100 p-0.5 border border-gray-200">
                        <button
                          onClick={() => setSessionsFilter('ALL')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                            sessionsFilter === 'ALL' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600'
                          }`}
                        >
                          All ({detailAnalytics.recentSessions?.length || 0})
                        </button>
                        <button
                          onClick={() => setSessionsFilter('COMPLETED')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                            sessionsFilter === 'COMPLETED' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600'
                          }`}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => setSessionsFilter('IN_PROGRESS')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg cursor-pointer ${
                            sessionsFilter === 'IN_PROGRESS' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600'
                          }`}
                        >
                          In-Progress
                        </button>
                      </div>
                    </div>

                    {filteredSessions.length === 0 ? (
                      <div className="p-12 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                        No learner sessions found matching this filter.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {filteredSessions.map((s) => (
                          <div
                            key={s.id}
                            className="bg-white rounded-2xl border border-gray-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-300 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0">
                                {s.user.displayName ? s.user.displayName.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-gray-900">{s.user.displayName}</div>
                                <div className="text-[10px] text-gray-400">{s.user.email}</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              {/* Progress */}
                              <div className="w-28">
                                <div className="flex justify-between text-[10px] font-bold text-gray-700 mb-1">
                                  <span>{s.completedCount}/{s.totalCheckpoints} CPs</span>
                                  <span>{s.percent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${s.isCompleted ? 'bg-emerald-600' : 'bg-blue-600'}`}
                                    style={{ width: `${s.percent}%` }}
                                  />
                                </div>
                              </div>

                              {/* Quiz score if available */}
                              {s.avgQuizScore !== null && (
                                <div className="text-center font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[10px]">
                                  {s.avgQuizScore}% quiz
                                </div>
                              )}

                              {/* Rating if available */}
                              {s.rating !== null && (
                                <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[10px]">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  {s.rating}
                                </div>
                              )}

                              {/* Status Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  s.isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {s.isCompleted ? 'Completed' : 'In Progress'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Sub-Tab 3: Ratings & Feedback ── */}
                {activeTab === 'ratings' && (
                  <div className="space-y-6 pt-1">
                    {/* Star Breakdown Summary */}
                    <div className="bg-amber-50/40 rounded-2xl border border-amber-200/60 p-5 flex flex-col sm:flex-row items-center gap-6">
                      <div className="text-center sm:text-left sm:border-r sm:border-amber-200/80 sm:pr-6 shrink-0">
                        <div className="text-4xl font-black text-gray-900">
                          {detailAnalytics.avgRating || '—'}
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-1 my-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(detailAnalytics.avgRating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {detailAnalytics.ratingsList?.length || 0} reviews submitted
                        </div>
                      </div>

                      {/* 5-Star to 1-Star Distribution */}
                      <div className="w-full space-y-1.5 text-xs">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = detailAnalytics.ratingDistribution?.[stars] || 0;
                          const total = detailAnalytics.ratingsList?.length || 1;
                          const pct = Math.round((count / total) * 100);

                          return (
                            <div key={stars} className="flex items-center gap-2">
                              <span className="w-8 font-semibold text-gray-600 text-right">{stars} ★</span>
                              <div className="h-2 flex-1 bg-gray-200/80 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-400 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-7 text-[10px] text-gray-400 text-right font-medium">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Learner Reviews List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Learner Comments & Reviews
                      </h4>

                      {!detailAnalytics.ratingsList || detailAnalytics.ratingsList.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                          No written reviews or star ratings submitted yet for this tour.
                        </div>
                      ) : (
                        detailAnalytics.ratingsList.map((r) => (
                          <div
                            key={r.id}
                            className="bg-white rounded-2xl border border-gray-200/80 p-4 space-y-2 hover:border-amber-200 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                                  {r.user.displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-gray-900">{r.user.displayName}</div>
                                  <div className="text-[10px] text-gray-400">{r.user.email}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${
                                      s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {r.comment && (
                              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 italic">
                                "{r.comment}"
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ── Sub-Tab 4: Insights & Recommendations ── */}
                {activeTab === 'recommendations' && (
                  <div className="space-y-3.5 pt-1">
                    <div className="text-xs text-gray-500 pb-1">
                      Automated suggestions derived from drop-off percentages, quiz scores, and learner progress.
                    </div>

                    {recommendations.length === 0 ? (
                      <div className="p-8 text-center text-xs text-emerald-800 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                        <span className="font-bold">Tour is performing optimally!</span> No critical drop-offs or issues detected.
                      </div>
                    ) : (
                      recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className={`rounded-2xl border p-4 transition-all ${
                            rec.type === 'warning'
                              ? 'bg-amber-50/60 border-amber-200'
                              : rec.type === 'alert'
                              ? 'bg-red-50/60 border-red-200'
                              : rec.type === 'success'
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-blue-50/60 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {rec.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                                {rec.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                                {rec.type === 'success' && <Sparkles className="w-4 h-4 text-emerald-600" />}
                                {rec.type === 'tip' && <BookOpen className="w-4 h-4 text-blue-600" />}
                                <h4 className="text-xs font-bold text-gray-900">{rec.title}</h4>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">{rec.description}</p>
                            </div>

                            {rec.actionText && rec.actionCallback && (
                              <button
                                onClick={rec.actionCallback}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 text-emerald-900 hover:bg-emerald-50 rounded-xl shadow-xs shrink-0 cursor-pointer transition"
                              >
                                {rec.actionText}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
