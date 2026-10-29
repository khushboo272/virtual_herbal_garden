import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '../../../app/components/dashboard/DashboardLayout';
import { DashboardHome } from '../../../app/components/dashboard/DashboardHome';

// Admin Pages
import {
  ModerationQueuePage,
  ModerationReviewPage,
  ManageContentPlantsPage,
  ManageContentRemediesPage,
  AdminUserManagementPage,
  BecomeContributorPage,
} from '../../admin';

// Botanist Pages
import {
  MyContributionsPage,
  PlantEditorPage,
  RemedyEditorPage,
  AIFeedbackQueuePage,
} from '../../botanist';

// Shared Pages
import {
  BookmarksPage,
  MyGardenPage,
  SettingsProfilePage,
  HelpSupportPage,
} from '../shared';
import { GuidedToursPage } from '../../../app/components/dashboard/pages';
import { RoleManagementPage, AuditLogPage } from '../../system';

import * as adminApi from '../../admin/api/adminApi';
import * as contributionsApi from '../../botanist/api/contributionsApi';

// Mock AuthContext with ADMIN user
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      _id: 'admin-1',
      sub: 'admin-1',
      displayName: 'Dr. Arun Sharma',
      email: 'admin@virtualherbal.garden',
      role: 'ADMIN',
    },
    logout: vi.fn(),
  }),
}));

// Mock Navbar to avoid unnecessary network/child overhead
vi.mock('../../../components/navbar/Navbar', () => ({
  Navbar: () => <nav data-testid="navbar-mock">Navbar</nav>,
}));

// Mock API library for shared endpoints
vi.mock('../../../lib/api', () => ({
  api: {
    get: vi.fn((url: string) => {
      if (url.includes('/admin/moderation/summary')) {
        return Promise.resolve({ data: { success: true, data: { plants: 1, remedies: 0, applications: 0, total: 1 } } });
      }
      if (url.includes('/admin/dashboard-summary')) {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              stats: {
                totalUsers: 10,
                activeToday: 2,
                publishedPlants: 10,
                publishedRemedies: 3,
                toursPublished: 3,
                aiScansToday: 5,
                pendingReview: 1,
                pendingApplications: 0,
              },
              deltas: { newUsersThisWeek: 2, userGrowthDeltaPercent: 20 },
              pendingByType: { plants: 1, remedies: 0, applications: 0 },
              recentActivity: [],
              needsAttention: [],
            },
          },
        });
      }
      if (url.includes('/users/me/bookmarks')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      if (url.includes('/users/me/garden')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      if (url.includes('/tours')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      return Promise.resolve({ data: { success: true, data: [] } });
    }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    put: vi.fn().mockResolvedValue({ data: { success: true } }),
    patch: vi.fn().mockResolvedValue({ data: { success: true } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } }),
  },
}));

