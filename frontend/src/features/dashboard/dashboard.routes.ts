export type UserRole = 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';

export interface BreadcrumbCrumb {
  label: string;
  path: string;
  isLast?: boolean;
}

export interface DashboardRouteConfig {
  path: string;
  pattern: RegExp;
  label: string;
  title: string;
  minRole: UserRole;
  parents?: Array<{ label: string; path: string }>;
}

export const DASHBOARD_ROUTES: DashboardRouteConfig[] = [
  // User Routes
  {
    path: '/dashboard',
    pattern: /^\/dashboard\/?$/,
    label: 'Dashboard',
    title: 'Dashboard — Virtual Herbal Garden',
    minRole: 'USER',
    parents: [],
  },
  {
    path: '/dashboard/garden',
    pattern: /^\/dashboard\/garden\/?$/,
    label: 'My Garden',
    title: 'My Virtual Garden — Virtual Herbal Garden',
    minRole: 'USER',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/bookmarks',
    pattern: /^\/dashboard\/bookmarks\/?$/,
    label: 'Bookmarks',
    title: 'My Bookmarks — Virtual Herbal Garden',
    minRole: 'USER',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/scanner',
    pattern: /^\/dashboard\/scanner\/?$/,
    label: 'AI Scanner',
    title: 'AI Scanner — Virtual Herbal Garden',
    minRole: 'USER',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/profile',
    pattern: /^\/dashboard\/profile\/?$/,
    label: 'Settings & Profile',
    title: 'Settings & Profile — Virtual Herbal Garden',
    minRole: 'USER',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/help',
    pattern: /^\/dashboard\/help\/?$/,
    label: 'Help & Support',
    title: 'Help & Support — Virtual Herbal Garden',
    minRole: 'USER',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/tours',
    pattern: /^\/dashboard\/tours\/?$/,
    label: 'Guided Tours',
    title: 'Guided Tours — Virtual Herbal Garden',
    minRole: 'USER',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/become-contributor',
    pattern: /^\/dashboard\/become-contributor\/?$/,
    label: 'Become a Botanist',
    title: 'Become a Botanist Contributor — Virtual Herbal Garden',
    minRole: 'USER',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },

  // Botanist Routes
  {
    path: '/dashboard/contributions',
    pattern: /^\/dashboard\/contributions\/?$/,
    label: 'My Contributions',
    title: 'My Contributions — Virtual Herbal Garden',
    minRole: 'BOTANIST',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/contributions/new-plant',
    pattern: /^\/dashboard\/contributions\/new-plant\/?$/,
    label: 'New Plant Draft',
    title: 'New Plant Draft — Virtual Herbal Garden',
    minRole: 'BOTANIST',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'My Contributions', path: '/dashboard/contributions' },
    ],
  },
  {
    path: '/dashboard/contributions/new-remedy',
    pattern: /^\/dashboard\/contributions\/new-remedy\/?$/,
    label: 'New Remedy Draft',
    title: 'New Remedy Draft — Virtual Herbal Garden',
    minRole: 'BOTANIST',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'My Contributions', path: '/dashboard/contributions' },
    ],
  },
  {
    path: '/dashboard/contributions/plant/:id',
    pattern: /^\/dashboard\/contributions\/plant\/[^/]+\/?$/,
    label: 'Edit Plant Draft',
    title: 'Edit Plant Draft — Virtual Herbal Garden',
    minRole: 'BOTANIST',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'My Contributions', path: '/dashboard/contributions' },
    ],
  },
  {
    path: '/dashboard/contributions/remedy/:id',
    pattern: /^\/dashboard\/contributions\/remedy\/[^/]+\/?$/,
    label: 'Edit Remedy Draft',
    title: 'Edit Remedy Draft — Virtual Herbal Garden',
    minRole: 'BOTANIST',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'My Contributions', path: '/dashboard/contributions' },
    ],
  },
  {
    path: '/dashboard/contributions/:type/:id/review',
    pattern: /^\/dashboard\/contributions\/[^/]+\/[^/]+\/review\/?$/,
    label: 'Review Submission',
    title: 'Submission Review — Virtual Herbal Garden',
    minRole: 'BOTANIST',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'My Contributions', path: '/dashboard/contributions' },
    ],
  },
  {
    path: '/dashboard/ai-feedback',
    pattern: /^\/dashboard\/ai-feedback\/?$/,
    label: 'AI Feedback Queue',
    title: 'AI Feedback Queue — Virtual Herbal Garden',
    minRole: 'BOTANIST',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },

  // Admin Routes
  {
    path: '/dashboard/moderation',
    pattern: /^\/dashboard\/moderation\/?$/,
    label: 'Moderation Queue',
    title: 'Moderation Queue — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/moderation/:type/:id',
    pattern: /^\/dashboard\/moderation\/[^/]+\/[^/]+\/?$/,
    label: 'Review Content',
    title: 'Content Review — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Moderation Queue', path: '/dashboard/moderation' },
    ],
  },
  {
    path: '/dashboard/content/plants',
    pattern: /^\/dashboard\/content\/plants\/?$/,
    label: 'Manage Plants',
    title: 'Manage Plants — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/content/remedies',
    pattern: /^\/dashboard\/content\/remedies\/?$/,
    label: 'Manage Remedies',
    title: 'Manage Remedies — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/plants',
    pattern: /^\/dashboard\/plants\/?$/,
    label: 'Manage Plants',
    title: 'Manage Plants — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/users',
    pattern: /^\/dashboard\/users\/?$/,
    label: 'User Management',
    title: 'User Management — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/analytics',
    pattern: /^\/dashboard\/analytics\/?$/,
    label: 'Platform Overview',
    title: 'Analytics Overview — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/analytics/scanner',
    pattern: /^\/dashboard\/analytics\/scanner\/?$/,
    label: 'AI Scanner Stats',
    title: 'AI Scanner Stats — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Analytics', path: '/dashboard/analytics' },
    ],
  },
  {
    path: '/dashboard/analytics/users',
    pattern: /^\/dashboard\/analytics\/users\/?$/,
    label: 'User Growth',
    title: 'User Growth Analytics — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Analytics', path: '/dashboard/analytics' },
    ],
  },
  {
    path: '/dashboard/featured',
    pattern: /^\/dashboard\/featured\/?$/,
    label: 'Featured Content',
    title: 'Featured Content — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/tours/manage',
    pattern: /^\/dashboard\/tours\/manage\/?$/,
    label: 'Tours Management',
    title: 'Tours Management — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/tours/manage/new',
    pattern: /^\/dashboard\/tours\/manage\/new\/?$/,
    label: 'Create New Tour',
    title: 'Create Tour — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Tours Management', path: '/dashboard/tours/manage' },
    ],
  },
  {
    path: '/dashboard/tours/manage/:id',
    pattern: /^\/dashboard\/tours\/manage\/[^/]+\/?$/,
    label: 'Edit Tour',
    title: 'Edit Tour — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Tours Management', path: '/dashboard/tours/manage' },
    ],
  },
  {
    path: '/dashboard/tours/analytics',
    pattern: /^\/dashboard\/tours\/analytics\/?$/,
    label: 'Tour Analytics',
    title: 'Tour Analytics — Virtual Herbal Garden',
    minRole: 'ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Tours Management', path: '/dashboard/tours/manage' },
    ],
  },

  // Super Admin Routes
  {
    path: '/dashboard/system',
    pattern: /^\/dashboard\/system\/?$/,
    label: 'System Overview',
    title: 'System Overview — Virtual Herbal Garden',
    minRole: 'SUPER_ADMIN',
    parents: [{ label: 'Dashboard', path: '/dashboard' }],
  },
  {
    path: '/dashboard/system/feature-flags',
    pattern: /^\/dashboard\/system\/feature-flags\/?$/,
    label: 'Feature Flags',
    title: 'Feature Flags — Virtual Herbal Garden',
    minRole: 'SUPER_ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'System', path: '/dashboard/system' },
    ],
  },
  {
    path: '/dashboard/system/role-management',
    pattern: /^\/dashboard\/system\/role-management\/?$/,
    label: 'Role Management',
    title: 'Role Management — Virtual Herbal Garden',
    minRole: 'SUPER_ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'System', path: '/dashboard/system' },
    ],
  },
  {
    path: '/dashboard/system/audit-log',
    pattern: /^\/dashboard\/system\/audit-log\/?$/,
    label: 'Audit Log',
    title: 'Audit Log — Virtual Herbal Garden',
    minRole: 'SUPER_ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'System', path: '/dashboard/system' },
    ],
  },
  {
    path: '/dashboard/system/ai-model-config',
    pattern: /^\/dashboard\/system\/ai-model-config\/?$/,
    label: 'AI Model Config',
    title: 'AI Model Config — Virtual Herbal Garden',
    minRole: 'SUPER_ADMIN',
    parents: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'System', path: '/dashboard/system' },
    ],
  },
];

/**
 * Finds matching route config for a given pathname.
 */
export function findDashboardRoute(pathname: string): DashboardRouteConfig | undefined {
  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/dashboard';
  return DASHBOARD_ROUTES.find((r) => r.pattern.test(cleanPath));
}

/**
 * Derives breadcrumbs for a given pathname.
 */
export function getBreadcrumbsForPath(pathname: string): BreadcrumbCrumb[] {
  const route = findDashboardRoute(pathname);
  if (!route) {
    // Fallback: simple path split
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, idx) => ({
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/[-_]/g, ' '),
      path: '/' + parts.slice(0, idx + 1).join('/'),
      isLast: idx === parts.length - 1,
    }));
  }

  const crumbs: BreadcrumbCrumb[] = (route.parents || []).map((p) => ({
    label: p.label,
    path: p.path,
    isLast: false,
  }));

  crumbs.push({
    label: route.label,
    path: pathname,
    isLast: true,
  });

  return crumbs;
}
