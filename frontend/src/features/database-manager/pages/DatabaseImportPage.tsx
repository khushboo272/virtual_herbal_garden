import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileCode,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Database,
} from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type { CollectionMeta, CollectionKey, DryRunResult } from '../types';
import { CollectionPicker } from '../components/CollectionPicker';
import { JsonEditor } from '../components/JsonEditor';
import { DryRunTable } from '../components/DryRunTable';
import { ConfirmDangerDialog } from '../components/ConfirmDangerDialog';

export const DatabaseImportPage: React.FC = () => {
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [targetCollection, setTargetCollection] = useState<CollectionKey | 'bundle'>('bundle');
  const [jsonText, setJsonText] = useState('');
  const [format, setFormat] = useState<'seed_v1' | 'raw'>('seed_v1');
  const [mode, setMode] = useState<'insert_only' | 'upsert' | 'update_merge' | 'replace'>('insert_only');
  const [statusOverride, setStatusOverride] = useState<'keep' | 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED'>('keep');

  const [dryRunResult, setDryRunResult] = useState<DryRunResult | null>(null);
  const [loadingDryRun, setLoadingDryRun] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState<{ jobId: string; batchId: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);

  useEffect(() => {
    databaseApi.getCollections().then(setCollections).catch(() => {});
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File exceeds maximum size of 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      setDryRunResult(null);
      setErrorMsg(null);
    };
    reader.readAsText(file);
  };

  const handleLoadStarterPack = async () => {
    try {
      setErrorMsg(null);
      setLoadingDryRun(true);
      const pack = await databaseApi.loadStarterPack();
      setTargetCollection('bundle');
      setFormat('seed_v1');
      setJsonText(JSON.stringify(pack, null, 2));
      setDryRunResult(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load starter seed pack');
    } finally {
      setLoadingDryRun(false);
    }
  };

  const handleCopyAiPrompt = async () => {
    try {
      const col = targetCollection === 'bundle' ? 'plants' : targetCollection;
      const res = await databaseApi.getAiPrompt(col);
      await navigator.clipboard.writeText(res.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      setErrorMsg('Failed to copy prompt');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const col = targetCollection === 'bundle' ? 'plants' : targetCollection;
      const template = await databaseApi.getImportTemplate(col);
      const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${col}-template.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Failed to download template');
    }
  };

  const executeDryRun = async () => {
    try {
      setErrorMsg(null);
      setLoadingDryRun(true);
      setCommitSuccess(null);

      let parsed: any;
      try {
        parsed = JSON.parse(jsonText);
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }

      const options = {
        mode,
        statusOverride,
        format,
      };

      const result = await databaseApi.dryRunImport(parsed, targetCollection, options);
      setDryRunResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Dry run validation failed');
    } finally {
      setLoadingDryRun(false);
    }
  };

  const executeCommit = async () => {
    if (!dryRunResult) return;
    if (mode === 'replace') {
      setShowReplaceModal(true);
      return;
    }
    await commitVerifiedBatch();
  };

  const commitVerifiedBatch = async () => {
    try {
      setCommitting(true);
      setErrorMsg(null);
      const options = { mode, statusOverride, format };
      const res = await databaseApi.commitImport(dryRunResult!, options);
      setCommitSuccess({ jobId: res.jobId, batchId: res.batchId });
      setDryRunResult(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Import commit failed');
    } finally {
      setCommitting(false);
      setShowReplaceModal(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header controls bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-emerald-600" />
            <span>JSON Import Engine</span>
          </h1>
          <p className="text-xs text-gray-500">
            Paste JSON or upload seed bundle. Mandatory dry run diff verification before commit.
          </p>
        </div>

        {/* Quick action triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleLoadStarterPack}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Starter Pack</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Template</span>
          </button>

          <button
            type="button"
            onClick={handleCopyAiPrompt}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition"
          >
            {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy AI Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Configuration Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-850 border border-gray-200 dark:border-gray-800">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Target Collection
          </label>
          <CollectionPicker
            collections={collections}
            selected={targetCollection}
            onChange={(key) => setTargetCollection(key)}
            includeBundleOption={true}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Format Preset
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium"
          >
            <option value="seed_v1">Seed Format v1 (Auto-resolve refs)</option>
            <option value="raw">Raw Mongoose Model</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Import Mode
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium"
          >
            <option value="insert_only">Insert-only (skip existing)</option>
            <option value="upsert">Upsert by unique key</option>
            <option value="update_merge">Update & Merge fields</option>
            <option value="replace">⚠️ Replace collection (Wipe first)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Status Override
          </label>
          <select
            value={statusOverride}
            onChange={(e) => setStatusOverride(e.target.value as any)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium"
          >
            <option value="keep">Keep status from file</option>
            <option value="PUBLISHED">Force All PUBLISHED</option>
            <option value="DRAFT">Force All DRAFT</option>
            <option value="PENDING_REVIEW">Force All PENDING_REVIEW</option>
          </select>
        </div>
      </div>

      {/* File Dropzone & Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            Payload JSON
          </label>
          <label className="cursor-pointer inline-flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload .json file</span>
            <input type="file" accept=".json,.ndjson,.csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <JsonEditor
          value={jsonText}
          onChange={(val) => {
            setJsonText(val);
            setDryRunResult(null);
          }}
          minHeight="340px"
        />
      </div>

      {/* Action Row */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-gray-500">
          {jsonText.trim() ? `${jsonText.split('\n').length} lines ready for validation` : 'Enter or upload JSON to begin'}
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={executeDryRun}
            disabled={!jsonText.trim() || loadingDryRun}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 transition shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loadingDryRun ? 'Validating...' : 'Run Dry Run'}</span>
          </button>

          {dryRunResult && (
            <button
              type="button"
              onClick={executeCommit}
              disabled={committing || dryRunResult.summary.errorsCount > 0}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>
                {committing
                  ? 'Committing Batch...'
                  : `Commit Import (${dryRunResult.summary.willInsert + dryRunResult.summary.willUpdate} docs)`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-3 text-red-700 dark:text-red-300 text-xs">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Commit Success Banner */}
      {commitSuccess && (
        <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
            <Check className="w-5 h-5 text-emerald-600" />
            <span>Import Batch Committed Successfully!</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            Job ID: {commitSuccess.jobId} | Batch ID: {commitSuccess.batchId}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            All documents were validated and saved in dependency order. You can view progress in Job History or undo this batch at any time.
          </p>
        </div>
      )}

      {/* Dry Run Diff Table */}
      {dryRunResult && (
        <div className="space-y-3 pt-4 border-t dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Dry Run Validation Diff ({dryRunResult.rows.length} rows)
            </h2>
            <span className="text-xs text-gray-500 font-mono">Batch: {dryRunResult.batchId}</span>
          </div>

          <DryRunTable dryRunResult={dryRunResult} />
        </div>
      )}

      {/* Replace Confirmation Modal */}
      <ConfirmDangerDialog
        isOpen={showReplaceModal}
        title={`Wipe & Replace ${targetCollection}`}
        message={`You selected "Replace" mode. All existing documents in ${targetCollection} will be permanently replaced by this import batch.`}
        confirmKeyword={targetCollection === 'bundle' ? 'REPLACE_ALL' : targetCollection}
        onConfirm={commitVerifiedBatch}
        onCancel={() => setShowReplaceModal(false)}
        isLoading={committing}
      />
    </div>
  );
};

