"use client";

import { PenLine } from "lucide-react";

interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

interface ProjectPricingModeControlProps {
  liveRegionId: string;
  isRegionPending: boolean;
  isFinal: boolean;
  isReadOnly: boolean;
  useCustomRates: boolean;
  regions: Region[];
  onRegionChange: (regionId: string) => void;
}

const MANUAL_CFG = {
  label: "Własny (P1)",
  icon: PenLine,
  badge: "bg-purple-100 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300",
  dot: "bg-purple-500",
  description: "P1 Własny — Twoje stawki i katalog prywatny mają pierwszeństwo. Norma ES uzupełnia brakującą godzinę.",
};

export function ProjectPricingModeControl({
  useCustomRates,
}: ProjectPricingModeControlProps) {
  if (!useCustomRates) return null;
  const Icon = MANUAL_CFG.icon;

  return (
    <div className="flex items-center gap-2 w-full flex-wrap">
      <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold flex-shrink-0 ${MANUAL_CFG.badge}`}
          title="Liczę Twoimi stawkami z katalogu. Norma ES uzupełnia brakującą godzinę."
        >
          <Icon className="h-3 w-3" />
          <span>Twoje stawki</span>
        </div>
    </div>
  );
}
