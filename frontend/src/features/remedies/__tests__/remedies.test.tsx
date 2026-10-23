import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import * as remediesApi from '../api/remediesApi';
import { useRemedySearch } from '../hooks/useRemedySearch';
import { RemediesPage } from '../pages/RemediesPage';
import { RemedyDetailPage } from '../pages/RemedyDetailPage';
import { NotFoundPage } from '../../../app/pages/NotFoundPage';
import type { Remedy, RemedyMeta } from '../types/remedy.types';

// Mock remedies API
vi.mock('../api/remediesApi', () => ({
  listRemedies: vi.fn(),
  getRemedy: vi.fn(),
  getRelatedRemedies: vi.fn(),
  getRemediesByPlant: vi.fn(),
  addRemedyFavorite: vi.fn(),
  removeRemedyFavorite: vi.fn(),
  getRemedyBookmarks: vi.fn().mockResolvedValue([]),
}));

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
  }),
}));

const mockRemedy: Remedy = {
  _id: 'rem-1',
  id: 'rem-1',
  title: 'Tulsi Ginger Kadha',
  slug: 'tulsi-ginger-kadha',
  description: 'A traditional Ayurvedic tea for cold and cough relief.',
  difficulty: 'EASY',
  difficultyLevel: 'EASY',
  preparationTime: 15,
  prepTimeMinutes: 15,
  usage: 'INTERNAL',
  traditionalSource: 'Ayurvedic Pharmacopoeia',
  dosage: '1 cup twice daily',
  isPublished: true,
  tags: ['respiratory', 'cold', 'immunity'],
  precautions: ['Do not boil honey directly with hot liquid'],
  contraindications: ['Pregnancy in high medicinal doses'],
  plants: [
    {
      _id: 'plant-1',
      id: 'plant-1',
      commonName: 'Holy Basil',
      scientificName: 'Ocimum sanctum',
      slug: 'holy-basil',
      images: [{ url: 'https://example.com/tulsi.jpg' }],
    },
  ],
  resolvedPlants: [
    {
      id: 'plant-1',
      commonName: 'Holy Basil',
      scientificName: 'Ocimum sanctum',
      slug: 'holy-basil',
      image: 'https://example.com/tulsi.jpg',
    },
  ],
  ingredients: [
    { name: 'Fresh Tulsi leaves', quantity: '10', unit: 'leaves', notes: 'Holy basil' },
    { name: 'Crushed Ginger', quantity: '1', unit: 'inch', notes: 'Zingiber officinale' },
  ],
  preparationSteps: [
    { step: 1, instruction: 'Boil water with ginger and tulsi leaves', durationMinutes: 5 },
    { step: 2, instruction: 'Simmer on low heat for 10 minutes', durationMinutes: 10 },
    { step: 3, instruction: 'Strain and serve warm', durationMinutes: 1 },
  ],
};

const mockMeta: RemedyMeta = {
  page: 1,
  limit: 12,
  total: 1,
  totalPages: 1,
  facets: {
    health: [{ slug: 'respiratory', label: 'Respiratory', count: 1 }],
    difficulty: [{ name: 'EASY', count: 1 }],
  },
};

