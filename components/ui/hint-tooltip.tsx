"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { useHints } from "@/hooks/useHints";
import { cn } from "@/lib/utils";

interface HintTooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  /** Show a small ? icon instead of wrapping children */
  iconOnly?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  iconClassName?: string;
  delayDuration?: number;
}

export function HintTooltip({
  content,
  children,
  iconOnly = false,
  side = "bottom",
  className,
  iconClassName,
  delayDuration = 300,
}: HintTooltipProps) {
  const { hintsEnabled } = useHints();

  if (!hintsEnabled) {
    return <>{children}</>;
  }

  if (iconOnly) {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400 transition-colors cursor-help",
                iconClassName
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side={side}
            className={cn("max-w-[260px] text-xs leading-relaxed z-50", className)}
          >
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{children}</span>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className={cn("max-w-[260px] text-xs leading-relaxed z-50", className)}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
