import type { ExcelRow, AIProjectItem, ParsedRow } from "@/components/project/ai-import-dialog-reducer";
import type { ExcelColumnMap } from "@/app/dashboard/projects/[id]/excel-analyze-action";
import { guardUnit } from "@/lib/unit-guard";

// ─── Unit normalization ───────────────────────────────────────────────────────

export function normalizeUnit(raw: string): string {
  const u = raw.trim().toLowerCase();
  if (["mb", "m.b.", "mb.", "m", "lm"].includes(u)) return "mb";
  if (["m2", "m²", "mkw"].includes(u)) return "m²";
  if (["kpl", "kpl.", "komplet", "zestaw"].includes(u)) return "kpl";
  if (["szt", "szt.", "sztuk", "sztuka", "pcs", "pc"].includes(u)) return "szt";
  if (["h", "godz", "godz.", "rbh", "rbg"].includes(u)) return "h";
  if (["pkt", "pkt.", "punkt", "punkty", "punk"].includes(u)) return "pkt";
  return u || "szt";
}

// ─── Smart unit correction based on item name ─────────────────────────────────
// Delegates to lib/unit-guard.ts — single source of truth
export function smartCorrectUnit(name: string, unit: string): string {
  return guardUnit(name, unit);
}

// ─── Row classification ───────────────────────────────────────────────────────

export function classifyRow(name: string): "material" | "labor" | "mixed" {
  const n = name.toLowerCase();
  const labor = ["montaż", "układanie", "kucie", "bruzd", "pomiar", "uruchom", "programow",
    "demontaż", "transport", "robocizna", "usługa", "podłączenie", "spawanie", "naprawa"];
  const material = ["przewód", "kabel", "gniazdo", "łącznik", "wyłącznik", "oprawa",
    "puszka", "rozdzielnica", "panel", "kamera", "czujka", "centrala", "switch",
    "szafa", "rack", "ydyp", "yky", "utp", "led", "mcb", "rcd", "spd"];
  const isLabor = labor.some(k => n.includes(k));
  const isMat = material.some(k => n.includes(k));
  if (isLabor && !isMat) return "labor";
  if (isMat && !isLabor) return "material";
  return "mixed";
}

// ─── Column detection helpers ─────────────────────────────────────────────────

const UNIT_WORDS = ["kpl", "szt", "mb", "m", "m2", "m3", "h", "godz", "kg", "l", "komplet", "sztuk", "metr", "para", "op", "zest", "pkt"];

export function isUnitValue(v: string): boolean {
  const s = v.trim().toLowerCase();
  return UNIT_WORDS.some(u => s === u || s === u + "." || s.startsWith(u + " "));
}

export function isNumericValue(v: string): boolean {
  const s = v.trim().replace(",", ".");
  return s !== "" && !isNaN(parseFloat(s)) && isFinite(Number(s));
}

export function detectUnitColumn(data: string[][], colCount: number, excludeIdx: number): number {
  const scores = Array(colCount).fill(0);
  const sample = data.slice(0, Math.min(20, data.length));
  for (let c = 0; c < colCount; c++) {
    if (c === excludeIdx) continue;
    for (const row of sample) {
      const v = String(row[c] ?? "").trim();
      if (isUnitValue(v)) scores[c]++;
    }
  }
  const best = scores.indexOf(Math.max(...scores));
  return scores[best] >= 2 ? best : -1;
}

export function detectQtyColumn(data: string[][], colCount: number, excludeIdxs: number[]): number {
  const scores = Array(colCount).fill(0);
  const sample = data.slice(0, Math.min(20, data.length));
  for (let c = 0; c < colCount; c++) {
    if (excludeIdxs.includes(c)) continue;
    for (const row of sample) {
      const v = String(row[c] ?? "").trim();
      if (!v) continue;
      const n = parseFloat(v.replace(",", "."));
      if (!isNaN(n) && n > 0 && n < 10000 && String(v).length <= 8) scores[c]++;
    }
  }
  const best = scores.indexOf(Math.max(...scores));
  return scores[best] >= 2 ? best : -1;
}

// ─── Smart Excel parser ───────────────────────────────────────────────────────

