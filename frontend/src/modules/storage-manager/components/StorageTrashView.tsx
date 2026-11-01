import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Clock,
  Database,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { IStorageTrashItem } from '../types';
import { storageApi } from '../api/storageApi';
import { toast } from 'sonner';

interface StorageTrashViewProps {
  formatBytes: (bytes: number) => string;
  isSuperAdmin: boolean;
}

export const StorageTrashView: React.FC<StorageTrashViewProps> = ({ formatBytes, isSuperAdmin }) => {
  const [trashItems, setTrashItems] = useState<IStorageTrashItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);

  const loadTrash = async () => {
    try {
      setLoading(true);
      const res = await storageApi.listTrash();
      setTrashItems(res.items || []);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load trash items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrash();
  }, []);

  const handleRestore = async (item: IStorageTrashItem) => {
    try {
      setRestoringId(item._id);
      await storageApi.restoreTrash(item._id);
      toast.success(`Restored "${item.originalKey}" successfully`);
      loadTrash();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to restore item');
    } finally {
      setRestoringId(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!window.confirm('Are you sure you want to permanently empty the trash? All items will be permanently erased.')) {
      return;
    }
    try {
      setEmptying(true);
      const res = await storageApi.emptyTrash();
      toast.success(`Trash emptied (${res.deletedCount} items permanently deleted)`);
      loadTrash();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to empty trash');
    } finally {
      setEmptying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Informational banner */}
      <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">R2 Storage Safety Net (Trash Retention)</span>
            <p className="text-amber-800/80 dark:text-amber-300/80 mt-0.5 leading-relaxed">
              Cloudflare R2 has no native bucket versioning. Deleted and overwritten files are quarantined to
              <code className="mx-1 font-mono font-bold">trash/&lt;YYYYMMDD&gt;/...</code> for 30 days before automatic purge.
            </p>
          </div>
        </div>

        {isSuperAdmin && trashItems.length > 0 && (
          <button
            type="button"
            onClick={handleEmptyTrash}
            disabled={emptying}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 shadow-xs shrink-0 text-xs disabled:opacity-50"
          >
            {emptying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Empty Trash
          </button>
        )}
      </div>

      {/* Trash list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Items in Trash ({trashItems.length})
          </span>
          <button
            type="button"
            onClick={loadTrash}
            disabled={loading}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
            title="Refresh Trash"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {trashItems.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {trashItems.map((item) => (
              <div key={item._id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <div className="space-y-1 truncate max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.originalKey}
                    </span>
                    {item.isReplacedOverwrite && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-semibold">
                        Previous Overwrite
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Size: {formatBytes(item.size)}</span>
                    <span>Deleted: {new Date(item.deletedAt).toLocaleString()}</span>
                  </div>
                  {item.dbRefsSnapshot && item.dbRefsSnapshot.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                      <Database className="w-3 h-3" /> Was referenced by {item.dbRefsSnapshot.length} DB entry
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestore(item)}
                    disabled={restoringId === item._id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium hover:bg-emerald-100 transition-colors"
                  >
                    {restoringId === item._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 italic">
            Trash is empty. Soft-deleted files will appear here for 30 days before auto-purge.
          </div>
        )}
      </div>
    </div>
  );
};

