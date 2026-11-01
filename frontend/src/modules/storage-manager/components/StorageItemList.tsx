import React from 'react';
import {
  FileText,
  Folder,
  Image as ImageIcon,
  Box,
  FileCode,
  Download,
  Copy,
  Trash2,
  Database,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { IStorageItem } from '../types';

interface StorageItemListProps {
  items: IStorageItem[];
  selectedKeys: string[];
  onSelectKey: (key: string, isShift: boolean, isCtrl: boolean) => void;
  onSelectAll: () => void;
  onOpenFolder: (prefix: string) => void;
  onOpenPreview: (item: IStorageItem) => void;
  onDelete: (item: IStorageItem) => void;
  onDownload: (item: IStorageItem) => void;
  onCopyUrl: (item: IStorageItem) => void;
  formatBytes: (bytes: number) => string;
}

export const StorageItemList: React.FC<StorageItemListProps> = ({
  items,
  selectedKeys,
  onSelectKey,
  onSelectAll,
  onOpenFolder,
  onOpenPreview,
  onDelete,
  onDownload,
  onCopyUrl,
  formatBytes,
}) => {
  const getFileIcon = (item: IStorageItem) => {
    if (item.isFolder) {
      return <Folder className="w-4 h-4 text-amber-500 fill-amber-100 dark:fill-amber-950/40" />;
    }
    const ct = item.contentType.toLowerCase();
    const key = item.key.toLowerCase();
    if (ct.startsWith('image/') || /\.(webp|png|jpg|jpeg|gif|avif)$/.test(key)) {
      return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    }
    if (ct.includes('gltf') || key.endsWith('.glb') || key.endsWith('.gltf')) {
      return <Box className="w-4 h-4 text-purple-500" />;
    }
    if (ct.includes('json') || ct.includes('csv') || key.endsWith('.json') || key.endsWith('.csv')) {
      return <FileCode className="w-4 h-4 text-blue-500" />;
    }
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const allSelected = items.length > 0 && items.every((it) => selectedKeys.includes(it.key));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200 border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="p-3 w-10 text-center">
              <input
                type="checkbox"
                aria-label="Select all files in folder"
                checked={allSelected}
                onChange={onSelectAll}
                className="rounded text-emerald-600 focus:ring-emerald-500 dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
              />
            </th>
            <th className="p-3">Name</th>
            <th className="p-3 w-28">Type</th>
            <th className="p-3 w-24">Size</th>
            <th className="p-3 w-32">Database</th>
            <th className="p-3 w-36">Modified</th>
            <th className="p-3 w-28 text-right pr-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((item) => {
            const isSelected = selectedKeys.includes(item.key);
            return (
              <tr
                key={item.key}
                onClick={(e) => {
                  onSelectKey(item.key, e.shiftKey, e.ctrlKey || e.metaKey);
                }}
                onDoubleClick={() => {
                  if (item.isFolder) {
                    onOpenFolder(item.key);
                  } else {
                    onOpenPreview(item);
                  }
                }}
                className={`transition-colors cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.name}`}
                    checked={isSelected}
                    onChange={(e) => onSelectKey(item.key, false, true)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                </td>
                <td className="p-3 font-medium flex items-center gap-2">
                  <div className="shrink-0">{getFileIcon(item)}</div>
                  <span
                    className="truncate max-w-[280px] sm:max-w-md font-medium text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400"
                    title={item.name}
                  >
                    {item.name}
                  </span>
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                  {item.isFolder ? 'Folder' : item.contentType.split('/')[1] || item.contentType}
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.isFolder ? '—' : formatBytes(item.size)}
                </td>
                <td className="p-3">
                  {item.isFolder ? (
                    '—'
                  ) : item.dbUsageCount > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Database className="w-3 h-3" />
                      {item.dbUsageCount} link{item.dbUsageCount > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Unlinked</span>
                  )}
                </td>
                <td className="p-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.isFolder
                    ? '—'
                    : new Date(item.lastModified).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                </td>
                <td className="p-3 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                    {!item.isFolder && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenPreview(item)}
                          title="Preview & Details"
                          className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onCopyUrl(item)}
                          title="Copy Public URL"
                          className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDownload(item)}
                          title="Download"
                          className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      title={item.isFolder ? 'Delete folder' : 'Delete to trash'}
                      className="p-1 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

