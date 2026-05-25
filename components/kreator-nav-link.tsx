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
        "flex items-center gap-1.5 px-3 py-2 rounded-md transition-all duration-200 text-sm font-semibold whitespace-nowrap",
        isActive
          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm"
          : "text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      )}
    >
      <PenTool className="w-4 h-4" />
      Kreator
    </Link>
  );
}
