"use client";
import React, { useCallback } from "react";
import { Zap, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import type { PanelSection, PanelTemplate, RailModule, ValidationIssue } from "@/components/project/panel-configurator-types";
import type { SectionTree, CircuitNode } from "@/app/dashboard/panel-configurator/ai-schemat-action";
import type { SchematDevice, SchematSection, SchematConfig } from "@/lib/schemat-svg-renderer";
import { renderSchematPages, combinePagesToSvg, suggestCable as suggestCableForSchematic } from "@/lib/schemat-svg-renderer";
import { SECTION_FEED_LABELS } from "./panel-configurator-helpers";
import { SchematToolbar } from "@/components/project/_parts/SchematToolbar";
import { SchematCircuitsTable } from "@/components/project/_parts/SchematCircuitsTable";

export interface AiUsageInfo { used: number; limit: number; isPro: boolean; }

export interface PanelSchematTabProps {
  sections: PanelSection[];
  allModules: RailModule[];
  panelName: string;
  selectedManufacturerName: string;
  allCriticalErrors: ValidationIssue[];
  aiSchematTrees: SectionTree[];
  setAiSchematTrees: (v: SectionTree[]) => void;
  aiSchematLoading: boolean;
  setAiSchematLoading: (v: boolean) => void;
  aiUsageInfo: AiUsageInfo | null;
  setAiUsageInfo: (v: AiUsageInfo | null) => void;
  aiValidationNotes: string[];
  setAiValidationNotes: (v: string[]) => void;
  schematSvgRef: React.MutableRefObject<string>;
  schematReadyRef: React.MutableRefObject<boolean>;
  circuitEditCell: { uid: string; field: "cableType" | "label" } | null;
  setCircuitEditCell: (v: { uid: string; field: "cableType" | "label" } | null) => void;
  updateModule: (uid: string, updates: Partial<RailModule>) => void;
  applyTemplate: (tpl: PanelTemplate) => void;
  setActiveTab: (v: string) => void;
  setSelectedUid: (uid: string | null) => void;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

const CIRCUIT_CATS_NAV = new Set(["breaker", "rcbo", "contactor", "motor_control", "timer"]);

export function PanelSchematTab(props: PanelSchematTabProps) {
  const { sections, allModules, panelName, selectedManufacturerName, allCriticalErrors, aiSchematTrees, setAiSchematTrees, aiSchematLoading, setAiSchematLoading, aiUsageInfo, setAiUsageInfo, aiValidationNotes, setAiValidationNotes, schematSvgRef, schematReadyRef, circuitEditCell, setCircuitEditCell, updateModule, applyTemplate, setActiveTab, setSelectedUid, toast } = props;

  const handleNavigateToIssue = useCallback((checkId: string) => {
    const allMods = sections.flatMap(s => s.modules);
    let targetUid: string | undefined;
    switch (checkId) {
      case "circuit_numbers":
        targetUid = allMods.find(m => CIRCUIT_CATS_NAV.has(m.module.category) && !m.circuitNumber)?.uid;
        break;
      case "circuit_labels":
        targetUid = allMods.find(m => CIRCUIT_CATS_NAV.has(m.module.category) && !m.label)?.uid;
        break;
      case "cable_types":
        targetUid = allMods.find(m => CIRCUIT_CATS_NAV.has(m.module.category) && !m.cableType)?.uid;
        break;
      case "rcd_coverage": {
        outer: for (const sec of sections) {
          let rcd: RailModule | null = null;
          let childCount = 0;
          for (const m of sec.modules) {
            if (m.module.category === "rcd") {
              if (rcd && childCount === 0) { targetUid = rcd.uid; break outer; }
              rcd = m; childCount = 0;
            } else if (m.module.category === "breaker" && rcd) {
              childCount++;
            }
          }
          if (rcd && childCount === 0) { targetUid = rcd.uid; break; }
        }
        break;
      }
      default:
        break;
    }
    setActiveTab("build");
    if (targetUid) setTimeout(() => setSelectedUid(targetUid!), 100);
  }, [sections, setActiveTab, setSelectedUid]);

  return (
    <TabsContent value="schemat" className="mt-3">
      {(() => {
// Build circuit tree from all sections
      const allMods = sections.flatMap((sec, secIdx) => sec.modules.map(m => ({ ...m, secIdx, secName: sec.name })));
      const mainSwitches = allMods.filter(m => m.module.id.startsWith("main-switch") || m.module.id.startsWith("mccb") || m.module.id.startsWith("acb") || m.module.id.startsWith("szr"));
      const spds = allMods.filter(m => m.module.category === "spd");
      const rcds = allMods.filter(m => m.module.category === "rcd");
      const rcbos = allMods.filter(m => m.module.category === "rcbo");
      const breakers = allMods.filter(m => m.module.category === "breaker" && !m.module.id.startsWith("main-switch") && !m.module.id.startsWith("mccb") && !m.module.id.startsWith("acb") && !m.module.id.startsWith("szr"));
      const contactors = allMods.filter(m => m.module.category === "contactor" || m.module.category === "motor_control");

      // Auto-assign breakers to RCDs based on order (position in rail)
      const rcdGroups: { rcd: typeof allMods[0]; children: typeof allMods }[] = [];
      const unassigned: typeof allMods = [];

      if (rcds.length > 0) {
        // Group breakers by proximity to RCDs within same section
        for (const sec of sections) {
          const secMods = sec.modules;
          let currentRcd: typeof allMods[0] | null = null;
          let currentChildren: typeof allMods = [];

          for (const m of secMods) {
            if (m.module.category === "rcd") {
              if (currentRcd) {
                rcdGroups.push({ rcd: currentRcd, children: currentChildren });
              }
              currentRcd = { ...m, secIdx: sections.indexOf(sec), secName: sec.name };
              currentChildren = [];
            } else if (m.module.category === "breaker" && !m.module.id.startsWith("main-switch") && !m.module.id.startsWith("mccb") && !m.module.id.startsWith("acb")) {
              if (currentRcd) {
                currentChildren.push({ ...m, secIdx: sections.indexOf(sec), secName: sec.name });
              } else {
                unassigned.push({ ...m, secIdx: sections.indexOf(sec), secName: sec.name });
              }
            }
          }
          if (currentRcd) {
            rcdGroups.push({ rcd: currentRcd, children: currentChildren });
          }
        }
      } else {
        unassigned.push(...breakers);
      }

      // Count circuits for completeness check
      const allCircuits = [...breakers, ...rcbos, ...contactors];
      const withLabel = allCircuits.filter(m => m.label);
      const withCable = allCircuits.filter(m => m.cableType);
      const withNumber = allCircuits.filter(m => m.circuitNumber);
      const completeness = allCircuits.length > 0 ? Math.round((withLabel.length + withCable.length + withNumber.length) / (allCircuits.length * 3) * 100) : 0;

      // ── Convert RailModule → SchematDevice ──
      const convertModule = (m: RailModule): SchematDevice => {
        const id = m.module.id;
        const cat = m.module.category;
        let type: SchematDevice["type"] = "other";
        if (id.startsWith("main-switch") || id.startsWith("mccb") || id.startsWith("acb") || id.startsWith("szr")) type = "main_switch";
        else if (cat === "spd") type = "spd";
        else if (cat === "rcd") type = "rcd";
        else if (cat === "rcbo") type = "rcbo";
        else if (cat === "breaker") type = "mcb";
        else if (cat === "contactor") type = "contactor";
        else if (cat === "motor_control") type = "motor_starter";
        else if (cat === "timer") type = "timer";
        else if (cat === "monitoring") type = "monitoring";

        const poles = id.includes("-4p") ? 4 : id.includes("-3p") ? 3 : id.includes("-2p") ? 2 : (cat === "rcd" ? 2 : 1);
        let spdLabel: string | undefined;
        if (cat === "spd") {
          if (id.includes("t1t2")) spdLabel = "SPD T1+T2";
          else if (id.includes("t2-3p")) spdLabel = "SPD T2 3P";
          else if (id.includes("t2")) spdLabel = "SPD T2";
          else if (id.includes("t3")) spdLabel = "SPD T3";
          else if (id.includes("dc")) spdLabel = "SPD DC";
          else spdLabel = "SPD";
        }
        let rcdSensitivity: string | undefined;
        let rcdType: string | undefined;
        if (cat === "rcd") {
          rcdSensitivity = id.includes("-300") ? "300mA" : "30mA";
          rcdType = (id.includes("-b-") || id.includes("-b_")) ? "B" : (id.includes("-a-") || id.includes("-a_") || id.endsWith("-a")) ? "A" : "AC";
        }

        return {
          uid: m.uid, moduleId: id, name: m.module.namePl, type,
          rating: m.rating || m.module.defaultRating, label: m.label,
          circuitNumber: m.circuitNumber, cableType: m.cableType,
          phase: m.phase, poles, rcdSensitivity, rcdType, spdLabel,
        };
      };

      // ── Build SchematSection[] from panel sections ──
      const schematSections: SchematSection[] = sections.map(sec => {
        const devices: SchematDevice[] = [];
        const secMods = sec.modules;

        // Main switches + SPDs first
        for (const m of secMods) {
          const id = m.module.id;
          if (id.startsWith("main-switch") || id.startsWith("mccb") || id.startsWith("acb") || id.startsWith("szr")) {
            devices.push(convertModule(m));
          }
        }
        for (const m of secMods) {
          if (m.module.category === "spd") devices.push(convertModule(m));
        }

        // Group breakers under RCDs by rail order
        let curRcd: SchematDevice | null = null;
        let curChildren: SchematDevice[] = [];
        const directDevs: SchematDevice[] = [];

        for (const m of secMods) {
          const cat = m.module.category;
          const id = m.module.id;
          if (cat === "rcd") {
            if (curRcd) { curRcd.children = curChildren; devices.push(curRcd); }
            curRcd = convertModule(m);
            curChildren = [];
          } else if (cat === "breaker" && !id.startsWith("main-switch") && !id.startsWith("mccb") && !id.startsWith("acb") && !id.startsWith("szr")) {
            if (curRcd) curChildren.push(convertModule(m));
            else directDevs.push(convertModule(m));
          } else if (cat === "rcbo" || cat === "contactor" || cat === "motor_control" || cat === "timer" || cat === "monitoring") {
            directDevs.push(convertModule(m));
          }
        }
        if (curRcd) { curRcd.children = curChildren; devices.push(curRcd); }
        devices.push(...directDevs);

        return {
          name: sec.name,
          feedLabel: `${SECTION_FEED_LABELS[sec.feed]} · ${sec.enclosure.name} · ${sec.modules.length} urz.`,
          enclosureName: sec.enclosure.name,
          moduleCount: sec.modules.length,
          devices,
        };
      });

      // schematSections built but NOT auto-rendered — user must click "Generuj schemat (AI)"

      return (
        <div className="space-y-4">
          <SchematToolbar
            sections={sections}
            allModules={allModules}
            allCriticalErrors={allCriticalErrors}
            aiSchematTrees={aiSchematTrees}
            aiSchematLoading={aiSchematLoading}
            aiUsageInfo={aiUsageInfo}
            completeness={completeness}
            withNumber={withNumber as RailModule[]}
            withLabel={withLabel as RailModule[]}
            withCable={withCable as RailModule[]}
            allCircuits={allCircuits as RailModule[]}
            setAiSchematTrees={setAiSchematTrees}
            setAiSchematLoading={setAiSchematLoading}
            setAiUsageInfo={setAiUsageInfo}
            setAiValidationNotes={setAiValidationNotes}
            applyTemplate={applyTemplate}
            onNavigateToIssue={handleNavigateToIssue}
            toast={toast}
          />

          {/* SVG Preview Card */}
          <Card>
            <CardContent className="pt-4 pb-4">

              {/* Render SVG: ONLY when AI trees are generated (canvas blank until user clicks button) */}
              {(() => {
                // ── Animated loading overlay when AI is generating ──
                if (aiSchematLoading) {
                  return (
                    <div className="relative flex flex-col items-center justify-center py-16 text-center border-2 border-orange-300 dark:border-orange-700 rounded-lg bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(251,146,60,0.08)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" style={{ backgroundSize: '200% 100%' }} />
                      <div className="relative space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                          <Sparkles className="w-8 h-8 text-white animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-orange-900 dark:text-orange-100">Silnik inżynieryjny analizuje obwody...</p>
                          <p className="text-[11px] text-orange-700 dark:text-orange-300 mt-1">ElektroSmart AI Engine | PN-HD 60364 | PN-EN 61439</p>
                        </div>
                        <div className="flex flex-col gap-1.5 text-left mx-auto max-w-xs">
                          {["Analiza topologii obwodów", "Grupowanie RCD → MCB", "Balansowanie faz L1/L2/L3", "Generowanie schematu jednokreskowego"].map((step, i) => (
                            <div key={step} className="flex items-center gap-2 text-[10px] text-orange-800 dark:text-orange-200" style={{ animationDelay: `${i * 0.4}s` }}>
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                let displaySvg = "";

                // ── Empty state: no modules added yet ──
                if (allModules.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl bg-gradient-to-br from-blue-50/60 to-slate-50 dark:from-blue-950/20 dark:to-slate-900">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Schemat wieloliniowy ES-Engine</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Dodaj moduły w zakładce <strong>Konstruktor</strong>, a następnie wygeneruj schemat</p>
                    </div>
                  );
                }

                // ── Compute readiness inline (same logic as SchematToolbar) ──
                const CIRCUIT_CATS_LOCAL = new Set(["breaker", "rcbo", "contactor", "motor_control", "timer"]);
                const SKIP_CATS_LOCAL    = new Set(["terminal", "consumable", "wiring", "labor", "enclosure", "spd", "monitoring", "automation", "compensation"]);
                const allModsLocal       = sections.flatMap(s => s.modules);
                const circuitsLocal      = allModsLocal.filter(m => CIRCUIT_CATS_LOCAL.has(m.module.category));
                const missingNum         = circuitsLocal.filter(m => !m.circuitNumber).length;
                const missingLabel       = circuitsLocal.filter(m => !m.label).length;
                const missingCable       = circuitsLocal.filter(m => !m.cableType).length;
                const isDataReady        = circuitsLocal.length > 0 && missingNum === 0 && missingLabel === 0 && missingCable === 0 && allCriticalErrors.length === 0;

                // ── Not ready: show waiting placeholder ──
                if (aiSchematTrees.length === 0 && !isDataReady) {
                  schematSvgRef.current = "";
                  schematReadyRef.current = false;
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-br from-slate-50/80 to-slate-100/40 dark:from-slate-900/50 dark:to-slate-800/20">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center mb-4 shadow-lg shadow-slate-400/20">
                        <Sparkles className="w-8 h-8 text-white opacity-60" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Czekam na pełny rozdział obwodów i faz...</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-xs">
                        Uzupełnij dane w zakładce <strong className="text-slate-600 dark:text-slate-300">Konstruktor</strong>:<br/>
                        numery obwodów, opisy i przekroje przewodów
                      </p>
                      {circuitsLocal.length > 0 && (
                        <div className="flex gap-3 mt-3 text-[10px] text-slate-400">
                          {missingNum > 0 && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-500 dark:bg-red-950/30 border border-red-100 dark:border-red-900">{missingNum} bez nr</span>}
                          {missingLabel > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">{missingLabel} bez opisu</span>}
                          {missingCable > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900">{missingCable} bez przewodu</span>}
                        </div>
                      )}
                    </div>
                  );
                }

                // ── Ready state: all data filled, AI not yet triggered ──
                if (aiSchematTrees.length === 0) {
                  schematSvgRef.current = "";
                  schematReadyRef.current = false;
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-xl bg-gradient-to-br from-emerald-50/60 to-green-50/40 dark:from-emerald-950/20 dark:to-green-950/10">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                        <Zap className="w-8 h-8 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dane rozdzielnicy gotowe — 100%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                        Naciśnij przycisk <strong className="text-emerald-600">Generuj schemat (ES-Engine)</strong>, aby wygenerować schemat wieloliniowy
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2">
                        {allModules.length} modułów · {circuitsLocal.length} obwodów · {sections.length} {sections.length === 1 ? "sekcja" : "sekcji"}
                      </p>
                    </div>
                  );
                }

                if (aiSchematTrees.length > 0) {
                  // ── Convert CircuitNode[] → SchematDevice[] ──
                  const convertAiNode = (node: CircuitNode, has3Ph: boolean): SchematDevice => {
                    const id = (node.moduleId || "").toLowerCase();
                    const nm = (node.namePl || "").toLowerCase();
                    let poles = 1;
                    if (id.includes("-4p") || nm.includes("4p")) poles = 4;
                    else if (id.includes("-3p") || nm.includes("3p") || nm.includes("3-fazowy")) poles = 3;
                    else if (has3Ph) {
                      if (node.type === "main_switch") poles = 4;
                      else if (node.type === "rcd") poles = 4;
                      else if (node.type === "spd") poles = 3;
                    }
                    let spdLabel: string | undefined;
                    if (node.type === "spd") {
                      if (id.includes("t1t2")) spdLabel = "SPD T1+T2";
                      else if (id.includes("t2-3p")) spdLabel = "SPD T2 3P";
                      else if (id.includes("t2")) spdLabel = "SPD T2";
                      else spdLabel = "SPD";
                    }
                    let rcdSensitivity: string | undefined;
                    let rcdType: string | undefined;
                    if (node.type === "rcd") {
                      rcdSensitivity = id.includes("-300") ? "300mA" : "30mA";
                      rcdType = id.includes("-b-") ? "B" : (id.includes("-a-") || id.endsWith("-a")) ? "A" : "AC";
                    }
                    const children = node.children?.map(c => convertAiNode(c, has3Ph));
                    return {
                      uid: node.uid, moduleId: node.moduleId, name: node.namePl, type: node.type,
                      rating: node.rating, label: node.label, circuitNumber: node.circuitNumber,
                      cableType: node.cableType, phase: node.phase, poles,
                      rcdSensitivity, rcdType, spdLabel, children,
                    };
                  };

                  const aiSections: SchematSection[] = aiSchematTrees.map(tree => {
                    const has3Ph = !!(tree.supply?.includes("3~") || tree.supply?.includes("400V") || tree.supply?.includes("3NPE")
                      || tree.nodes.some(n => {
                        const nid = (n.moduleId || "").toLowerCase();
                        const nnm = (n.namePl || "").toLowerCase();
                        return nid.includes("-3p") || nid.includes("-4p") || nnm.includes("3p") || nnm.includes("4p");
                      }));
                    return {
                      name: tree.sectionName,
                      feedLabel: `${tree.feed} · ${tree.supply}`,
                      enclosureName: "",
                      moduleCount: tree.nodes.length,
                      devices: tree.nodes.map(n => convertAiNode(n, has3Ph)),
                    };
                  });

                  const aiConfig: SchematConfig = {
                    panelName: panelName || "Rozdzielnica",
                    manufacturerName: selectedManufacturerName,
                    sections: aiSections,
                    isAiGenerated: true,
                  };
                  const aiPages = renderSchematPages(aiConfig);
                  displaySvg = combinePagesToSvg(aiPages);
                }
                if (displaySvg) { schematSvgRef.current = displaySvg; schematReadyRef.current = true; }

                return (
                  <>
                    {/* AI validation notes / warnings */}
                    {aiValidationNotes.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {aiValidationNotes.map((note, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                            <span className="text-amber-500 text-sm flex-shrink-0">⚠️</span>
                            <p className="text-xs text-amber-800 dark:text-amber-200">{note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div key={`${JSON.stringify(aiSchematTrees)}-${allModules.length}`} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white">
                      <div dangerouslySetInnerHTML={{ __html: displaySvg }} />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">Eksport SVG/PDF/DXF dostępny w zakładce <strong>Podsumowanie</strong></p>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <SchematCircuitsTable
            rcdGroups={rcdGroups}
            unassigned={unassigned}
            rcbos={rcbos}
            circuitEditCell={circuitEditCell}
            setCircuitEditCell={setCircuitEditCell}
            updateModule={updateModule}
          />
        </div>
      );      })()}
    </TabsContent>
  );
}
