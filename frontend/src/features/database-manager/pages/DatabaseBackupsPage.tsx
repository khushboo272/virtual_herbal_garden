import React, { useState, useEffect } from 'react';
import {
  Archive,
  Plus,
  RefreshCw,
  DownloadCloud,
  RotateCcw,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  HardDrive,
  FileCheck,
} from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type { DbBackupItem } from '../types';
import { ConfirmDangerDialog } from '../components/ConfirmDangerDialog';

export const DatabaseBackupsPage: React.FC = () => {
  const [backups, setBackups] = useState<DbBackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupNote, setBackupNote] = useState('');

  // Restore flow
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<DbBackupItem | null>(null);
  const [restoreDiff, setRestoreDiff] = useState<any | null>(null);
  const [checkingDiff, setCheckingDiff] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'overwrite_matching' | 'clean_wipe'>('overwrite_matching');
  const [showConfirmRestoreModal, setShowConfirmRestoreModal] = useState(false);

  // Delete flow
  const [backupToDelete, setBackupToDelete] = useState<DbBackupItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const list = await databaseApi.listBackups();
      setBackups(list);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load backups' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      setFeedback(null);
      await databaseApi.createBackup(backupNote || undefined);
      setBackupNote('');
      setFeedback({ type: 'success', text: 'Backup snapshot created and verified with SHA-256 checksum!' });
      fetchBackups();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Backup creation failed' });
    } finally {
      setCreating(false);
    }
  };

  const handleStartRestoreFlow = async (b: DbBackupItem) => {
    setSelectedBackupForRestore(b);
    setRestoreDiff(null);
    setCheckingDiff(true);
    try {
      const diff = await databaseApi.dryRunRestore(b._id || b.id);
      setRestoreDiff(diff);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to analyze backup restore diff' });
    } finally {
      setCheckingDiff(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!selectedBackupForRestore) return;
    try {
      setRestoring(true);
      setFeedback(null);
      await databaseApi.restoreBackup(selectedBackupForRestore._id || selectedBackupForRestore.id, restoreMode);
      setShowConfirmRestoreModal(false);
      setSelectedBackupForRestore(null);
      setFeedback({ type: 'success', text: 'Database successfully restored from backup snapshot!' });
      fetchBackups();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Restore failed' });
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteBackup = async () => {
    if (!backupToDelete) return;
    try {
      await databaseApi.deleteBackup(backupToDelete._id || backupToDelete.id);
      setBackupToDelete(null);
      setFeedback({ type: 'success', text: 'Backup deleted.' });
      fetchBackups();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete backup' });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Archive className="w-5 h-5 text-emerald-600" />
            <span>Disaster Recovery & Snapshots</span>
          </h1>
          <p className="text-xs text-gray-500">
            Automated and manual SHA-256 verified full database backups stored in Cloudflare R2 and local disk.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={backupNote}
            onChange={(e) => setBackupNote(e.target.value)}
            placeholder="Optional backup note..."
            className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={creating}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? 'Creating...' : 'Create Backup'}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200'
        }`}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Backups List */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Backup File</th>
              <th className="px-4 py-3 font-medium">Kind</th>
              <th className="px-4 py-3 font-medium">Size</th>
              <th className="px-4 py-3 font-medium">Checksum (SHA-256)</th>
              <th className="px-4 py-3 font-medium">Created At</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {backups.map((b) => (
              <tr key={b._id || b.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
                <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-gray-100">
                  <div>{b.filename}</div>
                  {b.note && <div className="text-[11px] text-gray-500 font-sans italic">{b.note}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    b.kind === 'manual' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}>
                    {b.kind}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">{formatBytes(b.size)}</td>
                <td className="px-4 py-3 font-mono text-gray-500 truncate max-w-xs">{b.checksum.slice(0, 16)}...</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {new Date(b.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => handleStartRestoreFlow(b)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackupToDelete(b)}
                    className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 p-1"
                    title="Delete Backup"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Restore Diff Inspection Modal */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                Restore Database from Backup
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="font-semibold">Automatic Pre-Restore Snapshot Included</div>
              <p>
                An automatic pre-restore safety snapshot will be created immediately before this restore begins so you can roll back if needed.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Restore Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border cursor-pointer text-xs ${
                  restoreMode === 'overwrite_matching' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 font-semibold' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="restoreMode"
                    value="overwrite_matching"
                    checked={restoreMode === 'overwrite_matching'}
                    onChange={() => setRestoreMode('overwrite_matching')}
                    className="hidden"
                  />
                  <div>Overwrite Matching</div>
                  <div className="text-[11px] text-gray-500 font-normal">Replaces matching docs; leaves non-conflicting docs intact</div>
                </label>
                <label className={`p-3 rounded-xl border cursor-pointer text-xs ${
                  restoreMode === 'clean_wipe' ? 'border-red-500 bg-red-50 dark:bg-red-950/20 font-semibold' : 'border-gray-200'
                }`}>
                  <input
                    type="radio"
                    name="restoreMode"
                    value="clean_wipe"
                    checked={restoreMode === 'clean_wipe'}
                    onChange={() => setRestoreMode('clean_wipe')}
                    className="hidden"
                  />
                  <div className="text-red-700 dark:text-red-300">Clean Wipe First</div>
                  <div className="text-[11px] text-gray-500 font-normal">Wipes all target collections and restores exact snapshot</div>
                </label>
              </div>
            </div>

            {checkingDiff ? (
              <div className="py-6 flex items-center justify-center space-x-2 text-xs text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Comparing backup snapshot with current database...</span>
              </div>
            ) : restoreDiff ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Snapshot Overview:</div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-mono space-y-1">
                  <div>Collections: {restoreDiff.collections?.join(', ')}</div>
                  <div>Docs in backup: {restoreDiff.totalDocsInBackup}</div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end space-x-2 pt-3 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                className="px-4 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmRestoreModal(true)}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm"
              >
                Proceed to Restore Confirmation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore typed confirm dialog */}
      <ConfirmDangerDialog
        isOpen={showConfirmRestoreModal}
        title="Confirm Database Restoration"
        message={`You are about to restore the database from ${selectedBackupForRestore?.filename}. This will modify live records across ${selectedBackupForRestore?.collections?.join(', ')}.`}
        confirmKeyword="RESTORE"
        onConfirm={handleExecuteRestore}
        onCancel={() => setShowConfirmRestoreModal(false)}
        isLoading={restoring}
      />

      {/* Delete confirm dialog */}
      <ConfirmDangerDialog
        isOpen={Boolean(backupToDelete)}
        title="Delete Backup Snapshot"
        message={`Delete backup file ${backupToDelete?.filename}? This cannot be undone.`}
        confirmKeyword="DELETE"
        onConfirm={handleDeleteBackup}
        onCancel={() => setBackupToDelete(null)}
      />
    </div>
  );
};

