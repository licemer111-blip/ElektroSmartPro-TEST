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
import { Copy, X, Check, ArrowRight, Zap, Info } from "lucide-react";
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
          {selectedModule && selectedRowIdx === rowIdx && (
            <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50/80 dark:bg-yellow-950/20 px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                {(() => {
                  const SIcon = selectedModule.module.icon;
                  return <SIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />;
                })()}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {selectedModule.module.namePl}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {selectedModule.module.description}
                </span>
                <div className="ml-auto flex items-center gap-0.5 flex-shrink-0">
                  <Button
                    variant="ghost" size="sm"
                    className="h-6 px-2 text-[11px] text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => { duplicateModule(selectedModule.uid); toast({ title: "Zduplikowano" }); }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {sections.length > 1 && (
                    <Select name={`mod-move-${selectedModule.uid}`} value="" onValueChange={(v) => moveModuleToSection(selectedModule.uid, parseInt(v))}>
                      <SelectTrigger id={`mod-move-${selectedModule.uid}`} aria-label="Przenieś do sekcji" className="h-6 w-auto px-2 text-[11px] text-indigo-500 border-indigo-200 gap-0.5">
                        <ArrowRight className="w-3 h-3" />
                        <span>Przenieś</span>
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((s, i) =>
                          i !== activeSectionIdx && (
                            <SelectItem key={s.id} value={String(i)} className="text-xs">
                              {s.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setSelectedUid(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              <div className="flex items-end gap-2 flex-wrap">
                {/* Name override */}
                <div className="flex-1 min-w-[120px]">
                  <label htmlFor={`mod-name-${selectedModule.uid}`} className="text-[11px] font-semibold text-slate-500 block">Nazwa</label>
                  <Input
                    id={`mod-name-${selectedModule.uid}`}
                    name={`mod-name-${selectedModule.uid}`}
                    value={selectedModule.customName || selectedModule.module.namePl}
                    onChange={(e) => updateModule(selectedModule.uid, { customName: e.target.value })}
                    className="h-6 text-[11px]"
                    placeholder={selectedModule.module.namePl}
                  />
                </div>

                {/* ZUG Block fields */}
                {selectedModule.isZugBlock ? (
                  <>
                    <div className="w-[90px]">
                      <label htmlFor={`mod-terminals-${selectedModule.uid}`} className="text-[11px] font-semibold text-slate-500 block">Ilość złączek</label>
                      <Input
                        id={`mod-terminals-${selectedModule.uid}`}
                        name={`mod-terminals-${selectedModule.uid}`}
                        type="number" min={3} max={300} step={3}
                        value={selectedModule.terminalCount || 15}
                        onChange={(e) => updateModule(selectedModule.uid, { terminalCount: parseInt(e.target.value) || 15 })}
                        className="h-6 text-[11px]"
                      />
                    </div>
                    <div className="w-[80px]">
                      <label htmlFor={`mod-mat-${selectedModule.uid}`} className="text-[11px] font-semibold text-slate-500 block">Materiał (zł)</label>
                      {isPro ? (
                        <Input
                          id={`mod-mat-${selectedModule.uid}`}
                          name={`mod-mat-${selectedModule.uid}`}
                          aria-label="Cena materiału"
                          type="number" min={0} step={0.01}
                          placeholder={String(Math.round(selectedModule.module.defaultPrice * manufacturerCoeff * 100) / 100)}
                          value={selectedModule.customMaterialPrice ?? ""}
                          onChange={(e) => updateModule(selectedModule.uid, { customMaterialPrice: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })}
                          className="h-6 text-[11px]"
                        />
                      ) : (
                        <div className="h-6 flex items-center text-[11px] text-slate-400 font-medium">***</div>
                      )}
                    </div>
                    <div className="w-[80px]">
                      <label htmlFor={`mod-lab-${selectedModule.uid}`} className="text-[11px] font-semibold text-slate-500 block">Robocizna (zł)</label>
                      {isPro ? (
                        <Input
                          id={`mod-lab-${selectedModule.uid}`}
                          name={`mod-lab-${selectedModule.uid}`}
                          aria-label="Cena robocizny"
                          type="number" min={0} step={0.01}
                          placeholder={String(selectedModule.module.defaultLaborPrice)}
                          value={selectedModule.customLaborPrice ?? ""}
                          onChange={(e) => updateModule(selectedModule.uid, { customLaborPrice: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })}
                          className="h-6 text-[11px]"
                        />
                      ) : (
                        <div className="h-6 flex items-center text-[11px] text-slate-400 font-medium">***</div>
                      )}
                    </div>
                    {isPro && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-shrink-0 pb-0.5">
                        <span>Mat: <strong className="text-slate-700 dark:text-slate-300">{getModulePrice(selectedModule, manufacturerCoeff).material.toFixed(0)}</strong></span>
                        <span>Rob: <strong className="text-slate-700 dark:text-slate-300">{getModulePrice(selectedModule, manufacturerCoeff).labor.toFixed(0)}</strong></span>
                        <span>= <strong className="text-blue-600">{(getModulePrice(selectedModule, manufacturerCoeff).material + getModulePrice(selectedModule, manufacturerCoeff).labor).toFixed(0)} zł</strong></span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                      onClick={() => { setSelectedUid(null); toast({ title: "Zapisano", description: selectedModule.module.namePl }); }}
                    >
                      <Check className="w-3 h-3" /> OK
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap bg-slate-50/80 dark:bg-slate-800/50 rounded-lg p-1.5 shadow-sm">
                      {selectedModule.module.ratingOptions && selectedModule.module.ratingOptions.length > 0 && (
                        <div className="w-[70px]">
                          <label className="text-[11px] font-semibold text-slate-500 block">Prąd</label>
                          <Select
                            name={`mod-rating-${selectedModule.uid}`}
                            value={String(selectedModule.rating ?? selectedModule.module.defaultRating)}
                            onValueChange={(v) => updateModule(selectedModule.uid, { rating: parseInt(v) })}
                          >
                            <SelectTrigger id={`mod-rating-${selectedModule.uid}`} aria-label="Prąd" className="h-6 text-[11px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {selectedModule.module.ratingOptions.map((r) => (
                                <SelectItem key={r} value={String(r)} className="text-xs">{r}A</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="w-[50px]">
                        <label htmlFor={`mod-circuit-${selectedModule.uid}`} className="text-[11px] font-semibold text-slate-500 block">Nr obw.</label>
                        <Input
                          id={`mod-circuit-${selectedModule.uid}`}
                          name={`mod-circuit-${selectedModule.uid}`}
                          value={selectedModule.circuitNumber || ""}
                          onChange={(e) => updateModule(selectedModule.uid, { circuitNumber: e.target.value })}
                          className="h-6 text-[11px]"
                          placeholder="1"
                        />
                      </div>
                      <div className="flex-1 min-w-[80px]">
                        <label htmlFor={`mod-label-${selectedModule.uid}`} className="text-[11px] font-semibold text-slate-500 block">Opis obwodu</label>
                        <Input
                          id={`mod-label-${selectedModule.uid}`}
                          name={`mod-label-${selectedModule.uid}`}
                          value={selectedModule.label || ""}
                          onChange={(e) => updateModule(selectedModule.uid, { label: e.target.value })}
                          className="h-6 text-[11px]"
                          placeholder="np. oświetlenie salon"
                        />
                      </div>
                      {selectedModule.module.modules === 1 && (
                        <div className="w-[70px]">
                          <label className="text-[11px] font-semibold text-slate-500 block">Faza</label>
                          <Select
                            name={`mod-phase-${selectedModule.uid}`}
                            value={selectedModule.phase || "__none__"}
                            onValueChange={(v) => updateModule(selectedModule.uid, { phase: v === "__none__" ? undefined : v as "L1" | "L2" | "L3" })}
                          >
                            <SelectTrigger id={`mod-phase-${selectedModule.uid}`} aria-label="Faza" className="h-6 text-[10px]"><SelectValue placeholder="Brak" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__" className="text-xs">Brak</SelectItem>
                              <SelectItem value="L1" className="text-xs">L1 <span className="text-[#78350f]">●</span></SelectItem>
                              <SelectItem value="L2" className="text-xs">L2 <span className="text-black">●</span></SelectItem>
                              <SelectItem value="L3" className="text-xs">L3 <span className="text-gray-500">●</span></SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {(selectedModule.module.category === "breaker" || selectedModule.module.category === "rcbo") && (
                        <div className="w-[110px]">
                          <label className="text-[11px] font-semibold text-slate-500 block">Przewód</label>
                          <Select
                            name={`mod-cable-${selectedModule.uid}`}
                            value={selectedModule.cableType || ""}
                            onValueChange={(v) => updateModule(selectedModule.uid, { cableType: v })}
                          >
                            <SelectTrigger id={`mod-cable-${selectedModule.uid}`} aria-label="Typ przewodu" className="h-6 text-[10px]"><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>
                              {CABLE_TYPES.map((c) => (
                                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="w-[80px]">
                      <label htmlFor={`mod-mat2-${selectedModule.uid}`} className="text-[11px] font-semibold text-slate-500 block">Materiał (zł)</label>
                      {isPro ? (
                        <Input
                          id={`mod-mat2-${selectedModule.uid}`}
                          name={`mod-mat2-${selectedModule.uid}`}
                          aria-label="Cena materiału"
                          type="number" min={0} step={0.01}
                          value={selectedModule.customMaterialPrice ?? Math.round(selectedModule.module.defaultPrice * manufacturerCoeff * 100) / 100}
                          onChange={(e) => updateModule(selectedModule.uid, { customMaterialPrice: parseFloat(e.target.value) || 0 })}
                          className="h-6 text-[11px]"
                        />
                      ) : (
                        <div className="h-6 flex items-center text-[11px] text-slate-400 font-medium">***</div>
                      )}
                    </div>
                    <div className="w-[80px]">
                      <label htmlFor={`mod-lab2-${selectedModule.uid}`} className="text-[11px] font-semibold text-slate-500 block">Robocizna (zł)</label>
                      {isPro ? (
                        <Input
                          id={`mod-lab2-${selectedModule.uid}`}
                          name={`mod-lab2-${selectedModule.uid}`}
                          aria-label="Cena robocizny"
                          type="number" min={0} step={0.01}
                          value={selectedModule.customLaborPrice ?? selectedModule.module.defaultLaborPrice}
                          onChange={(e) => updateModule(selectedModule.uid, { customLaborPrice: parseFloat(e.target.value) || 0 })}
                          className="h-6 text-[11px]"
                        />
                      ) : (
                        <div className="h-6 flex items-center text-[11px] text-slate-400 font-medium">***</div>
                      )}
                    </div>
                    {isPro && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 flex-shrink-0 pb-0.5">
                        <span>Mat: <strong className="text-slate-700 dark:text-slate-300">{getModulePrice(selectedModule, manufacturerCoeff).material.toFixed(0)}</strong></span>
                        <span>Rob: <strong className="text-slate-700 dark:text-slate-300">{getModulePrice(selectedModule, manufacturerCoeff).labor.toFixed(0)}</strong></span>
                        <span>= <strong className="text-blue-600">{(getModulePrice(selectedModule, manufacturerCoeff).material + getModulePrice(selectedModule, manufacturerCoeff).labor).toFixed(0)} zł</strong></span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                      onClick={() => { setSelectedUid(null); toast({ title: "Zapisano", description: selectedModule.module.namePl }); }}
                    >
                      <Zap className="w-3 h-3" /> OK
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
});
