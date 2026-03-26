"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FolderPlus, FileDown, Trash2, Copy } from "lucide-react";
import type { PanelTemplate } from "./panel-configurator-types";
import { SWITCHBOARD_BLUEPRINTS } from "@/lib/data/switchboard-blueprints";
import type { SavedConfig } from "@/hooks/usePanelConfigActions";

interface PanelLoadConfigDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  savedConfigs: SavedConfig[];
  handleLoadConfig: (id: string) => Promise<void>;
  handleDeleteConfig: (id: string) => Promise<void>;
  applyTemplate: (tpl: PanelTemplate) => void;
}

export function PanelLoadConfigDialog({
  open, onOpenChange, savedConfigs, handleLoadConfig, handleDeleteConfig, applyTemplate,
}: PanelLoadConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-600" />
            Wczytaj konfigurację
          </DialogTitle>
          <DialogDescription className="text-xs">Wybierz zapisaną konfigurację lub gotowy szablon</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {savedConfigs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Moje szablony</span>
                <Badge variant="secondary" className="text-[9px]">{savedConfigs.length}</Badge>
              </div>
              <div className="space-y-1.5">
                {savedConfigs.map((cfg) => (
                  <div key={cfg.id} className="flex items-center gap-2 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                    <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <FileDown className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cfg.name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(cfg.updated_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleLoadConfig(cfg.id)}>Wczytaj</Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteConfig(cfg.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {savedConfigs.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-3">Brak zapisanych konfiguracji — użyj przycisku „Zapisz" w konstruktorze</p>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">Gotowe szablony</span>
              <Badge variant="secondary" className="text-[9px]">{SWITCHBOARD_BLUEPRINTS.length}</Badge>
            </div>
            <div className="space-y-1.5">
              {SWITCHBOARD_BLUEPRINTS.map((bp) => {
                const TplIcon = bp.template.icon;
                return (
                  <div key={bp.template.id} className={`flex items-center gap-2 p-2 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer ${bp.meta.color}`}
                    onClick={() => { applyTemplate(bp.template); onOpenChange(false); }}>
                    <div className="w-7 h-7 rounded bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center flex-shrink-0">
                      <TplIcon className={`w-3.5 h-3.5 ${bp.meta.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bp.template.name}</p>
                      <p className="text-[10px] text-slate-500">{bp.meta.targetAudience}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Badge variant="outline" className="text-[9px]">{bp.meta.circuitCount} obw.</Badge>
                      {bp.meta.hasSPD && <Badge className="text-[9px] px-1 bg-amber-100 text-amber-700 border-0">SPD</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
