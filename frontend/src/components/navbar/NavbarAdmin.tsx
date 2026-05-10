import React from 'react';
import { Home, BookOpen, Map, LayoutDashboard } from 'lucide-react';
import { NavbarLogo } from './NavbarLogo';
import { NavbarLinks } from './NavbarLinks';
import { NavLink } from './types';
import { NotificationPanel } from '../../app/components/dashboard/NotificationPanel';
import { NavbarAvatarMenu } from './NavbarAvatarMenu';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';

const ADMIN_LINKS: NavLink[] = [
  { label: 'Home', route: '/', icon: Home },
  { label: 'Library', route: '/library', icon: BookOpen },
  { label: '3D Garden', route: '/garden-3d', icon: Map },
  { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard }
];

export const NavbarAdmin = () => {
  return (
    <>
      <div className="flex items-center gap-6">
        <NavbarLogo />
        <div className="hidden lg:block">
          <NavbarLinks links={ADMIN_LINKS} />
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4 pl-4 ml-2 border-l border-green-200">
        <NotificationPanel />
        <NavbarAvatarMenu />
      </div>
      
      <NavbarMobileDrawer links={ADMIN_LINKS} variant="authenticated" />
    </>
  );
};
