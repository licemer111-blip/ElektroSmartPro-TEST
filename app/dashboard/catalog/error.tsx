"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function CatalogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CatalogPage] Server error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
          Błąd ładowania katalogu
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
          Wystąpił problem podczas ładowania danych. Spróbuj odświeżyć stronę.
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Spróbuj ponownie
      </Button>
    </div>
  );
}
