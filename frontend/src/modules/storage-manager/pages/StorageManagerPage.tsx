import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  Wrench,
  Trash2,
  FolderPlus,
  Loader2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import {
  IStorageItem,
  IStorageFolder,
  IBucketStats,
  StorageFilterType,
  StorageDbFilter,
  StorageViewMode,
  StorageSortField,
  StorageSortDirection,
} from '../types';
import { storageApi } from '../api/storageApi';
import { StorageTree } from '../components/StorageTree';
import { StorageToolbar } from '../components/StorageToolbar';
import { StorageItemGrid } from '../components/StorageItemGrid';
import { StorageItemList } from '../components/StorageItemList';
import { StoragePreviewDrawer } from '../components/StoragePreviewDrawer';
import { StorageUploadModal } from '../components/StorageUploadModal';
import { StorageToolsView } from '../components/StorageToolsView';
import { StorageTrashView } from '../components/StorageTrashView';
import { toast } from 'sonner';

export const StorageManagerPage: React.FC = () => {
  useDocumentTitle('Storage (R2) Manager | Virtual Herbal Garden');
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Navigation tab: 'files' | 'tools' | 'trash'
  const [activeTab, setActiveTab] = useState<'files' | 'tools' | 'trash'>('files');

  // Directory navigation state
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [items, setItems] = useState<IStorageItem[]>([]);
  const [folders, setFolders] = useState<IStorageFolder[]>([]);
  const [bucketStats, setBucketStats] = useState<IBucketStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [scanningStats, setScanningStats] = useState<boolean>(false);

  // Selection & Preview state
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<IStorageItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Filters, Sorting & View
  const [viewMode, setViewMode] = useState<StorageViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<StorageFilterType>('ALL');
  const [dbFilter, setDbFilter] = useState<StorageDbFilter>('ALL');
  const [sortField, setSortField] = useState<StorageSortField>('name');
  const [sortDirection, setSortDirection] = useState<StorageSortDirection>('asc');

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Load bucket usage stats
  const loadBucketStats = useCallback(async (rescan = false) => {
    try {
      if (rescan) setScanningStats(true);
      const stats = await storageApi.getBucketInfo(rescan);
      setBucketStats(stats);
      if (rescan) toast.success('Bucket metrics refreshed');
    } catch (err: any) {
      console.warn('Could not load bucket stats:', err);
    } finally {
      if (rescan) setScanningStats(false);
    }
  }, []);

  // Load objects & folders in prefix
  const loadObjects = useCallback(async (prefix = currentPrefix) => {
    try {
      setLoading(true);
      setSelectedKeys([]);
      const res = await storageApi.list(prefix);
      setFolders(res.folders || []);
      setItems(res.items || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to list storage objects');
    } finally {
      setLoading(false);
    }
  }, [currentPrefix]);

  useEffect(() => {
    loadObjects(currentPrefix);
  }, [currentPrefix, loadObjects]);

  useEffect(() => {
    loadBucketStats();
  }, [loadBucketStats]);

  // Navigate into a folder
  const handleSelectPrefix = (prefix: string) => {
    if (prefix === 'trash/') {
      setActiveTab('trash');
      return;
    }
    setActiveTab('files');
    setCurrentPrefix(prefix);
    setPreviewItem(null);
  };

  // Selection handlers
  const handleSelectKey = (key: string, isShift: boolean, isCtrl: boolean) => {
    if (isCtrl) {
      setSelectedKeys((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    } else {
      setSelectedKeys([key]);
    }
  };

  const handleSelectAll = () => {
    if (displayItems.length === 0) return;
    const allKeys = displayItems.map((it) => it.key);
    const areAllSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.includes(k));
    if (areAllSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(allKeys);
    }
  };

  // Delete single item (Soft delete to trash)
  const handleDeleteItem = async (item: IStorageItem) => {
    const isFolder = item.isFolder;
    const confirmMsg = isFolder
      ? `Are you sure you want to delete folder "${item.name}" and all its contents?`
      : `Move "${item.name}" to trash?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (isFolder) {
        await storageApi.deletePrefix(item.key);
      } else {
        await storageApi.deleteObject(item.key, false);
      }
      toast.success(isFolder ? 'Folder deleted' : 'Moved to trash');
      if (previewItem?.key === item.key) setPreviewItem(null);
      loadObjects();
      loadBucketStats();
    } catch (err: any) {
      toast.error(err?.message || 'Delete operation failed');
    }
  };

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selectedKeys.length === 0) return;
    if (!window.confirm(`Move ${selectedKeys.length} selected items to trash?`)) return;

    try {
      await storageApi.deleteMany(selectedKeys, false);
      toast.success(`Moved ${selectedKeys.length} items to trash`);
      setSelectedKeys([]);
      loadObjects();
      loadBucketStats();
    } catch (err: any) {
      toast.error(err?.message || 'Bulk delete failed');
    }
  };

  // Bulk download as ZIP stream
  const handleBulkDownload = async () => {
    if (selectedKeys.length === 0) return;
    try {
      toast.info(`Preparing ZIP archive for ${selectedKeys.length} files...`);
      const blob = await storageApi.downloadZip(selectedKeys);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storage-export-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ZIP download started');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download ZIP');
    }
  };

  // Create new folder
  const handleCreateFolder = async () => {
    const folderName = window.prompt('Enter new folder name:');
    if (!folderName || !folderName.trim()) return;

    const sanitized = folderName.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
    const folderPath = `${currentPrefix}${sanitized}/`;

    try {
      await storageApi.createFolder(folderPath);
      toast.success(`Folder "${sanitized}" created`);
      loadObjects();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create folder');
    }
  };

  // Copy public URL
  const handleCopyUrl = (item: IStorageItem) => {
    navigator.clipboard.writeText(item.publicUrl);
    toast.success('Public URL copied to clipboard');
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewItem(null);
        setIsUploadModalOpen(false);
      } else if (e.key === 'Delete' && selectedKeys.length > 0) {
        handleBulkDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedKeys]);

  // Filter & Sort items for display
  const filteredAndSortedItems = items
    .filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!item.name.toLowerCase().includes(q) && !item.key.toLowerCase().includes(q)) {
          return false;
        }
      }
      // Type Filter
      if (typeFilter !== 'ALL') {
        const ct = item.contentType.toLowerCase();
        const key = item.key.toLowerCase();
        if (typeFilter === 'IMAGE' && !ct.startsWith('image/') && !/\.(webp|png|jpg|jpeg|avif)$/.test(key)) {
          return false;
        }
        if (typeFilter === 'MODEL' && !ct.includes('gltf') && !key.endsWith('.glb')) {
          return false;
        }
        if (typeFilter === 'JSON' && !ct.includes('json') && !ct.includes('csv') && !key.endsWith('.json')) {
          return false;
        }
      }
      // DB Filter
      if (dbFilter === 'LINKED' && item.dbUsageCount === 0) return false;
      if (dbFilter === 'UNLINKED' && item.dbUsageCount > 0) return false;

      return true;
    })
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === 'lastModified') {
        valA = new Date(a.lastModified).getTime();
        valB = new Date(b.lastModified).getTime();
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Combine folders and items for display
  const displayItems: IStorageItem[] = [
    ...folders.map((f) => ({
      key: f.prefix,
      name: f.name,
      size: 0,
      lastModified: new Date(),
      contentType: 'directory',
      publicUrl: '',
      isFolder: true,
      dbUsageCount: 0,
    })),
    ...filteredAndSortedItems,
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[620px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Top Storage Tabs */}
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'files'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HardDrive className="w-4 h-4" /> File Manager
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'tools'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" /> Storage Tools
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trash')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'trash'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trash2 className="w-4 h-4" /> Trash
          </button>
        </div>

        {activeTab === 'files' && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              {displayItems.length} item{displayItems.length !== 1 ? 's' : ''} in{' '}
              <code className="font-mono text-slate-700 dark:text-slate-300">
                {currentPrefix || '/'}
              </code>
            </span>
          </div>
        )}
      </div>

      {/* Main Container Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tree & Usage Sidebar (Visible in Files & Tools modes) */}
        <StorageTree
          currentPrefix={currentPrefix}
          folders={folders}
          onSelectPrefix={handleSelectPrefix}
          stats={bucketStats}
          onRefreshStats={() => loadBucketStats(true)}
          isSuperAdmin={isSuperAdmin}
          formatBytes={formatBytes}
          activeView={activeTab === 'files' ? 'browser' : activeTab}
          onChangeView={(view) => setActiveTab(view === 'browser' ? 'files' : view)}
        />

        {/* Center Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/60 dark:bg-slate-900/40 overflow-hidden">
          {activeTab === 'files' ? (
            <>
              {/* Toolbar */}
              <StorageToolbar
                currentPrefix={currentPrefix}
                onNavigatePrefix={handleSelectPrefix}
                viewMode={viewMode}
                onToggleViewMode={setViewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                typeFilter={typeFilter}
                onTypeFilterChange={setTypeFilter}
                dbFilter={dbFilter}
                onDbFilterChange={setDbFilter}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={(field, dir) => {
                  setSortField(field);
                  setSortDirection(dir);
                }}
                onUploadClick={() => setIsUploadModalOpen(true)}
                onCreateFolderClick={handleCreateFolder}
                onRefreshClick={() => loadObjects(currentPrefix)}
                selectedCount={selectedKeys.length}
                totalItemsCount={displayItems.length}
                onToggleSelectAll={handleSelectAll}
                onBulkDeleteClick={handleBulkDelete}
                onBulkDownloadClick={handleBulkDownload}
              />

              {/* Items Area */}
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <span className="text-xs">Loading storage objects...</span>
                  </div>
                ) : displayItems.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center gap-3">
                    <HardDrive className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300 text-xs">
                        This folder is empty
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Upload files or create sub-folders to start managing assets.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs"
                    >
                      Upload Files Here
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <StorageItemGrid
                    items={displayItems}
                    selectedKeys={selectedKeys}
                    onSelectKey={handleSelectKey}
                    onOpenFolder={handleSelectPrefix}
                    onOpenPreview={setPreviewItem}
                    onDelete={handleDeleteItem}
                    onDownload={(item) => window.open(item.publicUrl, '_blank')}
                    onCopyUrl={handleCopyUrl}
                    formatBytes={formatBytes}
                  />
                ) : (
                  <StorageItemList
                    items={displayItems}
                    selectedKeys={selectedKeys}
                    onSelectKey={handleSelectKey}
                    onSelectAll={handleSelectAll}
                    onOpenFolder={handleSelectPrefix}
                    onOpenPreview={setPreviewItem}
                    onDelete={handleDeleteItem}
                    onDownload={(item) => window.open(item.publicUrl, '_blank')}
                    onCopyUrl={handleCopyUrl}
                    formatBytes={formatBytes}
                  />
                )}
              </div>
            </>
          ) : activeTab === 'tools' ? (
            <div className="flex-1 overflow-y-auto p-6">
              <StorageToolsView formatBytes={formatBytes} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6">
              <StorageTrashView formatBytes={formatBytes} isSuperAdmin={isSuperAdmin} />
            </div>
          )}
        </div>

        {/* Right Preview Drawer (Active in Files view when an item is selected) */}
        {activeTab === 'files' && previewItem && (
          <StoragePreviewDrawer
            item={previewItem}
            onClose={() => setPreviewItem(null)}
            onDelete={handleDeleteItem}
            onRefresh={() => loadObjects(currentPrefix)}
            formatBytes={formatBytes}
          />
        )}
      </div>

      {/* Upload Modal */}
      <StorageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentPrefix={currentPrefix}
        onUploadComplete={() => {
          loadObjects(currentPrefix);
          loadBucketStats();
        }}
        formatBytes={formatBytes}
      />
    </div>
  );
};

