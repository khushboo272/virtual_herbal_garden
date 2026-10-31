import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Wrench,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  HeartPulse,
} from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type { IntegrityReport, IntegrityIssue } from '../types';

export const DatabaseIntegrityPage: React.FC = () => {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const rep = await databaseApi.getIntegrityReport();
      setReport(rep);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to run integrity check' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleApplyFix = async (issue: IntegrityIssue) => {
    try {
      setFixingId(issue.id);
      const res = await databaseApi.applyIntegrityFix(issue);
      setFeedback({ type: 'success', text: res.message });
      fetchReport();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Auto-fix failed' });
    } finally {
      setFixingId(null);
    }
  };

  const handleIgnore = async (issueId: string) => {
    try {
      await databaseApi.ignoreIntegrityIssue(issueId);
      setFeedback({ type: 'success', text: 'Issue marked as ignored.' });
      fetchReport();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to ignore issue' });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center space-x-2 text-gray-500 text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Running database health & integrity analysis...</span>
      </div>
    );
  }

  const score = report?.healthScore ?? 100;
  const scoreColor = score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
            <span>Database Health & Integrity</span>
          </h1>
          <p className="text-xs text-gray-500">
            Real-time scanner for orphan relations, medical safety contraindication checks, and 3D overlap collisions.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchReport}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-scan Database</span>
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

      {/* Health Score Gauge Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex items-center space-x-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-900">
            <span className={`text-2xl font-black ${scoreColor}`}>{score}</span>
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Health Score</div>
            <div className={`text-sm font-bold ${scoreColor}`}>
              {score >= 90 ? 'Excellent' : score >= 70 ? 'Fair' : 'Requires Attention'}
            </div>
            <div className="text-[11px] text-gray-400">0 - 100 Scale</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20 shadow-sm">
          <div className="text-xs font-semibold text-red-800 dark:text-red-300">Errors</div>
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">{report?.errorsCount || 0}</div>
          <div className="text-[11px] text-red-600/80">Critical data inconsistencies</div>
        </div>

        <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm">
          <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Warnings</div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{report?.warningsCount || 0}</div>
          <div className="text-[11px] text-amber-600/80">Missing safety or botanical data</div>
        </div>

        <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm">
          <div className="text-xs font-semibold text-blue-800 dark:text-blue-300">Informational</div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{report?.infoCount || 0}</div>
          <div className="text-[11px] text-blue-600/80">Enhancement suggestions</div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Detected Issues ({report?.totalIssues || 0})
        </h2>

        {!report || report.issues.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">All Clean!</h3>
            <p className="text-xs text-gray-500">
              No orphan references, duplicate keys, medical contraindication gaps, or 3D coordinate overlaps detected.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Collection & Target</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {report.issues.map((iss) => (
                  <tr key={iss.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        iss.severity === 'error'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : iss.severity === 'warn'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      }`}>
                        {iss.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 capitalize">
                      {iss.category.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                      <div>{iss.collectionName}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-xs">{iss.slug || iss.docId}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-md">
                      {iss.message}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {iss.fixable && (
                        <button
                          type="button"
                          onClick={() => handleApplyFix(iss)}
                          disabled={fixingId === iss.id}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>{fixingId === iss.id ? 'Fixing...' : 'Auto-Fix'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleIgnore(iss.id)}
                        className="inline-flex items-center space-x-1 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ignore</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

