"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import type { ValidationIssue } from "./panel-configurator-types";

interface PanelDiagnosticsProps {
  activeIssues: ValidationIssue[];
  setActiveTab: (tab: string) => void;
  setSelectedUid: (uid: string | null) => void;
}

export function PanelDiagnostics({ activeIssues, setActiveTab, setSelectedUid }: PanelDiagnosticsProps) {
  if (activeIssues.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-gradient-to-r from-red-50/80 via-amber-50/40 to-red-50/80 dark:from-red-950/20 dark:via-amber-950/10 dark:to-red-950/20 px-3 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Diagnostyka</span>
          <Badge variant="destructive" className="text-[11px] px-2 py-0.5 h-5">
            {activeIssues.filter(i => i.severity === "error").length} błędów
          </Badge>
          {activeIssues.filter(i => i.severity === "warning").length > 0 && (
            <Badge className="text-[11px] px-2 py-0.5 h-5 bg-amber-500 hover:bg-amber-600">
              {activeIssues.filter(i => i.severity === "warning").length} ostrzeżeń
            </Badge>
          )}
          {activeIssues.filter(i => i.severity === "info").length > 0 && (
            <Badge variant="secondary" className="text-[11px] px-2 py-0.5 h-5">
              {activeIssues.filter(i => i.severity === "info").length} zaleceń
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-0.5">
        {activeIssues.map((issue) => (
          <div
            key={issue.id}
            className={`flex items-start gap-1.5 text-xs leading-snug rounded px-1.5 py-1 ${
              issue.severity === "error"
                ? "text-red-700 dark:text-red-300 bg-red-100/50 dark:bg-red-900/20"
                : issue.severity === "warning"
                ? "text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-900/20"
                : "text-blue-700 dark:text-blue-300 bg-blue-100/50 dark:bg-blue-900/20"
            }`}
          >
            <span className="flex-shrink-0 mt-px">
              {issue.severity === "error" ? "🔴" : issue.severity === "warning" ? "🟡" : "🔵"}
            </span>
            <span className="flex-1">{issue.message}</span>
            {issue.moduleUids.length > 0 && (
              <button
                className="ml-1 flex-shrink-0 text-[10px] px-1 py-0.5 rounded border border-current/30 bg-white/40 hover:bg-white/70 dark:bg-slate-700/40 dark:hover:bg-slate-700/70 transition-colors font-mono"
                onClick={() => { setActiveTab("build"); setSelectedUid(issue.moduleUids[0]); }}
                title={`Przejdź do modułu (${issue.moduleUids.length} urz.)`}
              >
                📍
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
