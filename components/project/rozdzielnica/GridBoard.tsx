"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, X, Check, ArrowRight } from "lucide-react";
import { DinRailRow } from "../panel-din-rail-row";
import { getModulePrice } from "../panel-configurator-helpers";
import type { RailModule, VisualModule, IssueSeverity, PanelSection, SelectedSlot, GhostModuleData } from "../panel-configurator-types";
import type { DinModule } from "../panel-configurator-types";

const CABLE_TYPES = [
  "YDY 3×1.5", "YDY 3×2.5", "YDY 5×2.5", "YDY 5×4", "YDY 5×6",
  "YDY 5×10", "YDY 5×16", "YDY 5×25", "YDY 5×35",
  "YKXS 3×1.5", "YKXS 3×2.5", "YKXS 5×2.5", "YKXS 5×4", "YKXS 5×6",
];

export interface GridBoardProps {
  railRows: VisualModule[][];
  railModules: RailModule[];
  modulesPerRow: number;
  dragUid: string | null;
  setDragUid: (uid: string | null) => void;
  handleDragDrop: (fromUid: string, toUid: string) => void;
  selectedUid: string | null;
  setSelectedUid: (uid: string | null) => void;
  selectedModule: RailModule | null;
  selectedRowIdx: number;
  isPro: boolean;
  manufacturerCoeff: number;
  moduleIssueMap: Map<string, { severity: IssueSeverity; messages: string[] }>;
  removeModule: (uid: string) => void;
  duplicateModule: (uid: string) => void;
  updateModule: (uid: string, updates: Partial<Pick<RailModule,
    "rating" | "customMaterialPrice" | "customLaborPrice" | "label" |
    "customName" | "circuitNumber" | "cableType" | "parentRcdUid" |
    "quantity" | "phase" | "terminalCount" | "isZugBlock">>) => void;
  moveModuleToSection: (uid: string, targetSectionIdx: number) => void;
  sections: PanelSection[];
  activeSectionIdx: number;
  selectedSlot: SelectedSlot | null;
  onSlotClick: (rowIdx: number, slotIdx: number) => void;
  ghostModuleData: GhostModuleData | null;
}

