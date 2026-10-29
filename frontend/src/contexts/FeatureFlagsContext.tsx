import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { featureFlagApi } from '../features/system/api/featureFlag.api';
import { useAuth } from './AuthContext';

export interface FeatureFlagsContextType {
  flags: Record<string, boolean>;
  isLoading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  refreshFlags: () => Promise<void>;
}

export const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

// Default fallback flags when offline or on initial bootstrap
const DEFAULT_FLAGS: Record<string, boolean> = {
  ai_scanner: true,
  '3d_garden': true,
  guided_tours: true,
  new_user_registration: true,
  maintenance_mode: false,
};

export const FeatureFlagsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>(DEFAULT_FLAGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { role } = useAuth();

  const refreshFlags = useCallback(async () => {
    try {
      const publicMap = await featureFlagApi.getPublicFlags();
      if (publicMap && typeof publicMap === 'object') {
        setFlags(publicMap);
      }
    } catch (err) {
      console.warn('[FeatureFlagsContext] Failed to load public feature flags:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFlags();

    // Auto-refresh periodically (every 30 seconds)
    const interval = setInterval(refreshFlags, 30000);

    // Refresh on tab focus so admin changes apply immediately
    const handleFocus = () => {
      refreshFlags();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshFlags]);

  const isFeatureEnabled = useCallback(
    (key: string): boolean => {
      // Super Admin bypass: SUPER_ADMIN has access to all features for administration/testing
      if (role === 'SUPER_ADMIN') {
        return true;
      }
      const normalizedKey = key.toLowerCase();
      if (flags[normalizedKey] !== undefined) {
        return Boolean(flags[normalizedKey]);
      }
      return true; // Default allow if unknown flag
    },
    [flags, role]
  );

  return (
    <FeatureFlagsContext.Provider
      value={{
        flags,
        isLoading,
        isFeatureEnabled,
        refreshFlags,
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};
