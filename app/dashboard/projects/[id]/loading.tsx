import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ProjectLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
              <div className="h-6 w-28 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Ładowanie projektu...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
