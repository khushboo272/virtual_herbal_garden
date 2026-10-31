import React, { useState, useEffect } from 'react';
import {
  History,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type { DbJobItem } from '../types';
import { ConfirmDangerDialog } from '../components/ConfirmDangerDialog';

export const DatabaseHistoryPage: React.FC = () => {
  const [jobs, setJobs] = useState<DbJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  // Undo batch state
  const [jobToUndo, setJobToUndo] = useState<DbJobItem | null>(null);
  const [undoing, setUndoing] = useState(false);

  // Error inspection modal
  const [inspectJob, setInspectJob] = useState<DbJobItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await databaseApi.getJobs(page, 20);
      setJobs(res.jobs);
      setTotalPages(res.totalPages);
      setTotalJobs(res.total);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load job history' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page]);

  const handleExecuteUndo = async () => {
    if (!jobToUndo) return;
    try {
      setUndoing(true);
      setFeedback(null);
      const res = await databaseApi.undoBatch(jobToUndo._id);
      setJobToUndo(null);
      setFeedback({
        type: 'success',
        text: `Batch undone successfully! Removed ${res.undoneInserted} inserted records and restored ${res.restoredUpdated} documents.`,
      });
      fetchJobs();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to undo batch' });
    } finally {
      setUndoing(false);
    }
  };

  const getStatusBadge = (status: string, isUndone: boolean) => {
    if (isUndone) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
          <RotateCcw className="w-3 h-3" />
          <span>UNDONE</span>
        </span>
      );
    }
    switch (status) {
      case 'done':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>DONE</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>RUNNING</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            <Clock className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <History className="w-5 h-5 text-emerald-600" />
            <span>Batch Job History & Rollback</span>
          </h1>
          <p className="text-xs text-gray-500">
            Audit record of all import, export, backup, restore, and maintenance background tasks ({totalJobs} total).
          </p>
        </div>

        <button
          type="button"
          onClick={fetchJobs}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200'
        }`}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Jobs Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Job Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Batch ID</th>
              <th className="px-4 py-3 font-medium">Counts</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {jobs.map((j) => (
              <tr key={j._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
                <td className="px-4 py-3 font-semibold uppercase text-gray-800 dark:text-gray-200">
                  {j.type} {j.collectionName && <span className="text-[11px] font-mono text-gray-400">({j.collectionName})</span>}
                </td>
                <td className="px-4 py-3">{getStatusBadge(j.status, j.isUndone)}</td>
                <td className="px-4 py-3 font-mono text-gray-500 truncate max-w-xs">{j.batchId}</td>
                <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                  {j.counts ? (
                    <span className="space-x-1.5">
                      <span className="text-emerald-600">+{j.counts.inserted}</span>
                      <span className="text-blue-600">~{j.counts.updated}</span>
                      <span>skip:{j.counts.skipped}</span>
                      {j.counts.errors > 0 && <span className="text-red-600 font-bold">err:{j.counts.errors}</span>}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {new Date(j.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                  {j.errors && j.errors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInspectJob(j)}
                      className="inline-flex items-center space-x-1 text-red-600 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{j.errors.length} Errors</span>
                    </button>
                  )}
                  {j.type === 'import' && j.status === 'done' && !j.isUndone && (
                    <button
                      type="button"
                      onClick={() => setJobToUndo(j)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo Batch</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
        <div>Page {page} of {totalPages}</div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="p-1 rounded-lg border dark:border-gray-700 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="p-1 rounded-lg border dark:border-gray-700 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Undo Confirmation Modal */}
      <ConfirmDangerDialog
        isOpen={Boolean(jobToUndo)}
        title="Undo Import Batch"
        message={`Undoing this batch (${jobToUndo?.batchId}) will delete the ${jobToUndo?.counts?.inserted || 0} inserted documents and restore pre-images for updated records.`}
        confirmKeyword="UNDO"
        onConfirm={handleExecuteUndo}
        onCancel={() => setJobToUndo(null)}
        isLoading={undoing}
      />

      {/* Errors Modal */}
      {inspectJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                Job Errors ({inspectJob.batchId})
              </h3>
              <button
                type="button"
                onClick={() => setInspectJob(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {inspectJob.errors.map((e, idx) => (
                <div key={idx} className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl text-xs font-mono text-red-800 dark:text-red-300">
                  <div>{e.row ? `Row #${e.row}` : ''} {e.collectionName ? `[${e.collectionName}]` : ''} {e.slug ? `(${e.slug})` : ''}</div>
                  <div className="mt-1 font-sans">{e.message}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setInspectJob(null)}
                className="px-4 py-2 bg-gray-100 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

