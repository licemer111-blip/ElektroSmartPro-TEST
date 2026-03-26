"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { buildDynamicSystemPrompt } from "@/lib/ai-master-brain";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import { z } from "zod";

// Reference patterns for electrical item normalization
const ELECTRICAL_NORMALIZATION_RULES = `
ZASADY NORMALIZACJI NAZW ELEKTRYCZNYCH (dla wykrywania duplikatów):

1. KABLE I PRZEWODY - te same pozycje:
   - "YDY 3x1,5" = "YDY 3x1.5" = "YDY 3x1,5mm²" = "Kabel YDY 3x1.5mm2"
   - "YDYp 3x2,5" = "Przewód YDYp 3x2.5" = "YDYp płaski 3x2,5mm²"
   - "Kabel zasilający 3x1,5" może być = "YDY 3x1,5" jeśli kontekst wskazuje

2. OSPRZĘT - te same pozycje:
   - "Puszka podtynkowa fi60" = "Puszka 60mm" = "Puszka elektryczna podtynkowa 60"
   - "Puszka natynkowa 80x80" = "Puszka n/t 80" = "Puszka natynkowa kwadratowa"
   - "Gniazdo podwójne z/u" = "Gniazdo 2x z uziemieniem" = "Gniazdo wtyczkowe podwójne"
   - "Łącznik pojedynczy" = "Wyłącznik światła" = "Włącznik jednobiegunowy"
   - "Łącznik schodowy" = "Wyłącznik schodowy" = "Przełącznik schodowy"

3. OPRAWY - te same pozycje:
   - "Oprawa LED 18W" = "Panel LED 18W" = "Lampa LED 18W sufitowa"
   - "Downlight LED 10W" = "Oprawa wpuszczana LED 10W" = "Oczko LED 10W"
   - "Oprawa liniowa 36W" = "Świetlówka LED 36W" = "Oprawa natynkowa 36W"

4. APARATURA - te same pozycje:
   - "Wyłącznik nadprądowy B16" = "Bezpiecznik B16" = "MCB B16A"
   - "Wyłącznik różnicowoprądowy 25A/30mA" = "RCD 25/30" = "Różnicówka 25A"
   - "Rozłącznik izolacyjny" = "Wyłącznik główny" = "Rozłącznik mocy"

5. JEDNOSTKI - równoważne:
   - "szt" = "szt." = "sztuk" = "sztuka"
   - "mb" = "m.b." = "metr bieżący" = "m"
   - "kpl" = "kpl." = "komplet"

WAŻNE: Pozycje są DUPLIKATAMI jeśli:
- Opisują ten sam produkt (nawet różnymi słowami)
- Mają tę samą lub podobną jednostkę
- Różnica ceny < 20% (uwzględnij różnice jakości/producenta)
`;

interface DuplicateItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  final_material_price: number;
  final_labor_price: number;
  duplicateOf?: string;
  similarityScore: number;
}

interface DuplicateGroup {
  masterItem: DuplicateItem;
  duplicates: DuplicateItem[];
  totalWasted: number;
}

/**
 * Find duplicate items in a project
 * Uses fuzzy matching algorithm to detect similar items
 */
