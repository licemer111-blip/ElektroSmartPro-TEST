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
                "inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0",
                "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400",
                "ring-1 ring-blue-300 dark:ring-blue-700",
                "hover:bg-blue-200 dark:hover:bg-blue-800/80 hover:text-blue-700 dark:hover:text-blue-300",
                "hover:shadow-[0_0_8px_rgba(59,130,246,0.55)] dark:hover:shadow-[0_0_8px_rgba(96,165,250,0.45)]",
                "transition-all duration-150 cursor-help",
                iconClassName
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <HelpCircle className="w-3 h-3 flex-shrink-0" />
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
