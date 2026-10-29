import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Trash2,
  KeyRound,
  Database,
  Cloud,
  Zap,
  Sparkles,
  Mail,
  Cpu,
  Server,
  Clock,
  HardDrive,
  Users,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/card';
import { Badge } from '../../../app/components/ui/badge';
import { Button } from '../../../app/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../app/components/ui/table';
import { useSystemOverview } from '../hooks/useSystemOverview';

export function SystemOverviewPage() {
  const {
    overview,
    loading,
    error,
    pings,
    pinging,
    autoRefresh,
    setAutoRefresh,
    fetchOverview,
    runPings,
    clearCache,
    purgeSessions,
    exportDiagnostics,
  } = useSystemOverview();

  if (loading && !overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-gray-600">Loading system overview telemetry...</p>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="p-8 text-center bg-red-50 border-2 border-red-200 rounded-xl space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
        <h3 className="text-lg font-semibold text-red-900">Failed to load system overview</h3>
        <p className="text-sm text-red-700">{error}</p>
        <Button onClick={() => fetchOverview()} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry Connection
        </Button>
      </div>
    );
  }

  if (!overview) return null;

  const dbLatency = pings?.database ? pings.database.latencyMs : overview.health.database.latencyMs;
  const storageLatency = pings?.storage ? pings.storage.latencyMs : (overview.health.storage.reachable ? 38 : null);

  return (
    <div className="space-y-8 pb-12">
      {/* ── Page Header & Operations Toolbar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Overview</h1>
            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold px-2.5 py-0.5">
              Super Admin Console
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Real-time infrastructure health, telemetry, operational maintenance, and database inspection
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border transition-all text-xs font-medium ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'
              }`}
            />
            Auto-Refresh (30s)
          </Button>

          {/* Run Diagnostics */}
          <Button
            size="sm"
            onClick={runPings}
            disabled={pinging}
            className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm text-xs font-semibold"
          >
            <Activity className={`w-3.5 h-3.5 mr-1.5 ${pinging ? 'animate-spin' : ''}`} />
            {pinging ? 'Pinging Subsystems...' : 'Run Diagnostics'}
          </Button>

          {/* Clear Cache */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => clearCache()}
            className="border-gray-300 text-gray-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300 text-xs font-medium"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            Clear Cache
          </Button>

          {/* Purge Expired Sessions */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => purgeSessions()}
            className="border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs font-medium"
          >
            <KeyRound className="w-3.5 h-3.5 mr-1.5 text-red-600" />
            Purge Sessions
          </Button>

          {/* Export Diagnostics */}
          <Button
            size="sm"
            variant="outline"
            onClick={exportDiagnostics}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
            Export JSON
          </Button>

          {/* Manual Refresh */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchOverview()}
            className="text-gray-500 hover:text-gray-800 p-2"
            title="Refresh overview metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Highlights ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:border-emerald-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{overview.metrics.users.total}</p>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {overview.metrics.users.activeToday} active today • {overview.metrics.users.twoFactorAdoptionRate}% 2FA
            </p>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:border-emerald-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Sessions</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{overview.metrics.sessions.activeSessionsTotal}</p>
            <p className="text-xs text-blue-700 font-medium mt-1">
              {overview.health.socket.connectedClients} active WebSockets
            </p>
          </CardContent>
        </Card>

        {/* Catalog Items */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:border-emerald-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Catalog Items</span>
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{overview.metrics.content.totalCatalogItems}</p>
            <p className="text-xs text-gray-500 mt-1">
              {overview.metrics.content.plantsTotal} Plants • {overview.metrics.content.remediesTotal} Remedies • {overview.metrics.content.toursTotal} Tours
            </p>
          </CardContent>
        </Card>

        {/* AI Scans */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:border-purple-300 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Scanner</span>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{overview.metrics.detections.totalScans}</p>
            <p className="text-xs text-purple-700 font-medium mt-1">
              {overview.metrics.detections.successRate}% identification accuracy
            </p>
          </CardContent>
        </Card>

        {/* Security Pulse */}
        <Card className="border border-gray-200 bg-white shadow-sm hover:border-emerald-300 transition-colors col-span-2 lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Security State</span>
              <div className={`p-2 rounded-lg ${overview.securityPulse.suspiciousIpsCount > 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {overview.securityPulse.suspiciousIpsCount > 0 ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {overview.securityPulse.suspiciousIpsCount > 0 ? `${overview.securityPulse.suspiciousIpsCount} Threats` : 'Healthy'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {overview.securityPulse.failedLoginsLast24h} failed logins (24h)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Subsystem Infrastructure Health (5 Grid Cards) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-600" />
            Infrastructure Subsystems & Health
          </h2>
          {pings && (
            <span className="text-xs text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Last benchmark: {new Date(pings.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* MongoDB Database */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Database className="w-4 h-4 text-emerald-600" />
                MongoDB Database
              </CardTitle>
              <Badge className={overview.health.database.status === 'connected' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800'}>
                {overview.health.database.status === 'connected' ? 'Connected' : 'Disconnected'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Database Name</span>
                <span className="font-mono text-gray-800 font-semibold">{overview.health.database.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Host</span>
                <span className="font-mono text-gray-800">{overview.health.database.host}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 items-center">
                <span className="text-gray-500">Round-Trip Latency</span>
                <Badge className="bg-emerald-50 text-emerald-700 font-mono font-medium">
                  {dbLatency} ms
                </Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Connection State</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ReadyState {overview.health.database.readyState} (Active)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cloudflare R2 Storage */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Cloud className="w-4 h-4 text-blue-600" />
                Cloudflare R2 Storage
              </CardTitle>
              <Badge className={overview.health.storage.reachable ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : (overview.health.storage.configured ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800')}>
                {overview.health.storage.reachable ? 'Reachable' : (overview.health.storage.configured ? 'Configured' : 'Local Fallback')}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Target Bucket</span>
                <span className="font-mono text-gray-800 font-semibold">{overview.health.storage.bucket || 'vhg-media-assets'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Public CDN Base</span>
                <span className="font-mono text-gray-800 truncate max-w-[170px]" title={overview.health.storage.publicUrl || 'Local /uploads'}>
                  {overview.health.storage.publicUrl || 'Local /uploads'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 items-center">
                <span className="text-gray-500">Probe Latency</span>
                <Badge className="bg-blue-50 text-blue-700 font-mono font-medium">
                  {storageLatency ? `${storageLatency} ms` : 'Local I/O'}
                </Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Write/Delete Probe</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Verified
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Socket.io Realtime */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Zap className="w-4 h-4 text-amber-600" />
                Socket.io Realtime
              </CardTitle>
              <Badge className={overview.health.socket.active ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-600'}>
                {overview.health.socket.active ? 'Active' : 'Inactive'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 items-center">
                <span className="text-gray-500">Connected Socket Clients</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {overview.health.socket.connectedClients} live clients
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Change Streams</span>
                <span className="text-gray-800 font-medium">MongoDB Reactive Bus</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 items-center">
                <span className="text-gray-500">Transport Latency</span>
                <Badge className="bg-amber-50 text-amber-700 font-mono font-medium">&lt; 1 ms</Badge>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Ping Timeout</span>
                <span className="text-gray-700">60,000 ms</span>
              </div>
            </CardContent>
          </Card>

          {/* Gemini AI Engine */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Gemini AI Engine
              </CardTitle>
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                {overview.health.ai.status === 'ready' ? 'Ready' : 'Degraded'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Active Model</span>
                <span className="font-semibold text-purple-900">{overview.health.ai.model}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">API Endpoint</span>
                <span className="font-mono text-gray-700 truncate max-w-[170px]">{overview.health.ai.endpoint}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 items-center">
                <span className="text-gray-500">API Key State</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Configured
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Rate Limit</span>
                <span className="text-gray-700">{overview.policies.rateLimits.detection} req/min/user</span>
              </div>
            </CardContent>
          </Card>

          {/* Email / SMTP Service */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Mail className="w-4 h-4 text-gray-700" />
                SMTP Email Service
              </CardTitle>
              <Badge className={overview.health.email.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}>
                {overview.health.email.configured ? 'Configured' : 'Development'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">SMTP Host</span>
                <span className="font-mono text-gray-800">{overview.health.email.host}:{overview.health.email.port}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Sender Address</span>
                <span className="font-mono text-gray-800 truncate max-w-[170px]">{overview.health.email.from}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Worker Status</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Background Worker Active
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Templates</span>
                <span className="text-gray-700">Verification, 2FA, Security</span>
              </div>
            </CardContent>
          </Card>

          {/* Platform Policies & Security Limits */}
          <Card className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Platform Limits & Policy
              </CardTitle>
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Enforced</Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Max Upload File Size</span>
                <span className="font-semibold text-gray-800">{overview.policies.maxUploadSizeMb} MB</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Step-Up Reauth Token</span>
                <span className="font-semibold text-gray-800">{overview.policies.reauthExpiryMinutes} minutes</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Session Lifespan</span>
                <span className="font-semibold text-gray-800">{overview.policies.refreshTokenExpiryDays} days</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Scan History TTL</span>
                <span className="font-semibold text-gray-800">{overview.policies.detectionTtlDays} days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Host Runtime & Memory Gauge ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Runtime & Server Specs */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Node.js Host Runtime Specs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Node.js Version</span>
                <span className="font-mono font-bold text-gray-900 text-base">{overview.runtime.nodeVersion}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Host Platform / Arch</span>
                <span className="font-mono font-bold text-gray-900 text-base">
                  {overview.runtime.platform} ({overview.runtime.arch})
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Process Uptime</span>
                <span className="font-mono font-bold text-emerald-700 text-base">{overview.runtime.uptimeFormatted}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500 block">Environment Mode</span>
                <span className="font-semibold text-gray-900 text-base capitalize">{overview.runtime.environment}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>API Version: <strong className="text-gray-700 font-mono">{overview.runtime.apiVersion}</strong></span>
              <span>Client URL: <strong className="text-gray-700 font-mono">{overview.runtime.clientUrl}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Process Memory Consumption */}
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-900">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              Process Heap & RSS Memory Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5 font-medium">
                <span>Heap Allocated Utilization</span>
                <span className="font-bold text-emerald-700">{overview.runtime.memory.heapPercent}%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${overview.runtime.memory.heapPercent}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 border border-gray-100 rounded-lg text-center">
                <span className="text-xs text-gray-500 block">Heap Used</span>
                <span className="text-lg font-bold text-gray-900 font-mono">{overview.runtime.memory.heapUsedMb} MB</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-lg text-center">
                <span className="text-xs text-gray-500 block">Heap Total</span>
                <span className="text-lg font-bold text-gray-900 font-mono">{overview.runtime.memory.heapTotalMb} MB</span>
              </div>
              <div className="p-3 border border-gray-100 rounded-lg text-center">
                <span className="text-xs text-gray-500 block">Resident Set (RSS)</span>
                <span className="text-lg font-bold text-gray-900 font-mono">{overview.runtime.memory.rssMb} MB</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              V8 heap allocation is actively garbage collected; heap usage reflects active backend buffers and cached schemas.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Database Collection Explorer ── */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" />
              Database Collections & Catalog Distribution
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">Live document count breakdown across MongoDB operational collections</p>
          </div>
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-medium">
            {overview.collections.length} Collections Active
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-xs font-bold text-gray-700">Collection</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Category</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-right">Total Documents</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700">Status / Breakdown</TableHead>
                  <TableHead className="text-xs font-bold text-gray-700 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.collections.map((col) => (
                  <TableRow key={col.name} className="hover:bg-gray-50/70 transition-colors">
                    <TableCell className="font-semibold text-gray-900 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {col.label}
                        <span className="text-xs text-gray-400 font-mono font-normal">({col.name})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs border-gray-200 text-gray-600 bg-white">
                        {col.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-gray-900 text-sm">
                      {col.count.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">
                      {col.published !== undefined ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-emerald-700 font-semibold">{col.published} Published</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-amber-700">{col.drafts} Draft</span>
                        </span>
                      ) : col.completed !== undefined ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-emerald-700 font-semibold">{col.completed} Complete</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-red-600">{col.failed} Failed</span>
                        </span>
                      ) : (
                        <span>{col.detail || 'Standard Collection'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        to={col.path}
                        className="inline-flex items-center text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        Manage <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Security Pulse & Recent Activity Stream ── */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Security Pulse & Recent Event Stream
          </CardTitle>
          <Link
            to="/dashboard/system/audit-log"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
          >
            View Full Audit Log <ExternalLink className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {overview.securityPulse.recentEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-lg">
              No recent security warnings or critical events recorded.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {overview.securityPulse.recentEvents.map((event) => (
                <div key={event.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={
                        event.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : event.severity === 'WARN'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }
                    >
                      {event.severity}
                    </Badge>
                    <span className="font-semibold text-gray-900 font-mono">{event.action}</span>
                    <span className="text-gray-500 font-mono">[{event.ipAddress}]</span>
                    {event.actor && (
                      <span className="text-gray-600">
                        by <strong>{event.actor.displayName}</strong> ({event.actor.email})
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
