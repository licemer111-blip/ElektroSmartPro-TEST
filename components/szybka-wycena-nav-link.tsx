"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface SzybkaWycenaNavLinkProps {
  className?: string;
}

export function SzybkaWycenaNavLink({ className }: SzybkaWycenaNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/dashboard/projects/quick-estimate");

  return (
    <Link
      href="/dashboard/projects/quick-estimate"
      title="Szybka Wycena — kreator kosztorysu w 5 minut: obiekt, pozycje, PDF"
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium whitespace-nowrap",
        isActive
          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50",
        className
      )}
    >
      <Zap className="w-4 h-4" />
      Szybka Wycena
    </Link>
  );
}
