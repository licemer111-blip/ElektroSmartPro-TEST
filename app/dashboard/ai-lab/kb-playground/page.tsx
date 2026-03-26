"use client";

import { useState, useTransition } from "react";
import { testKnowledgeBase } from "@/app/actions/kb-test";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Loader2,
  Send,
  Sparkles,
  Database,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface HistoryEntry {
  question: string;
  answer: string;
  cachedTokensUsed: boolean;
  modelUsed: string;
  timestamp: Date;
  error?: string;
}

const EXAMPLE_QUESTIONS = [
  "Jaka jest stawka robocizny za montaż gniazda 230V wg KNR?",
  "Ile kosztuje ułożenie 1mb przewodu YDYp 3x2,5 w bruździe?",
  "Jakie są nakłady rzeczowe na montaż rozdzielnicy 24-modułowej?",
  "Podaj ceny materiałów dla instalacji LAN kat.6 na 100m2 biura",
  "Jaki przekrój przewodu dla obwodu 16A gniazd 230V?",
];

export default function KbPlaygroundPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleAsk = () => {
    const q = question.trim();
    if (!q || isPending) return;

    startTransition(async () => {
      const result = await testKnowledgeBase(q);
      setHistory((prev) => [
        {
          question: q,
          answer: result.success ? (result.answer?.answer ?? "") : "",
          cachedTokensUsed: result.success ? (result.answer?.cachedTokensUsed ?? false) : false,
          modelUsed: result.success ? (result.answer?.modelUsed ?? "") : "",
          timestamp: new Date(),
          error: result.success ? undefined : (result.error ?? "Nieznany błąd"),
        },
        ...prev,
      ]);
      setQuestion("");
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            KB Playground
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Testuj bazę wiedzy Gemini 1.5 Pro — KNR, normy, cenniki
          </p>
        </div>
        <Badge className="ml-auto bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-[10px]">
          INTERNAL ONLY
        </Badge>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-200 dark:border-violet-800">
        <Database className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
        <div className="text-[11px] text-violet-800 dark:text-violet-300 leading-relaxed">
          Zapytania trafiają do <strong>Gemini 1.5 Pro</strong> z aktywnym kontekstem (Context Caching).
          Jeśli baza wiedzy jest pusta — odpowiada z własnej wiedzy bez KNR.
          Sprawdź konsolę serwera aby zobaczyć czy użyto cache.
        </div>
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input
            id="kb-question"
            name="kb-question"
            aria-label="Pytanie do bazy wiedzy KNR"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Zadaj pytanie ekspertowi (np. stawka montażu gniazda wg KNR)..."
            disabled={isPending}
            className="flex-1 text-sm"
          />
          <Button
            onClick={handleAsk}
            disabled={isPending || !question.trim()}
            className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white px-5"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Myślę...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Zapytaj</span>
              </>
            )}
          </Button>
        </div>

        {/* Example questions */}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              disabled={isPending}
              className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-300 transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
          <Loader2 className="w-5 h-5 text-violet-500 animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
              Gemini analizuje bazę wiedzy...
            </p>
            <p className="text-[10px] text-violet-500 mt-0.5">
              Duże pliki PDF mogą wymagać kilku sekund
            </p>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Historia zapytań ({history.length})</span>
            <button
              onClick={() => setHistory([])}
              className="ml-auto text-[10px] text-slate-400 hover:text-red-500 transition-colors"
            >
              Wyczyść
            </button>
          </div>

          <div className="space-y-4">
            {history.map((entry, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Question */}
                <div className="flex items-start gap-2 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[9px] text-white font-bold">Q</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">
                    {entry.question}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {entry.cachedTokensUsed ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] gap-1">
                        <Database className="w-2.5 h-2.5" />
                        Cache hit
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px]">
                        No cache
                      </Badge>
                    )}
                    <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {entry.timestamp.toLocaleTimeString("pl-PL")}
                    </span>
                  </div>
                </div>

                {/* Answer */}
                <div className="px-4 py-3">
                  {entry.error ? (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {entry.error}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <ScrollArea className="max-h-64 flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {entry.answer}
                        </p>
                      </ScrollArea>
                    </div>
                  )}
                  {entry.modelUsed && (
                    <p className="text-[9px] text-slate-400 mt-2 text-right">
                      {entry.modelUsed}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && !isPending && (
        <div className="text-center py-12 text-slate-400">
          <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Zadaj pierwsze pytanie ekspertowi</p>
          <p className="text-[11px] mt-1">
            Kliknij jeden z przykładów powyżej lub wpisz własne pytanie
          </p>
        </div>
      )}
    </div>
  );
}
