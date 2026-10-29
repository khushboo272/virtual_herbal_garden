import React, { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Wrench, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { featureFlagApi } from '../api/featureFlag.api';
import { IMaintenanceStatus } from '../types/featureFlag.types';
import { MaintenanceScreen } from './MaintenanceScreen';
import { Button } from '../../../app/components/ui/button';
import { Link } from 'react-router-dom';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const [maintenanceStatus, setMaintenanceStatus] = useState<IMaintenanceStatus | null>(null);
  const [dismissAdminBanner, setDismissAdminBanner] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await featureFlagApi.getMaintenanceStatus();
      setMaintenanceStatus(res);
    } catch {
      // If maintenance check fails (e.g. offline), default to false to prevent lockout
      setMaintenanceStatus({
        maintenanceMode: false,
        reopenAt: null,
        headline: '',
        reason: '',
        allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll maintenance status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Check if current user is permitted to bypass maintenance based on allowedRoles
  const allowedRoles =
    maintenanceStatus?.allowedRoles && maintenanceStatus.allowedRoles.length > 0
      ? maintenanceStatus.allowedRoles
      : ['SUPER_ADMIN', 'ADMIN'];

  const hasBypass =
    isAuthenticated &&
    user &&
    allowedRoles.includes(user.role as any);

  // If maintenance mode is active and user has NO admin bypass -> Show Fullscreen Maintenance Screen
  if (maintenanceStatus?.maintenanceMode && !hasBypass) {
    return <MaintenanceScreen status={maintenanceStatus} onRefresh={fetchStatus} />;
  }

  return (
    <>
      {/* If Maintenance is active and user HAS bypass -> Show Sticky Administrator Warning Banner */}
      {maintenanceStatus?.maintenanceMode && hasBypass && !dismissAdminBanner && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
            <span>
              <strong>Platform Maintenance Mode is ACTIVE.</strong> All public and non-admin traffic is currently blocked. You have administrator bypass privileges.
              {maintenanceStatus.reopenAt && (
                <span className="hidden md:inline ml-2 text-amber-100 font-normal">
                  (Estimated Reopening: {new Date(maintenanceStatus.reopenAt).toLocaleTimeString()})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/dashboard/system/feature-flags">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Wrench className="w-3 h-3 mr-1" />
                Manage Mode
              </Button>
            </Link>
            <button
              onClick={() => setDismissAdminBanner(true)}
              className="text-amber-200 hover:text-white p-1"
              title="Dismiss warning banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {children}
    </>
  );
}
