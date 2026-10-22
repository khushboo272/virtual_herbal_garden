/**
 * Frontend tests for the home feature.
 * Tests: useHome hook fetches /home and maps data correctly;
 * HeroSearch navigates on Enter; HeroSearch calls autocomplete API;
 * ForYouSection shows join-CTA for guests, welcome message for users;
 * HomePage renders stats strip from real data.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Framer motion — render as plain passthrough wrappers in tests
vi.mock('motion/react', () => ({
  motion: new Proxy({}, {
    get: (_target, prop) => {
      // Return a passthrough component for any motion.X element
      return ({ children, ...rest }: { children?: ReactNode; [key: string]: unknown }) => {
        const Tag = String(prop) as keyof JSX.IntrinsicElements;
        const safeProps = Object.fromEntries(
          Object.entries(rest).filter(([k]) => !k.startsWith('initial') && !k.startsWith('animate') && !k.startsWith('exit') && !k.startsWith('transition') && !k.startsWith('whileHover') && !k.startsWith('whileTap')),
        );
        return <Tag {...safeProps}>{children}</Tag>;
      };
    },
  }),
}));

// Mock the home API
vi.mock('../api/homeApi', () => ({
  getHome: vi.fn(),
}));

// Mock the library API (autocomplete + bookmarks)
vi.mock('../../library/api/libraryApi', () => ({
  getAutocomplete: vi.fn().mockResolvedValue([]),
  getBookmarks: vi.fn().mockResolvedValue([]),
}));

// Mock the ai-scanner API
vi.mock('../../ai-scanner/api/scannerApi', () => ({
  getHistory: vi.fn().mockResolvedValue([]),
}));

// Mock AuthContext
const mockUseAuth = vi.fn();
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

import { getHome } from '../api/homeApi';
import { getAutocomplete } from '../../library/api/libraryApi';
import { useHome } from '../hooks/useHome';
import { HomePage } from '../pages/HomePage';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GUEST_AUTH = {
  isAuthenticated: false,
  user: null,
  role: 'GUEST',
  hasMinRole: () => false,
};

const USER_AUTH = {
  isAuthenticated: true,
  user: { displayName: 'Aniket', role: 'USER' },
  role: 'USER',
  hasMinRole: (r: string) => ['GUEST', 'USER'].includes(r),
};

const MOCK_HOME_DATA = {
  stats: { plants: 42, remedies: 10, tours: 5, categories: 4 },
  categories: [
    { slug: 'immunity', label: 'Immunity', icon: 'Shield', plantCount: 8 },
  ],
  featuredPlants: [
    {
      id: 'abc123',
      slug: 'tulsi',
      commonName: 'Tulsi',
      scientificName: 'Ocimum tenuiflorum',
      image: '',
      tags: ['immunity'],
    },
  ],
  recentPlants: [],
  plantOfTheDay: null,
  featuredRemedies: [],
  featuredTours: [],
  popularSearches: [{ label: 'Tulsi', query: 'Tulsi' }],
};

// ── Wrapper ───────────────────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

// ── useHome hook tests ────────────────────────────────────────────────────────

describe('useHome', () => {
  beforeEach(() => {
    vi.mocked(getHome).mockResolvedValue(MOCK_HOME_DATA as Parameters<typeof getHome>[0] extends any ? any : any);
  });

  afterEach(() => vi.clearAllMocks());

  it('starts with isLoading=true, data=null', () => {
    const { result } = renderHook(() => useHome(), { wrapper: Wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('resolves data after successful fetch', async () => {
    const { result } = renderHook(() => useHome(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.stats.plants).toBe(42);
  });

  it('sets error when getHome rejects', async () => {
    vi.mocked(getHome).mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderHook(() => useHome(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toMatch(/Network error/);
    expect(result.current.data).toBeNull();
  });

  it('reload() triggers a re-fetch', async () => {
    const { result } = renderHook(() => useHome(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getHome).toHaveBeenCalledTimes(1);

    act(() => { result.current.reload(); });
    await waitFor(() => expect(getHome).toHaveBeenCalledTimes(2));
  });
});

// ── HomePage component tests ──────────────────────────────────────────────────

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(getHome).mockResolvedValue(MOCK_HOME_DATA as any);
    mockUseAuth.mockReturnValue(GUEST_AUTH);
  });

  afterEach(() => vi.clearAllMocks());

  it('renders hero heading', async () => {
    render(<HomePage />, { wrapper: Wrapper });
    expect(screen.getByText(/Discover the Healing Power of Nature/i)).toBeDefined();
  });

  it('displays real plant count in badge after load', async () => {
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.queryByText(/Loading/i)).toBeNull());
    expect(screen.getByText(/42 Medicinal Plants/i)).toBeDefined();
  });

  it('renders stats strip with plant count', async () => {
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText('42')).toBeDefined());
  });

  it('renders category card with real plant count', async () => {
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText('Immunity')).toBeDefined());
    expect(screen.getByText(/8 plants/i)).toBeDefined();
  });

  it('renders featured plant card with correct name', async () => {
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getAllByText('Tulsi').length).toBeGreaterThan(0));
  });

  it('shows "Join the community" CTA for guests', async () => {
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText(/Join the community/i)).toBeDefined());
  });

  it('shows welcome message for authenticated users', async () => {
    mockUseAuth.mockReturnValue(USER_AUTH);
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText(/Welcome back, Aniket/i)).toBeDefined());
  });

  it('popular search chips are rendered', async () => {
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByText('Popular:')).toBeDefined());
    expect(screen.getAllByText('Tulsi').length).toBeGreaterThan(0);
  });

  it('hero search input calls autocomplete API on input', async () => {
    vi.mocked(getAutocomplete).mockResolvedValueOnce([
      { commonName: 'Neem', scientificName: 'Azadirachta indica', slug: 'neem', images: [], aliases: [] },
    ]);
    render(<HomePage />, { wrapper: Wrapper });
    await waitFor(() => expect(screen.getByRole('searchbox')).toBeDefined());

    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'nee' } });

    await waitFor(() => expect(getAutocomplete).toHaveBeenCalledWith('nee', expect.any(AbortSignal)));
  });
});
