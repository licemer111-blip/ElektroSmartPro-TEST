"use client";

import { useState, useRef, useTransition } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Wrench, Zap, X, Mic, MicOff } from "lucide-react";
import { repriceSingleItem } from "@/app/dashboard/projects/[id]/ai-actions";
import type { AiPriceEstimate } from "@/app/dashboard/projects/[id]/ai-actions";

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

// ── Common electrical units ───────────────────────────────────────
const UNIT_OPTIONS = [
  { value: "szt", label: "szt — sztuka" },
  { value: "kpl", label: "kpl — komplet" },
  { value: "mb",  label: "mb — metr bieżący" },
  { value: "m",   label: "m — metr" },
  { value: "m2",  label: "m² — metr kwadratowy" },
  { value: "rbh", label: "rbh — roboczogodzina" },
];

interface AiPriceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimate: AiPriceEstimate;
  projectId: string;
  onRepriced: (updated: AiPriceEstimate) => void;
}

export function AiPriceDetailModal({
  open,
  onOpenChange,
  estimate,
  projectId,
  onRepriced,
}: AiPriceDetailModalProps) {
  const [overrideUnit, setOverrideUnit] = useState<string>(estimate.unit ?? "szt");
  const [extraContext, setExtraContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleVoiceToggle = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (typeof window !== "undefined")
      ? ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition)
      : null;
    if (!SR) {
      setError("Twoja przeglądarka nie obsługuje rozpoznawania mowy.");
      return;
    }
    const recognition = new (SR as new () => SpeechRecognitionInstance)();
    recognition.lang = "pl-PL";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setExtraContext((prev) => (prev ? prev + " " + transcript : transcript).slice(0, 200));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleApply = () => {
    setError(null);
    startTransition(async () => {
      const result = await repriceSingleItem({
        itemId: estimate.itemId,
        projectId,
        overrideUnit: overrideUnit !== estimate.unit ? overrideUnit : undefined,
        extraContext: extraContext.trim() || undefined,
      });

      if (result.success && result.estimate) {
        onRepriced(result.estimate);
        onOpenChange(false);
      } else {
        setError(result.error ?? "Nieznany błąd");
      }
    });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-[50%] top-[50%] z-[101] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Zap className="w-4 h-4 text-orange-500" />
              Uściślenie wyceny
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Popraw dane i przelicz cenę dla tej pozycji</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item name */}
        <div className="rounded-md bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          {estimate.name}
          <span className="ml-2 text-xs text-slate-400 font-normal">
            × {estimate.quantity} {estimate.unit}
          </span>
        </div>

        {/* ── Unit correction ── */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-emerald-500" />
            Korekta jednostki
            {overrideUnit !== estimate.unit && (
              <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-400 ml-1 py-0">
                zmieniono
              </Badge>
            )}
          </label>
          <select
            value={overrideUnit}
            onChange={(e) => setOverrideUnit(e.target.value)}
            className="w-full h-8 rounded-md border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {!UNIT_OPTIONS.some((u) => u.value === estimate.unit) && (
              <option value={estimate.unit ?? "szt"}>
                {estimate.unit} — (aktualna z DB)
              </option>
            )}
            {UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── Extra context ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Dodatkowy kontekst dla AI
            </label>
            <button
              type="button"
              onClick={handleVoiceToggle}
              title={isListening ? "Zatrzymaj nagrywanie" : "Mów po polsku — naciśnij i mów"}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                isListening
                  ? "bg-red-500 border-red-500 text-white animate-pulse"
                  : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-orange-400 hover:text-orange-600"
              }`}
            >
              {isListening
                ? <><MicOff className="w-3 h-3" /> Słucham...</>
                : <><Mic className="w-3 h-3" /> Głos</>}
            </button>
          </div>
          <Textarea
            id="ai-price-context"
            name="ai-price-context"
            aria-label="Dodatkowy kontekst dla wyceny"
            value={extraContext}
            onChange={(e) => setExtraContext(e.target.value)}
            placeholder='np. "kabel zewnętrzny w ziemi", "montaż na wysokości 4m", "standard podtynkowy"'
            className="text-xs min-h-[72px] resize-none"
            maxLength={200}
          />
          <p className="text-[10px] text-slate-400 text-right">{extraContext.length}/200</p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Anuluj
          </Button>
          <Button
            size="sm"
            className="flex-1 text-white bg-orange-600 hover:bg-orange-700"
            onClick={handleApply}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Przeliczam...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Zastosuj i przelicz
              </>
            )}
          </Button>
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
