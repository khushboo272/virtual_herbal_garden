import React, { useState } from 'react';
import { PlusCircle, RefreshCw, SkipForward, AlertCircle, Eye, AlertTriangle } from 'lucide-react';
import type { DryRunResult, DryRunRowResult } from '../types';
import { DiffViewer } from './DiffViewer';

interface DryRunTableProps {
  dryRunResult: DryRunResult;
}

export const DryRunTable: React.FC<DryRunTableProps> = ({ dryRunResult }) => {
  const [selectedRow, setSelectedRow] = useState<DryRunRowResult | null>(null);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'insert':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
            <PlusCircle className="w-3 h-3" />
            <span>INSERT</span>
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            <RefreshCw className="w-3 h-3" />
            <span>UPDATE</span>
          </span>
        );
      case 'skip':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            <SkipForward className="w-3 h-3" />
            <span>SKIP</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
            <AlertCircle className="w-3 h-3" />
            <span>ERROR</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Will Insert</div>
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
            {dryRunResult.summary.willInsert}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-400">Will Update</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
            {dryRunResult.summary.willUpdate}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Will Skip</div>
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            {dryRunResult.summary.willSkip}
          </div>
        </div>
        <div className="p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <div className="text-xs font-medium text-red-700 dark:text-red-400">Errors</div>
          <div className="text-2xl font-bold text-red-800 dark:text-red-300">
            {dryRunResult.summary.errorsCount}
          </div>
        </div>
      </div>

      {/* Row List */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm max-h-96">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 sticky top-0">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Row #</th>
              <th className="px-4 py-2.5 text-left font-medium">Collection</th>
              <th className="px-4 py-2.5 text-left font-medium">Key / Slug</th>
              <th className="px-4 py-2.5 text-left font-medium">Predicted Action</th>
              <th className="px-4 py-2.5 text-left font-medium">Status / Issues</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {dryRunResult.rows.map((row) => (
              <tr key={`${row.collectionName}-${row.row}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
                <td className="px-4 py-2 font-mono text-gray-500">#{row.row}</td>
                <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200">{row.collectionName}</td>
                <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300 truncate max-w-xs">{row.uniqueValue}</td>
                <td className="px-4 py-2">{getActionBadge(row.action)}</td>
                <td className="px-4 py-2">
                  {row.errors.length > 0 ? (
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate max-w-xs">{row.errors[0]}</span>
                    </div>
                  ) : row.warnings.length > 0 ? (
                    <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate max-w-xs">{row.warnings[0]}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Valid</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => setSelectedRow(row)}
                    className="inline-flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row Inspect Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Row #{selectedRow.row} — {selectedRow.collectionName} ({selectedRow.uniqueValue})
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {selectedRow.errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl space-y-1">
                <div className="text-xs font-semibold text-red-800 dark:text-red-300">Validation Errors:</div>
                {selectedRow.errors.map((e, idx) => (
                  <div key={idx} className="text-xs text-red-700 dark:text-red-400">• {e}</div>
                ))}
              </div>
            )}

            {selectedRow.warnings.length > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
                <div className="text-xs font-semibold text-amber-800 dark:text-amber-300">Warnings:</div>
                {selectedRow.warnings.map((w, idx) => (
                  <div key={idx} className="text-xs text-amber-700 dark:text-amber-400">• {w}</div>
                ))}
              </div>
            )}

            {selectedRow.diff && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Field Differences:</div>
                <DiffViewer diff={selectedRow.diff} />
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Parsed Document Data:</div>
              <pre className="p-3 bg-gray-900 text-emerald-300 rounded-xl text-xs overflow-x-auto max-h-48 font-mono">
                {JSON.stringify(selectedRow.docData, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-medium"
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

