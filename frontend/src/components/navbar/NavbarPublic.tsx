import React from 'react';
import { Home, BookOpen, Sparkles, Map, Pill, Award, LogIn } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { NavbarLogo } from './NavbarLogo';
import { NavbarLinks } from './NavbarLinks';
import { NavLink } from './types';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';

export const PUBLIC_LINKS: NavLink[] = [
  { label: 'Home', route: '/', icon: Home },
  { label: 'Library', route: '/library', icon: BookOpen },
  { label: 'AI Scanner', route: '/ai-detect', icon: Sparkles },
  { label: '3D Garden', route: '/garden-3d', icon: Map },
  { label: 'Remedies', route: '/remedies', icon: Pill },
  { label: 'Virtual Tour', route: '/virtual-tour', icon: Award },
];

export interface NavbarPublicProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const NavbarPublic = ({ onLoginClick, onRegisterClick }: NavbarPublicProps) => {
  return (
    <>
      <div className="flex items-center gap-6">
        <NavbarLogo />
        <div className="hidden lg:block">
          <NavbarLinks links={PUBLIC_LINKS} />
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 border-l border-green-200 pl-4 ml-2">
        <Button
          variant="ghost"
          onClick={onLoginClick}
          className="text-green-700 hover:bg-green-50"
        >
          <LogIn className="w-4 h-4 mr-1.5" />
          Login
        </Button>
        <Button
          onClick={onRegisterClick}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Sign Up &rarr;
        </Button>
      </div>
      
      <NavbarMobileDrawer 
        links={PUBLIC_LINKS} 
        variant="public" 
        onLoginClick={onLoginClick} 
        onRegisterClick={onRegisterClick} 
      />
    </>
  );
};

