"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Mic,
  MicOff,
  RotateCcw,
  Lightbulb,
  Check,
} from "lucide-react";

// ─── Web Speech API types ─────────────────────────────────────────────────────

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

// ─── Shared localStorage key ──────────────────────────────────────────────────

export const INVESTMENT_CONTEXT_KEY = "es-investment-context";

const EXAMPLE_HINTS = [
  "Instalacja SAP w biurowcu klasy A, 3 kondygnacje",
  "Inteligentny dom KNX, villa 400m², fotowoltaika 10kWp",
  "Remont elektryki w mieszkaniu 60m², Wrocław",
  "Hala produkcyjna, zasilanie maszyn 400V, CCTV 32 kamery",
  "Serwerownia IT, UPS, klimatyzacja precyzyjna",
];

const CHAR_LIMIT = 500;

// ─── Main component ───────────────────────────────────────────────────────────

interface InvestmentContextPopupProps {
  /** When provided the built-in button is hidden and open state is controlled externally */
  externalOpen?: boolean;
  onExternalOpenChange?: (v: boolean) => void;
}

export function InvestmentContextPopup({ externalOpen, onExternalOpenChange }: InvestmentContextPopupProps = {}) {
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (isControlled) onExternalOpenChange?.(v);
    else setInternalOpen(v);
  };
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const hasSpeechApi = typeof window !== "undefined" && !!getSpeechRecognition();
  const charCount = value.length;
  const isNearLimit = charCount > CHAR_LIMIT * 0.8;
  const hasContext = value.trim().length > 0;

  // Load from localStorage on open
  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(INVESTMENT_CONTEXT_KEY) ?? "";
      setValue(stored);
      setSaved(false);
    }
  }, [open]);

  const handleSave = useCallback(() => {
    localStorage.setItem(INVESTMENT_CONTEXT_KEY, value.trim());
    setSaved(true);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
    }, 800);
  }, [value]);

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
      setValue((prev) => (prev ? `${prev} ${transcript}` : transcript).slice(0, CHAR_LIMIT));
    };
    rec.onend = () => { setIsRecording(false); recognitionRef.current = null; };
    rec.onerror = () => {
      setMicError("Błąd mikrofonu — sprawdź uprawnienia przeglądarki");
      setIsRecording(false);
      recognitionRef.current = null;
    };
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, []);

  const stopDictation = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isRecording) stopDictation();
    else startDictation();
  }, [isRecording, startDictation, stopDictation]);

  // Read current saved value for badge indicator (outside dialog)
  const [storedPreview, setStoredPreview] = useState("");
  useEffect(() => {
    const refresh = () => setStoredPreview(localStorage.getItem(INVESTMENT_CONTEXT_KEY) ?? "");
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return (
    <>
      {/* ── Trigger button — hidden when controlled externally ── */}
      {!isControlled && (
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 rounded-md"
          title="Kontekst Inwestycji — AI weźmie pod uwagę przy dopasowywaniu KNR"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Kontekst
          {storedPreview.trim() && (
            <Badge className="ml-0.5 h-4 px-1 text-[9px] bg-white/20 text-white border-0">
              Aktywny
            </Badge>
          )}
        </Button>
      )}

      {/* ── Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              Kontekst Inwestycji
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              AI Prompt — opisz obiekt. ES-Engine weźmie to pod uwagę przy dopasowywaniu norm KNR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            {/* Example hints */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-slate-400 self-center">Przykłady:</span>
              {EXAMPLE_HINTS.map((hint) => (
                <button
                  key={hint}
                  type="button"
                  onClick={() => setValue(hint)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                >
                  {hint}
                </button>
              ))}
            </div>

            {/* Textarea + controls */}
            <div className="relative">
              <Textarea
                id="investment-context-popup"
                name="investment-context-popup"
                aria-label="Kontekst inwestycji"
                value={value}
                onChange={(e) => { setValue(e.target.value.slice(0, CHAR_LIMIT)); setSaved(false); }}
                placeholder="Opisz krótko obiekt (np. instalacja SAP, inteligentny dom KNX, biurowiec). System weźmie to pod uwagę przy dopasowywaniu norm KNR..."
                className={`min-h-[110px] pr-24 resize-none text-sm leading-relaxed transition-all ${
                  isRecording
                    ? "border-red-400 dark:border-red-600 ring-2 ring-red-200 dark:ring-red-900"
                    : "border-slate-200 dark:border-slate-700"
                }`}
                autoFocus
              />
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <span className={`text-[10px] font-mono ${isNearLimit ? "text-amber-500" : "text-slate-300 dark:text-slate-600"}`}>
                  {charCount}/{CHAR_LIMIT}
                </span>
                {hasContext && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-slate-600"
                    onClick={() => { setValue(""); setSaved(false); }}
                    title="Wyczyść"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                )}
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
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {isRecording ? "Zatrzymaj" : "Podyktuj"}
                </Button>
              </div>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <span className="text-xs text-red-700 dark:text-red-300 font-medium">
                  Nagrywanie... Mów wyraźnie po polsku.
                </span>
              </div>
            )}

            {/* Mic error */}
            {micError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <MicOff className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-700 dark:text-amber-300">{micError}</span>
              </div>
            )}

            {/* Hint */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <Lightbulb className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                <span className="font-semibold">Wskazówka:</span> Kontekst drastycznie zwiększa skuteczność rozpoznawania specyficznych materiałów (teletechnika, KNX/DALI, p.poż.).
              </p>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              className={`w-full transition-all ${saved ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {saved ? (
                <><Check className="w-4 h-4 mr-2" />Zapisano!</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />Zapisz kontekst</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
