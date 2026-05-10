// ──────────────────────────────────────────────────────────
// Dashboard Sidebar Navigation — per-role configuration
// PRD §4.2.1, §4.3.1, §4.4.1, §4.5.1
// ──────────────────────────────────────────────────────────

import {
  Home, BookmarkIcon, Leaf, Sparkles, BookOpen, MapPin,
  Settings, HelpCircle, FileText, MessageSquare,
  ClipboardList, Map, BarChart3, Star, Users, Wrench,
  Shield, ScrollText, Cpu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type UserRole = 'GUEST' | 'USER' | 'BOTANIST' | 'ADMIN' | 'SUPER_ADMIN';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  /** Badge count key to resolve dynamically (optional) */
  badgeKey?: string;
  children?: Omit<NavItem, 'children'>[];
}

export interface NavSection {
  /** Section heading (empty string = no heading) */
  title: string;
  /** Optional accent color class for section heading */
  accentClass?: string;
  items: NavItem[];
}

// ── USER Sidebar (PRD §4.2.1) ────────────────────────────

const userNav: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      { label: 'My Garden', icon: Leaf, path: '/dashboard/garden' },
      { label: 'Bookmarks', icon: BookmarkIcon, path: '/dashboard/bookmarks' },
      { label: 'AI Scanner', icon: Sparkles, path: '/dashboard/scanner' },
      { label: 'Explore Plants', icon: BookOpen, path: '/library' },
      { label: 'Guided Tours', icon: MapPin, path: '/dashboard/tours' },
    ],
  },
  {
    title: '',
    items: [
      { label: 'Settings & Profile', icon: Settings, path: '/dashboard/profile' },
      { label: 'Help & Support', icon: HelpCircle, path: '/dashboard/help' },
    ],
  },
];

// ── BOTANIST Sidebar (PRD §4.3.1) ────────────────────────

const botanistNav: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      {
        label: 'My Contributions',
        icon: FileText,
        path: '/dashboard/contributions',
        children: [
          { label: 'All Drafts', icon: FileText, path: '/dashboard/contributions' },
          { label: 'New Plant Draft', icon: Leaf, path: '/dashboard/contributions/new-plant' },
          { label: 'New Remedy Draft', icon: FileText, path: '/dashboard/contributions/new-remedy' },
        ],
      },
      { label: 'AI Feedback Queue', icon: MessageSquare, path: '/dashboard/ai-feedback', badgeKey: 'pendingCorrections' },
      { label: 'Bookmarks', icon: BookmarkIcon, path: '/dashboard/bookmarks' },
      { label: 'My Garden', icon: Leaf, path: '/dashboard/garden' },
      { label: 'Explore Plants', icon: BookOpen, path: '/library' },
    ],
  },
  {
    title: '',
    items: [
      { label: 'Settings & Profile', icon: Settings, path: '/dashboard/profile' },
      { label: 'Help & Support', icon: HelpCircle, path: '/dashboard/help' },
    ],
  },
];

// ── ADMIN Sidebar (PRD §4.4.1) ───────────────────────────

const adminNav: NavSection[] = [
  {
    title: '',
    items: [
      { label: 'Dashboard', icon: Home, path: '/dashboard' },
      {
        label: 'Moderation Queue',
        icon: ClipboardList,
        path: '/dashboard/moderation',
        badgeKey: 'pendingModeration',
        children: [
          { label: 'Plants', icon: Leaf, path: '/dashboard/moderation?type=plant', badgeKey: 'pendingPlants' },
          { label: 'Remedies', icon: FileText, path: '/dashboard/moderation?type=remedy', badgeKey: 'pendingRemedies' },
          { label: 'Tours', icon: Map, path: '/dashboard/moderation?type=tour', badgeKey: 'pendingTours' },
        ],
      },
      {
        label: 'Tours Management',
        icon: Map,
        path: '/dashboard/tours/manage',
        children: [
          { label: 'All Tours', icon: Map, path: '/dashboard/tours/manage' },
          { label: 'Create New Tour', icon: Map, path: '/dashboard/tours/manage/new' },
          { label: 'Tour Analytics', icon: BarChart3, path: '/dashboard/tours/analytics' },
        ],
      },
      {
        label: 'Analytics',
        icon: BarChart3,
        path: '/dashboard/analytics',
        children: [
          { label: 'Platform Overview', icon: BarChart3, path: '/dashboard/analytics' },
          { label: 'AI Scanner Stats', icon: Sparkles, path: '/dashboard/analytics/scanner' },
          { label: 'User Growth', icon: Users, path: '/dashboard/analytics/users' },
        ],
      },
      { label: 'Featured Content', icon: Star, path: '/dashboard/featured' },
      { label: 'User Management', icon: Users, path: '/dashboard/users' },
      { label: 'Bookmarks', icon: BookmarkIcon, path: '/dashboard/bookmarks' },
      { label: 'My Garden', icon: Leaf, path: '/dashboard/garden' },
    ],
  },
  {
    title: '',
    items: [
      { label: 'Settings & Profile', icon: Settings, path: '/dashboard/profile' },
      { label: 'Help & Support', icon: HelpCircle, path: '/dashboard/help' },
    ],
  },
];

// ── SUPER_ADMIN Sidebar (PRD §4.5.1) ─────────────────────

const superAdminNav: NavSection[] = [
  ...adminNav.slice(0, -1), // all admin sections except the footer
  {
    title: 'SYSTEM',
    accentClass: 'text-amber-600',
    items: [
      { label: 'System Overview', icon: Wrench, path: '/dashboard/system' },
      { label: 'Feature Flags', icon: Shield, path: '/dashboard/system/feature-flags' },
      { label: 'Role Management', icon: Users, path: '/dashboard/system/role-management' },
      { label: 'Audit Log', icon: ScrollText, path: '/dashboard/system/audit-log' },
      { label: 'AI Model Config', icon: Cpu, path: '/dashboard/system/ai-model-config' },
    ],
  },
  // Footer section
  adminNav[adminNav.length - 1],
];

// ── Role → Nav config resolver ───────────────────────────

export function getNavForRole(role: UserRole): NavSection[] {
  switch (role) {
    case 'SUPER_ADMIN': return superAdminNav;
    case 'ADMIN':       return adminNav;
    case 'BOTANIST':    return botanistNav;
    case 'USER':        return userNav;
    default:            return userNav;
  }
}