export function smartParseExcel(headers: string[], data: string[][]): ExcelRow[] {
  const find = (kws: string[]) => headers.findIndex(h => kws.some(k => h.toLowerCase().includes(k)));

  let nameIdx = find(["nazw", "opis", "name", "pozycj", "item", "lp", "l.p"]);
  let unitIdx = find(["jedn", "unit", "jm", "j.m", "jm.", "jednostk"]);
  let qtyIdx  = find(["ilo", "qty", "quantity", "liczba", "ilosc"]);
  const matIdx   = find(["mater", "mat.", "cena mat", "material"]);
  const labIdx   = find(["roboc", "rob.", "labor", "praca", "montaż", "cena rob"]);
  const priceIdx = find(["cena", "price", "wartość", "wartosc", "kwota", "koszt"]);
  const secIdx   = find(["sekcj", "section", "pomieszcz", "room"]);

  const colCount = Math.max(headers.length, ...data.map(r => r.length), 1);

  if (nameIdx < 0) {
    const sample = data.slice(0, Math.min(15, data.length));
    const avgLen = Array(colCount).fill(0).map((_, c) => {
      const vals = sample.map(r => String(r[c] ?? "").trim()).filter(v => v.length > 0);
      return vals.length ? vals.reduce((s, v) => s + v.length, 0) / vals.length : 0;
    });
    nameIdx = avgLen.indexOf(Math.max(...avgLen));
  }

  if (unitIdx < 0) unitIdx = detectUnitColumn(data, colCount, nameIdx);
  if (qtyIdx < 0) {
    const excludeForQty = [nameIdx, unitIdx].filter(i => i >= 0);
    qtyIdx = detectQtyColumn(data, colCount, excludeForQty);
  }

  const afterName = nameIdx === 0 ? 1 : 0;
  if (qtyIdx < 0) qtyIdx = afterName;
  if (unitIdx < 0) unitIdx = qtyIdx + 1;

  if (qtyIdx >= 0 && unitIdx >= 0) {
    const sampleQtyVals = data.slice(0, 10).map(r => String(r[qtyIdx] ?? "").trim());
    const sampleUnitVals = data.slice(0, 10).map(r => String(r[unitIdx] ?? "").trim());
    const qtyHasUnits = sampleQtyVals.filter(v => isUnitValue(v)).length;
    const unitHasNumbers = sampleUnitVals.filter(v => isNumericValue(v) && !isUnitValue(v)).length;
    if (qtyHasUnits > 3 && unitHasNumbers > 3) {
      [qtyIdx, unitIdx] = [unitIdx, qtyIdx];
    }
  }

  return data.map((row): ExcelRow | null => {
    let name = String(row[nameIdx] ?? "").trim();
    if (!name) {
      // Fallback: first non-numeric, non-unit text cell
      const textCell = row.find((cell, ci) => {
        const v = String(cell ?? "").trim();
        return v.length > 0 && isNaN(parseFloat(v)) && !isUnitValue(v)
          && ci !== qtyIdx && ci !== unitIdx;
      });
      if (textCell) {
        name = String(textCell).trim();
      } else {
        // Last resort: any non-empty cell except qty/unit columns
        const anyCell = row.find((cell, ci) =>
          String(cell ?? "").trim().length > 0
          && ci !== qtyIdx && ci !== unitIdx
        );
        name = anyCell ? String(anyCell).trim() : "";
      }
    }
    if (!name) return null;

    const rawUnit = String(row[unitIdx] ?? "").trim();
    const unit = smartCorrectUnit(name, normalizeUnit(rawUnit || "kpl"));

    const rawQty = String(row[qtyIdx] ?? "1").replace(",", ".").replace(/[^\d.]/g, "");
    const qty = parseFloat(rawQty) || 1;

    // I4 fix: removed toUnitPriceS(qty*50) heuristic — it incorrectly divided unit prices
    // for large cables (e.g. 200mb × 5 PLN/mb became 1000 PLN/mb). Header-column mapping
    // (matIdx/labIdx vs priceIdx) is the correct source of truth for unit vs total price.
    const parsePriceS = (raw: string): number =>
      parseFloat(raw.replace(",", ".").replace(/[^\d.]/g, "")) || 0;

    let mat = 0, lab = 0;
    if (matIdx >= 0 && labIdx >= 0) {
      mat = parsePriceS(String(row[matIdx] ?? "0"));
      lab = parsePriceS(String(row[labIdx] ?? "0"));
    } else if (matIdx >= 0) {
      mat = parsePriceS(String(row[matIdx] ?? "0"));
    } else if (labIdx >= 0) {
      lab = parsePriceS(String(row[labIdx] ?? "0"));
    } else if (priceIdx >= 0) {
      const p = parsePriceS(String(row[priceIdx] ?? "0"));
      const cls = classifyRow(name);
      if (cls === "labor") lab = p;
      else if (cls === "material") mat = p;
      else { mat = Math.round(p * 0.6 * 100) / 100; lab = Math.round(p * 0.4 * 100) / 100; }
    }
    const sec = secIdx >= 0 ? String(row[secIdx] ?? "").trim() : "";
    return { name, unit, quantity: qty, materialPrice: mat, laborPrice: lab, section: sec, valid: true };
  }).filter((r): r is ExcelRow => r !== null);
}

