import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { getBreadcrumbsForPath, findDashboardRoute } from '../../dashboard/dashboard.routes';
import { RequireRole } from '../../../app/components/RequireRole';
import { NavbarAdmin } from '../../../components/navbar/NavbarAdmin';
import { BecomeContributorPage } from '../pages/BecomeContributorPage';
import { DeleteImpactModal } from '../components/DeleteImpactModal';
import { ChangeRoleModal } from '../components/ChangeRoleModal';
import { FeaturedContentPage } from '../pages/FeaturedContentPage';
import { ModerationQueuePage } from '../pages/ModerationQueuePage';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'sonner';

// Mocks
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../app/components/dashboard/NotificationPanel', () => ({
  NotificationPanel: () => <div data-testid="notification-panel" />,
}));
vi.mock('../../../components/navbar/NavbarAvatarMenu', () => ({
  NavbarAvatarMenu: () => <div data-testid="navbar-avatar-menu" />,
}));
vi.mock('../../../components/navbar/NavbarMobileDrawer', () => ({
  NavbarMobileDrawer: () => <div data-testid="navbar-mobile-drawer" />,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('../../tours/api/toursApi', () => ({
  getAdminToursList: vi.fn().mockResolvedValue([
    {
      id: 'tour1',
      slug: 'ayurvedic-garden-intro',
      title: 'Ayurvedic Garden Introduction',
      summary: 'Explore traditional herbs',
      isFeatured: true,
      isPublished: true,
      checkpointCount: 4,
    },
  ]),
  updateTour: vi.fn().mockResolvedValue({ id: 'tour1', isFeatured: false }),
}));

vi.mock('../api/adminApi', () => {
  const submitRoleApplication = vi.fn().mockResolvedValue({ id: 'app1' });
  const getMyRoleApplication = vi.fn().mockResolvedValue(null);
  const getContentImpact = vi.fn().mockResolvedValue({
    remedies: 2,
    tours: 1,
    userGardens: 5,
    bookmarks: 10,
    total: 18,
  });
  const deleteContent = vi.fn().mockResolvedValue({ success: true });
  const updateUserRole = vi.fn().mockResolvedValue({ role: 'BOTANIST' });
  const getModerationSummary = vi.fn().mockResolvedValue({ plants: 0, remedies: 0, applications: 1, total: 1 });
  const getRoleApplications = vi.fn().mockResolvedValue({
    items: [
      {
        _id: 'app123',
        userId: { _id: 'u123', displayName: 'Aniket Test', email: 'aniket@example.com' },
        requestedRole: 'BOTANIST',
        motivation: 'I want to contribute traditional botanical recipes.',
        qualifications: 'BTech in CSE with medicinal flora interest',
        links: ['https://example.com/herb'],
        status: 'PENDING',
        applicantStats: { accountAgeDays: 1, contributionsCount: 0, scansCount: 0 },
      },
    ],
    pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
  });
  const approveRoleApplication = vi.fn().mockResolvedValue({ message: 'Application approved' });
  const rejectRoleApplication = vi.fn().mockResolvedValue({ message: 'Application rejected' });
  const getContentList = vi.fn().mockImplementation((type, params) => {
    if (params?.featured) {
      return Promise.resolve({
        items: [
          {
            _id: 'plant1',
            id: 'plant1',
            title: 'Holy Basil (Tulsi)',
            slug: 'tulsi',
            subtitle: 'Ocimum sanctum',
            isFeatured: true,
            isPublished: true,
            coverImage: 'https://example.com/tulsi.jpg',
          },
        ],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });
    }
    return Promise.resolve({
      items: [
        {
          _id: 'plant2',
          id: 'plant2',
          title: 'Ashwagandha',
          slug: 'ashwagandha',
          subtitle: 'Withania somnifera',
          isFeatured: false,
          isPublished: true,
        },
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });
  const toggleFeatureContent = vi.fn().mockResolvedValue({ success: true });

  return {
    submitRoleApplication,
    getMyRoleApplication,
    getContentImpact,
    deleteContent,
    updateUserRole,
    getModerationSummary,
    getRoleApplications,
    approveRoleApplication,
    rejectRoleApplication,
    getContentList,
    toggleFeatureContent,
    adminApi: {
      submitRoleApplication,
      getMyRoleApplication,
      getContentImpact,
      deleteContent,
      updateUserRole,
      getModerationSummary,
      getRoleApplications,
      approveRoleApplication,
      rejectRoleApplication,
      getContentList,
      toggleFeatureContent,
    },
  };
});

describe('Admin Feature Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Route config drives title & breadcrumb (BUG-030 fix) ──
  describe('1. Route config drives document title and breadcrumbs', () => {
    it('derives correct breadcrumbs and titles for admin routes', () => {
      const userRoute = findDashboardRoute('/dashboard/users');
      expect(userRoute?.label).toBe('User Management');
      expect(userRoute?.title).toContain('User Management');

      const breadcrumbs = getBreadcrumbsForPath('/dashboard/users');
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0]).toEqual({ label: 'Dashboard', path: '/dashboard', isLast: false });
      expect(breadcrumbs[1]).toEqual({ label: 'User Management', path: '/dashboard/users', isLast: true });

      const modRoute = findDashboardRoute('/dashboard/moderation');
      expect(modRoute?.title).toContain('Moderation Queue');
    });
  });

  // ── 2. Per-route guard redirect (BUG-036 fix) ──
  describe('2. Per-route role guard redirect', () => {
    it('redirects lower role (USER) away from ADMIN route to /dashboard with toast', () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'USER', email: 'user@test.com' },
        hasMinRole: (min: string) => min === 'USER' || min === 'GUEST',
      } as any);

      render(
        <MemoryRouter initialEntries={['/dashboard/users']}>
          <Routes>
            <Route
              path="/dashboard/users"
              element={
                <RequireRole minimumRole="ADMIN" forbiddenRedirect="/dashboard">
                  <div>Admin User Management Content</div>
                </RequireRole>
              }
            />
            <Route path="/dashboard" element={<div>Dashboard Home Redirect</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.queryByText('Admin User Management Content')).toBeNull();
      expect(screen.getByText('Dashboard Home Redirect')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('You need ADMIN privileges to access that section.');
    });
  });

  // ── 3. Top Navbar items by role (BUG-029 fix) ──
  describe('3. Admin top navbar links', () => {
    it('renders all public explorer links including AI Scanner, Remedies, and Virtual Tour', () => {
      render(
        <MemoryRouter>
          <NavbarAdmin />
        </MemoryRouter>
      );

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Library')).toBeInTheDocument();
      expect(screen.getByText('AI Scanner')).toBeInTheDocument();
      expect(screen.getByText('3D Garden')).toBeInTheDocument();
      expect(screen.getByText('Remedies')).toBeInTheDocument();
      expect(screen.getByText('Virtual Tour')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  // ── 4. Content delete confirmation (slug match requirement) ──
  describe('4. Content delete confirmation dialog', () => {
    it('disables delete button until exact slug is typed and executes delete on match', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <DeleteImpactModal
          isOpen={true}
          onClose={onClose}
          type="plants"
          itemId="p1"
          itemTitle="Brahmi Plant"
          itemSlug="brahmi-plant"
          onConfirm={onConfirm}
        />
      );

      // Loading impact
      expect(await screen.findByText('Impact Analysis')).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /delete permanently/i });
      expect(deleteBtn).toBeDisabled();

      // Typing wrong slug
      const input = screen.getByPlaceholderText('brahmi-plant');
      fireEvent.change(input, { target: { value: 'wrong-slug' } });
      expect(deleteBtn).toBeDisabled();

      // Typing exact slug
      fireEvent.change(input, { target: { value: 'brahmi-plant' } });
      expect(deleteBtn).not.toBeDisabled();

      fireEvent.click(deleteBtn);
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith('brahmi-plant');
      });
    });
  });

  // ── 5. User management allowed-roles logic ──
  describe('5. User Management allowed roles policy', () => {
    it('restricts ADMIN to only assign USER or BOTANIST and excludes self/higher role changes', () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      const targetUser = {
        id: 'u1',
        displayName: 'John Doe',
        email: 'john@example.com',
        role: 'USER',
      };

      // Admin acting on regular USER -> allowed roles are USER and BOTANIST
      render(
        <ChangeRoleModal
          isOpen={true}
          onClose={onClose}
          user={targetUser}
          currentUserRole="ADMIN"
          currentUserId="admin99"
          onSave={onSave}
        />
      );

      expect(screen.getByText(/Change Role/i)).toBeInTheDocument();
      expect(screen.getByText(/Botanist/i)).toBeInTheDocument();

      // Cannot assign ADMIN or SUPER_ADMIN
      expect(screen.queryByText(/^Admin$/i)).toBeNull();
      expect(screen.queryByText(/Super Admin/i)).toBeNull();
    });

    it('blocks ADMIN from editing themselves', () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      const selfAdmin = {
        id: 'admin1',
        displayName: 'Admin User',
        email: 'admin@example.com',
        role: 'ADMIN',
      };

      render(
        <ChangeRoleModal
          isOpen={true}
          onClose={onClose}
          user={selfAdmin}
          currentUserRole="ADMIN"
          currentUserId="admin1" // Self
          onSave={onSave}
        />
      );

      expect(screen.getByText(/You cannot modify your own role/i)).toBeInTheDocument();
    });
  });

  // ── 6. Become-contributor form ──
  describe('6. Become Contributor Application Form', () => {
    it('validates 50-character motivation requirement and submits application', async () => {
      vi.mocked(useAuth).mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'USER', displayName: 'Jane Doe', email: 'jane@test.com' },
      } as any);

      render(
        <MemoryRouter>
          <BecomeContributorPage />
        </MemoryRouter>
      );

      expect(await screen.findByText(/Contributor Application Form/i)).toBeInTheDocument();

      const motivationInput = screen.getByPlaceholderText(/Describe your interest in medicinal flora/i);
      const qualificationsInput = screen.getByPlaceholderText(/Share any degrees, certifications/i);
      const submitBtn = screen.getByRole('button', { name: /Submit Application/i });

      // Short motivation (< 50 chars) -> button disabled
      fireEvent.change(motivationInput, { target: { value: 'I like herbs.' } });
      fireEvent.change(qualificationsInput, { target: { value: 'BSc Botany' } });
      expect(submitBtn).toBeDisabled();

      // Valid motivation (> 50 chars) and qualifications (> 10 chars) -> button enabled
      fireEvent.change(motivationInput, {
        target: {
          value: 'I have researched Ayurvedic medicinal herbs for over 8 years in Kerala and want to contribute authentic references.',
        },
      });
      fireEvent.change(qualificationsInput, {
        target: { value: 'BSc Botany, University of Kerala' },
      });
      expect(submitBtn).not.toBeDisabled();

      fireEvent.click(submitBtn);
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Your application has been submitted for administrator review!');
      });
    });
  });

  // ── 7. Moderation Queue Role Application Approval (Fix Bug) ──
  describe('7. Moderation Queue Role Application Approval', () => {
    it('optimistically removes the role application card upon approval and notifies', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/moderation?type=application']}>
          <ModerationQueuePage />
        </MemoryRouter>
      );

      // Verify the application card appears
      expect(await screen.findByText('Aniket Test')).toBeInTheDocument();
      expect(screen.getByText('Seeking BOTANIST')).toBeInTheDocument();

      // Click Approve & Grant Botanist
      const approveBtn = screen.getByRole('button', { name: /Approve & Grant Botanist/i });
      fireEvent.click(approveBtn);

      // Verify card is immediately removed from the queue
      await waitFor(() => {
        expect(screen.queryByText('Aniket Test')).toBeNull();
      });

      // Verify success toast notification was fired
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Application approved! Aniket Test is now a Botanist.'),
        expect.anything()
      );
    });
  });

  // ── 8. Featured Content Management ──
  describe('8. Featured Content Management Page', () => {
    it('renders featured items and allows toggling to remove/feature', async () => {
      render(
        <MemoryRouter>
          <FeaturedContentPage />
        </MemoryRouter>
      );

      // Verify Featured Content Header & Plant tab
      expect(await screen.findByText(/Featured Content Manager/i)).toBeInTheDocument();
      expect(await screen.findByText('Holy Basil (Tulsi)')).toBeInTheDocument();

      // Click Remove button on featured plant
      const removeBtn = screen.getByRole('button', { name: /Remove/i });
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Removed "Holy Basil (Tulsi)" from Featured Plants'));
      });
    });
  });
});
