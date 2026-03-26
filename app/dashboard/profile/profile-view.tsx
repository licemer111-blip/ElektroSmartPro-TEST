"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Crown,
  Settings,
  FolderOpen,
  FileText,
  Bot,
  Users,
  Boxes,
  BookOpen,
  MapPin,
  Building2,
  Phone,
  Mail,
  Clock,
  Shield,
  CalendarDays,
  Send,
  UserCircle,
  BarChart3,
  ChevronRight,
  ExternalLink,
  Plus,
  Zap,
  Wrench,
  TrendingUp,
  LayoutGrid,
  Calculator,
  Copy,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProfileStats } from "./actions";

interface ProfileViewProps {
  data: ProfileStats;
}

export function ProfileView({ data }: ProfileViewProps) {
  const { profile, stats } = data;

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : profile.email.charAt(0).toUpperCase();

  const memberSince = new Date(profile.createdAt).toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "long",
  });

  const subscriptionEnd = profile.currentPeriodEnd
    ? new Date(profile.currentPeriodEnd).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-3xl mx-auto px-2 py-2 space-y-5">
      {/* ───── PROFILE CARD ───── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-5 p-5">
          {profile.logoUrl ? (
            <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shadow-sm">
              <Image src={profile.logoUrl} alt="Logo" width={64} height={64} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold shadow-sm">
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {profile.fullName || profile.email.split("@")[0]}
              </h1>
              {profile.isPro ? (
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-1.5 py-0 h-5 shrink-0">
                  <Crown className="w-3 h-3 mr-0.5" />PRO
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                  <Shield className="w-3 h-3 mr-0.5" />Demo
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{profile.email}</p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {profile.companyName && <MetaPill icon={<Building2 className="w-3 h-3" />} text={profile.companyName} />}
              <MetaPill icon={<CalendarDays className="w-3 h-3" />} text={`Od ${memberSince}`} />
              {profile.regionName && <MetaPill icon={<MapPin className="w-3 h-3" />} text={profile.regionName} />}
              {profile.phone && <MetaPill icon={<Phone className="w-3 h-3" />} text={profile.phone} />}
              {profile.hourlyRate && <MetaPill icon={<Clock className="w-3 h-3" />} text={`${profile.hourlyRate} zł/h`} />}
            </div>
          </div>
        </div>
        {/* Subscription strip */}
        {profile.isPro && subscriptionEnd && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-[11px] text-slate-500">
              PRO {profile.cancelAtPeriodEnd ? "wygasa" : "odnowi się"}: <span className="font-medium text-slate-700 dark:text-slate-300">{subscriptionEnd}</span>
            </span>
            <Link href="/dashboard/settings?tab=subscription" className="text-[11px] text-blue-600 hover:text-blue-700 font-medium">Zarządzaj</Link>
          </div>
        )}
        {!profile.isPro && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/10">
            <span className="text-[11px] text-amber-700 dark:text-amber-300">Odblokuj pełny dostęp do cen i PDF</span>
            <Link href="/dashboard/settings?tab=subscription" className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
              <Crown className="w-3 h-3" />Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* ───── QUICK ACTIONS — horizontal strip ───── */}
      <div className="flex flex-wrap gap-2 pb-0.5">
        <QuickAction href="/dashboard?new=true" icon={<Plus className="w-3.5 h-3.5" />} label="Nowy projekt" color="blue" />
        <QuickAction href="/dashboard/projects/quick-estimate" icon={<Zap className="w-3.5 h-3.5" />} label="Szybka wycena" color="orange" />
        <QuickAction href="/dashboard/panel-configurator" icon={<LayoutGrid className="w-3.5 h-3.5" />} label="Rozdzielnica" color="indigo" />
        <QuickAction href="/dashboard/settings/knr-calculator" icon={<Calculator className="w-3.5 h-3.5" />} label="KNR" color="amber" />
        <QuickAction href="/dashboard/tools" icon={<Wrench className="w-3.5 h-3.5" />} label="Kalkulatory" color="emerald" />
        <QuickAction href="/dashboard/market" icon={<TrendingUp className="w-3.5 h-3.5" />} label="Rynek" color="sky" />
      </div>

      {/* ───── STATS ───── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <Stat icon={<FolderOpen className="w-3.5 h-3.5 text-blue-500" />} label="Projekty" value={stats.projectsTotal} />
        <Stat icon={<FileText className="w-3.5 h-3.5 text-emerald-500" />} label="Pozycje" value={stats.totalItems} />
        <Stat icon={<Users className="w-3.5 h-3.5 text-violet-500" />} label="Klienci" value={stats.clientsCount} />
        <Stat icon={<Bot className="w-3.5 h-3.5 text-amber-500" />} label="ES-Engine" value={stats.aiUsageCount} />
        <Stat icon={<Boxes className="w-3.5 h-3.5 text-pink-500" />} label="Zestawy" value={stats.assembliesCount} />
        <Stat icon={<BookOpen className="w-3.5 h-3.5 text-teal-500" />} label="Katalog" value={stats.catalogItemsCount} />
      </div>

      {/* ───── NAV SECTIONS — Three columns ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Section title="Narzędzia ES">
          <Row href="/dashboard/panel-configurator" icon={<LayoutGrid className="w-4 h-4 text-blue-500" />} label="Rozdzielnica" desc="Konfigurator tablic DIN, schemat" />
          <Row href="/dashboard/settings/knr-calculator" icon={<Calculator className="w-4 h-4 text-amber-500" />} label="Centrum KNR" desc="Kalkulator + normy KNR" />
          <Row href="/dashboard/tools" icon={<Wrench className="w-4 h-4 text-emerald-500" />} label="Kalkulatory" desc="12 kalkulatorów inżynierskich" />
        </Section>

        <Section title="Projekty i baza">
          <Row href="/dashboard" icon={<FolderOpen className="w-4 h-4 text-blue-500" />} label="Projekty" desc="Lista wszystkich projektów" />
          <Row href="/dashboard/catalog" icon={<Boxes className="w-4 h-4 text-pink-500" />} label="Katalog" desc="Baza pozycji z cenami" />
          <Row href="/dashboard/assemblies" icon={<Sparkles className="w-4 h-4 text-orange-500" />} label="Zestawy" desc="Gotowe zestawy montażowe" />
          <Row href="/dashboard/templates" icon={<Copy className="w-4 h-4 text-indigo-500" />} label="Szablony" desc="Szablony projektów" />
          <Row href="/dashboard/market" icon={<TrendingUp className="w-4 h-4 text-sky-500" />} label="Rynek" desc="Trendy cen materiałów" />
          <Row href="/dashboard/sent-offers" icon={<Send className="w-4 h-4 text-slate-500" />} label="Wysłane oferty" desc="Portal klienta i negocjacje" />
        </Section>

        <Section title="Konto i pomoc">
          <Row href="/dashboard/settings" icon={<Settings className="w-4 h-4 text-slate-500" />} label="Ustawienia" desc="Dane firmy, region, stawka" />
          <Row href="/dashboard/settings?tab=subscription" icon={<Crown className="w-4 h-4 text-amber-500" />} label="Subskrypcja" desc={profile.isPro ? "Plan PRO aktywny" : "Przejdź na PRO"} />
          <Row href="/dashboard/clients" icon={<UserCircle className="w-4 h-4 text-violet-500" />} label="Klienci" desc="Baza klientów CRM" />
          <Row href="/dashboard/analytics" icon={<BarChart3 className="w-4 h-4 text-blue-500" />} label="Analityka" desc="Statystyki i trendy" />
          <Row href="/dashboard/time" icon={<Clock className="w-4 h-4 text-indigo-500" />} label="Czas pracy" desc="Śledzenie czasu" />
          <Row href="/dashboard/feedback" icon={<Mail className="w-4 h-4 text-orange-500" />} label="Opinie" desc="Zgłoś błąd lub sugestie" />
        </Section>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function MetaPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2.5 py-0.5">
      {icon}{text}
    </span>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <p className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
      <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

const QA_COLORS: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/50",
  orange: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/50 dark:hover:bg-orange-900/50",
  violet: "bg-violet-50 text-violet-700 hover:bg-violet-100 border-violet-100 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900/50 dark:hover:bg-violet-900/50",
  emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 dark:hover:bg-emerald-900/50",
  sky: "bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50 dark:hover:bg-sky-900/50",
  indigo: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50 dark:hover:bg-indigo-900/50",
  amber: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 dark:hover:bg-amber-900/50",
};

function QuickAction({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border whitespace-nowrap transition-colors ${QA_COLORS[color] || QA_COLORS.blue}`}
    >
      {icon}
      {label}
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">{title}</h2>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {children}
      </div>
    </div>
  );
}

function Row({ href, icon, label, desc, external }: { href: string; icon: React.ReactNode; label: string; desc: string; external?: boolean }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{desc}</p>
      </div>
      {external ? (
        <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
      )}
    </Link>
  );
}
