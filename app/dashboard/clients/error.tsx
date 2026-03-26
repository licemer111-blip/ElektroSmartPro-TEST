"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function ClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Clients Error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center space-y-5 max-w-sm">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Błąd ładowania klientów
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nie udało się załadować danych. Spróbuj ponownie.
          </p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Spróbuj ponownie
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <a href="/dashboard">
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
