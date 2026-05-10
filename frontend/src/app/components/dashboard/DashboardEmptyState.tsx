// ──────────────────────────────────────────────────────────
// DashboardEmptyState — botanical-themed empty state (PRD §5.5)
// ──────────────────────────────────────────────────────────

import { Leaf } from 'lucide-react';
import { Button } from '../ui/button';
import type { LucideIcon } from 'lucide-react';

interface DashboardEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function DashboardEmptyState({
  icon: Icon = Leaf,
  title,
  description,
  actionLabel,
  onAction,
}: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Botanical illustration placeholder */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
          <Icon className="w-10 h-10 text-green-400" />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-300 rounded-full opacity-60" />
        <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-emerald-300 rounded-full opacity-40" />
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm text-center mb-6">{description}</p>

      {actionLabel && onAction && (
        <Button className="bg-green-600 hover:bg-green-700" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