// ─── Apply AI column map ──────────────────────────────────────────────────────

export function applyColumnMap(map: ExcelColumnMap, data: string[][]): ExcelRow[] {
  return data.map((row): ExcelRow | null => {
    let name = String(row[map.nameIdx] ?? "").trim();
    if (!name) {
      // First try: find first non-numeric, non-unit text cell
      const textCell = row.find((cell, ci) => {
        const v = String(cell ?? "").trim();
        return v.length > 0 && isNaN(parseFloat(v)) && !isUnitValue(v)
          && ci !== map.qtyIdx && ci !== map.unitIdx;
      });
      if (textCell) {
        name = String(textCell).trim();
      } else {
        // Last resort: any non-empty cell that's not qty/unit column
        const anyCell = row.find((cell, ci) =>
          String(cell ?? "").trim().length > 0
          && ci !== map.qtyIdx && ci !== map.unitIdx
        );
        name = anyCell ? String(anyCell).trim() : "";
      }
    }
    if (!name) return null;

    const rawUnit = map.unitIdx >= 0 ? String(row[map.unitIdx] ?? "").trim() : "";
    const unit = smartCorrectUnit(name, normalizeUnit(rawUnit || "kpl"));

    const rawQty = map.qtyIdx >= 0 ? String(row[map.qtyIdx] ?? "1") : "1";
    const qty = parseFloat(rawQty.replace(",", ".").replace(/[^\d.]/g, "")) || 1;

    // I4 fix: removed toUnitPrice(qty*50) heuristic — same fix as smartParseExcel()
    const parsePrice = (raw: string): number =>
      parseFloat(raw.replace(",", ".").replace(/[^\d.]/g, "")) || 0;

    let mat = 0, lab = 0;
    if (map.matIdx >= 0 && map.labIdx >= 0) {
      mat = parsePrice(String(row[map.matIdx] ?? "0"));
      lab = parsePrice(String(row[map.labIdx] ?? "0"));
    } else if (map.matIdx >= 0) {
      mat = parsePrice(String(row[map.matIdx] ?? "0"));
    } else if (map.labIdx >= 0) {
      lab = parsePrice(String(row[map.labIdx] ?? "0"));
    } else if (map.priceIdx >= 0) {
      const p = parsePrice(String(row[map.priceIdx] ?? "0"));
      const cls = classifyRow(name);
      if (cls === "labor") lab = p;
      else if (cls === "material") mat = p;
      else { mat = Math.round(p * 0.6 * 100) / 100; lab = Math.round(p * 0.4 * 100) / 100; }
    }

    const sec = map.secIdx >= 0 ? String(row[map.secIdx] ?? "").trim() : "";
    const rawKnr = map.knrIdx >= 0 ? String(row[map.knrIdx] ?? "").trim() : "";
    const knr_code = rawKnr ? rawKnr.replace(/\bc\.\d+\s*/gi, "").trim() || null : null;
    return { name, unit, quantity: qty, materialPrice: mat, laborPrice: lab, section: sec, knr_code, valid: true };
  }).filter((r): r is ExcelRow => r !== null);
}

