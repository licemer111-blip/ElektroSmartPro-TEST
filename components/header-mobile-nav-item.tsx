"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";

interface HeaderMobileNavItemProps {
  href: string;
  icon: keyof typeof Icons;
  children: React.ReactNode;
  variant?: "default" | "glow" | "glow-blue";
  desc?: string;
}

export function HeaderMobileNavItem({ href, icon, children, variant = "default", desc }: HeaderMobileNavItemProps) {
  const pathname = usePathname();
  
  const isActive = 
    href === "/dashboard" 
      ? pathname === "/dashboard" 
      : pathname.startsWith(href);

  const Icon = Icons[icon] as Icons.LucideIcon;

  return (
    <>
      {(variant === "glow" || variant === "glow-blue") && (
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes textGlow {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.55; }
          }
          .animate-text-glow { animation: textGlow 2.5s ease-in-out infinite; }
        `}} />
      )}
      <SheetClose asChild>
        <Link
          href={href}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            variant === "glow"
              ? isActive
                ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 font-semibold animate-text-glow"
                : "text-orange-600 dark:text-orange-400 font-semibold hover:bg-orange-50/50 dark:hover:bg-orange-950/10 animate-text-glow"
              : variant === "glow-blue"
              ? isActive
                ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold animate-text-glow"
                : "text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50/50 dark:hover:bg-blue-950/10 animate-text-glow"
              : isActive
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
          <span className="flex flex-col min-w-0">
            <span>{children}</span>
            {desc && <span className="text-[10px] font-normal opacity-60 truncate">{desc}</span>}
          </span>
        </Link>
      </SheetClose>
    </>
  );
}
