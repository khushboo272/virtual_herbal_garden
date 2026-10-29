import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { SystemOverviewPage } from '../pages/SystemOverviewPage';
import { systemApi } from '../api/system.api';
import { ISystemOverview, ISubsystemPings } from '../types/system.types';

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockOverview: ISystemOverview = {
  health: {
    database: {
      status: 'connected',
      name: 'herbal_garden_dev',
      host: '127.0.0.1',
      readyState: 1,
      latencyMs: 3,
    },
    storage: {
      status: 'connected',
      configured: true,
      reachable: true,
      bucket: 'vhg-media-assets',
      publicUrl: 'https://cdn.virtualherbal.garden',
      message: 'Cloudflare R2 storage reachable and verified.',
    },
    socket: {
      status: 'active',
      active: true,
      connectedClients: 4,
    },
    ai: {
      status: 'ready',
      model: 'gemini-2.5-flash',
      configured: true,
      endpoint: 'generativelanguage.googleapis.com',
    },
    email: {
      configured: true,
      host: 'smtp.gmail.com',
      port: 587,
      from: 'Virtual Herbal Garden <noreply@example.com>',
    },
  },
  runtime: {
    nodeVersion: 'v20.12.0',
    platform: 'win32',
    arch: 'x64',
    uptimeSeconds: 86400,
    uptimeFormatted: '1d 0h 0m 0s',
    environment: 'development',
    apiVersion: 'v1',
    clientUrl: 'http://localhost:5173',
    memory: {
      heapUsedMb: 68.4,
      heapTotalMb: 112.5,
      rssMb: 145.2,
      heapPercent: 61,
    },
  },
  metrics: {
    users: {
      total: 42,
      activeToday: 18,
      superAdmins: 2,
      admins: 4,
      botanists: 8,
      twoFactorEnrolled: 15,
      twoFactorAdoptionRate: 36,
    },
    content: {
      plantsTotal: 14,
      plantsPublished: 12,
      remediesTotal: 6,
      remediesPublished: 5,
      toursTotal: 8,
      toursPublished: 8,
      totalCatalogItems: 28,
    },
    sessions: {
      activeSessionsTotal: 7,
    },
    detections: {
      totalScans: 85,
      completed: 80,
      failed: 5,
      successRate: 94,
    },
  },
  collections: [
    {
      name: 'users',
      label: 'User Accounts',
      count: 42,
      detail: '18 active today',
      category: 'Identity & Access',
      path: '/dashboard/users',
    },
    {
      name: 'plants',
      label: 'Medicinal Plants',
      count: 14,
      published: 12,
      drafts: 2,
      category: 'Botanical Catalog',
      path: '/dashboard/content/plants',
    },
    {
      name: 'remedies',
      label: 'Herbal Remedies',
      count: 6,
      published: 5,
      drafts: 1,
      category: 'Botanical Catalog',
      path: '/dashboard/content/remedies',
    },
    {
      name: 'tours',
      label: 'Virtual Guided Tours',
      count: 8,
      published: 8,
      drafts: 0,
      category: 'Experiences',
      path: '/dashboard/tours/manage',
    },
  ],
  securityPulse: {
    failedLoginsLast24h: 2,
    suspiciousIpsCount: 0,
    recentEvents: [
      {
        id: 'ev-1',
        action: 'LOGIN_FAILED',
        severity: 'WARN',
        actor: null,
        entityType: 'User',
        ipAddress: '192.168.1.50',
        createdAt: new Date().toISOString(),
      },
    ],
  },
  policies: {
    maxUploadSizeMb: 10,
    detectionTtlDays: 90,
    refreshTokenExpiryDays: 30,
    reauthExpiryMinutes: 5,
    rateLimits: {
      global: 100,
      auth: 5,
      detection: 10,
    },
  },
  generatedAt: new Date().toISOString(),
};

const mockPings: ISubsystemPings = {
  database: { ok: true, latencyMs: 2 },
  storage: { ok: true, latencyMs: 45, message: 'R2 connected' },
  socket: { ok: true, latencyMs: 1, connectedClients: 4 },
  ai: { ok: true, latencyMs: 5, model: 'gemini-2.5-flash' },
  timestamp: new Date().toISOString(),
};

describe('SystemOverviewPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state and then comprehensive system health and KPIs', async () => {
    vi.spyOn(systemApi, 'getSystemOverview').mockResolvedValue(mockOverview);

    render(
      <MemoryRouter>
        <SystemOverviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/System Overview/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/MongoDB Database/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Cloudflare R2 Storage/i)).toBeInTheDocument();
    expect(screen.getByText(/Socket.io Realtime/i)).toBeInTheDocument();
    expect(screen.getByText(/Gemini AI Engine/i)).toBeInTheDocument();
    expect(screen.getByText(/v20.12.0/i)).toBeInTheDocument();
    expect(screen.getByText(/1d 0h 0m 0s/i)).toBeInTheDocument();
    expect(screen.getAllByText('42').length).toBeGreaterThan(0);
    expect(screen.getAllByText('28').length).toBeGreaterThan(0);
  });

  it('triggers Run Diagnostics and updates latency badges', async () => {
    vi.spyOn(systemApi, 'getSystemOverview').mockResolvedValue(mockOverview);
    const pingSpy = vi.spyOn(systemApi, 'pingSubsystems').mockResolvedValue(mockPings);

    render(
      <MemoryRouter>
        <SystemOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/MongoDB Database/i)).toBeInTheDocument();
    });

    const diagBtn = screen.getByRole('button', { name: /Run Diagnostics/i });
    fireEvent.click(diagBtn);

    await waitFor(() => {
      expect(pingSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('triggers Clear Cache and Purge Sessions operational actions', async () => {
    vi.spyOn(systemApi, 'getSystemOverview').mockResolvedValue(mockOverview);
    const cacheSpy = vi.spyOn(systemApi, 'clearSystemCache').mockResolvedValue({
      success: true,
      message: 'Cache cleared',
      timestamp: new Date().toISOString(),
    });
    const purgeSpy = vi.spyOn(systemApi, 'purgeExpiredSessions').mockResolvedValue({
      success: true,
      purgedCount: 3,
      message: 'Purged 3 sessions',
      timestamp: new Date().toISOString(),
    });

    render(
      <MemoryRouter>
        <SystemOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/MongoDB Database/i)).toBeInTheDocument();
    });

    const clearCacheBtn = screen.getByRole('button', { name: /Clear Cache/i });
    fireEvent.click(clearCacheBtn);

    await waitFor(() => {
      expect(cacheSpy).toHaveBeenCalledTimes(1);
    });

    const purgeSessionsBtn = screen.getByRole('button', { name: /Purge Sessions/i });
    fireEvent.click(purgeSessionsBtn);

    await waitFor(() => {
      expect(purgeSpy).toHaveBeenCalledTimes(1);
    });
  });

  it('renders database collections catalog with correct active dashboard manage links', async () => {
    vi.spyOn(systemApi, 'getSystemOverview').mockResolvedValue(mockOverview);

    render(
      <MemoryRouter>
        <SystemOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Database Collections & Catalog Distribution')).toBeInTheDocument();
    });

    const manageLinks = screen.getAllByRole('link', { name: /Manage/i });
    expect(manageLinks.length).toBe(4);
    expect(manageLinks[0]).toHaveAttribute('href', '/dashboard/users');
    expect(manageLinks[1]).toHaveAttribute('href', '/dashboard/content/plants');
    expect(manageLinks[2]).toHaveAttribute('href', '/dashboard/content/remedies');
    expect(manageLinks[3]).toHaveAttribute('href', '/dashboard/tours/manage');
  });
});

