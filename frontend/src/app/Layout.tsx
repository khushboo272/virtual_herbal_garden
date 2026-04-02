import { Outlet, Link, useLocation } from "react-router-dom";
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
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

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
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
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
                      {user?.name?.split(" ")[0]}
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

            <p className="text-center text-sm text-green-600">
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-green-800 font-semibold hover:underline"
                    onClick={() => { setAuthMode("register"); setAuthError(null); }}
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
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
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
