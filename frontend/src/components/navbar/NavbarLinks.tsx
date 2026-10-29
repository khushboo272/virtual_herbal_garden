import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink } from './types';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';

const ROUTE_FLAG_MAP: Record<string, string> = {
  '/ai-detect': 'ai_scanner',
  '/garden-3d': '3d_garden',
  '/virtual-tour': 'guided_tours',
};

export const NavbarLinks = ({ links }: { links: NavLink[] }) => {
  const location = useLocation();
  const pathname = location.pathname;
  let isFeatureEnabled = (_k: string) => true;
  try {
    const flagsCtx = useFeatureFlags();
    if (flagsCtx?.isFeatureEnabled) {
      isFeatureEnabled = flagsCtx.isFeatureEnabled;
    }
  } catch {
    // Safe fallback if rendered outside provider in isolated tests
  }

  const isActive = (route: string) => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  return (
    <div className="hidden lg:flex items-center gap-0.5 xl:gap-1 flex-nowrap">
      {links.map((link) => {
        const flagKey = ROUTE_FLAG_MAP[link.route];
        const isEnabled = flagKey ? isFeatureEnabled(flagKey) : true;
        const active = isActive(link.route);
        return (
          <Link
            key={link.route}
            to={link.route}
            className={`flex items-center whitespace-nowrap shrink-0 px-2.5 py-2 text-sm font-medium transition-all duration-150 border-b-2 ${
              active
                ? 'text-green-600 border-green-500 bg-green-50'
                : 'text-gray-600 border-transparent hover:text-green-600 hover:bg-green-50'
            } ${!isEnabled ? 'opacity-80' : ''}`}
            title={!isEnabled ? `${link.label} is currently disabled by administrators` : undefined}
          >
            {link.icon && <link.icon className="w-4 h-4 mr-1.5 shrink-0" />}
            <span className="whitespace-nowrap">{link.label}</span>
            {!isEnabled && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-amber-100/90 text-amber-800 rounded border border-amber-200/80 whitespace-nowrap shrink-0 leading-none">
                Disabled
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

