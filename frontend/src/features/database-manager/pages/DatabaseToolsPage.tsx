import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Link as LinkIcon,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Download,
  Play,
  RotateCw,
  Sliders,
  Database,
} from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type { CollectionMeta, CollectionKey } from '../types';
import { CollectionPicker } from '../components/CollectionPicker';

export const DatabaseToolsPage: React.FC = () => {
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [activeTab, setActiveTab] = useState<'link_r2' | 'coverage' | 'auto_3d' | 'find_replace' | 'normalize' | 'indexes'>('link_r2');

  // Link R2 state
  const [linkingR2, setLinkingR2] = useState(false);
  const [r2DryRunResult, setR2DryRunResult] = useState<any | null>(null);

  // Asset Coverage state
  const [coverageData, setCoverageData] = useState<any | null>(null);
  const [loadingCoverage, setLoadingCoverage] = useState(false);

  // Auto 3D state
  const [placing3D, setPlacing3D] = useState(false);
  const [auto3DResult, setAuto3DResult] = useState<any | null>(null);

  // Find & Replace state
  const [frCollection, setFrCollection] = useState<CollectionKey>('plants');
  const [frField, setFrField] = useState('description');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [frRunning, setFrRunning] = useState(false);
  const [frResult, setFrResult] = useState<any | null>(null);

  // Normalize state
  const [normCollection, setNormCollection] = useState<CollectionKey>('plants');
  const [normField, setNormField] = useState<'tags' | 'medicinalUses' | 'slug'>('tags');
  const [normRunning, setNormRunning] = useState(false);
  const [normResult, setNormResult] = useState<any | null>(null);

  // Index viewer state
  const [indexData, setIndexData] = useState<any | null>(null);
  const [loadingIndexes, setLoadingIndexes] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    databaseApi.getCollections().then(setCollections).catch(() => {});
  }, []);

  // 1. Link R2 Assets
  const handleLinkR2 = async (dryRun: boolean) => {
    try {
      setLinkingR2(true);
      setFeedback(null);
      const res = await databaseApi.linkR2Assets(dryRun);
      setR2DryRunResult(res);
      if (!dryRun) {
        setFeedback({ type: 'success', text: `Successfully linked R2 assets for ${res.plantsUpdated} plants and ${res.toursUpdated} tours!` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to link R2 assets' });
    } finally {
      setLinkingR2(false);
    }
  };

  // 2. Asset Coverage
  const handleLoadCoverage = async () => {
    try {
      setLoadingCoverage(true);
      const res = await databaseApi.getAssetCoverage();
      setCoverageData(res);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load coverage' });
    } finally {
      setLoadingCoverage(false);
    }
  };

  // 3. Auto Place 3D
  const handleAutoPlace3D = async (dryRun: boolean) => {
    try {
      setPlacing3D(true);
      setFeedback(null);
      const res = await databaseApi.autoPlace3D(dryRun);
      setAuto3DResult(res);
      if (!dryRun) {
        setFeedback({ type: 'success', text: `Auto-placed ${res.placedCount} plants in spiral ring layout!` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Auto 3D placement failed' });
    } finally {
      setPlacing3D(false);
    }
  };

  // 4. Find & Replace
  const handleFindReplace = async (dryRun: boolean) => {
    try {
      setFrRunning(true);
      setFeedback(null);
      const res = await databaseApi.findAndReplace({
        collection: frCollection,
        field: frField,
        findText,
        replaceText,
        dryRun,
      });
      setFrResult(res);
      if (!dryRun) {
        setFeedback({ type: 'success', text: `Replaced occurrences in ${res.updatedCount} documents!` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Find & replace failed' });
    } finally {
      setFrRunning(false);
    }
  };

  // 5. Normalize
  const handleNormalize = async (dryRun: boolean) => {
    try {
      setNormRunning(true);
      setFeedback(null);
      const res = await databaseApi.normalizeData({
        collection: normCollection,
        field: normField,
        dryRun,
      });
      setNormResult(res);
      if (!dryRun) {
        setFeedback({ type: 'success', text: `Normalized ${res.updatedCount} documents!` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Normalization failed' });
    } finally {
      setNormRunning(false);
    }
  };

  // 6. Indexes
  const handleLoadIndexes = async () => {
    try {
      setLoadingIndexes(true);
      const res = await databaseApi.getIndexes();
      setIndexData(res);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to inspect indexes' });
    } finally {
      setLoadingIndexes(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="pb-4 border-b dark:border-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-emerald-600" />
          <span>Smart Database Tools</span>
        </h1>
        <p className="text-xs text-gray-500">
          Automated botanical pipeline tools: slug-based R2 linking, 3D placement, find & replace, tag normalization, and index sync.
        </p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs flex items-center justify-between ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200'
        }`}>
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      {/* Sub Tool Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'link_r2', label: 'Link R2 Assets' },
          { id: 'coverage', label: 'Asset Coverage' },
          { id: 'auto_3d', label: 'Auto-Place 3D' },
          { id: 'find_replace', label: 'Find & Replace' },
          { id: 'normalize', label: 'Normalize Tags & Uses' },
          { id: 'indexes', label: 'Index Viewer & Sync' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id as any);
              if (t.id === 'coverage' && !coverageData) handleLoadCoverage();
              if (t.id === 'indexes' && !indexData) handleLoadIndexes();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === t.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. Link R2 Assets */}
      {activeTab === 'link_r2' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
              <LinkIcon className="w-4 h-4 text-emerald-600" />
              <span>Link R2 Botanical Assets by Slug</span>
            </h2>
            <p className="text-xs text-gray-500">
              Matches botanical slug names to Cloudflare R2 conventions:
              <br />
              <code className="text-emerald-600 font-mono text-[11px]">plants/&lt;slug&gt;/hero.webp</code>,{' '}
              <code className="text-emerald-600 font-mono text-[11px]">models/&lt;slug&gt;.glb</code>,{' '}
              <code className="text-emerald-600 font-mono text-[11px]">tours/&lt;slug&gt;/cover.webp</code>
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => handleLinkR2(true)}
              disabled={linkingR2}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200 transition"
            >
              {linkingR2 ? 'Checking...' : 'Dry Run Preview'}
            </button>
            <button
              type="button"
              onClick={() => handleLinkR2(false)}
              disabled={linkingR2}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
            >
              {linkingR2 ? 'Applying...' : 'Apply Links to Database'}
            </button>
          </div>

          {r2DryRunResult && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2 text-xs font-mono">
              <div className="font-bold text-gray-700 dark:text-gray-300">
                Matched {r2DryRunResult.plantsMatched} plants and {r2DryRunResult.toursMatched} tours
              </div>
              <pre className="text-[11px] text-emerald-600 max-h-48 overflow-auto">
                {JSON.stringify(r2DryRunResult.matches, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 2. Asset Coverage */}
      {activeTab === 'coverage' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Asset Coverage Report</h2>
              <p className="text-xs text-gray-500">Live inventory of botanical photos, 3D GLB models, and tour covers.</p>
            </div>
            <button
              type="button"
              onClick={handleLoadCoverage}
              className="px-3 py-1.5 rounded-xl border dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loadingCoverage ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading asset coverage...</div>
          ) : coverageData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Plants with Photos</div>
                  <div className="text-xl font-bold text-emerald-700">{coverageData.plantsWithImages} / {coverageData.totalPlants}</div>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200">
                  <div className="text-xs text-blue-800 dark:text-blue-300 font-semibold">Plants with 3D Models</div>
                  <div className="text-xl font-bold text-blue-700">{coverageData.plantsWith3D} / {coverageData.totalPlants}</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200">
                  <div className="text-xs text-purple-800 dark:text-purple-300 font-semibold">Tours with Cover</div>
                  <div className="text-xl font-bold text-purple-700">{coverageData.toursWithCovers} / {coverageData.totalTours}</div>
                </div>
              </div>

              {coverageData.missing3DPlants?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Plants Missing 3D GLB Models ({coverageData.missing3DPlants.length}):
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-mono text-gray-600 dark:text-gray-400 max-h-40 overflow-auto">
                    {coverageData.missing3DPlants.map((p: any) => p.commonName || p.slug).join(', ')}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* 3. Auto Place 3D */}
      {activeTab === 'auto_3d' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Auto-Place 3D Garden Coordinates
            </h2>
            <p className="text-xs text-gray-500">
              Calculates non-overlapping botanical coordinates in a spiral ring layout around the garden sanctuary plaza.
            </p>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => handleAutoPlace3D(true)}
              disabled={placing3D}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-800 dark:text-gray-200"
            >
              {placing3D ? 'Calculating...' : 'Dry Run Preview'}
            </button>
            <button
              type="button"
              onClick={() => handleAutoPlace3D(false)}
              disabled={placing3D}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
            >
              {placing3D ? 'Placing...' : 'Save 3D Placements'}
            </button>
          </div>

          {auto3DResult && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2 text-xs font-mono">
              <div className="font-bold text-emerald-600">
                Calculated coordinates for {auto3DResult.placedCount} plants
              </div>
              <pre className="text-[11px] max-h-48 overflow-auto">
                {JSON.stringify(auto3DResult.placements?.slice(0, 10), null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 4. Find & Replace */}
      {activeTab === 'find_replace' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Collection Find & Replace
            </h2>
            <p className="text-xs text-gray-500">
              Search and replace substring text across text fields in a collection with dry run preview.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Collection</label>
              <CollectionPicker
                collections={collections}
                selected={frCollection}
                onChange={(key) => setFrCollection(key as CollectionKey)}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Field Name</label>
              <input
                type="text"
                value={frField}
                onChange={(e) => setFrField(e.target.value)}
                placeholder="e.g. description, shortDescription"
                className="w-full px-3 py-2 text-xs rounded-xl border dark:border-gray-700 mt-1 bg-white dark:bg-gray-800 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Find Text</label>
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Target string..."
                className="w-full px-3 py-2 text-xs rounded-xl border dark:border-gray-700 mt-1 bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Replace With</label>
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replacement string..."
                className="w-full px-3 py-2 text-xs rounded-xl border dark:border-gray-700 mt-1 bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => handleFindReplace(true)}
              disabled={!findText || frRunning}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
            >
              Preview Matches
            </button>
            <button
              type="button"
              onClick={() => handleFindReplace(false)}
              disabled={!findText || frRunning}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Execute Replace
            </button>
          </div>

          {frResult && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2 text-xs font-mono">
              <div className="font-bold text-gray-800 dark:text-gray-200">
                Found in {frResult.matchedCount} docs; updated {frResult.updatedCount} docs
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Normalize */}
      {activeTab === 'normalize' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Normalize Array Tags & Uses
            </h2>
            <p className="text-xs text-gray-500">
              Cleans up array strings: trims whitespace, normalizes casing, and removes duplicates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Collection</label>
              <CollectionPicker
                collections={collections}
                selected={normCollection}
                onChange={(key) => setNormCollection(key as CollectionKey)}
                className="w-full mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Array Field</label>
              <select
                value={normField}
                onChange={(e) => setNormField(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border dark:border-gray-700 mt-1 bg-white dark:bg-gray-800 font-medium"
              >
                <option value="tags">tags</option>
                <option value="medicinalUses">medicinalUses</option>
                <option value="slug">slug (lowercase + hyphenate)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={() => handleNormalize(true)}
              disabled={normRunning}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
            >
              Preview Normalization
            </button>
            <button
              type="button"
              onClick={() => handleNormalize(false)}
              disabled={normRunning}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Apply Normalization
            </button>
          </div>

          {normResult && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2 text-xs font-mono">
              <div className="font-bold text-emerald-600">
                {normResult.updatedCount} documents affected
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. Indexes */}
      {activeTab === 'indexes' && (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">MongoDB Indexes</h2>
              <p className="text-xs text-gray-500">Current index definitions and schema alignment.</p>
            </div>
            <button
              type="button"
              onClick={handleLoadIndexes}
              className="px-3 py-1.5 rounded-xl border dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50"
            >
              Refresh Indexes
            </button>
          </div>

          {loadingIndexes ? (
            <div className="py-8 text-center text-xs text-gray-400">Loading index schemas...</div>
          ) : indexData ? (
            <pre className="p-4 bg-gray-900 text-emerald-300 rounded-xl text-xs font-mono max-h-96 overflow-auto">
              {JSON.stringify(indexData, null, 2)}
            </pre>
          ) : null}
        </div>
      )}
    </div>
  );
};

