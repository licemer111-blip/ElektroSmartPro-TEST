// =============================================
// PANEL CONFIGURATOR — VALIDATION LOGIC
// =============================================
// Extracted from panel-configurator.tsx for maintainability.
// Contains validatePanelSection and related helpers.

import { computePhaseLoads, findHeaviestCircuitOnPhase, type CircuitInput } from "@/lib/power-logic";
import type { RailModule, ValidationIssue } from "./panel-configurator-types";

// Standard IEC 60947-2 / PN rated current scale — used for selectivity checks
export const RATED_CURRENT_SCALE = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 630];

export function getScaleIndex(rating: number): number {
  for (let i = 0; i < RATED_CURRENT_SCALE.length; i++) {
    if (RATED_CURRENT_SCALE[i] >= rating) return i;
  }
  return RATED_CURRENT_SCALE.length - 1;
}

export function validatePanelSection(section: {
  modules: RailModule[];
  accessories?: RailModule[];
  enclosure: { modules: number; rows: number };
  feed: string;
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const mods = section.modules;
  if (mods.length === 0) return issues;

  const modulesPerRow = Math.ceil(section.enclosure.modules / section.enclosure.rows);

  const mainSwitches = mods.filter(m => m.module.id.startsWith("main-switch") || m.module.id.startsWith("mccb") || m.module.id.startsWith("acb"));
  const breakers = mods.filter(m => m.module.category === "breaker" && !m.module.id.startsWith("main-switch") && !m.module.id.startsWith("mccb") && !m.module.id.startsWith("acb"));
  const rcds = mods.filter(m => m.module.category === "rcd");
  const rcbos = mods.filter(m => m.module.category === "rcbo");
  const spds = mods.filter(m => m.module.category === "spd");
  const protectionDevices = [...breakers, ...rcbos];

  // 1. No main switch
  if (mainSwitches.length === 0 && protectionDevices.length > 0) {
    issues.push({ id: "no-main-switch", severity: "error", message: "Brak wyłącznika głównego (rozłącznik/MCCB) — wymagany dla każdej sekcji rozdzielczej", moduleUids: [] });
  }

  // 2. Multiple main switches
  if (mainSwitches.length > 1) {
    issues.push({ id: "multi-main-switch", severity: "warning", message: `Wykryto ${mainSwitches.length} wyłączników głównych — sprawdź, czy to zamierzone`, moduleUids: mainSwitches.map(m => m.uid) });
  }

  // 3. No RCD protection
  if (section.feed === "main" && breakers.length > 0 && rcds.length === 0 && rcbos.length === 0) {
    issues.push({ id: "no-rcd", severity: "error", message: "Brak ochrony różnicowej (RCD/RCBO) — wymagana wg PN-HD 60364 dla obwodów odbiorczych", moduleUids: breakers.map(m => m.uid) });
  }

  // 4. RCD rating vs downstream breakers
  for (const rcd of rcds) {
    const rcdRating = rcd.rating || 0;
    if (rcdRating === 0) continue;
    const rcdIdx = mods.indexOf(rcd);
    const nextProtIdx = mods.findIndex((m, i) => i > rcdIdx && (m.module.category === "rcd" || m.module.category === "rcbo"));
    const groupEnd = nextProtIdx === -1 ? mods.length : nextProtIdx;
    const groupBreakers = breakers.filter(b => { const bIdx = mods.indexOf(b); return bIdx > rcdIdx && bIdx < groupEnd; });
    const overRated = groupBreakers.filter(b => (b.rating || 0) > rcdRating);
    if (overRated.length > 0) {
      issues.push({ id: `rcd-underrated-${rcd.uid}`, severity: "error", message: `RCD ${rcdRating}A — za nim są wyłączniki o wyższym prądzie (${overRated.map(b => `${b.rating}A`).join(", ")}). Wyłącznik nadprądowy musi być ≤ prądowi RCD.`, moduleUids: [rcd.uid, ...overRated.map(m => m.uid)] });
    }
  }

  // 5. Main switch rating vs downstream
  if (mainSwitches.length === 1) {
    const mainRating = mainSwitches[0].rating || 0;
    const overRatedBreakers = protectionDevices.filter(b => (b.rating || 0) > mainRating && mainRating > 0);
    if (overRatedBreakers.length > 0) {
      issues.push({ id: "breaker-over-main", severity: "error", message: `Wyłączniki (${overRatedBreakers.map(b => `${b.rating}A`).join(", ")}) mają wyższy prąd niż główny (${mainRating}A)`, moduleUids: [mainSwitches[0].uid, ...overRatedBreakers.map(m => m.uid)] });
    }
  }

  // 5a. Selectivity: Main vs downstream MCB — min. 2 steps per IEC 60947-2
  if (mainSwitches.length === 1 && protectionDevices.length > 0) {
    const mainRating = mainSwitches[0].rating || 0;
    if (mainRating > 0) {
      const mainIdx = getScaleIndex(mainRating);
      const badSelectivity = protectionDevices.filter(b => {
        if (b.module.modules >= 3) return false;
        const bRating = b.rating || 0;
        if (!bRating) return false;
        return (mainIdx - getScaleIndex(bRating)) < 2;
      });
      if (badSelectivity.length > 0) {
        const maxAllowed = RATED_CURRENT_SCALE[Math.max(0, mainIdx - 2)];
        issues.push({ id: "selectivity-main", severity: "error", message: `Selektywność! Główny ${mainRating}A → max MCB: ${maxAllowed}A. Wyłączniki (${badSelectivity.map(b => `${b.rating}A`).join(", ")}) za blisko nominału głównego — różnica < 2 stopnie wg IEC 60947-2`, moduleUids: [mainSwitches[0].uid, ...badSelectivity.map(m => m.uid)] });
      }
    }
  }

  // 5b. RCD sum: practical check with residential diversity factor 0.35
  // (Polish standard: socket circuits draw ~3-5A avg, not 16A. 6×B16 under 40A RCD is correct practice.)
  for (const rcd of rcds) {
    const rcdRating = rcd.rating || 0;
    if (rcdRating === 0) continue;
    const rcdIdx = mods.indexOf(rcd);
    const nextProtectionIdx = mods.findIndex((m, i) => i > rcdIdx && (m.module.category === "rcd" || m.module.category === "rcbo"));
    const groupEnd = nextProtectionIdx === -1 ? mods.length : nextProtectionIdx;
    const groupBreakers = breakers.filter(b => { const bIdx = mods.indexOf(b); return bIdx > rcdIdx && bIdx < groupEnd && b.module.modules < 3; });
    if (groupBreakers.length === 0) continue;
    const sumRatings = groupBreakers.reduce((s, b) => s + (b.rating || 0), 0);
    // Diversity factor 0.35 for residential (PN-IEC 60364, practical Polish standard)
    // Warning only when diversified demand exceeds RCD rating
    if (sumRatings * 0.35 > rcdRating) {
      issues.push({ id: `rcd-sum-exceeded-${rcd.uid}`, severity: "warning", message: `RCD ${rcdRating}A — suma MCB za RCD: ${sumRatings}A (×0.35 = ${Math.round(sumRatings * 0.35)}A > ${rcdRating}A). Ryzyko zadziałania przy jednoczesnym obciążeniu wszystkich obwodów`, moduleUids: [rcd.uid, ...groupBreakers.map(m => m.uid)] });
    }
  }

  // 5c. Phase asymmetry > 30%
  {
    const mainSwitch3P = mainSwitches.find(m => (m.module.modules || 0) >= 3 || m.module.id.includes("3p") || m.module.id.includes("4p"));
    if (mainSwitch3P) {
      const mainRating5c = mainSwitch3P.rating || 0;
      const circuits1P = protectionDevices.filter(p => p.module.modules === 1);
      if (circuits1P.length >= 3) {
        const circInputs: CircuitInput[] = circuits1P.map(p => ({ uid: p.uid, label: p.label, rating: p.rating || p.module.defaultRating || 0, phase: p.phase, poles: p.module.modules || 1 }));
        const pl = computePhaseLoads(circInputs, true, mainRating5c);
        if (pl.hasAsymmetry) {
          const heaviestCircuit = findHeaviestCircuitOnPhase(circInputs, pl.maxPhaseName);
          const circuitName = heaviestCircuit?.label || heaviestCircuit?.uid?.slice(0, 8) || "obwód";
          const heaviestUids = circuits1P.filter(p => p.phase === pl.maxPhaseName || (!p.phase && pl.maxPhaseName === "L1")).map(m => m.uid).slice(0, 3);
          issues.push({ id: "phase-asymmetry", severity: "warning", message: `Asymetria faz ${pl.asymmetryPct}%! ${pl.maxPhaseName}: ${pl.phaseLoads[pl.maxPhaseName]}A vs ${pl.minPhaseName}: ${pl.phaseLoads[pl.minPhaseName]}A (max 30% wg PN-HD 60364). Przenieś obwód "${circuitName}" z ${pl.maxPhaseName} na ${pl.minPhaseName}`, moduleUids: heaviestUids });
        }
      }
    }
  }

  // 6. No SPD in main section
  if (section.feed === "main" && spds.length === 0 && mods.length >= 3) {
    issues.push({ id: "no-spd", severity: "warning", message: "Brak ochrony przepięciowej (SPD) — zalecana w rozdzielnicy głównej wg PN-HD 60364-4-443", moduleUids: [] });
  }

  // 7. SPD before main switch
  if (spds.length > 0 && mainSwitches.length > 0) {
    const mainIdx = mods.indexOf(mainSwitches[0]);
    const spdBeforeMain = spds.filter(s => mods.indexOf(s) < mainIdx);
    if (spdBeforeMain.length > 0) {
      issues.push({ id: "spd-before-main", severity: "warning", message: "SPD umieszczony przed wyłącznikiem głównym — powinien być za nim", moduleUids: spdBeforeMain.map(m => m.uid) });
    }
  }

  // 8. Row overflow
  const totalUsed = mods.reduce((s, m) => s + m.module.modules, 0);
  if (totalUsed > section.enclosure.modules) {
    const overflowModUids: string[] = [];
    let currentSlots = 0;
    for (const mod of mods) {
      if (currentSlots + mod.module.modules > modulesPerRow && currentSlots > 0) currentSlots = 0;
      currentSlots += mod.module.modules;
      if (currentSlots > modulesPerRow) overflowModUids.push(mod.uid);
    }
    issues.push({ id: "enclosure-overflow", severity: "error", message: `Przepełnienie obudowy: ${totalUsed}/${section.enclosure.modules} modułów — wymień na większą obudowę`, moduleUids: overflowModUids });
  }

  // 9. Breakers without labels
  const unlabeled = protectionDevices.filter(b => !b.label || b.label.trim() === "");
  if (unlabeled.length > 4) {
    issues.push({ id: "no-labels", severity: "info", message: `${unlabeled.length} urządzeń bez opisu obwodu — zalecane dla dokumentacji i serwisu`, moduleUids: unlabeled.map(m => m.uid) });
  }

  // 10. Phase balance hint
  const singlePhase = breakers.filter(b => b.module.modules === 1);
  const threePhase = breakers.filter(b => b.module.modules >= 3);
  if (singlePhase.length >= 6 && threePhase.length === 0 && mainSwitches.some(m => m.module.modules >= 3)) {
    issues.push({ id: "phase-imbalance", severity: "info", message: `${singlePhase.length} obwodów 1-fazowych bez 3-fazowych — zaplanuj równomierny rozkład faz (L1/L2/L3)`, moduleUids: [] });
  }

  // 11. RCD overloaded circuits
  if (rcds.length > 0 && breakers.length > 0) {
    const ratio = breakers.length / rcds.length;
    if (ratio > 8) {
      issues.push({ id: "rcd-overloaded-circuits", severity: "warning", message: `Średnio ${Math.round(ratio)} obwodów na 1 RCD — zalecane max 6–8 obwodów na RCD (selektywność, ciągłość zasilania)`, moduleUids: rcds.map(m => m.uid) });
    }
  }

  // 12. Duplicate module+rating without labels
  const ratingCounts = new Map<string, { count: number; uids: string[] }>();
  for (const b of protectionDevices) {
    const key = `${b.module.id}-${b.rating || 0}`;
    const existing = ratingCounts.get(key);
    if (existing) { existing.count++; existing.uids.push(b.uid); }
    else { ratingCounts.set(key, { count: 1, uids: [b.uid] }); }
  }
  for (const [, val] of ratingCounts) {
    if (val.count >= 4) {
      const allUnlabeled = val.uids.every(uid => { const mod = mods.find(m => m.uid === uid); return !mod?.label || mod.label.trim() === ""; });
      if (allUnlabeled) {
        issues.push({ id: `duplicates-${val.uids[0]}`, severity: "info", message: `${val.count}× identyczny wyłącznik bez opisu — to zamierzone? Dodaj opisy obwodów`, moduleUids: val.uids });
      }
    }
  }

  // 13. No breakers at all
  if (breakers.length === 0 && rcbos.length === 0 && mods.length > 2) {
    issues.push({ id: "no-breakers", severity: "error", message: "Brak zabezpieczeń nadprądowych — obwody nie są chronione!", moduleUids: [] });
  }

  // 14. Reserve space check
  const totalUsedMods = mods.reduce((s, m) => s + Math.max(m.module.modules, 1), 0);
  const totalMaxMods = section.enclosure.modules;
  if (totalMaxMods > 0 && totalUsedMods <= totalMaxMods) {
    const pct = totalUsedMods / totalMaxMods;
    if (pct > 0.85 && pct <= 1.0) {
      issues.push({ id: "low-reserve", severity: "info", message: `Rezerwa miejsc: tylko ${totalMaxMods - totalUsedMods} wolnych modułów (${Math.round(pct * 100)}%). Norma zaleca min. 15–20% rezerwy`, moduleUids: [] });
    }
  }

  // 15. Missing wiring
  const accessories = section.accessories || [];
  const hasWiring = accessories.some(item => item.module.category === "wiring" || item.module.name.toLowerCase().includes("przewód") || item.module.name.toLowerCase().includes("kabel"));
  if (!hasWiring && mods.length > 3) {
    issues.push({ id: "no-wiring", severity: "info", message: "Nie dodano przewodów — rozważ dodanie okablowania do specyfikacji", moduleUids: [] });
  }

  // 16. Missing labor
  const hasLabor = accessories.some(item => item.module.category === "labor" || (item.module.defaultLaborPrice && item.module.defaultLaborPrice > 0));
  if (!hasLabor && mods.length > 5) {
    issues.push({ id: "no-labor", severity: "info", message: "Brak robocizny — rozważ dodanie prac montażowych do wyceny", moduleUids: [] });
  }

  // 17. Cable cross-section vs MCB rating
  const cableMaxRating: Record<string, number> = { "1.5": 10, "1,5": 10, "2.5": 16, "2,5": 16, "4": 25, "6": 32, "10": 50, "16": 63, "25": 80, "35": 100, "50": 125, "70": 160 };
  for (const dev of [...breakers, ...rcbos]) {
    if (!dev.cableType || !dev.rating) continue;
    const crossMatch = dev.cableType.match(/(\d+[.,]?\d*)\s*mm/i) || dev.cableType.match(/×(\d+[.,]?\d*)/);
    if (!crossMatch) continue;
    const crossSection = crossMatch[1].replace(",", ".");
    const maxA = cableMaxRating[crossSection];
    if (maxA && dev.rating > maxA) {
      issues.push({ id: `cable-underrated-${dev.uid}`, severity: "error", message: `MCB ${dev.rating}A na kablu ${crossSection}mm² (max ${maxA}A) — kabel za słaby! Zwiększ przekrój lub zmniejsz zabezpieczenie`, moduleUids: [dev.uid] });
    }
  }

  // 18. Socket circuits without RCD
  if (rcds.length === 0 && rcbos.length === 0) {
    const socketBreakers = breakers.filter(b => { const lbl = (b.label || "").toLowerCase(); return lbl.includes("gniazd") || lbl.includes("gniazdko") || lbl.includes("gn.") || lbl.includes("socket"); });
    if (socketBreakers.length > 0) {
      issues.push({ id: "socket-no-rcd", severity: "error", message: `${socketBreakers.length} obwodów gniazdkowych bez ochrony RCD — wymagane wg PN-HD 60364-4-41`, moduleUids: socketBreakers.map(m => m.uid) });
    }
  }

  // 19. ZUG terminal block space reservation
  {
    const hasExplicitZug = mods.some(m => m.isZugBlock);
    if (!hasExplicitZug) {
      const circuitCount = [...breakers, ...rcbos].length;
      if (circuitCount > 0) {
        const zugRequired = Math.ceil(circuitCount * 0.5);
        const totalUsedSlots = mods.reduce((s, m) => s + Math.max(m.module.modules, 1), 0);
        const freeSlots = section.enclosure.modules - totalUsedSlots;
        if (freeSlots < zugRequired) {
          issues.push({ id: "zug-no-space", severity: "error", message: `Brak miejsca! Złączki ZUG wymagają dodatkowych ${zugRequired - freeSlots} modułów (rezerwa: ${zugRequired} mod. = ceil(${circuitCount} obw. × 0.5)). Wybierz większą obudowę.`, moduleUids: [] });
        } else {
          const remainingAfterZug = freeSlots - zugRequired;
          const remainingPct = section.enclosure.modules > 0 ? remainingAfterZug / section.enclosure.modules : 1;
          if (remainingPct < 0.10) {
            issues.push({ id: "zug-low-reserve", severity: "warning", message: `Po rezerwie ZUG (${zugRequired} mod.) pozostaje tylko ${remainingAfterZug} wolnych modułów (${Math.round(remainingPct * 100)}% < 10%). Rozważ większą obudowę.`, moduleUids: [] });
          }
        }
      }
    }
  }

  return issues;
}