export const GridBoard = React.memo(function GridBoard({
  railRows,
  railModules,
  modulesPerRow,
  dragUid,
  setDragUid,
  handleDragDrop,
  selectedUid,
  setSelectedUid,
  selectedModule,
  selectedRowIdx,
  isPro,
  manufacturerCoeff,
  moduleIssueMap,
  removeModule,
  duplicateModule,
  updateModule,
  moveModuleToSection,
  sections,
  activeSectionIdx,
  selectedSlot,
  onSlotClick,
  ghostModuleData,
}: GridBoardProps) {
  const { toast } = useToast();

  const circuitCnt = railModules.filter(
    (m) => m.module.category === "breaker" || m.module.category === "rcbo"
  ).length;
  const hasZugBlocks = railModules.some((m) => m.isZugBlock);
  const zugReserve = !hasZugBlocks ? Math.ceil(circuitCnt * 0.5) : 0;

  return (
    <div className="space-y-2">
      {railRows.map((rowModules, rowIdx) => (
        <React.Fragment key={rowIdx}>
          <DinRailRow
            rowIndex={rowIdx}
            modules={rowModules}
            modulesPerRow={modulesPerRow}
            onRemove={removeModule}
            dragUid={dragUid}
            onDragStart={setDragUid}
            onDragEnd={() => setDragUid(null)}
            onDrop={handleDragDrop}
            selectedUid={selectedUid}
            onSelect={(uid) => setSelectedUid(selectedUid === uid ? null : uid)}
            isPro={isPro}
            manufacturerCoeff={manufacturerCoeff}
            moduleIssues={moduleIssueMap}
            zugReserveSlots={zugReserve}
            isLastRow={rowIdx === railRows.length - 1}
            activeSlot={selectedSlot}
            onSlotClick={onSlotClick}
            ghostModuleData={ghostModuleData}
          />

          {/* Inline edit panel — appears right after the row with selected module */}
          {selectedModule && selectedRowIdx === rowIdx && (() => {
            const prices = getModulePrice(selectedModule, manufacturerCoeff);
            const SIcon = selectedModule.module.icon;
            return (
              <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-800/60">
                  <SIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block leading-tight">
                      {selectedModule.module.namePl}
                    </span>
                    {selectedModule.module.description && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block leading-tight">
                        {selectedModule.module.description}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost" size="sm"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md"
                      title="Duplikuj"
                      onClick={() => { duplicateModule(selectedModule.uid); toast({ title: "Zduplikowano" }); }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    {sections.length > 1 && (
                      <Select name={`mod-move-${selectedModule.uid}`} value="" onValueChange={(v) => moveModuleToSection(selectedModule.uid, parseInt(v))}>
                        <SelectTrigger id={`mod-move-${selectedModule.uid}`} aria-label="Przenieś do sekcji" className="h-6 w-auto px-2 text-[10px] text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 gap-0.5 rounded-md">
                          <ArrowRight className="w-3 h-3" />
                          <span>Przenieś</span>
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((s, i) =>
                            i !== activeSectionIdx && (
                              <SelectItem key={s.id} value={String(i)} className="text-xs">{s.name}</SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md" onClick={() => setSelectedUid(null)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Body */}
                <div className="px-3 py-2.5 flex items-end gap-2.5 flex-wrap">
                  {/* Name */}
                  <div className="flex-1 min-w-[140px]">
                    <label htmlFor={`mod-name-${selectedModule.uid}`} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">Nazwa</label>
                    <Input
                      id={`mod-name-${selectedModule.uid}`}
                      name={`mod-name-${selectedModule.uid}`}
                      value={selectedModule.customName || selectedModule.module.namePl}
                      onChange={(e) => updateModule(selectedModule.uid, { customName: e.target.value })}
                      className="h-7 text-xs border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                      placeholder={selectedModule.module.namePl}
                    />
                  </div>

                  {selectedModule.isZugBlock ? (
                    <>
                      <div className="w-[90px]">
                        <label htmlFor={`mod-terminals-${selectedModule.uid}`} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">Ilość złączek</label>
                        <Input
                          id={`mod-terminals-${selectedModule.uid}`}
                          name={`mod-terminals-${selectedModule.uid}`}
                          type="number" min={3} max={300} step={3}
                          value={selectedModule.terminalCount || 15}
                          onChange={(e) => updateModule(selectedModule.uid, { terminalCount: parseInt(e.target.value) || 15 })}
                          className="h-7 text-xs border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {selectedModule.module.ratingOptions && selectedModule.module.ratingOptions.length > 0 && (
                        <div className="w-[72px]">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">Prąd</label>
                          <Select
                            name={`mod-rating-${selectedModule.uid}`}
                            value={String(selectedModule.rating ?? selectedModule.module.defaultRating)}
                            onValueChange={(v) => updateModule(selectedModule.uid, { rating: parseInt(v) })}
                          >
                            <SelectTrigger id={`mod-rating-${selectedModule.uid}`} aria-label="Prąd" className="h-7 text-xs border-slate-200 dark:border-slate-700"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {selectedModule.module.ratingOptions.map((r) => (
                                <SelectItem key={r} value={String(r)} className="text-xs">{r}A</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="w-[52px]">
                        <label htmlFor={`mod-circuit-${selectedModule.uid}`} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">Nr obw.</label>
                        <Input
                          id={`mod-circuit-${selectedModule.uid}`}
                          name={`mod-circuit-${selectedModule.uid}`}
                          value={selectedModule.circuitNumber || ""}
                          onChange={(e) => updateModule(selectedModule.uid, { circuitNumber: e.target.value })}
                          className="h-7 text-xs border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500 text-center"
                          placeholder="1"
                        />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <label htmlFor={`mod-label-${selectedModule.uid}`} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">Opis obwodu</label>
                        <Input
                          id={`mod-label-${selectedModule.uid}`}
                          name={`mod-label-${selectedModule.uid}`}
                          value={selectedModule.label || ""}
                          onChange={(e) => updateModule(selectedModule.uid, { label: e.target.value })}
                          className="h-7 text-xs border-slate-200 dark:border-slate-700 focus-visible:ring-blue-500"
                          placeholder="np. oświetlenie salon"
                        />
                      </div>
                      {selectedModule.module.modules === 1 && (
                        <div className="w-[68px]">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">Faza</label>
                          <Select
                            name={`mod-phase-${selectedModule.uid}`}
                            value={selectedModule.phase || "__none__"}
                            onValueChange={(v) => updateModule(selectedModule.uid, { phase: v === "__none__" ? undefined : v as "L1" | "L2" | "L3" })}
                          >
                            <SelectTrigger id={`mod-phase-${selectedModule.uid}`} aria-label="Faza" className="h-7 text-xs border-slate-200 dark:border-slate-700"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__" className="text-xs">—</SelectItem>
                              <SelectItem value="L1" className="text-xs">L1</SelectItem>
                              <SelectItem value="L2" className="text-xs">L2</SelectItem>
                              <SelectItem value="L3" className="text-xs">L3</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {(selectedModule.module.category === "breaker" || selectedModule.module.category === "rcbo") && (
                        <div className="w-[110px]">
                          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block mb-0.5">Przewód</label>
                          <Select
                            name={`mod-cable-${selectedModule.uid}`}
                            value={selectedModule.cableType || ""}
                            onValueChange={(v) => updateModule(selectedModule.uid, { cableType: v })}
                          >
                            <SelectTrigger id={`mod-cable-${selectedModule.uid}`} aria-label="Typ przewodu" className="h-7 text-xs border-slate-200 dark:border-slate-700"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {CABLE_TYPES.map((c) => (
                                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Price separator */}
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 self-end mb-0.5 flex-shrink-0" />

                  {/* Materiał */}
                  <div className="w-[80px]">
                    <label htmlFor={`mod-mat-${selectedModule.uid}`} className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide block mb-0.5">Mat. (zł)</label>
                    {isPro ? (
                      <Input
                        id={`mod-mat-${selectedModule.uid}`}
                        name={`mod-mat-${selectedModule.uid}`}
                        aria-label="Cena materiału"
                        type="number" min={0} step={0.01}
                        placeholder={String(Math.round(selectedModule.module.defaultPrice * manufacturerCoeff * 100) / 100)}
                        value={selectedModule.isZugBlock ? (selectedModule.customMaterialPrice ?? "") : (selectedModule.customMaterialPrice ?? Math.round(selectedModule.module.defaultPrice * manufacturerCoeff * 100) / 100)}
                        onChange={(e) => updateModule(selectedModule.uid, { customMaterialPrice: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })}
                        className="h-7 text-xs border-amber-200 dark:border-amber-800/50 focus-visible:ring-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                      />
                    ) : (
                      <div className="h-7 flex items-center justify-center text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 tracking-widest">***</div>
                    )}
                  </div>

                  {/* Robocizna */}
                  <div className="w-[80px]">
                    <label htmlFor={`mod-lab-${selectedModule.uid}`} className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide block mb-0.5">Rob. (zł)</label>
                    {isPro ? (
                      <Input
                        id={`mod-lab-${selectedModule.uid}`}
                        name={`mod-lab-${selectedModule.uid}`}
                        aria-label="Cena robocizny"
                        type="number" min={0} step={0.01}
                        placeholder={String(selectedModule.module.defaultLaborPrice)}
                        value={selectedModule.isZugBlock ? (selectedModule.customLaborPrice ?? "") : (selectedModule.customLaborPrice ?? selectedModule.module.defaultLaborPrice)}
                        onChange={(e) => updateModule(selectedModule.uid, { customLaborPrice: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })}
                        className="h-7 text-xs border-blue-200 dark:border-blue-800/50 focus-visible:ring-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                      />
                    ) : (
                      <div className="h-7 flex items-center justify-center text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 tracking-widest">***</div>
                    )}
                  </div>

                  {/* Total + OK */}
                  {isPro && (
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 self-end">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                        <span className="text-amber-600 dark:text-amber-400">{prices.material.toFixed(0)}</span>
                        <span className="text-slate-300 dark:text-slate-600 mx-0.5">+</span>
                        <span className="text-blue-600 dark:text-blue-400">{prices.labor.toFixed(0)}</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold gap-1 shadow-sm shadow-blue-500/30"
                        onClick={() => { setSelectedUid(null); toast({ title: "Zapisano", description: selectedModule.module.namePl }); }}
                      >
                        <Check className="w-3 h-3" />
                        {(prices.material + prices.labor).toFixed(0)} zł
                      </Button>
                    </div>
                  )}
                  {!isPro && (
                    <Button
                      size="sm"
                      className="h-7 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1 self-end"
                      onClick={() => { setSelectedUid(null); toast({ title: "Zapisano", description: selectedModule.module.namePl }); }}
                    >
                      <Check className="w-3 h-3" /> OK
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </React.Fragment>
      ))}
    </div>
  );
});
