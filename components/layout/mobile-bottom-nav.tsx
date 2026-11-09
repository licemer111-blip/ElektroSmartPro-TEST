"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home, 
  FileText, 
  Package, 
  Settings, 
  Plus,
  Wrench,
  BarChart3,
  User
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState(pathname);

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Projekty",
      active: pathname === "/dashboard"
    },
    {
      href: "/dashboard/catalog",
      icon: Package,
      label: "Katalog",
      active: pathname.startsWith("/dashboard/catalog")
    },
    {
      href: "#new",
      icon: Plus,
      label: "Nowy",
      active: false
    },
    {
      href: "/dashboard/tools",
      icon: Wrench,
      label: "Narzędzia",
      active: pathname.startsWith("/dashboard/tools")
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      label: "Ustawienia",
      active: pathname.startsWith("/dashboard/settings")
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.active;
          
          if (item.href === "#new") {
            return (
              <div key="new" className="flex flex-col items-center justify-end pb-1">
                <button
                  onClick={() => window.location.href = "/dashboard/projects/quick-estimate"}
                  aria-label="Nowy kosztorys"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-11 h-11 -mt-3 flex items-center justify-center shadow-lg shadow-blue-500/25 active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <span className="text-[10px] leading-none mt-0.5 text-slate-600 dark:text-slate-400">
                  Nowy
                </span>
              </div>
            );
          }
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 relative",
                "active:scale-95 transition-transform duration-150",
                isActive && "text-blue-600 dark:text-blue-400"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-all duration-200",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs transition-all duration-200",
                isActive ? "font-medium" : "text-slate-600 dark:text-slate-400"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      
      {/* Safe area for iPhone notch/home indicator */}
      <div className="bg-white dark:bg-slate-900" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}

// Bottom padding spacer for main content
export function MobileBottomNavPadding() {
  return (
    <div className="h-36 md:hidden" />
  );
}
