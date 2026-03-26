"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, AlertTriangle, XCircle, Cable, Zap } from "lucide-react";
import { CircuitTable } from "./CircuitTable";
import { SECTION_FEED_LABELS } from "../panel-configurator-helpers";
import { renderSchematPages, combinePagesToSvg, suggestCable as suggestCableForSchematic, type SchematDevice, type SchematSection, type SchematConfig } from "@/lib/schemat-svg-renderer";
import { generateSchematWithAI, getAiUsage, type CircuitNode, type SectionTree } from "@/app/dashboard/panel-configurator/ai-schemat-action";
import type { PanelSection, RailModule } from "../panel-configurator-types";

type CircuitRow = RailModule & { secIdx: number; secName: string };

function convertModule(m: RailModule): SchematDevice {
  const id = m.module.id; const cat = m.module.category;
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
  if (cat === "spd") { spdLabel = id.includes("t1t2") ? "SPD T1+T2" : id.includes("t2-3p") ? "SPD T2 3P" : id.includes("t2") ? "SPD T2" : id.includes("t3") ? "SPD T3" : id.includes("dc") ? "SPD DC" : "SPD"; }
  let rcdSensitivity: string | undefined; let rcdType: string | undefined;
  if (cat === "rcd") { rcdSensitivity = id.includes("-300") ? "300mA" : "30mA"; rcdType = (id.includes("-b-") || id.includes("-b_")) ? "B" : (id.includes("-a-") || id.includes("-a_") || id.endsWith("-a")) ? "A" : "AC"; }
  return { uid: m.uid, moduleId: id, name: m.module.namePl, type, rating: m.rating || m.module.defaultRating, label: m.label, circuitNumber: m.circuitNumber, cableType: m.cableType, phase: m.phase, poles, rcdSensitivity, rcdType, spdLabel };
}

function convertAiNode(node: CircuitNode, has3Ph: boolean): SchematDevice {
  const id = (node.moduleId || "").toLowerCase(); const nm = (node.namePl || "").toLowerCase();
  let poles = 1;
  if (id.includes("-4p") || nm.includes("4p")) poles = 4;
  else if (id.includes("-3p") || nm.includes("3p") || nm.includes("3-fazowy")) poles = 3;
  else if (has3Ph) { if (node.type === "main_switch") poles = 4; else if (node.type === "rcd") poles = 4; else if (node.type === "spd") poles = 3; }
  let spdLabel: string | undefined;
  if (node.type === "spd") { spdLabel = id.includes("t1t2") ? "SPD T1+T2" : id.includes("t2-3p") ? "SPD T2 3P" : id.includes("t2") ? "SPD T2" : "SPD"; }
  let rcdSensitivity: string | undefined; let rcdType: string | undefined;
  if (node.type === "rcd") { rcdSensitivity = id.includes("-300") ? "300mA" : "30mA"; rcdType = id.includes("-b-") ? "B" : (id.includes("-a-") || id.endsWith("-a")) ? "A" : "AC"; }
  return { uid: node.uid, moduleId: node.moduleId, name: node.namePl, type: node.type, rating: node.rating, label: node.label, circuitNumber: node.circuitNumber, cableType: node.cableType, phase: node.phase, poles, rcdSensitivity, rcdType, spdLabel, children: node.children?.map((c: CircuitNode) => convertAiNode(c, has3Ph)) };
}

