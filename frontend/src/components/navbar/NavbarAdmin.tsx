import React from 'react';
import { Home, BookOpen, Map, LayoutDashboard } from 'lucide-react';
import { NavbarLogo } from './NavbarLogo';
import { NavbarLinks } from './NavbarLinks';
import { NavLink } from './types';
import { NotificationPanel } from '../../app/components/dashboard/NotificationPanel';
import { NavbarAvatarMenu } from './NavbarAvatarMenu';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';

import { PUBLIC_LINKS } from './NavbarPublic';

const ADMIN_LINKS: NavLink[] = [
  ...PUBLIC_LINKS,
  { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
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
