import { useState, useCallback, useRef } from 'react';
import { systemApi } from '../api/system.api';

interface ReauthCache {
  token: string;
  expiresAt: number;
}

// In-memory cache for the 5-minute reauth token
let cachedReauth: ReauthCache | null = null;

export function useReauth() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pending resolver when waiting for reauth dialog submission
  const pendingActionRef = useRef<((token: string) => void) | null>(null);
  const pendingRejectRef = useRef<((err: any) => void) | null>(null);

  const getValidToken = useCallback((): string | null => {
    if (!cachedReauth) return null;
    // Buffer of 15 seconds before expiry
    if (Date.now() >= cachedReauth.expiresAt - 15000) {
      cachedReauth = null;
      return null;
    }
    return cachedReauth.token;
  }, []);

  const openDialog = useCallback(() => {
    setError(null);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setError(null);
    if (pendingRejectRef.current) {
      pendingRejectRef.current(new Error('Re-authentication cancelled'));
      pendingRejectRef.current = null;
      pendingActionRef.current = null;
    }
  }, []);

  const submitReauth = useCallback(async (password?: string, totpCode?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await systemApi.reauth(password, totpCode);
      const token = res.reauthToken;
      // Cache for 5 minutes (300 seconds)
      cachedReauth = {
        token,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };

      setIsOpen(false);

      if (pendingActionRef.current) {
        pendingActionRef.current(token);
        pendingActionRef.current = null;
        pendingRejectRef.current = null;
      }

      return token;
    } catch (err: any) {
      const msg = err.message || 'Authentication failed. Please verify your password or 2FA code.';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeWithReauth = useCallback(
    async <T>(action: (token: string) => Promise<T>): Promise<T> => {
      const existing = getValidToken();
      if (existing) {
        try {
          return await action(existing);
        } catch (err: any) {
          // If server rejected with reauth error, bust cache and prompt dialog
          if (err?.code === 'REAUTH_REQUIRED' || err?.code === 'REAUTH_INVALID') {
            cachedReauth = null;
          } else {
            throw err;
          }
        }
      }

      // Open dialog and await submission
      return new Promise<T>((resolve, reject) => {
        pendingActionRef.current = async (freshToken: string) => {
          try {
            const result = await action(freshToken);
            resolve(result);
          } catch (actionErr) {
            reject(actionErr);
          }
        };
        pendingRejectRef.current = reject;
        openDialog();
      });
    },
    [getValidToken, openDialog],
  );

  return {
    reauthToken: getValidToken(),
    isReauthenticated: Boolean(getValidToken()),
    isOpen,
    openDialog,
    closeDialog,
    submitReauth,
    executeWithReauth,
    isLoading,
    error,
  };
}