// ─── Name cleaner: removes stray units/numbers from item names ──────────────

const UNIT_TOKENS_RE = /\b(szt\.?|mb|m\.b\.?|m2|m²|m3|m³|kpl\.?|kg|l|godz\.?|rbh|rbg|h|op\.?|zest\.?|pcs?|sztuk[ai]?|komplet|lm|para)\b/gi;

export function cleanItemName(raw: string): { name: string; extractedUnit?: string; extractedQty?: number } {
  let s = raw.trim();

  // 1) Try: "Szafa 42U APC 3 kpl" → extract trailing qty+unit
  const trailingQtyUnit = s.match(/^(.+?)\s+(\d+[.,]?\d*)\s+(szt\.?|mb|m\.b\.?|m2|m²|kpl\.?|kg|l|h|op\.?|zest\.?|pcs?)\s*$/i);
  if (trailingQtyUnit) {
    return {
      name: trailingQtyUnit[1].trim(),
      extractedQty: parseFloat(trailingQtyUnit[2].replace(",", ".")),
      extractedUnit: trailingQtyUnit[3].toLowerCase(),
    };
  }

  // 2) Try: "3 kpl Szafa 42U APC" → extract leading qty+unit
  const leadingQtyUnit = s.match(/^(\d+[.,]?\d*)\s+(szt\.?|mb|m\.b\.?|m2|m²|kpl\.?|kg|l|h|op\.?|pcs?)\s+(.+)$/i);
  if (leadingQtyUnit) {
    return {
      name: leadingQtyUnit[3].trim(),
      extractedQty: parseFloat(leadingQtyUnit[1].replace(",", ".")),
      extractedUnit: leadingQtyUnit[2].toLowerCase(),
    };
  }

  // 3) Strip orphan unit tokens from name ("Kabel UTP kpl" → "Kabel UTP")
  const UNIT_STRIP_PAT = /^(.+?)\s+(szt\.?|mb|m\.b\.?|m2|m²|m3|m³|kpl\.?|kg|l|godz\.?|rbh|rbg|h|op\.?|zest\.?|pcs?|sztuk[ai]?|komplet|lm|para)\s*$/i;
  const strippedUnit = s.match(UNIT_STRIP_PAT);
  if (strippedUnit && strippedUnit[1].trim().length >= 3) {
    return { name: strippedUnit[1].trim(), extractedUnit: strippedUnit[2].toLowerCase() };
  }

  return { name: s };
}

// ─── Przedmiar text parser ────────────────────────────────────────────────────

