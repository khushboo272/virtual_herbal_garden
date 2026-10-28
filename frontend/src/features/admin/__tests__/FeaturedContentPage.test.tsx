import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { FeaturedContentPage } from '../pages/FeaturedContentPage';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

let mockPlants: any[] = [];
let mockRemedies: any[] = [];

function resetMockData() {
  mockPlants = [
    {
      _id: 'plant-1',
      commonName: 'Tulsi (Holy Basil)',
      scientificName: 'Ocimum tenuiflorum',
      family: 'Lamiaceae',
      slug: 'tulsi-holy-basil',
      isFeatured: true,
      isPublished: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-tulsi.jpg',
          isPrimary: true,
        },
      ],
    },
    {
      _id: 'plant-2',
      commonName: 'Ashwagandha Root',
      scientificName: 'Withania somnifera',
      family: 'Solanaceae',
      slug: 'ashwagandha-root',
      isFeatured: false,
      isPublished: true,
      images: [
        {
          url: 'https://images.unsplash.com/photo-ashwa.jpg',
          isPrimary: true,
        },
      ],
    },
  ];

  mockRemedies = [
    {
      _id: 'rem-1',
      title: 'Neem Face Pack for Acne',
      slug: 'neem-face-pack-for-acne',
      difficulty: 'EASY',
      preparationTime: 15,
      tags: ['skincare', 'acne'],
      isFeatured: true,
      isPublished: true,
      image: 'https://images.unsplash.com/photo-neem.jpg',
      images: [],
    },
    {
      _id: 'rem-2',
      title: 'Ginger Lemon Honey Tea',
      slug: 'ginger-lemon-honey-tea',
      difficulty: 'EASY',
      preparationTime: 10,
      tags: ['cold', 'throat'],
      isFeatured: false,
      isPublished: true,
      image: 'https://images.unsplash.com/photo-ginger.jpg',
      images: [],
    },
  ];
}
resetMockData();

vi.mock('../api/adminApi', () => {
  const getContentList = vi.fn().mockImplementation((type: string, params: any) => {
    if (type === 'plants') {
      const filtered = params?.featured
        ? mockPlants.filter((p) => p.isFeatured)
        : mockPlants.filter((p) => !p.isFeatured);
      return Promise.resolve({
        items: filtered,
        pagination: { total: filtered.length, page: 1, limit: 50, totalPages: 1 },
      });
    }

    if (type === 'remedies') {
      const filtered = params?.featured
        ? mockRemedies.filter((r) => r.isFeatured)
        : mockRemedies.filter((r) => !r.isFeatured);
      return Promise.resolve({
        items: filtered,
        pagination: { total: filtered.length, page: 1, limit: 50, totalPages: 1 },
      });
    }

    return Promise.resolve({ items: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } });
  });

  const toggleFeatureContent = vi.fn().mockImplementation((type: string, id: string) => {
    if (type === 'plants') {
      mockPlants = mockPlants.map((p) => (p._id === id ? { ...p, isFeatured: !p.isFeatured } : p));
    } else if (type === 'remedies') {
      mockRemedies = mockRemedies.map((r) => (r._id === id ? { ...r, isFeatured: !r.isFeatured } : r));
    }
    return Promise.resolve({ success: true });
  });

  return {
    getContentList,
    toggleFeatureContent,
  };
});

vi.mock('../../tours/api/toursApi', () => ({
  getAdminToursList: vi.fn().mockResolvedValue([
    {
      id: 'tour-1',
      title: 'Medicinal Tree Walk',
      slug: 'medicinal-tree-walk',
      isFeatured: true,
      isPublished: true,
      checkpointCount: 5,
      coverImageUrl: 'https://images.unsplash.com/photo-tour.jpg',
    },
  ]),
  updateTour: vi.fn().mockResolvedValue({ id: 'tour-1', isFeatured: false }),
}));

describe('FeaturedContentPage Component (Real Plant and Remedy Shapes)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockData();
  });

  it('renders plant commonName, scientificName and image thumbnail instead of empty template', async () => {
    render(
      <MemoryRouter>
        <FeaturedContentPage />
      </MemoryRouter>
    );

    // Plant common name should be visible
    expect(await screen.findByText('Tulsi (Holy Basil)')).toBeInTheDocument();
    // Scientific name should be visible
    expect(screen.getByText('Ocimum tenuiflorum')).toBeInTheDocument();
    // Image should be rendered with plant name as alt
    const img = screen.getByAltText('Tulsi (Holy Basil)');
    expect(img).toHaveAttribute('src', 'https://images.unsplash.com/photo-tulsi.jpg');
  });

  it('removes a featured plant and shows toast with the real plant commonName rather than undefined', async () => {
    render(
      <MemoryRouter>
        <FeaturedContentPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Tulsi (Holy Basil)')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Removed "Tulsi (Holy Basil)" from Featured Plants');
    });
  });

  it('removes a featured plant from the currently featured section immediately when Remove is clicked', async () => {
    render(
      <MemoryRouter>
        <FeaturedContentPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Tulsi (Holy Basil)')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(screen.getByText('Currently Featured Plants (0)')).toBeInTheDocument();
    });
  });

  it('renders candidate plants with commonName and features them with proper toast', async () => {
    render(
      <MemoryRouter>
        <FeaturedContentPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Ashwagandha Root')).toBeInTheDocument();
    expect(screen.getByText('Withania somnifera')).toBeInTheDocument();

    const featureBtn = screen.getByRole('button', { name: /Feature/i });
    fireEvent.click(featureBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Featured "Ashwagandha Root" on Homepage!');
      expect(screen.getByText('Currently Featured Plants (2)')).toBeInTheDocument();
    });
  });

  it('renders remedies with title, difficulty/time details, and image', async () => {
    render(
      <MemoryRouter>
        <FeaturedContentPage />
      </MemoryRouter>
    );

    // Switch to remedies tab via tab trigger
    const remediesTab = screen.getByRole('tab', { name: /Featured Remedies/i });
    fireEvent.click(remediesTab);

    expect(await screen.findByText('Neem Face Pack for Acne')).toBeInTheDocument();
    const remedyImg = screen.getByAltText('Neem Face Pack for Acne');
    expect(remedyImg).toHaveAttribute('src', 'https://images.unsplash.com/photo-neem.jpg');
  });
});
