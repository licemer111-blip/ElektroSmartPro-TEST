"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Zap, X } from "lucide-react";
import Link from "next/link";

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 500px
      const scrolled = window.scrollY > 500;
      setIsVisible(scrolled && !isDismissed);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom duration-300">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 p-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/25"
          >
            <Link href="/login">
              <Zap className="w-4 h-4 mr-2" />
              Rozpocznij za darmo
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 text-slate-400 hover:text-slate-600"
            onClick={() => setIsDismissed(true)}
            aria-label="Zamknij baner"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-center text-xs text-slate-500 mt-2">
          ✓ Bez karty kredytowej • ✓ 3 projekty za darmo
        </p>
      </div>
    </div>
  );
}
