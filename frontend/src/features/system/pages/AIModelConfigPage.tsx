import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Mail,
  Shield,
  Layers,
  Sparkles,
  Save,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Server,
  Zap,
  Globe,
  Lock,
  Trash2,
} from 'lucide-react';
import { Button } from '../../../app/components/ui/button';
import { Input } from '../../../app/components/ui/input';
import { Badge } from '../../../app/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../../app/components/ui/card';
import { toast } from 'sonner';
import { systemConfigApi } from '../api/systemConfig.api';
import {
  ISystemConfiguration,
  ITestAIResponse,
} from '../types/systemConfig.types';

export function AIModelConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<ITestAIResponse | null>(null);
  const [purgingCache, setPurgingCache] = useState(false);
  const [syncingEnv, setSyncingEnv] = useState(false);

  // Collapsible cards state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    ai: true,
    storage: true,
    email: false,
    security: false,
    general: false,
    operations: false,
  });

  // Main configuration form state
  const [config, setConfig] = useState<ISystemConfiguration | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await systemConfigApi.getSystemConfig();
      if (res.email?.senderEmail) {
        const match = res.email.senderEmail.match(/<([^>]+)>$/);
        if (match) res.email.senderEmail = match[1].trim();
      }
      setConfig(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load system configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllSections = (open: boolean) => {
    setOpenSections({
      ai: open,
      storage: open,
      email: open,
      security: open,
      general: open,
      operations: open,
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!config) return;

    try {
      setSaving(true);
      const cleanEmail = (val?: string) => {
        if (!val) return val;
        const match = val.match(/<([^>]+)>$/);
        return match ? match[1].trim() : val.trim();
      };

      const emailPayload = config.email
        ? {
            ...config.email,
            senderEmail: cleanEmail(config.email.senderEmail) || config.email.senderEmail,
          }
        : config.email;

      const updated = await systemConfigApi.updateSystemConfig({
        ai: config.ai,
        storage: config.storage,
        email: emailPayload,
        security: config.security,
        general: config.general,
      });
      setConfig(updated);
      toast.success('System configuration and AI model parameters saved successfully.');
    } catch (err: any) {
      const detailMsg =
        err.details && Array.isArray(err.details)
          ? err.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
          : '';
      toast.error(
        detailMsg ? `Validation failed: ${detailMsg}` : (err.message || 'Failed to save system configuration.')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestAI = async () => {
    if (!config) return;
    try {
      setTestingAI(true);
      setAiTestResult(null);
      const res = await systemConfigApi.testAIConnection({ model: config.ai.model });
      setAiTestResult(res);
      if (res.status === 'ONLINE') {
        toast.success(`Gemini AI connection verified (${res.latencyMs}ms).`);
      } else {
        toast.warning(`Gemini AI status: ${res.status}. ${res.message}`);
      }
    } catch (err: any) {
      setAiTestResult({
        status: 'UNAVAILABLE',
        model: config.ai.model,
        latencyMs: 0,
        message: err.message || 'AI test request failed',
      });
      toast.error(err.message || 'AI test request failed.');
    } finally {
      setTestingAI(false);
    }
  };

  const handlePurgeCache = async () => {
    try {
      setPurgingCache(true);
      const res = await systemConfigApi.purgeSystemCache();
      toast.success(res.message || 'System and Redis cache purged successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to purge cache.');
    } finally {
      setPurgingCache(false);
    }
  };

  const handleSyncEnv = async () => {
    try {
      setSyncingEnv(true);
      const synced = await systemConfigApi.syncWithEnvDefaults();
      setConfig(synced);
      toast.success('Successfully synced system configuration with server environment variables (.env).');
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync with server environment.');
    } finally {
      setSyncingEnv(false);
    }
  };

  const handleExportJSON = () => {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vhg-system-configuration-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Configuration snapshot exported as JSON.');
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] space-y-4">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-gray-600">
          Loading platform and AI model configuration...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header & Action Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              AI Model & System Configuration
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
              Super Admin Control
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Global operational settings for Google Gemini models, cloud storage, SMTP mail, security policies, and botanical guidelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncEnv}
            disabled={syncingEnv}
            className="text-xs h-8 text-purple-700 border-purple-200 hover:bg-purple-50 gap-1.5 font-medium"
            title="Load and sync configuration from host server .env"
          >
            <Server className="w-3.5 h-3.5" />
            {syncingEnv ? 'Syncing...' : 'Sync with Server .env'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllSections(true)}
            className="text-xs h-8 text-gray-600"
          >
            Expand All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAllSections(false)}
            className="text-xs h-8 text-gray-600"
          >
            Collapse All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="text-xs h-8 text-gray-700 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs h-8 gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>

      {/* ── Top Metric Highlights Pill ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-gray-500 font-medium block">Active Gemini Model</span>
          <span className="text-xs font-bold text-purple-700 font-mono mt-0.5 block truncate">
            {config.ai.model}
          </span>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-gray-500 font-medium block">Host Server (.env)</span>
          <span className="text-xs font-bold text-gray-700 font-mono mt-0.5 block truncate">
            {config.envDefaults?.geminiModel || 'gemini-3.5-flash'}
          </span>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-gray-500 font-medium block">Storage Provider</span>
          <span className="text-xs font-bold text-blue-700 mt-0.5 block">
            {config.storage.provider === 'R2' ? 'Cloudflare R2' : config.storage.provider}
          </span>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-gray-500 font-medium block">2FA Administrative Rule</span>
          <span className="text-xs font-bold text-amber-700 mt-0.5 block">
            {config.security.require2faForAdmins ? 'Enforced' : 'Optional'}
          </span>
        </div>
        <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs">
          <span className="text-[11px] text-gray-500 font-medium block">Scan Rate Limit</span>
          <span className="text-xs font-bold text-emerald-700 mt-0.5 block">
            {config.security.allowedDetectionsPerHour} scans / hr
          </span>
        </div>
      </div>

      {/* ── 1. AI & Gemini Model Engine Card ── */}
      <Card className="border border-purple-200 shadow-sm overflow-hidden">
        <CardHeader
          className="bg-gradient-to-r from-purple-50/70 to-white py-3.5 px-5 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('ai')}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">
                AI & Gemini Model Engine
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Configure plant identification models, hallucination control (temperature), and inference endpoints.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-mono">
              {config.ai.model}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
              aria-label="Toggle AI & Gemini Model Engine"
            >
              {openSections.ai ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {openSections.ai && (
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-700">Model Selection / Identifier</label>
                  {config.envDefaults?.geminiModel && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          ai: { ...config.ai, model: config.envDefaults!.geminiModel },
                        })
                      }
                      className="text-[10px] text-purple-700 hover:text-purple-900 font-medium underline flex items-center gap-1"
                      title="Set to server .env GEMINI_MODEL"
                    >
                      Use Server Env ({config.envDefaults.geminiModel})
                    </button>
                  )}
                </div>
                <Input
                  value={config.ai.model}
                  onChange={(e) =>
                    setConfig({ ...config, ai: { ...config.ai, model: e.target.value } })
                  }
                  className="h-9 text-xs font-mono font-medium"
                  placeholder="e.g. gemini-3.5-flash or gemini-3.8-flash"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {[
                    'gemini-3.5-flash',
                    'gemini-3.8-flash',
                    'gemini-2.0-flash',
                    'gemini-1.5-flash',
                    'gemini-1.5-pro',
                  ].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setConfig({ ...config, ai: { ...config.ai, model: m } })}
                      className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                        config.ai.model === m
                          ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500">
                  Primary vision model used for botanical species identification. Select a quick preset or type any custom model ID.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">API Endpoint</label>
                <Input
                  value={config.ai.endpoint}
                  onChange={(e) =>
                    setConfig({ ...config, ai: { ...config.ai, endpoint: e.target.value } })
                  }
                  className="h-9 text-xs font-mono"
                  placeholder="generativelanguage.googleapis.com"
                />
                <p className="text-[11px] text-gray-500">
                  Default Google Generative Language service endpoint.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Fallback Model</label>
                <Input
                  value={config.ai.fallbackModel}
                  onChange={(e) =>
                    setConfig({ ...config, ai: { ...config.ai, fallbackModel: e.target.value } })
                  }
                  className="h-9 text-xs font-mono"
                  placeholder="gemini-1.5-flash"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-3.5-flash'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setConfig({ ...config, ai: { ...config.ai, fallbackModel: m } })
                      }
                      className={`px-1.5 py-0.5 text-[10px] rounded border font-mono transition-colors ${
                        config.ai.fallbackModel === m
                          ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-500">
                  Used if the primary model reaches rate limits or quota errors.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              {/* Temperature slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Temperature</span>
                  <span className="font-bold text-purple-700">{config.ai.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.ai.temperature}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      ai: { ...config.ai, temperature: parseFloat(e.target.value) },
                    })
                  }
                  className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  Lower values (0.1–0.3) provide strict scientific classification with minimal hallucination.
                </p>
              </div>

              {/* Max Output Tokens */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Max Output Tokens</span>
                  <span className="font-bold text-purple-700">{config.ai.maxTokens}</span>
                </div>
                <select
                  value={config.ai.maxTokens}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      ai: { ...config.ai, maxTokens: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900"
                >
                  <option value={1024}>1024 Tokens (Compact)</option>
                  <option value={2048}>2048 Tokens (Standard)</option>
                  <option value={4096}>4096 Tokens (Detailed)</option>
                  <option value={8192}>8192 Tokens (Exhaustive)</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  Maximum length of the JSON taxonomic response.
                </p>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Confidence Threshold</span>
                  <span className="font-bold text-purple-700">{config.ai.confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={config.ai.confidenceThreshold}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      ai: { ...config.ai, confidenceThreshold: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  Predictions below this percentage flag results with cautionary notes.
                </p>
              </div>
            </div>

            {/* AI Health & Connection Testing Area */}
            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-purple-700 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-purple-950">
                    Live Model Verification & Latency Probe
                  </h4>
                  <p className="text-[11px] text-purple-800/80">
                    Send a lightweight live probe to verify Google Gemini API connectivity.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {aiTestResult && (
                  <Badge
                    className={`text-xs ${
                      aiTestResult.status === 'ONLINE'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : aiTestResult.status === 'DEGRADED'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-rose-100 text-rose-800 border-rose-300'
                    }`}
                  >
                    {aiTestResult.status} ({aiTestResult.latencyMs}ms)
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestAI}
                  disabled={testingAI}
                  className="bg-white border-purple-300 text-purple-900 hover:bg-purple-100 text-xs h-8"
                >
                  <Zap className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  {testingAI ? 'Pinging Model...' : 'Test AI Connection'}
                </Button>
              </div>
            </div>

            {aiTestResult && aiTestResult.status !== 'ONLINE' && (
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Model Response Diagnostic:</span>
                  <p className="text-[11px] font-mono break-all text-amber-800">
                    {aiTestResult.message}
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Tip: If using Google Gemini API, ensure your model ID is active (such as <strong className="font-mono">gemini-3.5-flash</strong> or <strong className="font-mono">gemini-3.8-flash</strong>). You can update it above and test again.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── 2. Cloud Storage & Media Delivery Card ── */}
      <Card className="border border-blue-200 shadow-sm overflow-hidden">
        <CardHeader
          className="bg-gradient-to-r from-blue-50/70 to-white py-3.5 px-5 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('storage')}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">
                Cloud Storage & Media Delivery
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Configure object storage provider, CDN asset hosting, and upload payload limits.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px]">
              {config.storage.provider}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
              aria-label="Toggle Cloud Storage & Media Delivery"
            >
              {openSections.storage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {openSections.storage && (
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Storage Provider</label>
                <select
                  value={config.storage.provider}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storage: {
                        ...config.storage,
                        provider: e.target.value as 'S3' | 'R2' | 'LOCAL',
                      },
                    })
                  }
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900"
                >
                  <option value="R2">Cloudflare R2 (Zero Egress)</option>
                  <option value="S3">Amazon AWS S3</option>
                  <option value="LOCAL">Local Disk (Development only)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Target Bucket Name</label>
                <Input
                  value={config.storage.bucket}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storage: { ...config.storage, bucket: e.target.value },
                    })
                  }
                  className="h-9 text-xs font-mono"
                  placeholder="herbal-assets"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Storage Region</label>
                <Input
                  value={config.storage.region}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storage: { ...config.storage, region: e.target.value },
                    })
                  }
                  className="h-9 text-xs"
                  placeholder="auto"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Public CDN Base URL</label>
                <Input
                  value={config.storage.cdnBaseUrl}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storage: { ...config.storage, cdnBaseUrl: e.target.value },
                    })
                  }
                  className="h-9 text-xs font-mono"
                  placeholder="https://cdn.virtualherbalgarden.org"
                />
                <p className="text-[11px] text-gray-500">
                  Custom edge domain for high-speed botanical media and 3D asset streaming.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Max Upload File Size</span>
                  <span className="font-bold text-blue-700">{config.storage.maxUploadSizeMb} MB</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="2"
                  value={config.storage.maxUploadSizeMb}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      storage: {
                        ...config.storage,
                        maxUploadSizeMb: parseInt(e.target.value, 10),
                      },
                    })
                  }
                  className="w-full accent-blue-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  Enforced on camera snapshots, herbarium documents, and 3D plant models.
                </p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── 3. Email & Notifications (SMTP) Card ── */}
      <Card className="border border-amber-200 shadow-sm overflow-hidden">
        <CardHeader
          className="bg-gradient-to-r from-amber-50/70 to-white py-3.5 px-5 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('email')}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">
                Email & Notifications (SMTP)
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Outbound mail transport, newsletter digest intervals, and administrative notices.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
              {config.email.smtpHost}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
              aria-label="Toggle Email & Notifications"
            >
              {openSections.email ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {openSections.email && (
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">SMTP Server Host</label>
                <Input
                  value={config.email.smtpHost}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      email: { ...config.email, smtpHost: e.target.value },
                    })
                  }
                  className="h-9 text-xs font-mono"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">SMTP Port</label>
                <Input
                  type="number"
                  value={config.email.smtpPort}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      email: { ...config.email, smtpPort: parseInt(e.target.value, 10) || 587 },
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Digest Frequency</label>
                <select
                  value={config.email.digestFrequency}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      email: {
                        ...config.email,
                        digestFrequency: e.target.value as 'DAILY' | 'WEEKLY' | 'NEVER',
                      },
                    })
                  }
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900"
                >
                  <option value="DAILY">Daily Digest</option>
                  <option value="WEEKLY">Weekly Digest (Recommended)</option>
                  <option value="NEVER">Disabled (Never)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Sender Display Name</label>
                <Input
                  value={config.email.senderName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      email: { ...config.email, senderName: e.target.value },
                    })
                  }
                  className="h-9 text-xs"
                  placeholder="Virtual Herbal Garden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Sender Email Address</label>
                <Input
                  type="email"
                  value={config.email.senderEmail}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      email: { ...config.email, senderEmail: e.target.value },
                    })
                  }
                  className="h-9 text-xs"
                  placeholder="noreply@virtualherbalgarden.org"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── 4. Security & Rate Limits Card ── */}
      <Card className="border border-rose-200 shadow-sm overflow-hidden">
        <CardHeader
          className="bg-gradient-to-r from-rose-50/70 to-white py-3.5 px-5 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('security')}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">
                Security & Rate Limits
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                DDoS thresholds, AI scan quotas per user, JWT lifecycle, and two-factor enforcement.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
              {config.security.allowedDetectionsPerHour} Scans/Hr
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
              aria-label="Toggle Security & Rate Limits"
            >
              {openSections.security ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {openSections.security && (
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  User Scans Per Hour Quota
                </label>
                <Input
                  type="number"
                  value={config.security.allowedDetectionsPerHour}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: {
                        ...config.security,
                        allowedDetectionsPerHour: parseInt(e.target.value, 10) || 10,
                      },
                    })
                  }
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-gray-500">
                  Prevents API quota depletion by rate-limiting unprivileged users.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Global API Rate Limit (req/min)
                </label>
                <Input
                  type="number"
                  value={config.security.apiRateLimitPerMin}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: {
                        ...config.security,
                        apiRateLimitPerMin: parseInt(e.target.value, 10) || 100,
                      },
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Max Concurrent User Sessions
                </label>
                <Input
                  type="number"
                  value={config.security.maxConcurrentSessions}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: {
                        ...config.security,
                        maxConcurrentSessions: parseInt(e.target.value, 10) || 5,
                      },
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  JWT Access Token Lifetime
                </label>
                <select
                  value={config.security.jwtAccessExpiry}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, jwtAccessExpiry: e.target.value },
                    })
                  }
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900"
                >
                  <option value="15m">15 Minutes (High Security)</option>
                  <option value="30m">30 Minutes</option>
                  <option value="1h">1 Hour (Standard)</option>
                  <option value="4h">4 Hours</option>
                  <option value="24h">24 Hours</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  JWT Refresh Token Lifetime
                </label>
                <select
                  value={config.security.jwtRefreshExpiry}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, jwtRefreshExpiry: e.target.value },
                    })
                  }
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900"
                >
                  <option value="7d">7 Days</option>
                  <option value="14d">14 Days</option>
                  <option value="30d">30 Days (Standard)</option>
                  <option value="90d">90 Days</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 self-end h-14">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Require 2FA for Admins</span>
                  <span className="text-[11px] text-gray-500">Mandate TOTP verification</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.security.require2faForAdmins}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      security: { ...config.security, require2faForAdmins: e.target.checked },
                    })
                  }
                  className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── 5. Platform & Botanical Policies Card ── */}
      <Card className="border border-emerald-200 shadow-sm overflow-hidden">
        <CardHeader
          className="bg-gradient-to-r from-emerald-50/70 to-white py-3.5 px-5 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('general')}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">
                Platform & Botanical Policies
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                System naming, support contact routing, and standard botanical nomenclature defaults.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
              {config.general.defaultTaxonomy}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
              aria-label="Toggle Platform & Botanical Policies"
            >
              {openSections.general ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </CardHeader>

        {openSections.general && (
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Official Platform Title</label>
                <Input
                  value={config.general.platformName}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      general: { ...config.general, platformName: e.target.value },
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Support / Operations Email</label>
                <Input
                  type="email"
                  value={config.general.supportEmail}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      general: { ...config.general, supportEmail: e.target.value },
                    })
                  }
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Default Medical Taxonomy</label>
                <select
                  value={config.general.defaultTaxonomy}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      general: { ...config.general, defaultTaxonomy: e.target.value },
                    })
                  }
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-xs text-gray-900"
                >
                  <option value="AYURVEDA">Ayurvedic Pharmacopoeia of India (AFI)</option>
                  <option value="SIDDHA">Siddha Medicine System</option>
                  <option value="UNANI">Unani System of Medicine</option>
                  <option value="MODERN">Modern Botanical Classification (APG IV)</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── 6. Cache & Diagnostic Operations Card ── */}
      <Card className="border border-gray-200 shadow-sm overflow-hidden">
        <CardHeader
          className="bg-gray-50 py-3.5 px-5 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => toggleSection('operations')}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-gray-900">
                Cache & Diagnostic Operations
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Low-level Redis cache invalidation and snapshot management tools.
              </CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-gray-500 hover:text-gray-900"
            aria-label="Toggle Cache & Diagnostic Operations"
          >
            {openSections.operations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardHeader>

        {openSections.operations && (
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <div>
                <h4 className="text-xs font-bold text-gray-900">Flush Distributed Redis Cache</h4>
                <p className="text-xs text-gray-500">
                  Invalidate all cached configuration keys (`system:config`, `system:config:public`).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePurgeCache}
                disabled={purgingCache}
                className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50 gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {purgingCache ? 'Flushing...' : 'Purge Redis Cache'}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
