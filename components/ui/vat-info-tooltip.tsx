import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VatInfoTooltipProps {
  rate: 8 | 23;
  className?: string;
}

/**
 * Expert VAT Tooltip Component
 * Shows detailed Polish tax law information for 8% vs 23% rates
 */
export function VatInfoTooltip({ rate, className }: VatInfoTooltipProps) {
  const content = rate === 8
    ? "Stawka dla budownictwa objętego społecznym programem mieszkaniowym (np. domy do 300 m², mieszkania do 150 m²)."
    : "Stawka dla budynków komercyjnych, lokali użytkowych, garaży wolnostojących oraz prac poza budynkiem.";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={`inline-flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${className}`}
            onClick={(e) => e.stopPropagation()} // Prevent card selection when clicking icon
          >
            <Info className="w-4 h-4" />
            <span className="sr-only">Informacje o stawce VAT {rate}%</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs p-3 bg-slate-900 dark:bg-slate-800 text-white text-xs border-slate-700"
          sideOffset={8}
        >
          <p className="leading-relaxed">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
