import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { NavbarPublic } from './NavbarPublic';

vi.mock('./NavbarMobileDrawer', () => ({
  NavbarMobileDrawer: () => <div data-testid="navbar-mobile-drawer" />
}));

describe('NavbarPublic', () => {
  it('renders logo, links, and CTAs, and handles clicks', async () => {
    const onLogin = vi.fn();
    const onRegister = vi.fn();
    
    render(
      <BrowserRouter>
        <NavbarPublic onLoginClick={onLogin} onRegisterClick={onRegister} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Virtual Herbal Garden')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
    
    const loginBtn = screen.getByRole('button', { name: /login/i });
    const signupBtn = screen.getByRole('button', { name: /sign up/i });
    
    expect(loginBtn).toBeInTheDocument();
    expect(signupBtn).toBeInTheDocument();
    
    const user = userEvent.setup();
    await user.click(loginBtn);
    expect(onLogin).toHaveBeenCalledOnce();
    
    await user.click(signupBtn);
    expect(onRegister).toHaveBeenCalledOnce();
  });
});
