"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { Crown, Info } from "lucide-react";

interface CalculatorWrapperProps {
  children: ReactNode;
  isPro: boolean;
  calculatorName?: string;
}

/**
 * Wrapper for calculator pages — demo users see full calculator with a small upgrade banner.
 * All features are accessible; only prices are blurred via BlurredPrice in the UI.
 */
export function CalculatorWrapper({ children, isPro, calculatorName = "Kalkulator" }: CalculatorWrapperProps) {
  const { onOpen } = useModalStore();

  return (
    <>
      {!isPro && (
        <div className="mx-auto max-w-4xl px-4 pt-4">
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-2.5">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200 flex-1">
              <strong>WERSJA DEMO</strong> — wyniki kalkulatora z ukrytymi cenami. Przejdź na PRO, aby zobaczyć pełne wartości.
            </p>
            <Button
              onClick={() => onOpen('proModal')}
              size="sm"
              variant="outline"
              className="h-7 text-xs border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex-shrink-0"
            >
              <Crown className="mr-1 w-3 h-3" />
              PRO
            </Button>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
