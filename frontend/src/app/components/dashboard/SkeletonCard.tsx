// ──────────────────────────────────────────────────────────
// SkeletonCard — CSS shimmer skeleton (PRD §5.6)
// Matches loaded content dimensions to prevent CLS.
// ──────────────────────────────────────────────────────────

import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

/** Generic card-shaped skeleton for dashboard widgets */
export function SkeletonCard() {
  return (
    <Card className="border-2 border-green-200/60 bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
}

/** Table-shaped skeleton for list/table widgets */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="border-2 border-green-200/60 bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Table header */}
        <div className="flex gap-4 mb-3 pb-2 border-b border-gray-100">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16 ml-auto" />
        </div>
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center py-3 border-b border-gray-50 last:border-0">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-16 rounded ml-auto" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Two-column dashboard skeleton */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2 border-green-200/60 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="w-11 h-11 rounded-xl" />
                <Skeleton className="w-14 h-5 rounded-full" />
              </div>
              <Skeleton className="h-8 w-14 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonTable rows={4} />
        </div>
        <div>
          <SkeletonCard />
        </div>
      </div>
    </div>
  );
}
