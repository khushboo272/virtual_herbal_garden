// ──────────────────────────────────────────────────────────
// StatusBadge — unified content status badges (PRD §5.3)
// 6 statuses: DRAFT, IN_REVIEW, PUBLISHED, REJECTED,
//             CHANGES_REQUESTED, ARCHIVED
// ──────────────────────────────────────────────────────────

import { Circle, Clock, CheckCircle, XCircle, AlertTriangle, Archive } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';

export type ContentStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'CHANGES_REQUESTED'
  | 'ARCHIVED';

const STATUS_CONFIG: Record<ContentStatus, {
  label: string;
  icon: typeof Circle;
  className: string;
}> = {
  DRAFT: {
    label: 'Draft',
    icon: Circle,
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  },
  IN_REVIEW: {
    label: 'In Review',
    icon: Clock,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  PUBLISHED: {
    label: 'Published',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    icon: AlertTriangle,
    className: 'bg-orange-100 text-orange-700 border-orange-300',
  },
  ARCHIVED: {
    label: 'Archived',
    icon: Archive,
    className: 'bg-gray-100 text-gray-500 border-gray-300',
  },
};

interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;

  return (
    <Badge className={cn(config.className, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}