export function parsePrzedmiarText(text: string): AIProjectItem[] {
  const lines = text.trim().split("\n");
  const items: AIProjectItem[] = [];

  const UNIT_RE = /^(szt\.?|mb|m\.b\.?|m2|m²|m3|m³|kpl\.?|kg|l|godz\.?|rbh|rbg|komplet|sztuk[ai]?|metr[y]?|para|op\.?|zest\.?|h|t|cm|mm|mb\.|lm|pcs?|pkt\.?)$/i;
  const isUnit = (s: string) => UNIT_RE.test(s.trim());
  const isNumber = (s: string) => {
    const cleaned = s.trim().replace(",", ".").replace(/\s/g, "");
    const n = parseFloat(cleaned.replace(/[^\d.]/g, ""));
    return !isNaN(n) && n > 0 && /^[\d.,\s]+$/.test(s.trim());
  };
  const toNumber = (s: string) => parseFloat(s.trim().replace(",", ".").replace(/[^\d.]/g, "")) || 1;

  // ── Phase 1: pre-process lines into tokens ────────────────────────────────
  // Each token has type: "name" | "qty" | "unit" | "inline"
  // I5 fix: knrCode carries any KNR code extracted from the line prefix or a
  // preceding standalone KNR-header line, so the assembled item can store it.
  type Token = { raw: string; type: "name" | "qty" | "unit" | "inline"; knrCode?: string };
  const tokens: Token[] = [];

  // ── I5: KNR code extraction regexes ─────────────────────────────────────
  // Matches: "KNR 5-08 0401-01", "KNRW 2-23 0601-05", "KNR AT-26 0303-02"
  // KNR_PREFIX_RE — code followed by description text on the same line
  // KNR_STANDALONE_RE — line consists of ONLY the KNR code (position header line)
  const KNR_PREFIX_RE = /^(KNR[W]?\s+[\w-]{2,8}\s+[\d]{4}-[\d]{2,3})\s+/i;
  const KNR_STANDALONE_RE = /^(KNR[W]?\s+[\w-]{2,8}\s+[\d]{4}-[\d]{2,3})\s*$/i;
  // Carries a KNR code extracted from a standalone header line to the next name token
  let pendingKnrCode: string | undefined;

  // ── Noise-header detector ────────────────────────────────────────────────
  // Returns true for lines that are classification codes, TOC entries, section
  // chapter titles, page-number footers, RAZEM rows etc. — NOT real work items.
  const NOISE_KEYWORDS_RE = /^(razem|ogółem|ogołem|zestawienie|spis treści|strona tytułowa|klasyfikacja|wykonawca|inwestor|data opracowania|adres inwestycji|nazwa inwestycji|sporządził|sprawdził|PRZEDMIAR ROB|ogólna charakterystyka|przedmiotem opracowania|norma standard|w ramach instalac|zgodnie z projektem)/i;
  const isNoiseHeader = (s: string): boolean => {
    // CPV classification code: 8 digits, dash, 1 digit (e.g. "45311000-0 Roboty...")
    if (/^\d{8}-\d[\s\t]/.test(s)) return true;
    // Generic noise keywords
    if (NOISE_KEYWORDS_RE.test(s)) return true;
    // Table-of-contents entry: "N Text... PageNum" where line ends with 1–3 digit page nr
    // Heuristic: starts with single/double digit + space + long text + ends with number ≤999
    // AND contains no unit token (actual items would have szt/mb/kpl etc.)
    const tocMatch = s.match(/^(\d{1,2})\s+([A-ZŁŚĄŻŹĆŃÓĘ].{10,})\s+(\d{1,3})$/);
    if (tocMatch && Number(tocMatch[3]) <= 200) return true;
    // Pure section header: single ordinal + short title, no digit quantity inside
    // e.g. "I. Oświetlenie", "A. Instalacja", "DZIAŁ I"
    if (/^(DZIAŁ|ROZDZIAŁ|CZĘŚĆ|ETAP)\s+/i.test(s)) return true;
    return false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    if (isNoiseHeader(trimmed)) continue;

    // Strip description-section bullet dash prefix: "- montaż..." → "montaż..."
    const strippedLine = trimmed.startsWith('- ') ? trimmed.slice(2).trim() : trimmed;
    if (!strippedLine) continue;

    // ── I5: KNR code extraction ─────────────────────────────────────────────
    // If the line is ONLY a KNR code ("KNR 5-08 0401-01"), hold it for the
    // next name token. If the KNR code is a prefix of a longer line
    // ("KNR 5-08 0401-01 Montaż gniazda 230V"), strip it and keep the
    // description part as the effective line for further tokenization.
    let lineKnr: string | undefined;
    let processedLine = strippedLine;

    const knrStandaloneM = strippedLine.match(KNR_STANDALONE_RE);
    if (knrStandaloneM) {
      pendingKnrCode = knrStandaloneM[1].replace(/\s+/g, " ").toUpperCase();
      continue; // no description text on this line — nothing to tokenize
    }
    const knrPrefixM = strippedLine.match(KNR_PREFIX_RE);
    if (knrPrefixM) {
      lineKnr = knrPrefixM[1].replace(/\s+/g, " ").toUpperCase();
      processedLine = strippedLine.slice(knrPrefixM[0].length).trim();
      if (!processedLine) {
        pendingKnrCode = lineKnr;
        continue;
      }
    }

    // Tab/semicolon separated → treat as inline
    if (processedLine.includes("\t") || processedLine.includes(";")) {
      tokens.push({ raw: processedLine, type: "inline" });
      pendingKnrCode = undefined;
      continue;
    }

    // Try to detect inline: "Szafa 42U APC  3  kpl" or "3 kpl Szafa..."
    // Pattern: text qty unit  OR  qty unit text  OR  text unit qty
    const inlineFullMatch = processedLine.match(
      /^(.{3,}?)\s+(\d+[.,]?\d*)\s+(szt\.?|mb|m\.b\.?|m2|m²|kpl\.?|kg|l|godz\.?|rbh|h|op\.?|zest\.?|pcs?)$/i
    );
    if (inlineFullMatch) {
      tokens.push({ raw: processedLine, type: "inline", knrCode: lineKnr ?? pendingKnrCode });
      pendingKnrCode = undefined;
      continue;
    }
    const inlineQtyFirst = processedLine.match(
      /^(\d+[.,]?\d*)\s+(szt\.?|mb|m\.b\.?|m2|m²|kpl\.?|kg|l|godz\.?|rbh|h|op\.?|pcs?)\s+(.{3,})$/i
    );
    if (inlineQtyFirst) {
      tokens.push({ raw: processedLine, type: "inline", knrCode: lineKnr ?? pendingKnrCode });
      pendingKnrCode = undefined;
      continue;
    }

    // Pure number line
    if (isNumber(processedLine) && !isUnit(processedLine)) {
      tokens.push({ raw: processedLine, type: "qty" });
      continue;
    }

    // Pure unit line
    if (isUnit(processedLine)) {
      tokens.push({ raw: processedLine, type: "unit" });
      continue;
    }

    // Everything else is a name fragment — attach the extracted KNR code
    tokens.push({ raw: processedLine, type: "name", knrCode: lineKnr ?? pendingKnrCode });
    pendingKnrCode = undefined;
  }

  // ── Phase 2: group tokens into items ─────────────────────────────────────
  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];

    // Inline token → parse immediately
    if (tok.type === "inline") {
      const t = tok.raw;

      if (t.includes("\t") || t.includes(";")) {
        const sep = t.includes("\t") ? "\t" : ";";
        const parts = t.split(sep).map(s => s.trim()).filter(s => s.length > 0);

        // Smart [Lp, Name, Unit, Qty] detection:
        // 4-col table where first col is a small integer (row number), second is long text,
        // third is a unit word, fourth is the actual quantity.
        const looksLikeLpRow =
          parts.length >= 3 &&
          isNumber(parts[0]) && parseInt(parts[0]) >= 1 && parseInt(parts[0]) <= 9999 &&
          !isUnit(parts[0]) &&
          !isNumber(parts[1]) && parts[1].length >= 2 && // name = second col
          (parts.length < 3 || isUnit(parts[parts.length - 2]) || isNumber(parts[parts.length - 1]));

        if (looksLikeLpRow && parts.length >= 3) {
          // Determine name, unit, qty from positional mapping
          const nameVal = parts[1];
          // Last col = qty, second-to-last = unit (for 4-col), or last non-numeric = unit
          const unitVal = parts.length >= 4 && isUnit(parts[parts.length - 2])
            ? parts[parts.length - 2]
            : parts.find((p, idx) => idx >= 2 && isUnit(p)) ?? "kpl";
          const qtyVal = isNumber(parts[parts.length - 1])
            ? toNumber(parts[parts.length - 1])
            : 1;
          if (nameVal.length >= 1) {
            items.push({
              name: nameVal,
              unit: normalizeUnit(unitVal),
              quantity: qtyVal,
              material_price: 0, labor_price: 0,
            });
          }
          i++; continue;
        }

        // Standard logic for non-Lp separated rows
        const numParts = parts.filter(p => isNumber(p));
        const unitParts = parts.filter(p => isUnit(p));
        const textParts = parts.filter(p => !isNumber(p) && !isUnit(p) && p.length > 0);
        const nameVal = textParts.sort((a, b) => b.length - a.length)[0] ?? parts[0];
        if (nameVal && nameVal.length >= 1) {
          items.push({
            name: nameVal,
            unit: normalizeUnit(unitParts[0] ?? "kpl"),
            quantity: numParts.length > 0 ? toNumber(numParts[0]) : 1,
            material_price: 0, labor_price: 0,
          });
        }
        i++; continue;
      }

      // "Nazwa  qty  unit"
      const m1 = t.match(/^(.{3,}?)\s+(\d+[.,]?\d*)\s+(szt\.?|mb|m\.b\.?|m2|m²|kpl\.?|kg|l|godz\.?|rbh|h|op\.?|zest\.?|pcs?)$/i);
      if (m1) {
        items.push({ name: m1[1].trim(), unit: normalizeUnit(m1[3]), quantity: toNumber(m1[2]), material_price: 0, labor_price: 0 });
        i++; continue;
      }
      // "qty unit  Nazwa"
      const m2 = t.match(/^(\d+[.,]?\d*)\s+(szt\.?|mb|m\.b\.?|m2|m²|kpl\.?|kg|l|godz\.?|rbh|h|op\.?|pcs?)\s+(.{3,})$/i);
      if (m2) {
        items.push({ name: m2[3].trim(), unit: normalizeUnit(m2[2]), quantity: toNumber(m2[1]), material_price: 0, labor_price: 0 });
        i++; continue;
      }

      items.push({ name: t, unit: "kpl", quantity: 1, material_price: 0, labor_price: 0 });
      i++; continue;
    }

    // Name token → look ahead for qty + unit (multiline group)
    if (tok.type === "name") {
      const nameParts: string[] = [tok.raw];
      let qty = 1;
      let unit = "kpl";
      let j = i + 1;
      let qtyFound = false;
      let unitFound = false;

      // Accumulate more name fragments, then find qty and unit
      while (j < tokens.length) {
        const next = tokens[j];
        if (next.type === "name") {
          // Additional name fragment (e.g. "Szafa krosowa..." line 2)
          // Only merge if we haven't yet seen qty/unit
          nameParts.push(next.raw);
          j++;
        } else if (next.type === "qty") {
          qty = toNumber(next.raw);
          qtyFound = true;
          j++;
          // Look for unit right after qty
          if (j < tokens.length && tokens[j].type === "unit") {
            unit = normalizeUnit(tokens[j].raw);
            unitFound = true;
            j++;
          }
          break;
        } else if (next.type === "unit") {
          unit = normalizeUnit(next.raw);
          unitFound = true;
          j++;
          // Look for qty right after unit (unit before qty pattern)
          if (j < tokens.length && tokens[j].type === "qty") {
            qty = toNumber(tokens[j].raw);
            qtyFound = true;
            j++;
          }
          break;
        } else {
          // inline token → stop current group
          break;
        }
      }

      const rawNameVal = nameParts.join(" ").trim();
      const cleaned = cleanItemName(rawNameVal);
      const finalName = cleaned.name;
      if (cleaned.extractedUnit && unit === "kpl") { unit = normalizeUnit(cleaned.extractedUnit); unitFound = true; }
      if (cleaned.extractedQty && qty === 1) { qty = cleaned.extractedQty; qtyFound = true; }
      // Only import items with explicit quantity or unit — skip description-text paragraphs
      if (finalName.length >= 3 && (qtyFound || unitFound)) {
        items.push({
          name: finalName,
          unit,
          quantity: qty,
          material_price: 0,
          labor_price: 0,
          // I5 fix: KNR code extracted from line prefix or standalone header line
          knr_code: tok.knrCode ?? null,
        });
      }
      i = j;
      continue;
    }

    // Orphan qty/unit tokens (no name found before them) → skip silently
    i++;
  }

  return items;
}