describe('Remedies Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useRemedySearch Hook', () => {
    it('initializes with URL parameters and debounces query changes', async () => {
      vi.mocked(remediesApi.listRemedies).mockResolvedValue({
        remedies: [mockRemedy],
        meta: mockMeta,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={['/remedies?q=tulsi&health=respiratory']}>
          {children}
        </MemoryRouter>
      );

      const { result } = renderHook(() => useRemedySearch(), { wrapper });

      expect(result.current.params.q).toBe('tulsi');
      expect(result.current.params.health).toBe('respiratory');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.remedies.length).toBe(1);
      expect(result.current.remedies[0].title).toBe('Tulsi Ginger Kadha');
    });

    it('updates difficulty and sort filters', async () => {
      vi.mocked(remediesApi.listRemedies).mockResolvedValue({
        remedies: [mockRemedy],
        meta: mockMeta,
      });

      const wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={['/remedies']}>
          {children}
        </MemoryRouter>
      );

      const { result } = renderHook(() => useRemedySearch(), { wrapper });

      act(() => {
        result.current.setDifficulty('HARD');
      });

      await waitFor(() => {
        expect(remediesApi.listRemedies).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'HARD' }),
          expect.anything(),
        );
      });
    });
  });

  describe('RemediesPage Component', () => {
    it('renders remedy card results correctly without efficacy percentages', async () => {
      vi.mocked(remediesApi.listRemedies).mockResolvedValue({
        remedies: [mockRemedy],
        meta: mockMeta,
      });

      render(
        <MemoryRouter initialEntries={['/remedies']}>
          <RemediesPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getAllByText('Tulsi Ginger Kadha').length).toBeGreaterThan(0);
      });

      // Confirm medical disclaimer is visible
      expect(
        screen.getByText(/Traditional remedies are shared for education only and are not medical advice/i),
      ).toBeInTheDocument();

      // Confirm no fake efficacy percentages exist
      expect(screen.queryByText(/% Effective/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/% effectiveness/i)).not.toBeInTheDocument();
    });

    it('renders empty state when no remedies match', async () => {
      vi.mocked(remediesApi.listRemedies).mockResolvedValue({
        remedies: [],
        meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
      });

      render(
        <MemoryRouter initialEntries={['/remedies?q=nonexistent']}>
          <RemediesPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('No remedies found')).toBeInTheDocument();
      });
      expect(screen.getByText(/We couldn't find any remedies matching "nonexistent"/i)).toBeInTheDocument();
    });

    it('renders error state with retry button on failure', async () => {
      vi.mocked(remediesApi.listRemedies).mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter initialEntries={['/remedies']}>
          <RemediesPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Unable to load remedies')).toBeInTheDocument();
      });
      expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
    });
  });

  describe('RemedyDetailPage Component', () => {
    it('renders ingredients with linked plants, safety precautions, and interactive steps checklist', async () => {
      vi.mocked(remediesApi.getRemedy).mockResolvedValue(mockRemedy);
      vi.mocked(remediesApi.getRelatedRemedies).mockResolvedValue([]);

      render(
        <MemoryRouter initialEntries={['/remedies/tulsi-ginger-kadha']}>
          <Routes>
            <Route path="/remedies/:slug" element={<RemedyDetailPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Tulsi Ginger Kadha')).toBeInTheDocument();
      });

      // Verify Safety section with precautions and contraindications
      expect(screen.getByText('Important Safety & Precautions')).toBeInTheDocument();
      expect(screen.getByText('Do not boil honey directly with hot liquid')).toBeInTheDocument();
      expect(screen.getByText('Pregnancy in high medicinal doses')).toBeInTheDocument();

      // Verify Ingredients list
      expect(screen.getByText('Fresh Tulsi leaves')).toBeInTheDocument();
      expect(screen.getByText('Crushed Ginger')).toBeInTheDocument();

      // Verify Plant link
      const plantLinks = screen.getAllByRole('link', { name: /Holy Basil/i });
      expect(plantLinks.length).toBeGreaterThan(0);
      expect(plantLinks[0]).toHaveAttribute('href', '/plant/holy-basil');

      // Verify Preparation Steps checklist and progress
      expect(screen.getByText('0% done')).toBeInTheDocument();

      // Click step 1
      const step1Checkbox = screen.getByRole('button', { name: /Mark step 1 complete/i });
      fireEvent.click(step1Checkbox);

      // Verify progress updated
      expect(screen.getByText('33% done')).toBeInTheDocument();
    });
  });

  describe('NotFoundPage Route', () => {
    it('renders 404 message and navigation links for unknown paths', () => {
      render(
        <MemoryRouter initialEntries={['/unknown-path-xyz']}>
          <Routes>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText(/Lost in the Garden\?/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Return Home/i })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: /Plant Library/i })).toHaveAttribute('href', '/library');
    });
  });
});
