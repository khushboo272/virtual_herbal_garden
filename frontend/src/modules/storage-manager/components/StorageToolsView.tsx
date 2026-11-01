import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  FileQuestion,
  Link2Off,
  FolderSync,
  CheckCircle2,
  Download,
  Database,
  Box,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { ISyncCheckResult, ICoverageItem } from '../types';
import { storageApi } from '../api/storageApi';
import { toast } from 'sonner';

interface StorageToolsViewProps {
  formatBytes: (bytes: number) => string;
}

export const StorageToolsView: React.FC<StorageToolsViewProps> = ({ formatBytes }) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'coverage' | 'duplicates'>('sync');
  const [syncData, setSyncData] = useState<ISyncCheckResult | null>(null);
  const [coverageData, setCoverageData] = useState<ICoverageItem[]>([]);
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingCoverage, setLoadingCoverage] = useState(false);
  const [coverageFilter, setCoverageFilter] = useState<'ALL' | 'MISSING_ANY' | 'MISSING_GLB' | 'MISSING_HERO'>('ALL');

  const runSyncCheck = async () => {
    try {
      setLoadingSync(true);
      const res = await storageApi.syncCheck();
      setSyncData(res);
      toast.success('Sync check analysis completed');
    } catch (err: any) {
      toast.error(err?.message || 'Sync check failed');
    } finally {
      setLoadingSync(false);
    }
  };

  const loadCoverage = async () => {
    try {
      setLoadingCoverage(true);
      const res = await storageApi.coverageReport();
      setCoverageData(res);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load coverage report');
    } finally {
      setLoadingCoverage(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sync' && !syncData) {
      runSyncCheck();
    } else if (activeTab === 'coverage' && coverageData.length === 0) {
      loadCoverage();
    }
  }, [activeTab]);

  const exportCoverageCsv = () => {
    if (coverageData.length === 0) return;
    const headers = ['Type', 'Name', 'Slug', 'Hero', 'Gallery Count', '3D GLB', 'LOD', 'Missing'];
    const rows = coverageData.map((it) => [
      it.type,
      `"${it.name.replace(/"/g, '""')}"`,
      it.slug,
      it.hasHero ? 'YES' : 'NO',
      it.galleryCount,
      it.hasGlb ? 'YES' : 'NO',
      it.hasLod ? 'YES' : 'NO',
      `"${it.missingItems.join(', ')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-coverage-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Asset coverage report exported');
  };

  const filteredCoverage = coverageData.filter((item) => {
    if (coverageFilter === 'MISSING_ANY') return item.missingItems.length > 0;
    if (coverageFilter === 'MISSING_GLB') return !item.hasGlb && item.type === 'plant';
    if (coverageFilter === 'MISSING_HERO') return !item.hasHero;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'sync'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Sync Check (R2 ⇄ Database)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('coverage')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'coverage'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Asset Coverage Board
          </button>
        </div>

        {activeTab === 'sync' && (
          <button
            type="button"
            onClick={runSyncCheck}
            disabled={loadingSync}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingSync ? 'animate-spin' : ''}`} />
            Run Sync Check
          </button>
        )}

        {activeTab === 'coverage' && (
          <button
            type="button"
            onClick={exportCoverageCsv}
            disabled={coverageData.length === 0}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-slate-700 dark:text-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            Export Coverage CSV
          </button>
        )}
      </div>

      {/* Sync Check View */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          {/* Summary metrics */}
          {syncData?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  Total R2 Objects
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                  {syncData.stats.totalR2Keys}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  MongoDB Asset URLs
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1 block">
                  {syncData.stats.totalDbLinks}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] font-medium text-amber-500 uppercase tracking-wider block">
                  Orphaned Files (in R2)
                </span>
                <span className="text-xl font-bold text-amber-600 mt-1 block">
                  {syncData.stats.orphanCount}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-[11px] font-medium text-rose-500 uppercase tracking-wider block">
                  Broken Links (in DB)
                </span>
                <span className="text-xl font-bold text-rose-600 mt-1 block">
                  {syncData.stats.brokenLinkCount}
                </span>
              </div>
            </div>
          )}

          {/* Broken Links Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <Link2Off className="w-4 h-4 text-rose-600" /> Broken Links (Referenced in MongoDB, Missing in R2)
            </h4>
            <p className="text-xs text-slate-500">
              These database documents reference files on R2 that do not exist or were deleted.
            </p>

            {syncData?.brokenLinks && syncData.brokenLinks.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                {syncData.brokenLinks.map((bl, i) => (
                  <div key={i} className="p-3 bg-rose-50/20 dark:bg-rose-950/10 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{bl.name}</span>{' '}
                      <span className="text-[11px] text-slate-400 capitalize">({bl.collection} → {bl.field})</span>
                      <div className="font-mono text-[10px] text-rose-600 mt-0.5 truncate max-w-lg">
                        {bl.url}
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                      404 Missing
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                ✅ No broken links detected! All MongoDB URLs reference existing R2 storage objects.
              </div>
            )}
          </div>

          {/* Orphaned Files Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-amber-600" /> Orphaned Files (In R2, Not Linked to Any Document)
            </h4>
            <p className="text-xs text-slate-500">
              Files occupying storage space that have no corresponding reference in MongoDB.
            </p>

            {syncData?.orphans && syncData.orphans.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs max-h-80 overflow-y-auto">
                {syncData.orphans.map((orph, i) => (
                  <div key={i} className="p-3 bg-amber-50/20 dark:bg-amber-950/10 flex items-center justify-between">
                    <div className="truncate max-w-md">
                      <span className="font-mono text-slate-700 dark:text-slate-200 block truncate">{orph.key}</span>
                      <span className="text-[10px] text-slate-400">{formatBytes(orph.size)}</span>
                    </div>
                    {orph.suggestedPlantSlug && (
                      <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                        Matches plant: <code className="font-mono">{orph.suggestedPlantSlug}</code>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/20 rounded-xl">
                ✅ No orphaned files! Every R2 object is actively referenced by MongoDB.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Asset Coverage Board */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                aria-label="Filter coverage report"
                value={coverageFilter}
                onChange={(e) => setCoverageFilter(e.target.value as any)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
              >
                <option value="ALL">All Specimens ({coverageData.length})</option>
                <option value="MISSING_ANY">Missing Any Asset</option>
                <option value="MISSING_GLB">Missing 3D GLB Model</option>
                <option value="MISSING_HERO">Missing Hero Image</option>
              </select>
            </div>
            <span className="text-xs text-slate-400">Showing {filteredCoverage.length} items</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Name / Slug</th>
                  <th className="p-3 text-center">Hero Photo</th>
                  <th className="p-3 text-center">Gallery</th>
                  <th className="p-3 text-center">3D GLB Model</th>
                  <th className="p-3 text-center">LOD</th>
                  <th className="p-3">Missing Assets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredCoverage.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 capitalize font-medium text-slate-400">{item.type}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 block">{item.name}</span>
                      <code className="text-[10px] text-slate-400 font-mono">{item.slug}</code>
                    </td>
                    <td className="p-3 text-center">
                      {item.hasHero ? (
                        <span className="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium">
                      {item.galleryCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px]">
                          {item.galleryCount}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">0</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.type === 'plant' ? (
                        item.hasGlb ? (
                          <span className="inline-flex p-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                            <Box className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                            Missing
                          </span>
                        )
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.type === 'plant' ? (
                        item.hasLod ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">N/A</span>
                      )}
                    </td>
                    <td className="p-3">
                      {item.missingItems.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.missingItems.map((m, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-medium"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[11px]">Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

