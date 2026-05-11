"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, X, Settings } from "lucide-react";

interface RateNotSetBannerProps {
  rateNotSet: boolean;
}

export function RateNotSetBanner({ rateNotSet }: RateNotSetBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = "rate-banner-dismissed-day";
    const stored = sessionStorage.getItem(key);
    if (stored === new Date().toDateString()) {
      setDismissed(true);
    }
  }, []);

  if (!rateNotSet || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem("rate-banner-dismissed-day", new Date().toDateString());
    setDismissed(true);
  };

  return (
    <div className="w-full bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="flex-1 text-xs text-amber-800 dark:text-amber-200">
          <span className="font-semibold">Stawka R-G nie jest ustawiona.</span>{" "}
          Ustaw swoją stawkę roboczogodzinową, aby wyceny były dopasowane do Twojego cennika.
        </p>
        <Link
          href="/dashboard/settings?tab=knr"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors flex-shrink-0"
          onClick={handleDismiss}
        >
          <Settings className="w-3 h-3" />
          Ustaw stawkę
        </Link>
        <button
          onClick={handleDismiss}
          className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 flex-shrink-0 transition-colors"
          aria-label="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
