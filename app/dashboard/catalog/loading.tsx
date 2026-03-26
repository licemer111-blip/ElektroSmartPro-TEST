import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CatalogLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        </div>
      </div>

      {/* Search & filters skeleton */}
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-muted animate-pulse rounded-md" />
        <div className="h-10 w-32 bg-muted animate-pulse rounded-md" />
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Ładowanie katalogu...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
