import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  ExternalLink,
  Plus,
  Save,
  X,
  AlertCircle,
  Check,
  Sparkles,
  Link as LinkIcon,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';
import { databaseApi } from '../api/databaseApi';
import type {
  CollectionMeta,
  CollectionKey,
  BrowseResult,
  FilterClause,
  FilterOp,
  BacklinkItem,
} from '../types';
import { JsonEditor } from '../components/JsonEditor';
import { DiffViewer } from '../components/DiffViewer';
import { ConfirmDangerDialog } from '../components/ConfirmDangerDialog';

export const DatabaseBrowsePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const initialCol = (searchParams.get('collection') as CollectionKey) || 'plants';
  const [selectedCol, setSelectedCol] = useState<CollectionKey>(initialCol);

  // Browse state
  const [data, setData] = useState<BrowseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<FilterClause[]>([]);

  // Selection & Bulk
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState<string>('');

  // Document Editor Drawer
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [docJsonText, setDocJsonText] = useState('');
  const [backlinks, setBacklinks] = useState<BacklinkItem[]>([]);
  const [savingDoc, setSavingDoc] = useState(false);
  const [saveConflict, setSaveConflict] = useState<{ current: any; conflictDiff: any } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Doc Modal
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [newDocJson, setNewDocJson] = useState('{\n  \n}');

  // Delete modal
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  useEffect(() => {
    databaseApi.getCollections().then((cols) => {
      setCollections(cols);
      if (!cols.find((c) => c.key === selectedCol) && cols.length > 0) {
        setSelectedCol(cols[0].key);
      }
    }).catch(() => {});
  }, []);

  const fetchCollectionDocs = async () => {
    try {
      setLoading(true);
      const res = await databaseApi.browseCollection(selectedCol, {
        page,
        limit,
        sortField,
        sortOrder,
        search,
        filters,
      });
      setData(res);
      setSelectedDocIds([]);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to load documents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionDocs();
    setSearchParams({ collection: selectedCol });
  }, [selectedCol, page, limit, sortField, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCollectionDocs();
  };

  const handleOpenDoc = async (doc: any) => {
    setEditingDoc(doc);
    setDocJsonText(JSON.stringify(doc, null, 2));
    setSaveConflict(null);
    setFeedbackMsg(null);
    try {
      const bl = await databaseApi.getBacklinks(selectedCol, doc._id);
      setBacklinks(bl);
    } catch {
      setBacklinks([]);
    }
  };

  const handleSaveDoc = async () => {
    if (!editingDoc) return;
    try {
      setSavingDoc(true);
      setSaveConflict(null);
      let parsed: any;
      try {
        parsed = JSON.parse(docJsonText);
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }

      const expectedUpdatedAt = editingDoc.updatedAt || editingDoc.createdAt;
      const updated = await databaseApi.updateDocument(selectedCol, editingDoc._id, parsed, expectedUpdatedAt);
      setEditingDoc(updated);
      setDocJsonText(JSON.stringify(updated, null, 2));
      setFeedbackMsg({ type: 'success', text: 'Document saved successfully!' });
      fetchCollectionDocs();
    } catch (err: any) {
      if (err.status === 409 || err.code === 'CONCURRENCY_CONFLICT') {
        const fresh = await databaseApi.getDocument(selectedCol, editingDoc._id);
        setSaveConflict({ current: fresh, conflictDiff: {} });
        setFeedbackMsg({ type: 'error', text: 'Document was updated concurrently. Please review conflicts.' });
      } else {
        setFeedbackMsg({ type: 'error', text: err.message || 'Failed to save document' });
      }
    } finally {
      setSavingDoc(false);
    }
  };

  const handleCreateDoc = async () => {
    try {
      setSavingDoc(true);
      const parsed = JSON.parse(newDocJson);
      await databaseApi.createDocument(selectedCol, parsed);
      setShowNewDocModal(false);
      setFeedbackMsg({ type: 'success', text: 'Document created successfully!' });
      fetchCollectionDocs();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create document' });
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await databaseApi.deleteDocument(selectedCol, id);
      setDocToDelete(null);
      if (editingDoc?._id === id) setEditingDoc(null);
      setFeedbackMsg({ type: 'success', text: 'Document deleted successfully!' });
      fetchCollectionDocs();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete document' });
    }
  };

  const handleExecuteBulk = async () => {
    if (selectedDocIds.length === 0 || !bulkActionType) return;
    try {
      await databaseApi.bulkAction(selectedCol, selectedDocIds, bulkActionType as any);
      setBulkDeleteConfirm(false);
      setBulkActionType('');
      setFeedbackMsg({ type: 'success', text: `Applied bulk ${bulkActionType} to ${selectedDocIds.length} documents!` });
      fetchCollectionDocs();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Bulk action failed' });
    }
  };

  const currentMeta = collections.find((c) => c.key === selectedCol);

  return (
    <div className="flex h-[calc(100vh-140px)] overflow-hidden">
      {/* Left Sidebar: Collections list */}
      <div className="w-60 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 p-4 space-y-2 overflow-y-auto hidden md:block">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Collections ({collections.length})
        </div>
        {collections.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setSelectedCol(c.key);
              setPage(1);
            }}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
              selectedCol === c.key
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-750'
            }`}
          >
            <span className="truncate">{c.label}</span>
            <span className="text-[10px] font-mono opacity-80">{c.uniqueKey}</span>
          </button>
        ))}
      </div>

      {/* Main Browse Table Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900">
        {/* Top Control Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-1.5">
              <span>{currentMeta?.label || selectedCol}</span>
              <span className="text-xs font-normal text-gray-500 font-mono">({data?.total || 0} total)</span>
            </h1>

            {/* Mobile collection dropdown */}
            <div className="md:hidden">
              <select
                value={selectedCol}
                onChange={(e) => setSelectedCol(e.target.value as any)}
                className="px-2 py-1 text-xs rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                {collections.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search form */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-48 sm:w-64 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </form>

            <button
              type="button"
              onClick={() => setShowNewDocModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMsg && (
          <div className={`px-4 py-2 text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
          }`}>
            <span>{feedbackMsg.text}</span>
            <button type="button" onClick={() => setFeedbackMsg(null)}>✕</button>
          </div>
        )}

        {/* Bulk Action Bar if selected */}
        {selectedDocIds.length > 0 && (
          <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">
              {selectedDocIds.length} documents selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setBulkActionType('publish');
                  handleExecuteBulk();
                }}
                className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded-lg border font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
              >
                Publish All
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkActionType('unpublish');
                  handleExecuteBulk();
                }}
                className="px-2.5 py-1 bg-white dark:bg-gray-800 rounded-lg border font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100"
              >
                Unpublish All
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkActionType('delete');
                  setBulkDeleteConfirm(true);
                }}
                className="px-2.5 py-1 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-8 flex items-center justify-center space-x-2 text-gray-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Fetching documents...</span>
            </div>
          ) : !data || data.docs.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              No documents found matching current filter or search criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-xs">
              <thead className="bg-gray-50 dark:bg-gray-850 text-gray-500 sticky top-0">
                <tr>
                  <th className="w-8 px-4 py-2.5 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDocIds.length === data.docs.length && data.docs.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedDocIds(data.docs.map((d: any) => d._id));
                        else setSelectedDocIds([]);
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  {(currentMeta?.defaultColumns || ['_id', 'slug', 'name', 'title', 'createdAt']).map((col) => (
                    <th
                      key={col}
                      onClick={() => {
                        if (sortField === col) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else {
                          setSortField(col);
                          setSortOrder('asc');
                        }
                      }}
                      className="px-4 py-2.5 text-left font-medium cursor-pointer hover:text-gray-900 dark:hover:text-gray-200 select-none"
                    >
                      {col} {sortField === col ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {data.docs.map((doc: any) => (
                  <tr
                    key={doc._id}
                    className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 cursor-pointer transition"
                    onClick={() => handleOpenDoc(doc)}
                  >
                    <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedDocIds([...selectedDocIds, doc._id]);
                          else setSelectedDocIds(selectedDocIds.filter((id) => id !== doc._id));
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    {(currentMeta?.defaultColumns || ['_id', 'slug', 'name', 'title', 'createdAt']).map((col) => {
                      const val = doc[col];
                      return (
                        <td key={col} className="px-4 py-2.5 max-w-xs truncate font-mono text-gray-700 dark:text-gray-300">
                          {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '')}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenDoc(doc)}
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        title="Edit Document"
                      >
                        <Edit className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocToDelete(doc._id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        {data && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
            <div>
              Showing page {data.page} of {data.totalPages} ({data.total} total items)
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded-lg border dark:border-gray-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded-lg border dark:border-gray-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Document Detail / Editor Drawer */}
      {editingDoc && (
        <div className="w-96 lg:w-[480px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 p-4 flex flex-col space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                Document Editor
              </h3>
              <span className="text-[11px] font-mono text-gray-400">{editingDoc._id}</span>
            </div>
            <button
              type="button"
              onClick={() => setEditingDoc(null)}
              className="text-gray-400 hover:text-gray-600 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Related chips & Backlinks */}
          {backlinks.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1">
                <LinkIcon className="w-3 h-3" />
                <span>Referenced by {backlinks.length} documents:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {backlinks.map((bl, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                  >
                    <span>{bl.collection}: {bl.title}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conflict diff display if 409 occurred */}
          {saveConflict && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 rounded-xl space-y-2">
              <div className="text-xs font-bold text-red-800 dark:text-red-300 flex items-center space-x-1">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Concurrency Conflict (409)</span>
              </div>
              <p className="text-[11px] text-red-700 dark:text-red-400">
                Another admin modified this document. Refreshing doc data with latest state.
              </p>
            </div>
          )}

          {/* JSON Editor */}
          <div className="flex-1 flex flex-col space-y-2">
            <JsonEditor
              value={docJsonText}
              onChange={setDocJsonText}
              minHeight="420px"
            />
          </div>

          {/* Save / Delete footer */}
          <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDocToDelete(editingDoc._id)}
              className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDoc}
              disabled={savingDoc}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingDoc ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDangerDialog
        isOpen={Boolean(docToDelete)}
        title="Delete Document"
        message="This document will be permanently removed from MongoDB."
        confirmKeyword="DELETE"
        onConfirm={() => docToDelete && handleDeleteDoc(docToDelete)}
        onCancel={() => setDocToDelete(null)}
      />

      {/* Bulk Delete Modal */}
      <ConfirmDangerDialog
        isOpen={bulkDeleteConfirm}
        title={`Bulk Delete ${selectedDocIds.length} Documents`}
        message={`All ${selectedDocIds.length} selected documents in ${selectedCol} will be permanently removed.`}
        confirmKeyword={selectedCol}
        onConfirm={handleExecuteBulk}
        onCancel={() => setBulkDeleteConfirm(false)}
      />

      {/* Create New Document Modal */}
      {showNewDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-850 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-gray-100">
                New Document in {selectedCol}
              </h3>
              <button
                type="button"
                onClick={() => setShowNewDocModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            <JsonEditor value={newDocJson} onChange={setNewDocJson} minHeight="280px" />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNewDocModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateDoc}
                disabled={savingDoc}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                {savingDoc ? 'Creating...' : 'Create Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

