// ──────────────────────────────────────────────────────────
// Dashboard Layout — sidebar + top nav + content area
// PRD §6.1, §6.2, §6.3
// ──────────────────────────────────────────────────────────

import React, { useState, useEffect, Fragment } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { DashboardSidebar } from './DashboardSidebar';
import { Navbar } from '../../../components/navbar/Navbar';
import { useAuth } from '../../../contexts/AuthContext';
import { HeaderSearchDropdown } from '../../../features/dashboard/shared';
import type { UserRole } from './roleNavConfig';

/** Maps route segments to human-readable breadcrumb labels */
const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  garden: 'My Garden',
  bookmarks: 'Bookmarks',
  scanner: 'AI Scanner',
  profile: 'Settings & Profile',
  help: 'Help & Support',
  contributions: 'My Contributions',
  'new-plant': 'New Plant Draft',
  'new-remedy': 'New Remedy Draft',
  'ai-feedback': 'AI Feedback Queue',
  moderation: 'Moderation Queue',
  analytics: 'Analytics',
  featured: 'Featured Content',
  users: 'User Management',
  tours: 'Tours',
  manage: 'Management',
  system: 'System',
  'feature-flags': 'Feature Flags',
  'role-management': 'Role Management',
  'audit-log': 'Audit Log',
  'ai-model-config': 'AI Model Config',
};

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  const role = (user?.role || 'GUEST') as UserRole;

  useEffect(() => {
    if (role === 'BOTANIST') {
      import('../../../features/botanist/api/contributionsApi')
        .then(({ getAIFeedbackStats }) => getAIFeedbackStats())
        .then((s) => {
          if (s && typeof s.pendingCount === 'number') {
            setBadgeCounts({ pendingCorrections: s.pendingCount });
          }
        })
        .catch(() => {});
    }
  }, [role]);

  // Build breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, idx) => {
    let label = BREADCRUMB_LABELS[segment];
    if (!label) {
      if (/^[0-9a-fA-F]{24}$/.test(segment)) {
        label = 'Draft Details';
      } else {
        label = (segment.charAt(0).toUpperCase() + segment.slice(1)).replace(/[-_]/g, ' ');
      }
    }
    return {
      label,
      path: '/' + pathSegments.slice(0, idx + 1).join('/'),
      isLast: idx === pathSegments.length - 1,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Global Navigation at very top */}
      <div className="sticky top-0 z-50 bg-white">
        <Navbar />
      </div>

      <div className="flex w-full">
        {/* Sidebar */}
        <DashboardSidebar
          role={role}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          badgeCounts={badgeCounts}
        />

        {/* Main content area */}
        <div className="flex-1 min-w-0 transition-all duration-300">
          {/* Sub-header for breadcrumbs and search */}
          <header className="sticky top-[64px] z-30 bg-white/90 backdrop-blur-md border-b border-green-200/50">
            <div className="flex items-center justify-between px-6 py-3">
              {/* Breadcrumbs (PRD §6.3) */}
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, idx) => (
                    <Fragment key={crumb.path}>
                      {idx > 0 && <BreadcrumbSeparator><ChevronRight className="w-3 h-3" /></BreadcrumbSeparator>}
                      <BreadcrumbItem>
                        {crumb.isLast ? (
                          <BreadcrumbPage className="text-green-800 font-medium">{crumb.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.path} className="text-green-600 hover:text-green-800">{crumb.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Right side — debounced grouped search */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <HeaderSearchDropdown />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
