import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '../../../app/components/dashboard/DashboardLayout';
import { RouteErrorBoundary } from '../../../app/components/RouteErrorBoundary';

// Mock AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      _id: 'admin-123',
      displayName: 'Admin User',
      email: 'admin@test.com',
      role: 'ADMIN',
    },
  }),
}));

// Mock Navbar to avoid deep dependency chain in layout test
vi.mock('../../../components/navbar/Navbar', () => ({
  Navbar: () => <header data-testid="mock-top-navbar">Top Navigation Bar</header>,
}));

function CrashingComponent(): React.ReactElement {
  throw new Error('Test Crash: Simulated unexpected rendering exception');
}

function HealthyComponent(): React.ReactElement {
  return <div data-testid="healthy-content">Healthy Child Component Content</div>;
}

describe('Task 4: RouteErrorBoundary & Resilient DashboardLayout', () => {
  beforeEach(() => {
    // Suppress console.error in tests for expected thrown boundary errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('catches runtime exception thrown inside DashboardLayout, preserves Sidebar and Top Nav, and displays fallback UI', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard/crashing']}>
        <Routes>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="crashing" element={<CrashingComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // 1. Assert Fallback UI is displayed
    const fallback = screen.getByTestId('route-error-boundary-fallback');
    expect(fallback).toBeInTheDocument();
    expect(screen.getByText('Unable to load page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();

    // 2. Assert Top Navbar is STILL rendered and intact
    expect(screen.getByTestId('mock-top-navbar')).toBeInTheDocument();

    // 3. Assert Sidebar is STILL rendered and intact (e.g. navigation labels)
    expect(screen.getByText('Moderation Queue')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('renders healthy children normally without fallback', () => {
    render(
      <RouteErrorBoundary>
        <HealthyComponent />
      </RouteErrorBoundary>
    );

    expect(screen.getByTestId('healthy-content')).toBeInTheDocument();
    expect(screen.queryByTestId('route-error-boundary-fallback')).not.toBeInTheDocument();
  });

  it('allows user to click "Try again" to reset the error state', () => {
    let shouldCrash = true;

    function ConditionalCrash() {
      if (shouldCrash) {
        throw new Error('Temporary crash');
      }
      return <div data-testid="recovered-content">Recovered Successfully</div>;
    }

    render(
      <RouteErrorBoundary>
        <ConditionalCrash />
      </RouteErrorBoundary>
    );

    expect(screen.getByTestId('route-error-boundary-fallback')).toBeInTheDocument();

    // Fix the condition and click try again
    shouldCrash = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByTestId('recovered-content')).toBeInTheDocument();
    expect(screen.queryByTestId('route-error-boundary-fallback')).not.toBeInTheDocument();
  });
});
