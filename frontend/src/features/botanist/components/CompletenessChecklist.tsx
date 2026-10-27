import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../app/components/ui/card';

export interface ChecklistItem {
  id: string;
  label: string;
  isComplete: boolean;
  isRequiredForReview: boolean;
  hint?: string;
}

interface CompletenessChecklistProps {
  items: ChecklistItem[];
  className?: string;
  onItemClick?: (id: string) => void;
}

export function CompletenessChecklist({ items, className, onItemClick }: CompletenessChecklistProps) {
  const completedCount = items.filter((i) => i.isComplete).length;
  const totalCount = items.length;
  const allRequiredMet = items.filter((i) => i.isRequiredForReview).every((i) => i.isComplete);
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <Card className={`border border-purple-200/70 shadow-sm bg-white/95 backdrop-blur-sm ${className || ''}`}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <span>Ready for Review</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {completedCount}/{totalCount}
            </span>
          </CardTitle>
          <span
            className={`text-xs font-bold ${
              allRequiredMet ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {allRequiredMet ? 'Ready to Submit' : `${percentage}% Complete`}
          </span>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full transition-all duration-300 ${
              allRequiredMet ? 'bg-emerald-500' : 'bg-purple-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-1 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item.id)}
            role={onItemClick ? 'button' : undefined}
            tabIndex={onItemClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onItemClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onItemClick(item.id);
              }
            }}
            className={`flex items-start gap-2.5 text-xs py-1 transition-colors ${
              onItemClick ? 'cursor-pointer hover:bg-purple-50/80 px-2 py-1.5 rounded-lg -mx-2' : ''
            } ${item.isComplete ? 'text-gray-700' : 'text-gray-500'}`}
          >
            {item.isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : item.isRequiredForReview ? (
              <Circle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className={item.isComplete ? 'font-medium' : ''}>
                {item.label}
              </span>
              {item.isRequiredForReview && !item.isComplete && (
                <span className="text-[10px] text-amber-600 font-medium ml-1.5">(Required)</span>
              )}
              {item.hint && !item.isComplete && (
                <p className="text-[11px] text-gray-400 mt-0.5">{item.hint}</p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
