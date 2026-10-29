import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagsPage } from '../pages/FeatureFlagsPage';
import { featureFlagApi } from '../api/featureFlag.api';
import { IFeatureFlagsResponse } from '../types/featureFlag.types';

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockFeatureFlagsData: IFeatureFlagsResponse = {
  flags: [
    {
      key: '3d_garden',
      name: '3D Virtual Garden',
      description: 'Immersive Three.js medicinal herbal garden visualization',
      category: 'EXPERIENCE',
      isEnabled: true,
      rolloutPercentage: 100,
      minimumRole: 'USER',
      isSystem: true,
      tags: ['3D', 'WebGL'],
    },
    {
      key: 'ai_scanner',
      name: 'AI Plant Scanner',
      description: 'Mobile and web AI camera identification',
      category: 'AI',
      isEnabled: true,
      rolloutPercentage: 75,
      minimumRole: 'USER',
      isSystem: true,
      tags: ['AI', 'Vision'],
    },
    {
      key: 'maintenance_mode',
      name: 'Platform Maintenance Mode',
      description: 'Emergency system kill-switch',
      category: 'SYSTEM',
      isEnabled: false,
      rolloutPercentage: 0,
      minimumRole: 'SUPER_ADMIN',
      isSystem: true,
      tags: ['System', 'Emergency'],
    },
    {
      key: 'custom_herbal_quiz',
      name: 'Custom Herbal Quiz',
      description: 'Interactive seasonal Ayurvedic dosha quiz',
      category: 'COMMUNITY',
      isEnabled: true,
      rolloutPercentage: 50,
      minimumRole: 'USER',
      isSystem: false,
      tags: ['Quiz', 'Ayurveda'],
    },
  ],
  summary: {
    total: 4,
    enabledCount: 3,
    disabledCount: 1,
    canaryCount: 2,
    restrictedCount: 1,
    categoryBreakdown: {
      EXPERIENCE: 1,
      AI: 1,
      SYSTEM: 1,
      COMMUNITY: 1,
    },
  },
};

describe('FeatureFlagsPage Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(featureFlagApi, 'getFeatureFlags').mockResolvedValue(mockFeatureFlagsData);
    vi.spyOn(featureFlagApi, 'updateFeatureFlag').mockImplementation(async (key, payload) => ({
      ...mockFeatureFlagsData.flags.find((f) => f.key === key)!,
      ...payload,
    }));
    vi.spyOn(featureFlagApi, 'createFeatureFlag').mockImplementation(async (payload) => ({
      ...payload,
      isSystem: false,
    }));
    vi.spyOn(featureFlagApi, 'deleteFeatureFlag').mockResolvedValue({
      success: true,
      message: 'Deleted successfully',
    });
    vi.spyOn(featureFlagApi, 'resetFeatureFlags').mockResolvedValue({
      success: true,
      message: 'Reset successfully',
    });
  });

  it('renders loading state and then renders KPI summary cards and flags', async () => {
    render(
      <MemoryRouter>
        <FeatureFlagsPage />
      </MemoryRouter>
    );

    // Verify KPI summary metrics after data loads
    await waitFor(() => {
      expect(screen.getByText('3D Virtual Garden')).toBeInTheDocument();
    });

    expect(screen.getByText('AI Plant Scanner')).toBeInTheDocument();
    expect(screen.getByText('Platform Maintenance Mode')).toBeInTheDocument();
    expect(screen.getByText('Custom Herbal Quiz')).toBeInTheDocument();

    // Verify summary values
    expect(screen.getAllByText('4').length).toBeGreaterThanOrEqual(1);
  });

  it('filters flags when searching text', async () => {
    render(
      <MemoryRouter>
        <FeatureFlagsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('3D Virtual Garden')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'quiz' } });

    expect(screen.getByText('Custom Herbal Quiz')).toBeInTheDocument();
  });

  it('filters flags by category tabs', async () => {
    render(
      <MemoryRouter>
        <FeatureFlagsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('3D Virtual Garden')).toBeInTheDocument();
    });

    // Click 'Community' category pill
    const commTab = screen.getByRole('button', { name: /Community/i });
    fireEvent.click(commTab);

    expect(screen.getByText('Custom Herbal Quiz')).toBeInTheDocument();
  });

  it('toggles a feature flag and calls update API', async () => {
    render(
      <MemoryRouter>
        <FeatureFlagsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('3D Virtual Garden')).toBeInTheDocument();
    });

    // Find toggle switch for 3D garden
    const toggleButton = screen.getByTestId('toggle-3d_garden');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(featureFlagApi.updateFeatureFlag).toHaveBeenCalledWith('3d_garden', {
        isEnabled: false,
      });
    });
  });

  it('resets feature flags to platform defaults upon confirmation', async () => {
    render(
      <MemoryRouter>
        <FeatureFlagsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('3D Virtual Garden')).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole('button', { name: /reset defaults/i });
    fireEvent.click(resetBtn);

    // Confirm in dialog
    const confirmBtn = screen.getByRole('button', { name: /confirm reset/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(featureFlagApi.resetFeatureFlags).toHaveBeenCalled();
    });
  });

  it('opens maintenance mode modal and schedules reopen timing', async () => {
    vi.spyOn(featureFlagApi, 'updateMaintenanceConfig').mockResolvedValue({
      key: 'maintenance_mode',
      name: 'Platform Maintenance Mode',
      description: 'Emergency system kill-switch',
      category: 'SYSTEM',
      isEnabled: true,
      rolloutPercentage: 0,
      minimumRole: 'SUPER_ADMIN',
      isSystem: true,
      metadata: { reopenAt: new Date(Date.now() + 3600000).toISOString() },
    });

    render(
      <MemoryRouter>
        <FeatureFlagsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('3D Virtual Garden')).toBeInTheDocument();
    });

    // Click Maintenance Timer button
    const maintTimerBtn = screen.getByRole('button', { name: /maintenance timer/i });
    fireEvent.click(maintTimerBtn);

    // Dialog opens with presets
    expect(screen.getByText(/configure maintenance mode & reopening countdown/i)).toBeInTheDocument();
    const plus1HourBtn = screen.getByRole('button', { name: /\+1 hour/i });
    fireEvent.click(plus1HourBtn);

    // Click Save & Broadcast Schedule
    const saveBtn = screen.getByRole('button', { name: /save & broadcast schedule/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(featureFlagApi.updateMaintenanceConfig).toHaveBeenCalled();
    });
  });
});

