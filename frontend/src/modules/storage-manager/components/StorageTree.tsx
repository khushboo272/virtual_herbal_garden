import React from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Box,
  HeartPulse,
  Compass,
  User,
  Trash2,
  Archive,
  RefreshCw,
  HardDrive,
} from 'lucide-react';
import { IStorageFolder, IBucketStats } from '../types';

interface StorageTreeProps {
  currentPrefix: string;
  folders?: IStorageFolder[];
  bucketStats?: IBucketStats | null;
  isLoadingStats?: boolean;
  isSuperAdmin?: boolean;
  onSelectPrefix: (prefix: string) => void;
  onRescanStats?: () => void;
  activeView?: 'browser' | 'tools' | 'trash';
  onChangeView?: (view: 'browser' | 'tools' | 'trash') => void;
  stats?: IBucketStats | null;
  onRefreshStats?: () => void;
  formatBytes?: (bytes: number) => string;
}

export const StorageTree: React.FC<StorageTreeProps> = ({
  currentPrefix,
  folders = [],
  bucketStats,
  isLoadingStats = false,
  isSuperAdmin = false,
  onSelectPrefix,
  onRescanStats,
  activeView = 'browser',
  onChangeView = () => {},
  stats,
  onRefreshStats,
  formatBytes: propFormatBytes,
}) => {
  const effectiveStats = bucketStats || stats || null;
  const effectiveRescan = onRescanStats || onRefreshStats || (() => {});
  const [expandedFolders, setExpandedFolders] = React.useState<Record<string, boolean>>({
    'plants/': true,
    'models/': true,
  });

  const toggleFolder = (prefix: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [prefix]: !prev[prefix] }));
  };

  const quickLinks = [
    { label: 'Plants', prefix: 'plants/', icon: Sparkles, color: 'text-emerald-500' },
    { label: '3D Models', prefix: 'models/', icon: Box, color: 'text-purple-500' },
    { label: 'Remedies', prefix: 'remedies/', icon: HeartPulse, color: 'text-rose-500' },
    { label: 'Virtual Tours', prefix: 'tours/', icon: Compass, color: 'text-blue-500' },
    { label: 'Avatars', prefix: 'avatars/', icon: User, color: 'text-amber-500' },
  ];

  if (isSuperAdmin) {
    quickLinks.push({
      label: 'Backups',
      prefix: 'backups/',
      icon: Archive,
      color: 'text-orange-500',
    });
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const totalUsed = effectiveStats?.totalBytes || 0;
  const limitBytes = effectiveStats?.freeTierLimitBytes || 10 * 1024 * 1024 * 1024;
  const usedPercent = Math.min(100, Math.round((totalUsed / limitBytes) * 100));

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-850 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-y-auto">
      {/* Bucket Usage Meter */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>R2 Free Tier (10 GB)</span>
          </div>
          <button
            onClick={effectiveRescan}
            disabled={isLoadingStats}
            title="Rescan bucket"
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStats ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-gray-800 dark:text-gray-200">{formatBytes(totalUsed)}</span>
            <span className="text-gray-500">of {formatBytes(limitBytes)} (10GB)</span>
          </div>

          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                usedPercent > 80 ? 'bg-rose-500' : usedPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(usedPercent, 2)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 pt-0.5">
            <span>{effectiveStats?.totalObjects || 0} objects</span>
            <span>{usedPercent}% used</span>
          </div>
        </div>
      </div>

      {/* Navigation Views */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800 space-y-1">
        <button
          onClick={() => onChangeView('browser')}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeView === 'browser'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Folder className="w-4 h-4 text-emerald-600" />
          <span>File Explorer</span>
        </button>

        <button
          onClick={() => onChangeView('tools')}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeView === 'tools'
              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Storage Tools</span>
        </button>

        <button
          onClick={() => onChangeView('trash')}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
            activeView === 'trash'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-semibold'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Trash Safety Net</span>
        </button>
      </div>

      {/* Quick Links */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-2">
          Quick Links
        </div>
        <div className="space-y-0.5">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            const isSelected = activeView === 'browser' && currentPrefix.startsWith(item.prefix);
            return (
              <button
                key={item.prefix}
                onClick={() => {
                  onChangeView('browser');
                  onSelectPrefix(item.prefix);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isSelected
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Folder Tree */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 mb-2">
          Current Directory Subfolders
        </div>

        {(folders || []).length === 0 ? (
          <div className="px-3 py-2 text-xs text-gray-400 italic">No subdirectories</div>
        ) : (
          <div className="space-y-0.5">
            {(folders || []).map((f) => {
              const isSelected = currentPrefix === f.prefix;
              const isExpanded = expandedFolders[f.prefix];

              return (
                <div key={f.prefix}>
                  <div
                    onClick={() => onSelectPrefix(f.prefix)}
                    className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <button
                      onClick={(e) => toggleFolder(f.prefix, e)}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                    {isSelected ? (
                      <FolderOpen className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{f.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

