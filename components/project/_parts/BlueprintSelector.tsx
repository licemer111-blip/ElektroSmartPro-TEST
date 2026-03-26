"use client";
import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Layers, ShieldCheck, Zap, ChevronRight, X,
} from "lucide-react";
import type { PanelTemplate } from "@/components/project/panel-configurator-types";
import { SWITCHBOARD_BLUEPRINTS } from "@/lib/data/switchboard-blueprints";

interface BlueprintSelectorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApply: (tpl: PanelTemplate) => void;
}

export function BlueprintSelector({ open, onOpenChange, onApply }: BlueprintSelectorProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const handleApply = (bp: typeof SWITCHBOARD_BLUEPRINTS[0]) => {
    onApply(bp.template);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                Szablony rozdzielnic (Blueprints)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Wybierz gotowy schemat — fazy L1/L2/L3, numery obwodów i przewody są już wypełnione.
                Po zastosowaniu możesz od razu uruchomić ES-Engine 2.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Gotowość 100% od razu
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <ShieldCheck className="w-3 h-3 text-blue-500" /> Fazy zbilansowane L1/L2/L3
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500">
              <Zap className="w-3 h-3 text-orange-500" /> Topologia PN-EN 61439
            </span>
          </div>
        </DialogHeader>

        {/* Blueprint grid */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SWITCHBOARD_BLUEPRINTS.map((bp) => {
            const Icon = bp.template.icon;
            const isHovered = hovered === bp.template.id;
            const totalCircuits = bp.meta.circuitCount;
            const sections = bp.template.sections ?? [];

            return (
              <div
                key={bp.template.id}
                className={`rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${
                  isHovered
                    ? "border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.01]"
                    : "border-slate-200 dark:border-slate-700 hover:border-blue-300"
                } ${bp.meta.color}`}
                onMouseEnter={() => setHovered(bp.template.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleApply(bp)}
              >
                {/* Card header */}
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isHovered ? "bg-blue-600" : "bg-white dark:bg-slate-800 shadow-sm"
                  }`}>
                    <Icon className={`w-5 h-5 ${isHovered ? "text-white" : bp.meta.textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {bp.template.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {bp.meta.targetAudience}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 transition-colors ${
                    isHovered ? "text-blue-500" : "text-slate-300"
                  }`} />
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="secondary" className="text-[9px] h-5 px-1.5">
                    {bp.meta.phases === 3 ? "3-fazy" : "1-faza"}
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] h-5 px-1.5">
                    {totalCircuits} obwodów
                  </Badge>
                  <Badge variant="secondary" className="text-[9px] h-5 px-1.5">
                    RCD ×{bp.meta.rcdCount}
                  </Badge>
                  {bp.meta.hasSPD && (
                    <Badge className="text-[9px] h-5 px-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-0">
                      SPD
                    </Badge>
                  )}
                  {sections.length > 1 && (
                    <Badge className="text-[9px] h-5 px-1.5 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-0">
                      {sections.length} sekcje
                    </Badge>
                  )}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {bp.meta.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Readiness indicator */}
                <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-semibold transition-colors ${
                  isHovered ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  Gotowość 100% — AI schemat dostępny od razu
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <p className="text-[10px] text-slate-400 text-center">
            Szablon zastępuje aktualną konfigurację. Możesz go dowolnie edytować po zastosowaniu.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
