import React from 'react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { FeatureDisabledScreen } from './FeatureDisabledScreen';

export interface RequireFeatureProps {
  featureKey: string;
  featureName?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Route / Component guard that checks if a feature flag is enabled.
 * If disabled and user is not SUPER_ADMIN, renders FeatureDisabledScreen.
 */
export const RequireFeature: React.FC<RequireFeatureProps> = ({
  featureKey,
  featureName,
  children,
  fallback,
}) => {
  const { isFeatureEnabled, isLoading } = useFeatureFlags();

  const enabled = isFeatureEnabled(featureKey);

  if (!enabled && !isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <FeatureDisabledScreen featureName={featureName || featureKey} />;
  }

  return <>{children}</>;
};
