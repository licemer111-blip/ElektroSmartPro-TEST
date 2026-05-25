"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateGlobalBenchmarks } from "../actions";
import {
  Settings, Calculator, CheckCircle, AlertCircle, Loader2,
  Crown, Users, Rocket, Brain, Shield, DollarSign, Lock, FileText,
} from "lucide-react";
import { FREE_TIER_MAX_PROJECTS, PRO_TIER_MAX_PROJECTS } from "@/lib/config/tier-limits";
import { TRIAL_DURATION_DAYS } from "@/lib/auth/entitlements";

const KNR_MULTIPLIER_CHANNEL = "knr-multiplier-updates";

interface Props {
  initialKnrMultiplier: number;
}

export function SettingsClient({ initialKnrMultiplier }: Props) {
  const [knrMultiplier, setKnrMultiplier] = useState(initialKnrMultiplier);
  const [isPending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSave = () => {
    setSaveState("idle");
    startTransition(async () => {
      const result = await updateGlobalBenchmarks({ knr_2026_multiplier: knrMultiplier });
      if (result.success) {
        setSaveState("success");
        setTimeout(() => setSaveState("idle"), 3000);
        const channel = new BroadcastChannel(KNR_MULTIPLIER_CHANNEL);
        channel.postMessage({ type: "multiplier-updated" });
        channel.close();
      } else {
        setErrorMessage(result.error ?? "Błąd zapisu");
        setSaveState("error");
      }
    });
  };

  const handleInputChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 1.0) {
      setKnrMultiplier(numValue);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ustawienia Systemu</h1>
      </div>

      {/* ── Business Model Config ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-blue-500" />
            Model Biznesowy (Tier Limits)
          </CardTitle>
          <CardDescription className="text-xs">
            Aktualna konfiguracja — zmiany wymagają edycji kodu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* FREE tier */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">FREE</span>
                <Badge variant="outline" className="text-[9px] ml-auto">0 PLN</Badge>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500">
                <div className="flex justify-between"><span>Max projektów:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{FREE_TIER_MAX_PROJECTS}</span></div>
                <div className="flex justify-between"><span>AI requests/mies.:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">5</span></div>
                <div className="flex justify-between"><span>Sumy widoczne:</span><span className="font-bold text-red-500">NIE</span></div>
                <div className="flex justify-between"><span>PDF watermark:</span><span className="font-bold text-orange-500">DEMO</span></div>
                <div className="flex justify-between"><span>Portal Klienta:</span><span className="font-bold text-red-500">NIE</span></div>
              </div>
            </div>

            {/* TRIAL tier */}
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">TRIAL</span>
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 text-[9px] ml-auto">{TRIAL_DURATION_DAYS} dni</Badge>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500">
                <div className="flex justify-between"><span>Max projektów:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">∞</span></div>
                <div className="flex justify-between"><span>AI requests/mies.:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">500</span></div>
                <div className="flex justify-between"><span>Sumy widoczne:</span><span className="font-bold text-green-600">TAK</span></div>
                <div className="flex justify-between"><span>PDF watermark:</span><span className="font-bold text-green-600">BRAK</span></div>
                <div className="flex justify-between"><span>One-shot:</span><span className="font-bold text-orange-500">1× / email</span></div>
              </div>
            </div>

            {/* PRO tier */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">PRO</span>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 text-[9px] ml-auto">159 PLN/mies.</Badge>
              </div>
              <div className="space-y-1 text-[11px] text-slate-500">
                <div className="flex justify-between"><span>Max projektów:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">∞</span></div>
                <div className="flex justify-between"><span>AI requests/mies.:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">500</span></div>
                <div className="flex justify-between"><span>Sumy widoczne:</span><span className="font-bold text-green-600">TAK</span></div>
                <div className="flex justify-between"><span>PDF watermark:</span><span className="font-bold text-green-600">BRAK</span></div>
                <div className="flex justify-between"><span>Portal Klienta:</span><span className="font-bold text-green-600">TAK</span></div>
              </div>
            </div>
          </div>

          {/* Anti-abuse Info */}
          <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              Anti-abuse mechanizmy
            </p>
            <ul className="text-[11px] text-slate-500 space-y-0.5 ml-5 list-disc">
              <li>Sumy (NETTO, BRUTTO, VAT) → <strong>BLURRED</strong> dla FREE tier</li>
              <li>PDF z watermarkiem DEMO → nie da się wysłać klientowi</li>
              <li>Trial = one-shot per email (nie per account re-creation)</li>
              <li>Pay-per-Export: 29 PLN za czysty PDF jednego projektu</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ── KNR Multiplier ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="w-4 h-4 text-emerald-600" />
            Współczynnik KNR 2026
          </CardTitle>
          <CardDescription className="text-xs">
            Globalny mnożnik norm robocizny KNR · wpływa na WSZYSTKIE nowe wyceny
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              id="knr-multiplier"
              type="number"
              step="0.1"
              min="1.0"
              max="3.0"
              value={knrMultiplier}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isPending}
              className="w-28"
            />
            <div className="text-xs text-slate-500 space-y-0.5">
              <p>Obecna wartość: <strong className="text-emerald-600">{knrMultiplier}×</strong> ({Math.round((knrMultiplier - 1) * 100)}% powyżej bazy KNR)</p>
              <p className="text-slate-400">Rekomendacja: 1.4–1.6 dla rynku polskiego 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={isPending} size="sm">
              {isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Zapisywanie...</> : "Zapisz"}
            </Button>
            {saveState === "success" && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs"><CheckCircle className="w-3.5 h-3.5" />Zapisano</span>
            )}
            {saveState === "error" && (
              <span className="flex items-center gap-1 text-red-600 text-xs"><AlertCircle className="w-3.5 h-3.5" />{errorMessage}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── System Info ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-slate-500" />
            Informacje systemowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
              <p className="text-slate-400 mb-0.5">Wersja</p>
              <p className="font-bold text-slate-700 dark:text-slate-300">1.0.0</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
              <p className="text-slate-400 mb-0.5">Framework</p>
              <p className="font-bold text-slate-700 dark:text-slate-300">Next.js 16</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
              <p className="text-slate-400 mb-0.5">L0 Entries</p>
              <p className="font-bold text-slate-700 dark:text-slate-300">169</p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-center">
              <p className="text-slate-400 mb-0.5">Pay-per-Export</p>
              <p className="font-bold text-slate-700 dark:text-slate-300">29 PLN</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
