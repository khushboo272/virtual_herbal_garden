import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../../contexts/AuthContext';
import { Layout } from '../../../app/Layout';
import { api } from '../../../lib/api';

// Test consumer to test AuthContext directly
function TestAuthConsumer() {
  const { user, login, verify2faLogin } = useAuth();
  const [challenge, setChallenge] = React.useState<any>(null);
  const [loginResult, setLoginResult] = React.useState<any>(null);

  return (
    <div>
      <div data-testid="user-email">{user?.email || 'no-user'}</div>
      {challenge && <div data-testid="challenge-token">{challenge.challengeToken}</div>}
      {loginResult && <div data-testid="login-result">{JSON.stringify(loginResult)}</div>}
      <button
        onClick={async () => {
          const res = await login('superadmin@virtualherbal.garden', 'SuperSecret123');
          setLoginResult(res);
          if (res?.requires2fa) {
            setChallenge(res);
          }
        }}
      >
        Trigger Login
      </button>
      <button
        onClick={async () => {
          if (challenge) {
            await verify2faLogin(challenge.challengeToken, '123456');
          }
        }}
      >
        Trigger 2FA Verify
      </button>
    </div>
  );
}

describe('2-Step Verification Login Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('AuthContext returns requires2fa and challengeToken when user has 2FA enabled, and verify2faLogin finishes authentication', async () => {
    // 1. Mock /auth/login returning 2FA challenge
    vi.spyOn(api, 'post').mockImplementation(async (url: string, data?: any) => {
      if (url === '/auth/login') {
        return {
          data: {
            requires2fa: true,
            challengeToken: 'test-challenge-jwt-999',
            message: 'Please provide your 2FA code',
          },
        } as any;
      }
      if (url === '/auth/2fa/login-verify') {
        return {
          data: {
            accessToken: 'verified-jwt-token',
            user: {
              _id: 'u-super',
              email: 'superadmin@virtualherbal.garden',
              displayName: 'Super Admin',
              role: 'SUPER_ADMIN',
            },
          },
        } as any;
      }
      return { data: {} } as any;
    });

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>
    );

    // Initial state: no user
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');

    // Trigger Login
    fireEvent.click(screen.getByText('Trigger Login'));

    // Should return requires2fa: true, not set user yet, and not store an undefined token
    await waitFor(() => {
      expect(screen.getByTestId('challenge-token')).toHaveTextContent('test-challenge-jwt-999');
    });
    expect(screen.getByTestId('user-email')).toHaveTextContent('no-user');
    expect(localStorage.getItem('access_token')).toBeNull();

    // Trigger 2FA Verify
    fireEvent.click(screen.getByText('Trigger 2FA Verify'));

    // Should call /auth/2fa/login-verify, set user and store access_token
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('superadmin@virtualherbal.garden');
    });
    expect(localStorage.getItem('access_token')).toBe('verified-jwt-token');
  });

  it('Layout login modal switches to 2FA verification step and completes login with 2FA code', async () => {
    vi.spyOn(api, 'post').mockImplementation(async (url: string, data?: any) => {
      if (url === '/auth/login') {
        return {
          data: {
            requires2fa: true,
            challengeToken: 'layout-challenge-jwt-123',
            message: 'Please provide your 2FA code',
          },
        } as any;
      }
      if (url === '/auth/2fa/login-verify') {
        if (data?.code === '123456') {
          return {
            data: {
              accessToken: 'layout-verified-token',
              user: {
                _id: 'u-super',
                email: 'superadmin@virtualherbal.garden',
                displayName: 'Super Admin',
                role: 'SUPER_ADMIN',
              },
            },
          } as any;
        }
        throw new Error('Invalid verification code');
      }
      return { data: {} } as any;
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <Layout />
        </AuthProvider>
      </MemoryRouter>
    );

    // Open login modal
    const loginBtn = screen.getByRole('button', { name: /Login/i });
    fireEvent.click(loginBtn);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();

    // Fill in email and password
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    fireEvent.change(emailInput, { target: { value: 'superadmin@virtualherbal.garden' } });
    fireEvent.change(passwordInput, { target: { value: 'ValidPassword123' } });

    // Submit credentials
    const submitBtn = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(submitBtn);

    // Dialog must NOT close silently! It must show the 2FA challenge step
    await waitFor(() => {
      expect(screen.getByText(/Two-Factor Verification/i)).toBeInTheDocument();
    });

    // Enter 2FA code
    const codeInput = screen.getByPlaceholderText(/123456 or XXXX-XXXX/i);
    fireEvent.change(codeInput, { target: { value: '123456' } });

    const verifyBtn = screen.getByRole('button', { name: /Verify & Sign In/i });
    fireEvent.click(verifyBtn);

    // Dialog should complete login and close
    await waitFor(() => {
      expect(screen.queryByText(/Two-Factor Verification/i)).not.toBeInTheDocument();
    });
    expect(localStorage.getItem('access_token')).toBe('layout-verified-token');
  });
});