// ─── Structured table parser (TSV / semicolon with header row) ───────────────
// Detects tables like: Lp. | Opis prac i materiałów | J.m. | Ilość
// Returns null if the text doesn't look like a structured table with headers.

export function parseStructuredTable(text: string): AIProjectItem[] | null {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;

  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") ? ";" : null;
  if (!sep) return null;

  const rawHeaders = lines[0].split(sep).map(h => h.trim());
  // Must have at least 2 non-empty header columns that look like labels (not data)
  const isHeaderRow = rawHeaders.filter(h => h.length > 0 && isNaN(parseFloat(h))).length >= 2;
  if (!isHeaderRow) return null;

  const headers = rawHeaders.map(h => h.toLowerCase().replace(/[.\s]/g, ""));

  const colIdx = (aliases: string[]) =>
    headers.findIndex(h => aliases.some(a => h.includes(a)));

  const nameIdx = colIdx(["opis", "nazwa", "pozycj", "material", "robocizna", "opis prac"]);
  const unitIdx = colIdx(["jm", "jedn", "jednostk"]);
  const qtyIdx  = colIdx(["ilo", "qty", "liczba", "kol"]);

  if (nameIdx === -1 || qtyIdx === -1) return null;

  const items: AIProjectItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.trim());
    if (cols.length < 2) continue;

    const name = cols[nameIdx]?.trim();
    if (!name || name.length < 2) continue;

    const rawQty = cols[qtyIdx]?.replace(",", ".") ?? "0";
    const qty = parseFloat(rawQty);
    if (isNaN(qty) || qty <= 0) continue;

    const rawUnit = unitIdx !== -1 ? (cols[unitIdx]?.trim() || "szt") : "szt";
    const unit = normalizeUnit(rawUnit);

    items.push({ name, quantity: qty, unit, material_price: 0, labor_price: 0 });
  }

  return items.length > 0 ? items : null;
}

