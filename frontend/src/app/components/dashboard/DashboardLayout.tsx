// ──────────────────────────────────────────────────────────
// Dashboard Layout — sidebar + top nav + content area
// PRD §6.1, §6.2, §6.3
// ──────────────────────────────────────────────────────────

import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Bell, Search, LogOut, User, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';
import { DashboardSidebar } from './DashboardSidebar';
import { NotificationPanel } from './NotificationPanel';
import { useAuth } from '../../../contexts/AuthContext';
import { cn } from '../ui/utils';
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
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const role = (user?.role || 'GUEST') as UserRole;
  const initials = (user?.displayName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Build breadcrumbs from pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, idx) => ({
    label: BREADCRUMB_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
    path: '/' + pathSegments.slice(0, idx + 1).join('/'),
    isLast: idx === pathSegments.length - 1,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <DashboardSidebar
        role={role}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main content area — offset by sidebar width */}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]')}>
        {/* Top Navigation Bar (PRD §6.2) */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-green-200/50">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Breadcrumbs (PRD §6.3) */}
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((crumb, idx) => (
                  <BreadcrumbItem key={crumb.path}>
                    {idx > 0 && <BreadcrumbSeparator><ChevronRight className="w-3 h-3" /></BreadcrumbSeparator>}
                    {crumb.isLast ? (
                      <BreadcrumbPage className="text-green-800 font-medium">{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.path} className="text-green-600 hover:text-green-800">{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Right side — search, notifications, profile */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search plants, remedies..."
                  className="pl-9 w-56 h-9 border-green-200 focus:border-green-400 text-sm"
                />
              </div>

              {/* Notifications */}
              <NotificationPanel />

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-green-50">
                    <Avatar className="w-8 h-8 border-2 border-green-200">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-700 hidden lg:inline">{user?.displayName?.split(' ')[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Profile & Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
