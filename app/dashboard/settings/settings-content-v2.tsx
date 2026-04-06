"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
import { StarterContentPanelSimple } from "@/components/settings/starter-content-panel-simple";
import { AIContentManager } from "@/components/settings/ai-content-manager";
import { PWAInstallButton } from "@/components/settings/pwa-install-button";
import { GuideSection } from "@/components/settings/guide-section";
import { SubscriptionPanel } from "@/components/settings/subscription-panel";
import { HiddenItemsPanel } from "@/components/settings/hidden-items-panel";
import type { CatalogItem } from "@/app/dashboard/catalog/actions";
import { PortfolioView } from "@/app/dashboard/portfolio/portfolio-view";
import { ProfileView } from "@/app/dashboard/profile/profile-view";
import type { ProfileStats } from "@/app/dashboard/profile/actions";
import type { PortfolioItem } from "@/lib/types/database";
import { 
  Settings, 
  Database, 
  Building2, 
  CreditCard, 
  ChevronRight,
  BookOpen,
  ShieldCheck,
  FileText,
  BarChart3,
  Sparkles,
  MessageCircleHeart,
  Brain,
  Banknote,
  Briefcase,
  UserCircle,
} from "lucide-react";
import type { Profile, Region } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { InlineRateRegion } from "@/components/settings/inline-rate-region";

interface CatalogStats {
  globalCount: number;
  userCount: number;
  totalCount: number;
  hiddenCount: number;
}

interface SettingsContentProps {
  initialProfile: Profile | null;
  isAdmin?: boolean;
  hiddenItems?: CatalogItem[];
  activeTab: string;
  portfolioItems?: PortfolioItem[];
  portfolioVisible?: boolean;
  portfolioLimit?: number;
  portfolioError?: string;
  profileData?: ProfileStats | null;
  initialCatalogStats?: CatalogStats;
  regions?: Region[];
}

type Tab = "guide" | "knr" | "profile" | "database" | "subscription" | "konto" | "admin";

