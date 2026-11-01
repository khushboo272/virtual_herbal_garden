import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Box,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon,
  Folder,
  ArrowRight,
  Loader2,
  Sliders,
} from 'lucide-react';
import { storageApi } from '../api/storageApi';
import { toast } from 'sonner';

interface StorageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrefix: string;
  onUploadComplete: () => void;
  formatBytes: (bytes: number) => string;
}

interface UploadQueueItem {
  id: string;
  file: File;
  targetKey: string;
  originalSize: number;
  optimizedSize?: number;
  progress: number;
  status: 'pending' | 'converting' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

export const StorageUploadModal: React.FC<StorageUploadModalProps> = ({
  isOpen,
  onClose,
  currentPrefix,
  onUploadComplete,
  formatBytes,
}) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [destinationFolder, setDestinationFolder] = useState<string>(currentPrefix);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Client-side image optimisation toggles
  const [autoOptimizeImages, setAutoOptimizeImages] = useState(true);
  const [maxDimension, setMaxDimension] = useState(1600);

  // Smart Naming Mode
  const [useSmartNaming, setUseSmartNaming] = useState(false);
  const [smartAssetType, setSmartAssetType] = useState<
    | 'plant_image'
    | 'plant_hero'
    | 'plant_gallery'
    | 'plant_model'
    | 'plant_glb'
    | 'plant_lod'
    | 'remedy_image'
    | 'remedy_cover'
    | 'tour_image'
    | 'tour_cover'
    | 'tour_audio'
    | 'avatar'
  >('plant_image');
  const [smartSlug, setSmartSlug] = useState('');
  const [linkToDatabase, setLinkToDatabase] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Convert image to WebP client-side using Canvas & strip EXIF GPS
  const optimizeImageClientSide = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              URL.revokeObjectURL(objectUrl);
              resolve(blob || file);
            },
            'image/webp',
            0.88
          );
        } else {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      img.src = objectUrl;
    });
  };

  const computeSmartKey = (fileName: string): string => {
    const slug = smartSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'unnamed';
    switch (smartAssetType) {
      case 'plant_image':
      case 'plant_hero':
        return `plants/images/${slug}.webp`;
      case 'plant_gallery':
        return `plants/images/${slug}-gallery.webp`;
      case 'plant_model':
      case 'plant_glb':
        return `plants/models/${slug}.glb`;
      case 'plant_lod':
        return `plants/models/${slug}-lod.glb`;
      case 'remedy_image':
      case 'remedy_cover':
        return `remedies/images/${slug}.webp`;
      case 'tour_image':
      case 'tour_cover':
        return `tours/images/${slug}.webp`;
      case 'tour_audio':
        return `tours/audios/${slug}.mp3`;
      case 'avatar':
        return `avatars/${slug}.webp`;
      default:
        return `${destinationFolder}${fileName}`;
    }
  };

  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: UploadQueueItem[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach((file) => {
      let targetKey = `${destinationFolder}${file.name}`;
      if (useSmartNaming && smartSlug.trim()) {
        targetKey = computeSmartKey(file.name);
      }
      newItems.push({
        id: crypto.randomUUID(),
        file,
        targetKey,
        originalSize: file.size,
        progress: 0,
        status: 'pending',
      });
    });

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
    e.target.value = '';
  };

  const startUpload = async () => {
    setIsProcessing(true);
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status === 'completed') continue;

      try {
        let uploadBlob: Blob = item.file;
        let finalContentType = item.file.type || 'application/octet-stream';
        let key = item.targetKey;

        // Auto convert image to WebP if enabled
        if (autoOptimizeImages && item.file.type.startsWith('image/')) {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'converting', progress: 20 } : q))
          );
          uploadBlob = await optimizeImageClientSide(item.file);
          finalContentType = 'image/webp';
          if (!key.endsWith('.webp')) {
            key = key.replace(/\.[^/.]+$/, '') + '.webp';
          }
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  targetKey: key,
                  optimizedSize: uploadBlob.size,
                  status: 'uploading',
                  progress: 40,
                }
              : q
          )
        );

        // 1. Get presigned upload URL from backend
        const presignRes = await storageApi.presignUpload(key, finalContentType, uploadBlob.size);

        // 2. Direct browser upload to Cloudflare R2 presigned URL
        const uploadRes = await fetch(presignRes.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': finalContentType,
          },
          body: uploadBlob,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed with status ${uploadRes.status}`);
        }

        // Set Cache-Control on server
        await storageApi.updateMetadata(key, {
          cacheControl: 'public, max-age=31536000, immutable',
        }).catch(() => null);

        // Map stable link to MongoDB document
        if (useSmartNaming && linkToDatabase && smartSlug.trim()) {
          try {
            await storageApi.mapToDb(key, smartSlug.trim(), smartAssetType);
            toast.success(`Mapped to database with stable link`);
          } catch (mapErr: any) {
            console.warn('Could not auto-map to database:', mapErr);
          }
        }

        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q))
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', errorMessage: err?.message || 'Upload failed' }
              : q
          )
        );
      }
    }
    setIsProcessing(false);
    toast.success('File queue processing finished');
    onUploadComplete();
  };

  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((it) => it.id !== id));
  };

  const allCompleted = queue.length > 0 && queue.every((it) => it.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Upload to Storage (R2)</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:px-6 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Smart Naming / Conventional Mode Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" /> Smart Botanical Naming
              </span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Auto-generate clean keys matching the database schema (`plants/slug/hero.webp`, `models/slug.glb`...)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                aria-label="Toggle smart botanical naming"
                checked={useSmartNaming}
                onChange={(e) => setUseSmartNaming(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Smart Naming Form */}
          {useSmartNaming ? (
            <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="smart-slot-select" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Asset Slot
                  </label>
                  <select
                    id="smart-slot-select"
                    value={smartAssetType}
                    onChange={(e) => setSmartAssetType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-medium"
                  >
                    <option value="plant_image">Plant Photo (plants/images/slug.webp)</option>
                    <option value="plant_model">Plant 3D GLB Model (plants/models/slug.glb)</option>
                    <option value="plant_lod">Plant LOD Model (plants/models/slug-lod.glb)</option>
                    <option value="plant_gallery">Plant Gallery Photo (plants/images/slug-gallery.webp)</option>
                    <option value="remedy_image">Remedy Photo (remedies/images/slug.webp)</option>
                    <option value="tour_image">Tour Cover (tours/images/slug.webp)</option>
                    <option value="tour_audio">Tour Audio (tours/audios/slug.mp3)</option>
                    <option value="avatar">User Avatar (avatars/username.webp)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="target-slug-input" className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Slug (e.g. tulsi, neem, gotu-kola)
                  </label>
                  <input
                    id="target-slug-input"
                    type="text"
                    placeholder="e.g. gotu-kola"
                    value={smartSlug}
                    onChange={(e) => setSmartSlug(e.target.value)}
                    className="w-full p-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
              </div>
              {smartSlug.trim() && (
                <div className="text-[11px] font-mono text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-900 p-2 rounded-lg border border-purple-100 dark:border-purple-900">
                  Target Key: <span className="font-bold">{computeSmartKey('example.ext')}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <label htmlFor="dest-folder-input" className="block font-medium text-slate-700 dark:text-slate-300">
                Destination Prefix / Folder
              </label>
              <div className="flex items-center gap-1.5 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <Folder className="w-4 h-4 text-amber-500" />
                <input
                  id="dest-folder-input"
                  type="text"
                  aria-label="Destination Folder"
                  value={destinationFolder}
                  onChange={(e) => setDestinationFolder(e.target.value)}
                  className="w-full bg-transparent font-mono text-xs focus:outline-hidden"
                  placeholder="e.g. plants/gotu-kola/"
                />
              </div>
            </div>
          )}

          {/* Client-side WebP Optimisation Options */}
          <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
            <div>
              <span className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" /> Client-Side Image Optimisation (WebP)
              </span>
              <p className="text-emerald-700/80 dark:text-emerald-300/80 text-[11px] mt-0.5">
                Converts JPG/PNG to WebP, resizes to max {maxDimension}px, and strips EXIF GPS metadata before upload.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                aria-label="Auto-optimize images to WebP"
                checked={autoOptimizeImages}
                onChange={(e) => setAutoOptimizeImages(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-800/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              aria-label="Upload files input"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-medium text-slate-700 dark:text-slate-200">
              Drag & Drop files or click to browse
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Images (JPG, PNG, WebP), 3D Models (GLB), JSON, CSV, PDF up to 25 MB
            </p>
          </div>

          {/* Upload Queue List */}
          {queue.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Upload Queue ({queue.length})
                </span>
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  disabled={isProcessing}
                  className="text-rose-600 hover:text-rose-700 text-[11px]"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-900">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[340px]">
                      {item.file.name.endsWith('.glb') ? (
                        <Box className="w-4 h-4 text-purple-500 shrink-0" />
                      ) : item.file.type.startsWith('image/') ? (
                        <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-medium text-slate-700 dark:text-slate-200 block truncate" title={item.file.name}>
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate" title={item.targetKey}>
                          → {item.targetKey}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400">
                        {item.optimizedSize
                          ? `${formatBytes(item.optimizedSize)} (was ${formatBytes(item.originalSize)})`
                          : formatBytes(item.originalSize)}
                      </span>

                      {item.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {item.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}
                      {item.status === 'error' && (
                        <span className="text-rose-600 font-medium" title={item.errorMessage}>
                          Error
                        </span>
                      )}
                      {item.status === 'pending' && !isProcessing && (
                        <button
                          type="button"
                          onClick={() => removeQueueItem(item.id)}
                          aria-label={`Remove ${item.file.name} from queue`}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100 text-xs"
          >
            {allCompleted ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={startUpload}
            disabled={queue.length === 0 || isProcessing || allCompleted}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing Uploads...
              </>
            ) : allCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> All Uploaded
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" /> Start Upload ({queue.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

