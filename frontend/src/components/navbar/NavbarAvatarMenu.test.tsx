import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { NavbarAvatarMenu } from './NavbarAvatarMenu';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ 
    isAuthenticated: true, 
    user: { displayName: 'Test User', email: 'test@example.com' },
    logout: vi.fn()
  }))
}));

describe('NavbarAvatarMenu', () => {
  it('renders user avatar/initials', () => {
    render(
      <BrowserRouter>
        <NavbarAvatarMenu />
      </BrowserRouter>
    );
    expect(screen.getByText('T')).toBeInTheDocument();
  });
});
