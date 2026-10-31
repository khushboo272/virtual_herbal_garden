import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { DbJobItem } from '../types';

interface JobProgressProps {
  job: DbJobItem;
  className?: string;
}

export const JobProgress: React.FC<JobProgressProps> = ({ job, className = '' }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
      case 'queued':
        return <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />;
      case 'done':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const percent = job.progress?.percent ?? 0;

  return (
    <div className={`p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {getStatusIcon(job.status)}
          <span className="font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            {job.type} Job ({job.status})
          </span>
          <span className="text-gray-400 font-mono text-[11px] truncate max-w-xs">{job.batchId}</span>
        </div>
        <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {percent}%
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            job.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="truncate max-w-md">{job.progress?.message || 'Processing documents...'}</span>
        <span className="font-mono">
          {job.progress?.current || 0} / {job.progress?.total || 0} docs
        </span>
      </div>

      {job.counts && (
        <div className="flex flex-wrap gap-2 pt-1 border-t dark:border-gray-700/60 text-[11px] font-mono text-gray-600 dark:text-gray-300">
          <span>Inserted: <strong className="text-emerald-600">{job.counts.inserted}</strong></span>
          <span>Updated: <strong className="text-blue-600">{job.counts.updated}</strong></span>
          <span>Skipped: <strong>{job.counts.skipped}</strong></span>
          <span>Errors: <strong className={job.counts.errors > 0 ? 'text-red-600' : ''}>{job.counts.errors}</strong></span>
        </div>
      )}
    </div>
  );
};

