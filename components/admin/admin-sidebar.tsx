"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, BarChart3, MessageSquare, TrendingUp,
  Brain, ShieldCheck, Home, Activity, Shield, Zap, MonitorDot,
  LayoutGrid, FlaskConical, SlidersHorizontal, Search, Settings,
  ChevronRight,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Przegląd",
    color: "text-blue-500",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Użytkownicy",
    color: "text-violet-500",
    items: [
      { href: "/admin/users",     label: "Użytkownicy", icon: Users          },
      { href: "/admin/analytics", label: "Analityka",   icon: BarChart3      },
      { href: "/admin/feedback",  label: "Opinie",      icon: MessageSquare  },
    ],
  },
  {
    label: "Katalog i Ceny",
    color: "text-amber-500",
    items: [
      { href: "/admin/market",         label: "Ceny Katalogowe", icon: TrendingUp       },
      { href: "/admin/canonical-l0",   label: "L0 Canonical",   icon: SlidersHorizontal },
      { href: "/admin/knowledge-base", label: "Baza Wiedzy",    icon: Brain             },
      { href: "/admin/panel",          label: "Rozdzielnice",   icon: LayoutGrid        },
    ],
  },
  {
    label: "ES-Engine",
    color: "text-emerald-500",
    items: [
      { href: "/admin/health",      label: "Health Monitor",  icon: Activity    },
      { href: "/admin/knr-quality", label: "KNR Quality Hub", icon: FlaskConical },
      { href: "/admin/monitoring",  label: "Monitoring",      icon: MonitorDot  },
      { href: "/admin/audit",       label: "Audit Log",       icon: Shield      },
    ],
  },
  {
    label: "System",
    color: "text-slate-400",
    items: [
      { href: "/admin/settings", label: "Ustawienia", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-screen">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-[14px] border-b border-slate-200 dark:border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm shrink-0">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">Admin Panel</p>
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 leading-none">
            <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            ElektroSmart PRO
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <button
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 text-slate-400 text-[11px] transition-colors"
          onClick={() => {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          }}
        >
          <Search className="w-3 h-3 shrink-0" />
          <span className="flex-1 text-left">Szukaj…</span>
          <kbd className="hidden sm:inline text-[9px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-1 py-0.5 text-slate-400">⌘K</kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-5 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className={cn(
              "px-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.12em]",
              group.color,
            )}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || (href !== "/admin/dashboard" && pathname.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all group relative",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-blue-500" />
                    )}
                    <Icon className={cn(
                      "w-[15px] h-[15px] shrink-0",
                      isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-500"
                    )} />
                    <span className="truncate flex-1">{label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 text-blue-400 shrink-0 ml-auto" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors group"
        >
          <Home className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-slate-500" />
          <span>Dashboard główny</span>
        </Link>
      </div>
    </aside>
  );
}