describe('Task 5: Dashboard Route Smoke Tests with Edge-Case Fixtures', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default edge-case mock responses (null fields, empty lists)
    vi.spyOn(adminApi, 'getDashboardSummary').mockResolvedValue({
      stats: {
        totalUsers: 1,
        activeToday: 0,
        publishedPlants: 0,
        publishedRemedies: 0,
        toursPublished: 0,
        aiScansToday: 0,
        pendingReview: 0,
        pendingApplications: 0,
      },
      deltas: { newUsersThisWeek: 0, userGrowthDeltaPercent: 0 },
      pendingByType: { plants: 0, remedies: 0, applications: 0 },
      recentActivity: [],
      needsAttention: [],
    });

    vi.spyOn(adminApi, 'getModerationSummary').mockResolvedValue({
      plants: 0,
      remedies: 0,
      applications: 0,
      total: 0,
    });

    vi.spyOn(adminApi, 'getModerationQueue').mockResolvedValue({
      items: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    });

    vi.spyOn(adminApi, 'getModerationItemDetail').mockResolvedValue({
      item: {
        id: 'test-plant-1',
        title: 'Diagnostic Plant',
        subtitle: null,
        family: null,
        description: null as any,
        status: 'PENDING_REVIEW',
        isPublished: false,
        submittedAt: '2026-10-27T00:00:00.000Z',
        daysAgo: 0,
        isOverdue: false,
        owner: { id: 'bot-1', displayName: 'Dr. Priya', email: 'priya@test.com', avatarUrl: null },
        reviewNotesCount: 0,
        flags: {},
        images: [],
        medicinalUses: [],
        references: [],
      },
      duplicateCandidates: [],
      safetyFindings: { isValid: true, violations: [] },
      reviewHistory: [],
      queuePosition: { current: 1, total: 1 },
    } as any);

    vi.spyOn(adminApi, 'getContentList').mockResolvedValue({
      items: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    });

    vi.spyOn(adminApi, 'getAdminUsers').mockResolvedValue({
      items: [
        {
          id: 'user-edge-1',
          _id: 'user-edge-1',
          displayName: '',
          email: '',
          role: 'USER',
          provider: 'local',
          isActive: true,
          isBanned: false,
          createdAt: '',
          lastActiveAt: null,
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      activeToday: 0,
    });

    vi.spyOn(adminApi, 'getRoleApplications').mockResolvedValue({
      items: [],
      pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    });

    vi.spyOn(adminApi, 'getMyRoleApplication').mockResolvedValue(null);

    vi.spyOn(contributionsApi, 'getContributionSummary').mockResolvedValue({
      total: 0,
      drafts: 0,
      pending: 0,
      published: 0,
      changesRequested: 0,
      rejected: 0,
    } as any);

    vi.spyOn(contributionsApi, 'listContributions').mockResolvedValue({
      items: [],
      meta: { total: 0, page: 1, limit: 20, totalPages: 1 },
    } as any);
  });

  const routesToSmoke = [
    { name: 'Dashboard Home', path: '/dashboard', element: <DashboardHome /> },
    { name: 'Moderation Queue', path: '/dashboard/moderation', element: <ModerationQueuePage /> },
    { name: 'Moderation Review', path: '/dashboard/moderation/plant/test-plant-1', element: <ModerationReviewPage /> },
    { name: 'Manage Plants', path: '/dashboard/content/plants', element: <ManageContentPlantsPage /> },
    { name: 'Manage Remedies', path: '/dashboard/content/remedies', element: <ManageContentRemediesPage /> },
    { name: 'User Management', path: '/dashboard/users', element: <AdminUserManagementPage /> },
    { name: 'Become a Botanist', path: '/dashboard/become-contributor', element: <BecomeContributorPage /> },
    { name: 'My Contributions', path: '/dashboard/contributions', element: <MyContributionsPage /> },
    { name: 'New Plant Editor', path: '/dashboard/contributions/plant/new', element: <PlantEditorPage /> },
    { name: 'New Remedy Editor', path: '/dashboard/contributions/remedy/new', element: <RemedyEditorPage /> },
    { name: 'AI Feedback Queue', path: '/dashboard/feedback-queue', element: <AIFeedbackQueuePage /> },
    { name: 'My Garden', path: '/dashboard/garden', element: <MyGardenPage /> },
    { name: 'Bookmarks', path: '/dashboard/bookmarks', element: <BookmarksPage /> },
    { name: 'Settings & Profile', path: '/dashboard/profile', element: <SettingsProfilePage /> },
    { name: 'Help & Support', path: '/dashboard/help', element: <HelpSupportPage /> },
    { name: 'Guided Tours', path: '/dashboard/tours', element: <GuidedToursPage /> },
    { name: 'Role Management', path: '/dashboard/system/role-management', element: <RoleManagementPage /> },
    { name: 'Audit Log', path: '/dashboard/system/audit-log', element: <AuditLogPage /> },
  ];

  routesToSmoke.forEach((route) => {
    it(`renders route "${route.name}" (${route.path}) without triggering the error fallback`, async () => {
      render(
        <MemoryRouter initialEntries={[route.path]}>
          <Routes>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route path={route.path.replace('/dashboard/', '')} element={route.element} />
              {route.path === '/dashboard' && <Route index element={route.element} />}
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Verify that RouteErrorBoundary did not catch an error
      expect(screen.queryByTestId('route-error-boundary-fallback')).not.toBeInTheDocument();
      expect(screen.queryByText('Unable to load page')).not.toBeInTheDocument();
    });
  });
});
