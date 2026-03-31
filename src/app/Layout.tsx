import { Outlet, Link, useLocation } from "react-router-dom";
import { Leaf, BookOpen, Sparkles, Map, Pill, Award, LayoutDashboard, Shield, Palette } from "lucide-react";
import { Button } from "./components/ui/button";

const navLinks = [
  { to: "/library", label: "Library", icon: BookOpen },
  { to: "/ai-detect", label: "AI Scanner", icon: Sparkles },
  { to: "/garden-3d", label: "3D Garden", icon: Map },
  { to: "/remedies", label: "Remedies", icon: Pill },
  { to: "/virtual-tour", label: "Virtual Tour", icon: Award },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin", label: "Admin", icon: Shield },
];

export function Layout() {
  const location = useLocation();

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
    </div>
  );
}
