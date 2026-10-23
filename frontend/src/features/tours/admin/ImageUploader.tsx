import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

export interface ImageUploaderProps {
  label: string;
  currentImageUrl?: string | null;
  helperText?: string;
  aspectRatio?: 'video' | 'square' | 'wide';
  maxSizeBytes?: number;
  disabled?: boolean;
  onUpload: (file: File) => Promise<string | void>;
  onRemove?: () => Promise<void> | void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({
  label,
  currentImageUrl,
  helperText = 'Accepted formats: JPEG, PNG, WebP (max 5 MB)',
  aspectRatio = 'video',
  maxSizeBytes = 5 * 1024 * 1024,
  disabled = false,
  onUpload,
  onRemove,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayUrl = previewUrl || currentImageUrl;

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square max-w-xs'
      : aspectRatio === 'wide'
      ? 'aspect-[21/9]'
      : 'aspect-video';

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Unsupported format. Please select a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > maxSizeBytes) {
      setErrorMessage(`File exceeds ${Math.round(maxSizeBytes / (1024 * 1024))} MB limit.`);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      await onUpload(file);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload image. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = async () => {
    setErrorMessage(null);
    setPreviewUrl(null);
    if (onRemove) {
      try {
        await onRemove();
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to remove image.');
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700 tracking-wide uppercase">
          {label}
        </label>
        {displayUrl && !disabled && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Remove Image
          </button>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && !disabled && fileInputRef.current?.click()}
        className={`relative w-full ${aspectClass} rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer ${
          isDragging
            ? 'border-green-600 bg-green-50/80 shadow-md scale-[1.01]'
            : displayUrl
            ? 'border-gray-200 bg-gray-900 group hover:border-green-400'
            : 'border-gray-300 bg-gray-50/60 hover:bg-green-50/40 hover:border-green-500'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled || isUploading}
          onChange={onFileInputChange}
        />

        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt={label}
              className="w-full h-full object-cover"
              onError={() => {
                // If remote fails, fallback
              }}
            />
            {/* Hover overlay with action */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4">
              <Upload className="w-6 h-6" />
              <span className="text-xs font-semibold">Click or drop to replace image</span>
            </div>
          </>
        ) : (
          <div className="p-6 text-center flex flex-col items-center justify-center gap-2 text-gray-500">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-green-600 group-hover:scale-105 transition-all">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-gray-700">
              <span className="text-green-700 hover:underline">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500 max-w-xs">{helperText}</p>
          </div>
        )}

        {/* Uploading loading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-10">
            <Loader2 className="w-7 h-7 text-green-700 animate-spin" />
            <span className="text-xs font-medium text-gray-700">Uploading & optimizing to R2...</span>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
