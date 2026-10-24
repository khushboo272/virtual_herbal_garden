import React from 'react';
import { Clock, CheckCircle, AlertTriangle, XCircle, Undo, Send, MessageSquare } from 'lucide-react';
import type { IReviewNote, ReviewAction } from '../types';

interface ReviewNotesTimelineProps {
  notes?: IReviewNote[];
  className?: string;
}

function getActionMeta(action: ReviewAction) {
  switch (action) {
    case 'SUBMITTED':
      return {
        label: 'Submitted for Review',
        icon: Send,
        color: 'text-purple-600 bg-purple-100 border-purple-200',
      };
    case 'APPROVED':
      return {
        label: 'Approved & Published',
        icon: CheckCircle,
        color: 'text-emerald-600 bg-emerald-100 border-emerald-200',
      };
    case 'CHANGES_REQUESTED':
      return {
        label: 'Changes Requested',
        icon: AlertTriangle,
        color: 'text-amber-600 bg-amber-100 border-amber-200',
      };
    case 'REJECTED':
      return {
        label: 'Review Rejected',
        icon: XCircle,
        color: 'text-rose-600 bg-rose-100 border-rose-200',
      };
    case 'WITHDRAWN':
      return {
        label: 'Withdrawn by Contributor',
        icon: Undo,
        color: 'text-slate-600 bg-slate-100 border-slate-200',
      };
    default:
      return {
        label: action,
        icon: Clock,
        color: 'text-gray-600 bg-gray-100 border-gray-200',
      };
  }
}

export function ReviewNotesTimeline({ notes = [], className }: ReviewNotesTimelineProps) {
  if (notes.length === 0) {
    return (
      <div className={`p-4 text-center text-sm text-gray-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 ${className || ''}`}>
        <MessageSquare className="w-5 h-5 mx-auto mb-1 text-slate-400" />
        No review notes or activity recorded yet.
      </div>
    );
  }

  // Sort descending by date (newest on top) or ascending
  const sorted = [...notes].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {sorted.map((note, idx) => {
        const meta = getActionMeta(note.action);
        const Icon = meta.icon;
        const dateStr = new Date(note.at).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        return (
          <div key={idx} className="relative pl-7 pb-3 last:pb-0">
            {/* Timeline vertical bar */}
            {idx < sorted.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200" />
            )}

            {/* Timeline icon */}
            <div
              className={`absolute left-0 top-0.5 w-6 h-6 rounded-full border flex items-center justify-center ${meta.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-xs text-gray-900">{meta.label}</span>
                <span className="text-[11px] text-gray-400">{dateStr}</span>
              </div>
              {note.comment && (
                <p className="text-xs text-gray-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 leading-relaxed">
                  "{note.comment}"
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
