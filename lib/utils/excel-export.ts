import XLSXStyle from 'xlsx-js-style';
import type { ProjectItem, ProjectWithRelations } from '@/lib/types/database';
import { flattenProjectItems } from '@/lib/utils/flatten-project-items';

// ─── Style helpers ─────────────────────────────────────────────────────────────

type XlsxCellStyle = {
  font?: { bold?: boolean; color?: { rgb: string }; sz?: number; name?: string };
  fill?: { fgColor?: { rgb: string }; patternType?: string };
  alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean; indent?: number };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
  numFmt?: string;
};

type XlsxCell = { v: string | number; t: string; s?: XlsxCellStyle };

// Solid fill helper
const fill = (rgb: string): XlsxCellStyle['fill'] => ({ fgColor: { rgb }, patternType: 'solid' });
const font = (opts: XlsxCellStyle['font']): XlsxCellStyle['font'] => opts;

// Common thin border (all sides)
const thinBorder = (rgb = 'C0C0C0'): XlsxCellStyle['border'] => ({
  top:    { style: 'thin', color: { rgb } },
  bottom: { style: 'thin', color: { rgb } },
  left:   { style: 'thin', color: { rgb } },
  right:  { style: 'thin', color: { rgb } },
});

// Accounting number format: right-aligned, thousands separator, 2 decimals
const FMT_ACCOUNTING = '#,##0.00 [$zł-415];[RED]-#,##0.00 [$zł-415]';

// Color DNA (ElektroSmart Unified)
const C_HEADER_BG   = '1E2937'; // slate-800
const C_HEADER_TEXT = 'FFFFFF';
const C_ORANGE_BG   = 'FFF3E0'; // orange tint — Material columns
const C_GREEN_BG    = 'E8F5E9'; // green tint  — Labor columns
const C_ZESTAW_BG   = 'FEF3C7'; // amber-100 — Zestaw parent row (more visible)
const C_ZESTAW_TEXT = '92400E'; // amber-900
const C_CHILD_BG    = 'FFFBEB'; // amber-50  — child row subtle tint
const C_CHILD_TEXT  = '78350F'; // amber-800 — child text
const C_SECTION_BG  = 'EEE8FF'; // violet tint — Section header
const C_SECTION_TXT = '5B21B6'; // violet-800
const C_SUM_BG      = 'F1F5F9'; // slate-100   — Summary rows
const C_TOTAL_BG    = '1E2937'; // slate-800   — Grand total row
const C_TOTAL_TEXT  = 'FFFFFF';

// Helper: make a styled cell
function sc(value: string | number, style: XlsxCellStyle): XlsxCell {
  const t = typeof value === 'number' ? 'n' : 's';
  return { v: value, t, s: style };
}

// Helper: empty styled cell
function ec(style: XlsxCellStyle = {}): XlsxCell {
  return { v: '', t: 's', s: style };
}

