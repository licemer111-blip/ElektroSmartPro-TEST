"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { CalculatorPdfExport, type PdfInputRow, type PdfResultRow } from "./calculator-pdf-export";
import { CalculatorHistory } from "./calculator-history";
import { CalculatorAttachToProject } from "./calculator-attach-to-project";

interface CalculatorActionBarProps<T extends Record<string, any> = Record<string, any>> {
  /** Unique calculator ID for localStorage key */
  calculatorId: string;
  /** Calculator display title for PDF header */
  title: string;
  /** Whether a result currently exists */
  hasResult: boolean;
  /** Inputs formatted for PDF */
  pdfInputs: PdfInputRow[];
  /** Results formatted for PDF */
  pdfResults: PdfResultRow[];
  /** Optional standard reference for PDF (e.g. "PN-EN 60909") */
  standard?: string;
  /** Optional notes for PDF footer */
  notes?: string;
  /** Current input values (raw) for history save/load */
  currentInputs: T;
  /** Short label describing current calculation */
  currentLabel: string;
  /** Callback to restore inputs from history */
  onLoadInputs: (inputs: T) => void;
  /** Callback to reset all fields */
  onReset: () => void;
  /** Whether user has PRO subscription */
  isPro?: boolean;
}

export function CalculatorActionBar<T extends Record<string, any>>({
  calculatorId,
  title,
  hasResult,
  pdfInputs,
  pdfResults,
  standard,
  notes,
  currentInputs,
  currentLabel,
  onLoadInputs,
  onReset,
  isPro = true,
}: CalculatorActionBarProps<T>) {
  if (!hasResult) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-slate-200 dark:border-slate-800">
      {/* PDF Export */}
      <CalculatorPdfExport
        title={title}
        inputs={pdfInputs}
        results={pdfResults}
        standard={standard}
        notes={notes}
        isPro={isPro}
      />

      {/* Attach to Project */}
      <CalculatorAttachToProject
        title={title}
        inputs={pdfInputs}
        results={pdfResults}
        standard={standard}
        notes={notes}
        isPro={isPro}
      />

      {/* History Save / Load */}
      <CalculatorHistory
        calculatorId={calculatorId}
        currentInputs={currentInputs}
        currentLabel={currentLabel}
        onLoadInputs={onLoadInputs}
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Reset */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <RotateCcw className="h-4 w-4" />
        Wyczyść
      </Button>
    </div>
  );
}

export type { PdfInputRow, PdfResultRow };
