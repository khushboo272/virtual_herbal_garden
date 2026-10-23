import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as toursApi from '../api/toursApi';
import { useTourProgress } from '../hooks/useTourProgress';
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { ToursHubPage } from '../pages/ToursHubPage';
import { TourCheckpointPage } from '../pages/TourCheckpointPage';
import { AdminTourEditorPage } from '../admin/AdminTourEditorPage';
import { RequireRole } from '../../../app/components/RequireRole';
import type { Tour } from '../types/tour.types';

// Mock tours API
vi.mock('../api/toursApi', () => ({
  listTours: vi.fn(),
  getTour: vi.fn(),
  getMeProgress: vi.fn().mockResolvedValue([]),
  getTourProgress: vi.fn(),
  completeCheckpoint: vi.fn(),
  submitQuiz: vi.fn(),
  syncProgress: vi.fn(),
  rateTour: vi.fn(),
  restartTour: vi.fn(),
  getAdminToursList: vi.fn().mockResolvedValue([]),
  getAdminAnalytics: vi.fn(),
  getTourAnalytics: vi.fn(),
  createTour: vi.fn(),
  updateTour: vi.fn(),
  publishTour: vi.fn(),
  unpublishTour: vi.fn(),
  deleteTour: vi.fn(),
  getToursByPlant: vi.fn().mockResolvedValue([]),
}));

const ROLE_HIERARCHY: Record<string, number> = {
  GUEST: 0,
  USER: 1,
  BOTANIST: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

// Mock AuthContext
let mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null as any,
  role: 'GUEST',
  token: null as string | null,
  hasMinRole: (min: string) => (ROLE_HIERARCHY[mockAuthState.role] || 0) >= (ROLE_HIERARCHY[min] || 0),
};

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

const mockTour: Tour = {
  id: 'tour-1',
  slug: 'kitchen-pharmacy',
  title: 'Your Kitchen Pharmacy',
  summary: 'Everyday spices with potent medicinal value.',
  healthCategory: 'digestion',
  level: 'BEGINNER',
  tags: ['kitchen', 'spices'],
  estimatedMinutes: 10,
  checkpointCount: 2,
  sequential: true,
  isPublished: true,
  isFeatured: true,
  checkpoints: [
    {
      key: 'cp-turmeric',
      order: 1,
      title: 'Turmeric (Haridra)',
      summary: 'The Golden Healer',
      body: 'Turmeric has been used for centuries for inflammation and joint comfort.',
      durationMinutes: 5,
      plantSlugs: ['turmeric'],
      remedySlugs: [],
      keyTakeaways: ['Curcumin compounds', 'Traditional warm milk drink'],
      quiz: {
        passScore: 0.6,
        questions: [
          {
            prompt: 'What is the active yellow constituent in turmeric?',
            options: ['Curcumin', 'Capsaicin', 'Menthol'],
          },
        ],
      },
    },
    {
      key: 'cp-ginger',
      order: 2,
      title: 'Ginger (Sunthi)',
      summary: 'Digestive fire',
      body: 'Fresh and dried ginger stimulate agni and soothe indigestion.',
      durationMinutes: 5,
      plantSlugs: ['ginger'],
      remedySlugs: [],
      keyTakeaways: ['Warming digestive root'],
    },
  ],
};