export function SettingsContentV2({ initialProfile, isAdmin = false, hiddenItems = [], activeTab: initialTab, portfolioItems = [], portfolioVisible = true, portfolioLimit = 5, portfolioError, profileData = null, initialCatalogStats, regions = [] }: SettingsContentProps) {
  const router = useRouter();
  const activeTab = (initialTab as Tab) || "guide";
  const [profileSubTab, setProfileSubTab] = useState<"info" | "portfolio">("info");
  const catalogStats = initialCatalogStats ?? { globalCount: 0, userCount: 0, totalCount: 0, hiddenCount: 0 };

  const baseTabs = [
    {
      id: "guide" as Tab,
      label: "Przewodnik",
      icon: BookOpen,
      color: "indigo",
    },
    {
      id: "knr" as Tab,
      label: "Finanse",
      icon: Banknote,
      color: "emerald",
    },
    {
      id: "profile" as Tab,
      label: "Profil Firmy",
      icon: Building2,
      color: "blue",
    },
    {
      id: "database" as Tab,
      label: "Katalog & Dane",
      icon: Database,
      color: "purple",
    },
    {
      id: "subscription" as Tab,
      label: "Subskrypcja",
      icon: CreditCard,
      color: "green",
    },
    {
      id: "konto" as Tab,
      label: "Moje Konto",
      icon: UserCircle,
      color: "blue",
    },
  ];

  // Add admin tab if user is admin
  const tabs = isAdmin
    ? [
        ...baseTabs,
        {
          id: "admin" as Tab,
          label: "Panel Administratora",
          icon: ShieldCheck,
          color: "violet",
        },
      ]
    : baseTabs;

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: {
        bg: isActive ? "bg-blue-50 dark:bg-blue-950/30" : "",
        text: isActive ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400",
        border: isActive ? "border-blue-500" : "border-transparent",
        icon: isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500",
      },
      indigo: {
        bg: isActive ? "bg-indigo-50 dark:bg-indigo-950/30" : "",
        text: isActive ? "text-indigo-700 dark:text-indigo-300" : "text-slate-600 dark:text-slate-400",
        border: isActive ? "border-indigo-500" : "border-transparent",
        icon: isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-500",
      },
      purple: {
        bg: isActive ? "bg-purple-50 dark:bg-purple-950/30" : "",
        text: isActive ? "text-purple-700 dark:text-purple-300" : "text-slate-600 dark:text-slate-400",
        border: isActive ? "border-purple-500" : "border-transparent",
        icon: isActive ? "text-purple-600 dark:text-purple-400" : "text-slate-500 dark:text-slate-500",
      },
      green: {
        bg: isActive ? "bg-green-50 dark:bg-green-950/30" : "",
        text: isActive ? "text-green-700 dark:text-green-300" : "text-slate-600 dark:text-slate-400",
        border: isActive ? "border-green-500" : "border-transparent",
        icon: isActive ? "text-green-600 dark:text-green-400" : "text-slate-500 dark:text-slate-500",
      },
      red: {
        bg: isActive ? "bg-red-50 dark:bg-red-950/30" : "",
        text: isActive ? "text-red-700 dark:text-red-300" : "text-slate-600 dark:text-slate-400",
        border: isActive ? "border-red-500" : "border-transparent",
        icon: isActive ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-500",
      },
      violet: {
        bg: isActive ? "bg-violet-50 dark:bg-violet-950/30" : "",
        text: isActive ? "text-violet-700 dark:text-violet-300" : "text-slate-600 dark:text-slate-400",
        border: isActive ? "border-violet-500" : "border-transparent",
        icon: isActive ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-500",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

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

        {/* Vertical Tabs Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 sm:gap-6">
          {/* Mobile Horizontal Tabs */}
          <div className="lg:hidden relative min-w-0">
            <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide scroll-smooth snap-x snap-mandatory">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => router.push(`/dashboard/settings?tab=${tab.id}`)}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 text-xs font-medium snap-start",
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 active:scale-95"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Left Sidebar - Vertical Navigation */}
          <div className="hidden lg:block space-y-2 min-w-0">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
              <CardContent className="p-3">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const colorClasses = getColorClasses(tab.color, isActive);

                    return (
                      <button
                        key={tab.id}
                        onClick={() => router.push(`/dashboard/settings?tab=${tab.id}`)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
                          "border-l-4",
                          colorClasses.bg,
                          colorClasses.border,
                          isActive
                            ? "shadow-sm"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={cn("w-5 h-5", colorClasses.icon)} />
                          <span className={cn("font-medium text-sm", colorClasses.text)}>
                            {tab.label}
                          </span>
                        </div>
                        {isActive && (
                          <ChevronRight className={cn("w-4 h-4", colorClasses.icon)} />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
              <CardContent className="p-4">
                <div className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    💡 Wskazówka
                  </p>
                  {activeTab === "guide" && (
                    <p>Przegląd funkcji systemu: wyceny AI, katalog 8500+ norm KNR, konfigurator rozdzielnic, zestawy, kalkulatory. Możesz też zainstalować aplikację na telefon (PWA).</p>
                  )}
                  {activeTab === "profile" && (
                    <p>Dane firmy pojawią się na wszystkich dokumentach PDF.</p>
                  )}
                  {activeTab === "knr" && (
                    <p>Ustaw stawkę roboczogodziny i województwo — to podstawa wszystkich wycen kosztorysowych.</p>
                  )}
                  {activeTab === "database" && (
                    <p>
                      Zarządzaj danymi katalogu: przełączaj między bazą globalną (8500+ norm) a własnymi pozycjami.
                      {catalogStats.hiddenCount > 0 && ` • ${catalogStats.hiddenCount} ukrytych poz.`} Ukryte pozycje nie pojawiają się w wynikach.
                    </p>
                  )}
                  {activeTab === "subscription" && (
                    <p>Zarządzaj subskrypcją i płatnościami PRO.</p>
                  )}
                  {activeTab === "konto" && (
                    <p>Statystyki konta, aktywność i informacje o użytkowniku.</p>
                  )}
                  {activeTab === "admin" && (
                    <p>Panel administracyjny: Market, Analytics i zarządzanie finansami.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="space-y-4 sm:space-y-6 min-w-0">
            {/* Guide Tab */}
            {activeTab === "guide" && (
              <div className="space-y-4 sm:space-y-6">
                <GuideSection catalogCount={catalogStats.globalCount} />
                
                {/* PWA Installation */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-1.5 sm:p-2">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Zainstaluj Aplikację</CardTitle>
                        <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                          Pracuj offline, otrzymuj powiadomienia i korzystaj z aplikacji jak z natywnej
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                    <PWAInstallButton />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Finanse Tab — inline rate + region */}
            {activeTab === "knr" && (
              <InlineRateRegion
                initialRate={initialProfile?.hourly_rate ?? 0}
                initialRegionId={initialProfile?.default_region_id ?? null}
                regions={regions}
              />
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-4 sm:space-y-6">
                {/* Sub-tab switcher */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit">
                  <button
                    onClick={() => setProfileSubTab("info")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      profileSubTab === "info"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    Informacje o firmie
                  </button>
                  <button
                    onClick={() => setProfileSubTab("portfolio")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      profileSubTab === "portfolio"
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    Portfolio
                    {portfolioItems.length > 0 && (
                      <span className="ml-1 text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-1.5 py-0.5 font-semibold">
                        {portfolioItems.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Informacje o firmie sub-tab */}
                {profileSubTab === "info" && (
                  <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                    <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 sm:px-6 py-4 sm:py-6">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-1.5 sm:p-2">
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg sm:text-xl">Dane Firmy</CardTitle>
                          <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                            Informacje wyświetlane na dokumentach PDF i ofertach
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                      <SettingsForm initialProfile={initialProfile} />
                    </CardContent>
                  </Card>
                )}

                {/* Portfolio sub-tab */}
                {profileSubTab === "portfolio" && (
                  <PortfolioView
                    items={portfolioItems}
                    isPro={initialProfile?.is_pro || false}
                    portfolioVisible={portfolioVisible}
                    portfolioLimit={portfolioLimit}
                    error={portfolioError}
                  />
                )}
              </div>
            )}

            {/* Database Tab */}
            {activeTab === "database" && (
              <div className="space-y-4 sm:space-y-6">
                {/* Database Tools */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="bg-purple-100 dark:bg-purple-900/50 rounded-lg p-1.5 sm:p-2">
                        <Database className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Narzędzia Katalogowe</CardTitle>
                        <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                          Dodatkowe opcje generowania i zarządzania katalogiem
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                    <StarterContentPanelSimple isPro={initialProfile?.is_pro || false} catalogStats={catalogStats} />
                  </CardContent>
                </Card>

                {/* AI Content Manager */}
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                  <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900/50 rounded-lg p-1.5 sm:p-2">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Zarządzanie Treścią ES-Engine</CardTitle>
                        <CardDescription className="mt-0.5 sm:mt-1 text-xs sm:text-sm">
                          Usuń pozycje i zestawy wygenerowane przez ES-Engine
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                    <AIContentManager />
                  </CardContent>
                </Card>

                {/* Hidden Items Panel */}
                <HiddenItemsPanel hiddenItems={hiddenItems} />
              </div>
            )}

            {/* Subscription Tab */}
            {activeTab === "subscription" && (
              <SubscriptionPanel profile={initialProfile} />
            )}

            {/* Konto Tab */}
            {activeTab === "konto" && (
              profileData ? (
                <ProfileView data={profileData} />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-slate-500">Nie można załadować danych konta. Odśwież stronę.</p>
                </div>
              )
            )}

            {/* Admin Panel Tab — redirect to dedicated /admin section */}
            {activeTab === "admin" && isAdmin && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="max-w-md w-full text-center space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/40 dark:to-orange-900/40 shadow-lg">
                      <ShieldCheck className="w-12 h-12 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Panel Administratora</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      Pełna administracja systemu jest dostępna w dedykowanym panelu z własną nawigacją — zarządzanie użytkownikami, cenami, analizą i bazą wiedzy ES-Engine.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-left">
                    {[
                      { icon: BarChart3, label: "Dashboard KPI", color: "text-blue-600 dark:text-blue-400" },
                      { icon: Settings, label: "Użytkownicy", color: "text-slate-600 dark:text-slate-400" },
                      { icon: BarChart3, label: "Analityka cen", color: "text-purple-600 dark:text-purple-400" },
                      { icon: ChevronRight, label: "Market / Ceny", color: "text-red-600 dark:text-red-400" },
                      { icon: MessageCircleHeart, label: "Opinie & Ankiety", color: "text-blue-600 dark:text-blue-400" },
                      { icon: Brain, label: "Baza Wiedzy ES Engine", color: "text-violet-600 dark:text-violet-400" },
                    ].map(({ icon: Icon, label, color }) => (
                      <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${color}`} />
                        <span className="text-slate-600 dark:text-slate-400">{label}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/admin/dashboard">
                    <button className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 group">
                      <ShieldCheck className="w-4 h-4" />
                      Otwórz Panel Administratora
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
