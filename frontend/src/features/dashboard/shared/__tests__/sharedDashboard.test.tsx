import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HeaderSearchDropdown } from '../components/HeaderSearchDropdown';
import { BookmarksPage } from '../pages/BookmarksPage';
import { MyGardenPage } from '../pages/MyGardenPage';
import { HelpSupportPage } from '../pages/HelpSupportPage';
import * as sharedApi from '../api/sharedDashboardApi';

vi.mock('../api/sharedDashboardApi', () => ({
  searchDashboardGrouped: vi.fn(),
  getBookmarks: vi.fn(),
  removeBookmark: vi.fn(),
  addBookmark: vi.fn(),
  getGarden: vi.fn(),
  updateGardenPlant: vi.fn(),
  removeGardenPlant: vi.fn(),
  submitSupportRequest: vi.fn(),
  getMySupportRequests: vi.fn(),
  getProfile: vi.fn(),
}));

const mockAuthUser = {
  id: 'u1',
  displayName: 'Dr. Jane Botanist',
  email: 'jane@botany.org',
  role: 'BOTANIST',
};

vi.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isAuthenticated: true,
    role: 'BOTANIST',
    hasMinRole: () => true,
    refreshUser: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('Shared Dashboard Pages & Components Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HeaderSearchDropdown', () => {
    it('renders input with placeholder and calls grouped search on query', async () => {
      vi.mocked(sharedApi.searchDashboardGrouped).mockResolvedValue({
        plants: [{ id: 'p1', commonName: 'Tulsi', scientificName: 'Ocimum sanctum', slug: 'tulsi' }],
        remedies: [{ id: 'r1', title: 'Tulsi Tea', slug: 'tulsi-tea', summary: 'Cold relief' }],
      });

      render(
        <MemoryRouter>
          <HeaderSearchDropdown />
        </MemoryRouter>,
      );

      const input = screen.getByPlaceholderText(/search plants, remedies/i);
      expect(input).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'Tulsi' } });

      await waitFor(() => {
        expect(screen.getByText('Tulsi')).toBeInTheDocument();
        expect(screen.getByText('Tulsi Tea')).toBeInTheDocument();
      });
    });
  });

  describe('BookmarksPage', () => {
    it('renders bookmark items and removes with undo', async () => {
      vi.mocked(sharedApi.getBookmarks).mockResolvedValue({
        bookmarks: [
          {
            _id: 'bm1',
            entityType: 'PLANT',
            entityId: 'p1',
            createdAt: '2026-10-24T10:00:00.000Z',
            item: {
              id: 'p1',
              title: 'Neem',
              subtitle: 'Azadirachta indica',
              slug: 'neem',
              image: 'https://example.com/neem.jpg',
              type: 'plant',
            },
          },
        ],
      });
      vi.mocked(sharedApi.removeBookmark).mockResolvedValue(undefined);

      render(
        <MemoryRouter>
          <BookmarksPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Neem')).toBeInTheDocument();
      });

      const removeBtn = screen.getByTitle('Remove bookmark');
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(sharedApi.removeBookmark).toHaveBeenCalledWith('bm1');
      });
    });
  });

  describe('MyGardenPage', () => {
    it('renders cultivated plants and allows growth stage modification', async () => {
      vi.mocked(sharedApi.getGarden).mockResolvedValue({
        _id: 'g1',
        name: 'My Garden',
        plants: [
          {
            _id: 'gp1',
            plant: {
              _id: 'p1',
              commonName: 'Ashwagandha',
              scientificName: 'Withania somnifera',
              slug: 'ashwagandha',
            },
            position: { x: 0, y: 0, z: 0 },
            growthStage: 'YOUNG',
            plantedAt: '2026-10-24T10:00:00.000Z',
            notes: 'Growing vigorously',
          },
        ],
      });
      vi.mocked(sharedApi.updateGardenPlant).mockResolvedValue({
        _id: 'g1',
        name: 'My Garden',
        plants: [
          {
            _id: 'gp1',
            plant: {
              _id: 'p1',
              commonName: 'Ashwagandha',
              scientificName: 'Withania somnifera',
              slug: 'ashwagandha',
            },
            position: { x: 0, y: 0, z: 0 },
            growthStage: 'MATURE',
            plantedAt: '2026-10-24T10:00:00.000Z',
            notes: 'Growing vigorously',
          },
        ],
      });

      render(
        <MemoryRouter>
          <MyGardenPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(screen.getByText('Ashwagandha')).toBeInTheDocument();
        expect(screen.getAllByText('Young').length).toBeGreaterThan(0);
      });

      const stageSelect = screen.getByRole('combobox');
      fireEvent.change(stageSelect, { target: { value: 'MATURE' } });

      await waitFor(() => {
        expect(sharedApi.updateGardenPlant).toHaveBeenCalledWith('gp1', { growthStage: 'MATURE' });
      });
    });
  });

  describe('HelpSupportPage', () => {
    it('renders role-aware contributor FAQs and handles support request submission', async () => {
      vi.mocked(sharedApi.getMySupportRequests).mockResolvedValue([]);
      vi.mocked(sharedApi.submitSupportRequest).mockResolvedValue({
        _id: 's1',
        subject: 'Taxonomy Question',
        message: 'How should subspecies be formatted?',
        status: 'OPEN',
        createdAt: '2026-10-24T12:00:00.000Z',
      });

      render(
        <MemoryRouter>
          <HelpSupportPage />
        </MemoryRouter>,
      );

      // Contributor banner should be visible for BOTANIST role
      expect(screen.getByText(/Botanist Editorial Standards/i)).toBeInTheDocument();

      const subjectInput = screen.getByLabelText(/subject/i);
      const messageInput = screen.getByLabelText(/message/i);
      const submitBtn = screen.getByRole('button', { name: /send request/i });

      fireEvent.change(subjectInput, { target: { value: 'Taxonomy Question' } });
      fireEvent.change(messageInput, { target: { value: 'How should subspecies be formatted?' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(sharedApi.submitSupportRequest).toHaveBeenCalledWith(
          'Taxonomy Question',
          'How should subspecies be formatted?',
        );
      });
    });
  });
});
