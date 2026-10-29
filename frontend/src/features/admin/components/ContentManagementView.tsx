import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Star,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Leaf,
  Download,
  Check,
  X,
  FileSpreadsheet,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Badge } from '../../../app/components/ui/badge';
import { Checkbox } from '../../../app/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '../../../app/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../app/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../app/components/ui/dialog';
import {
  getContentList,
  publishContent,
  unpublishContent,
  toggleFeatureContent,
  getContentImpact,
  deleteContent,
  bulkUnpublishContent,
  bulkPublishContent,
  bulkFeatureContent,
  bulkStatusContent,
  bulkDeleteContent,
} from '../api/adminApi';
import type { ContentItem, ContentImpact, PaginationData } from '../types/admin.types';
import { toast } from 'sonner';

interface ContentManagementViewProps {
  type: 'plants' | 'remedies';
  title: string;
  description: string;
}

export function ContentManagementView({ type, title, description }: ContentManagementViewProps) {
  const navigate = useNavigate();
  const isPlants = type === 'plants';

  const [items, setItems] = useState<ContentItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Bulk Selection & Advanced Operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Derived counts for selected items
  const selectedItems = items.filter((it) => selectedIds.includes(it._id));
  const selectedPublishedCount = selectedItems.filter((it) => it.isPublished).length;
  const selectedDraftCount = selectedItems.filter((it) => !it.isPublished).length;
  const selectedFeaturedCount = selectedItems.filter((it) => it.isFeatured).length;

  // Delete & Impact Dialog
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [impactData, setImpactData] = useState<ContentImpact | null>(null);
  const [confirmSlugInput, setConfirmSlugInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getContentList(type, {
        q,
        status: statusFilter,
        featured: featuredFilter,
        sort: sortOption,
        page,
        limit: 20,
      });
      setItems(res.items);
      setPagination(res.pagination);
      setSelectedIds([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load content list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [type, statusFilter, featuredFilter, sortOption]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(1);
  };

  // Toggle selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map((i) => i._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Single Item Actions
  const handlePublishToggle = async (item: ContentItem) => {
    try {
      if (item.isPublished) {
        await unpublishContent(type, item._id);
        toast.success(`Unpublished ${item.commonName || item.title}`);
      } else {
        await publishContent(type, item._id);
        toast.success(`Published ${item.commonName || item.title}`);
      }
      loadData(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update publication status');
    }
  };

  const handleToggleFeature = async (item: ContentItem) => {
    try {
      await toggleFeatureContent(type, item._id);
      toast.success(item.isFeatured ? 'Removed from featured' : 'Added to featured!');
      loadData(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle featured status');
    }
  };

  const handleOpenDelete = async (item: ContentItem) => {
    setDeleteTarget(item);
    setConfirmSlugInput('');
    setImpactData(null);
    try {
      const impact = await getContentImpact(type, item._id);
      setImpactData(impact);
    } catch {
      // Non-critical
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.isPublished) {
      toast.error('Item must be unpublished before deletion.');
      return;
    }
    if (confirmSlugInput.trim() !== deleteTarget.slug) {
      toast.error(`Confirmation slug does not match "${deleteTarget.slug}"`);
      return;
    }

    try {
      setIsDeleting(true);
      await deleteContent(type, deleteTarget._id, confirmSlugInput.trim());
      toast.success('Content item deleted successfully.');
      setDeleteTarget(null);
      loadData(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Actions
  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await bulkPublishContent(type, selectedIds);
      toast.success(`Published ${res.processed} item(s) successfully.`);
      loadData(pagination.page);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err?.message || 'Failed bulk publish');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkUnpublish = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await bulkUnpublishContent(type, selectedIds);
      toast.success(`Unpublished ${res.processed} item(s) successfully.`);
      loadData(pagination.page);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err?.message || 'Failed bulk unpublish');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkFeature = async (isFeatured: boolean) => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await bulkFeatureContent(type, selectedIds, isFeatured);
      toast.success(`${isFeatured ? 'Featured' : 'Unfeatured'} ${res.processed} item(s) successfully.`);
      loadData(pagination.page);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${isFeatured ? 'feature' : 'unfeature'} items`);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      const res = await bulkStatusContent(type, selectedIds, status);
      toast.success(`Status updated for ${res.processed} item(s).`);
      loadData(pagination.page);
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status for items');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkExport = (format: 'csv' | 'json') => {
    if (selectedItems.length === 0) return;

    if (format === 'json') {
      const jsonString = JSON.stringify(selectedItems, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedItems.length} item(s) to JSON.`);
      return;
    }

    // CSV format
    const headers = [
      'ID',
      'Title',
      'Scientific Name',
      'Slug',
      'Family',
      'Status',
      'Is Published',
      'Is Featured',
      'Owner',
      'Updated At',
      'Medicinal Uses',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '';
      const text = String(str).replace(/"/g, '""');
      return text.includes(',') || text.includes('\n') || text.includes('"') ? `"${text}"` : text;
    };

    const rows = selectedItems.map((it) => [
      escapeCsv(it._id),
      escapeCsv(it.commonName || it.title),
      escapeCsv(it.scientificName || ''),
      escapeCsv(it.slug),
      escapeCsv(it.family || ''),
      escapeCsv(it.status),
      escapeCsv(it.isPublished ? 'YES' : 'NO'),
      escapeCsv(it.isFeatured ? 'YES' : 'NO'),
      escapeCsv(it.owner?.displayName || it.createdBy?.displayName || 'Editorial Admin'),
      escapeCsv(it.updatedAt || ''),
      escapeCsv((it.medicinalUses || []).join('; ')),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedItems.length} item(s) to CSV.`);
  };

  const executeBulkDelete = async (forceUnpublishFirst: boolean) => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      if (forceUnpublishFirst && selectedPublishedCount > 0) {
        const publishedIds = selectedItems.filter((it) => it.isPublished).map((it) => it._id);
        await bulkUnpublishContent(type, publishedIds);
      }
      const res = await bulkDeleteContent(type, selectedIds);
      toast.success(`Deleted ${res.processed} item(s) successfully.`);
      setIsBulkDeleteOpen(false);
      setSelectedIds([]);
      loadData(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || 'Failed bulk deletion. Ensure all items are unpublished first.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="text-slate-600 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              navigate(
                isPlants
                  ? '/dashboard/contributions/new-plant?admin=true'
                  : '/dashboard/contributions/new-remedy?admin=true',
              )
            }
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add New {isPlants ? 'Plant' : 'Remedy'}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search by name, scientific name, or slug...`}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="">All Content</option>
              <option value="true">Featured Only</option>
              <option value="false">Non-Featured</option>
            </select>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="updated">Recently Updated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3.5 shadow-sm transition-all duration-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-950">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              {selectedIds.length} item(s) selected
            </span>
            <span className="text-xs text-emerald-800/80 font-medium hidden sm:inline">
              ({selectedPublishedCount} published • {selectedDraftCount} draft • {selectedFeaturedCount} featured)
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
              className="h-7 text-xs text-emerald-800 hover:text-emerald-900 hover:bg-emerald-100/70 px-2 font-medium"
            >
              Deselect All
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Publish */}
            <Button
              size="sm"
              onClick={handleBulkPublish}
              disabled={isBulkProcessing}
              className="bg-emerald-700 hover:bg-emerald-800 text-white h-8 text-xs font-medium shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Bulk Publish
            </Button>

            {/* Bulk Unpublish */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkUnpublish}
              disabled={isBulkProcessing}
              className="bg-white border-amber-300 text-amber-800 hover:bg-amber-50 h-8 text-xs font-medium"
            >
              <XCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Bulk Unpublish
            </Button>

            {/* Bulk Feature / Unfeature */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkFeature(true)}
              disabled={isBulkProcessing}
              className="bg-white border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 h-8 text-xs font-medium"
            >
              <Star className="w-3.5 h-3.5 mr-1 text-amber-500 fill-amber-500" />
              Bulk Feature
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkFeature(false)}
              disabled={isBulkProcessing}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs font-medium"
            >
              <Star className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Bulk Unfeature
            </Button>

            {/* Change Status Dropdown */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatus(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              disabled={isBulkProcessing}
              className="h-8 text-xs border border-slate-200 rounded-md px-2.5 bg-white text-slate-700 outline-none hover:border-slate-300 transition-colors font-medium cursor-pointer"
            >
              <option value="" disabled>Change Status...</option>
              <option value="DRAFT">Move to Draft</option>
              <option value="PENDING_REVIEW">Submit for Review</option>
              <option value="PUBLISHED">Set Published</option>
              <option value="CHANGES_REQUESTED">Request Changes</option>
              <option value="REJECTED">Set Rejected</option>
            </select>

            {/* Export options */}
            <div className="inline-flex rounded-md shadow-xs">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkExport('csv')}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs font-medium rounded-r-none border-r-0"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export (CSV)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkExport('json')}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-8 text-xs font-medium rounded-l-none"
              >
                JSON
              </Button>
            </div>

            {/* Bulk Delete */}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={isBulkProcessing}
              className="h-8 text-xs font-medium bg-red-600 hover:bg-red-700 text-white shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Bulk Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 animate-pulse">Loading content entries...</div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-semibold text-slate-800 text-base">No content found</h3>
              <p className="text-sm text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === items.length && items.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    />
                  </TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => {
                  const heroImg = it.images?.find((img) => img.isPrimary)?.url || it.images?.[0]?.url;
                  const ownerName = it.owner?.displayName || it.owner?.name || it.createdBy?.displayName || 'Editorial Admin';

                  return (
                    <TableRow key={it._id} className={selectedIds.includes(it._id) ? 'bg-green-50/40' : undefined}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(it._id)}
                          onCheckedChange={() => handleToggleSelect(it._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {heroImg ? (
                              <img src={heroImg} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Leaf className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {it.commonName || it.title}
                            </span>
                            {it.scientificName && (
                              <span className="text-xs text-slate-500 italic block">{it.scientificName}</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {it.status === 'PENDING_REVIEW' ? (
                          <Link
                            to={`/dashboard/moderation?type=${isPlants ? 'plant' : 'remedy'}`}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors"
                            title="Open in Moderation Queue"
                          >
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>Pending review</span>
                          </Link>
                        ) : (
                          <Badge
                            className={
                              it.isPublished
                                ? 'bg-green-100 text-green-800'
                                : 'bg-slate-100 text-slate-800'
                            }
                          >
                            {it.isPublished ? 'PUBLISHED' : it.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-700">{ownerName}</span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleToggleFeature(it)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-amber-500 transition-colors"
                          title={it.isFeatured ? 'Unfeature' : 'Feature on homepage'}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              it.isFeatured ? 'text-amber-500 fill-amber-500' : ''
                            }`}
                          />
                        </button>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(it.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Preview Link */}
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-slate-900"
                            title="Preview public page"
                          >
                            <a
                              href={isPlants ? `/plant/${it.slug}` : `/remedies/${it.slug}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          </Button>

                          {/* Edit in Admin Mode */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-slate-900"
                            title="Edit in Admin Mode"
                            onClick={() =>
                              navigate(
                                isPlants
                                  ? `/dashboard/contributions/plant/${it._id}?admin=true`
                                  : `/dashboard/contributions/remedy/${it._id}?admin=true`,
                              )
                            }
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>

                          {/* Publish/Unpublish */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-600 hover:text-slate-900"
                            title={it.isPublished ? 'Unpublish' : 'Publish'}
                            onClick={() => handlePublishToggle(it)}
                          >
                            {it.isPublished ? (
                              <XCircle className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            )}
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Delete Item"
                            onClick={() => handleOpenDelete(it)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-600">
              <span>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => loadData(pagination.page - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadData(pagination.page + 1)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation & Impact Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" /> Delete Content Item
            </DialogTitle>
            <DialogDescription>
              Review impact analysis and confirm deletion of this item.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                You are about to delete <strong>{deleteTarget.commonName || deleteTarget.title}</strong>.
              </p>

              {/* Impact analysis */}
              {impactData && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                  <span className="font-semibold text-slate-800 uppercase block">Impact Analysis:</span>
                  <p>• Remedies referencing: <strong>{impactData.remedies}</strong></p>
                  <p>• Tours referencing: <strong>{impactData.tours}</strong></p>
                  <p>• User gardens containing it: <strong>{impactData.userGardens}</strong></p>
                  <p>• User bookmarks referencing: <strong>{impactData.bookmarks}</strong></p>
                </div>
              )}

              {/* Publication guard */}
              {deleteTarget.isPublished ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-2">
                  <p className="font-semibold">⚠️ Item is currently published.</p>
                  <p>Content must be unpublished first before it can be deleted.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-300 text-amber-900"
                    onClick={async () => {
                      await unpublishContent(type, deleteTarget._id);
                      setDeleteTarget({ ...deleteTarget, isPublished: false });
                      toast.success('Item unpublished. You may now confirm deletion.');
                    }}
                  >
                    Unpublish Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-slate-600">
                    To confirm permanent deletion, please type the item slug: <strong className="font-mono text-slate-900">{deleteTarget.slug}</strong>
                  </p>
                  <Input
                    value={confirmSlugInput}
                    onChange={(e) => setConfirmSlugInput(e.target.value)}
                    placeholder={deleteTarget.slug}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                isDeleting ||
                deleteTarget?.isPublished ||
                confirmSlugInput.trim() !== deleteTarget?.slug
              }
              onClick={handleConfirmDelete}
            >
              Confirm Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Modal */}
      <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Bulk Deletion
            </DialogTitle>
            <DialogDescription>
              Permanently delete selected items from the catalog database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-slate-600">
            <p>
              You are about to delete <strong className="text-slate-900">{selectedIds.length}</strong> {type}.
            </p>
            {selectedPublishedCount > 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {selectedPublishedCount} item(s) are currently published
                </p>
                <p>
                  Published content cannot be deleted directly to protect live bookmarks and experiences.
                  Would you like to automatically unpublish them and proceed with deletion?
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                All selected items are unpublished drafts and will be deleted.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsBulkDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            {selectedPublishedCount > 0 ? (
              <Button
                variant="destructive"
                onClick={() => executeBulkDelete(true)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Processing...' : 'Unpublish & Delete All'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => executeBulkDelete(false)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete Selected Items'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
