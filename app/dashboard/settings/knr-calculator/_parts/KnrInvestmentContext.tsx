"use client";

// ═══════════════════════════════════════════════════════════════════
// knr-calculator/_parts/KnrInvestmentContext.tsx
// Etaż 3: Kontekst Inwestycji — AI Prompt z dyktowaniem głosowym
// UI-only — brak zapisu do DB na tym etapie
// ═══════════════════════════════════════════════════════════════════

import { useState, useRef, useCallback, useTransition, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Lightbulb, Sparkles, RotateCcw, Save } from "lucide-react";
import { INVESTMENT_CONTEXT_KEY } from "@/components/knr/InvestmentContextPopup";
import { saveInvestmentContext } from "../actions";
import { useToast } from "@/hooks/use-toast";

// ─── Web Speech API types ──────────────────────────────────────────────────────

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionCtor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionCtor }).webkitSpeechRecognition ??
    null
  );
}

// ─── Example prompts ──────────────────────────────────────────────────────────

const EXAMPLE_HINTS = [
  "Instalacja SAP w biurowcu klasy A, 3 kondygnacje",
  "Inteligentny dom KNX, villa 400m², fotowoltaika 10kWp",
  "Remont elektryki w mieszkaniu 60m², Wrocław",
  "Hala produkcyjna, zasilanie maszyn 400V, CCTV 32 kamery",
  "Serwerownia IT, UPS, klimatyzacja precyzyjna",
];

// ─── Component ────────────────────────────────────────────────────────────────

export interface InvestmentContextState {
  text: string;
}

interface KnrInvestmentContextProps {
  value: string;
  onChange: (text: string) => void;
}

export function KnrInvestmentContext({ value, onChange }: KnrInvestmentContextProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();

  // ── Debounce: internal state updates textarea immediately;
  // parent + localStorage notified only after 800ms of inactivity.
  // Prevents API-triggering callers from firing on every keystroke.
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, 800);

  // Sync external value → internal (e.g. parent resets, example hint selected)
  const lastExternalRef = useRef(value);
  useEffect(() => {
    if (value !== lastExternalRef.current) {
      lastExternalRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  // Propagate debounced value to parent + localStorage
  useEffect(() => {
    if (debouncedValue === lastExternalRef.current) return;
    lastExternalRef.current = debouncedValue;
    onChange(debouncedValue);
    try { localStorage.setItem(INVESTMENT_CONTEXT_KEY, debouncedValue); } catch { /* ignore */ }
  }, [debouncedValue, onChange]);

  const handleChange = useCallback((text: string) => {
    setLocalValue(text);
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    startSave(async () => {
      const result = await saveInvestmentContext(localValue);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        setSaved(true);
        toast({ title: "Kontekst zapisany", description: "ES-Engine będzie używać go przy kalkulacjach" });
      }
    });
  }, [localValue, toast]);

  const hasSpeechApi = typeof window !== "undefined" && !!getSpeechRecognition();

  const startDictation = useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) {
      setMicError("Twoja przeglądarka nie obsługuje dyktowania głosowego");
      return;
    }

    setMicError(null);
    const rec = new SR();
    rec.lang = "pl-PL";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      handleChange(value ? `${value} ${transcript}` : transcript);
    };

    rec.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
    };

    rec.onerror = () => {
      setMicError("Błąd mikrofonu — sprawdź uprawnienia przeglądarki");
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [value, handleChange]);

  const stopDictation = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isRecording) stopDictation();
    else startDictation();
  }, [isRecording, startDictation, stopDictation]);

  const charCount = localValue.length;
  const charLimit = 500;
  const isNearLimit = charCount > charLimit * 0.8;


  return (
    <Card className="border-2 border-blue-100 dark:border-blue-900/40 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">Kontekst Inwestycji</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Opisz typ obiektu (np. biurowiec, dom, hala) — AI lepiej dobierze normy KNR i materiały
              </CardDescription>
            </div>
          </div>
          {localValue.trim().length > 0 && (
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] flex-shrink-0">
              Aktywny kontekst
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Example hints */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-slate-400 self-center">Przykłady:</span>
          {EXAMPLE_HINTS.map((hint) => (
            <button
              key={hint}
              type="button"
              onClick={() => handleChange(hint)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
            >
              {hint}
            </button>
          ))}
        </div>

        {/* Textarea + Mic */}
        <div className="relative">
          <Label htmlFor="knr-investment-context" className="sr-only">
            Kontekst inwestycji
          </Label>
          <Textarea
            id="knr-investment-context"
            name="knr-investment-context"
            aria-label="Kontekst inwestycji"
            value={localValue}
            onChange={(e) => handleChange(e.target.value.slice(0, charLimit))}
            placeholder="Np. remont mieszkania 60m², dom jednorodzinny z fotowoltaiką 10kWp, biurowiec klasy A z SAP — im więcej szczegółów, tym trafniejsze wyceny..."
            className={`min-h-[100px] pr-24 resize-none text-sm leading-relaxed transition-all ${
              isRecording
                ? "border-red-400 dark:border-red-600 ring-2 ring-red-200 dark:ring-red-900"
                : "border-slate-200 dark:border-slate-700"
            }`}
          />

          {/* Bottom-right control cluster */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
            {/* Char counter */}
            <span className={`text-[10px] font-mono ${isNearLimit ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}>
              {charCount}/{charLimit}
            </span>

            {/* Reset */}
            {localValue.trim().length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                onClick={() => handleChange("")}
                title="Wyczyść kontekst"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}

            {/* Mic button */}
            <Button
              type="button"
              variant={isRecording ? "destructive" : "secondary"}
              size="sm"
              className={`h-8 gap-1.5 text-xs font-medium transition-all ${
                isRecording
                  ? "animate-pulse bg-red-600 hover:bg-red-700 text-white"
                  : hasSpeechApi
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "opacity-40 cursor-not-allowed"
              }`}
              onClick={toggleMic}
              disabled={!hasSpeechApi}
              title={hasSpeechApi ? (isRecording ? "Zatrzymaj dyktowanie" : "Podyktuj opis obiektu") : "Przeglądarka nie obsługuje dyktowania"}
            >
              {isRecording ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              {isRecording ? "Zatrzymaj" : "Podyktuj"}
            </Button>
          </div>
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-xs text-red-700 dark:text-red-300 font-medium">
              Nagrywanie... Mów wyraźnie po polsku. Kliknij &quot;Zatrzymaj&quot; gdy skończysz.
            </span>
          </div>
        )}

        {/* Mic error */}
        {micError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <MicOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-300">{micError}</span>
          </div>
        )}

        {/* Save to DB button */}
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            className={`h-8 gap-1.5 text-xs font-medium transition-all ${
              saved
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            onClick={handleSave}
            disabled={isSaving || localValue.trim().length === 0}
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Zapisuję..." : saved ? "Zapisano ✓" : "Zapisz kontekst"}
          </Button>
        </div>

        {/* Hint footer */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
          <Lightbulb className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
            <span className="font-semibold">Wskazówka:</span> Kontekst pomaga AI rozróżniać np. teletechnikę od elektryki, instalacje p.poż. od standardowych, czy KNX/DALI od zwykłej automatyki. Efekt: trafniejsze normy i ceny.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper hook
export function useInvestmentContext(initial = "") {
  return useState<string>(initial);
}
