# 🔐 Virtual Herbal Garden — Authentication Implementation Plan
## Google OAuth + Password Login + Post-Auth Redirect to Home

| Field | Details |
|-------|---------|
| **Version** | 1.0 — Auth UI Completion + Google OAuth |
| **Status** | Active Development |
| **Date** | April 2026 |
| **Base URL** | `localhost:5173` |
| **Auth Modal** | Already exists — needs Google button + redirect logic |
| **Backend Status** | ✅ Complete — JWT tokens, security, password hashing all done |
| **Remaining Work** | UI: Google OAuth button, redirect-to-home after login |

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [What Needs to Be Built](#2-what-needs-to-be-built)
3. [Google OAuth Setup (Google Cloud Console)](#3-google-oauth-setup-google-cloud-console)
4. [Backend Changes — Google OAuth Endpoint](#4-backend-changes--google-oauth-endpoint)
5. [Frontend Changes — Auth Modal UI](#5-frontend-changes--auth-modal-ui)
6. [Post-Auth Redirect to Home Page](#6-post-auth-redirect-to-home-page)
7. [Password Login Flow (Completion)](#7-password-login-flow-completion)
8. [File-by-File Change Plan](#8-file-by-file-change-plan)
9. [Environment Variables](#9-environment-variables)
10. [Implementation Phases](#10-implementation-phases)
11. [Acceptance Criteria](#11-acceptance-criteria)
12. [Security Checklist](#12-security-checklist)

---

## 1. Current State Analysis

Based on the Antigravity audit, the authentication system is in this state:

### ✅ Already Complete (Do NOT touch)
- JWT token generation and validation
- Token storage and refresh logic
- Password hashing (bcrypt)
- Backend login/register API endpoints (`/api/auth/login`, `/api/auth/register`)
- Auth middleware protecting private routes
- The auth modal component exists and renders
- Basic email/password login loop works end-to-end

### ❌ Missing — Must Build Now
- **Google OAuth button** in the auth modal UI
- **Google OAuth backend endpoint** (`/api/auth/google`)
- **Post-login redirect** → home page (`/`) after successful login via ANY method
- **Post-register redirect** → home page after account creation
- Password login currently does NOT redirect after success (stays on modal or blank)

---

## 2. What Needs to Be Built

### Summary of Changes

```
BACKEND  (minimal — heavy lifting done)
  ├── NEW: POST /api/auth/google          ← verify Google ID token → return JWT
  └── NEW: GET  /api/auth/google/callback ← OAuth2 callback URL (if using redirect flow)

FRONTEND (primary work)
  ├── MODIFY: Auth Modal component
  │   ├── Add "Continue with Google" button (styled correctly)
  │   ├── Add Google OAuth initiation logic
  │   └── Add redirect-to-home after success for BOTH password + Google
  ├── NEW: useGoogleAuth.ts hook
  ├── MODIFY: authService.ts (add googleLogin function)
  └── MODIFY: App.tsx / router (ensure / is the home page route)
```

---

## 3. Google OAuth Setup (Google Cloud Console)

### Step 1 — Create OAuth Credentials

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project **or** select your existing project
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Name: `Virtual Herbal Garden`

### Step 2 — Configure Authorized Origins & Redirects

Add these exactly (including `http://` for localhost):

| Setting | Value |
|---------|-------|
| **Authorized JavaScript origins** | `http://localhost:5173` |
| **Authorized JavaScript origins** | `https://yourdomain.com` (production) |
| **Authorized redirect URIs** | `http://localhost:5173/auth/google/callback` |
| **Authorized redirect URIs** | `http://localhost:3000/api/auth/google/callback` |
| **Authorized redirect URIs** | `https://yourdomain.com/auth/google/callback` (production) |

### Step 3 — Get Your Credentials

After creating, copy:
- `Client ID` → goes into `.env` as `VITE_GOOGLE_CLIENT_ID` (frontend)
- `Client Secret` → goes into `.env` as `GOOGLE_CLIENT_SECRET` (backend only, NEVER frontend)

### Step 4 — Enable Required APIs

In **APIs & Services → Library**, enable:
- **Google+ API** (or People API)
- **Google Identity Services** (automatically enabled)

---

## 4. Backend Changes — Google OAuth Endpoint

### 4.1 Install Required Package

```bash
npm install google-auth-library
```

### 4.2 New File: `backend/src/auth/google.strategy.ts`

```typescript
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(idToken: string) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error('Invalid Google token');

  return {
    googleId: payload.sub,           // unique Google user ID
    email: payload.email!,
    name: payload.name || '',
    picture: payload.picture || '',
    emailVerified: payload.email_verified || false,
  };
}
```

### 4.3 New Route: `POST /api/auth/google`

Add to your existing auth routes file (`backend/src/routes/auth.routes.ts`):

```typescript
import { verifyGoogleToken } from '../auth/google.strategy';

// POST /api/auth/google
// Body: { idToken: string }  ← sent from frontend after Google sign-in
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'ID token required' });

    // 1. Verify the Google ID token
    const googleUser = await verifyGoogleToken(idToken);

    // 2. Find or create user in your database
    let user = await UserModel.findOne({ email: googleUser.email });

    if (!user) {
      // New user — create account automatically
      user = await UserModel.create({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        googleId: googleUser.googleId,
        emailVerified: true,          // Google already verified their email
        authProvider: 'google',
        password: null,               // No password for Google users
      });
    } else if (!user.googleId) {
      // Existing email/password user — link Google account
      user.googleId = googleUser.googleId;
      user.authProvider = 'google_linked';
      await user.save();
    }

    // 3. Generate your existing JWT (reuse existing generateToken function)
    const token = generateToken(user._id, user.email);

    // 4. Return same shape as your existing login response
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});
```

### 4.4 Update User Model

Add these fields to your existing User schema (only if not present):

```typescript
// Add to existing UserModel/Schema
googleId: { type: String, sparse: true, index: true },
picture: { type: String, default: '' },
authProvider: {
  type: String,
  enum: ['local', 'google', 'google_linked'],
  default: 'local'
},
emailVerified: { type: Boolean, default: false },
```

---

## 5. Frontend Changes — Auth Modal UI

### 5.1 Install Google Identity Services

**Option A — CDN (recommended, no npm package needed):**

Add to `index.html` `<head>`:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

**Option B — npm:**
```bash
npm install @react-oauth/google
```

### 5.2 New Hook: `frontend/src/hooks/useGoogleAuth.ts`

```typescript
import { useCallback } from 'react';

interface GoogleAuthResult {
  credential: string;  // This is the ID token
}

export function useGoogleAuth() {
  const signInWithGoogle = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!window.google) {
        reject(new Error('Google Identity Services not loaded'));
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: GoogleAuthResult) => {
          if (response.credential) {
            resolve(response.credential);   // This is the idToken
          } else {
            reject(new Error('No credential received from Google'));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Show the One Tap prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: render a button manually
          reject(new Error('Google prompt not displayed'));
        }
      });
    });
  }, []);

  return { signInWithGoogle };
}
```

### 5.3 Update Auth Service: `frontend/src/services/authService.ts`

Add `googleLogin` to your existing service (keep all existing functions):

```typescript
// ADD to existing authService.ts — do NOT remove existing functions

export const googleLogin = async (idToken: string) => {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Google login failed');
  }

  const data = await response.json();

  // Store token using your existing pattern
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  return data;
};
```

### 5.4 Modify Auth Modal Component

**File:** `frontend/src/components/AuthModal.tsx` (or wherever your modal lives)

#### Add Google button to the modal JSX:

```tsx
import { useNavigate } from 'react-router-dom';
import { googleLogin } from '../services/authService';

// Inside your AuthModal component:

const navigate = useNavigate();
const [googleLoading, setGoogleLoading] = useState(false);
const [googleError, setGoogleError] = useState('');

// ── Google Sign-In Handler ──────────────────────────────
const handleGoogleSignIn = async () => {
  setGoogleLoading(true);
  setGoogleError('');

  try {
    // Step 1: Get ID token from Google
    const idToken = await new Promise<string>((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          resolve(response.credential);
        },
      });
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) reject(new Error('Popup blocked'));
      });
    });

    // Step 2: Send ID token to your backend
    await googleLogin(idToken);

    // Step 3: Close modal + redirect home ✅
    onClose();                  // close the auth modal
    navigate('/');              // redirect to home page

  } catch (err: any) {
    setGoogleError(err.message || 'Google sign-in failed. Please try again.');
  } finally {
    setGoogleLoading(false);
  }
};

// ── Password Login Handler (ADD redirect) ───────────────
const handlePasswordLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    await login(email, password);   // your existing login function

    // ADD THESE TWO LINES — redirect after password login:
    onClose();                       // close modal
    navigate('/');                   // ✅ redirect to home page

  } catch (err: any) {
    setError(err.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};

// ── Register Handler (ADD redirect) ─────────────────────
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    await register(email, password, name);

    // ADD THESE TWO LINES — redirect after registration:
    onClose();
    navigate('/');                   // ✅ redirect to home page

  } catch (err: any) {
    setError(err.message || 'Registration failed');
  } finally {
    setLoading(false);
  }
};
```

#### Add Google button JSX to the modal template:

```tsx
{/* ── Google Sign-In Button ── */}
<div className="auth-divider">
  <span>or</span>
</div>

<button
  type="button"
  onClick={handleGoogleSignIn}
  disabled={googleLoading}
  className="btn-google"
  aria-label="Continue with Google"
>
  {googleLoading ? (
    <span className="spinner-sm" />
  ) : (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.04a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
    </svg>
  )}
  <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
</button>

{googleError && (
  <p className="auth-error" role="alert">{googleError}</p>
)}
```

### 5.5 CSS for Google Button

Add to your auth modal CSS file:

```css
/* ── Divider ── */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #E5E7EB;
}
.auth-divider span {
  font-size: 13px;
  color: #9CA3AF;
  font-weight: 500;
}

/* ── Google Button ── */
.btn-google {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 16px;
  border: 1.5px solid #E5E7EB;
  border-radius: 8px;
  background: #FFFFFF;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
.btn-google:hover:not(:disabled) {
  background: #F9FAFB;
  border-color: #D1D5DB;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.btn-google:active {
  background: #F3F4F6;
}
.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Spinner ── */
.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid #D1D5DB;
  border-top-color: #1A7A3C;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Error text ── */
.auth-error {
  font-size: 13px;
  color: #DC2626;
  margin-top: 6px;
  text-align: center;
}
```

---

## 6. Post-Auth Redirect to Home Page

### 6.1 Redirect Strategy

After **any** successful authentication (Google OR password), the flow must be:

```
Login Success
    │
    ├── onClose()           ← Close the auth modal
    ├── navigate('/')       ← React Router redirect to home
    └── (optional) toast notification: "Welcome back, {name}!"
```

### 6.2 Ensure Home Route Exists in App.tsx

Verify your router has a root route. If not, add it:

```tsx
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';          // your home/landing page

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />           {/* ← HOME */}
        <Route path="/virtual-tour" element={<VirtualTourPage />} />
        <Route path="/library" element={<LibraryPage />} />
        {/* ... all your other routes ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

### 6.3 If Auth Modal is Outside Router Context

If `useNavigate()` fails because the modal is rendered outside `<BrowserRouter>`, use this pattern instead:

```tsx
// Option A: Pass onSuccess callback from parent
// In AuthModal:
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;    // ← ADD THIS
}

// In parent component that opens the modal:
<AuthModal
  isOpen={showAuth}
  onClose={() => setShowAuth(false)}
  onSuccess={() => navigate('/')}    // ← redirect from parent
/>

// Option B: Use window.location (last resort)
window.location.href = '/';
```

### 6.4 Auth State Update After Redirect

Ensure your auth context/store updates BEFORE the redirect so the home page sees the logged-in user:

```typescript
// In your auth context or store:
const loginSuccess = (userData: User, token: string) => {
  setUser(userData);                           // 1. Update state
  localStorage.setItem('token', token);        // 2. Persist token
  // navigate('/') happens AFTER this in the modal
};
```

---

## 7. Password Login Flow (Completion)

The password login backend is complete. Only the **redirect** is missing. The change is minimal:

### 7.1 Current (broken) flow:
```
User submits email + password
    → POST /api/auth/login
    → JWT received
    → Modal stays open ❌ (no redirect)
```

### 7.2 Fixed flow:
```
User submits email + password
    → POST /api/auth/login
    → JWT received + stored
    → onClose()          ← close modal ✅
    → navigate('/')      ← go home ✅
    → Navbar shows user avatar/name ✅
```

### 7.3 Exact code change in your login handler:

```typescript
// BEFORE (existing code — missing redirect):
const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const data = await authService.login(email, password);
    // ← nothing happens after this
  } catch (err) {
    setError(err.message);
  }
};

// AFTER (add 2 lines):
const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const data = await authService.login(email, password);
    onClose();          // ← ADD: close modal
    navigate('/');      // ← ADD: redirect home
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 8. File-by-File Change Plan

### Backend Files

| File | Change Type | What Changes |
|------|-------------|--------------|
| `backend/src/auth/google.strategy.ts` | **NEW** | Google ID token verification using `google-auth-library` |
| `backend/src/routes/auth.routes.ts` | **MODIFY** | Add `POST /api/auth/google` endpoint |
| `backend/src/models/user.model.ts` | **MODIFY** | Add `googleId`, `picture`, `authProvider`, `emailVerified` fields |
| `backend/.env` | **MODIFY** | Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` |

### Frontend Files

| File | Change Type | What Changes |
|------|-------------|--------------|
| `frontend/index.html` | **MODIFY** | Add Google Identity Services `<script>` tag |
| `frontend/.env` | **MODIFY** | Add `VITE_GOOGLE_CLIENT_ID` |
| `frontend/src/hooks/useGoogleAuth.ts` | **NEW** | Hook for Google One Tap prompt |
| `frontend/src/services/authService.ts` | **MODIFY** | Add `googleLogin(idToken)` function |
| `frontend/src/components/AuthModal.tsx` | **MODIFY** | Add Google button, add redirects to all success handlers |
| `frontend/src/styles/auth.css` | **MODIFY** | Add `.btn-google`, `.auth-divider`, `.spinner-sm` styles |
| `frontend/src/App.tsx` | **VERIFY** | Confirm `path="/"` home route exists |

---

## 9. Environment Variables

### Backend `.env`

```env
# ── Existing (DO NOT CHANGE) ────────────────────────────
JWT_SECRET=your_existing_jwt_secret
DB_URI=your_existing_db_connection_string
PORT=3000

# ── ADD THESE ───────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx

# Allowed redirect origins (for CORS)
CLIENT_ORIGIN=http://localhost:5173
```

### Frontend `.env` (Vite)

```env
# ── Existing (DO NOT CHANGE) ────────────────────────────
VITE_API_BASE_URL=http://localhost:3000

# ── ADD THIS ────────────────────────────────────────────
# IMPORTANT: Must start with VITE_ for Vite to expose it to the browser
VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

> ⚠️ **NEVER put `GOOGLE_CLIENT_SECRET` in frontend `.env`** — it will be exposed in the browser bundle.

---

## 10. Implementation Phases

### Phase 1 — Google Cloud Setup (15 min)
- [ ] Create / select Google Cloud project
- [ ] Create OAuth 2.0 Client ID (Web application type)
- [ ] Add localhost:5173 to authorized origins
- [ ] Add callback URIs
- [ ] Copy Client ID and Client Secret
- [ ] Add both to `.env` files

### Phase 2 — Backend Google Endpoint (30 min)
- [ ] `npm install google-auth-library` in backend
- [ ] Create `google.strategy.ts` with `verifyGoogleToken()`
- [ ] Add `POST /api/auth/google` to auth routes
- [ ] Add `googleId`, `picture`, `authProvider`, `emailVerified` to User model
- [ ] Test endpoint with Postman/Thunder Client using a valid Google ID token

### Phase 3 — Frontend Auth Service (15 min)
- [ ] Add `VITE_GOOGLE_CLIENT_ID` to frontend `.env`
- [ ] Add Google Identity Services `<script>` to `index.html`
- [ ] Add `googleLogin(idToken)` to `authService.ts`
- [ ] Create `useGoogleAuth.ts` hook

### Phase 4 — Auth Modal UI (45 min)
- [ ] Add `"Continue with Google"` button with Google SVG logo
- [ ] Add "or" divider between password form and Google button
- [ ] Wire `handleGoogleSignIn` handler to button
- [ ] Add `googleLoading` and `googleError` state
- [ ] Add `.btn-google` and `.auth-divider` CSS

### Phase 5 — Post-Auth Redirects (15 min)
- [ ] Add `onClose()` + `navigate('/')` to password login success handler
- [ ] Add `onClose()` + `navigate('/')` to register success handler
- [ ] Add `onClose()` + `navigate('/')` to Google login success handler
- [ ] Verify `path="/"` home route is in App.tsx router

### Phase 6 — Testing & Verification (30 min)
- [ ] Test email/password login → redirects to `/` ✅
- [ ] Test registration → redirects to `/` ✅
- [ ] Test Google login → Google popup → redirects to `/` ✅
- [ ] Verify JWT token stored in localStorage after all flows
- [ ] Verify navbar/header updates to show logged-in user after redirect
- [ ] Test on mobile viewport (Google prompt responsive)
- [ ] Test: already logged-in user visits `/` → no redirect loop

---

## 11. Acceptance Criteria

| # | Scenario | Expected Result |
|---|----------|----------------|
| AC-01 | User logs in with email + password | Modal closes, redirected to `/` (home), navbar shows user name |
| AC-02 | User registers new account | Modal closes, redirected to `/` (home), user is logged in |
| AC-03 | User clicks "Continue with Google" | Google popup appears |
| AC-04 | User selects Google account | Popup closes, redirected to `/`, navbar shows Google profile name |
| AC-05 | User with existing email logs in via Google | Account linked, JWT returned, redirected to `/` |
| AC-06 | New user signs in via Google (no prior account) | Account auto-created, redirected to `/` |
| AC-07 | Google login fails (popup blocked) | Error message shown in modal, modal stays open |
| AC-08 | Wrong password entered | Error shown in modal, NO redirect, modal stays open |
| AC-09 | Page refresh after login | User stays logged in (JWT in localStorage), on same page |
| AC-10 | User logs out | JWT cleared from localStorage, redirected to `/` |
| AC-11 | Direct URL visit while logged in | No auth modal shown, home page renders directly |
| AC-12 | `VITE_GOOGLE_CLIENT_ID` not set | Console warning, Google button disabled with tooltip |

---

## 12. Security Checklist

| Check | Requirement |
|-------|-------------|
| ✅ Token verification server-side | Google ID token MUST be verified on backend using `google-auth-library`, NOT decoded in frontend |
| ✅ Client Secret in backend only | `GOOGLE_CLIENT_SECRET` lives in backend `.env` only, never in frontend code or repository |
| ✅ HTTPS in production | Google OAuth requires HTTPS for production redirect URIs |
| ✅ Authorized origins locked | Only add known domains to Google Cloud Console authorized origins |
| ✅ JWT expiry maintained | Existing JWT expiry from backend is unchanged — Google auth uses same JWT |
| ✅ No sensitive data in localStorage | Only JWT token and safe user info (id, email, name) stored — no Google tokens |
| ✅ CORS on backend | `CLIENT_ORIGIN` env var restricts which origins can hit `/api/auth/google` |
| ✅ Email uniqueness enforced | If Google email matches existing account, link it — do not create duplicate user |
| ✅ `googleId` indexed | Sparse index on `googleId` field prevents slow lookups and allows null for non-Google users |

---

## Appendix A — Complete Auth Modal Structure (Final Layout)

```
┌─────────────────────────────────────────┐
│  🌿 Welcome Back          [×]           │
│  Sign in to Virtual Herbal Garden        │
├─────────────────────────────────────────┤
│  Email                                  │
│  [email@example.com              ]      │
│                                         │
│  Password                               │
│  [••••••••••••••••••••••   👁]         │
│                                         │
│  [        Sign In         ]  ← green btn│
│                                         │
│  ────────────── or ──────────────       │
│                                         │
│  [ G  Continue with Google    ]  ← new  │
│                                         │
│  Don't have an account? Register →      │
└─────────────────────────────────────────┘
```

---

## Appendix B — Google Type Declarations

Add this to `frontend/src/types/global.d.ts` to avoid TypeScript errors:

```typescript
interface Window {
  google: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
        }) => void;
        prompt: (callback?: (notification: {
          isNotDisplayed: () => boolean;
          isSkippedMoment: () => boolean;
        }) => void) => void;
        renderButton: (element: HTMLElement, options: object) => void;
        disableAutoSelect: () => void;
      };
    };
  };
}
```

---

*End of Document — Virtual Herbal Garden Authentication Implementation Plan v1.0 | April 2026*
