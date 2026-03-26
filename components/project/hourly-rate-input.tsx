"use client";

import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CircleDollarSign, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateHourlyRate, toggleLaborHoursInPdf, recalcAllLaborNorms } from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";

interface HourlyRateInputProps {
  projectId: string;
  defaultHourlyRate: number;
  showLaborHoursInPdf: boolean;
  isFinal?: boolean;
  compact?: boolean;
}

export function HourlyRateInput({
  projectId,
  defaultHourlyRate,
  showLaborHoursInPdf,
  isFinal = false,
  compact = false,
}: HourlyRateInputProps) {
  const [rate, setRate] = useState(String(defaultHourlyRate));
  const [showInPdf, setShowInPdf] = useState(showLaborHoursInPdf);

  // ⚡ LIVE SYNC: update displayed rate when another editor changes it
  useEffect(() => {
    setRate(String(defaultHourlyRate));
  }, [defaultHourlyRate]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRateBlur = () => {
    const parsed = parseFloat(rate);
    if (isNaN(parsed) || parsed < 0) {
      setRate(String(defaultHourlyRate));
      return;
    }
    const rounded = Math.round(parsed * 100) / 100;
    if (rounded === defaultHourlyRate) return;

    startTransition(async () => {
      const result = await updateHourlyRate(projectId, rounded);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
        setRate(String(defaultHourlyRate));
      } else {
        setRate(String(rounded));
        // Recalculate all items with labor_norm at the new rate
        const recalc = await recalcAllLaborNorms(projectId, rounded);
        const updatedCount = recalc.updatedCount ?? 0;
        notifyDataChanged("hourly-rate-changed");
        toast({
          title: "✅ Stawka zaktualizowana",
          description: updatedCount > 0
            ? `${rounded} PLN/rbh · przeliczono ${updatedCount} poz. z normą KNR`
            : `${rounded} PLN/rbh`,
        });
      }
    });
  };

  const isZeroRate = parseFloat(rate) === 0 || rate === "" || rate === "0";

  const handlePdfToggle = (checked: boolean) => {
    setShowInPdf(checked);
    startTransition(async () => {
      const result = await toggleLaborHoursInPdf(projectId, checked);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
        setShowInPdf(!checked);
      }
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-md border border-slate-200/80 dark:border-slate-700/60 w-full">
          <span title="Stawka za roboczogodzinę (rbh)" className="flex-shrink-0 cursor-help">
            <CircleDollarSign className={`h-3 w-3 ${isZeroRate ? "text-amber-500" : "text-slate-400 dark:text-slate-500"}`} />
          </span>
          <Input
            id={`labor-rate-compact-${projectId}`}
            name={`labor-rate-compact-${projectId}`}
            type="number" min={0} max={9999} step={5}
            aria-label="Stawka za roboczogodzinę (zł/rbh)"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            onBlur={handleRateBlur}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            disabled={isFinal || isPending}
            className={`h-6 flex-1 min-w-0 text-[11px] text-right pr-1 pl-1 dark:bg-slate-900 disabled:opacity-60 transition-colors ${
              isZeroRate
                ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                : "border-slate-300 dark:border-slate-600"
            }`}
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap select-none">zł/rbh</span>
          {isZeroRate && <AlertTriangle className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />}
          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
          <div title="Pokaż czas pracy (rbh) w pliku PDF" className="flex items-center gap-1 cursor-pointer ml-auto" onClick={() => !isFinal && !isPending && handlePdfToggle(!showInPdf)}>
            <Switch
              id={`labor-pdf-compact-${projectId}`}
              name={`labor-pdf-compact-${projectId}`}
              checked={showInPdf}
              onCheckedChange={(isFinal || isPending) ? undefined : handlePdfToggle}
              className={`scale-[0.65] origin-left flex-shrink-0${
                (isFinal || isPending) ? " pointer-events-none opacity-50" : ""
              }`}
            />
            <span className="text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap select-none leading-none">rbh w PDF</span>
          </div>
        </div>
    );
  }

  return (
    <>
      {/* Financial Badge — single row, subtle container */}
      <div className="flex flex-wrap items-center gap-2 px-2.5 py-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700/60">

        {/* ── Stawka r-g ── */}
        <div className="flex items-center gap-1.5 flex-nowrap">
          <span title="Stawka za roboczogodzinę (rbh). Mnożona przez normy KNR dla każdej pozycji w trybie Ekspert." className="flex-shrink-0 cursor-help">
            <CircleDollarSign className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap select-none">
            Stawka:
          </span>
          <div className="relative flex items-center" title={isZeroRate ? "Stawka 0 zł = Robocizna 0 zł. Ustaw stawkę, aby aktywować wycenę rbh." : undefined}>
            <Input
              id={`labor-rate-${projectId}`}
              name={`labor-rate-${projectId}`}
              type="number"
              min={0}
              max={9999}
              step={5}
              aria-label="Stawka za roboczogodzinę (zł/rbh)"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              onBlur={handleRateBlur}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              disabled={isFinal || isPending}
              className={`h-7 w-16 min-w-[56px] text-xs text-right pr-1 pl-2 dark:bg-slate-900 disabled:opacity-60 transition-colors ${
                isZeroRate
                  ? "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-950/30 focus-visible:ring-amber-400"
                  : "border-slate-300 dark:border-slate-600"
              }`}
            />
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap select-none">
            PLN/rbh
          </span>
          {isZeroRate && (
            <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
          )}
        </div>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 flex-shrink-0" />

        {/* ── PDF toggle ── */}
        <div
          title="Szczegółowe r-g w PDF: Włącz, aby pokazać klientowi nakłady czasu pracy (wg KNR) dla każdej pozycji w pliku PDF."
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => !isFinal && !isPending && handlePdfToggle(!showInPdf)}
        >
          <Switch
            id={`labor-pdf-${projectId}`}
            name={`labor-pdf-${projectId}`}
            checked={showInPdf}
            onCheckedChange={(isFinal || isPending) ? undefined : handlePdfToggle}
            className={`scale-[0.7] origin-left flex-shrink-0${
              (isFinal || isPending) ? " pointer-events-none opacity-50" : ""
            }`}
          />
          <Label
            htmlFor={`labor-pdf-${projectId}`}
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer whitespace-nowrap select-none"
          >
            r-g w PDF
          </Label>
          <Info className="h-3 w-3 text-slate-400 hover:text-blue-500 transition-colors flex-shrink-0" />
        </div>

      </div>
    </>
  );
}
