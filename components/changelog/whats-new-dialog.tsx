"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Wrench, Bug, ChevronRight, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHANGELOG } from "./changelog-data";
import type { ChangelogEntry } from "./changelog-data";

const STORAGE_KEY = "elektrosmart-last-seen-version";

const tagConfig: Record<ChangelogEntry["tag"], { label: string; icon: React.ElementType; className: string }> = {
  new: { label: "Nowość", icon: Sparkles, className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  improvement: { label: "Ulepszenie", icon: Wrench, className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  fix: { label: "Poprawka", icon: Bug, className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
};

export function WhatsNewDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || CHANGELOG.length === 0) return;
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    const latest = CHANGELOG[0].version;
    if (lastSeen !== latest) {
      // Small delay so it doesn't compete with page load
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    if (CHANGELOG.length > 0) {
      localStorage.setItem(STORAGE_KEY, CHANGELOG[0].version);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <div className="bg-white/15 p-1.5 rounded-lg">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-base font-semibold">Co nowego?</span>
                <span className="block text-blue-200 text-xs font-normal mt-0.5">
                  ElektroSmart PRO v{CHANGELOG[0]?.version}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Lista nowych funkcji i poprawek w aktualnej wersji ElektroSmart PRO.</DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-5 py-4 space-y-5">
            {CHANGELOG.slice(0, 4).map((entry, idx) => {
              const { label, icon: Icon, className } = tagConfig[entry.tag];
              const isLatest = idx === 0;
              return (
                <div
                  key={entry.version}
                  className={cn(
                    "relative pl-5 border-l-2",
                    isLatest ? "border-blue-400 dark:border-blue-500" : "border-slate-200 dark:border-slate-700"
                  )}
                >
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute -left-[5px] top-1 w-2 h-2 rounded-full",
                      isLatest ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"
                    )}
                  />

                  {/* Version + date */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      v{entry.version}
                    </span>
                    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", className)}>
                      {label}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
                      {entry.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">
                    {entry.title}
                  </h4>

                  {/* Highlights */}
                  <ul className="space-y-1">
                    {entry.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400 dark:text-slate-600" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 gap-1.5" onClick={handleClose}>
            <Sparkles className="w-3.5 h-3.5" />
            Fajnie, zamknij
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
