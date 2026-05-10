import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { NavbarExpert } from './NavbarExpert';

vi.mock('../../app/components/dashboard/NotificationPanel', () => ({
  NotificationPanel: () => <div data-testid="notification-panel" />
}));
vi.mock('./NavbarAvatarMenu', () => ({
  NavbarAvatarMenu: () => <div data-testid="navbar-avatar-menu" />
}));
vi.mock('./NavbarMobileDrawer', () => ({
  NavbarMobileDrawer: () => <div data-testid="navbar-mobile-drawer" />
}));

describe('NavbarExpert', () => {
  it('renders logo, public links + contribute link, and action placeholders', () => {
    render(
      <BrowserRouter>
        <NavbarExpert />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Virtual Herbal Garden')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Contribute')).toBeInTheDocument();
    
    // Check for actions
    expect(screen.getByTestId('notification-panel')).toBeInTheDocument();
    expect(screen.getByTestId('navbar-avatar-menu')).toBeInTheDocument();
  });
});
