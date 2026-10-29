import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Plus,
  RotateCcw,
  Download,
  Search,
  Sliders,
  Sparkles,
  Bot,
  Users,
  Terminal,
  Activity,
  Trash2,
  RefreshCw,
  Copy,
  Info,
  Check,
  Clock,
  Wrench,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../../app/components/ui/card';
import { Badge } from '../../../app/components/ui/badge';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../app/components/ui/dialog';
import { featureFlagApi } from '../api/featureFlag.api';
import {
  IFeatureFlag,
  IFeatureFlagsSummary,
  FeatureFlagCategory,
  UserRoleType,
} from '../types/featureFlag.types';

const CATEGORIES: { label: string; value: FeatureFlagCategory | 'ALL'; icon: any }[] = [
  { label: 'All Categories', value: 'ALL', icon: Layers },
  { label: 'Experience & 3D', value: 'EXPERIENCE', icon: Sparkles },
  { label: 'AI & Vision', value: 'AI', icon: Bot },
  { label: 'Community', value: 'COMMUNITY', icon: Users },
  { label: 'System & Core', value: 'SYSTEM', icon: Terminal },
  { label: 'Experimental', value: 'EXPERIMENTAL', icon: Sliders },
];

const ROLES: UserRoleType[] = ['GUEST', 'USER', 'BOTANIST', 'ADMIN', 'SUPER_ADMIN'];

// Core active features shown prominently in the Active Feature Flags section (matching original layout)
const PRIMARY_FEATURE_KEYS = [
  '3d_garden',
  'ai_scanner',
  'guided_tours',
  'maintenance_mode',
  'new_user_registration',
];

