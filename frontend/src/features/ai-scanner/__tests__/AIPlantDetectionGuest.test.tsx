import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AIPlantDetection } from '../components/AIPlantDetection';
import * as scannerApi from '../api/scannerApi';

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    openAuthModal: vi.fn(),
  }),
}));

vi.mock('../api/scannerApi', () => ({
  detectPlant: vi.fn(),
  getHistory: vi.fn().mockResolvedValue([]),
  getDetection: vi.fn(),
}));

const mockDetectPlant = scannerApi.detectPlant as ReturnType<typeof vi.fn>;

describe('AIPlantDetection Guest Mode & Quota Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders guest mode notice with 5 remaining scans initially', () => {
    render(
      <MemoryRouter>
        <AIPlantDetection />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Guest Mode: 5 of 5 free scans remaining/i)).toBeInTheDocument();
  });

  it('syncs remaining scans and decrements to 4 after a successful real scan', async () => {
    mockDetectPlant.mockResolvedValueOnce({
      id: 'scan-1',
      status: 'COMPLETE',
      isPlant: true,
      topMatch: {
        commonName: 'Japanese Maple',
        scientificName: 'Acer palmatum',
        family: 'Sapindaceae',
        confidence: 0.95,
      },
      description: 'Ornamental maple tree.',
      medicinalUses: ['Astringent bark'],
      keyBenefits: ['Beauty'],
      partsUsed: ['Bark'],
      precautions: [],
      alternatives: [],
      imageUrl: 'https://example.com/maple.jpg',
    });

    render(
      <MemoryRouter>
        <AIPlantDetection />
      </MemoryRouter>,
    );

    const file = new File(['fake-image-bytes'], 'maple.jpg', { type: 'image/jpeg' });
    const input = document.getElementById('image-upload') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getAllByText('Japanese Maple').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText(/Guest Mode: 4 of 5 free scans remaining/i)).toBeInTheDocument();
    expect(localStorage.getItem('vhg_guest_scans_count')).toBe('1');
  });

  it('shows limit modal when guest has used all 5 scans', async () => {
    localStorage.setItem('vhg_guest_scans_count', '5');

    render(
      <MemoryRouter>
        <AIPlantDetection />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Guest Mode: 0 of 5 free scans remaining/i)).toBeInTheDocument();
    expect(
      screen.getByText(/You have used all 5 free guest scans/i),
    ).toBeInTheDocument();

    const file = new File(['fake-image-bytes'], 'maple.jpg', { type: 'image/jpeg' });
    const input = document.getElementById('image-upload') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Guest Scan Limit Reached/i)).toBeInTheDocument();
    });
    expect(mockDetectPlant).not.toHaveBeenCalled();
  });
});
