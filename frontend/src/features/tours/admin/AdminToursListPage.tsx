import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Map,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Copy,
  Search,
  AlertTriangle,
  BarChart2,
} from 'lucide-react';
import {
  getAdminToursList,
  publishTour,
  unpublishTour,
  deleteTour,
  createTour,
} from '../api/toursApi';
import type { TourAdminListItem } from '../types/tour.types';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';

export function AdminToursListPage() {
  useDocumentTitle('Tours Management | Admin Dashboard');
  const navigate = useNavigate();

  const [tours, setTours] = useState<TourAdminListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchTours = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminToursList();
      setTours(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tours list');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleTogglePublish = async (tour: TourAdminListItem) => {
    try {
      if (tour.isPublished) {
        await unpublishTour(tour.id);
      } else {
        await publishTour(tour.id);
      }
      fetchTours();
    } catch (err: any) {
      alert(err?.message || 'Failed to change publish status');
    }
  };

  const handleDuplicate = async (tour: TourAdminListItem) => {
    try {
      await createTour({
        title: `${tour.title} (Copy)`,
        slug: `${tour.slug}-copy-${Date.now().toString().slice(-4)}`,
        summary: tour.summary,
        level: tour.level,
        healthCategory: tour.healthCategory,
        isPublished: false,
      });
      fetchTours();
    } catch (err: any) {
      alert(err?.message || 'Failed to duplicate tour');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTour(id);
      setDeleteConfirmId(null);
      fetchTours();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete tour');
    }
  };

  const filteredTours = tours.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.healthCategory && t.healthCategory.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && t.isPublished) ||
      (statusFilter === 'DRAFT' && !t.isPublished);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-green-950">Tours Management</h1>
          <p className="text-green-700 text-sm mt-1">
            Build, edit, and publish guided learning pathways connected to real database herbs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/tours/analytics"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-green-200 text-green-800 hover:bg-green-50 text-sm font-semibold transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            Tour Analytics
          </Link>
          <button
            onClick={() => navigate('/dashboard/tours/manage/new')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-700 hover:bg-green-800 text-white text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Tour
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-green-100 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tours..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-green-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'ALL' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({tours.length})
          </button>
          <button
            onClick={() => setStatusFilter('PUBLISHED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'PUBLISHED' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Published ({tours.filter((t) => t.isPublished).length})
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'DRAFT' ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Drafts ({tours.filter((t) => !t.isPublished).length})
          </button>
        </div>
      </div>

      {/* Tours Table */}
      <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500 animate-pulse">Loading tours...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : filteredTours.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            No tours found matching your search. Click "Create New Tour" to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-green-50/60 border-b border-green-100 text-[11px] font-bold text-green-900 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tour Title & Slug</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Level</th>
                  <th className="py-3.5 px-4">Checkpoints</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Engagement</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredTours.map((t) => (
                  <tr key={t.id} className="hover:bg-green-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 text-sm">{t.title}</div>
                      <div className="text-gray-400 font-mono text-[11px]">/{t.slug}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {t.healthCategory ? (
                        <span className="capitalize">{t.healthCategory}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {t.level}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700">
                      {t.checkpointCount} stops
                    </td>
                    <td className="py-3.5 px-4">
                      {t.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <XCircle className="w-3 h-3 text-amber-600" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <div>Starts: <span className="font-semibold text-gray-900">{t.startedCount}</span></div>
                      <div>Completed: <span className="font-semibold text-emerald-800">{t.completedCount}</span></div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/virtual-tour/${t.slug}?preview=1`}
                          title="Preview Tour"
                          className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => navigate(`/dashboard/tours/manage/${t.id}`)}
                          title="Edit Tour"
                          className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(t)}
                          title="Duplicate Tour"
                          className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(t)}
                          title={t.isPublished ? 'Unpublish' : 'Publish'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            t.isPublished
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {t.isPublished ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(t.id)}
                          title="Delete Tour"
                          className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-200 p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete this Tour?</h3>
            <p className="text-xs text-gray-600 mb-6">
              This action will soft-delete the tour and remove it from public view. User progress records will be preserved in analytics.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
