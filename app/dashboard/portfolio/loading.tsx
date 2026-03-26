import { Card } from "@/components/ui/card";

export default function PortfolioLoading() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-7 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded mt-2" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>

      {/* Status bar skeleton */}
      <Card className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <div className="h-5 w-60 bg-slate-200 dark:bg-slate-700 rounded" />
      </Card>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <div className="h-48 bg-slate-200 dark:bg-slate-700" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