export async function findDuplicates(
  projectId: string
): Promise<{ success: boolean; groups?: DuplicateGroup[]; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // Verify project access (defence-in-depth on top of RLS)
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return { success: false, error: "Nie masz uprawnień do tego projektu" };
    }

    // Get all project items
    const { data: items, error } = await supabase
      .from("project_items")
      .select("*")
      .eq("project_id", projectId);

    if (error || !items) {
      return { success: false, error: "Nie można pobrać pozycji" };
    }

    // Find duplicates using similarity algorithm
    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    for (let i = 0; i < items.length; i++) {
      const item1 = items[i];
      
      if (processedIds.has(item1.id)) continue;

      const similarItems: DuplicateItem[] = [];

      for (let j = i + 1; j < items.length; j++) {
        const item2 = items[j];
        
        if (processedIds.has(item2.id)) continue;

        const similarity = calculateSimilarity(item1, item2);

        if (similarity > 0.8) {
          similarItems.push({
            ...item2,
            similarityScore: similarity,
          });
          processedIds.add(item2.id);
        }
      }

      if (similarItems.length > 0) {
        const totalWasted = similarItems.reduce((sum, dup) => {
          return sum + (dup.quantity * (dup.final_material_price + dup.final_labor_price));
        }, 0);

        duplicateGroups.push({
          masterItem: {
            ...item1,
            similarityScore: 1.0,
          },
          duplicates: similarItems,
          totalWasted,
        });
        processedIds.add(item1.id);
      }
    }

    return {
      success: true,
      groups: duplicateGroups,
    };
  } catch (error) {
    logger.error("findDuplicates error:", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Calculate similarity between two items
 * Returns 0-1 score (1 = identical, 0 = completely different)
 */
interface ProjectItemForComparison {
  name: string;
  unit: string;
  final_material_price: number;
  final_labor_price: number;
}

function calculateSimilarity(item1: ProjectItemForComparison, item2: ProjectItemForComparison): number {
  let score = 0;
  let checks = 0;

  // 1. Name similarity (most important)
  const nameSim = stringSimilarity(
    item1.name.toLowerCase(),
    item2.name.toLowerCase()
  );
  score += nameSim * 3; // Weight 3×
  checks += 3;

  // 2. Unit match (exact)
  if (item1.unit === item2.unit) {
    score += 1;
  }
  checks += 1;

  // 3. Price similarity (within 10%)
  const price1 = item1.final_material_price + item1.final_labor_price;
  const price2 = item2.final_material_price + item2.final_labor_price;
  
  if (price1 > 0 && price2 > 0) {
    const priceDiff = Math.abs(price1 - price2) / Math.max(price1, price2);
    if (priceDiff < 0.1) {
      score += 1;
    }
    checks += 1;
  }

  return score / checks;
}

/**
 * Calculate string similarity using Levenshtein-like algorithm
 * Simplified version for performance
 */
function stringSimilarity(str1: string, str2: string): number {
  // Quick exact match
  if (str1 === str2) return 1.0;

  // Normalize for electrical terms
  const normalized1 = normalizeElectricalName(str1);
  const normalized2 = normalizeElectricalName(str2);
  
  if (normalized1 === normalized2) return 0.95;

  // Check if one contains the other
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return 0.9;
  }

  // Tokenize and check overlap
  const tokens1 = new Set(normalized1.split(/\s+/));
  const tokens2 = new Set(normalized2.split(/\s+/));

  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);

  // Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Normalize electrical item names for better matching
 */
function normalizeElectricalName(name: string): string {
  let normalized = name.toLowerCase()
    // Normalize units
    .replace(/mm²|mm2|mm/gi, '')
    .replace(/\bszt\.?\b/gi, '')
    .replace(/\bm\.?b\.?\b/gi, 'm')
    .replace(/\bkpl\.?\b/gi, 'kpl')
    // Normalize cable names
    .replace(/przewód\s*/gi, '')
    .replace(/kabel\s*/gi, '')
    // Normalize dimensions
    .replace(/fi\s*(\d+)/gi, '$1')
    .replace(/(\d+)\s*x\s*(\d+)/gi, '$1x$2')
    // Normalize separators
    .replace(/,/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
  
  return normalized;
}

/**
 * AI-enhanced duplicate detection using ES-Intelligence v2.1
 * Finds semantically similar items that rule-based algorithm might miss
 */
export async function findDuplicatesWithAI(
  projectId: string
): Promise<{ success: boolean; groups?: DuplicateGroup[]; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // AI usage limit: DEMO=5/mies., PRO=200/mies. (centralized quota)
    const aiCheck = await checkAndIncrementAiUsage(user.id, AI_FUNCTION_NAMES.aiDuplicates);
    if (!aiCheck.allowed) return { success: false, error: aiCheck.error || "Limit AI wyczerpany" };

    // Get all project items
    const { data: items, error } = await supabase
      .from("project_items")
      .select("*")
      .eq("project_id", projectId);

    if (error || !items || items.length === 0) {
      return { success: false, error: "Nie można pobrać pozycji" };
    }

    // If too few items, use rule-based approach
    if (items.length < 3) {
      return findDuplicates(projectId);
    }

    // Prepare items for AI analysis
    const itemsList = items.map((item, index) => ({
      index,
      id: item.id,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      materialPrice: item.final_material_price,
      laborPrice: item.final_labor_price,
    }));

    const systemPrompt = await buildDynamicSystemPrompt("generator", `<task_override>ZADANIE: Identyfikacja duplikatów pozycji kosztorysowych.

<normalization_rules>
${ELECTRICAL_NORMALIZATION_RULES}
</normalization_rules>

Kryteria duplikatu:
1. Nazwy opisują ten sam produkt (nawet różnymi słowami, synonimami)
2. Jednostki zgodne lub równoważne (mb = m, szt = sztuk)
3. Różnica ceny <20% (chyba że wyraźnie inna jakość/klasa)

Wykluczenia (NIE są duplikatami):
- Różne przekroje przewodów (YDYp 3x1,5 vs YDYp 3x2,5)
- Różne moce opraw (LED 18W vs LED 36W)
- Różne rozmiary puszek (fi60 vs fi80)
- Materiał vs robocizna tego samego elementu
</task_override>`);

    let aiResult;
    try {
      const { object } = await generateObject({
        model: google(AI_MODEL_TIER1),
        system: systemPrompt + "\nZwracaj minimalny JSON — krótkie wartości string, bez zbędnych wyjaśnień.",
        prompt: `Znajdź duplikaty w tej liście pozycji kosztorysowych:\n\n${JSON.stringify(itemsList, null, 2)}`,
        schema: z.object({
          duplicateGroups: z.array(z.object({
            masterIndex: z.number(),
            duplicateIndexes: z.array(z.number()),
            reason: z.string(),
          })),
        }),
        temperature: 0.1,
        maxOutputTokens: 2000,
      });
      aiResult = object;
    } catch {
      return findDuplicates(projectId);
    }

    // Convert AI result to DuplicateGroup format
    const duplicateGroups: DuplicateGroup[] = [];
    const processedIndexes = new Set<number>();

    for (const group of aiResult.duplicateGroups || []) {
      const masterIndex = group.masterIndex;
      const duplicateIndexes = group.duplicateIndexes || [];

      if (processedIndexes.has(masterIndex)) continue;
      if (duplicateIndexes.length === 0) continue;

      const masterItem = items[masterIndex];
      if (!masterItem) continue;

      const duplicates: DuplicateItem[] = [];
      
      for (const dupIndex of duplicateIndexes) {
        if (processedIndexes.has(dupIndex)) continue;
        
        const dupItem = items[dupIndex];
        if (!dupItem) continue;

        duplicates.push({
          id: dupItem.id,
          name: dupItem.name,
          quantity: dupItem.quantity,
          unit: dupItem.unit,
          final_material_price: dupItem.final_material_price,
          final_labor_price: dupItem.final_labor_price,
          similarityScore: 0.9, // AI-detected
        });
        processedIndexes.add(dupIndex);
      }

      if (duplicates.length > 0) {
        const totalWasted = duplicates.reduce((sum, dup) => {
          return sum + (dup.quantity * (dup.final_material_price + dup.final_labor_price));
        }, 0);

        duplicateGroups.push({
          masterItem: {
            id: masterItem.id,
            name: masterItem.name,
            quantity: masterItem.quantity,
            unit: masterItem.unit,
            final_material_price: masterItem.final_material_price,
            final_labor_price: masterItem.final_labor_price,
            similarityScore: 1.0,
          },
          duplicates,
          totalWasted,
        });
        processedIndexes.add(masterIndex);
      }
    }

    return {
      success: true,
      groups: duplicateGroups,
    };
  } catch (error) {
    logger.error("findDuplicatesWithAI error:", {}, error);
    // Fallback to rule-based
    return findDuplicates(projectId);
  }
}

/**
 * Merge duplicate items - combines quantities and removes duplicates
 */
export async function mergeDuplicates(
  projectId: string,
  masterItemId: string,
  duplicateIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // Get master item
    const { data: masterItem } = await supabase
      .from("project_items")
      .select("*")
      .eq("id", masterItemId)
      .single();

    if (!masterItem) {
      return { success: false, error: "Nie znaleziono głównej pozycji" };
    }

    // Get duplicates
    const { data: duplicates } = await supabase
      .from("project_items")
      .select("*")
      .in("id", duplicateIds);

    if (!duplicates || duplicates.length === 0) {
      return { success: false, error: "Nie znaleziono duplikatów" };
    }

    // Calculate total quantity
    const totalQuantity = duplicates.reduce((sum, dup) => sum + dup.quantity, 0);
    const newQuantity = masterItem.quantity + totalQuantity;

    // Update master item quantity
    const { error: updateError } = await supabase
      .from("project_items")
      .update({ quantity: newQuantity })
      .eq("id", masterItemId);

    if (updateError) {
      return { success: false, error: "Błąd aktualizacji pozycji" };
    }

    // Delete duplicates
    const { error: deleteError } = await supabase
      .from("project_items")
      .delete()
      .in("id", duplicateIds);

    if (deleteError) {
      return { success: false, error: "Błąd usuwania duplikatów" };
    }

    return { success: true };
  } catch (error) {
    logger.error("mergeDuplicates error:", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}
