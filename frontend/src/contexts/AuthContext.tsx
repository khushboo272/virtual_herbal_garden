import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, setAccessToken, clearTokens } from '../lib/api';
import type { User } from '../lib/types';

// ── Role hierarchy (must match backend ROLE_HIERARCHY) ──
type UserRole = 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  GUEST: 0,
  USER: 1,
  BOTANIST: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export interface AuthLoginResult {
  requires2fa: boolean;
  challengeToken?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  hasMinRole: (minimum: UserRole) => boolean;
  login: (email: string, password: string) => Promise<AuthLoginResult>;
  verify2faLogin: (challengeToken: string, code: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role: UserRole = (user?.role as UserRole) || 'GUEST';

  const hasMinRole = useCallback(
    (minimum: UserRole): boolean => {
      return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum];
    },
    [role],
  );

  const refreshUser = useCallback(async () => {
    try {
      console.debug('[Auth] refreshUser: calling /users/me');
      const res = await api.get<User>('/users/me');
      console.debug('[Auth] refreshUser: got user', res.data?.email);
      setUser(res.data);
      // Connect socket when user is loaded
      import('../lib/socket').then(({ connectSocket }) => {
        const token = localStorage.getItem('access_token');
        if (token) connectSocket(token);
      });
    } catch (err: any) {
      console.debug('[Auth] refreshUser failed:', err?.status, err?.message);
      setUser(null);
      import('../lib/socket').then(({ disconnectSocket }) => disconnectSocket());
      // Clear tokens on 401 or 403 (suspended/banned)
      if (err?.status === 401 || err?.status === 403 || err?.code === 'ACCOUNT_SUSPENDED') {
        clearTokens();
        if (err?.code === 'ACCOUNT_SUSPENDED' || err?.message?.toLowerCase().includes('suspended') || err?.message?.toLowerCase().includes('banned')) {
          import('sonner').then(({ toast }) => {
            toast.error(err?.message || 'Your account has been suspended by an administrator.');
          });
        }
      }
    }
  }, []);

  // Check auth state on mount
  useEffect(() => {
    // If we're on the OAuth callback page, let OAuthCallbackPage handle the token.
    // It needs the ?token= param intact to do popup detection and signaling.
    const isOAuthCallback = window.location.pathname === '/oauth/callback';

    if (!isOAuthCallback) {
      // Check if a token was passed via URL query param (edge-case fallback)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      if (urlToken) {
        console.debug('[Auth] Found URL token, storing and refreshing...');
        setAccessToken(urlToken);
        window.history.replaceState({}, '', window.location.pathname);
        refreshUser().finally(() => setIsLoading(false));
        return;
      }
    }

    const token = localStorage.getItem('access_token');
    console.debug('[Auth] Mount: token in localStorage?', !!token);
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string): Promise<AuthLoginResult> => {
    const res = await api.post<{
      accessToken?: string;
      user?: User;
      requires2fa?: boolean;
      challengeToken?: string;
    }>('/auth/login', { email, password });

    if (res.data?.requires2fa) {
      return {
        requires2fa: true,
        challengeToken: res.data.challengeToken,
      };
    }

    if (res.data?.accessToken && res.data?.user) {
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      import('../lib/socket').then(({ connectSocket }) => connectSocket(res.data.accessToken!));
    }
    return { requires2fa: false };
  }, []);

  const verify2faLogin = useCallback(async (challengeToken: string, code: string): Promise<void> => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/2fa/login-verify', {
      challengeToken,
      code,
    });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    import('../lib/socket').then(({ connectSocket }) => connectSocket(res.data.accessToken));
  }, []);

  const register = useCallback(async (displayName: string, email: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/register', { displayName, email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    import('../lib/socket').then(({ connectSocket }) => connectSocket(res.data.accessToken));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    } finally {
      clearTokens();
      setUser(null);
      import('../lib/socket').then(({ disconnectSocket }) => disconnectSocket());
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        role,
        hasMinRole,
        login,
        verify2faLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

