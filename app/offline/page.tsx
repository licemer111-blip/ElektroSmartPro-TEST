"use client";

import { WifiOff, RefreshCw, Zap, FolderOpen, BookOpen, Calculator, Users } from "lucide-react";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const OFFLINE_ROUTES = [
  { href: "/dashboard/projects", icon: FolderOpen, label: "Projekty", desc: "Przeglądaj zapisane kosztorysy" },
  { href: "/dashboard/catalog", icon: BookOpen, label: "Katalog KNR", desc: `${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR dostępnych offline` },
  { href: "/dashboard/tools", icon: Calculator, label: "Kalkulatory", desc: "12 kalkulatorów inżynierskich" },
  { href: "/dashboard/clients", icon: Users, label: "Klienci", desc: "Baza klientów i historia" },
];

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 mb-5 shadow-lg shadow-blue-500/25">
            <WifiOff className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Tryb offline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Brak połączenia z internetem
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            ElektroSmart PRO działa offline. Poniższe sekcje są dostępne z pamięci podręcznej.
            Wszystko zsynchronizuje się automatycznie po powrocie do sieci.
          </p>
        </div>

        {/* Cached routes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Dostępne offline</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {OFFLINE_ROUTES.map(({ href, icon: Icon, label, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{desc}</div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" title="Dostępne offline" />
              </Link>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Sprawdź połączenie
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="h-11 px-4 rounded-xl gap-2 border-slate-200 dark:border-slate-700">
              <Zap className="w-4 h-4 text-blue-600" />
              Dashboard
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
          Powered by ElektroSmart PRO — ES-Engine
        </p>
      </div>
    </div>
  );
}
