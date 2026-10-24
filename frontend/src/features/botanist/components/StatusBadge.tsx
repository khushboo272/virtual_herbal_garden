import React from 'react';
import { Badge } from '../../../app/components/ui/badge';
import { Clock, CheckCircle2, AlertTriangle, XCircle, FileEdit } from 'lucide-react';
import type { ContentStatus } from '../types';

interface StatusBadgeProps {
  status: ContentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  switch (status) {
    case 'PUBLISHED':
      return (
        <Badge
          variant="outline"
          className={`bg-emerald-50 text-emerald-700 border-emerald-300 font-medium inline-flex items-center gap-1.5 px-2.5 py-0.5 ${className || ''}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Published
        </Badge>
      );
    case 'PENDING_REVIEW':
      return (
        <Badge
          variant="outline"
          className={`bg-amber-50 text-amber-700 border-amber-300 font-medium inline-flex items-center gap-1.5 px-2.5 py-0.5 ${className || ''}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin-slow" />
          Pending Review
        </Badge>
      );
    case 'CHANGES_REQUESTED':
      return (
        <Badge
          variant="outline"
          className={`bg-orange-50 text-orange-700 border-orange-300 font-medium inline-flex items-center gap-1.5 px-2.5 py-0.5 ${className || ''}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
          Changes Requested
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge
          variant="outline"
          className={`bg-rose-50 text-rose-700 border-rose-300 font-medium inline-flex items-center gap-1.5 px-2.5 py-0.5 ${className || ''}`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </Badge>
      );
    case 'DRAFT':
    default:
      return (
        <Badge
          variant="outline"
          className={`bg-slate-50 text-slate-700 border-slate-300 font-medium inline-flex items-center gap-1.5 px-2.5 py-0.5 ${className || ''}`}
        >
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Draft
        </Badge>
      );
  }
}
