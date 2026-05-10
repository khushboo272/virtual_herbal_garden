import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { NavbarPublic } from './NavbarPublic';
import { NavbarUser } from './NavbarUser';
import { NavbarExpert } from './NavbarExpert';
import { NavbarAdmin } from './NavbarAdmin';
import { cn } from '../../app/components/ui/utils';

export interface NavbarProps {
  onLoginClick?: () => void;
  onRegisterClick?: () => void;
}

export const Navbar = ({ onLoginClick = () => {}, onRegisterClick = () => {} }: NavbarProps) => {
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection
  useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const renderContent = () => {
    if (!isAuthenticated || !user) {
      return <NavbarPublic onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />;
    }

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return <NavbarAdmin />;
    }

    if (user.role === 'BOTANIST') {
      return <NavbarExpert />;
    }

    return <NavbarUser />;
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        isScrolled 
          ? "bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm"
          : "bg-white/80 backdrop-blur-md border-b border-green-200/50"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {renderContent()}
        </div>
      </div>
    </nav>
  );
};