function buildSchematSections(sections: PanelSection[]): SchematSection[] {
  return sections.map(sec => {
    const devices: SchematDevice[] = [];
    for (const m of sec.modules) { const id = m.module.id; if (id.startsWith("main-switch") || id.startsWith("mccb") || id.startsWith("acb") || id.startsWith("szr")) devices.push(convertModule(m)); }
    for (const m of sec.modules) { if (m.module.category === "spd") devices.push(convertModule(m)); }
    let curRcd: SchematDevice | null = null; let curChildren: SchematDevice[] = []; const directDevs: SchematDevice[] = [];
    for (const m of sec.modules) {
      const cat = m.module.category; const id = m.module.id;
      if (cat === "rcd") { if (curRcd) { curRcd.children = curChildren; devices.push(curRcd); } curRcd = convertModule(m); curChildren = []; }
      else if (cat === "breaker" && !id.startsWith("main-switch") && !id.startsWith("mccb") && !id.startsWith("acb") && !id.startsWith("szr")) { if (curRcd) curChildren.push(convertModule(m)); else directDevs.push(convertModule(m)); }
      else if (cat === "rcbo" || cat === "contactor" || cat === "motor_control" || cat === "timer" || cat === "monitoring") { directDevs.push(convertModule(m)); }
    }
    if (curRcd) { curRcd.children = curChildren; devices.push(curRcd); }
    devices.push(...directDevs);
    return { name: sec.name, feedLabel: `${SECTION_FEED_LABELS[sec.feed]} · ${sec.enclosure.name} · ${sec.modules.length} urz.`, enclosureName: sec.enclosure.name, moduleCount: sec.modules.length, devices };
  });
}

function buildLiveSection(sec: PanelSection): SchematSection {
  const has3Ph = sec.modules.some(m => m.module.modules >= 3 && (m.module.id.includes("-3p") || m.module.id.includes("-4p")));
  const isEnergyMeter = (m: RailModule) => m.module.id.startsWith("energy-meter") || m.module.id.startsWith("ev-energy-meter");
  const isPvMeter = (m: RailModule) => isEnergyMeter(m) && (m.label?.toLowerCase().includes("pv") || m.module.id.includes("bidirect"));
  const ordered = [...sec.modules.filter(m => isEnergyMeter(m) && !isPvMeter(m)), ...sec.modules.filter(m => !isEnergyMeter(m)), ...sec.modules.filter(m => isPvMeter(m))];
  let circuitIdx = 1;
  const devices: SchematDevice[] = ordered.map(m => {
    const id = m.module.id.toLowerCase();
    let type: SchematDevice["type"] = "mcb";
    if (m.module.category === "rcd") type = "rcd";
    else if (m.module.category === "rcbo") type = "rcbo";
    else if (m.module.category === "spd") type = "spd";
    else if (id.includes("main-switch") || id.includes("changeover") || (m.module.category === "switch" && ordered.indexOf(m) === sec.modules.filter(x => isEnergyMeter(x) && !isPvMeter(x)).length)) type = "main_switch";
    else if (has3Ph && m.module.modules >= 3 && m.module.category === "breaker") type = "main_switch";
    const isMcbLike = type === "mcb" || type === "rcbo";
    const circNum = m.circuitNumber ?? (isMcbLike ? String(circuitIdx) : undefined);
    if (isMcbLike) circuitIdx++;
    let rcdSensitivity: string | undefined; let rcdType: string | undefined;
    if (type === "rcd" || type === "rcbo") { rcdSensitivity = id.includes("-300") ? "300mA" : "30mA"; rcdType = id.includes("-b-") ? "B" : id.includes("-a-") || id.endsWith("-a") ? "A" : "AC"; }
    let spdLabel: string | undefined;
    if (type === "spd") { spdLabel = id.includes("t1t2") ? "SPD T1+T2" : id.includes("t2-3p") ? "SPD T2 3P" : "SPD T2"; }
    const poles = has3Ph && (type === "main_switch" || type === "rcd") && m.module.modules < 3 ? 4 : m.module.modules || 1;
    const cable = m.cableType ?? suggestCableForSchematic(m.rating ?? m.module.defaultRating ?? 16, poles);
    return { uid: m.uid, moduleId: m.module.id, name: m.module.namePl, type, rating: m.rating ?? m.module.defaultRating, label: m.label, circuitNumber: circNum, cableType: cable, phase: m.phase, poles, rcdSensitivity, rcdType, spdLabel };
  });
  return { name: sec.name, feedLabel: SECTION_FEED_LABELS[sec.feed] ?? sec.feed, enclosureName: sec.enclosure.name, moduleCount: sec.modules.length, devices };
}

