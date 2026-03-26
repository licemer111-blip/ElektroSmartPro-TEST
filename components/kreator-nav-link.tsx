"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Kreator Nav Link
 * 
 * Smart navigation link that remembers the last project the user worked on
 * Uses localStorage to persist the last project ID across sessions
 */
export function KreatorNavLink() {
  const pathname = usePathname();
  const [kreatorHref, setKreatorHref] = useState("/dashboard/projects");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check if we're on a project page
    const isOnProjectPage = pathname?.startsWith("/dashboard/projects/");
    setIsActive(isOnProjectPage);

    // Get last project ID from localStorage
    const lastProjectId = localStorage.getItem("lastProjectId");
    
    if (lastProjectId) {
      // Validate: Check if this project ID still exists by trying to fetch
      // For now, we trust the ID but will clear on 404
      setKreatorHref(`/dashboard/projects/${lastProjectId}`);
    } else {
      // Fallback to projects list if no last project
      setKreatorHref("/dashboard/projects");
    }
  }, [pathname]);

  return (
    <Link
      href={kreatorHref}
      title="Kreator kosztorysu — otwiera ostatnio edytowany projekt (lub listę projektów)"
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200",
        isActive
          ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
      )}
    >
      <PenTool className="w-4 h-4" />
      Kreator
    </Link>
  );
}