// Helper: convert 0-based col index to letter(s)
function colLetter(n: number): string {
  let s = '';
  let i = n;
  do {
    s = String.fromCharCode(65 + (i % 26)) + s;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return s;
}

// Helper: apply style to a range of cells in a row
function styleRow(ws: Record<string, XlsxCell>, rowIdx: number, colCount: number, style: XlsxCellStyle) {
  for (let c = 0; c < colCount; c++) {
    const addr = `${colLetter(c)}${rowIdx + 1}`;
    if (ws[addr]) {
      ws[addr].s = { ...ws[addr].s, ...style };
    } else {
      ws[addr] = { v: '', t: 's', s: style };
    }
  }
}

// ─── Core sheet builder ────────────────────────────────────────────────────────

type XlsxWorksheet = Record<string, unknown>;

interface BuildResult {
  ws: XlsxWorksheet;
  rowCount: number;
  headerRowIdx: number;    // 0-based index of the table column header row
  summaryStartIdx: number; // 0-based index of first PODSUMOWANIE row
  grandTotalIdx: number;   // 0-based index of the SUMA BRUTTO row
  hasOpisData: boolean;
  colCount: number;
}

function buildKosztorysSheet(
  project: ProjectWithRelations,
  items: ProjectItem[],
  isPro: boolean,
  showRg: boolean = false,
  matOwnedByClient: boolean = false,
  showKnr: boolean = false,
): BuildResult {
  // Flatten so every child item appears immediately after its parent
  const flatItems = flattenProjectItems(items);

  // ── Totals ──
  const materialTotal = flatItems.reduce((sum, item) => {
    return sum + ((item.final_material_price ?? item.material_price ?? 0) * item.quantity);
  }, 0);
  const laborTotal = flatItems.reduce((sum, item) => {
    return sum + ((item.final_labor_price ?? item.labor_price ?? 0) * item.quantity);
  }, 0);
  const subtotal = materialTotal + laborTotal;
  const adjMult = 1 + (project.adjustment_percentage || 0) / 100;
  const adjustedSubtotal = subtotal * adjMult;
  const adjMat = materialTotal * adjMult;
  const adjLab = laborTotal * adjMult;
  const kpPct = Number((project as unknown as Record<string, unknown>).kp_percent ?? 0);
  const zPct  = Number((project as unknown as Record<string, unknown>).z_percent  ?? 0);
  const kzPct = Number((project as unknown as Record<string, unknown>).kz_percent ?? 0);
  const kpAmt = adjLab * (kpPct / 100);
  const zAmt  = (adjLab + kpAmt) * (zPct / 100);
  const kzAmt = adjMat * (kzPct / 100);
  const totalNarzuty = kpAmt + zAmt + kzAmt;
  const subtotalWithNarzuty = adjustedSubtotal + totalNarzuty;
  const vatAmount = (subtotalWithNarzuty * project.vat_rate) / 100;
  const grandTotal = subtotalWithNarzuty + vatAmount;

  // ── Detect if Opis column has any data ──
  const hasOpisData = flatItems.some(i => !!(i.description || i.notes));

  // Column layout depends on whether Opis/r-g/knr/material are shown
  // Cols: Lp(0) | Pozycja(1) | [Opis] | [Kod KNR] | Jm | Ilość | [r-g] | [Cena mat.] | Cena rob. | Wartość
  const hasRg  = showRg;
  const hasMat = !matOwnedByClient;
  const hasKnr = showKnr;
  // 4 fixed (Lp+Pozycja+Jm+Ilo) + [Opis] + [KNR] + [r-g] + [Mat] + Rob + War
  const baseCount = 4 + (hasOpisData ? 1 : 0) + (hasKnr ? 1 : 0) + (hasRg ? 1 : 0) + (hasMat ? 1 : 0) + 2;
  const colCount = baseCount;
  // Column indices (0-based), computed sequentially
  const C_LP   = 0;
  const C_POS  = 1;
  const C_OPIS = hasOpisData ? 2 : -1;
  const opisOff = hasOpisData ? 1 : 0;
  const C_KNR  = hasKnr ? (2 + opisOff) : -1;
  const knrOff  = hasKnr ? 1 : 0;
  const C_JM   = 2 + opisOff + knrOff;
  const C_IL   = 3 + opisOff + knrOff;
  const C_RG   = hasRg  ? (4 + opisOff + knrOff) : -1;
  const rgOff  = hasRg  ? 1 : 0;
  const C_MAT  = hasMat ? (4 + opisOff + knrOff + rgOff) : -1;
  const matOff = hasMat ? 1 : 0;
  const C_ROB  = 4 + opisOff + knrOff + rgOff + matOff;
  const C_WAR  = C_ROB + 1;

  const rows: XlsxCell[][] = [];

  // ── Row 0: Title ──
  const titleRow: XlsxCell[] = Array(colCount).fill(null).map(() => ec());
  titleRow[0] = sc('KOSZTORYS INSTALACJI ELEKTRYCZNEJ', {
    font: font({ bold: true, sz: 14, color: { rgb: C_HEADER_BG }, name: 'Calibri' }),
    alignment: { horizontal: 'left', vertical: 'center' },
  });
  rows.push(titleRow);

  // ── Row 1: DEMO warning or empty ──
  const demoRow: XlsxCell[] = Array(colCount).fill(null).map(() => ec());
  if (!isPro) {
    demoRow[0] = sc('WERSJA DEMO — ceny ukryte. Przejdź na PRO, aby zobaczyć pełne ceny.', {
      font: font({ bold: true, color: { rgb: 'DC2626' }, sz: 10 }),
    });
  }
  rows.push(demoRow);

  // ── Row 2: empty ──
  rows.push(Array(colCount).fill(null).map(() => ec()));

  // ── Rows 3-5: Project info ──
  const metaLabelStyle: XlsxCellStyle = { font: font({ bold: true, color: { rgb: '334155' } }) };
  const metaValStyle:   XlsxCellStyle = { font: font({ color: { rgb: '1E293B' } }) };

  const statusLabel = project.status === 'draft' ? 'Wersja robocza'
    : project.status === 'final' ? 'Ukończony' : 'Zarchiwizowany';

  const r3: XlsxCell[] = Array(colCount).fill(null).map(() => ec());
  r3[0] = sc('PROJEKT:', metaLabelStyle); r3[1] = sc(project.name, metaValStyle);
  if (colCount >= 6) { r3[Math.floor(colCount / 2)] = sc('Status:', metaLabelStyle); r3[Math.floor(colCount / 2) + 1] = sc(statusLabel, metaValStyle); }
  rows.push(r3);

  const r4: XlsxCell[] = Array(colCount).fill(null).map(() => ec());
  r4[0] = sc('Typ obiektu:', metaLabelStyle); r4[1] = sc(project.object_types?.name || '-', metaValStyle);
  rows.push(r4);

  const r5: XlsxCell[] = Array(colCount).fill(null).map(() => ec());
  r5[0] = sc('VAT:', metaLabelStyle); r5[1] = sc(`${project.vat_rate}%`, metaValStyle);
  if (colCount >= 6) { r5[Math.floor(colCount / 2)] = sc('Korekta:', metaLabelStyle); r5[Math.floor(colCount / 2) + 1] = sc(`${project.adjustment_percentage || 0}%`, metaValStyle); }
  rows.push(r5);

  // ── Row 6: empty ──
  rows.push(Array(colCount).fill(null).map(() => ec()));

  // ── Rows 7-10: Client info ──
  const r7: XlsxCell[] = Array(colCount).fill(null).map(() => ec());
  r7[0] = sc('KLIENT', { font: font({ bold: true, sz: 11, color: { rgb: C_HEADER_BG } }) });
  rows.push(r7);

  const clientFields: [string, string][] = [
    ['Nazwa:', project.client_name || '-'],
    ['Adres:', project.client_address || '-'],
    ['NIP:', project.client_nip || '-'],
  ];
  for (const [label, val] of clientFields) {
    const cr: XlsxCell[] = Array(colCount).fill(null).map(() => ec());
    cr[0] = sc(label, metaLabelStyle); cr[1] = sc(val, metaValStyle);
    rows.push(cr);
  }

  // ── Row 11: empty ──
  rows.push(Array(colCount).fill(null).map(() => ec()));

  // ── Row 12: Table column header ──
  const headerRowIdx = rows.length;
  const headerLabels: string[] = [
    'Lp.',
    'Pozycja',
    ...(hasOpisData ? ['Opis'] : []),
    ...(hasKnr  ? ['Kod KNR'] : []),
    'Jm',
    'Ilość',
    ...(hasRg  ? ['r-g (rbh)'] : []),
    ...(hasMat ? ['Cena materiału (zł)'] : []),
    'Cena robocizny (zł)',
    'Wartość netto (zł)',
  ];

  const headerRow: XlsxCell[] = headerLabels.map((label, ci) => {
    let bgColor = C_HEADER_BG;
    if (C_MAT >= 0 && ci === C_MAT) bgColor = 'D97706'; // orange accent for Material
    if (ci === C_ROB) bgColor = '059669'; // green accent for Robocizna
    if (C_RG >= 0 && ci === C_RG) bgColor = '0369A1'; // blue accent for r-g
    if (C_KNR >= 0 && ci === C_KNR) bgColor = '5B21B6'; // violet accent for KNR
    return sc(label, {
      font: font({ bold: true, color: { rgb: C_HEADER_TEXT }, sz: 9 }),
      fill: fill(bgColor),
      alignment: { horizontal: ci >= C_ROB ? 'right' : (ci === C_LP ? 'center' : 'left'), vertical: 'center' },
      border: thinBorder(C_HEADER_BG),
    });
  });
  rows.push(headerRow);

  // ── Rows 13+: Items data ──
  const hasSections = flatItems.some(i => i.section && !i.is_assembly_child);
  let lastSection = '__INIT__';
  let itemNumber = 1;

  // Pre-compute section subtotals
  const sectionTotals = new Map<string, number>();
  if (hasSections) {
    const parentIds = new Set(flatItems.filter(i => i.is_assembly_child).map(i => i.parent_assembly_id).filter(Boolean));
    flatItems.forEach(item => {
      if (item.is_assembly_child) return;
      const sec = item.section || '';
      const prev = sectionTotals.get(sec) || 0;
      if (parentIds.has(item.id)) {
        const children = flatItems.filter(c => c.parent_assembly_id === item.id);
        const childSum = children.reduce((acc, c) => {
          return acc + ((c.final_material_price ?? c.material_price ?? 0) + (c.final_labor_price ?? c.labor_price ?? 0)) * c.quantity;
        }, 0);
        sectionTotals.set(sec, prev + childSum);
      } else {
        const mat = item.final_material_price ?? item.material_price ?? 0;
        const lab = item.final_labor_price ?? item.labor_price ?? 0;
        sectionTotals.set(sec, prev + (mat + lab) * item.quantity);
      }
    });
  }

  // Identify assembly parents
  const assemblyParentIds = new Set(
    flatItems.filter(i => i.is_assembly_child).map(i => i.parent_assembly_id).filter(Boolean)
  );

  flatItems.forEach((item) => {
    // Section header row
    if (hasSections && !item.is_assembly_child) {
      const currentSection = item.section || '';
      if (currentSection !== lastSection) {
        rows.push(Array(colCount).fill(null).map(() => ec()));
        const secTotal = sectionTotals.get(currentSection) || 0;
        const sRow: XlsxCell[] = Array(colCount).fill(null).map(() =>
          sc('', { fill: fill(C_SECTION_BG), font: font({ bold: true, color: { rgb: C_SECTION_TXT } }) })
        );
        sRow[C_POS] = sc(`▸ ${currentSection || 'Inne pozycje'}`, {
          font: font({ bold: true, color: { rgb: C_SECTION_TXT }, sz: 9 }),
          fill: fill(C_SECTION_BG),
        });
        if (isPro) {
          sRow[C_WAR] = sc(secTotal, {
            font: font({ bold: true, color: { rgb: C_SECTION_TXT } }),
            fill: fill(C_SECTION_BG),
            numFmt: FMT_ACCOUNTING,
            alignment: { horizontal: 'right' },
          });
        } else {
          sRow[C_WAR] = sc('*** zł', { font: font({ bold: true, color: { rgb: 'DC2626' } }), fill: fill(C_SECTION_BG) });
        }
        rows.push(sRow);
        lastSection = currentSection;
      }
    }

    const matPrice = item.final_material_price ?? item.material_price ?? 0;
    const labPrice = item.final_labor_price ?? item.labor_price ?? 0;
    const isChild   = item.is_assembly_child === true;
    const isZestaw  = assemblyParentIds.has(item.id);

    // For Zestaw parents compute total from children (own price is usually 0)
    const ownTotal = (matPrice + labPrice) * item.quantity;
    const totalPrice = isZestaw
      ? flatItems.filter(c => c.parent_assembly_id === item.id).reduce(
          (acc, c) => acc + ((c.final_material_price ?? c.material_price ?? 0) + (c.final_labor_price ?? c.labor_price ?? 0)) * c.quantity, 0
        )
      : ownTotal;

    // Row style selection
    const rowBg     = isZestaw ? C_ZESTAW_BG : (isChild ? C_CHILD_BG : 'FFFFFF');
    const textRgb   = isZestaw ? C_ZESTAW_TEXT : (isChild ? C_CHILD_TEXT : '1E293B');
    const baseFont  = font({ bold: isZestaw, color: { rgb: textRgb }, sz: 9 });
    const baseFill  = fill(rowBg);
    // Left border: orange thick for Zestaw parent, orange thin for child, gray for regular
    const baseBorder: XlsxCellStyle['border'] = isZestaw
      ? { ...thinBorder('E2E8F0'), left: { style: 'medium', color: { rgb: 'F97316' } } }
      : isChild
      ? { ...thinBorder('E2E8F0'), left: { style: 'thin', color: { rgb: 'FB923C' } } }
      : thinBorder('E2E8F0');

    const dataRow: XlsxCell[] = Array(colCount).fill(null).map(() =>
      sc('', { fill: baseFill, font: baseFont, border: baseBorder })
    );

    // Lp.
    dataRow[C_LP] = sc(isChild ? '' : itemNumber++, {
      fill: baseFill, font: baseFont, border: baseBorder,
      alignment: { horizontal: 'center', vertical: 'center' },
    });

    // Pozycja — child gets ↳ prefix + indent
    const posName = isChild ? `  ↳ ${item.name}` : item.name;
    dataRow[C_POS] = sc(posName, {
      fill: baseFill,
      font: font({ bold: isZestaw, color: { rgb: textRgb }, sz: 9 }),
      border: baseBorder,
      alignment: isChild
        ? { horizontal: 'left', indent: 2 }
        : { horizontal: 'left' },
    });

    // Opis (only if shown)
    if (C_OPIS >= 0) {
      dataRow[C_OPIS] = sc(item.description || item.notes || '', {
        fill: baseFill, font: font({ color: { rgb: '64748B' }, sz: 8 }), border: baseBorder,
      });
    }

    // Kod KNR (only if showKnr)
    if (C_KNR >= 0) {
      const knrVal = (item as unknown as Record<string, unknown>).knr_code as string | null | undefined;
      dataRow[C_KNR] = sc(knrVal || '', {
        fill: fill('F5F3FF'), font: font({ color: { rgb: '5B21B6' }, sz: 8 }), border: baseBorder,
        alignment: { horizontal: 'left' },
      });
    }

    // Jm
    dataRow[C_JM] = sc(item.unit, {
      fill: baseFill, font: baseFont, border: baseBorder,
      alignment: { horizontal: 'center' },
    });

    // Ilość
    dataRow[C_IL] = sc(item.quantity, {
      fill: baseFill, font: baseFont, border: baseBorder,
      alignment: { horizontal: 'center' },
      numFmt: '0.##',
    });

    // r-g (labor hours) — only if showRg
    if (C_RG >= 0) {
      const rgVal = (item as unknown as Record<string, unknown>).labor_hours_total;
      const rgStr = rgVal != null ? `${Number(rgVal).toFixed(2)} rbh` : '—';
      dataRow[C_RG] = sc(rgStr, {
        fill: fill('EFF6FF'), font: font({ color: { rgb: '0369A1' }, sz: 8 }), border: baseBorder,
        alignment: { horizontal: 'right' },
      });
    }

    // Cena materiału — orange accent fill (hidden if matOwnedByClient)
    if (C_MAT >= 0) {
      if (isZestaw) {
        dataRow[C_MAT] = sc('\u2014', { fill: fill(C_ORANGE_BG), font: font({ bold: true, color: { rgb: 'F97316' }, sz: 9 }), border: baseBorder, alignment: { horizontal: 'center' } });
      } else if (isPro) {
        dataRow[C_MAT] = sc(matPrice, {
          fill: fill(C_ORANGE_BG), font: baseFont, border: baseBorder,
          alignment: { horizontal: 'right' }, numFmt: FMT_ACCOUNTING,
        });
      } else {
        dataRow[C_MAT] = sc('*** z\u0142', { fill: fill(C_ORANGE_BG), font: font({ color: { rgb: 'DC2626' }, sz: 9 }), border: baseBorder, alignment: { horizontal: 'right' } });
      }
    }

    // Cena robocizny — green accent fill
    if (isZestaw) {
      dataRow[C_ROB] = sc('\u2014', { fill: fill(C_GREEN_BG), font: font({ bold: true, color: { rgb: '059669' }, sz: 9 }), border: baseBorder, alignment: { horizontal: 'center' } });
    } else if (isPro) {
      dataRow[C_ROB] = sc(labPrice, {
        fill: fill(C_GREEN_BG), font: baseFont, border: baseBorder,
        alignment: { horizontal: 'right' }, numFmt: FMT_ACCOUNTING,
      });
    } else {
      dataRow[C_ROB] = sc('*** z\u0142', { fill: fill(C_GREEN_BG), font: font({ color: { rgb: 'DC2626' }, sz: 9 }), border: baseBorder, alignment: { horizontal: 'right' } });
    }

    // Wartość netto
    if (isPro) {
      dataRow[C_WAR] = sc(totalPrice, {
        fill: baseFill, font: font({ bold: isZestaw, color: { rgb: textRgb }, sz: 9 }), border: baseBorder,
        alignment: { horizontal: 'right' }, numFmt: FMT_ACCOUNTING,
      });
    } else {
      dataRow[C_WAR] = sc('*** zł', { fill: baseFill, font: font({ color: { rgb: 'DC2626' }, sz: 9 }), border: baseBorder, alignment: { horizontal: 'right' } });
    }

    rows.push(dataRow);
  });

  // ── Empty rows before summary ──
  rows.push(Array(colCount).fill(null).map(() => ec()));
  rows.push(Array(colCount).fill(null).map(() => ec()));

  // ── PODSUMOWANIE block ──
  const summaryStartIdx = rows.length;

  // Title row
  const sumTitleRow: XlsxCell[] = Array(colCount).fill(null).map(() =>
    sc('', { fill: fill('EFF6FF'), border: thinBorder('93C5FD') })
  );
  sumTitleRow[C_WAR - 1] = sc('PODSUMOWANIE', {
    font: font({ bold: true, sz: 11, color: { rgb: C_HEADER_BG } }),
    fill: fill('DBEAFE'), border: thinBorder('93C5FD'),
    alignment: { horizontal: 'right', vertical: 'center' },
  });
  sumTitleRow[C_WAR] = ec({ fill: fill('DBEAFE'), border: thinBorder('93C5FD') });
  rows.push(sumTitleRow);

  // Summary helper
  const addSumRow = (label: string, value: number | string, highlight = false) => {
    const bgColor = highlight ? 'FEF3C7' : C_SUM_BG;
    const textColor = highlight ? '92400E' : '334155';
    const sumRow: XlsxCell[] = Array(colCount).fill(null).map(() =>
      sc('', { fill: fill(bgColor), border: thinBorder('CBD5E1') })
    );
    sumRow[C_WAR - 1] = sc(label, {
      font: font({ bold: highlight, color: { rgb: textColor }, sz: 9 }),
      fill: fill(bgColor), border: thinBorder('CBD5E1'),
      alignment: { horizontal: 'right', vertical: 'center' },
    });
    sumRow[C_WAR] = typeof value === 'number'
      ? sc(value, { font: font({ bold: highlight, color: { rgb: textColor }, sz: 9 }), fill: fill(bgColor), border: thinBorder('CBD5E1'), numFmt: FMT_ACCOUNTING, alignment: { horizontal: 'right' } })
      : sc(value as string, { font: font({ bold: highlight, color: { rgb: 'DC2626' }, sz: 9 }), fill: fill(bgColor), border: thinBorder('CBD5E1'), alignment: { horizontal: 'right' } });
    rows.push(sumRow);
  };

  addSumRow('Suma Materiały:', isPro ? adjMat : '*** zł');
  addSumRow('Suma Robocizna:', isPro ? adjLab : '*** zł');

  if (project.adjustment_percentage && project.adjustment_percentage !== 0) {
    const korektaVal = adjustedSubtotal - subtotal;
    const korektaLabel = project.adjustment_percentage < 0
      ? `Rabat (${project.adjustment_percentage}%):`
      : `Korekta (+${project.adjustment_percentage}%):`;
    addSumRow(korektaLabel, isPro ? korektaVal : '*** zł', true);
  }

  if (totalNarzuty > 0) {
    if (kpAmt > 0) addSumRow(`Kp (${kpPct}%):`, isPro ? kpAmt : '*** zł');
    if (zAmt  > 0) addSumRow(`Z (${zPct}%):`,   isPro ? zAmt  : '*** zł');
    if (kzAmt > 0) addSumRow(`Kz (${kzPct}%):`, isPro ? kzAmt : '*** zł');
  }

  addSumRow('Suma Netto:', isPro ? subtotalWithNarzuty : '*** zł');
  addSumRow(`VAT (${project.vat_rate}%):`, isPro ? vatAmount : '*** zł');

  // Grand total row — dark background (no empty separator — cleaner look)
  const grandTotalIdx = rows.length;
  const gtRow: XlsxCell[] = Array(colCount).fill(null).map(() =>
    sc('', { fill: fill(C_TOTAL_BG), border: thinBorder(C_TOTAL_BG) })
  );
  gtRow[C_WAR - 1] = sc('RAZEM BRUTTO:', {
    font: font({ bold: true, sz: 11, color: { rgb: C_TOTAL_TEXT } }),
    fill: fill(C_TOTAL_BG), border: thinBorder(C_TOTAL_BG),
    alignment: { horizontal: 'right', vertical: 'center' },
  });
  gtRow[C_WAR] = isPro
    ? sc(grandTotal, { font: font({ bold: true, sz: 11, color: { rgb: C_TOTAL_TEXT } }), fill: fill(C_TOTAL_BG), border: thinBorder(C_TOTAL_BG), numFmt: FMT_ACCOUNTING, alignment: { horizontal: 'right' } })
    : sc('*** zł', { font: font({ bold: true, sz: 11, color: { rgb: 'FCA5A5' } }), fill: fill(C_TOTAL_BG), border: thinBorder(C_TOTAL_BG), alignment: { horizontal: 'right' } });
  rows.push(gtRow);

  // ── Assemble worksheet ──
  const ws: XlsxWorksheet = {};
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell !== null) ws[`${colLetter(c)}${r + 1}`] = cell;
    });
  });

  // ── Uwagi block — injected LEFT of podsumowanie ──
  // Columns A–C_JM-1 (left side), rows summaryStartIdx..grandTotalIdx
  const uwagi = (project.notes || '').trim();
  const uwagiEndCol = Math.max(0, C_JM - 1); // cols A..JM-1 (left side)
  if (uwagiEndCol >= 1) {
    // Title cell
    const uwTitleAddr = `A${summaryStartIdx + 1}`;
    ws[uwTitleAddr] = sc('Uwagi do kosztorysu:', {
      font: font({ bold: true, sz: 10, color: { rgb: C_HEADER_BG } }),
      fill: fill('DBEAFE'),
      border: thinBorder('93C5FD'),
      alignment: { horizontal: 'left', vertical: 'center' },
    });
    // Fill rest of title row in uwagi range
    for (let c = 1; c <= uwagiEndCol; c++) {
      ws[`${colLetter(c)}${summaryStartIdx + 1}`] = ec({ fill: fill('DBEAFE'), border: thinBorder('93C5FD') });
    }

    // Notes text — spans rows summaryStartIdx+1 .. grandTotalIdx (all sum rows)
    const uwTextAddr = `A${summaryStartIdx + 2}`;
    ws[uwTextAddr] = sc(uwagi || '—', {
      font: font({ sz: 9, color: { rgb: '334155' } }),
      fill: fill('F8FAFC'),
      border: thinBorder('CBD5E1'),
      alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
    });
    // Fill right cols + remaining rows in uwagi range
    for (let c = 1; c <= uwagiEndCol; c++) {
      ws[`${colLetter(c)}${summaryStartIdx + 2}`] = ec({ fill: fill('F8FAFC'), border: thinBorder('CBD5E1') });
    }
    for (let r = summaryStartIdx + 2; r <= grandTotalIdx; r++) {
      for (let c = 0; c <= uwagiEndCol; c++) {
        const addr = `${colLetter(c)}${r + 1}`;
        if (!ws[addr] || (ws[addr] as XlsxCell).v === '') {
          ws[addr] = ec({ fill: fill('F8FAFC'), border: thinBorder('CBD5E1') });
        }
      }
    }
  }

  // Sheet range
  ws['!ref'] = `A1:${colLetter(colCount - 1)}${rows.length}`;

  // ── Merged cells ──
  // Row 1 (index 0): Title — full width merge
  // Row 2 (index 1): DEMO warning — full width merge (if shown)
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }, // Title row
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } }, // DEMO row
  ];
  // Uwagi merges: title row + text block
  if (uwagiEndCol >= 1) {
    merges.push({ s: { r: summaryStartIdx, c: 0 }, e: { r: summaryStartIdx, c: uwagiEndCol } }); // uwagi title
    merges.push({ s: { r: summaryStartIdx + 1, c: 0 }, e: { r: grandTotalIdx, c: uwagiEndCol } }); // uwagi text
  }
  ws['!merges'] = merges;

  return {
    ws,
    rowCount: rows.length,
    headerRowIdx,
    summaryStartIdx,
    grandTotalIdx,
    hasOpisData,
    colCount,
  };
}