// ─── Smart entry point: try structured table first, then free-text ────────────

export function parseTableOrText(text: string): AIProjectItem[] {
  const tableItems = parseStructuredTable(text);
  if (tableItems && tableItems.length > 0) return tableItems;
  return parsePrzedmiarText(text);
}

// ─── File parsing helpers ─────────────────────────────────────────────────────

export async function parseExcelFile(file: File): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  const XLSX = await import("xlsx-js-style");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rawData.length < 2) throw new Error("Plik jest pusty lub zawiera tylko nagłówki");

  const headers = rawData[0].map((h: string | number | boolean) => String(h || "").trim()).filter(Boolean);
  const dataRows = rawData.slice(1).filter(row => row.some((cell: string | number | boolean) => String(cell || "").trim()));

  const rows: ParsedRow[] = dataRows.map(row => {
    const obj: ParsedRow = {};
    headers.forEach((h, i) => { obj[h] = String(row[i] ?? "").trim(); });
    return obj;
  });

  return { headers, rows };
}

export async function parseCSVFile(file: File): Promise<{ headers: string[]; rows: ParsedRow[] }> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) throw new Error("Plik jest pusty lub zawiera tylko nagłówki");

  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ""; }
      else current += char;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).filter(Boolean);
  const dataRows = lines.slice(1).map(l => parseLine(l)).filter(r => r.some(c => c.trim()));
  const rows: ParsedRow[] = dataRows.map(row => {
    const obj: ParsedRow = {};
    headers.forEach((h, i) => { obj[h] = (row[i] ?? "").trim(); });
    return obj;
  });

  return { headers, rows };
}

