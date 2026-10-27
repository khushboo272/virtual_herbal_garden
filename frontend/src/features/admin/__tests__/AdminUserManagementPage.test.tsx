import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminUserManagementPage } from '../pages/AdminUserManagementPage';
import * as adminApi from '../api/adminApi';

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      _id: 'admin-id-123',
      sub: 'admin-id-123',
      displayName: 'Dr. Arun Sharma',
      email: 'admin@virtualherbal.garden',
      role: 'ADMIN',
    },
  }),
}));

describe('AdminUserManagementPage - Edge Cases and Fault Tolerance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edge-case users: null lastActiveAt, banned user, google-only, and empty name', async () => {
    const edgeCaseUsers: any[] = [
      {
        id: 'user-1',
        _id: 'user-1',
        displayName: '', // empty name
        email: 'emptyname@test.com',
        role: 'USER',
        provider: 'google', // Google-only user
        isActive: true,
        isBanned: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastActiveAt: null, // null lastActiveAt
      },
      {
        id: 'user-2',
        _id: 'user-2',
        displayName: 'Banned Contributor',
        email: 'banned@test.com',
        role: 'BOTANIST',
        provider: 'local',
        isActive: false,
        isBanned: true, // banned user
        banReason: 'Spamming',
        createdAt: '2026-02-01T00:00:00.000Z',
        lastActiveAt: '2026-02-15T00:00:00.000Z',
      },
    ];

    vi.spyOn(adminApi, 'getAdminUsers').mockResolvedValue({
      items: edgeCaseUsers,
      pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
    });

    render(
      <BrowserRouter>
        <AdminUserManagementPage />
      </BrowserRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    });

    // 1. Empty name should fallback to email username or 'Unknown User'
    expect(screen.getByText('emptyname')).toBeInTheDocument();

    // 2. Google provider displayed
    expect(screen.getByText('GOOGLE')).toBeInTheDocument();

    // 3. Null lastActiveAt should display 'Never'
    expect(screen.getByText('Never')).toBeInTheDocument();

    // 4. Banned user should show 'Suspended' badge
    expect(screen.getByText('Suspended')).toBeInTheDocument();
  });

  it('renders clean empty state when there are zero users', async () => {
    vi.spyOn(adminApi, 'getAdminUsers').mockResolvedValue({
      items: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    });

    render(
      <BrowserRouter>
        <AdminUserManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading users...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('No users found')).toBeInTheDocument();
    expect(screen.getByText(/Try modifying your search criteria/i)).toBeInTheDocument();
  });

  it('renders readable error state with Retry button on API failure, and retries on click', async () => {
    const getAdminUsersSpy = vi
      .spyOn(adminApi, 'getAdminUsers')
      .mockRejectedValueOnce(new Error('Network connection timeout'))
      .mockResolvedValueOnce({
        items: [
          {
            id: 'recovered-user',
            _id: 'recovered-user',
            displayName: 'Recovered User',
            email: 'recovered@test.com',
            role: 'USER',
            provider: 'local',
            isActive: true,
            isBanned: false,
            createdAt: '2026-03-01T00:00:00.000Z',
            lastActiveAt: '2026-03-02T00:00:00.000Z',
          },
        ],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

    render(
      <BrowserRouter>
        <AdminUserManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
      expect(screen.getByText('Network connection timeout')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /retry/i });
    expect(retryBtn).toBeInTheDocument();

    // Click retry
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText('Recovered User')).toBeInTheDocument();
    });

    expect(getAdminUsersSpy).toHaveBeenCalledTimes(2);
  });

  it('safely handles missing counts in user detail drawer', async () => {
    vi.spyOn(adminApi, 'getAdminUsers').mockResolvedValue({
      items: [
        {
          id: 'user-detail-test',
          _id: 'user-detail-test',
          displayName: 'Jane Botanist',
          email: 'jane@test.com',
          role: 'BOTANIST',
          provider: 'local',
          isActive: true,
          isBanned: false,
          createdAt: '2026-04-01T00:00:00.000Z',
          lastActiveAt: '2026-04-02T00:00:00.000Z',
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    // Mock detail endpoint returning user with missing counts and null activity
    vi.spyOn(adminApi, 'getAdminUserDetail').mockResolvedValue({
      user: {
        id: 'user-detail-test',
        _id: 'user-detail-test',
        displayName: 'Jane Botanist',
        email: 'jane@test.com',
        role: 'BOTANIST',
        provider: 'local',
        isActive: true,
        isBanned: false,
        createdAt: '2026-04-01T00:00:00.000Z',
        lastActiveAt: null,
      },
      counts: null as any, // Missing counts
      recentActivity: null as any, // Missing activity
    } as any);

    render(
      <BrowserRouter>
        <AdminUserManagementPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jane Botanist')).toBeInTheDocument();
    });

    // Click on row to open detail drawer
    fireEvent.click(screen.getByText('Jane Botanist'));

    await waitFor(() => {
      expect(screen.getByText('User Profile & Activity')).toBeInTheDocument();
    });

    // Counts should safely default to 0 without crashing
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });
});
