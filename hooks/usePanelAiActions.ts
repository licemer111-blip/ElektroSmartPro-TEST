"use client";
import { useCallback } from "react";
import type {
  DinModule, RailModule, PanelSection, PanelTemplate,
  TemplateRailModule, TemplateAccessory, SectionFeed, SectionType, Manufacturer,
} from "@/components/project/panel-configurator-types";
import type { SectionTree } from "@/app/dashboard/panel-configurator/ai-schemat-action";
import type { PricingResult } from "@/app/dashboard/panel-configurator/ai-pricing-action";
import { getKnrMetadata } from "@/lib/ai-master-brain";
import { generatePanelConfigWithAI } from "@/app/dashboard/projects/[id]/ai-actions";
import { pricePanelWithAI } from "@/app/dashboard/panel-configurator/ai-pricing-action";
import { DIN_MODULES, ENCLOSURE_OPTIONS } from "@/lib/data/din-modules-catalog";

export interface UsePanelAiActionsParams {
  sections: PanelSection[];
  panelName: string;
  selectedManufacturer: Manufacturer;
  manufacturerCoeff: number;
  aiDescription: string;
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
  setSections: React.Dispatch<React.SetStateAction<PanelSection[]>>;
  setPanelName: (v: string) => void;
  setActiveSectionIdx: (i: number) => void;
  setActiveTab: (v: string) => void;
  setShowAiPanel: (v: boolean) => void;
  setAiDescription: (v: string) => void;
  setAiGenerating: (v: boolean) => void;
  setAiSchematTrees: React.Dispatch<React.SetStateAction<SectionTree[]>>;
  setIsWycenLoading: (v: boolean) => void;
  setPricingResult: React.Dispatch<React.SetStateAction<PricingResult | null>>;
  setPricingMode: React.Dispatch<React.SetStateAction<"none" | "ai" | "manual">>;
  setManualPrices: React.Dispatch<React.SetStateAction<Record<string, { mat: number; lab: number }>>>;
  updateModule: (uid: string, updates: Partial<Pick<RailModule, "customMaterialPrice" | "customLaborPrice">>) => void;
  userId?: string;
  voivodeshipModifier?: number;
}

// ─── Task 3: reorder modules so RCDs always precede their MCBs ──────────────────
function reorderForRcdCoverage(mods: RailModule[]): RailModule[] {
  const isMain = (m: RailModule) => m.module.id.startsWith("main-switch") || m.module.id.startsWith("mccb") || m.module.id.startsWith("acb") || m.module.id.startsWith("szr");
  const isSpd = (m: RailModule) => m.module.category === "spd";
  const isRcd = (m: RailModule) => m.module.category === "rcd";
  const isBreaker = (m: RailModule) => m.module.category === "breaker" && !isMain(m);
  const rcds = mods.filter(isRcd);
  if (rcds.length === 0) return mods;
  // Check if already ordered (every RCD has at least one breaker after it)
  let needsReorder = false;
  for (let i = 0; i < mods.length; i++) {
    if (isRcd(mods[i]) && !mods.slice(i + 1).some(isBreaker)) { needsReorder = true; break; }
  }
  if (!needsReorder) return mods;
  // Reorder: main switches → SPDs → [RCD + MCBs] groups → others
  const mainSwitches = mods.filter(isMain);
  const spds = mods.filter(isSpd);
  const breakers = mods.filter(isBreaker);
  const others = mods.filter(m => !isMain(m) && !isSpd(m) && !isRcd(m) && !isBreaker(m));
  const result: RailModule[] = [...mainSwitches, ...spds];
  const perRcd = Math.floor(breakers.length / rcds.length);
  const extra = breakers.length % rcds.length;
  let bIdx = 0;
  for (let i = 0; i < rcds.length; i++) {
    result.push(rcds[i]);
    const count = perRcd + (i < extra ? 1 : 0);
    result.push(...breakers.slice(bIdx, bIdx + count));
    bIdx += count;
  }
  return [...result, ...others];
}