// ─── Column widths builder ─────────────────────────────────────────────────────

function buildColWidths(hasOpisData: boolean, showRg: boolean, matOwnedByClient: boolean, showKnr: boolean = false): unknown[] {
  // Build widths matching column layout: Lp | Pozycja | [Opis] | [KNR] | Jm | Ilo | [r-g] | [Mat] | Rob | War
  const cols: { wch: number }[] = [
    { wch: 7  }, // Lp.
    { wch: hasOpisData ? 30 : (showKnr ? 32 : 40) }, // Pozycja
  ];
  if (hasOpisData)  cols.push({ wch: 22 }); // Opis
  if (showKnr)      cols.push({ wch: 18 }); // Kod KNR
  cols.push({ wch: 8 });  // Jm
  cols.push({ wch: 7 });  // Ilość
  if (showRg)            cols.push({ wch: 12 }); // r-g
  if (!matOwnedByClient) cols.push({ wch: 20 }); // Cena materiału
  cols.push({ wch: 20 }); // Cena robocizny
  cols.push({ wch: 20 }); // Wartość netto
  return cols;
}

// ─── Row heights ───────────────────────────────────────────────────────────────

function buildRowHeights(rowCount: number, headerRowIdx: number, grandTotalIdx: number): unknown[] {
  return Array.from({ length: rowCount }, (_, r) => {
    if (r === 0) return { hpt: 22 };          // Title
    if (r === headerRowIdx) return { hpt: 20 }; // Column header
    if (r === grandTotalIdx) return { hpt: 22 }; // Grand total
    return { hpt: 16 };
  });
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Export project to styled Excel file — ElektroSmart Unified v1.0
 */
export function exportProjectToExcel(
  project: ProjectWithRelations,
  items: ProjectItem[],
  isPro: boolean = true
) {
  const showRg = Boolean((project as unknown as Record<string, unknown>).show_labor_hours_in_pdf);
  const matOwnedByClient = Boolean((project as unknown as Record<string, unknown>).materials_owned_by_customer);
  const showKnr = Boolean((project as unknown as Record<string, unknown>).show_knr);
  const workbook = XLSXStyle.utils.book_new();
  const result = buildKosztorysSheet(project, items, isPro, showRg, matOwnedByClient, showKnr);
  const { ws, rowCount, headerRowIdx, grandTotalIdx, hasOpisData } = result;

  ws['!cols'] = buildColWidths(hasOpisData, showRg, matOwnedByClient, showKnr);
  ws['!rows'] = buildRowHeights(rowCount, headerRowIdx, grandTotalIdx);

  XLSXStyle.utils.book_append_sheet(workbook, ws as never, 'Kosztorys');

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${safeName}_${dateStr}_${timeStr}.xlsx`;

  XLSXStyle.writeFile(workbook as never, fileName);

  try {
    const buffer = XLSXStyle.write(workbook as never, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    return { buffer, storageName: `Kosztorys_Excel_${safeName}.xlsx` };
  } catch {
    return undefined;
  }
}

/**
 * Build Excel buffer WITHOUT triggering a download.
 * Used for auto-saving to project documents on finalization.
 */
export function buildExcelBuffer(
  project: ProjectWithRelations,
  items: ProjectItem[],
  isPro: boolean = true
): { buffer: ArrayBuffer; storageName: string } | undefined {
  try {
    const showRg2 = Boolean((project as unknown as Record<string, unknown>).show_labor_hours_in_pdf);
    const matOwned2 = Boolean((project as unknown as Record<string, unknown>).materials_owned_by_customer);
    const showKnr2 = Boolean((project as unknown as Record<string, unknown>).show_knr);
    const workbook = XLSXStyle.utils.book_new();
    const result = buildKosztorysSheet(project, items, isPro, showRg2, matOwned2, showKnr2);
    const { ws, rowCount, headerRowIdx, grandTotalIdx, hasOpisData } = result;

    ws['!cols'] = buildColWidths(hasOpisData, showRg2, matOwned2, showKnr2);
    ws['!rows'] = buildRowHeights(rowCount, headerRowIdx, grandTotalIdx);

    XLSXStyle.utils.book_append_sheet(workbook, ws as never, 'Kosztorys');

    const buffer = XLSXStyle.write(workbook as never, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const safeName = project.name.replace(/[^a-zA-Z0-9]/g, '_');
    return { buffer, storageName: `Kosztorys_Excel_${safeName}.xlsx` };
  } catch {
    return undefined;
  }
}

/**
 * Export catalog items to Excel (unchanged — no style needed for catalog)
 */
export function exportCatalogToExcel(
  items: Array<{
    name: string;
    description?: string | null;
    category: string;
    unit: string;
    material_price?: number | null;
    labor_price?: number | null;
    subcategory?: string | null;
    item_type?: string | null;
  }>
) {
  const workbook = XLSXStyle.utils.book_new();

  const catalogData = [
    ['Nazwa', 'Opis', 'Kategoria', 'Podkategoria', 'Typ', 'Jednostka', 'Cena materiału (zł)', 'Cena robocizny (zł)'],
    ...items.map((item) => [
      item.name,
      item.description || '-',
      item.category,
      item.subcategory || '-',
      item.item_type || '-',
      item.unit,
      item.material_price?.toFixed(2) || '0.00',
      item.labor_price?.toFixed(2) || '0.00',
    ]),
  ];

  const ws = XLSXStyle.utils.aoa_to_sheet(catalogData);
  XLSXStyle.utils.book_append_sheet(workbook, ws, 'Katalog');

  const fileName = `Katalog_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSXStyle.writeFile(workbook as never, fileName);
}
