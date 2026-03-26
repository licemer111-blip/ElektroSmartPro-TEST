"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Save, Info } from "lucide-react";

interface KbSettingsPanelProps {
  directives: string;
  isSavingDirectives: boolean;
  onDirectivesChange: (v: string) => void;
  onSaveDirectives: () => void;
}

export function KbSettingsPanel({
  directives,
  isSavingDirectives,
  onDirectivesChange,
  onSaveDirectives,
}: KbSettingsPanelProps) {
  return (
    <>
      {/* Expert Directives */}
      <Card className="border-violet-200 dark:border-violet-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-violet-600" />
            Expert Directives
          </CardTitle>
          <CardDescription>Globalne instrukcje systemowe wstrzykiwane do każdego promptu AI (po żelaznych zasadach)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-[11px] text-slate-500">
            Użyj <code className="bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-1 rounded text-[10px]">{"{rbh_rate}"}</code> — zostanie zastąpiony stawką R-G użytkownika przy każdym zapytaniu AI.
          </p>
          <Textarea
            id="kb-expert-directives"
            name="kb-expert-directives"
            aria-label="Expert Directives"
            value={directives}
            onChange={(e) => onDirectivesChange(e.target.value)}
            className="font-mono text-xs h-28 resize-none"
            placeholder={`Przykład:\nZawsze priorytetyzuj normy KNR 5-04 dla mieszkań.\nStawka rbh domyślna: {rbh_rate} PLN/h.`}
            spellCheck={false}
            maxLength={5000}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-mono">{directives.length}/5000 znaków</span>
            <Button size="sm" onClick={onSaveDirectives} disabled={isSavingDirectives}
              className="h-7 text-xs gap-1.5 bg-violet-600 hover:bg-violet-700 text-white">
              {isSavingDirectives ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Zapisz dyrektywy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Architecture Info */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <p className="font-semibold">Architektura RAG — Pipe / Water / Filter</p>
              <p>
                <strong>TypeScript</strong> = Pipe (logika) ·{" "}
                <strong>JSON w tym buckecie</strong> = Water (wiedza ekspercka) ·{" "}
                <strong>Gemini 2.0 Flash</strong> = Filter (interpretacja)
              </p>
              <p className="text-blue-700 dark:text-blue-400">
                Pliki JSON są dynamicznie pobierane przed każdym zapytaniem do Kreatora Rozdzielnic
                i wstrzykiwane jako kontekst do Gemini.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
