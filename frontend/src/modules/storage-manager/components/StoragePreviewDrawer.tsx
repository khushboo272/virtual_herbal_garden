import React, { useState } from 'react';
import {
  X,
  Copy,
  ExternalLink,
  Download,
  Trash2,
  Database,
  Calendar,
  HardDrive,
  Key,
  ShieldCheck,
  RefreshCw,
  Box,
  FileText,
  Clock,
  Check,
  ArrowRight,
} from 'lucide-react';
import { IStorageItem } from '../types';
import { storageApi } from '../api/storageApi';
import { toast } from 'sonner';

interface StoragePreviewDrawerProps {
  item: IStorageItem | null;
  onClose: () => void;
  onDelete: (item: IStorageItem) => void;
  onRefresh: () => void;
  formatBytes: (bytes: number) => string;
}

export const StoragePreviewDrawer: React.FC<StoragePreviewDrawerProps> = ({
  item,
  onClose,
  onDelete,
  onRefresh,
  formatBytes,
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [generatingSignedUrl, setGeneratingSignedUrl] = useState(false);
  const [signedTtl, setSignedTtl] = useState(3600);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Metadata edit modal
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [cacheControlPreset, setCacheControlPreset] = useState('public, max-age=31536000, immutable');
  const [savingMetadata, setSavingMetadata] = useState(false);

  if (!item) return null;

  const isImage =
    item.contentType.startsWith('image/') ||
    /\.(webp|png|jpg|jpeg|gif|avif)$/i.test(item.key);
  const isGlb =
    item.contentType.includes('gltf') || item.key.toLowerCase().endsWith('.glb');
  const isJson =
    item.contentType.includes('json') || item.key.toLowerCase().endsWith('.json');
  const isPdf =
    item.contentType.includes('pdf') || item.key.toLowerCase().endsWith('.pdf');

  const handleCopyKey = () => {
    navigator.clipboard.writeText(item.key);
    setCopiedKey(true);
    toast.success('R2 key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyPublicUrl = () => {
    navigator.clipboard.writeText(item.publicUrl);
    setCopiedUrl(true);
    toast.success('Public URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleGenerateSignedUrl = async () => {
    try {
      setGeneratingSignedUrl(true);
      const res = await storageApi.presignDownload(item.key, signedTtl);
      setSignedUrl(res.url);
      toast.success(`Signed URL generated (valid for ${signedTtl / 60} minutes)`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate signed URL');
    } finally {
      setGeneratingSignedUrl(false);
    }
  };

  const handleSaveMetadata = async () => {
    try {
      setSavingMetadata(true);
      await storageApi.updateMetadata(item.key, {
        cacheControl: cacheControlPreset,
      });
      toast.success('Cache-Control headers updated');
      setIsEditingMetadata(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update metadata');
    } finally {
      setSavingMetadata(false);
    }
  };

  return (
    <aside
      aria-label="File Preview and Details"
      className="w-80 sm:w-96 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 h-full overflow-hidden shadow-lg z-20"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate pr-2">
          {item.name}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close file preview drawer"
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-slate-600 dark:text-slate-300">
        {/* Visual Preview */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-2 flex items-center justify-center min-h-[180px] overflow-hidden relative">
          {isImage ? (
            <img
              src={item.publicUrl}
              alt={item.name}
              className="max-h-56 max-w-full object-contain rounded-lg shadow-2xs"
              loading="lazy"
            />
          ) : isGlb ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Box className="w-12 h-12 text-purple-500 animate-pulse mb-2" />
              <span className="font-semibold text-purple-700 dark:text-purple-300">3D GLB Asset</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Binary glTF Model</span>
              <a
                href={item.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 font-medium hover:bg-purple-200"
              >
                Inspect in 3D Tab <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
              <FileText className="w-10 h-10 mb-2 text-slate-300 dark:text-slate-600" />
              <span className="font-medium text-slate-700 dark:text-slate-200">{item.contentType}</span>
              <span className="text-[10px]">{formatBytes(item.size)}</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleCopyPublicUrl}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Public URL
          </button>
          <a
            href={item.publicUrl}
            target="_blank"
            rel="noreferrer"
            download={item.name}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </a>
        </div>

        {/* Technical Attributes */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">
            File Details
          </h4>
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 space-y-2 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-start">
              <span className="text-slate-400">R2 Key</span>
              <div className="flex items-center gap-1 max-w-[200px]">
                <code className="truncate font-mono text-[11px] text-slate-700 dark:text-slate-200" title={item.key}>
                  {item.key}
                </code>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  aria-label="Copy R2 key to clipboard"
                  className="text-slate-400 hover:text-emerald-600"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">File Size</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{formatBytes(item.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Content Type</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{item.contentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Last Modified</span>
              <span className="text-slate-700 dark:text-slate-200">
                {new Date(item.lastModified).toLocaleString()}
              </span>
            </div>
            {item.etag && (
              <div className="flex justify-between">
                <span className="text-slate-400">ETag</span>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[170px]" title={item.etag}>
                  {item.etag}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Database Usage References */}
        <div className="space-y-2">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" /> Database References
          </h4>
          {item.dbUsageCount > 0 && item.dbReferences && item.dbReferences.length > 0 ? (
            <div className="space-y-1.5">
              {item.dbReferences.map((ref, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-emerald-900 dark:text-emerald-200 capitalize">
                      {ref.collection.replace(/s$/, '')}:
                    </span>{' '}
                    <span className="text-slate-700 dark:text-slate-300">{ref.name}</span>
                    <div className="text-[10px] text-slate-400">field: {ref.field}</div>
                  </div>
                  <a
                    href={`/dashboard/content/${ref.collection}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    title="Open in Content Manager"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
              No active MongoDB documents reference this URL. (Unlinked asset)
            </p>
          )}
        </div>

        {/* Signed URL Generator */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Temporary Signed URL
          </h4>
          <div className="flex gap-2 items-center">
            <select
              aria-label="Temporary signed URL duration"
              value={signedTtl}
              onChange={(e) => setSignedTtl(Number(e.target.value))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200"
            >
              <option value={900}>15 Minutes</option>
              <option value={3600}>1 Hour</option>
              <option value={21600}>6 Hours</option>
              <option value={86400}>24 Hours</option>
              <option value={604800}>7 Days</option>
            </select>
            <button
              type="button"
              onClick={handleGenerateSignedUrl}
              disabled={generatingSignedUrl}
              className="flex-1 py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              {generatingSignedUrl ? 'Signing...' : 'Generate URL'}
            </button>
          </div>
          {signedUrl && (
            <div className="mt-2 p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-1">
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">Valid Signed URL:</span>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  readOnly
                  aria-label="Generated signed URL"
                  value={signedUrl}
                  className="w-full bg-white dark:bg-slate-900 text-[10px] p-1 rounded border border-blue-200 dark:border-blue-800 font-mono"
                />
                <button
                  type="button"
                  aria-label="Copy generated signed URL to clipboard"
                  onClick={() => {
                    navigator.clipboard.writeText(signedUrl);
                    toast.success('Signed URL copied');
                  }}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cache Control & Metadata */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px]">
              Cache Headers
            </h4>
            <button
              type="button"
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
              className="text-emerald-600 hover:text-emerald-700 font-medium text-[11px]"
            >
              {isEditingMetadata ? 'Cancel' : 'Edit Presets'}
            </button>
          </div>

          {isEditingMetadata ? (
            <div className="space-y-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
              <label htmlFor="cache-control-select" className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Cache-Control Preset
              </label>
              <select
                id="cache-control-select"
                value={cacheControlPreset}
                onChange={(e) => setCacheControlPreset(e.target.value)}
                className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="public, max-age=31536000, immutable">1 Year Immutable (Versioned Asset)</option>
                <option value="public, max-age=3600, must-revalidate">1 Hour (Mutable Hero/Cover)</option>
                <option value="no-cache, no-store, must-revalidate">No Cache (Private / Dynamic)</option>
              </select>
              <button
                type="button"
                onClick={handleSaveMetadata}
                disabled={savingMetadata}
                className="w-full py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
              >
                {savingMetadata ? 'Updating...' : 'Save Cache Headers'}
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
              public, max-age=31536000, immutable
            </div>
          )}
        </div>

        {/* Delete to Trash Action */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="w-full py-2 px-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Move to Trash (Soft Delete)
          </button>
          {item.dbUsageCount > 0 && (
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 text-center mt-1">
              ⚠️ Warning: this asset is currently referenced by {item.dbUsageCount} database entry.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};

