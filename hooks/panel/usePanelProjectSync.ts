"use client";

import { useCallback } from "react";
import type { DinModule, RailModule, PanelSection } from "@/components/project/panel-configurator-types";
import { getKnrMetadata } from "@/lib/ai-master-brain";
import { DIN_MODULES } from "@/lib/data/din-modules-catalog";
import { addProjectItemDirect } from "@/app/dashboard/projects/[id]/actions";
import { getModulePrice, SECTION_FEED_LABELS, SECTION_TYPE_LABELS } from "@/components/project/panel-configurator-helpers";
import type { Manufacturer } from "@/components/project/panel-configurator-types";
import { panelStateStore } from "@/lib/panel-state-store";
import * as XLSX from "xlsx-js-style";

export interface UsePanelProjectSyncParams {
  panelName: string;
  projectId: string;
  sections: PanelSection[];
  selectedManufacturer: Manufacturer;
  manufacturerCoeff: number;
  isFinal: boolean;
  isPro: boolean;
  setRailModules: (updater: React.SetStateAction<RailModule[]>) => void;
  setIsAdding: (v: boolean) => void;
  setActiveTab: (v: string) => void;
  router: { refresh: () => void };
  toast: (opts: { title: string; description?: string; variant?: "default" | "destructive" }) => void;
}