export async function parseRawGrid(file: File): Promise<string[][]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext === "csv" || ext === "tsv") {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const firstLine = lines[0] || "";
    const delimiter = ext === "tsv" ? "\t" : firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";
    return lines.map(l => l.split(delimiter).map(s => s.trim().replace(/^"|"$/g, "")));
  }

  const XLSX = await import("xlsx-js-style");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  // I2 fix: merge ALL sheets — multi-sheet workbooks (e.g., Kosztorys + Zestawienie)
  // were silently dropping every sheet after the first one.
  const merged: string[][] = [];
  let firstSheetHeader: string[] | null = null;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (rows.length === 0) continue;

    if (firstSheetHeader === null) {
      // First non-empty sheet — take header + all data rows as-is
      firstSheetHeader = rows[0].map(String);
      merged.push(...rows);
    } else {
      // Subsequent sheets: skip the first row if it is an identical header
      const sheetFirstRow = rows[0].map(String);
      const isHeaderRow =
        sheetFirstRow.length === firstSheetHeader.length &&
        sheetFirstRow.every((cell, ci) => cell.toLowerCase() === firstSheetHeader![ci].toLowerCase());
      const dataRows = isHeaderRow ? rows.slice(1) : rows;
      merged.push(...dataRows.filter(row => row.some(cell => String(cell).trim() !== "")));
    }
  }

  return merged;
}
