import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { EmptyResults } from '../components/LibraryStates';
import * as libraryApi from '../api/libraryApi';

vi.mock('../api/libraryApi', () => ({
  submitPlantRegistrationRequest: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('EmptyResults Component & Missing Plant Registration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders standard clear filter button when no query is present', () => {
    const handleReset = vi.fn();
    render(
      <MemoryRouter>
        <EmptyResults onReset={handleReset} />
      </MemoryRouter>,
    );

    expect(screen.getByText('No plants found')).toBeInTheDocument();
    const btn = screen.getByText('Clear all filters');
    fireEvent.click(btn);
    expect(handleReset).toHaveBeenCalled();
  });

  it('displays the missing plant alert and registration form when query is provided', () => {
    render(
      <MemoryRouter>
        <EmptyResults query="Japanese Maple" onReset={vi.fn()} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('"Japanese Maple" is not in the Virtual Herbal Garden catalog'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Apply for New Plant Registration').length).toBe(2);
    expect(screen.getByDisplayValue('Japanese Maple')).toBeInTheDocument();
  });

  it('submits registration request, shows thank you confirmation, and redirects to become-contributor with prefilled state', async () => {
    vi.mocked(libraryApi.submitPlantRegistrationRequest).mockResolvedValueOnce({
      success: true,
      message: 'Thank you for contributing to the Virtual Herbal Garden!',
      redirect: {
        url: '/dashboard/become-contributor',
        prefill: {
          motivation: 'I want to contribute Japanese Maple research.',
          qualifications: 'Botanical field enthusiast.',
        },
      },
    });

    render(
      <MemoryRouter>
        <EmptyResults
          query="Japanese Maple"
          scannedPlant={{
            commonName: 'Japanese Maple',
            scientificName: 'Acer palmatum',
            family: 'Sapindaceae',
            description: 'Red weeping laceleaf tree.',
            medicinalUses: ['Traditional heat-clearing decoction'],
          }}
          onReset={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByDisplayValue('Japanese Maple')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Acer palmatum')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Sapindaceae')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Apply for New Plant Registration/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(libraryApi.submitPlantRegistrationRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          commonName: 'Japanese Maple',
          scientificName: 'Acer palmatum',
          family: 'Sapindaceae',
        }),
      );
    });

    // Check thank you confirmation screen
    await waitFor(() => {
      expect(screen.getByText('Thank you for contributing!')).toBeInTheDocument();
    });

    // Click redirect to become botanist
    const becomeBotanistBtn = screen.getByRole('button', {
      name: /Become a Botanist \(Pre-filled Application\)/i,
    });
    fireEvent.click(becomeBotanistBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/become-contributor', {
      state: {
        prefill: {
          motivation: 'I want to contribute Japanese Maple research.',
          qualifications: 'Botanical field enthusiast.',
        },
        plantName: 'Japanese Maple',
      },
    });
  });
});
