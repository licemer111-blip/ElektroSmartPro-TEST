"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Crown, Users, Rocket, Shield, Lock, FileText,
} from "lucide-react";
import { FREE_TIER_MAX_PROJECTS, PAY_PER_EXPORT_ENABLED } from "@/lib/config/tier-limits";
import { TRIAL_DURATION_DAYS } from "@/lib/auth/entitlements";
import { DEMO_AI_LIMIT, PRO_AI_LIMIT } from "@/lib/ai-quota-config";

export function SettingsClient() {
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
                <div className="flex justify-between"><span>AI requests/mies.:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{DEMO_AI_LIMIT}</span></div>
                <div className="flex justify-between"><span>Sumy widoczne:</span><span className="font-bold text-green-600">TAK</span></div>
                <div className="flex justify-between"><span>PDF watermark:</span><span className="font-bold text-orange-500">DEMO</span></div>
                <div className="flex justify-between"><span>Czysty PDF:</span><span className="font-bold text-red-500">NIE</span></div>
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
                <div className="flex justify-between"><span>AI requests/mies.:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{PRO_AI_LIMIT}</span></div>
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
                <div className="flex justify-between"><span>AI requests/mies.:</span><span className="font-mono font-bold text-slate-700 dark:text-slate-300">{PRO_AI_LIMIT}</span></div>
                <div className="flex justify-between"><span>Sumy widoczne:</span><span className="font-bold text-green-600">TAK</span></div>
                <div className="flex justify-between"><span>PDF watermark:</span><span className="font-bold text-green-600">BRAK</span></div>
                <div className="flex justify-between"><span>Czysty PDF:</span><span className="font-bold text-green-600">TAK</span></div>
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
              <li>FREE widzi sumy. PDF ma znak wodny DEMO.</li>
              <li>Drugi własny projekt jest zablokowany. Projekt DEMO i archiwum się nie liczą.</li>
              <li>Trial = one-shot per email (nie per account re-creation)</li>
              <li>Pojedynczy czysty PDF za 29 zł: {PAY_PER_EXPORT_ENABLED ? "włączony" : "wyłączony w kasie"}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Robocizna</CardTitle>
          <CardDescription className="text-xs">
            Złotówki = rbh z normy ES × stawka elektryka × województwo. Osobnego współczynnika KNR nie ma.
          </CardDescription>
        </CardHeader>
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
              <p className="font-bold text-slate-700 dark:text-slate-300">{PAY_PER_EXPORT_ENABLED ? "29 PLN" : "wył."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
