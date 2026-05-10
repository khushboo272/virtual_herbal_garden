import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../app/components/ui/sheet';
import { Menu, LogIn, User, Settings, LogOut } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { NavLink } from './types';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../app/components/ui/utils';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationPanel } from '../../app/components/dashboard/NotificationPanel';

export interface NavbarMobileDrawerProps {
  links: NavLink[];
  variant: 'public' | 'authenticated';
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export const NavbarMobileDrawer = ({ links, variant, onLoginClick, onRegisterClick }: NavbarMobileDrawerProps) => {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavigate = (route: string) => {
    navigate(route);
    setOpen(false);
  };

  const handleLogin = () => {
    setOpen(false);
    onLoginClick?.();
  };

  const handleRegister = () => {
    setOpen(false);
    onRegisterClick?.();
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 lg:hidden">
        {variant === 'authenticated' && <NotificationPanel />}
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-green-800">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
      </div>

      <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col bg-white">
        <SheetHeader className="p-4 border-b border-green-100 bg-green-50/50 text-left">
          <SheetTitle className="text-lg font-semibold text-green-900">
            {variant === 'authenticated' && user ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold">
                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm">{user.displayName}</span>
                  <span className="text-xs text-green-600 font-normal">{user.email}</span>
                </div>
              </div>
            ) : (
              'Menu'
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="flex flex-col px-2 space-y-1">
            {links.map((link) => {
              const isActive = location.pathname === link.route;
              return (
                <button
                  key={link.route}
                  onClick={() => handleNavigate(link.route)}
                  className={cn(
                    "flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-green-100 text-green-800" 
                      : "text-gray-600 hover:bg-green-50 hover:text-green-700"
                  )}
                >
                  <link.icon className={cn("w-5 h-5 mr-3", isActive ? "text-green-700" : "text-gray-400")} />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          {variant === 'public' ? (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-center text-green-700 border-green-200 hover:bg-green-50"
                onClick={handleLogin}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Button>
              <Button
                className="w-full justify-center bg-green-600 hover:bg-green-700 text-white"
                onClick={handleRegister}
              >
                Sign Up
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleNavigate('/profile')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <User className="w-4 h-4 mr-3 text-gray-500" />
                Profile
              </button>
              <button
                onClick={() => handleNavigate('/settings')}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <Settings className="w-4 h-4 mr-3 text-gray-500" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md mt-2"
              >
                <LogOut className="w-4 h-4 mr-3 text-red-500" />
                Log out
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
