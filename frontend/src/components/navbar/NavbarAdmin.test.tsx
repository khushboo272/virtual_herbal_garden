import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { NavbarAdmin } from './NavbarAdmin';

vi.mock('../../app/components/dashboard/NotificationPanel', () => ({
  NotificationPanel: () => <div data-testid="notification-panel" />
}));
vi.mock('./NavbarAvatarMenu', () => ({
  NavbarAvatarMenu: () => <div data-testid="navbar-avatar-menu" />
}));
vi.mock('./NavbarMobileDrawer', () => ({
  NavbarMobileDrawer: () => <div data-testid="navbar-mobile-drawer" />
}));

describe('NavbarAdmin', () => {
  it('renders logo, admin links, and action placeholders', () => {
    render(
      <BrowserRouter>
        <NavbarAdmin />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Virtual Herbal Garden')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText('3D Garden')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Check for actions
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-avatar-menu')).toBeInTheDocument();
  });
});
