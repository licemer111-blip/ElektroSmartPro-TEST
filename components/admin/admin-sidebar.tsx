"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  MessageSquare,
  TrendingUp,
  Brain,
  ShieldCheck,
  ArrowLeft,
  Home,
  Activity,
  Shield,
  Zap,
  MonitorDot,
  LayoutGrid,
  FlaskConical,
  Search,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Główne",
    items: [
      { href: "/admin/dashboard", label: "Dashboard",    icon: LayoutDashboard },
      { href: "/admin/users",     label: "Użytkownicy",  icon: Users           },
    ],
  },
  {
    label: "Engine Monitoring",
    items: [
      { href: "/admin/monitoring",    label: "Monitoring",      icon: MonitorDot  },
      { href: "/admin/health",        label: "Health Monitor",  icon: Activity    },
      { href: "/admin/audit",         label: "Audit Log",       icon: Shield      },
      { href: "/admin/knr-quality",   label: "KNR Quality Hub", icon: FlaskConical },
    ],
  },
  {
    label: "Baza danych",
    items: [
      { href: "/admin/knowledge-base", label: "Baza Wiedzy",   icon: Brain      },
      { href: "/admin/analytics",      label: "Analityka",     icon: BarChart3  },
      { href: "/admin/market",         label: "Market / Ceny", icon: TrendingUp },
      { href: "/admin/panel",          label: "Rozdzielnice",  icon: LayoutGrid },
    ],
  },
  {
    label: "Komunikacja",
    items: [
      { href: "/admin/feedback", label: "Opinie", icon: MessageSquare },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 shrink-0">
          <ShieldCheck className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">Admin</p>
          <p className="text-[10px] text-slate-400 leading-tight flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            ES-Engine
          </p>
        </div>
      </div>

      {/* CMD+K Search */}
      <div className="px-2 py-2 border-b border-slate-100 dark:border-slate-800">
        <button
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700/60 text-slate-400 text-[11px] transition-colors"
          onClick={() => {
            const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
          aria-label="Szukaj (CMD+K)"
        >
          <Search className="w-3 h-3 shrink-0" />
          <span className="flex-1 text-left">Szukaj…</span>
          <kbd className="text-[9px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    )} />
                    <span className="truncate">{label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <Link
          href="/dashboard/settings?tab=admin"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform shrink-0" />
          <span className="truncate">Ustawienia</span>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 text-xs transition-colors"
        >
          <Home className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Dashboard główny</span>
        </Link>
      </div>
    </aside>
  );
}
