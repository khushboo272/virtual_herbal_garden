// ──────────────────────────────────────────────────────────
// OAuthCallbackPage — Captures token from Google OAuth redirect
// Route: /oauth/callback?token=...
//
// Two modes:
//   1. Popup mode (window.opener exists) — send token to parent via postMessage, then close
//   2. Fallback popup mode (window.opener lost after cross-origin redirect) —
//      signal via localStorage event, then close
//   3. Direct mode (standalone navigation) — store token, refresh user, redirect to home
// ──────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    // ── Error case ──
    if (errorParam) {
      const errorMsg = 'Google authentication failed. Please try again.';
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: 'OAUTH_ERROR', error: errorMsg }, window.location.origin);
        } catch { /* cross-origin — opener lost */ }
        window.close();
        return;
      }
      // Fallback: signal error via localStorage
      localStorage.setItem('oauth_result', JSON.stringify({ type: 'error', error: errorMsg }));
      window.close();
      // If window.close() didn't work (not a popup), show error and redirect
      setError(errorMsg);
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    if (!token) {
      const errorMsg = 'No authentication token received.';
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ type: 'OAUTH_ERROR', error: errorMsg }, window.location.origin);
        } catch { /* cross-origin */ }
        window.close();
        return;
      }
      localStorage.setItem('oauth_result', JSON.stringify({ type: 'error', error: errorMsg }));
      window.close();
      setError(errorMsg);
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    // ── Success case ──

    // Store the JWT token in localStorage (shared across same-origin windows)
    setAccessToken(token);

    // POPUP MODE (primary): opener exists — use postMessage + close
    if (window.opener && !window.opener.closed) {
      try {
        window.opener.postMessage({ type: 'OAUTH_SUCCESS', token }, window.location.origin);
      } catch {
        // postMessage failed (cross-origin) — fall through to localStorage signal
      }
      // Signal via localStorage as a belt-and-suspenders approach
      localStorage.setItem('oauth_result', JSON.stringify({ type: 'success' }));
      window.close();
      return;
    }

    // POPUP MODE (fallback): opener was lost due to cross-origin Google redirect.
    // The token is already stored in localStorage via setAccessToken() above.
    // Write a signal so the main window's storage event listener picks it up.
    localStorage.setItem('oauth_result', JSON.stringify({ type: 'success' }));
    // Try to close — this works if the window was opened by JS (window.open)
    window.close();

    // If window.close() didn't work, we're in direct navigation mode.
    // Give it a moment to close, then fall back to in-page redirect.
    setTimeout(() => {
      // If we're still here, the popup didn't close — treat as direct mode
      refreshUser()
        .then(() => navigate('/', { replace: true }))
        .catch(() => {
          setError('Failed to load user profile. Please try logging in again.');
          setTimeout(() => navigate('/'), 3000);
        });
    }, 500);
  }, [searchParams, navigate, refreshUser]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {error ? (
        <>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            ✕
          </div>
          <p style={{ color: '#DC2626', fontSize: '15px', textAlign: 'center' }}>{error}</p>
          <p style={{ color: '#9CA3AF', fontSize: '13px' }}>Redirecting to home...</p>
        </>
      ) : (
        <>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #D0E8D8',
              borderTopColor: '#1A7A3C',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <p style={{ color: '#1A7A3C', fontSize: '15px', fontWeight: 500 }}>
            Completing sign in...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  );
}
