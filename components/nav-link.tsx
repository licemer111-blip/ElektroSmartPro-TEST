"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: keyof typeof Icons;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function NavLink({ href, icon, children, className, title }: NavLinkProps) {
  const pathname = usePathname();
  
  // Check if the link is active
  // For /dashboard, only match exact path
  // For other paths, match if pathname starts with href
  const isActive = 
    href === "/dashboard" 
      ? pathname === "/dashboard" 
      : pathname.startsWith(href);

  // Dynamically get the icon component
  const Icon = Icons[icon] as Icons.LucideIcon;

  return (
    <Link
      href={href}
      title={title}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200",
        isActive
          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50",
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </Link>
  );
}
