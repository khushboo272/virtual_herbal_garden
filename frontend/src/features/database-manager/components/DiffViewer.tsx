import React from 'react';
import { ArrowRight } from 'lucide-react';

interface DiffViewerProps {
  diff?: Record<string, { before: any; after: any }>;
  className?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, className = '' }) => {
  if (!diff || Object.keys(diff).length === 0) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 italic py-2">
        No field values changed.
      </div>
    );
  }

  const formatVal = (val: any) => {
    if (val === null || val === undefined) return <span className="text-gray-400">null</span>;
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs font-mono">
        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-left">
          <tr>
            <th className="px-3 py-2 font-medium">Field</th>
            <th className="px-3 py-2 font-medium text-red-600 dark:text-red-400">Before (Database)</th>
            <th className="px-2 py-2"></th>
            <th className="px-3 py-2 font-medium text-emerald-600 dark:text-emerald-400">After (Incoming)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(diff).map(([field, { before, after }]) => (
            <tr key={field} className="hover:bg-gray-50/50 dark:hover:bg-gray-750">
              <td className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">{field}</td>
              <td className="px-3 py-2 text-red-700 dark:text-red-300 bg-red-50/40 dark:bg-red-950/20 max-w-xs truncate">
                {formatVal(before)}
              </td>
              <td className="px-2 py-2 text-gray-400 text-center">
                <ArrowRight className="w-3.5 h-3.5 inline" />
              </td>
              <td className="px-3 py-2 text-emerald-700 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 max-w-xs truncate">
                {formatVal(after)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

