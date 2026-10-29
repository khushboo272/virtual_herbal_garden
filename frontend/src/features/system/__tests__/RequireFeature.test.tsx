import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagsContext } from '../../../contexts/FeatureFlagsContext';
import { RequireFeature } from '../../../app/components/RequireFeature';

describe('RequireFeature Route Guard Tests', () => {
  it('renders children when feature flag is enabled', () => {
    render(
      <MemoryRouter>
        <FeatureFlagsContext.Provider
          value={{
            flags: { ai_scanner: true },
            isLoading: false,
            isFeatureEnabled: (k) => k === 'ai_scanner',
            refreshFlags: vi.fn(),
          }}
        >
          <RequireFeature featureKey="ai_scanner" featureName="AI Plant Scanner">
            <div data-testid="protected-scanner">Active Scanner Tool</div>
          </RequireFeature>
        </FeatureFlagsContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-scanner')).toBeInTheDocument();
    expect(screen.queryByText(/is Temporarily Offline/i)).not.toBeInTheDocument();
  });

  it('renders FeatureDisabledScreen when feature flag is disabled', () => {
    render(
      <MemoryRouter>
        <FeatureFlagsContext.Provider
          value={{
            flags: { ai_scanner: false },
            isLoading: false,
            isFeatureEnabled: () => false,
            refreshFlags: vi.fn(),
          }}
        >
          <RequireFeature featureKey="ai_scanner" featureName="AI Plant Scanner">
            <div data-testid="protected-scanner">Active Scanner Tool</div>
          </RequireFeature>
        </FeatureFlagsContext.Provider>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-scanner')).not.toBeInTheDocument();
    expect(screen.getByText('AI Plant Scanner is Temporarily Offline')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Herbal Library/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument();
  });

  it('allows SUPER_ADMIN to bypass disabled feature flag', () => {
    render(
      <MemoryRouter>
        <FeatureFlagsContext.Provider
          value={{
            flags: { ai_scanner: false },
            isLoading: false,
            // When user is SUPER_ADMIN, isFeatureEnabled always returns true
            isFeatureEnabled: () => true,
            refreshFlags: vi.fn(),
          }}
        >
          <RequireFeature featureKey="ai_scanner" featureName="AI Plant Scanner">
            <div data-testid="protected-scanner">Active Scanner Tool for Admin</div>
          </RequireFeature>
        </FeatureFlagsContext.Provider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-scanner')).toBeInTheDocument();
    expect(screen.queryByText(/is Temporarily Offline/i)).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided and feature is disabled', () => {
    render(
      <MemoryRouter>
        <FeatureFlagsContext.Provider
          value={{
            flags: { '3d_garden': false },
            isLoading: false,
            isFeatureEnabled: () => false,
            refreshFlags: vi.fn(),
          }}
        >
          <RequireFeature
            featureKey="3d_garden"
            featureName="3D Garden"
            fallback={<div data-testid="custom-fallback">Custom 3D Offline Notice</div>}
          >
            <div data-testid="protected-3d">3D Garden Canvas</div>
          </RequireFeature>
        </FeatureFlagsContext.Provider>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-3d')).not.toBeInTheDocument();
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });
});