export function usePanelProjectSync(p: UsePanelProjectSyncParams) {
  const handleAddToProject = useCallback(async () => {
    const hasAnyModules = p.sections.some((s) => s.modules.length > 0);
    if (!hasAnyModules) return;
    if (!p.panelName.trim()) {
      p.toast({ title: "Podaj nazwę rozdzielnicy", description: 'Nazwa jest wymagana, np. "Rozdzielnica główna RG"', variant: "destructive" });
      return;
    }
    if (p.isFinal) { p.toast({ title: "Projekt zablokowany", variant: "destructive" }); return; }
    p.setIsAdding(true);
    try {
      let totalItemCount = 0;
      for (const sec of p.sections) {
        if (sec.modules.length === 0) continue;
        const sectionLabel = p.sections.length > 1 ? `${p.panelName.trim()} — ${sec.name}` : p.panelName.trim();
        const parentResult = await addProjectItemDirect(p.projectId, {
          name: `📦 ${sectionLabel}`, unit: "kpl", quantity: 1, material_price: 0, labor_price: 0,
          description: `Rozdzielnica | ${p.selectedManufacturer.name}${p.manufacturerCoeff !== 1.0 ? ` ×${p.manufacturerCoeff.toFixed(2)}` : ""}${p.sections.length > 1 ? ` | ${SECTION_FEED_LABELS[sec.feed]} | ${SECTION_TYPE_LABELS[sec.type]}` : ""}`,
        });
        if (parentResult.error || !parentResult.itemId) {
          p.toast({ title: "Błąd", description: parentResult.error || "Nie udało się utworzyć pozycji", variant: "destructive" });
          continue;
        }
        const parentId = parentResult.itemId;
        panelStateStore.setLinkedItemId(p.projectId, parentId);
        await addProjectItemDirect(p.projectId, {
          name: `Obudowa ${sec.enclosure.name}`, unit: "szt", quantity: 1,
          material_price: sec.enclosure.price, labor_price: sec.enclosure.laborPrice,
          description: `${sectionLabel} — obudowa rozdzielnicy`,
          is_assembly_child: true, parent_assembly_id: parentId,
        });
        totalItemCount++;
        const secMap = new Map<string, { module: DinModule; rating?: number; count: number; totalMat: number; totalLab: number }>();
        for (const m of sec.modules) {
          const pr = getModulePrice(m, p.manufacturerCoeff);
          const key = `${m.module.id}-${m.rating || ""}-${pr.material}-${pr.labor}`;
          const existing = secMap.get(key);
          if (existing) { existing.count++; existing.totalMat += pr.material; existing.totalLab += pr.labor; }
          else { secMap.set(key, { module: m.module, rating: m.rating, count: 1, totalMat: pr.material, totalLab: pr.labor }); }
        }
        for (const item of secMap.values()) {
          const ratingStr = item.rating ? ` ${item.rating}A` : "";
          const unitMat = item.count > 0 ? item.totalMat / item.count : 0;
          const unitLab = item.count > 0 ? item.totalLab / item.count : 0;
          await addProjectItemDirect(p.projectId, {
            name: `${item.module.namePl}${ratingStr}`, unit: "szt", quantity: item.count,
            material_price: unitMat, labor_price: unitLab,
            description: `${sectionLabel} — ${item.module.description}`,
            is_assembly_child: true, parent_assembly_id: parentId,
          });
          totalItemCount += item.count;
        }
      }
      p.toast({ title: "Dodano rozdzielnicę!", description: `${p.panelName.trim()}: ${p.sections.length} sekcji, ${totalItemCount} urządzeń` });
      p.setActiveTab("build");
      p.router.refresh();
    } catch {
      p.toast({ title: "Błąd", description: "Nie udało się dodać", variant: "destructive" });
    } finally {
      p.setIsAdding(false);
    }
  }, [p]);

  const handleCsvImport = useCallback((csvText: string) => {
    const lines = csvText.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) { p.toast({ title: "Błąd CSV", description: "Plik musi mieć nagłówek i min. 1 wiersz", variant: "destructive" }); return; }
    const header = lines[0].toLowerCase().split(/[;,\t]/).map((h) => h.trim());
    const nameIdx = header.findIndex((h) => h.includes("nazwa") || h.includes("name") || h.includes("moduł") || h.includes("module"));
    const qtyIdx = header.findIndex((h) => h.includes("ilość") || h.includes("qty") || h.includes("szt") || h.includes("quantity"));
    const ratingIdx = header.findIndex((h) => h.includes("prąd") || h.includes("rating") || h.includes("amper"));
    if (nameIdx === -1) { p.toast({ title: "Błąd CSV", description: "Nie znaleziono kolumny z nazwą modułu", variant: "destructive" }); return; }
    const newModules: RailModule[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[;,\t]/).map((c) => c.trim());
      const nameVal = (cols[nameIdx] || "").toLowerCase();
      const qty = qtyIdx >= 0 ? parseInt(cols[qtyIdx]) || 1 : 1;
      const rating = ratingIdx >= 0 ? parseInt(cols[ratingIdx]) || undefined : undefined;
      const matched = DIN_MODULES.find((d) =>
        nameVal.includes(d.id) || nameVal.includes(d.name.toLowerCase()) ||
        d.namePl.toLowerCase().includes(nameVal) || nameVal.includes(d.namePl.toLowerCase())
      );
      if (!matched) continue;
      const meta = getKnrMetadata(matched.id, matched.category, matched.namePl, matched.modules);
      for (let q = 0; q < qty; q++) {
        newModules.push({ uid: crypto.randomUUID(), module: matched, rating: rating ?? matched.defaultRating, knrCode: meta.knrCode, laborRate: meta.laborRate });
      }
    }
    if (newModules.length === 0) { p.toast({ title: "Brak dopasowań", description: "Nie udało się dopasować żadnych modułów z CSV", variant: "destructive" }); return; }
    p.setRailModules((prev) => [...prev, ...newModules]);
    p.toast({ title: "Zaimportowano z CSV", description: `Dodano ${newModules.length} urządzeń` });
  }, [p]);

  const handleExcelImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: "" });
        if (rows.length === 0) { p.toast({ title: "Pusty plik", description: "Arkusz nie zawiera danych", variant: "destructive" }); return; }
        const firstRow = rows[0];
        const keys = Object.keys(firstRow).map((k) => k.toLowerCase());
        const nameKey = Object.keys(firstRow)[keys.findIndex((k) => k.includes("nazwa") || k.includes("name") || k.includes("moduł") || k.includes("module"))];
        const qtyKey = Object.keys(firstRow)[keys.findIndex((k) => k.includes("ilość") || k.includes("qty") || k.includes("szt") || k.includes("quantity"))];
        const ratingKey = Object.keys(firstRow)[keys.findIndex((k) => k.includes("prąd") || k.includes("rating") || k.includes("amper"))];
        if (!nameKey) { p.toast({ title: "Błąd Excel", description: "Nie znaleziono kolumny z nazwą modułu", variant: "destructive" }); return; }
        const newModules: RailModule[] = [];
        for (const row of rows) {
          const nameVal = String(row[nameKey] || "").toLowerCase();
          const qty = qtyKey ? parseInt(String(row[qtyKey])) || 1 : 1;
          const rating = ratingKey ? parseInt(String(row[ratingKey])) || undefined : undefined;
          const matched = DIN_MODULES.find((d) =>
            nameVal.includes(d.id) || nameVal.includes(d.name.toLowerCase()) ||
            d.namePl.toLowerCase().includes(nameVal) || nameVal.includes(d.namePl.toLowerCase())
          );
          if (!matched) continue;
          const meta = getKnrMetadata(matched.id, matched.category, matched.namePl, matched.modules);
          for (let q = 0; q < qty; q++) {
            newModules.push({ uid: crypto.randomUUID(), module: matched, rating: rating ?? matched.defaultRating, knrCode: meta.knrCode, laborRate: meta.laborRate });
          }
        }
        if (newModules.length === 0) { p.toast({ title: "Brak dopasowań", description: "Nie udało się dopasować modułów z arkusza", variant: "destructive" }); return; }
        p.setRailModules((prev) => [...prev, ...newModules]);
        p.toast({ title: "Zaimportowano z Excel", description: `Dodano ${newModules.length} urządzeń` });
      } catch {
        p.toast({ title: "Błąd importu", description: "Nie udało się odczytać pliku Excel", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }, [p]);

  return {
    handleAddToProject,
    handleCsvImport,
    handleExcelImport,
  };
}
