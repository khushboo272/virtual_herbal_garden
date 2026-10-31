import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  DownloadCloud,
  Archive,
  Terminal,
  ShieldCheck,
  Wrench,
  History,
} from 'lucide-react';

interface DatabaseNavProps {
  isSuperAdmin?: boolean;
}

export const DatabaseNav: React.FC<DatabaseNavProps> = ({ isSuperAdmin = false }) => {
  const navItems = [
    { label: 'Overview', path: '/dashboard/database', icon: LayoutDashboard, end: true },
    { label: 'Import', path: '/dashboard/database/import', icon: UploadCloud },
    { label: 'Browse & Edit', path: '/dashboard/database/browse', icon: Layers },
    { label: 'Export', path: '/dashboard/database/export', icon: DownloadCloud },
    { label: 'Backups', path: '/dashboard/database/backups', icon: Archive, superAdminOnly: true },
    { label: 'Query Console', path: '/dashboard/database/query', icon: Terminal },
    { label: 'Data Quality', path: '/dashboard/database/integrity', icon: ShieldCheck },
    { label: 'Smart Tools', path: '/dashboard/database/tools', icon: Wrench },
    { label: 'Job History', path: '/dashboard/database/history', icon: History },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-850 px-4 sm:px-6">
      <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2.5 scrollbar-none">
        {navItems.map((item) => {
          if (item.superAdminOnly && !isSuperAdmin) return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `inline-flex items-center space-x-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {item.superAdminOnly && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-mono">
                  SUPER
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

