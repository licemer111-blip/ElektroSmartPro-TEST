import { Loader2 } from "lucide-react";

interface PageSkeletonProps {
  title?: string;
  cards?: number;
  table?: boolean;
}

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className || ""}`} />
  );
}

export function PageSkeleton({ title, cards = 0, table = false }: PageSkeletonProps) {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shimmer className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Shimmer className="w-40 h-5" />
            <Shimmer className="w-56 h-3" />
          </div>
        </div>
        <Shimmer className="w-28 h-8 rounded-md" />
      </div>

      {/* Stat cards */}
      {cards > 0 && (
        <div className={`grid grid-cols-2 md:grid-cols-${Math.min(cards, 4)} gap-3`}>
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Shimmer className="w-20 h-3" />
              <Shimmer className="w-16 h-6" />
              <Shimmer className="w-full h-2" />
            </div>
          ))}
        </div>
      )}

      {/* Table skeleton */}
      {table && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <Shimmer className="w-8 h-4" />
            <Shimmer className="flex-1 h-4" />
            <Shimmer className="w-20 h-4" />
            <Shimmer className="w-20 h-4" />
            <Shimmer className="w-16 h-4" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border-b border-slate-100 dark:border-slate-800/50">
              <Shimmer className="w-8 h-4" />
              <Shimmer className="flex-1 h-4" />
              <Shimmer className="w-20 h-4" />
              <Shimmer className="w-20 h-4" />
              <Shimmer className="w-16 h-4" />
            </div>
          ))}
        </div>
      )}

      {/* Generic content placeholder */}
      {!table && cards === 0 && (
        <div className="space-y-4">
          <Shimmer className="w-full h-32 rounded-xl" />
          <Shimmer className="w-full h-48 rounded-xl" />
        </div>
      )}

      {/* Loading indicator */}
      <div className="flex items-center justify-center pt-4">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
      </div>
    </div>
  );
}
