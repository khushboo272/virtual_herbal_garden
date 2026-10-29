import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MaintenanceGuard } from '../components/MaintenanceGuard';
import { featureFlagApi } from '../api/featureFlag.api';
import * as AuthContext from '../../../contexts/AuthContext';

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('MaintenanceGuard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children normally when maintenance mode is inactive', async () => {
    vi.spyOn(featureFlagApi, 'getMaintenanceStatus').mockResolvedValue({
      maintenanceMode: false,
      reopenAt: null,
      headline: '',
      reason: '',
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    });

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <MaintenanceGuard>
          <div>Protected Content</div>
        </MaintenanceGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('renders fullscreen MaintenanceScreen when maintenance mode is active and user is not admin', async () => {
    vi.spyOn(featureFlagApi, 'getMaintenanceStatus').mockResolvedValue({
      maintenanceMode: true,
      reopenAt: new Date(Date.now() + 7200000).toISOString(),
      headline: 'Scheduled System Maintenance Active',
      reason: 'Upgrading database indexes and 3D garden shaders.',
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    });

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'USER' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <MaintenanceGuard>
          <div>Protected Content</div>
        </MaintenanceGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Scheduled System Maintenance Active').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Upgrading database indexes/i)).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  it('renders admin bypass warning bar and allows content when user is SUPER_ADMIN', async () => {
    vi.spyOn(featureFlagApi, 'getMaintenanceStatus').mockResolvedValue({
      maintenanceMode: true,
      reopenAt: new Date(Date.now() + 7200000).toISOString(),
      headline: 'Scheduled System Maintenance Active',
      reason: 'Upgrading database indexes.',
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
    });

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { role: 'SUPER_ADMIN' },
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
    } as any);

    render(
      <MemoryRouter>
        <MaintenanceGuard>
          <div>Protected Content</div>
        </MaintenanceGuard>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(screen.getByText(/You have administrator bypass privileges/i)).toBeInTheDocument();
    });
  });
});
