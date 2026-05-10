// ──────────────────────────────────────────────────────────
// Dashboard Sidebar — collapsible, role-aware (PRD §6.1)
// ──────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import { cn } from '../ui/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Separator } from '../ui/separator';
import { getNavForRole, type UserRole, type NavItem, type NavSection } from './roleNavConfig';

interface DashboardSidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Dynamic badge counts map */
  badgeCounts?: Record<string, number>;
}

export function DashboardSidebar({ role, collapsed, onToggleCollapse, badgeCounts = {} }: DashboardSidebarProps) {
  const location = useLocation();
  const sections = getNavForRole(role);

  return (
    <aside
      className={cn(
        'sticky top-[64px] z-40 h-[calc(100vh-64px)] bg-white border-r border-green-200/60 transition-all duration-300 flex flex-col shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
    >
      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {sections.map((section, sIdx) => (
          <SidebarSection
            key={sIdx}
            section={section}
            collapsed={collapsed}
            currentPath={location.pathname}
            badgeCounts={badgeCounts}
            isLast={sIdx === sections.length - 1}
          />
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-green-200/60 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="w-full justify-center text-green-600 hover:bg-green-50"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}

// ── Section ──────────────────────────────────────────────

function SidebarSection({
  section,
  collapsed,
  currentPath,
  badgeCounts,
  isLast,
}: {
  section: NavSection;
  collapsed: boolean;
  currentPath: string;
  badgeCounts: Record<string, number>;
  isLast: boolean;
}) {
  return (
    <div>
      {section.title && !collapsed && (
        <>
          <Separator className="my-2" />
          <p className={cn('text-[10px] font-bold tracking-widest uppercase px-3 py-1.5', section.accentClass || 'text-gray-400')}>
            {section.title}
          </p>
        </>
      )}
      {section.title && collapsed && <Separator className="my-2" />}
      {!section.title && !isLast && <Separator className="my-2" />}

      {section.items.map((item) => (
        <SidebarItem
          key={item.path}
          item={item}
          collapsed={collapsed}
          currentPath={currentPath}
          badgeCounts={badgeCounts}
        />
      ))}
    </div>
  );
}

// ── Single Item (with optional children) ─────────────────

function SidebarItem({
  item,
  collapsed,
  currentPath,
  badgeCounts,
  depth = 0,
}: {
  item: NavItem;
  collapsed: boolean;
  currentPath: string;
  badgeCounts: Record<string, number>;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
  const hasChildren = item.children && item.children.length > 0;
  const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : undefined;

  const linkContent = (
    <div
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer group',
        isActive
          ? 'bg-green-100 text-green-800'
          : 'text-gray-600 hover:bg-green-50 hover:text-green-700',
        depth > 0 && 'ml-6 text-[13px]',
      )}
      onClick={(e) => {
        if (hasChildren) {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-green-700' : 'text-gray-400 group-hover:text-green-600')} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {badgeCount !== undefined && badgeCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px] px-1.5 py-0 min-w-[20px] text-center">
              {badgeCount}
            </Badge>
          )}
          {hasChildren && (
            <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 transition-transform', expanded && 'rotate-180')} />
          )}
        </>
      )}
    </div>
  );

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={item.path}>{linkContent}</Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            {item.label}
            {badgeCount !== undefined && badgeCount > 0 && ` (${badgeCount})`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div>
      {hasChildren ? (
        <div>
          {linkContent}
          {expanded && item.children!.map((child) => (
            <Link key={child.path} to={child.path}>
              <SidebarItem
                item={child}
                collapsed={collapsed}
                currentPath={currentPath}
                badgeCounts={badgeCounts}
                depth={depth + 1}
              />
            </Link>
          ))}
        </div>
      ) : (
        <Link to={item.path}>{linkContent}</Link>
      )}
    </div>
  );
}