export interface SchematViewProps {
  sections: PanelSection[];
  allModules: RailModule[];
  panelName: string;
  selectedManufacturer: { name: string };
  aiSchematTrees: SectionTree[];
  setAiSchematTrees: (trees: SectionTree[]) => void;
  aiSchematLoading: boolean;
  setAiSchematLoading: (v: boolean) => void;
  aiUsageInfo: { used: number; limit: number; isPro: boolean } | null;
  setAiUsageInfo: (info: { used: number; limit: number; isPro: boolean } | null) => void;
  allCriticalErrors: { id: string; message: string; severity: string }[];
  schematSvgRef: React.MutableRefObject<string>;
  schematReadyRef: React.MutableRefObject<boolean>;
  circuitEditCell: { uid: string; field: "cableType" | "label" } | null;
  setCircuitEditCell: (cell: { uid: string; field: "cableType" | "label" } | null) => void;
  updateModule: (uid: string, updates: Partial<RailModule>) => void;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export const SchematView = React.memo(function SchematView({
  sections, allModules, panelName, selectedManufacturer,
  aiSchematTrees, setAiSchematTrees, aiSchematLoading, setAiSchematLoading,
  aiUsageInfo, setAiUsageInfo, allCriticalErrors,
  schematSvgRef, schematReadyRef,
  circuitEditCell, setCircuitEditCell, updateModule, toast,
}: SchematViewProps) {
  // ── Circuit grouping for table ──
  const allMods: CircuitRow[] = sections.flatMap((sec, secIdx) => sec.modules.map(m => ({ ...m, secIdx, secName: sec.name })));
  const rcds = allMods.filter(m => m.module.category === "rcd");
  const rcbos = allMods.filter(m => m.module.category === "rcbo");
  const breakers = allMods.filter(m => m.module.category === "breaker" && !m.module.id.startsWith("main-switch") && !m.module.id.startsWith("mccb") && !m.module.id.startsWith("acb") && !m.module.id.startsWith("szr"));
  const contactors = allMods.filter(m => m.module.category === "contactor" || m.module.category === "motor_control");

  const rcdGroups: { rcd: CircuitRow; children: CircuitRow[] }[] = [];
  const unassigned: CircuitRow[] = [];
  if (rcds.length > 0) {
    for (const sec of sections) {
      let curRcd: CircuitRow | null = null; let curChildren: CircuitRow[] = [];
      for (const m of sec.modules) {
        if (m.module.category === "rcd") { if (curRcd) rcdGroups.push({ rcd: curRcd, children: curChildren }); curRcd = { ...m, secIdx: sections.indexOf(sec), secName: sec.name }; curChildren = []; }
        else if (m.module.category === "breaker" && !m.module.id.startsWith("main-switch") && !m.module.id.startsWith("mccb") && !m.module.id.startsWith("acb")) { if (curRcd) curChildren.push({ ...m, secIdx: sections.indexOf(sec), secName: sec.name }); else unassigned.push({ ...m, secIdx: sections.indexOf(sec), secName: sec.name }); }
      }
      if (curRcd) rcdGroups.push({ rcd: curRcd, children: curChildren });
    }
  } else { unassigned.push(...breakers); }

  const allCircuits = [...breakers, ...rcbos, ...contactors];
  const withLabel = allCircuits.filter(m => m.label);
  const withCable = allCircuits.filter(m => m.cableType);
  const withNumber = allCircuits.filter(m => m.circuitNumber);
  const completeness = allCircuits.length > 0 ? Math.round((withLabel.length + withCable.length + withNumber.length) / (allCircuits.length * 3) * 100) : 0;

  // ── SVG computation ──
  const schematSections = buildSchematSections(sections);
  const finalSvg = combinePagesToSvg(renderSchematPages({ panelName: panelName || "Rozdzielnica", manufacturerName: selectedManufacturer.name, sections: schematSections, isAiGenerated: false }));
  if (completeness >= 100) { schematSvgRef.current = finalSvg; schematReadyRef.current = true; }
  else { schematSvgRef.current = ""; schematReadyRef.current = false; }

  let displaySvg = "";
  if (aiSchematTrees.length === 0 && allModules.length > 0) {
    displaySvg = combinePagesToSvg(renderSchematPages({ panelName: panelName || "Rozdzielnica", manufacturerName: selectedManufacturer.name, sections: sections.map(buildLiveSection), isAiGenerated: false }));
  }
  if (aiSchematTrees.length > 0) {
    const aiSections: SchematSection[] = aiSchematTrees.map(tree => {
      const has3Ph = !!(tree.supply?.includes("3~") || tree.supply?.includes("400V") || tree.supply?.includes("3NPE") || tree.nodes.some((n: CircuitNode) => { const nid = (n.moduleId || "").toLowerCase(); const nnm = (n.namePl || "").toLowerCase(); return nid.includes("-3p") || nid.includes("-4p") || nnm.includes("3p") || nnm.includes("4p"); }));
      return { name: tree.sectionName, feedLabel: `${tree.feed} · ${tree.supply}`, enclosureName: "", moduleCount: tree.nodes.length, devices: tree.nodes.map((n: CircuitNode) => convertAiNode(n, has3Ph)) };
    });
    displaySvg = combinePagesToSvg(renderSchematPages({ panelName: panelName || "Rozdzielnica", manufacturerName: selectedManufacturer.name, sections: aiSections, isAiGenerated: true }));
  }
  if (displaySvg) { schematSvgRef.current = displaySvg; schematReadyRef.current = true; }

  const isLiveMode = aiSchematTrees.length === 0;
  const svgKey = `${JSON.stringify(aiSchematTrees)}-${allModules.length}-${sections.map(s => s.modules.map(m => m.uid + m.cableType + m.label + m.circuitNumber).join()).join()}`;

  return (
    <div className="space-y-4">
      {/* Completeness */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><Cable className="w-4 h-4 text-blue-600" /><span className="text-sm font-bold text-slate-800 dark:text-slate-200">Schemat wieloliniowy</span></div>
            <Badge className={`text-[10px] ${completeness >= 80 ? "bg-green-100 text-green-700" : completeness >= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{completeness}% kompletny</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"><p className="text-lg font-bold text-slate-800 dark:text-slate-200">{withNumber.length}/{allCircuits.length}</p><p className="text-[10px] text-slate-500">Nr obwodu</p></div>
            <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"><p className="text-lg font-bold text-slate-800 dark:text-slate-200">{withLabel.length}/{allCircuits.length}</p><p className="text-[10px] text-slate-500">Opis obwodu</p></div>
            <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50"><p className="text-lg font-bold text-slate-800 dark:text-slate-200">{withCable.length}/{allCircuits.length}</p><p className="text-[10px] text-slate-500">Przewód</p></div>
          </div>
          {completeness < 100 && <p className="text-xs font-semibold text-red-600 dark:text-red-400 mt-2 flex items-center gap-1.5 animate-pulse"><AlertTriangle className="w-4 h-4" />Uzupełnij brakujące dane w Konstruktorze (kliknij moduł → Nr obw. / Opis / Przewód)</p>}
        </CardContent>
      </Card>

      {/* Validation errors */}
      {allCriticalErrors.length > 0 && (
        <Card className="border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-3 pb-3">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-sm font-bold text-red-700 dark:text-red-400">Błędy konfiguracji ({allCriticalErrors.length})</span></div>
            <div className="space-y-1">
              {allCriticalErrors.slice(0, 5).map((err) => (<p key={err.id} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5"><XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{err.message}</p>))}
              {allCriticalErrors.length > 5 && <p className="text-xs text-red-500 italic">...i {allCriticalErrors.length - 5} więcej — popraw w zakładce Konstruktor</p>}
            </div>
            <p className="text-[10px] text-red-500 mt-2 font-semibold">Generowanie schematu zablokowane do poprawienia błędów</p>
          </CardContent>
        </Card>
      )}

      {/* AI Generate + SVG */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Button size="sm" className="gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              disabled={aiSchematLoading || allModules.length === 0 || completeness < 100 || allCriticalErrors.length > 0}
              onClick={async () => {
                setAiSchematLoading(true);
                try {
                  const results: SectionTree[] = [];
                  for (const sec of sections) {
                    const mods = sec.modules.map(m => ({ uid: m.uid, moduleId: m.module.id, name: m.module.name, namePl: m.module.namePl, category: m.module.category, rating: m.rating || m.module.defaultRating, label: m.label, circuitNumber: m.circuitNumber, cableType: m.cableType, modules: m.module.modules }));
                    const res = await generateSchematWithAI(sec.name, SECTION_FEED_LABELS[sec.feed], mods);
                    if (res.success && res.tree) results.push(res.tree);
                    else toast({ title: `Błąd — ${sec.name}`, description: res.error || "Nie udało się wygenerować", variant: "destructive" });
                  }
                  setAiSchematTrees(results);
                  if (results.length > 0) toast({ title: "Schemat wygenerowany z AI", description: `${results.length} sekcji przeanalizowanych` });
                } catch { toast({ title: "Błąd AI", description: "Wystąpił błąd podczas generowania", variant: "destructive" }); }
                finally { setAiSchematLoading(false); getAiUsage().then(setAiUsageInfo).catch(() => {}); }
              }}>
              {aiSchematLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analiza obwodów...</> : <><Sparkles className="w-3.5 h-3.5" /> Generuj schemat</>}
            </Button>
            {aiSchematTrees.length > 0 && <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-[10px]">AI · {aiSchematTrees.length} sekcji</Badge>}
            {aiSchematTrees.length === 0 && <span className="text-[10px] text-slate-400">Schemat podstawowy (bez AI)</span>}
            {aiUsageInfo && <span className={`ml-auto text-[10px] font-medium ${aiUsageInfo.used >= aiUsageInfo.limit ? "text-red-500" : "text-slate-500"}`}>{aiUsageInfo.used}/{aiUsageInfo.limit} zapytań AI{aiUsageInfo.isPro ? " /mies." : " (demo)"}</span>}
          </div>

          {aiSchematLoading ? (
            <div className="relative flex flex-col items-center justify-center py-16 text-center border-2 border-orange-300 dark:border-orange-700 rounded-lg bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(251,146,60,0.08)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" style={{ backgroundSize: "200% 100%" }} />
              <div className="relative space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30"><Sparkles className="w-8 h-8 text-white animate-pulse" /></div>
                <div><p className="text-sm font-bold text-orange-900 dark:text-orange-100">Silnik inżynieryjny analizuje obwody...</p><p className="text-[11px] text-orange-700 dark:text-orange-300 mt-1">ElektroSmart AI Engine | PN-HD 60364 | PN-EN 61439</p></div>
                <div className="flex flex-col gap-1.5 text-left mx-auto max-w-xs">
                  {["Analiza topologii obwodów", "Grupowanie RCD → MCB", "Balansowanie faz L1/L2/L3", "Generowanie schematu jednokreskowego"].map((step, i) => (
                    <div key={step} className="flex items-center gap-2 text-[10px] text-orange-800 dark:text-orange-200" style={{ animationDelay: `${i * 0.4}s` }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" style={{ animationDelay: `${i * 0.4}s` }} />{step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : allModules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl bg-gradient-to-br from-blue-50/60 to-slate-50 dark:from-blue-950/20 dark:to-slate-900">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25"><Zap className="w-8 h-8 text-white" /></div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Schemat jednokreskowy AI</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Dodaj moduły w zakładce <strong>Konstruktor</strong> — schemat wygeneruje się automatycznie</p>
            </div>
          ) : (
            <>
              {isLiveMode && (
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Schemat live — aktualizuje się automatycznie</span>
                  <span className="text-[10px] text-slate-400 ml-1">Kliknij &quot;Generuj schemat&quot; aby dodać inteligentne połączenia ES-Engine</span>
                </div>
              )}
              <div key={svgKey} className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white">
                <div dangerouslySetInnerHTML={{ __html: displaySvg }} />
              </div>
              <div className="flex gap-2 mt-3">
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">Eksport SVG/PDF/DXF dostępny w zakładce <strong>Podsumowanie</strong></p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Circuit Table */}
      <CircuitTable
        rcdGroups={rcdGroups}
        unassigned={unassigned}
        rcbos={rcbos}
        circuitEditCell={circuitEditCell}
        setCircuitEditCell={setCircuitEditCell}
        updateModule={updateModule}
      />
    </div>
  );
});
