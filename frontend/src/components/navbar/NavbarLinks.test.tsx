import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { NavbarLinks } from './NavbarLinks';
import { Home, BookOpen } from 'lucide-react';

describe('NavbarLinks', () => {
  const mockLinks = [
    { label: 'Home', route: '/', icon: Home },
    { label: 'Library', route: '/library', icon: BookOpen },
  ];

  it('renders all links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <NavbarLinks links={mockLinks} />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('applies active styles correctly to root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <NavbarLinks links={mockLinks} />
      </MemoryRouter>
    );
    
    // Home should be active
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveClass('border-green-500'); // Assuming border-green-500 will be used for active state
    
    // Library should not be active
    const libraryLink = screen.getByText('Library').closest('a');
    expect(libraryLink).not.toHaveClass('border-green-500');
  });

  it('applies active styles correctly to prefix path', () => {
    render(
      <MemoryRouter initialEntries={['/library/plants/123']}>
        <NavbarLinks links={mockLinks} />
      </MemoryRouter>
    );
    
    // Home should NOT be active
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).not.toHaveClass('border-green-500');
    
    // Library SHOULD be active because of prefix matching
    const libraryLink = screen.getByText('Library').closest('a');
    expect(libraryLink).toHaveClass('border-green-500');
  });
});
