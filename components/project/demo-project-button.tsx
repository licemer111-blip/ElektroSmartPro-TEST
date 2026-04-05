"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { createDemoProject } from "@/app/dashboard/actions";

export function DemoProjectButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createDemoProject();
      if (result.error) {
        setError(result.error);
      } else if (result.projectId) {
        router.push(`/dashboard/projects/${result.projectId}`);
      }
    });
  };

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreate}
        disabled={isPending}
        className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isPending ? "Tworzę projekt demonstracyjny..." : "Otwórz projekt demonstracyjny"}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">
        Gotowy kosztorys mieszkania 65m² z 24 pozycjami — zobaczysz jak działa system
      </p>
    </div>
  );
}
