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
import { useDocumentTitle } from '../../../hooks/useDocumentTitle';
import { findDashboardRoute, getBreadcrumbsForPath } from '../../../features/dashboard/dashboard.routes';
import { RouteErrorBoundary } from '../RouteErrorBoundary';
import type { UserRole } from './roleNavConfig';

export function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  const role = (user?.role || 'GUEST') as UserRole;

  // Single source of truth for document title
  const activeRoute = findDashboardRoute(location.pathname);
  useDocumentTitle(activeRoute?.title || 'Dashboard — Virtual Herbal Garden');

  // Live badge counts
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
    } else if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      import('../../../lib/api')
        .then(({ api }) => api.get('/admin/moderation/summary'))
        .then((res) => {
          const summary = res.data?.data || res.data;
          if (summary) {
            setBadgeCounts({
              pendingModeration: summary.total || 0,
              pendingPlants: summary.plants || 0,
              pendingRemedies: summary.remedies || 0,
              pendingApplications: summary.applications || 0,
            });
          }
        })
        .catch(() => {});
    }
  }, [role, location.pathname]);

  // Derived breadcrumbs from dashboard.routes.ts
  const breadcrumbs = getBreadcrumbsForPath(location.pathname);

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
                          <BreadcrumbPage className="font-medium text-slate-800">
                            {crumb.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={crumb.path} className="text-slate-500 hover:text-green-700">
                              {crumb.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>

              {/* Quick Search */}
              <HeaderSearchDropdown />
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6 max-w-7xl mx-auto">
            <RouteErrorBoundary>
              <Outlet />
            </RouteErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
