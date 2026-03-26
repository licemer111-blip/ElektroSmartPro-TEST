"use client";

import React, { useState, useCallback } from "react";
import { Sparkles, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ProjectItem } from "@/lib/types/database";
import { triggerL3Estimation, type L3EstimationResult } from "@/app/dashboard/projects/[id]/ai-actions";

const BATCH_SIZE = 5;

// ─── Filter helpers ───────────────────────────────────────────────────────────

function isBatchCandidate(item: ProjectItem): boolean {
  if (item.is_assembly_child) return false;
  if (item.confidence_level === "manual") return false;

  if (item.confidence_level === "unmatched") return true;

  const hasMaterialGap =
    (item.knr_source === "system_knr" || item.knr_source === "es_synthetic") &&
    (item.material_price ?? 0) === 0;

  return hasMaterialGap;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BatchAiEstimationProps {
  projectId: string;
  items: ProjectItem[];
  regionName?: string;
  isFinal?: boolean;
  onItemPriced: (itemId: string, result: L3EstimationResult) => void;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BatchAiEstimation({
  projectId,
  items,
  regionName,
  isFinal = false,
  onItemPriced,
  className,
}: BatchAiEstimationProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const candidates = items.filter(isBatchCandidate);
  const candidateCount = candidates.length;

  const handleRun = useCallback(async () => {
    if (isRunning || candidateCount === 0 || isFinal) return;

    setIsRunning(true);
    setIsDone(false);
    setDoneCount(0);
    setFailedCount(0);
    setTotalCount(candidateCount);

    const chunks: ProjectItem[][] = [];
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      chunks.push(candidates.slice(i, i + BATCH_SIZE));
    }

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map((item) =>
          triggerL3Estimation(projectId, item.id, item.name, item.unit ?? "szt", regionName)
        )
      );

      results.forEach((res, idx) => {
        if (res.status === "fulfilled" && res.value.success) {
          onItemPriced(chunk[idx].id, res.value);
          setDoneCount((c) => c + 1);
        } else {
          setFailedCount((f) => f + 1);
          setDoneCount((c) => c + 1);
        }
      });
    }

    setIsRunning(false);
    setIsDone(true);
  }, [candidates, candidateCount, isRunning, isFinal, projectId, regionName, onItemPriced]);

  if (isFinal || candidateCount === 0) return null;

  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const successCount = doneCount - failedCount;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("flex items-center gap-2", className)}>
        {isRunning ? (
          <div className="flex items-center gap-2 min-w-[220px]">
            <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin flex-shrink-0" />
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                  Wyceniam ES Engine...
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {doneCount}/{totalCount}
                </span>
              </div>
              <Progress value={progress} className="h-1.5 bg-violet-100 dark:bg-violet-950/30" />
            </div>
          </div>
        ) : isDone ? (
          <div className="flex items-center gap-1.5 text-[10px] font-medium">
            {failedCount === 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            )}
            <span className={failedCount === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
              {successCount} wyceniono
              {failedCount > 0 && `, ${failedCount} błędów`}
            </span>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRun}
                className="h-7 px-2.5 text-[11px] font-semibold text-violet-700 border-violet-300 hover:bg-violet-50 hover:border-violet-400 dark:text-violet-400 dark:border-violet-700 dark:hover:bg-violet-950/40 gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                Wyceń brakujące (L3)
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-violet-600 text-white text-[9px] font-bold leading-none">
                  {candidateCount}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[240px]">
              <p className="font-semibold mb-0.5">ES Engine na żądanie (L3)</p>
              <p className="text-slate-400">{candidateCount} pozycji bez ceny w L1+L2. Wycena ES Engine w paczkach po {BATCH_SIZE} — region: {regionName ?? "Polska"}.</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
