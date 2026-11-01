import React from 'react';
import {
  Folder,
  FileText,
  FileImage,
  Box,
  FileCode,
  Link,
  MoreVertical,
  Download,
  Trash2,
  CheckCircle2,
  Database,
  Copy,
} from 'lucide-react';
import { IStorageItem, IStorageFolder } from '../types';

interface StorageItemGridProps {
  folders?: IStorageFolder[];
  items: IStorageItem[];
  selectedKeys?: Set<string> | string[];
  activePreviewKey?: string | null;
  onSelectFolder?: (prefix: string) => void;
  onOpenFolder?: (prefix: string) => void;
  onSelectItem?: (key: string, e: React.MouseEvent) => void;
  onSelectKey?: (key: string, isShift: boolean, isCtrl: boolean) => void;
  onOpenPreview: (item: IStorageItem) => void;
  onDeleteSingle?: (item: IStorageItem) => void;
  onDelete?: (item: IStorageItem) => void;
  onDownload?: (item: IStorageItem) => void;
  onCopyUrl?: (item: IStorageItem) => void;
  formatBytes?: (bytes: number) => string;
}

export const StorageItemGrid: React.FC<StorageItemGridProps> = ({
  folders = [],
  items = [],
  selectedKeys = [],
  activePreviewKey = null,
  onSelectFolder,
  onOpenFolder,
  onSelectItem,
  onSelectKey,
  onOpenPreview,
  onDeleteSingle,
  onDelete,
  onDownload,
  onCopyUrl,
  formatBytes: propFormatBytes,
}) => {
  const handleFolderClick = onOpenFolder || onSelectFolder || (() => {});
  const handleDelete = onDelete || onDeleteSingle || (() => {});

  const isKeySelected = (key: string) => {
    if (selectedKeys instanceof Set) return selectedKeys.has(key);
    if (Array.isArray(selectedKeys)) return selectedKeys.includes(key);
    return false;
  };

  const handleItemClick = (key: string, e: React.MouseEvent) => {
    if (onSelectKey) {
      onSelectKey(key, e.shiftKey, e.ctrlKey || e.metaKey);
    } else if (onSelectItem) {
      onSelectItem(key, e);
    }
  };

  const formatBytes = (bytes: number) => {
    if (propFormatBytes) return propFormatBytes(bytes);
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (item: IStorageItem) => {
    const ext = item.name.split('.').pop()?.toLowerCase();
    if (['glb', 'gltf'].includes(ext || '')) {
      return <Box className="w-8 h-8 text-purple-500" />;
    }
    if (['json', 'csv'].includes(ext || '')) {
      return <FileCode className="w-8 h-8 text-amber-500" />;
    }
    return <FileText className="w-8 h-8 text-blue-500" />;
  };

  const isImage = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext || '');
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 p-4">
      {/* Folder Cards */}
      {(folders || []).map((folder) => (
        <div
          key={folder.prefix}
          onDoubleClick={() => handleFolderClick(folder.prefix)}
          onClick={() => handleFolderClick(folder.prefix)}
          className="group relative flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition-all text-center select-none"
        >
          <Folder className="w-12 h-12 text-emerald-500/80 group-hover:text-emerald-600 transition-colors mb-2 fill-emerald-50 dark:fill-emerald-950/20" />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate w-full px-1">
            {folder.name}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">Directory</span>
        </div>
      ))}

      {/* File Cards */}
      {items.map((item) => {
        if (item.isFolder) {
          return (
            <div
              key={item.key}
              onDoubleClick={() => handleFolderClick(item.key)}
              onClick={() => handleFolderClick(item.key)}
              className="group relative flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 hover:shadow-md cursor-pointer transition-all text-center select-none"
            >
              <Folder className="w-12 h-12 text-emerald-500/80 group-hover:text-emerald-600 transition-colors mb-2 fill-emerald-50 dark:fill-emerald-950/20" />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate w-full px-1">
                {item.name}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">Directory</span>
            </div>
          );
        }

        const isSelected = isKeySelected(item.key);
        const isActivePreview = activePreviewKey === item.key;
        const imgFile = isImage(item.name);

        return (
          <div
            key={item.key}
            onClick={(e) => handleItemClick(item.key, e)}
            onDoubleClick={() => onOpenPreview(item)}
            className={`group relative flex flex-col rounded-2xl bg-white dark:bg-gray-850 border transition-all cursor-pointer select-none overflow-hidden ${
              isSelected
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                : isActivePreview
                ? 'border-purple-500 shadow-sm'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm'
            }`}
          >
            {/* Thumbnail / Icon area */}
            <div className="relative aspect-4/3 w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden border-b border-gray-100 dark:border-gray-800">
              {imgFile ? (
                <img
                  src={item.publicUrl}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="group-hover:scale-110 transition-transform duration-300">
                  {getFileIcon(item)}
                </div>
              )}

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-2 left-2 bg-emerald-600 text-white rounded-full p-0.5 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              )}

              {/* DB Usage badge */}
              {item.dbUsageCount > 0 ? (
                <div
                  title={`Used by ${item.dbUsageCount} database document(s)`}
                  className="absolute bottom-1.5 left-1.5 flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xs text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs"
                >
                  <Database className="w-2.5 h-2.5" />
                  <span>{item.dbUsageCount} DB link{item.dbUsageCount > 1 ? 's' : ''}</span>
                </div>
              ) : (
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-xs text-[9px] text-gray-400 shadow-2xs">
                  Unlinked
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="p-3">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate block" title={item.name}>
                {item.name}
              </span>
              <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                <span>{formatBytes(item.size)}</span>
                <span>{new Date(item.lastModified).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Hover Action Bar */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-white/90 dark:bg-gray-850/90 backdrop-blur-xs rounded-xl p-1 shadow-sm">
              {onCopyUrl && (
                <button
                  type="button"
                  title="Copy URL"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyUrl(item);
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}
              {onDownload && (
                <button
                  type="button"
                  title="Download file"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(item);
                  }}
                  className="p-1 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                title="Delete to trash"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                className="p-1 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
