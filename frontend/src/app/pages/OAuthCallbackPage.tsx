// ──────────────────────────────────────────────────────────
// OAuthCallbackPage — Captures token from Google OAuth redirect
// Route: /oauth/callback?token=...
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

    if (errorParam) {
      setError('Google authentication failed. Please try again.');
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    if (token) {
      // Store the JWT token
      setAccessToken(token);

      // Refresh user state in AuthContext, then redirect home
      refreshUser()
        .then(() => {
          navigate('/', { replace: true });
        })
        .catch(() => {
          setError('Failed to load user profile. Please try logging in again.');
          setTimeout(() => navigate('/'), 3000);
        });
    } else {
      setError('No authentication token received.');
      setTimeout(() => navigate('/'), 3000);
    }
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
