"use client";

// =============================================
// PANEL CONFIGURATOR — DIN RAIL ROW COMPONENT
// =============================================
// Extracted from panel-configurator.tsx for maintainability.

import React from "react";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X, Plus } from "lucide-react";
import { getModuleAbbr, getModulePrice, getCategoryColor, getPhaseColor } from "./panel-configurator-helpers";
import type { DinRailRowProps, RailModule } from "./panel-configurator-types";

function DinRailRowInner({
  rowIndex,
  modules,
  modulesPerRow,
  onRemove,
  dragUid,
  onDragStart,
  onDragEnd,
  onDrop,
  selectedUid,
  onSelect,
  isPro,
  manufacturerCoeff,
  moduleIssues,
  zugReserveSlots = 0,
  isLastRow = false,
  activeSlot,
  onSlotClick,
  ghostModuleData,
}: DinRailRowProps) {
  const usedSlots = modules.reduce((s, vm) => s + vm.visualWidth, 0);
  const freeSlots = Math.max(0, modulesPerRow - usedSlots);

  const getShortName = (m: RailModule) => getModuleAbbr(m.module.id, m.module.name);

  const getPhaseLabel = (phase: string): string => {
    switch (phase) { case "L1": return "L1"; case "L2": return "L2"; case "L3": return "L3"; default: return ""; }
  };

  const is3PoleModule = (m: RailModule): boolean => {
    return m.module.modules >= 3 && (
      m.module.id.includes("-3p") || m.module.id.includes("-4p") ||
      m.module.id.includes("3p") ||
      (m.module.category === "rcd" && m.module.modules >= 4)
    );
  };

  return (
    <div className="space-y-1.5" data-row={rowIndex}>
      <div className="flex items-center justify-between px-0.5">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
          Rząd {rowIndex + 1} — <span className="text-slate-700 dark:text-slate-300">{usedSlots}/{modulesPerRow}</span> mod.
        </span>
        {usedSlots > modulesPerRow && (
          <Badge variant="destructive" className="text-[11px] px-2 py-0.5">Przepełniony!</Badge>
        )}
      </div>

      {/* DIN Rail Visual — TH35 */}
      <div className="relative rounded-lg p-1 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 min-h-[120px]">
        {/* DIN Rail TH35 metal bar */}
        <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[8px] rounded-[1px] bg-slate-300 dark:bg-slate-600 shadow-sm" />

        <div className="flex items-stretch gap-[1px] relative z-10 w-full">
          {modules.map((vm) => {
            const placed = vm.source;
            const width = vm.visualWidth;
            const Icon = placed.module.icon;
            const catColor = getCategoryColor(placed.module.category);
            const isDragging = dragUid === placed.uid;
            const isDropTarget = dragUid !== null && dragUid !== placed.uid;
            const isSelected = selectedUid === placed.uid;
            const prices = getModulePrice(placed, manufacturerCoeff);
            const shortName = getShortName(placed);
            const issue = moduleIssues.get(placed.uid);
            const hasError = issue?.severity === "error";
            const hasWarning = issue?.severity === "warning";
            const hasIssue = !!issue;
            const key = vm.isFragment ? `${placed.uid}-frag-${vm.fragmentIndex}` : placed.uid;
            const is3P = is3PoleModule(placed);
            const pct = (width / modulesPerRow) * 100;

            return (
              <div
                key={key}
                className={`group relative ${isDragging ? "opacity-30 scale-95" : ""} ${isDropTarget ? "hover:ring-2 hover:ring-blue-400 rounded" : ""} ${isSelected ? "ring-2 ring-yellow-400 ring-offset-1 rounded z-30" : ""} transition-all duration-150`}
                style={{ width: `calc(${pct}% - 1px)`, flexShrink: 0 }}
                title={`${placed.module.namePl}${placed.rating ? ` ${placed.rating}A` : ""}${vm.isFragment ? ` (cz. ${(vm.fragmentIndex || 0) + 1}/${vm.fragmentTotal})` : ""}\n${isPro ? `Mat: ${prices.material} zł | Rob: ${prices.labor} zł` : "Mat: *** zł | Rob: *** zł"}${issue ? `\n⚠ ${issue.messages.join("\n⚠ ")}` : ""}`}
                draggable={!vm.isFragment}
                onDragStart={(e) => {
                  if (vm.isFragment) { e.preventDefault(); return; }
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", placed.uid);
                  onDragStart(placed.uid);
                }}
                onDragEnd={() => onDragEnd()}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => { e.preventDefault(); const fromUid = e.dataTransfer.getData("text/plain"); if (fromUid) onDrop(fromUid, placed.uid); }}
              >
                {/* Module body */}
                <div
                  onClick={(e) => { e.stopPropagation(); onSelect(placed.uid); }}
                  className="rounded-[4px] h-[110px] flex flex-col items-center justify-between relative overflow-hidden cursor-pointer transition-all duration-150 hover:brightness-110 hover:z-20 text-white py-1 shadow-sm"
                  style={{ backgroundColor: placed.isZugBlock ? "#94a3b8" : catColor, border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  {/* Issue overlay */}
                  {hasIssue && (
                    <div className={`absolute inset-0 rounded-[3px] pointer-events-none z-20 ${hasError ? "ring-2 ring-red-400 ring-inset" : hasWarning ? "ring-2 ring-amber-400 ring-inset" : "ring-1 ring-blue-400 ring-inset"}`} />
                  )}
                  {(hasError || hasWarning) && (
                    <div className={`absolute -top-1 -left-1 z-30 w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow ${hasError ? "bg-red-500" : "bg-amber-500"}`} title={issue?.messages.join("\n")}>!</div>
                  )}

                  {/* ZUG Block content */}
                  {placed.isZugBlock ? (
                    <div className="flex flex-col items-center justify-center flex-1 w-full">
                      <span className="text-[7px] font-bold uppercase tracking-wider text-slate-700 leading-none">
                        {vm.isFragment ? `ZUG ${(vm.fragmentIndex || 0) + 1}/${vm.fragmentTotal}` : "ZŁĄCZKI"}
                      </span>
                      <div className="bg-white text-black px-2 py-0.5 rounded shadow-sm text-xs font-bold mt-1 leading-none">
                        {vm.fragmentTerminalCount ?? placed.terminalCount ?? 15} szt. <span className="text-[8px] font-semibold text-slate-500">(L-N-PE)</span>
                      </div>
                      <div className="w-4/5 h-[6px] rounded-sm mt-1.5" style={{ backgroundImage: "repeating-linear-gradient(to right, #78350f 0px, #78350f 6px, #1d4ed8 6px, #1d4ed8 12px, #22c55e 12px, #22c55e 18px)" }} />
                    </div>
                  ) : (
                    <>
                      {/* TOP ZONE: Icon + Phase dot */}
                      <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Icon className={`${width === 1 ? "w-3.5 h-3.5" : "w-4 h-4"} opacity-90`} />
                          {width === 1 && placed.phase && (
                            <div className="w-2 h-2 rounded-full border border-white/50" style={{ backgroundColor: getPhaseColor(placed.phase) }} title={placed.phase} />
                          )}
                          {is3P && <span className="text-[7px] font-bold opacity-80">3P</span>}
                        </div>
                        {/* Phase indicator bar */}
                        {is3P ? (
                          <div className="w-full h-[3px] flex rounded-full overflow-hidden">
                            <div className="flex-1" style={{ backgroundColor: "#92400e" }} />
                            <div className="flex-1" style={{ backgroundColor: "#1e293b" }} />
                            <div className="flex-1" style={{ backgroundColor: "#6b7280" }} />
                          </div>
                        ) : placed.phase ? (
                          <div className="w-full h-[3px] rounded-full" style={{ backgroundColor: getPhaseColor(placed.phase) }} />
                        ) : null}
                      </div>

                      {/* CENTER ZONE: Rating / Name */}
                      <div className="flex flex-col items-center justify-center flex-1 w-full min-h-0">
                        {placed.rating ? (
                          <span className={`${width === 1 ? "text-[11px] font-bold tracking-tighter truncate w-full text-center px-0.5" : "text-base font-bold"} leading-none`}>
                            {shortName}{placed.rating}
                          </span>
                        ) : (
                          <span className={`${width === 1 ? "text-[9px] font-bold tracking-tighter truncate w-full text-center px-0.5" : "text-xs font-bold"} leading-none`}>
                            {shortName}
                          </span>
                        )}
                        {width > 1 && placed.rating && (
                          <span className="text-[8px] font-medium opacity-70 leading-none mt-0.5">{shortName}</span>
                        )}
                      </div>

                      {/* BOTTOM ZONE: Label window */}
                      <div className="h-[16px] w-11/12 bg-white/95 text-black text-[9px] font-medium flex items-center justify-center truncate rounded-[2px] mb-0.5 mx-auto shadow-sm overflow-hidden flex-shrink-0">
                        {placed.label ? (
                          <span className="truncate px-0.5 text-slate-700">{placed.label}</span>
                        ) : placed.circuitNumber ? (
                          <span className="text-blue-600 font-bold text-[8px]">Obw.{placed.circuitNumber}</span>
                        ) : (
                          <span className="text-slate-300 text-[8px]">—</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Drag Handle */}
                  {!vm.isFragment && (
                    <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-70 transition-opacity z-30 pointer-events-none">
                      <GripVertical className="w-3 h-3 text-white/60" />
                    </div>
                  )}
                  {/* Delete button */}
                  {(!vm.isFragment || vm.fragmentIndex === 0) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemove(placed.uid); }}
                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow z-50"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty slots — with ZUG hatching on last row */}
          {freeSlots > 0 && (() => {
            const usedWidth = modules.reduce((s, vm) => s + vm.visualWidth, 0);
            // Ghost span: which absolute slot indices are covered by the ghost preview
            const ghostWidth = ghostModuleData?.width ?? 0;
            const activeRowMatch = activeSlot?.rowIdx === rowIndex;
            const ghostStart = activeRowMatch ? (activeSlot?.slotIdx ?? -1) : -1;
            const ghostEnd = ghostStart + ghostWidth - 1; // inclusive
            // Overflow: ghost doesn't fit in remaining free slots
            const nonZugFree = isLastRow && zugReserveSlots > 0
              ? freeSlots - zugReserveSlots
              : freeSlots;
            const ghostOverflows = ghostWidth > 0 && ghostWidth > nonZugFree;

            return Array.from({ length: freeSlots }).map((_, i) => {
              const slotFromEnd = freeSlots - i;
              const isZugReserved = isLastRow && zugReserveSlots > 0 && slotFromEnd <= zugReserveSlots;
              const isFirstZugSlot = isZugReserved && slotFromEnd === zugReserveSlots;
              const absoluteSlotIdx = usedWidth + i;
              const isActiveSlot = !isZugReserved && activeRowMatch && activeSlot?.slotIdx === absoluteSlotIdx;
              // Is this slot part of the ghost span?
              const isGhostSlot = !isZugReserved && activeRowMatch && ghostWidth > 0
                && absoluteSlotIdx >= ghostStart && absoluteSlotIdx <= ghostEnd;
              const isGhostFirst = isGhostSlot && absoluteSlotIdx === ghostStart;
              const isGhostLast = isGhostSlot && absoluteSlotIdx === ghostEnd;

              return (
                <div
                  key={`slot-${absoluteSlotIdx}`}
                  onClick={() => !isZugReserved && onSlotClick?.(rowIndex, absoluteSlotIdx)}
                  className={`group/empty h-[110px] flex flex-col items-center justify-center ${
                    isZugReserved
                      ? "border border-dashed border-amber-400/70 cursor-not-allowed rounded-[4px]"
                      : isGhostSlot && ghostOverflows
                        ? "border-2 border-red-400 bg-red-500/10 cursor-pointer rounded-[4px]"
                        : isGhostSlot
                          ? `cursor-pointer bg-blue-500/20 border-y-2 border-blue-500 shadow-[inset_0_0_8px_rgba(59,130,246,0.25)] ${
                              isGhostFirst ? "border-l-2 rounded-l-[4px]" : ""
                            } ${
                              isGhostLast ? "border-r-2 rounded-r-[4px]" : ""
                            }`
                        : isActiveSlot
                          ? "border-2 border-blue-500 bg-blue-500/15 cursor-pointer rounded-[4px] shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
                          : "border border-dashed border-slate-300/50 dark:border-slate-600/30 bg-slate-50/50 dark:bg-slate-800/20 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 cursor-pointer rounded-[4px]"
                  }`}
                  style={{
                    width: `calc(${(1 / modulesPerRow) * 100}% - 1px)`,
                    flexShrink: 0,
                    ...(isZugReserved ? {
                      background: "repeating-linear-gradient(45deg, rgba(251,191,36,0.12) 0px, rgba(251,191,36,0.12) 5px, rgba(251,191,36,0.03) 5px, rgba(251,191,36,0.03) 10px)",
                      borderColor: "rgba(251,191,36,0.6)",
                    } : {}),
                  }}
                  title={isZugReserved
                    ? `Rezerwa ZUG: ${zugReserveSlots} mod. = ceil(obwody × 0.5). Miejsce zarezerwowane na złączki szynowe.`
                    : isGhostSlot && ghostOverflows
                      ? `⚠ Za mało miejsca — ${ghostModuleData!.name} wymaga ${ghostWidth} mod., dostępne: ${nonZugFree}`
                      : isGhostSlot
                        ? `${ghostModuleData!.name} (${ghostWidth} mod.) — kliknij aby umieścić`
                        : isActiveSlot
                          ? "✅ Aktywne miejsce — kliknij urządzenie z katalogu aby umieścić"
                          : "Kliknij aby wybrać to miejsce na szynie"}
                >
                  {isZugReserved ? (
                    isFirstZugSlot ? (
                      <div className="flex flex-col items-center justify-center gap-0.5 select-none px-0.5">
                        <span className="text-[7px] font-black text-amber-600/80 tracking-widest uppercase leading-none">REZERWA</span>
                        <span className="text-[8px] font-black text-amber-500 tracking-wider leading-none">ZUG</span>
                        <span className="text-[7px] font-bold text-amber-600/70 leading-none">{zugReserveSlots} MOD</span>
                      </div>
                    ) : (
                      <span className="text-[7px] font-bold text-amber-400/50 select-none">·</span>
                    )
                  ) : isGhostSlot && ghostOverflows && isGhostFirst ? (
                    <div className="flex flex-col items-center gap-1 select-none">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                        <X className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="px-1 py-0.5 rounded bg-red-500 text-white text-[8px] font-black leading-none">BRAK</span>
                    </div>
                  ) : isGhostSlot && isGhostFirst ? (
                    <div className="flex flex-col items-center justify-center gap-1 px-0.5 select-none">
                      <div className="w-7 h-7 rounded-md bg-blue-500 border-2 border-blue-300 flex items-center justify-center shadow-md">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-[8px] font-bold text-blue-700 dark:text-blue-300 text-center leading-tight truncate w-full px-0.5">
                        {ghostModuleData!.name.length > 10 ? ghostModuleData!.name.slice(0, 9) + "…" : ghostModuleData!.name}
                      </span>
                      {ghostWidth > 1 && (
                        <span className="px-1 py-0.5 rounded-full bg-blue-600 text-white text-[7px] font-black leading-none">{ghostWidth}M</span>
                      )}
                    </div>
                  ) : isGhostSlot ? (
                    <div className="w-full h-full" />
                  ) : isActiveSlot ? (
                    <div className="flex flex-col items-center gap-1 select-none">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-black tracking-widest uppercase leading-none">TU</span>
                    </div>
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover/empty:text-blue-400 transition-colors" />
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized DinRailRow — skips re-render when props are shallowly equal.
 *
 * Custom comparator handles:
 *  - `modules` array: compared by uid+rating+label+phase+customName (not reference)
 *  - `moduleIssues` Map: compared by serialized entries (Map is always a new ref)
 *  - `dragUid` / `selectedUid`: primitive equality
 *  - callbacks (onRemove, onDragStart, etc.): assumed stable via useCallback in parent
 */
function arePropsEqual(prev: DinRailRowProps, next: DinRailRowProps): boolean {
  if (
    prev.rowIndex !== next.rowIndex ||
    prev.modulesPerRow !== next.modulesPerRow ||
    prev.dragUid !== next.dragUid ||
    prev.selectedUid !== next.selectedUid ||
    prev.isPro !== next.isPro ||
    prev.manufacturerCoeff !== next.manufacturerCoeff ||
    prev.zugReserveSlots !== next.zugReserveSlots ||
    prev.isLastRow !== next.isLastRow ||
    prev.modules.length !== next.modules.length ||
    // Slot selection — must re-render to show/hide TU indicator and ghost
    prev.activeSlot?.rowIdx !== next.activeSlot?.rowIdx ||
    prev.activeSlot?.slotIdx !== next.activeSlot?.slotIdx ||
    prev.ghostModuleData?.name !== next.ghostModuleData?.name ||
    prev.ghostModuleData?.width !== next.ghostModuleData?.width
  ) return false;

  // Deep-compare modules by key fields (avoids re-render on unrelated state changes)
  for (let i = 0; i < prev.modules.length; i++) {
    const pvm = prev.modules[i];
    const nvm = next.modules[i];
    const p = pvm.source;
    const n = nvm.source;
    if (
      p.uid !== n.uid ||
      p.rating !== n.rating ||
      p.label !== n.label ||
      p.phase !== n.phase ||
      p.customName !== n.customName ||
      p.customMaterialPrice !== n.customMaterialPrice ||
      p.customLaborPrice !== n.customLaborPrice ||
      p.quantity !== n.quantity ||
      p.terminalCount !== n.terminalCount ||
      pvm.visualWidth !== nvm.visualWidth ||
      pvm.isFragment !== nvm.isFragment
    ) return false;
  }

  // Compare moduleIssues Map by size + serialized keys
  if (prev.moduleIssues.size !== next.moduleIssues.size) return false;
  for (const [uid, issue] of prev.moduleIssues) {
    const nextIssue = next.moduleIssues.get(uid);
    if (!nextIssue || nextIssue.severity !== issue.severity) return false;
  }

  return true;
}

export const DinRailRow = React.memo(DinRailRowInner, arePropsEqual);