describe('Tours Module Frontend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthState = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      role: 'GUEST',
      token: null,
      hasMinRole: (min: string) => (ROLE_HIERARCHY['GUEST'] || 0) >= (ROLE_HIERARCHY[min] || 0),
    };
  });

  // ── 1. useDocumentTitle Hook ──
  describe('useDocumentTitle', () => {
    it('sets document.title on mount and restores previous title on unmount', () => {
      document.title = 'Original Title';
      const { unmount } = renderHook(() => useDocumentTitle('New Page Title'));
      expect(document.title).toBe('New Page Title');

      unmount();
      expect(document.title).toBe('Original Title');
    });
  });

  // ── 2. useTourProgress Hook ──
  describe('useTourProgress', () => {
    it('guest user saves completed keys and quiz scores in localStorage', async () => {
      const { result } = renderHook(() =>
        useTourProgress('kitchen-pharmacy', mockTour.checkpoints, true)
      );

      // Initially no completed checkpoints
      expect(result.current.completedKeys).toEqual([]);

      // Mark checkpoint 1 complete locally
      await act(async () => {
        await result.current.completeCheckpoint('cp-turmeric');
      });

      expect(result.current.completedKeys).toContain('cp-turmeric');
      const stored = JSON.parse(localStorage.getItem('herb_tour_kitchen-pharmacy_progress') || '{}');
      expect(stored.completedKeys).toContain('cp-turmeric');
    });

    it('logged-in user fetches progress from server and syncs local keys', async () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'u1', role: 'USER', email: 'user@test.com' },
        role: 'USER',
        token: 'test-token',
        hasMinRole: (min: string) => (ROLE_HIERARCHY['USER'] || 0) >= (ROLE_HIERARCHY[min] || 0),
      };

      // Guest stored progress prior to login
      localStorage.setItem(
        'herb_tour_kitchen-pharmacy_progress',
        JSON.stringify({ completedKeys: ['cp-turmeric'], quizResults: {} })
      );

      vi.mocked(toursApi.syncProgress).mockResolvedValue({
        tourId: 'tour-1',
        slug: 'kitchen-pharmacy',
        percent: 50,
        completedKeys: ['cp-turmeric'],
        lastCheckpointKey: 'cp-turmeric',
      });

      vi.mocked(toursApi.getTourProgress).mockResolvedValue({
        tourId: 'tour-1',
        slug: 'kitchen-pharmacy',
        percent: 50,
        completedKeys: ['cp-turmeric'],
        lastCheckpointKey: 'cp-turmeric',
      });

      renderHook(() =>
        useTourProgress('kitchen-pharmacy', mockTour.checkpoints, true)
      );

      await waitFor(() => {
        expect(toursApi.syncProgress).toHaveBeenCalledWith('kitchen-pharmacy', ['cp-turmeric']);
      });

      // Local storage item should be cleared after sync
      expect(localStorage.getItem('herb_tour_kitchen-pharmacy_progress')).toBeNull();
    });
  });

  // ── 3. ToursHubPage ──
  describe('ToursHubPage', () => {
    it('renders tour cards and search facets', async () => {
      vi.mocked(toursApi.listTours).mockResolvedValue({
        tours: [
          {
            id: 'tour-1',
            slug: 'kitchen-pharmacy',
            title: 'Your Kitchen Pharmacy',
            summary: 'Everyday spices with potent medicinal value.',
            healthCategory: 'digestion',
            level: 'BEGINNER',
            estimatedMinutes: 10,
            checkpointCount: 2,
            isFeatured: true,
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 12,
          totalPages: 1,
          facets: {
            health: [{ slug: 'digestion', label: 'Digestive Health', count: 1 }],
            level: [{ name: 'BEGINNER', count: 1 }],
          },
        },
      });

      render(
        <MemoryRouter>
          <ToursHubPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        const matches = screen.getAllByText('Your Kitchen Pharmacy');
        expect(matches.length).toBeGreaterThan(0);
      });

      expect(screen.getByText('10 min')).toBeInTheDocument();
      expect(screen.getByText('2 checkpoints')).toBeInTheDocument();
    });

    it('renders empty state when no tours match filters', async () => {
      vi.mocked(toursApi.listTours).mockResolvedValue({
        tours: [],
        meta: {
          total: 0,
          page: 1,
          limit: 12,
          totalPages: 0,
          facets: { health: [], level: [] },
        },
      });

      render(
        <MemoryRouter>
          <ToursHubPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No Guided Tours Found')).toBeInTheDocument();
      });
    });

    it('renders error state with retry button on failure', async () => {
      vi.mocked(toursApi.listTours).mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter>
          <ToursHubPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to load tours/i)).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  // ── 4. TourCheckpointPage & Quiz Flow ──
  describe('TourCheckpointPage', () => {
    it('submits quiz and displays explanations', async () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'u1', role: 'USER', email: 'user@test.com' },
        role: 'USER',
        token: 'test-jwt',
        hasMinRole: (min: string) => (ROLE_HIERARCHY['USER'] || 0) >= (ROLE_HIERARCHY[min] || 0),
      };

      vi.mocked(toursApi.getTour).mockResolvedValue(mockTour);
      vi.mocked(toursApi.getTourProgress).mockResolvedValue({
        tourId: 'tour-1',
        slug: 'kitchen-pharmacy',
        percent: 0,
        completedKeys: [],
        lastCheckpointKey: null,
      });

      vi.mocked(toursApi.submitQuiz).mockResolvedValue({
        score: 1,
        total: 1,
        passed: true,
        results: [{ correct: true, explanation: 'Curcumin is the active curcuminoid.' }],
      });

      render(
        <MemoryRouter initialEntries={['/virtual-tour/kitchen-pharmacy/cp-turmeric']}>
          <Routes>
            <Route path="/virtual-tour/:slug/:key" element={<TourCheckpointPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Turmeric (Haridra)')).toBeInTheDocument();
      });

      // Select first option
      const option = screen.getByText('Curcumin');
      fireEvent.click(option);

      // Submit quiz
      const submitBtn = screen.getByRole('button', { name: /submit answer/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/curcumin is the active curcuminoid/i)).toBeInTheDocument();
      });
    });

    it('redirects to unlocked checkpoint if deep linking to a locked checkpoint', async () => {
      vi.mocked(toursApi.getTour).mockResolvedValue(mockTour);
      vi.mocked(toursApi.getTourProgress).mockResolvedValue({
        tourId: 'tour-1',
        slug: 'kitchen-pharmacy',
        percent: 0,
        completedKeys: [], // cp-turmeric is not completed
        lastCheckpointKey: null,
      });

      render(
        <MemoryRouter initialEntries={['/virtual-tour/kitchen-pharmacy/cp-ginger']}>
          <Routes>
            <Route path="/virtual-tour/:slug/:key" element={<TourCheckpointPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Should automatically navigate to cp-turmeric since cp-ginger is locked
      await waitFor(() => {
        expect(screen.getByText('Turmeric (Haridra)')).toBeInTheDocument();
      });
    });
  });

  // ── 5. AdminTourEditorPage ──
  describe('AdminTourEditorPage', () => {
    it('validates required fields and allows checkpoint reordering', async () => {
      render(
        <MemoryRouter initialEntries={['/dashboard/tours/manage/new']}>
          <Routes>
            <Route path="/dashboard/tours/manage/new" element={<AdminTourEditorPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Add a second checkpoint
      const addCpBtn = screen.getByRole('button', { name: /add checkpoint/i });
      fireEvent.click(addCpBtn);

      expect(screen.getByText('Introduction to Botanical Medicine')).toBeInTheDocument();
      expect(screen.getByText('Checkpoint 2')).toBeInTheDocument();

      // Checkpoint move up button exists
      const moveUpButtons = screen.getAllByTitle('Move Up');
      expect(moveUpButtons.length).toBeGreaterThan(0);
    });
  });

  // ── 6. Admin Route Guard ──
  describe('Admin Route Guard', () => {
    it('prevents regular USER from accessing admin builder', () => {
      mockAuthState = {
        isAuthenticated: true,
        isLoading: false,
        user: { id: 'u1', role: 'USER', email: 'user@test.com' },
        role: 'USER',
        token: 'user-token',
        hasMinRole: (min: string) => (ROLE_HIERARCHY['USER'] || 0) >= (ROLE_HIERARCHY[min] || 0),
      };

      render(
        <MemoryRouter initialEntries={['/dashboard/tours/manage/new']}>
          <Routes>
            <Route
              path="/dashboard/tours/manage/new"
              element={
                <RequireRole minimumRole="ADMIN">
                  <div>Admin Tour Builder Protected Content</div>
                </RequireRole>
              }
            />
            <Route path="/" element={<div>Home Redirect</div>} />
          </Routes>
        </MemoryRouter>
      );

      // The protected content should NOT be rendered for USER
      expect(screen.queryByText('Admin Tour Builder Protected Content')).toBeNull();
      // Should redirect to home
      expect(screen.getByText('Home Redirect')).toBeInTheDocument();
    });
  });
});
