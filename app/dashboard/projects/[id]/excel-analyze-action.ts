"use server";

import { requireAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";

export interface ExcelColumnMap {
  nameIdx: number;
  unitIdx: number;
  qtyIdx: number;
  matIdx: number;
  labIdx: number;
  priceIdx: number;
  secIdx: number;
  knrIdx: number;
  hasHeaders: boolean;
  confidence: "high" | "medium" | "low";
}

export async function analyzeExcelStructure(
  headers: string[],
  sampleRows: string[][]
): Promise<ExcelColumnMap | null> {
  let userId: string | null = null;
  try {
    const { user } = await requireAuth();
    userId = user.id;
  } catch {
    return null;
  }

  if (userId) {
    const aiCheck = await checkAndIncrementAiUsage(userId, "excelAnalyze");
    if (!aiCheck.allowed) return null;
  }

  const colCount = Math.max(headers.length, ...sampleRows.map(r => r.length), 1);

  // Build a compact table preview
  const allRows = [headers, ...sampleRows.slice(0, 8)];
  const tableText = allRows
    .map((row, i) => `Row${i}: ` + row.map((v, c) => `[${c}]=${JSON.stringify(String(v).slice(0, 60))}`).join("  "))
    .join("\n");

  const schema = z.object({
    nameIdx:  z.number().int().min(-1),
    unitIdx:  z.number().int().min(-1),
    qtyIdx:   z.number().int().min(-1),
    matIdx:   z.number().int().min(-1),
    labIdx:   z.number().int().min(-1),
    priceIdx: z.number().int().min(-1),
    secIdx:   z.number().int().min(-1),
    knrIdx:   z.number().int().min(-1),
    hasHeaders: z.boolean(),
    confidence: z.enum(["high", "medium", "low"]),
  });

  try {
    const { object } = await generateObject({
      model: google(AI_MODEL_TIER1),
      schema,
      system: `You are an expert at analyzing Polish electrical cost estimation Excel/CSV files.
Identify column indices (0-based, or -1 if not found) for:
- nameIdx: item description (longest text, Polish electrical work descriptions)
- unitIdx: unit of measure (szt, kpl, mb, m, m2, h, godz, komplet, sztuka, metr, etc.)
- qtyIdx: quantity (small positive number, integer or simple decimal — liczba sztuk/metrów)
- matIdx: material UNIT price in PLN (cena jednostkowa materiału — price PER ONE unit, NOT total/wartość). If only total price column exists, use priceIdx instead.
- labIdx: labor UNIT price in PLN (cena jednostkowa robocizny — price PER ONE unit, NOT total). If only total price column exists, use priceIdx instead.
- priceIdx: single combined UNIT price column (cena jedn.) — only if no separate mat/lab columns. NEVER point to a "Wartość", "Razem", "Total", "Suma" column (those are total = qty × unit_price).
- secIdx: section/room name (optional, e.g. Parter, Kuchnia, or -1)
- knrIdx: KNR code column ("Podstawa", "KNR", "Norma" — contains codes like "KNR 5-10 0118-23", or -1 if not found)
- hasHeaders: true if Row0 is a header row (not actual data)
- confidence: how certain you are

CRITICAL: matIdx/labIdx/priceIdx must point to UNIT price columns (cena jedn.), NOT to total value columns (wartość = ilość × cena). If you see both "Cena jedn." and "Wartość" — use "Cena jedn." for matIdx/priceIdx, set the other to -1.`,
      prompt: `Table has ${colCount} columns. Analyze this table:\n\n${tableText}`,
    });

    const fix = (n: number) => (n >= 0 && n < colCount) ? n : -1;
    return {
      nameIdx:  fix(object.nameIdx),
      unitIdx:  fix(object.unitIdx),
      qtyIdx:   fix(object.qtyIdx),
      matIdx:   fix(object.matIdx),
      labIdx:   fix(object.labIdx),
      priceIdx: fix(object.priceIdx),
      secIdx:   fix(object.secIdx),
      knrIdx:   fix(object.knrIdx),
      hasHeaders: object.hasHeaders,
      confidence: object.confidence,
    };
  } catch {
    return null;
  }
}
