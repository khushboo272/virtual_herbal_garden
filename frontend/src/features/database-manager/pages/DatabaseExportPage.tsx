import React, { useState, useEffect } from 'react';
import { DownloadCloud, Shield, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type { CollectionMeta, CollectionKey } from '../types';
import { CollectionPicker } from '../components/CollectionPicker';

export const DatabaseExportPage: React.FC = () => {
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [targetCollection, setTargetCollection] = useState<CollectionKey | 'bundle'>('bundle');
  const [format, setFormat] = useState<'json' | 'ndjson' | 'csv' | 'gzip'>('json');
  const [seedFormat, setSeedFormat] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    databaseApi.getCollections().then(setCollections).catch(() => {});
  }, []);

  const handleTriggerExport = () => {
    try {
      setDownloading(true);
      setErrorMsg(null);
      const url = databaseApi.exportDataUrl(targetCollection, format);

      // Trigger native download
      const a = document.createElement('a');
      a.href = url;
      a.download = targetCollection === 'bundle' ? `database-bundle.${format === 'gzip' ? 'json.gz' : format}` : `${targetCollection}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => setDownloading(false), 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export failed');
      setDownloading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="pb-4 border-b dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <DownloadCloud className="w-5 h-5 text-emerald-600" />
          <span>Export Database & Content Bundles</span>
        </h1>
        <p className="text-xs text-gray-500">
          Export individual collections or full platform bundles in JSON, NDJSON, CSV, or compressed GZIP.
        </p>
      </div>

      {/* Security Redaction Banner */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800 dark:text-emerald-300">
        <Shield className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold">Automated Credential Redaction Enforced</div>
          <p className="text-emerald-700 dark:text-emerald-400">
            All sensitive data (passwords, tokens, 2FA secrets, session keys) is strictly redacted server-side before transmission. Every export action is logged to the system audit trail.
          </p>
        </div>
      </div>

      {/* Export Options Card */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Export Scope
          </label>
          <CollectionPicker
            collections={collections}
            selected={targetCollection}
            onChange={(key) => setTargetCollection(key)}
            includeBundleOption={true}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Export File Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'json', label: 'JSON', desc: 'Formatted bundle' },
              { id: 'ndjson', label: 'NDJSON', desc: 'Newline delimited' },
              { id: 'csv', label: 'CSV', desc: 'Tabular flatten' },
              { id: 'gzip', label: 'GZIP', desc: 'Compressed .json.gz' },
            ].map((f) => (
              <label
                key={f.id}
                className={`p-3 rounded-xl border cursor-pointer transition text-center space-y-1 ${
                  format === f.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={f.id}
                  checked={format === f.id}
                  onChange={() => setFormat(f.id as any)}
                  className="hidden"
                />
                <div className="text-sm font-bold uppercase">{f.label}</div>
                <div className="text-[11px] text-gray-500 font-normal">{f.desc}</div>
              </label>
            ))}
          </div>
        </div>

        {targetCollection === 'bundle' && (
          <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={seedFormat}
              onChange={(e) => setSeedFormat(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Preserve Seed Bundle format v1 (compatible with Starter Seed Pack)</span>
          </label>
        )}

        <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={handleTriggerExport}
            disabled={downloading}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>{downloading ? 'Preparing Export...' : 'Download Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