export function usePanelAiActions(p: UsePanelAiActionsParams) {
  // Build RailModule[] from template railModules
  const buildModulesFromTemplateRailModules = useCallback((railModules: TemplateRailModule[]): RailModule[] => {
    const mods: RailModule[] = [];
    for (const tm of railModules) {
      const dinMod = DIN_MODULES.find((m) => m.id === tm.moduleId);
      if (!dinMod) continue;
      const knrMeta = getKnrMetadata(dinMod.id, dinMod.category, dinMod.namePl, dinMod.modules);
      mods.push({
        uid: crypto.randomUUID(),
        module: dinMod,
        rating: tm.rating ?? dinMod.defaultRating,
        label: tm.label,
        circuitNumber: tm.circuitNumber,
        cableType: tm.cableType,
        phase: tm.phase,
        isZugBlock: tm.isZugBlock,
        terminalCount: tm.terminalCount,
        knrCode: tm.knrCode ?? knrMeta.knrCode,
        laborRate: tm.laborRate ?? knrMeta.laborRate,
      });
    }
    return mods;
  }, []);

  // Build accessories from template accessories
  const buildAccessoriesFromTemplate = useCallback((accessories: TemplateAccessory[]): RailModule[] => {
    const accs: RailModule[] = [];
    for (const ta of accessories) {
      const dinMod = DIN_MODULES.find((m) => m.id === ta.moduleId);
      if (!dinMod) continue;
      const knrMeta = getKnrMetadata(dinMod.id, dinMod.category, dinMod.namePl, dinMod.modules);
      for (let i = 0; i < ta.quantity; i++) {
        accs.push({
          uid: crypto.randomUUID(),
          module: dinMod,
          quantity: ta.quantity,
          knrCode: knrMeta.knrCode,
          laborRate: knrMeta.laborRate,
        });
      }
    }
    return accs;
  }, []);

  // Build RailModule[] from legacy template items
  const buildModulesFromItems = useCallback((items: { moduleId: string; rating?: number; qty: number }[]): RailModule[] => {
    const mods: RailModule[] = [];
    for (const item of items) {
      const dinMod = DIN_MODULES.find((m) => m.id === item.moduleId);
      if (!dinMod) continue;
      const knrMeta = getKnrMetadata(dinMod.id, dinMod.category, dinMod.namePl, dinMod.modules);
      for (let i = 0; i < item.qty; i++) {
        mods.push({ uid: crypto.randomUUID(), module: dinMod, rating: item.rating ?? dinMod.defaultRating, knrCode: knrMeta.knrCode, laborRate: knrMeta.laborRate });
      }
    }
    return mods;
  }, []);

  // Build accessories list from modules — inline implementation, no server imports
  // Mirrors computeAccessories() from panel-logic.service but runs client-side
  const buildAccessoriesFromModules = useCallback(
    (mods: RailModule[], encMods: number, phaseCount: number, mainRating: number): RailModule[] => {
      const MCB1P = ["mcb-b-1p", "mcb-c-1p", "mcb-d-1p", "rcbo-b-1p", "rcbo-a-1p"];
      const MCB3P = ["mcb-b-3p", "mcb-c-3p", "mcb-d-3p"];

      const circuits1p = mods.filter((m) => MCB1P.includes(m.module.id));
      const circuits3p = mods.filter((m) => MCB3P.includes(m.module.id));
      const totalCircuits = circuits1p.length + circuits3p.length;

      const light1p  = circuits1p.filter((m) => (m.rating ?? 16) <= 10).length;
      const socket1p = circuits1p.filter((m) => (m.rating ?? 16) > 10 && (m.rating ?? 16) <= 16).length;
      const heavy1p  = circuits1p.filter((m) => (m.rating ?? 16) > 16).length;
      const heavy3p  = circuits3p.length;

      const PER_MCB = 0.35;
      let lgy15 = Math.round(light1p * PER_MCB * 10) / 10;
      let lgy25 = Math.round((socket1p + heavy1p) * PER_MCB * 10) / 10;
      if (encMods <= 96) {
        const tot = lgy15 + lgy25;
        if (tot > 45) { const r = 45 / tot; lgy15 = Math.round(lgy15 * r * 10) / 10; lgy25 = Math.round(lgy25 * r * 10) / 10; }
      }
      const dinRows     = Math.max(1, Math.ceil((totalCircuits + 2) / 8));
      const lgy6        = Math.round(heavy3p * 0.8 * 10) / 10;
      const lgy10       = Math.round(dinRows * 0.8 * 10) / 10;
      const mainFeedId  = mainRating >= 40 ? "wire-16" : "wire-10";
      const mainFeedQty = Math.max(1, dinRows);
      const ferruleSmall = Math.max(1, Math.ceil(totalCircuits * 2 / 100));
      const ferruleMed   = (lgy6 + lgy10) > 0 ? Math.max(1, Math.ceil((heavy3p * 3 + mainFeedQty) * 2 / 50)) : 0;
      const cableTie200  = Math.max(1, Math.ceil(totalCircuits / 8));
      const cableTie300  = heavy3p > 0 ? 1 : 0;
      const markingStrip = Math.max(1, dinRows);

      const items: { id: string; qty: number }[] = [
        ...(lgy15 > 0       ? [{ id: "wire-1-5",        qty: lgy15 }] : []),
        ...(lgy25 > 0       ? [{ id: "wire-2-5",        qty: lgy25 }] : []),
        ...(lgy6  > 0       ? [{ id: "wire-6",          qty: lgy6  }] : []),
        ...(lgy10 > 0       ? [{ id: "wire-10",         qty: lgy10 }] : []),
        { id: mainFeedId,     qty: mainFeedQty },
        ...(phaseCount === 3 ? [{ id: "busbar-3p", qty: 1 }, { id: "busbar-2p", qty: 1 }] : [{ id: "busbar-2p", qty: 1 }]),
        { id: "pe-bar",       qty: 1 },
        { id: "n-bar",        qty: 1 },
        { id: "ferrule-small",qty: ferruleSmall },
        ...(ferruleMed > 0  ? [{ id: "ferrule-medium",  qty: ferruleMed  }] : []),
        { id: "cable-tie-200",qty: cableTie200 },
        ...(cableTie300 > 0 ? [{ id: "cable-tie-300",  qty: cableTie300 }] : []),
        { id: "marking-strip",qty: markingStrip },
        { id: "labor-assembly",      qty: 1 },
        { id: "labor-cable-routing", qty: 1 },
        { id: "labor-testing",       qty: 1 },
        { id: "labor-marking",       qty: 1 },
      ];

      const accs: RailModule[] = [];
      for (const item of items) {
        const dinMod = DIN_MODULES.find((m) => m.id === item.id);
        if (!dinMod) continue;
        const knrMeta = getKnrMetadata(dinMod.id, dinMod.category, dinMod.namePl, dinMod.modules);
        accs.push({
          uid: crypto.randomUUID(),
          module: dinMod,
          quantity: item.qty,
          knrCode: knrMeta.knrCode,
          laborRate: knrMeta.laborRate,
        });
      }
      return accs;
    },
    []
  );

  // ─── Task 2: auto-add Zug block if template has none ──────────────────────────
  const addZugIfMissing = useCallback((mods: RailModule[]): RailModule[] => {
    if (mods.some(m => m.isZugBlock)) return mods;
    const circuitCount = mods.filter(m => m.module.category === "breaker" || m.module.category === "rcbo").length;
    if (circuitCount === 0) return mods;
    const zugDin = DIN_MODULES.find(m => m.id === "zug-block");
    if (!zugDin) return mods;
    const terminalCount = Math.max(15, Math.ceil(circuitCount * 1.5));
    return [...mods, { uid: crypto.randomUUID(), module: zugDin, isZugBlock: true, terminalCount }];
  }, []);

  // Apply template (supports single-section and multi-section)
  const applyTemplate = useCallback((template: PanelTemplate) => {
    p.setPanelName("");
    p.setAiSchematTrees([]);

    if (template.sections && template.sections.length > 0) {
      const newSections: PanelSection[] = template.sections.map((ts) => {
        const enc = ENCLOSURE_OPTIONS.find((e) => e.modules === ts.enclosureModules) || ENCLOSURE_OPTIONS[2];
        const mods = reorderForRcdCoverage(addZugIfMissing(buildModulesFromTemplateRailModules(ts.railModules || [])));
        // Detect phase count from modules
        const has3p = mods.some((m) => m.module.modules >= 3 || m.module.id.includes("3p") || m.module.id.includes("4p"));
        const phaseCount = has3p ? 3 : 1;
        const mainSwitch = mods.find((m) => m.module.id.startsWith("main-switch"));
        const mainRating = mainSwitch?.rating ?? 63;
        // Use explicit accessories if provided, otherwise auto-compute (main section only)
        const tmAccs = ts.accessories || [];
        const accessories = tmAccs.length > 0
          ? buildAccessoriesFromTemplate(tmAccs)
          : ts.feed === "main"
            ? buildAccessoriesFromModules(mods, enc.modules, phaseCount, mainRating)
            : [];
        return {
          id: crypto.randomUUID(),
          name: ts.name,
          feed: ts.feed,
          type: ts.type,
          enclosure: enc,
          modules: mods,
          accessories,
        };
      });
      p.setSections(newSections);
    } else {
      const enc = ENCLOSURE_OPTIONS.find((e) => e.modules === template.enclosureModules) || ENCLOSURE_OPTIONS[2];
      const mods = buildModulesFromTemplateRailModules(template.railModules || []);
      const has3p = mods.some((m) => m.module.modules >= 3 || m.module.id.includes("3p") || m.module.id.includes("4p"));
      const phaseCount = has3p ? 3 : 1;
      const mainSwitch = mods.find((m) => m.module.id.startsWith("main-switch"));
      const mainRating = mainSwitch?.rating ?? 63;
      const tmAccs = template.accessories || [];
      const accessories = tmAccs.length > 0
        ? buildAccessoriesFromTemplate(tmAccs)
        : buildAccessoriesFromModules(mods, enc.modules, phaseCount, mainRating);
      const newSection: PanelSection = {
        id: crypto.randomUUID(),
        name: "Sekcja 1",
        feed: "main",
        type: "distribution",
        enclosure: enc,
        modules: reorderForRcdCoverage(addZugIfMissing(mods)),
        accessories,
      };
      p.setSections([newSection]);
    }
    p.setActiveSectionIdx(0);
    p.setPricingResult(null);
    p.setPricingMode("none");
    p.setManualPrices({});
    p.setActiveTab("build");
    p.toast({ title: "Szablon załadowany", description: `${template.name}${template.sections ? ` (${template.sections.length} sekcje)` : ""}` });
  }, [p, buildModulesFromTemplateRailModules, buildAccessoriesFromTemplate, buildAccessoriesFromModules, addZugIfMissing]);

  // AI Pricing handler
  const handleAIPricing = useCallback(async () => {
    const allMods = p.sections.flatMap((s) => s.modules);
    if (allMods.length === 0) {
      p.toast({ title: "Brak urządzeń", description: "Dodaj urządzenia do rozdzielnicy przed wyceną.", variant: "destructive" });
      return;
    }
    p.setIsWycenLoading(true);
    try {
      const pricingSections = p.sections.map((sec) => ({
        sectionName: sec.name,
        enclosureName: sec.enclosure.name,
        enclosureModules: sec.enclosure.modules,
        modules: sec.modules.map((m) => ({
          moduleId: m.module.id,
          namePl: m.module.namePl,
          category: m.module.category,
          rating: m.rating ?? m.module.defaultRating,
          quantity: 1,
        })),
        accessories: sec.accessories.map((a) => ({
          moduleId: a.module.id,
          namePl: a.module.namePl,
          category: a.module.category,
          rating: a.module.category === "labor" ? a.module.defaultLaborPrice : undefined,
          quantity: a.quantity || 1,
        })),
      }));
      const result = await pricePanelWithAI({
        panelName: p.panelName || "Rozdzielnica",
        manufacturerId: p.selectedManufacturer.id,
        manufacturerCoeff: p.manufacturerCoeff,
        voivodeshipModifier: p.voivodeshipModifier ?? 1.0,
        sections: pricingSections,
        userId: p.userId,
      });
      if (!result.success) {
        p.toast({ title: "Błąd wyceny AI", description: result.error || "Spróbuj ponownie.", variant: "destructive" });
        return;
      }
      for (const pricedSec of result.sections) {
        const sec = p.sections.find((s) => s.name === pricedSec.sectionName);
        if (!sec) continue;
        for (const pm of pricedSec.modules) {
          const match = sec.modules.find((m) => m.module.id === pm.moduleId && m.customMaterialPrice === undefined);
          if (match) {
            p.updateModule(match.uid, {
              customMaterialPrice: Math.round(pm.unitMaterial * 100) / 100,
              customLaborPrice: Math.round(pm.unitLabor * 100) / 100,
            });
          }
        }
        for (const pa of pricedSec.accessories) {
          const match = sec.accessories.find((a) => a.module.id === pa.moduleId && a.customMaterialPrice === undefined);
          if (match) {
            const isLaborMod = match.module.category === "labor";
            // For labor modules: if AI returned 0 labor price, fall back to module default
            const resolvedLabor = (isLaborMod && pa.unitLabor === 0)
              ? match.module.defaultLaborPrice
              : pa.unitLabor;
            // For labor modules: material is always 0 (service, not goods)
            const resolvedMaterial = isLaborMod ? 0 : pa.unitMaterial;
            p.updateModule(match.uid, {
              customMaterialPrice: Math.round(resolvedMaterial * 100) / 100,
              customLaborPrice: Math.round(resolvedLabor * 100) / 100,
            });
          }
        }
      }
      p.setPricingResult(result);
      p.setPricingMode("ai");
      const confidence = result.confidence === "high" ? "wysoka" : result.confidence === "medium" ? "średnia" : "niska";
      p.toast({
        title: `Wycena gotowa — ${result.grandTotal.toFixed(0)} zł netto`,
        description: `Źródło: ${result.source === "KNR" ? "ES-KNR 2026" : "AI Szacunek"} · Pewność: ${confidence}`,
      });
      p.setActiveTab("summary");
    } catch {
      p.toast({ title: "Błąd wyceny", description: "Nie udało się wycenić. Sprawdź połączenie.", variant: "destructive" });
    } finally {
      p.setIsWycenLoading(false);
    }
  }, [p]);

  // AI panel generation handler
  const handleAiGenerate = useCallback(async () => {
    if (!p.aiDescription.trim()) return;
    p.setAiGenerating(true);
    try {
      const result = await generatePanelConfigWithAI(p.aiDescription);
      if (!result.success) {
        p.toast({ title: "Błąd AI", description: result.error, variant: "destructive" });
        return;
      }

      p.setPanelName(result.panelName || "Rozdzielnica AI");

      const buildModulesFromAiList = (items: { moduleId: string; rating?: number; qty?: number; label?: string; phase?: string; circuitNumber?: string; cableType?: string; isZugBlock?: boolean; terminalCount?: number }[]): RailModule[] => {
        const mods: RailModule[] = [];
        let circuitCounter = 1;
        for (const item of items) {
          const dinMod = DIN_MODULES.find((m) => m.id === item.moduleId);
          if (!dinMod) continue;
          const quantity = item.qty || 1;
          const isMcbOrRcbo = dinMod.category === "breaker" || dinMod.category === "rcbo";
          for (let i = 0; i < quantity; i++) {
            const circNum = item.circuitNumber ?? (isMcbOrRcbo ? String(circuitCounter) : undefined);
            if (isMcbOrRcbo) circuitCounter++;
            mods.push({
              uid: crypto.randomUUID(),
              module: dinMod,
              rating: item.rating ?? dinMod.defaultRating,
              label: item.label,
              phase: item.phase as "L1" | "L2" | "L3" | undefined,
              circuitNumber: circNum,
              cableType: item.cableType,
              isZugBlock: item.isZugBlock,
              terminalCount: item.terminalCount,
            });
          }
        }
        return mods;
      };

      const buildAccessoriesFromAiList = (items: { moduleId: string; qty?: number }[]): RailModule[] => {
        const accs: RailModule[] = [];
        for (const item of items) {
          const dinMod = DIN_MODULES.find((m) => m.id === item.moduleId);
          if (!dinMod) continue;
          const accKnr = getKnrMetadata(dinMod.id, dinMod.category, dinMod.namePl, dinMod.modules);
          accs.push({ uid: crypto.randomUUID(), module: dinMod, quantity: item.qty ?? 1, knrCode: accKnr.knrCode, laborRate: accKnr.laborRate });
        }
        return accs;
      };

      if (result.sections && result.sections.length > 0) {
        const newSections: PanelSection[] = result.sections.map((s) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const enc = ENCLOSURE_OPTIONS.find((e) => e.modules === s.enclosureModules) || ENCLOSURE_OPTIONS[2];
          const validFeed = (["main", "reserve", "ups", "pv", "generator"] as const).includes(s.feed as SectionFeed) ? s.feed as SectionFeed : "main";
          const validType = (["distribution", "ats", "metering", "compensation", "automation", "motor"] as const).includes(s.type as SectionType) ? s.type as SectionType : "distribution";
          return {
            id: crypto.randomUUID(),
            name: s.name,
            feed: validFeed,
            type: validType,
            enclosure: enc,
            modules: reorderForRcdCoverage(buildModulesFromAiList((s.modules as Parameters<typeof buildModulesFromAiList>[0]))),
            accessories: s.accessories ? buildAccessoriesFromAiList(s.accessories) : [],
          };
        });
        p.setSections(newSections);
        const totalDevices = newSections.reduce((sum, s) => sum + s.modules.length, 0);
        p.toast({ title: "✨ AI wygenerowało rozdzielnicę", description: `${result.panelName} — ${newSections.length} sekcji, ${totalDevices} urządzeń` });
      } else {
        const enc = ENCLOSURE_OPTIONS.find((e) => e.modules === result.enclosureModules) || ENCLOSURE_OPTIONS[2];
        const rawModules = buildModulesFromAiList((result.modules || []) as Parameters<typeof buildModulesFromAiList>[0]);
        const newModules = reorderForRcdCoverage(rawModules);
        const newAccessories = result.accessories ? buildAccessoriesFromAiList(result.accessories) : [];
        const aiSection: PanelSection = {
          id: crypto.randomUUID(),
          name: "Sekcja 1",
          feed: "main",
          type: "distribution",
          enclosure: enc,
          modules: newModules,
          accessories: newAccessories,
        };
        p.setSections([aiSection]);
        p.toast({ title: "✨ AI wygenerowało rozdzielnicę", description: `${result.panelName} — ${newModules.length} urządzeń, ${newAccessories.length} materiałów montażowych` });
      }

      p.setActiveSectionIdx(0);
      p.setActiveTab("build");
      p.setShowAiPanel(false);
      p.setAiDescription("");
    } catch {
      p.toast({ title: "Błąd", description: "Nieoczekiwany błąd AI", variant: "destructive" });
    } finally {
      p.setAiGenerating(false);
    }
  }, [p]);

  return {
    buildModulesFromItems,
    buildModulesFromTemplateRailModules,
    buildAccessoriesFromTemplate,
    applyTemplate,
    handleAIPricing,
    handleAiGenerate,
  };
}
