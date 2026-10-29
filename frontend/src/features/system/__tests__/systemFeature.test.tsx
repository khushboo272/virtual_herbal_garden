import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ReauthDialog } from '../components/ReauthDialog';
import { RoleManagementPage } from '../pages/RoleManagementPage';
import { AuditLogPage } from '../pages/AuditLogPage';
import { systemApi } from '../api/system.api';
import { HeaderSearchDropdown } from '../../dashboard/shared/components/HeaderSearchDropdown';
import { SettingsProfilePage } from '../../dashboard/shared/pages/SettingsProfilePage';
import * as sharedApi from '../../dashboard/shared/api/sharedDashboardApi';

// Mock AuthContext
const mockUser = {
  id: 'super-1',
  email: 'superadmin@example.com',
  displayName: 'Super Admin',
  role: 'SUPER_ADMIN',
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    refreshUser: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock useAdmin hooks
vi.mock('../../../hooks/useAdmin', () => ({
  useAdminUsers: () => ({
    users: [
      { id: 'u1', name: 'Alice Botanist', displayName: 'Alice Botanist', email: 'alice@example.com', role: 'BOTANIST' },
      { id: 'u2', name: 'Bob User', displayName: 'Bob User', email: 'bob@example.com', role: 'USER' },
    ],
    isLoading: false,
    total: 2,
    fetchUsers: vi.fn(),
  }),
}));

describe('Frontend System Feature Tests (Part S1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. ReauthDialog Component Flow
  // ─────────────────────────────────────────────────────────────
  describe('ReauthDialog', () => {
    it('renders password and TOTP modes, calls API and handles success/cancel', async () => {
      const onSuccess = vi.fn();
      const onCancel = vi.fn();
      vi.spyOn(systemApi, 'reauth').mockResolvedValue({ reauthToken: 'mock-reauth-jwt-123' });

      render(<ReauthDialog isOpen={true} onSuccess={onSuccess} onCancel={onCancel} />);

      expect(screen.getByText(/Security Re-Authentication Required/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter your current password/i)).toBeInTheDocument();

      // Submit password
      const passwordInput = screen.getByPlaceholderText(/Enter your current password/i);
      fireEvent.change(passwordInput, { target: { value: 'MySecretPassword123' } });

      const confirmBtn = screen.getByRole('button', { name: /Confirm & Proceed/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(systemApi.reauth).toHaveBeenCalledWith('MySecretPassword123', undefined);
        expect(onSuccess).toHaveBeenCalledWith('mock-reauth-jwt-123');
      });

      // Switch to 2FA / Backup Code mode
      const totpBtn = screen.getByRole('button', { name: /2FA \/ Backup Code/i });
      fireEvent.click(totpBtn);

      expect(screen.getByPlaceholderText('e.g. 123456 or XXXX-XXXX')).toBeInTheDocument();

      // Cancel button
      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelBtn);
      expect(onCancel).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. RoleManagementPage Tabs & Admin Accounts View
  // ─────────────────────────────────────────────────────────────
  describe('RoleManagementPage', () => {
    it('renders tabs: Users & Roles, Admin Accounts, Permission Matrix without crashing', async () => {
      vi.spyOn(systemApi, 'getAdmins').mockResolvedValue([
        {
          _id: 'admin-1',
          email: 'admin1@example.com',
          displayName: 'Lead Moderator',
          role: 'ADMIN',
          is2faEnabled: true,
          provider: 'local',
          lastActiveAt: new Date().toISOString(),
          actionsLast30Days: 42,
        },
      ]);

      vi.spyOn(systemApi, 'getRolesMatrix').mockResolvedValue({
        capabilities: [
          {
            key: 'admin.users.list',
            category: 'User Management',
            description: 'List registered platform users',
            minimumRole: 'ADMIN',
            routeMethod: 'GET',
            routePath: '/api/v1/admin/users',
          },
        ],
        hierarchy: { GUEST: 0, USER: 1, BOTANIST: 2, ADMIN: 3, SUPER_ADMIN: 4 },
      });

      render(
        <MemoryRouter>
          <RoleManagementPage />
        </MemoryRouter>
      );

      // Verify Header and Users & Roles tab is active initially
      expect(screen.getByRole('heading', { level: 1, name: /Role Management/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Users & Roles/i })).toBeInTheDocument();
      expect(screen.getByText('Alice Botanist')).toBeInTheDocument();

      // Switch to Admin Accounts tab
      const adminsBtn = screen.getByRole('button', { name: /Admin Accounts/i });
      fireEvent.click(adminsBtn);

      await waitFor(() => {
        expect(screen.getByText('Lead Moderator')).toBeInTheDocument();
        expect(screen.getByText('admin1@example.com')).toBeInTheDocument();
      });

      // Switch to Permission Matrix tab
      const matrixBtn = screen.getByRole('button', { name: /Permission Matrix/i });
      fireEvent.click(matrixBtn);

      await waitFor(() => {
        expect(screen.getByText('admin.users.list')).toBeInTheDocument();
        expect(screen.getByText('List registered platform users')).toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. AuditLogPage Filters, Details Drawer & Export
  // ─────────────────────────────────────────────────────────────
  describe('AuditLogPage', () => {
    it('renders audit events, filter controls, and security events tab', async () => {
      vi.spyOn(systemApi, 'getAuditSummary').mockResolvedValue({
        last24hCount: 15,
        last7dCount: 85,
        last30dCount: 320,
        topActions: [{ action: 'LOGIN', count: 120 }],
      });

      vi.spyOn(systemApi, 'getAuditLogs').mockResolvedValue({
        logs: [
          {
            _id: 'log-1',
            action: 'ROLE_CHANGE',
            severity: 'WARN',
            entityType: 'User',
            entityId: 'u2',
            user: { email: 'superadmin@example.com', displayName: 'Super Admin', role: 'SUPER_ADMIN' },
            oldValue: { role: 'USER' },
            newValue: { role: 'ADMIN' },
            ipAddress: '127.0.0.1',
            userAgent: 'Mozilla/5.0',
            createdAt: new Date().toISOString(),
          },
        ],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      vi.spyOn(systemApi, 'getSecurityEvents').mockResolvedValue({
        failedLoginsByDay: [{ day: '2026-10-28', count: 2 }],
        recentLockouts: [],
        recentRoleChanges: [],
        suspiciousIps: [{ ip: '203.0.113.50', failedAttempts: 6, lastAttempt: new Date().toISOString() }],
      });

      render(
        <MemoryRouter>
          <AuditLogPage />
        </MemoryRouter>
      );

      // Verify Header & Summary metrics
      expect(screen.getByRole('heading', { level: 1, name: /System Audit Log/i })).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('ROLE_CHANGE')).toBeInTheDocument();
      });

      // Verify export button exists
      expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();

      // Click Security Events tab
      const secTab = screen.getByRole('button', { name: /Security Events/i });
      fireEvent.click(secTab);

      await waitFor(() => {
        expect(screen.getByText('203.0.113.50')).toBeInTheDocument();
        expect(screen.getByText('6 failed attempts')).toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. HeaderSearchDropdown Autofill Attributes & ADMIN Groups
  // ─────────────────────────────────────────────────────────────
  describe('HeaderSearchDropdown', () => {
    it('sets autoComplete="off", type="search", and stable name to prevent autofill heuristics', () => {
      render(
        <MemoryRouter>
          <HeaderSearchDropdown />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/search plants, remedies/i);
      expect(input).toHaveAttribute('type', 'search');
      expect(input).toHaveAttribute('name', 'dashboard-header-search');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('displays Users and Tours groups for Admin queries and shows role-aware empty message', async () => {
      vi.spyOn(sharedApi, 'searchDashboardGrouped').mockResolvedValue({
        plants: [],
        remedies: [],
      });

      vi.spyOn(systemApi, 'adminSearch').mockResolvedValue({
        users: [{ _id: 'u-admin', displayName: 'Jane Specialist', email: 'j***@example.com', role: 'BOTANIST' }],
        tours: [{ _id: 't-tour', title: 'Himalayan Medicinal Walk', summary: 'High-altitude remedies' }],
      });

      render(
        <MemoryRouter>
          <HeaderSearchDropdown />
        </MemoryRouter>
      );

      const input = screen.getByPlaceholderText(/search plants, remedies/i);
      fireEvent.change(input, { target: { value: 'Himalayan' } });

      await waitFor(() => {
        expect(screen.getByText('Himalayan Medicinal Walk')).toBeInTheDocument();
        expect(screen.getByText('Jane Specialist')).toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. SettingsProfilePage Role-Aware Copy & Security Center
  // ─────────────────────────────────────────────────────────────
  describe('SettingsProfilePage', () => {
    it('renders role-aware copy without "Herbal explorer" for Super Admin and loads security center', async () => {
      vi.spyOn(sharedApi, 'getProfile').mockResolvedValue({
        id: 'super-1',
        email: 'superadmin@example.com',
        displayName: 'Super Admin',
        role: 'SUPER_ADMIN',
        bio: 'Chief Governance Officer',
      } as any);

      vi.spyOn(systemApi, 'get2faStatus').mockResolvedValue({
        enabled: true,
        backupCodesCount: 8,
      });

      vi.spyOn(systemApi, 'getMySessions').mockResolvedValue([
        {
          id: 'sess-1',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          deviceInfo: { browser: 'Chrome', os: 'Windows 11', device: 'Desktop' },
          isCurrent: true,
          createdAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
        },
      ]);

      vi.spyOn(systemApi, 'getMyPreferences').mockResolvedValue({
        newSubmission: true,
        roleApplication: true,
        support: true,
        flaggedReview: true,
        security: true,
        system: true,
      });

      vi.spyOn(systemApi, 'getMyLoginHistory').mockResolvedValue([
        {
          id: 'hist-1',
          action: 'LOGIN',
          ipAddress: '127.0.0.1',
          userAgent: 'Chrome on Windows',
          createdAt: new Date().toISOString(),
        },
      ]);

      vi.spyOn(systemApi, 'getAuditLogs').mockResolvedValue({
        logs: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 1 },
      });

      render(
        <MemoryRouter>
          <SettingsProfilePage />
        </MemoryRouter>
      );

      // Verify role-aware title and badge (present in header and card)
      expect(screen.getAllByText('Super Administrator').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText(/Herbal explorer/i)).not.toBeInTheDocument();

      // Verify 2FA status
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText(/Remaining backup codes:/i)).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /New Backup Codes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Disable 2FA/i })).toBeInTheDocument();
      });

      // Verify Sessions
      expect(screen.getByText(/Current Session/i)).toBeInTheDocument();

      // Verify Notification Preferences
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Security Alerts')).toBeInTheDocument();
      expect(screen.getByText('Contributor & Role Applications')).toBeInTheDocument();
    });
  });
});
