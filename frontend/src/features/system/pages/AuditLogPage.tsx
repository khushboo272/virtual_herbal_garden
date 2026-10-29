import React, { useState, useEffect, useCallback } from 'react';
import { systemApi } from '../api/system.api';
import { useReauth } from '../hooks/useReauth';
import { ReauthDialog } from '../components/ReauthDialog';
import { DiffViewer } from '../components/DiffViewer';
import { IAuditLogItem, IAuditSummary, ISecurityEvents } from '../types/system.types';
import {
  ScrollText,
  ShieldAlert,
  Download,
  Filter,
  Search,
  Calendar,
  AlertTriangle,
  Info,
  Clock,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export const AuditLogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'activity' | 'security'>('activity');

  // Document title
  useEffect(() => {
    document.title = 'Audit Log & Security Events — Virtual Herbal Garden';
  }, []);

  // Reauth hook for CSV export
  const {
    isOpen: isReauthOpen,
    openDialog: openReauthDialog,
    closeDialog: closeReauthDialog,
    submitReauth,
    executeWithReauth,
    isLoading: isReauthLoading,
    error: reauthError,
  } = useReauth();

  // Filters & Pagination for Activity Log
  const [actorSearch, setActorSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [qSearch, setQSearch] = useState('');
  const [page, setPage] = useState(1);

  // Data states
  const [logs, setLogs] = useState<IAuditLogItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [summary, setSummary] = useState<IAuditSummary | null>(null);

  // Security Events states
  const [securityEvents, setSecurityEvents] = useState<ISecurityEvents | null>(null);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);

  // Detail Drawer state
  const [selectedLog, setSelectedLog] = useState<IAuditLogItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSummary = useCallback(async () => {
    try {
      const data = await systemApi.getAuditSummary();
      setSummary(data);
    } catch {
      // Non-critical
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (actorSearch.trim()) params.actor = actorSearch.trim();
      if (actionFilter) params.action = actionFilter;
      if (targetTypeFilter !== 'ALL') params.targetType = targetTypeFilter;
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      if (qSearch.trim()) params.q = qSearch.trim();

      const result = await systemApi.getAuditLogs(params);
      setLogs(result.logs || []);
      setMeta(result.meta);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch audit logs' });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [page, actorSearch, actionFilter, targetTypeFilter, severityFilter, fromDate, toDate, qSearch]);

  const loadSecurityEvents = useCallback(async () => {
    setIsLoadingSecurity(true);
    try {
      const data = await systemApi.getSecurityEvents();
      setSecurityEvents(data);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to fetch security events' });
    } finally {
      setIsLoadingSecurity(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadLogs();
    } else {
      loadSecurityEvents();
    }
  }, [activeTab, loadLogs, loadSecurityEvents]);

  const handleExportCsv = async () => {
    setStatusMessage(null);
    try {
      await executeWithReauth(async (reauthToken) => {
        const params: Record<string, any> = {};
        if (actionFilter) params.action = actionFilter;
        if (severityFilter !== 'ALL') params.severity = severityFilter;
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
        await systemApi.exportAuditLogsCsv(params, reauthToken);
      });
      setStatusMessage({ type: 'success', text: 'Audit logs exported successfully' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to export audit logs' });
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            CRITICAL
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            WARN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Info className="w-3 h-3 text-emerald-600" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">System Audit Log</h1>
          <p className="text-xs sm:text-sm text-emerald-700/80 mt-1">
            Immutable, append-only security logs, administrative mutation records, and threat monitoring.
          </p>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-emerald-50 border border-emerald-200 rounded-2xl shrink-0">
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'activity'
                  ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <ScrollText className="w-3.5 h-3.5 text-emerald-600" />
              Activity Log
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'security'
                  ? 'bg-white text-emerald-900 shadow-sm border border-emerald-200'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
              Security Events
            </button>
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Past 24 Hours</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">{summary.totals?.last24h || 0}</p>
            <p className="text-[10px] text-gray-400 mt-1">Logged actions</p>
          </div>
          <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Past 7 Days</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">{summary.totals?.last7d || 0}</p>
            <p className="text-[10px] text-gray-400 mt-1">Logged actions</p>
          </div>
          <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Past 30 Days</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">{summary.totals?.last30d || 0}</p>
            <p className="text-[10px] text-gray-400 mt-1">Total recorded</p>
          </div>
          <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Top Administrator</p>
            <p className="text-sm font-bold text-emerald-900 mt-1 truncate">
              {summary.topActors?.[0]?.user?.displayName || 'None'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {summary.topActors?.[0]?.count || 0} actions recorded
            </p>
          </div>
        </div>
      )}

      {/* TAB 1: Activity Log */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Actor Search</label>
                <input
                  type="text"
                  value={actorSearch}
                  onChange={(e) => { setActorSearch(e.target.value); setPage(1); }}
                  placeholder="Name or email..."
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">All Actions</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGIN_FAILED">LOGIN_FAILED</option>
                  <option value="LOGOUT_ALL">LOGOUT_ALL</option>
                  <option value="ROLE_CHANGE">ROLE_CHANGE</option>
                  <option value="USER_BAN">USER_BAN</option>
                  <option value="USER_UNBAN">USER_UNBAN</option>
                  <option value="CONTENT_APPROVE">CONTENT_APPROVE</option>
                  <option value="CONTENT_REJECT">CONTENT_REJECT</option>
                  <option value="CONTENT_PUBLISH">CONTENT_PUBLISH</option>
                  <option value="CONTENT_UNPUBLISH">CONTENT_UNPUBLISH</option>
                  <option value="CONTENT_DELETE">CONTENT_DELETE</option>
                  <option value="REAUTH_SUCCESS">REAUTH_SUCCESS</option>
                  <option value="EXPORT">EXPORT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Target Type</label>
                <select
                  value={targetTypeFilter}
                  onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1); }}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="ALL">All Entities</option>
                  <option value="User">User</option>
                  <option value="Plant">Plant</option>
                  <option value="Remedy">Remedy</option>
                  <option value="Session">Session</option>
                  <option value="SystemConfig">SystemConfig</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="ALL">All Severities</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                  className="w-full p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <input
                type="text"
                value={qSearch}
                onChange={(e) => { setQSearch(e.target.value); setPage(1); }}
                placeholder="Search across log details, IP address, user agent..."
                className="w-full max-w-md p-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => {
                  setActorSearch('');
                  setActionFilter('');
                  setTargetTypeFilter('ALL');
                  setSeverityFilter('ALL');
                  setFromDate('');
                  setToDate('');
                  setQSearch('');
                  setPage(1);
                }}
                className="text-xs text-gray-500 hover:text-emerald-700 font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Activity Table */}
          <div className="border border-emerald-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-emerald-50/70 border-b border-emerald-100 text-emerald-900 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Querying audit events...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        No audit log entries match the specified filters.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const actor = log.user;
                      const fallbackEmail = (log.newValue as any)?.email;
                      const dateObj = new Date(log.createdAt);

                      return (
                        <tr
                          key={log._id}
                          onClick={() => setSelectedLog(log)}
                          className="hover:bg-emerald-50/30 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-semibold text-gray-900">{format(dateObj, 'MMM d, yyyy HH:mm:ss')}</p>
                            <p className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {formatDistanceToNow(dateObj, { addSuffix: true })}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            {actor ? (
                              <div>
                                <p className="font-medium text-gray-900">{actor.displayName}</p>
                                <p className="text-[11px] text-gray-500 font-mono">{actor.email}</p>
                              </div>
                            ) : fallbackEmail ? (
                              <div>
                                <p className="font-medium text-gray-700 italic">Unauthenticated</p>
                                <p className="text-[11px] text-gray-500 font-mono">{fallbackEmail}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">System Event</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-emerald-950">
                            {log.action}
                          </td>
                          <td className="py-3 px-4">{getSeverityBadge(log.severity)}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                              {log.entityType}
                              {log.entityId && <span className="text-gray-400">• {log.entityId.slice(-6)}</span>}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-gray-600">{log.ipAddress}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                            >
                              Inspect Diff
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-gray-50/70 border-t border-emerald-100 flex items-center justify-between text-xs text-gray-600">
              <p>
                Page <span className="font-semibold text-gray-800">{meta.page}</span> of{' '}
                <span className="font-semibold text-gray-800">{meta.totalPages}</span> ({meta.total} records)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1 font-medium"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Security Events */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {isLoadingSecurity ? (
            <div className="py-16 text-center text-gray-400">Loading security intelligence...</div>
          ) : !securityEvents ? (
            <div className="py-16 text-center text-gray-400">No security events found.</div>
          ) : (
            <>
              {/* Suspicious IPs Alert Box */}
              <div className="border border-red-200 bg-red-50/60 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <h3>Suspicious IP Addresses (≥ 5 failed logins within 10 minutes)</h3>
                </div>
                {(securityEvents.suspiciousIps || []).length === 0 ? (
                  <p className="text-xs text-red-700/80">
                    No suspicious IP addresses currently detected. System activity is normal.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {(securityEvents.suspiciousIps || []).map((s) => (
                      <div key={s.ip} className="p-3 bg-white border border-red-200 rounded-xl text-xs space-y-1">
                        <p className="font-mono font-bold text-red-900 text-sm">{s.ip}</p>
                        <p className="text-gray-600 font-medium">{s.failedAttempts} failed attempts</p>
                        <p className="text-[11px] text-gray-400 truncate">{s.userAgent}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Failed Logins by IP & Day */}
              <div className="border border-emerald-200 bg-white rounded-2xl shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-700" />
                  Failed Authentication Attempts by IP & Date
                </h3>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 px-3">Failed Count</th>
                        <th className="py-2.5 px-3">Most Recent Attempt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(securityEvents.failedLoginsByDay || (securityEvents as any).failedLogins || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-gray-400">
                            Zero failed logins in the past 30 days.
                          </td>
                        </tr>
                      ) : (
                        (securityEvents.failedLoginsByDay || (securityEvents as any).failedLogins || []).map((f: any, i: number) => (
                          <tr key={`${f.ip}-${f.day}-${i}`} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 font-semibold text-gray-800">{f.day}</td>
                            <td className="py-2.5 px-3 font-mono text-gray-600">{f.ip}</td>
                            <td className="py-2.5 px-3 font-bold text-red-600">{f.count}</td>
                            <td className="py-2.5 px-3 text-gray-500">
                              {f.lastAttempt ? format(new Date(f.lastAttempt), 'HH:mm:ss') : 'N/A'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lockouts */}
              <div className="border border-emerald-200 bg-white rounded-2xl shadow-sm p-5 space-y-4">
                <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Recent Account Lockouts
                </h3>
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 uppercase font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 px-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const lockoutsList = securityEvents.lockouts || (securityEvents as any).recentLockouts || [];
                        if (lockoutsList.length === 0) {
                          return (
                            <tr>
                              <td colSpan={3} className="py-6 text-center text-gray-400">
                                No recent account lockout events.
                              </td>
                            </tr>
                          );
                        }
                        return lockoutsList.map((l: any, idx: number) => (
                          <tr key={l.id || idx} className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 text-gray-800">
                              {format(new Date(l.createdAt || l.lockedAt || Date.now()), 'MMM d, HH:mm:ss')}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-gray-600">{l.ip}</td>
                            <td className="py-2.5 px-3 text-red-700 font-medium">
                              {l.details?.reason || 'Exceeded failed password attempts'}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Detail Drawer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border-2 border-emerald-200 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base">{selectedLog.action}</span>
                  {getSeverityBadge(selectedLog.severity)}
                </div>
                <p className="text-xs text-emerald-200 mt-1">
                  Event ID: <span className="font-mono">{selectedLog._id}</span> •{' '}
                  {format(new Date(selectedLog.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Actor & Entity Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Actor</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {selectedLog.user ? selectedLog.user.displayName : 'System / Anonymous'}
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {selectedLog.user?.email || (selectedLog.newValue as any)?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Target Entity</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{selectedLog.entityType}</p>
                  <p className="text-[11px] text-gray-500 font-mono">{selectedLog.entityId || 'None'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">Network Origin</p>
                  <p className="font-mono text-gray-800 mt-0.5">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase">User-Agent</p>
                  <p className="text-gray-700 truncate mt-0.5" title={selectedLog.userAgent}>
                    {selectedLog.userAgent}
                  </p>
                </div>
              </div>

              {/* Before/After Diff Viewer */}
              <div>
                <h4 className="font-bold text-gray-800 text-sm mb-2">Before & After Changes</h4>
                <DiffViewer oldValue={selectedLog.oldValue} newValue={selectedLog.newValue} />
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 text-right shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step-Up Reauth Dialog for CSV Export */}
      <ReauthDialog
        isOpen={isReauthOpen}
        onClose={closeReauthDialog}
        onSubmit={submitReauth}
        isLoading={isReauthLoading}
        errorMessage={reauthError}
        actionTitle="Confirm Audit Log Export"
        actionDescription="Exporting immutable system audit logs requires re-authentication to guarantee data safety."
      />
    </div>
  );
};
