import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Database,
  Layers,
  FileText,
  HardDrive,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Archive,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type { OverviewStats } from '../types';
import { JobProgress } from '../components/JobProgress';

export const DatabaseOverviewPage: React.FC = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await databaseApi.getOverview();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load database overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center space-x-3 text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Loading live database metrics...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-3 text-red-700 dark:text-red-300">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">{error || 'Failed to connect to database'}</div>
          <button
            type="button"
            onClick={fetchStats}
            className="px-3 py-1.5 bg-red-100 dark:bg-red-900/60 rounded-xl text-xs font-semibold hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i] || 'B'}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">MongoDB Database</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats.databaseName || 'herbal_garden_dev'}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">{stats.serverVersion || 'MongoDB'}</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Collections & Docs</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {(stats.totalDocuments ?? 0).toLocaleString()} <span className="text-xs font-normal text-gray-500">docs</span>
            </div>
            <div className="text-[11px] text-gray-500">{stats.totalCollections ?? (stats.collections?.length || 0)} registered collections</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-2xl">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Data Storage</div>
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatBytes(stats.totalStorageSizeBytes)}</div>
            <div className="text-[11px] text-gray-500">Document + index footprint</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm flex items-center space-x-4">
          <div className={`p-3 rounded-2xl ${stats.backupFreshness?.isStale ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'}`}>
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Backup Freshness</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {stats.backupFreshness?.lastBackupAt
                ? new Date(stats.backupFreshness.lastBackupAt).toLocaleDateString()
                : 'No backups yet'}
            </div>
            <div className={`text-[11px] font-medium ${stats.backupFreshness?.isStale ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {stats.backupFreshness?.isStale ? '⚠️ Backup recommended' : '✓ Fresh'} ({stats.backupFreshness?.totalBackups ?? 0} total)
            </div>
          </div>
        </div>
      </div>

      {/* Active Jobs Alert */}
      {(stats.recentJobs ?? []).filter((j) => j.status === 'running' || j.status === 'queued').length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Running Background Jobs</h2>
          {(stats.recentJobs ?? [])
            .filter((j) => j.status === 'running' || j.status === 'queued')
            .map((job) => (
              <JobProgress key={job._id} job={job} />
            ))}
        </div>
      )}

      {/* Collection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Managed Collections</h2>
            <p className="text-xs text-gray-500">Live document counts, storage, and activity timestamps from MongoDB.</p>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats.collections ?? []).map((col) => (
            <div
              key={col.key}
              className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm hover:border-emerald-500/40 transition group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 transition">
                    {col.label}
                  </h3>
                  <span className="font-mono text-xs text-gray-400">{col.key}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {(col.count ?? 0).toLocaleString()}
                  </span>
                  <div className="text-[11px] text-gray-400">docs</div>
                </div>
              </div>

              {/* Published ratio indicator if applicable */}
              {col.publishedCount !== undefined && (col.count ?? 0) > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-500">
                  <span className="text-emerald-600 font-medium">
                    ✓ {col.publishedCount} Published
                  </span>
                  <span>{col.draftCount ?? 0} Drafts</span>
                </div>
              )}

              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {col.lastWriteAt ? new Date(col.lastWriteAt).toLocaleDateString() : 'No activity'}
                  </span>
                </span>
                <span className="font-mono">{formatBytes(col.storageSizeBytes)}</span>
              </div>

              {/* Quick action buttons */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-end space-x-2">
                <Link
                  to={`/dashboard/database/browse?collection=${col.key}`}
                  className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Browse & Edit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

