import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { NavbarLogo } from './NavbarLogo';

describe('NavbarLogo', () => {
  it('renders the logo and wordmark, linking to home', () => {
    render(
      <BrowserRouter>
        <NavbarLogo />
      </BrowserRouter>
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
    
    // Check wordmark
    expect(screen.getByText('Virtual Herbal Garden')).toBeInTheDocument();
  });
});
