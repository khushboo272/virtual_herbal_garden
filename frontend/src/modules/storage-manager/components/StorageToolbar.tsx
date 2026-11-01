import React from 'react';
import {
  Upload,
  FolderPlus,
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  Filter,
  Download,
  Trash2,
  ChevronRight,
  Home,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  StorageFilterType,
  StorageDbFilter,
  StorageViewMode,
  StorageSortField,
  StorageSortDirection,
} from '../types';

interface StorageToolbarProps {
  currentPrefix: string;
  selectedCount?: number;
  totalItemsCount?: number;
  viewMode?: StorageViewMode;
  searchQuery?: string;
  typeFilter?: StorageFilterType;
  dbFilter?: StorageDbFilter;
  sortField?: StorageSortField;
  sortDirection?: StorageSortDirection;
  isLoading?: boolean;
  onNavigatePrefix: (prefix: string) => void;
  onOpenUpload?: () => void;
  onUploadClick?: () => void;
  onOpenNewFolder?: () => void;
  onCreateFolderClick?: () => void;
  onRefresh?: () => void;
  onRefreshClick?: () => void;
  onToggleViewMode?: () => void;
  onSearchChange?: (q: string) => void;
  onTypeFilterChange?: (t: StorageFilterType) => void;
  onDbFilterChange?: (db: StorageDbFilter) => void;
  onSortChange?: (field: StorageSortField) => void;
  onToggleSelectAll?: () => void;
  onDownloadZip?: () => void;
  onBulkDownloadClick?: () => void;
  onDeleteSelected?: () => void;
  onBulkDeleteClick?: () => void;
}

export const StorageToolbar: React.FC<StorageToolbarProps> = ({
  currentPrefix,
  selectedCount = 0,
  totalItemsCount = 0,
  viewMode = 'grid',
  searchQuery = '',
  typeFilter = 'ALL',
  dbFilter = 'ALL',
  sortField = 'name',
  sortDirection = 'asc',
  isLoading = false,
  onNavigatePrefix,
  onOpenUpload,
  onUploadClick,
  onOpenNewFolder,
  onCreateFolderClick,
  onRefresh,
  onRefreshClick,
  onToggleViewMode,
  onSearchChange,
  onTypeFilterChange,
  onDbFilterChange,
  onSortChange,
  onToggleSelectAll,
  onDownloadZip,
  onBulkDownloadClick,
  onDeleteSelected,
  onBulkDeleteClick,
}) => {
  const handleUpload = onOpenUpload || onUploadClick;
  const handleNewFolder = onOpenNewFolder || onCreateFolderClick;
  const handleRefresh = onRefresh || onRefreshClick;
  const handleDownload = onDownloadZip || onBulkDownloadClick;
  const handleDelete = onDeleteSelected || onBulkDeleteClick;
  // Breadcrumbs parsing
  const pathSegments = currentPrefix.split('/').filter(Boolean);

  return (
    <div className="bg-white dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 p-3.5 space-y-3">
      {/* Top Row: Breadcrumbs & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Breadcrumb Path */}
        <div className="flex items-center space-x-1.5 text-xs text-gray-500 overflow-x-auto py-1">
          <button
            onClick={() => onNavigatePrefix('')}
            className={`flex items-center space-x-1 hover:text-emerald-600 transition-colors ${
              pathSegments.length === 0 ? 'text-gray-900 dark:text-white font-semibold' : ''
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>root</span>
          </button>

          {pathSegments.map((segment, idx) => {
            const segmentPrefix = pathSegments.slice(0, idx + 1).join('/') + '/';
            const isLast = idx === pathSegments.length - 1;

            return (
              <React.Fragment key={segmentPrefix}>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <button
                  onClick={() => onNavigatePrefix(segmentPrefix)}
                  className={`hover:text-emerald-600 truncate max-w-[120px] transition-colors ${
                    isLast ? 'text-gray-900 dark:text-white font-semibold' : ''
                  }`}
                >
                  {segment}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {selectedCount > 0 ? (
            <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1.5 text-xs text-emerald-800 dark:text-emerald-300">
              <span className="font-semibold">{selectedCount} selected</span>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1 hover:text-emerald-600 ml-2"
                title="Download as ZIP"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ZIP</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 ml-2"
                title="Delete Selected"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          ) : null}

          <button
            onClick={handleNewFolder}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Folder</span>
          </button>

          <button
            onClick={handleUpload}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onToggleViewMode}
            className="p-1.5 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
            title={viewMode === 'grid' ? 'Switch to List view' : 'Switch to Grid view'}
          >
            {viewMode === 'grid' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Bottom Row: Search, Type Filter, DB Status, Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        {/* Left Side: Select All & Search */}
        <div className="flex items-center space-x-2 flex-1 min-w-[240px] max-w-md">
          {totalItemsCount > 0 && (
            <button
              onClick={onToggleSelectAll}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Select all"
            >
              {selectedCount > 0 && selectedCount === totalItemsCount ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          )}

          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by name or prefix..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Right Side: Filters & Sorters */}
        <div className="flex items-center space-x-2 text-xs">
          {/* File Type Filter */}
          <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1 bg-gray-50 dark:bg-gray-900">
            <Filter className="w-3 h-3 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value as StorageFilterType)}
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="IMAGE">Images (.webp, .jpg, .png)</option>
              <option value="MODEL">3D Models (.glb)</option>
              <option value="JSON">JSON / CSV</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Database Link Status Filter */}
          <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1 bg-gray-50 dark:bg-gray-900">
            <select
              value={dbFilter}
              onChange={(e) => onDbFilterChange(e.target.value as StorageDbFilter)}
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All DB Status</option>
              <option value="LINKED">Linked to DB</option>
              <option value="UNLINKED">Unlinked (Orphans)</option>
            </select>
          </div>

          {/* Sort By Field */}
          <div className="flex items-center space-x-1 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1 bg-gray-50 dark:bg-gray-900">
            <span className="text-gray-400">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => onSortChange(e.target.value as StorageSortField)}
              className="bg-transparent text-gray-700 dark:text-gray-300 focus:outline-none text-xs cursor-pointer"
            >
              <option value="name">Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</option>
              <option value="size">Size {sortField === 'size' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</option>
              <option value="lastModified">Date {sortField === 'lastModified' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</option>
              <option value="type">Type {sortField === 'type' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

