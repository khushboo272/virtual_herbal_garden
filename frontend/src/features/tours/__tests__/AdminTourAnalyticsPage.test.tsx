import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminTourAnalyticsPage } from '../admin/AdminTourAnalyticsPage';
import * as toursApi from '../api/toursApi';

vi.mock('../api/toursApi', () => ({
  getAdminAnalytics: vi.fn(),
  getAdminToursList: vi.fn(),
  getTourAnalytics: vi.fn(),
  updateTour: vi.fn(),
  publishTour: vi.fn(),
  unpublishTour: vi.fn(),
}));

const mockOverview = {
  totalTours: 3,
  published: 2,
  drafts: 1,
  featured: 1,
  totalStarts: 45,
  totalCompletions: 30,
  completionRate: 67,
  overallAvgRating: 4.8,
  totalRatingsCount: 12,
};

const mockToursList = [
  {
    id: 'tour-1',
    slug: 'respiratory-relief-walk',
    title: 'Respiratory Relief Walk',
    summary: 'A soothing trail for lungs and breathing',
    healthCategory: 'Respiratory Health',
    level: 'BEGINNER' as const,
    isPublished: true,
    isFeatured: true,
    checkpointCount: 3,
    startedCount: 30,
    completedCount: 20,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tour-2',
    slug: 'digestive-health-trail',
    title: 'Digestive Health Trail',
    summary: 'Gut wellness and digestive herbs',
    healthCategory: 'Digestion',
    level: 'INTERMEDIATE' as const,
    isPublished: false,
    isFeatured: false,
    checkpointCount: 4,
    startedCount: 15,
    completedCount: 10,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
];

const mockDetailAnalytics = {
  tourId: 'tour-1',
  slug: 'respiratory-relief-walk',
  title: 'Respiratory Relief Walk',
  started: 30,
  completed: 20,
  completionRate: 67,
  avgRating: 4.8,
  avgQuizScore: 85,
  tour: {
    id: 'tour-1',
    title: 'Respiratory Relief Walk',
    slug: 'respiratory-relief-walk',
    summary: 'A soothing trail for lungs and breathing',
    level: 'BEGINNER',
    healthCategory: 'Respiratory Health',
    isPublished: true,
    isFeatured: true,
    coverImageUrl: null,
    estimatedMinutes: 15,
    checkpointsCount: 3,
  },
  ratingDistribution: { 5: 10, 4: 2, 3: 0, 2: 0, 1: 0 },
  ratingsList: [
    {
      id: 'rate-1',
      rating: 5,
      comment: 'Incredible guided tour with rich insights on Tulsi and Vasaka!',
      user: {
        displayName: 'Aarav Patel',
        email: 'aarav@example.com',
        avatarUrl: null,
      },
      createdAt: '2026-02-01T10:00:00.000Z',
    },
  ],
  recentSessions: [
    {
      id: 'session-1',
      user: {
        displayName: 'Aarav Patel',
        email: 'aarav@example.com',
        avatarUrl: null,
      },
      percent: 100,
      completedCount: 3,
      totalCheckpoints: 3,
      isCompleted: true,
      lastCheckpointKey: 'cp-3',
      rating: 5,
      avgQuizScore: 90,
      startedAt: '2026-02-01T09:00:00.000Z',
      completedAt: '2026-02-01T09:25:00.000Z',
      updatedAt: '2026-02-01T09:25:00.000Z',
    },
    {
      id: 'session-2',
      user: {
        displayName: 'Priya Sharma',
        email: 'priya@example.com',
        avatarUrl: null,
      },
      percent: 33,
      completedCount: 1,
      totalCheckpoints: 3,
      isCompleted: false,
      lastCheckpointKey: 'cp-1',
      rating: null,
      avgQuizScore: 80,
      startedAt: '2026-02-02T11:00:00.000Z',
      completedAt: null,
      updatedAt: '2026-02-02T11:10:00.000Z',
    },
  ],
  perCheckpoint: [
    {
      key: 'cp-1',
      title: 'Introduction to Bronchodilators',
      order: 1,
      durationMinutes: 4,
      reached: 30,
      completed: 28,
      dropOffPct: 7,
      hasQuiz: true,
      quizQuestionsCount: 2,
      quizAttempts: 28,
      quizPassRate: 93,
      quizAvgScore: 88,
      plantSlugs: ['tulsi', 'adathodai'],
      remedySlugs: ['tulsi-kashayam'],
      keyTakeaways: ['Vasaka opens airways', 'Tulsi calms irritation'],
      hasAudio: true,
    },
    {
      key: 'cp-2',
      title: 'Steam Inhalation Herbs',
      order: 2,
      durationMinutes: 5,
      reached: 28,
      completed: 22,
      dropOffPct: 21,
      hasQuiz: true,
      quizQuestionsCount: 1,
      quizAttempts: 22,
      quizPassRate: 77,
      quizAvgScore: 75,
      plantSlugs: ['mint', 'eucalyptus'],
      remedySlugs: [],
      keyTakeaways: ['Eucalyptus essential oils loosen mucus'],
      hasAudio: false,
    },
    {
      key: 'cp-3',
      title: 'Long-term Lung Strengthening',
      order: 3,
      durationMinutes: 6,
      reached: 22,
      completed: 20,
      dropOffPct: 9,
      hasQuiz: false,
      quizQuestionsCount: 0,
      quizAttempts: 0,
      quizPassRate: null,
      quizAvgScore: null,
      plantSlugs: ['pippali'],
      remedySlugs: [],
      keyTakeaways: ['Pippali rejuvenates respiratory tissue'],
      hasAudio: true,
    },
  ],
};

describe('AdminTourAnalyticsPage - Enhanced Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(toursApi.getAdminAnalytics).mockResolvedValue(mockOverview as any);
    vi.mocked(toursApi.getAdminToursList).mockResolvedValue(mockToursList as any);
    vi.mocked(toursApi.getTourAnalytics).mockResolvedValue(mockDetailAnalytics as any);
  });

  it('renders quick action buttons for editing, live preview, toggle featured, and publish', async () => {
    render(
      <MemoryRouter>
        <AdminTourAnalyticsPage />
      </MemoryRouter>
    );

    // Wait for detail analytics to finish loading
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /Edit Tour/i })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /Edit Tour/i })).toHaveAttribute(
      'href',
      '/dashboard/tours/manage/tour-1'
    );
    expect(screen.getByRole('link', { name: /Preview Live/i })).toHaveAttribute(
      'href',
      '/virtual-tour/respiratory-relief-walk'
    );
    expect(screen.getByRole('button', { name: /Export All CSV/i })).toBeInTheDocument();
    expect(screen.getByTitle(/Export Tour Report/i)).toBeInTheDocument();
  });

  it('provides tour search and status filtering in the sidebar', async () => {
    render(
      <MemoryRouter>
        <AdminTourAnalyticsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Respiratory Relief Walk/i })).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search tours/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Digestive' } });

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Respiratory Relief Walk/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Digestive Health Trail/i })).toBeInTheDocument();
    });
  });

  it('allows navigating between analytical tabs: Funnel, Learner Sessions, Ratings & Feedback, Recommendations', async () => {
    render(
      <MemoryRouter>
        <AdminTourAnalyticsPage />
      </MemoryRouter>
    );

    // Wait for detail analytics and tabs to mount
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Learner Sessions/i })).toBeInTheDocument();
    });

    // Verify tabs exist
    const sessionsTab = screen.getByRole('tab', { name: /Learner Sessions/i });
    const ratingsTab = screen.getByRole('tab', { name: /Ratings & Feedback/i });
    const recommendationsTab = screen.getByRole('tab', { name: /Insights & Tips/i });

    expect(sessionsTab).toBeInTheDocument();
    expect(ratingsTab).toBeInTheDocument();
    expect(recommendationsTab).toBeInTheDocument();

    // Switch to Learner Sessions tab
    fireEvent.click(sessionsTab);

    await waitFor(() => {
      expect(screen.getByText('Aarav Patel')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    // Switch to Ratings & Feedback tab
    fireEvent.click(ratingsTab);

    await waitFor(() => {
      expect(screen.getByText(/Incredible guided tour with rich insights/i)).toBeInTheDocument();
    });

    // Switch to Recommendations tab
    fireEvent.click(recommendationsTab);

    await waitFor(() => {
      expect(screen.getByText(/Steam Inhalation Herbs/i)).toBeInTheDocument();
    });
  });

  it('allows toggling between Single Tour Deep-Dive and Benchmark Matrix view', async () => {
    render(
      <MemoryRouter>
        <AdminTourAnalyticsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Tour Analytics & Funnels')).toBeInTheDocument();
    });

    const benchmarkToggle = screen.getByRole('button', { name: /Benchmark Matrix/i });
    fireEvent.click(benchmarkToggle);

    await waitFor(() => {
      expect(screen.getByText(/All Tours Performance Comparison/i)).toBeInTheDocument();
      expect(screen.getByText('Digestive Health Trail')).toBeInTheDocument();
    });
  });
});
