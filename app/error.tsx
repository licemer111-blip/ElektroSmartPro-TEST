"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report error for monitoring
    console.error("Application Error:", error);
    // Send to analytics (non-blocking)
    if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      navigator.sendBeacon("/api/analytics/vitals", JSON.stringify({
        name: "ERROR",
        value: 1,
        rating: "poor",
        page: window.location.pathname,
        timestamp: Date.now(),
        error: { message: error.message, digest: error.digest },
      }));
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
            <AlertTriangle className="w-24 h-24 text-red-600 relative" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Coś poszło nie tak
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Przepraszamy, wystąpił nieoczekiwany błąd.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">
              Error ID: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={reset}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Spróbuj ponownie
          </Button>
          <Button 
            asChild 
            variant="outline"
          >
            <a href="/dashboard">
              Wróć do Dashboard
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
