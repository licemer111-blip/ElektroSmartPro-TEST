"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { FileDown, Loader2, Wrench, Copy, Trash2 } from "lucide-react";
import type { PanelTemplate } from "./panel-configurator-types";
import { SWITCHBOARD_BLUEPRINTS } from "@/lib/data/switchboard-blueprints";
import type { SavedConfig } from "@/hooks/usePanelConfigActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PanelTemplatesTabProps {
  savedConfigs: SavedConfig[];
  applyTemplate: (tpl: PanelTemplate) => void;
  handleLoadConfig: (id: string) => Promise<void>;
  handleRenameConfig: (id: string, name: string) => Promise<void>;
  handleDuplicateConfig: (id: string) => Promise<void>;
  handleDeleteConfig: (id: string) => Promise<void>;
  refreshSavedConfigs: () => Promise<void>;
}

export function PanelTemplatesTab({
  savedConfigs,
  applyTemplate,
  handleLoadConfig,
  handleRenameConfig,
  handleDuplicateConfig,
  handleDeleteConfig,
  refreshSavedConfigs,
}: PanelTemplatesTabProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  return (
    <TabsContent value="templates" className="mt-3">
      <div className="space-y-4">
        {savedConfigs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileDown className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Moje szablony</h3>
              <Badge variant="secondary" className="text-[10px]">{savedConfigs.length}</Badge>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400" onClick={refreshSavedConfigs}>
                <Loader2 className="w-3 h-3 mr-1" /> Odśwież
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {savedConfigs.map((cfg) => (
                <Card key={cfg.id} className="border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 hover:shadow-md transition-all group">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <FileDown className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{cfg.name}</h3>
                        <p className="text-[10px] text-slate-400">{new Date(cfg.updated_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Button size="sm" className="h-6 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleLoadConfig(cfg.id)}>
                            Wczytaj
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 text-slate-400 hover:text-blue-600"
                            onClick={() => { setRenameId(cfg.id); setRenameValue(cfg.name); }}
                            title="Zmień nazwę">
                            <Wrench className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 text-slate-400 hover:text-indigo-600"
                            onClick={() => handleDuplicateConfig(cfg.id)} title="Duplikuj">
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 text-slate-400 hover:text-red-600"
                            onClick={() => setPendingDeleteId(cfg.id)}
                            title="Usuń">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Copy className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Gotowe szablony</h3>
            <Badge variant="secondary" className="text-[10px]">{SWITCHBOARD_BLUEPRINTS.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SWITCHBOARD_BLUEPRINTS.map((bp) => {
              const TplIcon = bp.template.icon;
              const sections = bp.template.sections ?? [];
              const totalCircuits = bp.meta.circuitCount;
              return (
                <Card key={bp.template.id}
                  className={`cursor-pointer border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md transition-all group ${bp.meta.color}`}
                  onClick={() => applyTemplate(bp.template)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                        <TplIcon className={`w-5 h-5 group-hover:text-white transition-colors ${bp.meta.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{bp.template.name}</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{bp.meta.targetAudience}</p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń szablon</AlertDialogTitle>
            <AlertDialogDescription>Czy na pewno chcesz usunąć ten szablon?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingDeleteId) { handleDeleteConfig(pendingDeleteId); setPendingDeleteId(null); } }} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Zmień nazwę szablonu</DialogTitle></DialogHeader>
          <Input
            id="template-rename"
            name="template-rename"
            aria-label="Nowa nazwa szablonu"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && renameId && renameValue.trim()) { handleRenameConfig(renameId, renameValue.trim()); setRenameId(null); } }}
            placeholder="Nowa nazwa..."
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>Anuluj</Button>
            <Button onClick={() => { if (renameId && renameValue.trim()) { handleRenameConfig(renameId, renameValue.trim()); setRenameId(null); } }} className="bg-blue-600 hover:bg-blue-700 text-white">Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
