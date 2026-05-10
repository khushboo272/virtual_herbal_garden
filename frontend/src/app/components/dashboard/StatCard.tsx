// ──────────────────────────────────────────────────────────
// StatCard — reusable dashboard stat card (PRD §5.1)
// Animated counter, delta indicator, skeleton loader
// ──────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../ui/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  /** Delta text e.g. "+3 this week" */
  delta?: string;
  /** Whether delta is positive (green) or negative (red). Default: positive */
  deltaPositive?: boolean;
  /** Click handler — navigates to relevant section */
  onClick?: () => void;
  /** Show skeleton while loading */
  isLoading?: boolean;
}

export function StatCard({ label, value, icon: Icon, color, delta, deltaPositive = true, onClick, isLoading }: StatCardProps) {
  const displayValue = useAnimatedCounter(value, isLoading);

  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <Card
      className={cn(
        'border-2 border-green-200/60 bg-white hover:shadow-lg transition-all duration-300',
        onClick && 'cursor-pointer hover:border-green-300',
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-5 h-5" />
          </div>
          {delta && (
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              deltaPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
            )}>
              {delta}
            </span>
          )}
        </div>
        <div className="text-3xl font-bold text-gray-900 mb-0.5 tabular-nums">{displayValue}</div>
        <p className="text-sm text-gray-500">{label}</p>
      </CardContent>
    </Card>
  );
}

// ── Animated Counter ─────────────────────────────────────

function useAnimatedCounter(target: number, skip?: boolean): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (skip || target === 0) {
      setDisplay(target);
      return;
    }

    const duration = 800; // ms
    const start = performance.now();
    const startVal = 0;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, skip]);

  return display;
}

// ── Skeleton Loader ──────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <Card className="border-2 border-green-200/60 bg-white">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="w-11 h-11 rounded-xl" />
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}
