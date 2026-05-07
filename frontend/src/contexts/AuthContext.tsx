import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, setAccessToken, clearTokens } from '../lib/api';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      console.debug('[Auth] refreshUser: calling /users/me');
      const res = await api.get<User>('/users/me');
      console.debug('[Auth] refreshUser: got user', res.data?.email);
      setUser(res.data);
    } catch (err: any) {
      console.debug('[Auth] refreshUser failed:', err?.status, err?.message);
      setUser(null);
      // Only clear tokens on explicit 401 (token truly invalid)
      // Don't clear on network errors (503, 500, etc.) — server may be temporarily down
      if (err?.status === 401) {
        clearTokens();
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

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/login', { email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (displayName: string, email: string, password: string) => {
    const res = await api.post<{ accessToken: string; user: User }>('/auth/register', { displayName, email, password });
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
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
