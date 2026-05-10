import React from 'react';
import { PlusCircle } from 'lucide-react';
import { NavbarLogo } from './NavbarLogo';
import { NavbarLinks } from './NavbarLinks';
import { PUBLIC_LINKS } from './NavbarPublic';
import { NavLink } from './types';
import { NotificationPanel } from '../../app/components/dashboard/NotificationPanel';
import { NavbarAvatarMenu } from './NavbarAvatarMenu';
import { NavbarMobileDrawer } from './NavbarMobileDrawer';

const EXPERT_LINKS: NavLink[] = [
  ...PUBLIC_LINKS,
  { label: 'Contribute', route: '/contribute', icon: PlusCircle }
];

export const NavbarExpert = () => {
  return (
    <>
      <div className="flex items-center gap-6">
        <NavbarLogo />
        <div className="hidden lg:block">
          <NavbarLinks links={EXPERT_LINKS} />
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4 pl-4 ml-2 border-l border-green-200">
        <NotificationPanel />
        <NavbarAvatarMenu />
      </div>
      
      <NavbarMobileDrawer links={EXPERT_LINKS} variant="authenticated" />
    </>
  );
};
