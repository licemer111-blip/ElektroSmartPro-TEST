"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  BookOpen,
  Banknote,
  Building2,
  Database,
  CreditCard,
  UserCircle,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SettingsTab = "guide" | "knr" | "profile" | "database" | "subscription" | "konto";

interface SettingsShellProps {
  children: React.ReactNode;
  activeTab: SettingsTab;
}

const TABS = [
  { id: "guide" as SettingsTab, label: "Przewodnik",   icon: BookOpen,    color: "indigo" },
  { id: "knr"   as SettingsTab, label: "Finanse",      icon: Banknote,    color: "emerald" },
  { id: "profile" as SettingsTab, label: "Profil Firmy", icon: Building2, color: "blue" },
  { id: "database" as SettingsTab, label: "Katalog & Dane", icon: Database, color: "purple" },
  { id: "subscription" as SettingsTab, label: "Subskrypcja", icon: CreditCard, color: "green" },
  { id: "konto" as SettingsTab, label: "Moje Konto",   icon: UserCircle,  color: "blue" },
];

type ColorKey = "indigo" | "emerald" | "blue" | "purple" | "green";

const COLOR_MAP: Record<ColorKey, { bg: string; text: string; border: string; icon: string }> = {
  indigo:  { bg: "bg-indigo-50 dark:bg-indigo-950/30",  text: "text-indigo-700 dark:text-indigo-300",  border: "border-indigo-500",  icon: "text-indigo-600 dark:text-indigo-400" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-500", icon: "text-emerald-600 dark:text-emerald-400" },
  blue:    { bg: "bg-blue-50 dark:bg-blue-950/30",       text: "text-blue-700 dark:text-blue-300",       border: "border-blue-500",    icon: "text-blue-600 dark:text-blue-400" },
  purple:  { bg: "bg-purple-50 dark:bg-purple-950/30",   text: "text-purple-700 dark:text-purple-300",   border: "border-purple-500",  icon: "text-purple-600 dark:text-purple-400" },
  green:   { bg: "bg-green-50 dark:bg-green-950/30",     text: "text-green-700 dark:text-green-300",     border: "border-green-500",   icon: "text-green-600 dark:text-green-400" },
};

const INACTIVE = {
  bg: "", text: "text-slate-600 dark:text-slate-400",
  border: "border-transparent", icon: "text-slate-500 dark:text-slate-500",
};

export function SettingsShell({ children, activeTab }: SettingsShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Ustawienia</h1>
          </div>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Zarządzaj profilem firmy, bazą danych i subskrypcją
          </p>
        </div>

        {/* Mobile horizontal tabs */}
        <div className="lg:hidden mb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => router.push(`/dashboard/settings?tab=${tab.id}`)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 text-xs font-medium",
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">

          {/* Left sidebar */}
          <div className="hidden lg:block space-y-2 min-w-0">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
              <CardContent className="p-3">
                <nav className="space-y-1">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const c = isActive
                      ? (COLOR_MAP[tab.color as ColorKey] ?? COLOR_MAP.blue)
                      : INACTIVE;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => router.push(`/dashboard/settings?tab=${tab.id}`)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 border-l-4",
                          c.bg, c.border,
                          !isActive && "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          isActive && "shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("w-5 h-5", c.icon)} />
                          <span className={cn("font-medium text-sm", c.text)}>{tab.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Back link */}
            <Link href="/dashboard/settings?tab=knr">
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm transition-colors group">
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Wróć do Finanse
              </div>
            </Link>
          </div>

          {/* Right content */}
          <div className="min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
