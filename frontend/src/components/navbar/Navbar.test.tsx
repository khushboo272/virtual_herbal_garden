import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ isAuthenticated: false, user: null }))
}));

vi.mock('../../app/components/dashboard/NotificationPanel', () => ({
  NotificationPanel: () => <div data-testid="notification-panel" />
}));
vi.mock('./NavbarAvatarMenu', () => ({
  NavbarAvatarMenu: () => <div data-testid="navbar-avatar-menu" />
}));
vi.mock('./NavbarMobileDrawer', () => ({
  NavbarMobileDrawer: () => <div data-testid="navbar-mobile-drawer" />
}));

import { useAuth } from '../../contexts/AuthContext';

describe('Navbar', () => {
  it('renders public navbar when not authenticated', () => {
    render(
      <BrowserRouter>
        <Navbar onLoginClick={vi.fn()} onRegisterClick={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('renders user navbar when authenticated as user', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'USER', displayName: 'Test User' },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    } as any);

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    // User should not see Contribute, but SHOULD see Dashboard
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Contribute')).not.toBeInTheDocument();
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
  });

  it('renders expert navbar when authenticated as botanist', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'BOTANIST', displayName: 'Test User' },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    } as any);

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Contribute')).toBeInTheDocument();
  });

  it('renders admin navbar when authenticated as admin', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { role: 'ADMIN', displayName: 'Test Admin' },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn()
    } as any);

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