export function FeatureFlagsPage() {
  const [flags, setFlags] = useState<IFeatureFlag[]>([]);
  const [summary, setSummary] = useState<IFeatureFlagsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FeatureFlagCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED' | 'CANARY'>('ALL');

  // Modals & Drawers state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editFlag, setEditFlag] = useState<IFeatureFlag | null>(null);
  const [deleteFlag, setDeleteFlag] = useState<IFeatureFlag | null>(null);

  // Create form state
  const [createKey, setCreateKey] = useState('');
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createCategory, setCreateCategory] = useState<FeatureFlagCategory>('EXPERIENCE');
  const [createIsEnabled, setCreateIsEnabled] = useState(true);
  const [createRollout, setCreateRollout] = useState(100);
  const [createMinRole, setCreateMinRole] = useState<UserRoleType>('USER');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Edit form state
  const [editRollout, setEditRollout] = useState(100);
  const [editMinRole, setEditMinRole] = useState<UserRoleType>('USER');
  const [editDescription, setEditDescription] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Maintenance Mode Controller state
  const [maintEnabled, setMaintEnabled] = useState(false);
  const [maintReopenDate, setMaintReopenDate] = useState('');
  const [maintHeadline, setMaintHeadline] = useState('Platform Maintenance in Progress');
  const [maintReason, setMaintReason] = useState(
    'We are performing essential scheduled maintenance and botanical database optimization.'
  );
  const [maintAllowedRoles, setMaintAllowedRoles] = useState<UserRoleType[]>([
    'SUPER_ADMIN',
    'ADMIN',
  ]);
  const [maintSaving, setMaintSaving] = useState(false);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await featureFlagApi.getFeatureFlags();
      setFlags(res.flags || []);
      setSummary(res.summary || null);

      // Preload maintenance mode settings
      const mFlag = res.flags.find((f) => f.key === 'maintenance_mode');
      if (mFlag) {
        setMaintEnabled(mFlag.isEnabled);
        if (mFlag.metadata?.reopenAt) {
          // Format for datetime-local
          const d = new Date(mFlag.metadata.reopenAt);
          const tzOffset = d.getTimezoneOffset() * 60000;
          const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
          setMaintReopenDate(localISOTime);
        }
        if (mFlag.metadata?.headline) setMaintHeadline(mFlag.metadata.headline);
        if (mFlag.metadata?.reason) setMaintReason(mFlag.metadata.reason);
        if (mFlag.metadata?.allowedRoles) setMaintAllowedRoles(mFlag.metadata.allowedRoles);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load feature flags from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = async (flag: IFeatureFlag) => {
    const originalState = flag.isEnabled;
    const newState = !originalState;

    // If turning on maintenance mode, open maintenance modal with state active to allow configuring reopen time
    if (flag.key === 'maintenance_mode' && newState) {
      setMaintEnabled(true);
      setIsMaintenanceModalOpen(true);
      return;
    }

    // Optimistic UI update
    setFlags((prev) =>
      prev.map((f) => (f.key === flag.key ? { ...f, isEnabled: newState } : f))
    );
    if (summary) {
      setSummary({
        ...summary,
        enabledCount: newState ? summary.enabledCount + 1 : summary.enabledCount - 1,
        disabledCount: newState ? summary.disabledCount - 1 : summary.disabledCount + 1,
      });
    }

    try {
      await featureFlagApi.updateFeatureFlag(flag.key, { isEnabled: newState });
      toast.success(
        `Feature '${flag.name}' ${newState ? 'enabled' : 'disabled'} successfully.`
      );
    } catch (err: any) {
      // Revert on error
      setFlags((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, isEnabled: originalState } : f))
      );
      toast.error(err.message || 'Failed to toggle feature flag.');
    }
  };

  const handleSaveMaintenanceSchedule = async () => {
    try {
      setMaintSaving(true);
      let isoReopenAt: string | null = null;
      if (maintReopenDate && maintEnabled) {
        isoReopenAt = new Date(maintReopenDate).toISOString();
      }

      await featureFlagApi.updateMaintenanceConfig({
        isEnabled: maintEnabled,
        reopenAt: maintEnabled ? isoReopenAt : null,
        headline: maintHeadline.trim() || 'Platform Maintenance in Progress',
        reason: maintReason.trim() || 'We are performing essential scheduled maintenance.',
        allowedRoles: maintAllowedRoles,
      });

      // Optimistic state update so row reflects change immediately
      setFlags((prev) =>
        prev.map((f) =>
          f.key === 'maintenance_mode'
            ? {
                ...f,
                isEnabled: maintEnabled,
                metadata: {
                  ...f.metadata,
                  reopenAt: maintEnabled ? isoReopenAt : null,
                  headline: maintHeadline.trim(),
                  reason: maintReason.trim(),
                  allowedRoles: maintAllowedRoles,
                },
              }
            : f
        )
      );

      toast.success(
        maintEnabled
          ? 'Platform Maintenance Mode ENABLED with live countdown timer.'
          : 'Platform Maintenance Mode DISABLED. Public access restored.'
      );
      setIsMaintenanceModalOpen(false);
      fetchFlags();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update maintenance schedule.');
      fetchFlags();
    } finally {
      setMaintSaving(false);
    }
  };

  const applyDurationPreset = (minutes: number) => {
    const target = new Date(Date.now() + minutes * 60 * 1000);
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISO = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setMaintReopenDate(localISO);
    setMaintEnabled(true);
  };

  const openEditModal = (flag: IFeatureFlag) => {
    if (flag.key === 'maintenance_mode') {
      setMaintEnabled(true);
      setIsMaintenanceModalOpen(true);
      return;
    }
    setEditFlag(flag);
    setEditRollout(flag.rolloutPercentage ?? 100);
    setEditMinRole(flag.minimumRole || 'USER');
    setEditDescription(flag.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editFlag) return;
    try {
      setEditSubmitting(true);
      const updated = await featureFlagApi.updateFeatureFlag(editFlag.key, {
        rolloutPercentage: Number(editRollout),
        minimumRole: editMinRole,
        description: editDescription.trim(),
      });
      setFlags((prev) => prev.map((f) => (f.key === updated.key ? updated : f)));
      toast.success(`Configuration for '${updated.name}' updated.`);
      setEditFlag(null);
      fetchFlags();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update feature flag.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createKey.trim() || !createName.trim()) {
      toast.error('Key and Name are required.');
      return;
    }
    try {
      setCreateSubmitting(true);
      const newFlag = await featureFlagApi.createFeatureFlag({
        key: createKey.trim().toLowerCase().replace(/\s+/g, '_'),
        name: createName.trim(),
        description: createDescription.trim(),
        category: createCategory,
        isEnabled: createIsEnabled,
        rolloutPercentage: Number(createRollout),
        minimumRole: createMinRole,
      });
      toast.success(`Feature flag '${newFlag.name}' created successfully.`);
      setIsCreateOpen(false);
      setCreateKey('');
      setCreateName('');
      setCreateDescription('');
      setCreateRollout(100);
      setCreateIsEnabled(true);
      fetchFlags();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create feature flag.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFlag) return;
    try {
      await featureFlagApi.deleteFeatureFlag(deleteFlag.key);
      toast.success(`Feature flag '${deleteFlag.name}' deleted.`);
      setDeleteFlag(null);
      fetchFlags();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete feature flag.');
    }
  };

  const handleResetDefaults = async () => {
    try {
      await featureFlagApi.resetFeatureFlags();
      toast.success('All feature flags reset to platform defaults.');
      setIsResetOpen(false);
      fetchFlags();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset feature flags.');
    }
  };

  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify({ exportedAt: new Date(), flags }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `feature_flags_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Feature flags configuration exported to JSON.');
  };

  const copyKeyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.info(`Flag key '${key}' copied to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Group into Active Primary Features (matching Picture 3) and Additional Features
  const primaryFlags = useMemo(() => {
    return flags.filter((f) => PRIMARY_FEATURE_KEYS.includes(f.key));
  }, [flags]);

  const additionalFlags = useMemo(() => {
    return flags.filter((flag) => {
      // Exclude primary flags from additional list
      if (PRIMARY_FEATURE_KEYS.includes(flag.key)) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && flag.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'ENABLED' && !flag.isEnabled) return false;
      if (statusFilter === 'DISABLED' && flag.isEnabled) return false;
      if (statusFilter === 'CANARY' && (!flag.isEnabled || (flag.rolloutPercentage ?? 100) >= 100))
        return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesKey = flag.key.toLowerCase().includes(q);
        const matchesName = flag.name.toLowerCase().includes(q);
        const matchesDesc = (flag.description || '').toLowerCase().includes(q);
        return matchesKey || matchesName || matchesDesc;
      }
      return true;
    });
  }, [flags, selectedCategory, statusFilter, searchQuery]);

  const maintenanceFlag = flags.find((f) => f.key === 'maintenance_mode');

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header (Exact Match to Picture 3) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-green-900 tracking-tight">Feature Flags</h1>
          <p className="text-green-600 mt-1">Toggle platform features on or off</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFlags}
            disabled={loading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-semibold"
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            Maintenance Timer
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsResetOpen(true)}
            className="border-red-200 text-red-700 hover:bg-red-50 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset Defaults
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Feature Flag
          </Button>
        </div>
      </div>

      {/* ── Emergency Maintenance Mode Alert Banner (if active) ── */}
      {maintenanceFlag?.isEnabled && (
        <div className="bg-gradient-to-r from-amber-500/15 via-red-500/15 to-amber-500/15 border-2 border-red-300 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 text-red-700">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-950 text-sm sm:text-base flex items-center gap-2">
                Platform Maintenance Mode is ACTIVE
                {maintenanceFlag.metadata?.reopenAt && (
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                    Target Reopening: {new Date(maintenanceFlag.metadata.reopenAt).toLocaleTimeString()}
                  </span>
                )}
              </h3>
              <p className="text-xs text-red-900/90 mt-0.5">
                {maintenanceFlag.metadata?.headline || 'Scheduled System Maintenance'} — Non-admin users are seeing the full countdown screen.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="border-red-300 text-red-900 hover:bg-red-50 text-xs font-medium"
            >
              <Clock className="w-3.5 h-3.5 mr-1 text-red-600" />
              Adjust Timing
            </Button>
            <Button
              size="sm"
              onClick={() => handleToggle(maintenanceFlag)}
              className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs shadow-sm"
            >
              Disable Maintenance
            </Button>
          </div>
        </div>
      )}

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-gray-500">Total Flags</span>
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-gray-900">
                {summary?.total ?? flags.length}
              </span>
              <span className="text-xs text-gray-500">
                ({flags.filter((f) => f.isSystem).length} system, {flags.filter((f) => !f.isSystem).length} custom)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-gray-500">Active Features</span>
              <Activity className="w-4 h-4 text-green-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-700">
                {summary?.enabledCount ?? flags.filter((f) => f.isEnabled).length}
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                {summary?.total
                  ? `${Math.round((summary.enabledCount / summary.total) * 100)}% active`
                  : ''}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-gray-500">Canary Rollouts</span>
              <Sliders className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-700">
                {summary?.canaryCount ?? flags.filter((f) => f.isEnabled && (f.rolloutPercentage ?? 100) < 100).length}
              </span>
              <span className="text-xs text-blue-600 font-medium">&lt; 100% traffic</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-gray-500">Role Gated</span>
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-purple-700">
                {summary?.restrictedCount ?? flags.filter((f) => f.minimumRole && f.minimumRole !== 'USER' && f.minimumRole !== 'GUEST').length}
              </span>
              <span className="text-xs text-purple-600 font-medium">RBAC restricted</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── CARD 1: ACTIVE FEATURE FLAGS (Matching Picture 3 Exact Visual Accent + Added Controls) ── */}
      <Card className="border-2 border-red-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-red-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 text-lg font-bold">
              <Shield className="w-5 h-5 text-red-600" />
              Active Feature Flags
            </CardTitle>
            <span className="text-xs text-gray-500 font-medium">
              Click switch or Configure button to change runtime state
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Loading platform active flags...</p>
            </div>
          ) : primaryFlags.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No core feature flags found. Click <strong>Reset Defaults</strong> to restore them.
            </div>
          ) : (
            primaryFlags.map((flag) => {
              const isCanary = flag.isEnabled && (flag.rolloutPercentage ?? 100) < 100;
              return (
                <div
                  key={flag.key}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border-2 rounded-lg transition-all duration-200 gap-3 ${
                    flag.isEnabled
                      ? 'border-gray-200 bg-white hover:border-red-200'
                      : 'border-gray-100 bg-gray-50/70 hover:border-gray-200'
                  }`}
                >
                  {/* Left: Info */}
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{flag.name}</h4>

                      {/* Key badge */}
                      <button
                        type="button"
                        onClick={() => copyKeyToClipboard(flag.key)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200"
                        title="Click to copy key"
                      >
                        <span>{flag.key}</span>
                        {copiedKey === flag.key ? (
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-gray-400" />
                        )}
                      </button>

                      {/* Canary / Rollout pill */}
                      {isCanary && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0">
                          {flag.rolloutPercentage}% Traffic
                        </Badge>
                      )}

                      {/* Role pill if elevated */}
                      {flag.minimumRole && flag.minimumRole !== 'USER' && flag.minimumRole !== 'GUEST' && (
                        <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] py-0">
                          Role: {flag.minimumRole}
                        </Badge>
                      )}

                      {/* Maintenance timing countdown pill if active */}
                      {flag.key === 'maintenance_mode' && flag.isEnabled && flag.metadata?.reopenAt && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] py-0 font-semibold animate-pulse">
                          <Clock className="w-2.5 h-2.5 mr-1 text-amber-700" />
                          Reopening in {new Date(flag.metadata.reopenAt).toLocaleTimeString()}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed">
                      {flag.description || 'Enable or disable this platform feature.'}
                    </p>
                  </div>

                  {/* Right: Controls & Interactive Toggle */}
                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {/* Dedicated button for Maintenance Mode or Configure */}
                    {flag.key === 'maintenance_mode' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMaintEnabled(true);
                          setIsMaintenanceModalOpen(true);
                        }}
                        className="text-xs h-8 border-amber-300 text-amber-900 hover:bg-amber-50"
                      >
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                        Set Timing
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(flag)}
                        className="text-xs h-8 border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        <Sliders className="w-3.5 h-3.5 mr-1 text-gray-500" />
                        Configure
                      </Button>
                    )}

                    {/* Badge as shown in Picture 3 */}
                    <Badge
                      className={
                        flag.isEnabled
                          ? 'bg-green-100 text-green-700 border-green-300 text-xs px-2.5 py-1'
                          : 'bg-gray-100 text-gray-500 border-gray-300 text-xs px-2.5 py-1'
                      }
                    >
                      {flag.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>

                    {/* Interactive Toggle Switch */}
                    <button
                      type="button"
                      data-testid={`toggle-${flag.key}`}
                      role="switch"
                      aria-checked={flag.isEnabled}
                      onClick={() => handleToggle(flag)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        flag.isEnabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                      title={`Toggle ${flag.name}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          flag.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ── CARD 2: ADDITIONAL & CUSTOM FEATURE FLAGS (With Search, Filter Pills & Create) ── */}
      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                Additional & Experimental Capabilities
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                AI dosage advisories, high-resolution graphics, soundscapes, and custom team flags
              </p>
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search additional flags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-emerald-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-3">
          {additionalFlags.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              No additional feature flags match the search or category filters.
            </div>
          ) : (
            additionalFlags.map((flag) => {
              const isCanary = flag.isEnabled && (flag.rolloutPercentage ?? 100) < 100;
              return (
                <div
                  key={flag.key}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border rounded-lg transition-colors gap-3 ${
                    flag.isEnabled ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">{flag.name}</h4>
                      <code className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1 py-0.5 rounded">
                        {flag.key}
                      </code>
                      <Badge variant="outline" className="text-[10px] py-0 border-gray-200 text-gray-600">
                        {flag.category}
                      </Badge>
                      {flag.isSystem ? (
                        <span className="text-[10px] text-slate-500 font-medium">System</span>
                      ) : (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0">
                          Custom
                        </Badge>
                      )}
                      {isCanary && (
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0">
                          {flag.rolloutPercentage}% Traffic
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{flag.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(flag)}
                      className="text-xs h-7 px-2 border-gray-200 text-gray-600"
                    >
                      <Sliders className="w-3 h-3 mr-1" />
                      Configure
                    </Button>

                    {!flag.isSystem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteFlag(flag)}
                        className="text-xs h-7 text-rose-600 hover:bg-rose-50 p-1.5"
                        title="Delete custom flag"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    <Badge
                      className={
                        flag.isEnabled
                          ? 'bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5'
                          : 'bg-gray-100 text-gray-500 border-gray-300 text-xs px-2 py-0.5'
                      }
                    >
                      {flag.isEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>

                    <button
                      type="button"
                      data-testid={`toggle-${flag.key}`}
                      role="switch"
                      aria-checked={flag.isEnabled}
                      onClick={() => handleToggle(flag)}
                      className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                        flag.isEnabled ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          flag.isEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* ── MAINTENANCE MODE TIMING & COUNTDOWN CONTROLLER MODAL ── */}
      <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-950 font-bold text-lg">
              <Clock className="w-5 h-5 text-amber-600" />
              Configure Maintenance Mode & Reopening Countdown
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              Set the estimated platform reopening time. All regular users will see a live countdown clock until this time. Admins and Super Admins retain bypass access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Maintenance Mode State Toggle */}
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-950">Maintenance Mode State</h4>
                <p className="text-[11px] text-amber-800/80">
                  {maintEnabled
                    ? 'Active — Non-admin traffic will be directed to the maintenance screen'
                    : 'Inactive — Platform is open to all public traffic'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={maintEnabled}
                onClick={() => setMaintEnabled(!maintEnabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  maintEnabled ? 'bg-amber-600' : 'bg-gray-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                    maintEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Quick Duration Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-500" />
                Quick Duration Presets (Set estimated reopening)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '+15 Min', min: 15 },
                  { label: '+30 Min', min: 30 },
                  { label: '+1 Hour', min: 60 },
                  { label: '+2 Hours', min: 120 },
                  { label: '+4 Hours', min: 240 },
                  { label: '+12 Hours', min: 720 },
                  { label: '+24 Hours', min: 1440 },
                ].map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDurationPreset(preset.min)}
                    className="text-xs h-7 px-2 border-gray-200 hover:bg-amber-50 hover:border-amber-300"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Exact Date and Time Picker */}
            <div className="space-y-1.5">
              <label htmlFor="maint-reopen-time" className="text-xs font-semibold text-gray-700 block">
                Target Reopening Date & Time (User Local Time)
              </label>
              <Input
                id="maint-reopen-time"
                type="datetime-local"
                value={maintReopenDate}
                onChange={(e) => {
                  setMaintReopenDate(e.target.value);
                  setMaintEnabled(true);
                }}
                className="text-xs h-9 border-gray-300"
              />
              {maintReopenDate && (
                <p className="text-[11px] text-emerald-700 font-medium">
                  Countdown will end at: <strong>{new Date(maintReopenDate).toLocaleString()}</strong>
                </p>
              )}
            </div>

            {/* Headline Message */}
            <div className="space-y-1.5">
              <label htmlFor="maint-headline-input" className="text-xs font-semibold text-gray-700 block">
                Maintenance Notice Headline
              </label>
              <Input
                id="maint-headline-input"
                value={maintHeadline}
                onChange={(e) => setMaintHeadline(e.target.value)}
                placeholder="e.g. Scheduled Infrastructure Upgrade in Progress"
                className="text-xs h-9"
              />
            </div>

            {/* Public Message / Reason */}
            <div className="space-y-1.5">
              <label htmlFor="maint-reason-input" className="text-xs font-semibold text-gray-700 block">
                Detailed Message for Users
              </label>
              <textarea
                id="maint-reason-input"
                rows={2}
                value={maintReason}
                onChange={(e) => setMaintReason(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="Explain the upgrade or reason to users..."
              />
            </div>

            {/* Admin Bypass Allowed Roles */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">
                Roles with Maintenance Bypass Privileges
              </label>
              <div className="flex gap-4 text-xs text-gray-700">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintAllowedRoles.includes('SUPER_ADMIN')}
                    disabled
                    className="rounded text-amber-600"
                  />
                  <span>SUPER_ADMIN (Required)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintAllowedRoles.includes('ADMIN')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setMaintAllowedRoles(['SUPER_ADMIN', 'ADMIN']);
                      } else {
                        setMaintAllowedRoles(['SUPER_ADMIN']);
                      }
                    }}
                    className="rounded text-amber-600"
                  />
                  <span>ADMIN</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMaintenanceModalOpen(false)}
              disabled={maintSaving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMaintenanceSchedule}
              disabled={maintSaving}
              className={
                maintEnabled
                  ? 'bg-amber-600 hover:bg-amber-700 text-white font-medium'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium'
              }
            >
              {maintSaving
                ? 'Saving...'
                : maintEnabled
                ? 'Save & Broadcast Schedule'
                : 'Save Changes (Maintenance Inactive)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Configure Flag Modal (Rollout & Role) ── */}
      <Dialog open={Boolean(editFlag)} onOpenChange={(open) => !open && setEditFlag(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 font-bold">
              <Sliders className="w-5 h-5 text-emerald-700" />
              Configure: {editFlag?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Set canary traffic allocation, role gating, and documentation.
            </DialogDescription>
          </DialogHeader>

          {editFlag && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
                  <label htmlFor="canary-slider">Canary Rollout Percentage</label>
                  <span className="text-emerald-700 font-bold">{editRollout}% Traffic</span>
                </div>
                <input
                  id="canary-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editRollout}
                  onChange={(e) => setEditRollout(Number(e.target.value))}
                  className="w-full accent-emerald-700 h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  {editRollout === 100
                    ? '100% — Active for all eligible users.'
                    : `${editRollout}% canary rollout — traffic deterministically allocated.`}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Minimum Role Required (RBAC Gate)
                </label>
                <select
                  value={editMinRole}
                  onChange={(e) => setEditMinRole(e.target.value as UserRoleType)}
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role} {role === 'GUEST' ? '(Public / Unauthenticated)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 text-xs text-gray-900"
                  placeholder="Operational notes..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditFlag(null)}
              disabled={editSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={editSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {editSubmitting ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Custom Flag Modal ── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 font-bold">
                <Plus className="w-5 h-5 text-emerald-700" />
                Create Custom Feature Flag
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Define a new feature flag for experiments, A/B tests, or phased rollouts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Flag Key *</label>
                  <Input
                    placeholder="e.g. seasonal_harvest_tracker"
                    value={createKey}
                    onChange={(e) => setCreateKey(e.target.value)}
                    required
                    className="font-mono text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Display Name *</label>
                  <Input
                    placeholder="e.g. Seasonal Harvest Tracker"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    required
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Category</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value as FeatureFlagCategory)}
                    className="w-full h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'ALL').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700">Minimum Role</label>
                  <select
                    value={createMinRole}
                    onChange={(e) => setCreateMinRole(e.target.value as UserRoleType)}
                    className="w-full h-8 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Explain the purpose of this capability..."
                  className="w-full rounded-md border border-gray-300 p-2 text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="create-flag-enabled"
                  checked={createIsEnabled}
                  onChange={(e) => setCreateIsEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-700 h-4 w-4"
                />
                <label htmlFor="create-flag-enabled" className="text-xs font-medium text-gray-700">
                  Enable flag immediately upon creation
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                disabled={createSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createSubmitting}
                className="bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {createSubmitting ? 'Creating...' : 'Create Flag'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Reset Defaults Confirmation Modal ── */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-900 font-bold">
              <RotateCcw className="w-5 h-5 text-amber-600" />
              Reset Platform Feature Flags
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              This will restore all default system flags to factory defaults (e.g., disable Maintenance Mode, 100% rollout for core features). Custom flags will be preserved.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsResetOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleResetDefaults}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirm Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Custom Flag Confirmation Modal ── */}
      <Dialog open={Boolean(deleteFlag)} onOpenChange={(open) => !open && setDeleteFlag(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-900 font-bold">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Delete Custom Flag
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600">
              Are you sure you want to delete the custom flag <strong>{deleteFlag?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteFlag(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
