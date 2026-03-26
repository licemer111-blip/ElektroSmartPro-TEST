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
        "flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-semibold whitespace-nowrap",
        isActive
          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 shadow-sm"
          : "text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20",
        className
      )}
    >
      <Zap className="w-4 h-4" />
      Szybka Wycena
    </Link>
  );
}
