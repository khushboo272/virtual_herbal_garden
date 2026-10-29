import { useState, useEffect, useCallback, useRef } from 'react';
import { systemApi } from '../api/system.api';
import { ISystemOverview, ISubsystemPings } from '../types/system.types';
import { toast } from 'sonner';

export function useSystemOverview() {
  const [overview, setOverview] = useState<ISystemOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pings, setPings] = useState<ISubsystemPings | null>(null);
  const [pinging, setPinging] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOverview = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const data = await systemApi.getSystemOverview();
      setOverview(data);
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch system overview';
      setError(msg);
      if (!isBackground) {
        toast.error('System overview load error', { description: msg });
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  const runPings = useCallback(async () => {
    setPinging(true);
    try {
      const res = await systemApi.pingSubsystems();
      setPings(res);
      toast.success('Diagnostics Complete', {
        description: `DB: ${res.database.latencyMs}ms • Storage: ${res.storage.ok ? 'Reachable' : 'Fallback'} • Socket: ${res.socket.ok ? 'Active' : 'N/A'}`,
      });
      // Also refresh overview to sync any stats
      await fetchOverview(true);
    } catch (err: any) {
      toast.error('Ping check failed', { description: err.message || 'Subsystems ping failed' });
    } finally {
      setPinging(false);
    }
  }, [fetchOverview]);

  const clearCache = useCallback(async () => {
    try {
      const res = await systemApi.clearSystemCache();
      toast.success('Cache Flushed', { description: res.message || 'Catalog and home cache invalidated' });
      await fetchOverview(true);
      return res;
    } catch (err: any) {
      toast.error('Clear Cache Failed', { description: err.message || 'Failed to invalidate cache' });
      throw err;
    }
  }, [fetchOverview]);

  const purgeSessions = useCallback(async () => {
    try {
      const res = await systemApi.purgeExpiredSessions();
      toast.success('Session Cleanup Complete', {
        description: `Purged ${res.purgedCount} expired login sessions`,
      });
      await fetchOverview(true);
      return res;
    } catch (err: any) {
      toast.error('Session Purge Failed', { description: err.message || 'Failed to purge expired sessions' });
      throw err;
    }
  }, [fetchOverview]);

  const exportDiagnostics = useCallback(() => {
    if (!overview) {
      toast.error('No diagnostics data available to export');
      return;
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'Virtual Herbal Garden',
      environment: overview.runtime.environment,
      systemOverview: overview,
      latestPings: pings,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportPayload, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `vhg-system-diagnostics-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast.success('Diagnostics Exported', { description: 'Saved diagnostic snapshot to JSON' });
  }, [overview, pings]);

  // Initial load
  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Auto-refresh interval (every 30 seconds)
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => {
        fetchOverview(true);
      }, 30000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [autoRefresh, fetchOverview]);

  return {
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
  };
}
