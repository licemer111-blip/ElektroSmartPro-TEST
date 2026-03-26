"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";

interface MobileNavLinkProps {
  href: string;
  icon: keyof typeof Icons;
  children: React.ReactNode;
}

export function MobileNavLink({ href, icon, children }: MobileNavLinkProps) {
  const pathname = usePathname();
  
  // Check if the link is active
  const isActive = 
    href === "/dashboard" 
      ? pathname === "/dashboard" 
      : pathname.startsWith(href);

  // Dynamically get the icon component
  const Icon = Icons[icon] as Icons.LucideIcon;

  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold shadow-md"
            : "text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        )}
      >
        {Icon && <Icon className="w-5 h-5" />}
        {children}
      </Link>
    </SheetClose>
  );
}
