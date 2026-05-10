import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink } from './types';

export const NavbarLinks = ({ links }: { links: NavLink[] }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  return (
    <div className="hidden lg:flex items-center gap-1">
      {links.map((link) => {
        const active = isActive(link.route);
        return (
          <Link
            key={link.route}
            to={link.route}
            className={`flex items-center px-3 py-2 text-sm font-medium transition-all duration-150 border-b-2 ${
              active
                ? 'text-green-600 border-green-500 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-green-50'
            }`}
          >
            {link.icon && <link.icon className="w-4 h-4 mr-1.5" />}
            {link.label}
          </Link>
        );
      })}
    </div>
  );
};

