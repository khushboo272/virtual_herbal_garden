import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { NavbarLogo } from './NavbarLogo';
import { NavbarLinks } from './NavbarLinks';
import { PUBLIC_LINKS } from './NavbarPublic';
import { NotificationPanel } from '../../app/components/dashboard/NotificationPanel';
import { NavbarAvatarMenu } from './NavbarAvatarMenu';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';

const USER_LINKS = [
  ...PUBLIC_LINKS,
  { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
];

export const NavbarUser = () => {
  return (
    <>
      <div className="flex items-center gap-6">
        <NavbarLogo />
        <div className="hidden lg:block">
          <NavbarLinks links={USER_LINKS} />
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4 pl-4 ml-2 border-l border-green-200">
        <NotificationPanel />
        <NavbarAvatarMenu />
      </div>
      
      <NavbarMobileDrawer links={USER_LINKS} variant="authenticated" />
    </>
  );
};

