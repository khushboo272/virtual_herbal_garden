import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Leaf,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Undo,
  MessageSquare,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/card';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { StatusBadge } from '../components/StatusBadge';
import { CorrectionRequestModal } from '../components/CorrectionRequestModal';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import {
  listContributions,
  withdrawContribution,
  deleteContribution,
} from '../api/contributionsApi';
import type { IContributionItem, ContentStatus } from '../types';
import { toast } from 'sonner';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Drafts', value: 'DRAFT' },
  { label: 'Pending Review', value: 'PENDING_REVIEW' },
  { label: 'Changes Requested', value: 'CHANGES_REQUESTED' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export function MyContributionsPage() {
  useDocumentTitle('My Contributions | Virtual Herbal Garden');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get('status') || 'ALL';
  const currentType = (searchParams.get('type') as 'plant' | 'remedy' | null) || undefined;
  const currentSearch = searchParams.get('q') || '';
  const currentPage = Number(searchParams.get('page')) || 1;

  const [items, setItems] = useState<IContributionItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<IContributionItem | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<IContributionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search input local state
  const [searchInput, setSearchInput] = useState(currentSearch);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listContributions({
        status: currentTab === 'ALL' ? undefined : currentTab,
        type: currentType,
        q: currentSearch || undefined,
        page: currentPage,
        limit: 15,
      });
      setItems(res.items);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err?.message || 'Failed to load contributions');
    } finally {
      setLoading(false);
    }
  }, [currentTab, currentType, currentSearch, currentPage]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const updateFilters = (newParams: Record<string, string | null>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === '' || v === 'ALL') {
        updated.delete(k);
      } else {
        updated.set(k, v);
      }
    });
    // Reset page to 1 on filter changes unless changing page
    if (!('page' in newParams)) {
      updated.delete('page');
    }
    setSearchParams(updated);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput });
  };

  const handleWithdraw = async (item: IContributionItem) => {
    if (!window.confirm(`Withdraw "${item.title}" back to draft status?`)) return;
    try {
      await withdrawContribution(item.type, item.id);
      toast.success(`"${item.title}" withdrawn to draft`);
      fetchItems();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to withdraw contribution');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteContribution(deleteTarget.type, deleteTarget.id);
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      fetchItems();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete contribution');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Contributions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your plant monographs, remedy preparations, and review submissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/dashboard/contributions/new-plant')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl h-9 px-3.5 flex items-center gap-1.5 shadow-xs"
          >
            <Leaf className="w-3.5 h-3.5" />
            New Plant
          </Button>
          <Button
            onClick={() => navigate('/dashboard/contributions/new-remedy')}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-xl h-9 px-3.5 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Remedy
          </Button>
        </div>
      </div>

      {/* Status Tabs Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 sm:space-x-4 min-w-max pb-px">
          {STATUS_TABS.map((tab) => {
            const active = currentTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => updateFilters({ status: tab.value })}
                className={`py-2.5 px-3 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                  active
                    ? 'border-purple-600 text-purple-900 bg-purple-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title, species..."
            className="pl-9 h-9 text-xs rounded-xl border-slate-200 focus:border-purple-400"
          />
        </form>

        {/* Type & Reset Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => updateFilters({ type: null })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                !currentType ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => updateFilters({ type: 'plant' })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                currentType === 'plant'
                  ? 'bg-white shadow-xs text-emerald-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Leaf className="w-3 h-3" /> Plants
            </button>
            <button
              onClick={() => updateFilters({ type: 'remedy' })}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                currentType === 'remedy'
                  ? 'bg-white shadow-xs text-purple-800'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3 h-3" /> Remedies
            </button>
          </div>
        </div>
      </div>

      {/* Content Table / List */}
      <Card className="border border-slate-200/80 shadow-xs rounded-2xl bg-white overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">Loading contributions...</div>
          ) : error ? (
            <div className="p-12 text-center text-xs text-rose-600 space-y-2">
              <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
              <p>{error}</p>
              <Button size="sm" variant="outline" onClick={fetchItems} className="text-xs rounded-xl">
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">No contributions found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {currentSearch || currentTab !== 'ALL' || currentType
                    ? 'Try clearing your active filters or search terms.'
                    : 'Start creating plant drafts or traditional remedies to populate your workspace.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  onClick={() => navigate('/dashboard/contributions/new-plant')}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Plant
                </Button>
                <Button
                  onClick={() => navigate('/dashboard/contributions/new-remedy')}
                  size="sm"
                  variant="outline"
                  className="text-xs rounded-xl text-purple-700 border-purple-200"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Remedy
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const canEdit =
                  item.status === 'DRAFT' ||
                  item.status === 'CHANGES_REQUESTED' ||
                  item.status === 'REJECTED';
                const isPending = item.status === 'PENDING_REVIEW';
                const isPublished = item.status === 'PUBLISHED';
                const previewUrl =
                  item.type === 'plant'
                    ? `/library/${item.slug}?preview=1`
                    : `/remedies/${item.slug}?preview=1`;

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Item Information */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.type === 'plant'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {item.type === 'plant' ? (
                          <Leaf className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <Link
                            to={
                              canEdit
                                ? `/dashboard/contributions/${item.type}/${item.slug || item.id}`
                                : `/dashboard/contributions/${item.type}/${item.slug || item.id}/review`
                            }
                            className="font-bold text-sm text-slate-900 hover:text-purple-600 transition-colors"
                          >
                            {item.title}
                          </Link>
                          <StatusBadge status={item.status} />
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {item.type}
                          </span>
                        </div>

                        {item.subtitle && (
                          <p className="text-xs text-slate-500 italic truncate">
                            {item.subtitle}
                          </p>
                        )}

                        {/* Reviewer Note preview if present */}
                        {item.lastReviewComment && (
                          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2 text-xs text-amber-900 mt-1 max-w-xl">
                            <span className="font-semibold">Reviewer Comment: </span>
                            <span>"{item.lastReviewComment}"</span>
                          </div>
                        )}

                        <p className="text-[11px] text-slate-400">
                          Updated {new Date(item.updatedAt).toLocaleDateString()}
                          {item.submittedAt && ` • Submitted ${new Date(item.submittedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                      {/* Edit Button */}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/dashboard/contributions/${item.type}/${item.slug || item.id}`)}
                          className="h-8 px-2.5 text-xs rounded-xl text-slate-700 hover:text-purple-700 hover:border-purple-200"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1 text-purple-600" />
                          Edit
                        </Button>
                      )}

                      {/* Withdraw Button */}
                      {isPending && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWithdraw(item)}
                          className="h-8 px-2.5 text-xs rounded-xl text-amber-700 hover:text-amber-800 border-amber-200 bg-amber-50/50"
                        >
                          <Undo className="w-3.5 h-3.5 mr-1" />
                          Withdraw
                        </Button>
                      )}

                      {/* Preview Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(previewUrl, '_blank')}
                        className="h-8 px-2 text-xs rounded-xl text-slate-600 hover:text-slate-900"
                        title="Preview library page"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Preview
                      </Button>

                      {/* Request Correction (for published) */}
                      {isPublished && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCorrectionTarget(item)}
                          className="h-8 px-2.5 text-xs rounded-xl text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        >
                          <AlertCircle className="w-3.5 h-3.5 mr-1" />
                          Request Correction
                        </Button>
                      )}

                      {/* View Feedback History */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/dashboard/contributions/${item.type}/${item.slug || item.id}/review`)}
                        className="h-8 px-2 text-xs rounded-xl text-slate-600 hover:text-slate-900"
                        title="View review history"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </Button>

                      {/* Delete Button (only draft, changes_requested, rejected) */}
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(item)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 rounded-xl"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Showing Page {meta.page} of {meta.totalPages} ({meta.total} total)
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={meta.page <= 1}
              onClick={() => updateFilters({ page: String(meta.page - 1) })}
              className="text-xs rounded-xl h-8 px-3"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={meta.page >= meta.totalPages}
              onClick={() => updateFilters({ page: String(meta.page + 1) })}
              className="text-xs rounded-xl h-8 px-3"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Correction Request Modal */}
      {correctionTarget && (
        <CorrectionRequestModal
          isOpen={!!correctionTarget}
          onClose={() => setCorrectionTarget(null)}
          type={correctionTarget.type}
          id={correctionTarget.id}
          itemTitle={correctionTarget.title}
          onSuccess={fetchItems}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete Contribution</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-semibold text-slate-800">"{deleteTarget.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 text-xs rounded-xl h-9"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl h-9"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
