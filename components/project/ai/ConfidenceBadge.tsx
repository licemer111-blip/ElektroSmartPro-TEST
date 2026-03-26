"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ConfidenceBadgeProps {
  score: number;
}

export const ConfidenceBadge = ({ score }: ConfidenceBadgeProps) => {
  const color =
    score > 0.9
      ? "bg-green-500"
      : score > 0.7
      ? "bg-yellow-500"
      : "bg-red-500";
  const label = Math.round(score * 100) + "%";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`w-2 h-2 rounded-full ${color} animate-pulse cursor-default`}
          aria-label={`Pewność AI: ${label}`}
        />
      </TooltipTrigger>
      <TooltipContent side="top">
        Pewność AI: <span className="font-semibold">{label}</span>
      </TooltipContent>
    </Tooltip>
  );
};
