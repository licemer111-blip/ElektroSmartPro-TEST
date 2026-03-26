"use client";

import { useMemo } from "react";
import { validatePanelSection } from "@/components/project/panel-validation";
import {
  getModulePrice,
  computeSectionPowerBalance,
  computeRailRows,
} from "@/components/project/panel-configurator-helpers";
import type {
  PanelSection,
  RailModule,
  IssueSeverity,
} from "@/components/project/panel-configurator-types";

interface UsePanelDerivedStateProps {
  sections: PanelSection[];
  activeSectionIdx: number;
  manufacturerCoeff: number;
  selectedUid: string | null;
}

export function usePanelDerivedState({
  sections,
  activeSectionIdx,
  manufacturerCoeff,
  selectedUid,
}: UsePanelDerivedStateProps) {
  const activeSection = sections[activeSectionIdx] || sections[0];
  const railModules = activeSection.modules;
  const accessoryItems = activeSection.accessories;
  const selectedEnclosure = activeSection.enclosure;

  const modulesPerRow = Math.ceil(selectedEnclosure.modules / selectedEnclosure.rows);

  const allModules = useMemo(() => sections.flatMap(s => s.modules), [sections]);
  const allAccessories = useMemo(() => sections.flatMap(s => s.accessories), [sections]);

  const totalModules = useMemo(
    () => railModules.reduce((s, m) => s + m.module.modules, 0),
    [railModules]
  );

  const totalMaterialCost = useMemo(() => {
    const devCost = railModules.reduce((s, m) => s + getModulePrice(m, manufacturerCoeff).material, 0);
    const accCost = accessoryItems.reduce((s, m) => s + getModulePrice(m, manufacturerCoeff).material, 0);
    return devCost + accCost + selectedEnclosure.price;
  }, [railModules, accessoryItems, selectedEnclosure, manufacturerCoeff]);

  const totalLaborCost = useMemo(() => {
    const devLabor = railModules.reduce((s, m) => s + getModulePrice(m, manufacturerCoeff).labor, 0);
    const accLabor = accessoryItems.reduce((s, m) => s + getModulePrice(m, manufacturerCoeff).labor, 0);
    return devLabor + accLabor + selectedEnclosure.laborPrice;
  }, [railModules, accessoryItems, selectedEnclosure, manufacturerCoeff]);

  const grandTotalMaterial = useMemo(() => {
    return sections.reduce((sum, s) => {
      const modCost = s.modules.reduce((ms, m) => ms + getModulePrice(m, manufacturerCoeff).material, 0);
      const accCost = s.accessories.reduce((ms, m) => ms + getModulePrice(m, manufacturerCoeff).material, 0);
      return sum + modCost + accCost + s.enclosure.price;
    }, 0);
  }, [sections, manufacturerCoeff]);

  const grandTotalLabor = useMemo(() => {
    return sections.reduce((sum, s) => {
      const modLabor = s.modules.reduce((ms, m) => ms + getModulePrice(m, manufacturerCoeff).labor, 0);
      const accLabor = s.accessories.reduce((ms, m) => ms + getModulePrice(m, manufacturerCoeff).labor, 0);
      return sum + modLabor + accLabor + s.enclosure.laborPrice;
    }, 0);
  }, [sections, manufacturerCoeff]);

  const selectedModule = useMemo<RailModule | null>(() => {
    if (!selectedUid) return null;
    return railModules.find(m => m.uid === selectedUid)
      ?? accessoryItems.find(m => m.uid === selectedUid)
      ?? null;
  }, [selectedUid, railModules, accessoryItems]);

  const sectionPowerBalance = useMemo(
    () => computeSectionPowerBalance(sections),
    [sections]
  );

  const sectionIssues = useMemo(() => {
    return sections.map(sec => validatePanelSection({
      modules: sec.modules,
      accessories: sec.accessories,
      enclosure: sec.enclosure,
      feed: sec.feed,
    }));
  }, [sections]);

  const activeIssues = sectionIssues[activeSectionIdx] || [];
  const allCriticalErrors = useMemo(
    () => sectionIssues.flat().filter(i => i.severity === "error"),
    [sectionIssues]
  );

  const moduleIssueMap = useMemo(() => {
    const map = new Map<string, { severity: IssueSeverity; messages: string[] }>();
    for (const issue of activeIssues) {
      for (const uid of issue.moduleUids) {
        const existing = map.get(uid);
        if (existing) {
          existing.messages.push(issue.message);
          if (issue.severity === "error" || (issue.severity === "warning" && existing.severity !== "error")) {
            existing.severity = issue.severity;
          }
        } else {
          map.set(uid, { severity: issue.severity, messages: [issue.message] });
        }
      }
    }
    return map;
  }, [activeIssues]);

  const railRows = useMemo(
    () => computeRailRows(railModules, modulesPerRow, selectedEnclosure.rows),
    [railModules, modulesPerRow, selectedEnclosure.rows]
  );

  const selectedRowIdx = useMemo(() => {
    if (!selectedUid) return -1;
    return railRows.findIndex(row => row.some(vm => vm.source.uid === selectedUid));
  }, [selectedUid, railRows]);

  const occupancyPercent = totalModules > 0
    ? Math.round((totalModules / selectedEnclosure.modules) * 100)
    : 0;
  const overflow = totalModules > selectedEnclosure.modules;

  return {
    activeSection,
    railModules,
    accessoryItems,
    selectedEnclosure,
    modulesPerRow,
    allModules,
    allAccessories,
    totalModules,
    totalMaterialCost,
    totalLaborCost,
    grandTotalMaterial,
    grandTotalLabor,
    selectedModule,
    sectionPowerBalance,
    activeIssues,
    allCriticalErrors,
    moduleIssueMap,
    railRows,
    selectedRowIdx,
    occupancyPercent,
    overflow,
  };
}
