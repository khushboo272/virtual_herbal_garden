// ──────────────────────────────────────────────────────────
// hooks/useGardenQuality.ts — Quality Tier Management
// Handles LOW, MEDIUM, HIGH, ULTRA tiers, persistence, and auto-detection
// ──────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import {
  GARDEN_CONFIG,
  GARDEN_QUALITY_TIERS,
  type QualityTierName,
  type QualityTierConfig,
} from '../gardenConfig';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

export function useGardenQuality() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getInitialTier = (): QualityTierName => {
    try {
      const saved = localStorage.getItem(GARDEN_CONFIG.quality.storageKey) as QualityTierName | null;
      if (saved && GARDEN_QUALITY_TIERS[saved]) {
        return saved;
      }
    } catch {
      // Fallback if storage access is restricted
    }
    return isMobile
      ? GARDEN_CONFIG.quality.defaultMobileTier
      : GARDEN_CONFIG.quality.defaultDesktopTier;
  };

  const [tier, setTierState] = useState<QualityTierName>(getInitialTier);

  // Sync when device mode changes if user hasn't explicitly set a preference
  useEffect(() => {
    const saved = localStorage.getItem(GARDEN_CONFIG.quality.storageKey);
    if (!saved) {
      setTierState(isMobile ? 'LOW' : 'HIGH');
    }
  }, [isMobile]);

  const setTier = useCallback((newTier: QualityTierName) => {
    if (GARDEN_QUALITY_TIERS[newTier]) {
      setTierState(newTier);
      try {
        localStorage.setItem(GARDEN_CONFIG.quality.storageKey, newTier);
      } catch (err) {
        console.warn('[useGardenQuality] Failed to persist quality tier:', err);
      }
    }
  }, []);

  const config: QualityTierConfig = GARDEN_QUALITY_TIERS[tier];

  return {
    tier,
    config,
    setTier,
    isMobile,
  };
}

