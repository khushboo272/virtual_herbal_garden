import React, { useState, useEffect } from 'react';
import { Terminal, Play, Sparkles, Download, Clock, AlertCircle } from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type { CollectionKey, CollectionMeta, BuiltInQuery } from '../types';
import { CollectionPicker } from '../components/CollectionPicker';
import { JsonEditor } from '../components/JsonEditor';

export const DatabaseQueryPage: React.FC = () => {
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [examples, setExamples] = useState<BuiltInQuery[]>([]);
  const [selectedCol, setSelectedCol] = useState<CollectionKey>('plants');
  const [queryType, setQueryType] = useState<'find' | 'aggregate'>('find');

  // Find params
  const [filterText, setFilterText] = useState('{\n  "isPublished": true\n}');
  const [projectionText, setProjectionText] = useState('{\n  "commonName": 1,\n  "slug": 1\n}');
  const [sortText, setSortText] = useState('{\n  "commonName": 1\n}');
  const [limit, setLimit] = useState(25);

  // Aggregate pipeline
  const [pipelineText, setPipelineText] = useState(
    '[\n  { "$match": { "isPublished": true } },\n  { "$count": "totalPublished" }\n]'
  );

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [execCount, setExecCount] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    databaseApi.getCollections().then(setCollections).catch(() => {});
    databaseApi.getQueryExamples().then(setExamples).catch(() => {});
  }, []);

  const handleSelectExample = (ex: BuiltInQuery) => {
    setSelectedCol(ex.collection);
    setQueryType(ex.type);
    if (ex.type === 'find') {
      setFilterText(JSON.stringify(ex.filter || {}, null, 2));
      setProjectionText(JSON.stringify(ex.projection || {}, null, 2));
      setSortText(JSON.stringify(ex.sort || {}, null, 2));
    } else {
      setPipelineText(JSON.stringify(ex.pipeline || [], null, 2));
    }
    setQueryResults(null);
  };

  const handleExecute = async () => {
    try {
      setExecuting(true);
      setErrorMsg(null);
      setQueryResults(null);

      if (queryType === 'find') {
        const filter = JSON.parse(filterText || '{}');
        const projection = JSON.parse(projectionText || '{}');
        const sort = JSON.parse(sortText || '{}');

        const res = await databaseApi.executeFind({
          collection: selectedCol,
          filter,
          projection,
          sort,
          limit,
        });

        setQueryResults(res.results);
        setExecCount(res.count);
        setDurationMs(res.durationMs);
      } else {
        const pipeline = JSON.parse(pipelineText || '[]');
        const res = await databaseApi.executeAggregate({
          collection: selectedCol,
          pipeline,
        });

        setQueryResults(res.results);
        setExecCount(res.count);
        setDurationMs(res.durationMs);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Query execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleExportResults = () => {
    if (!queryResults) return;
    const blob = new Blob([JSON.stringify(queryResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${selectedCol}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b dark:border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-600" />
            <span>Read-Only Query Console</span>
          </h1>
          <p className="text-xs text-gray-500">
            Safe MongoDB find & aggregate executor with stage allowlists and 10s timeout protection.
          </p>
        </div>

        {/* Examples dropdown */}
        {examples.length > 0 && (
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <select
              onChange={(e) => {
                const ex = examples.find((x) => x.id === e.target.value);
                if (ex) handleSelectExample(ex);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            >
              <option value="">Load Built-in Query Example...</option>
              {examples.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} ({ex.type})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Query Builder Strip */}
      <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Collection</label>
          <CollectionPicker
            collections={collections}
            selected={selectedCol}
            onChange={(key) => setSelectedCol(key as CollectionKey)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Query Type</label>
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setQueryType('find')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                queryType === 'find' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Find
            </button>
            <button
              type="button"
              onClick={() => setQueryType('aggregate')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                queryType === 'aggregate' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              Aggregate
            </button>
          </div>
        </div>

        {queryType === 'find' && (
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Result Limit</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1.5 text-xs rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 font-medium"
            >
              <option value={10}>10 items</option>
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
            </select>
          </div>
        )}

        <div className="ml-auto flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExecute}
            disabled={executing}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{executing ? 'Executing...' : 'Run Query'}</span>
          </button>
        </div>
      </div>

      {/* Editor Inputs */}
      {queryType === 'find' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Filter (JSON)</label>
            <JsonEditor value={filterText} onChange={setFilterText} minHeight="180px" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Projection (JSON)</label>
            <JsonEditor value={projectionText} onChange={setProjectionText} minHeight="180px" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sort (JSON)</label>
            <JsonEditor value={sortText} onChange={setSortText} minHeight="180px" />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Aggregation Pipeline Stages (JSON Array)
            </label>
            <span className="text-[11px] text-gray-400">
              Allowed: $match, $group, $project, $sort, $limit, $skip, $unwind, $lookup, $count, $facet
            </span>
          </div>
          <JsonEditor value={pipelineText} onChange={setPipelineText} minHeight="240px" />
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl flex items-center space-x-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results Box */}
      {queryResults && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-bold text-gray-900 dark:text-gray-100">
                Results: {execCount} {execCount === 1 ? 'document' : 'documents'}
              </span>
              <span className="flex items-center space-x-1 text-gray-500 font-mono">
                <Clock className="w-3 h-3" />
                <span>{durationMs} ms</span>
              </span>
            </div>

            <button
              type="button"
              onClick={handleExportResults}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Results</span>
            </button>
          </div>

          <pre className="p-4 bg-gray-900 text-emerald-300 rounded-2xl text-xs font-mono overflow-auto max-h-[460px] shadow-inner">
            {JSON.stringify(queryResults, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

