import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Leaf, BookOpen, Sparkles, Map, Pill, Award, LayoutDashboard, Shield, Palette, LogIn, LogOut, User } from "lucide-react";
import { Button } from "./components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

const navLinks = [
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/ai-detect", label: "AI Scanner", icon: Sparkles },
  { to: "/garden-3d", label: "3D Garden", icon: Map },
  { to: "/remedies", label: "Remedies", icon: Pill },
  { to: "/virtual-tour", label: "Virtual Tour", icon: Award },
];

const authNavLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["USER", "BOTANIST", "ADMIN", "SUPER_ADMIN"] },
  { to: "/admin", label: "Admin", icon: Shield, roles: ["ADMIN", "SUPER_ADMIN"] },
];

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, login, register, logout, refreshUser } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (authMode === "login") {
        await login(email, password);
      } else {
        const name = formData.get("name") as string;
        await register(name, email, password);
      }
      setShowAuthDialog(false);
      navigate("/");  // ✅ Redirect to home after success
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Google Sign-In Handler ──
  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    setGoogleError(null);

    // Clear any stale OAuth signal from a previous attempt
    localStorage.removeItem('oauth_result');

    // Snapshot whether a token existed BEFORE the popup opens
    const hadTokenBefore = !!localStorage.getItem('access_token');

    // Open the backend Google OAuth endpoint in a popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      "/api/v1/auth/google",
      "google-oauth",
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    );

    if (!popup) {
      setGoogleError("Popup blocked. Please allow popups for this site.");
      setGoogleLoading(false);
      return;
    }

    let handled = false;

    const handleOAuthSuccess = () => {
      if (handled) return; // Prevent duplicate calls
      handled = true;
      clearInterval(pollTimer);
      window.removeEventListener('message', handleMessage);
      // Token is already stored in localStorage by the popup's OAuthCallbackPage
      refreshUser()
        .then(() => {
          setGoogleLoading(false);
          setShowAuthDialog(false);
        })
        .catch(() => {
          setGoogleLoading(false);
          setGoogleError('Sign-in succeeded but failed to load profile. Please refresh.');
        });
    };

    const handleOAuthError = (errorMsg: string) => {
      if (handled) return;
      handled = true;
      clearInterval(pollTimer);
      window.removeEventListener('message', handleMessage);
      setGoogleLoading(false);
      setGoogleError(errorMsg || 'Google authentication failed.');
    };

    // CHANNEL 1: postMessage (works when window.opener survives the redirect)
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'OAUTH_SUCCESS') {
        handleOAuthSuccess();
      } else if (event.data?.type === 'OAUTH_ERROR') {
        handleOAuthError(event.data.error);
      }
    };
    window.addEventListener('message', handleMessage);

    // CHANNEL 2: Poll for popup close, then check localStorage for results.
    // This is the primary reliable fallback when window.opener is lost
    // (cross-origin Google redirect nulls it). The popup writes both
    // the access_token and an 'oauth_result' signal to localStorage
    // before calling window.close(). After the popup closes, we read
    // these values directly — no need for storage events.
    const pollTimer = setInterval(() => {
      // Check if popup is closed (try-catch because cross-origin access can throw)
      let isClosed = false;
      try {
        isClosed = popup.closed;
      } catch {
        isClosed = true; // If we can't access it, assume closed
      }

      if (!isClosed) return;

      // Popup is closed — stop polling immediately to prevent duplicate handling
      clearInterval(pollTimer);
      window.removeEventListener('message', handleMessage);

      if (handled) return; // Already handled via postMessage

      // Wait a brief moment for any pending localStorage writes to flush
      setTimeout(() => {
        // Check the explicit signal from OAuthCallbackPage
        const oauthResult = localStorage.getItem('oauth_result');
        if (oauthResult) {
          localStorage.removeItem('oauth_result');
          try {
            const parsed = JSON.parse(oauthResult);
            if (parsed.type === 'success') {
              handleOAuthSuccess();
            } else {
              handleOAuthError(parsed.error || 'Google authentication failed.');
            }
          } catch {
            handleOAuthError('Unexpected error during Google sign-in.');
          }
          return;
        }

        // Fallback: check if a NEW access_token appeared in localStorage
        // (the popup stores it via setAccessToken before closing)
        const hasTokenNow = !!localStorage.getItem('access_token');
        if (!hadTokenBefore && hasTokenNow) {
          handleOAuthSuccess();
          return;
        }

        // No signal found — user likely closed the popup manually without completing
        setGoogleLoading(false);
        // Don't show error — user may want to retry
      }, 500);
    }, 400);
  };

  return (
    <div className="min-h-screen">
      {/* Shared Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-green-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl text-green-800 font-semibold">Virtual Herbal Garden</h1>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link key={link.to} to={link.to}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={
                        isActive
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "text-green-700 hover:bg-green-50"
                      }
                    >
                      <link.icon className="w-4 h-4 mr-1.5" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}

              {/* Auth-gated links */}
              {isAuthenticated && authNavLinks
                .filter((link) => !link.roles || link.roles.includes(user?.role || ""))
                .map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Link key={link.to} to={link.to}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={
                          isActive
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "text-green-700 hover:bg-green-50"
                        }
                      >
                        <link.icon className="w-4 h-4 mr-1.5" />
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}

              {/* Auth Button */}
              <div className="ml-2 border-l border-green-200 pl-2">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-700 hidden md:inline">
                      {user?.displayName?.split(" ")[0]}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => logout()}
                      className="text-green-700 hover:bg-green-50"
                    >
                      <LogOut className="w-4 h-4 mr-1.5" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAuthMode("login");
                      setShowAuthDialog(true);
                      setAuthError(null);
                    }}
                    className="text-green-700 hover:bg-green-50"
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Login
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <Outlet />

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-green-200/50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm text-green-600">
            <p>© 2026 Virtual Herbal Garden. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/style-guide" className="hover:text-green-800 flex items-center gap-1">
                <Palette className="w-3 h-3" />
                Style Guide
              </Link>
              <Link to="/mobile" className="hover:text-green-800">Mobile View</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md bg-gradient-to-br from-green-50 to-white border-2 border-green-200">
          <DialogHeader>
            <DialogTitle className="text-2xl text-green-900">
              {authMode === "login" ? "Welcome Back" : "Join the Garden"}
            </DialogTitle>
            <DialogDescription className="text-green-600">
              {authMode === "login"
                ? "Sign in to access your dashboard and bookmarks"
                : "Create an account to save plants and track your progress"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAuthSubmit} className="space-y-4 pt-4">
            {authMode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="auth-name" className="text-green-800">Full Name</Label>
                <Input
                  id="auth-name"
                  name="name"
                  placeholder="John Doe"
                  required
                  className="border-green-200 focus:border-green-400"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="auth-email" className="text-green-800">Email</Label>
              <Input
                id="auth-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                className="border-green-200 focus:border-green-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auth-password" className="text-green-800">Password</Label>
              <Input
                id="auth-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                className="border-green-200 focus:border-green-400"
              />
            </div>

            {authError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{authError}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={authLoading}
            >
              {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
            </Button>

            {/* ── Divider ── */}
            <div className="auth-divider">
              <span>or</span>
            </div>

            {/* ── Google Sign-In Button ── */}
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
              <span>{googleLoading ? "Signing in..." : "Continue with Google"}</span>
            </button>

            {googleError && (
              <p className="auth-error" role="alert">{googleError}</p>
            )}

            <p className="text-center text-sm text-green-600">
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-green-800 font-semibold hover:underline"
                    onClick={() => { setAuthMode("register"); setAuthError(null); setGoogleError(null); }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-green-800 font-semibold hover:underline"
                    onClick={() => { setAuthMode("login"); setAuthError(null); setGoogleError(null); }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
