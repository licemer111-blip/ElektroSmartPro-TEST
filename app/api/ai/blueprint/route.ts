import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import { z } from "zod";
import {
  TILE_POSITIONS,
  PASS1_SYSTEM,
  PASS2_SYSTEM_STATIC,
  legendSchema,
  countingSchema,
  buildLegendSection,
  type LegendItem,
} from "@/lib/ai/prompts/blueprint";

export const maxDuration = 120;

// POST HANDLER - Supports 3 modes: "legend", "tile", "full"
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Musisz byc zalogowany" }, { status: 401 });
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ error: "Klucz API Google AI nie jest skonfigurowany" }, { status: 500 });
    }

    const body = await request.json();
    const {
      imageBase64,
      instructions,
      mode = "full",
      legend_data,
      tile_info,
    } = body as {
      imageBase64: string;
      instructions?: string;
      mode?: "legend" | "tile" | "full";
      legend_data?: { project_type: string; legend_items: LegendItem[] };
      tile_info?: { index: number; total: number };
    };

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ success: false, error: "Brak obrazu do analizy" }, { status: 400 });
    }

    // MODE: LEGEND
    if (mode === "legend") {
      const aiCheck = await checkAndIncrementAiUsage(user.id, "blueprint");
      if (!aiCheck.allowed) {
        return NextResponse.json({ success: false, error: aiCheck.error || "Limit AI wyczerpany", remaining: 0 }, { status: 403 });
      }

      const { object: pass1 } = await generateObject({
        model: google(AI_MODEL_TIER1),
        messages: [
          { role: "system" as const, content: PASS1_SYSTEM },
          {
            role: "user" as const,
            content: [
              { type: "text" as const, text: "Przeanalizuj rzut elektryczny. Znajdz tabliczke tytulowa i legende symboli. Zwroc JSON zgodnie ze schematem." },
              { type: "image" as const, image: imageBase64 },
            ],
          },
        ],
        schema: legendSchema,
        temperature: 0.0,
        maxOutputTokens: 5000,
      });

      const items = pass1.legend_items || [];
      return NextResponse.json({
        success: true,
        project_type: pass1.project_type,
        drawing_number: pass1.drawing_number || null,
        scale: pass1.scale || null,
        legend_found: pass1.legend_found && items.length > 0,
        legend_items: items,
        legend_symbols: items.map((l) => `${l.code} = ${l.description}`),
        rooms_detected: pass1.rooms || [],
        remaining: aiCheck.remaining,
      });
    }

    // MODE: TILE
    if (mode === "tile") {
      if (!legend_data?.legend_items || legend_data.legend_items.length === 0) {
        return NextResponse.json({ success: false, error: "Brak danych legendy dla trybu tile" }, { status: 400 });
      }

      const tileIdx = tile_info?.index ?? 0;
      const tileTotal = tile_info?.total ?? 1;
      const tilePosition = TILE_POSITIONS[tileIdx] || `fragment ${tileIdx + 1}`;

      const legendSection = buildLegendSection(legend_data.legend_items, legend_data.project_type, true);

      const projectTypeLower = (legend_data.project_type || "").toLowerCase();
      const drawingDomain = projectTypeLower.includes("oswietleni") || projectTypeLower.includes("oswietleni")
        ? "OSWIETLENIOWY"
        : projectTypeLower.includes("gniazd") || projectTypeLower.includes("silow")
        ? "GNIAZDOWY"
        : "OGOLNY";

      const domainHint = drawingDomain === "OSWIETLENIOWY"
        ? "TYP RZUTU: OSWIETLENIOWY - kolka = LAMPY (nie gniazda!). Na tym rzucie gniazd jest malo lub zero."
        : drawingDomain === "GNIAZDOWY"
        ? "TYP RZUTU: GNIAZDOWY - kolka = GNIAZDA. Na tym rzucie lamp jest malo lub zero."
        : "TYP RZUTU: OGOLNY - moga byc oba typy symboli. Klasyfikuj scisle wg legendy.";

      const tileContext = `\n\n<tile_context>\nANALIZUJESZ FRAGMENT ${tileIdx + 1}/${tileTotal} pelnego rzutu - ${tilePosition}.\nPROJEKT: "${legend_data.project_type}"\n${domainHint}\n- Licz TYLKO symbole widoczne w TYM fragmencie obrazu.\n- Symbol uciety na krawedzi: licz jesli >50% symbolu jest widoczne.\n- NIE zgaduj ile jest na calym rzucie - licz TYLKO to, co WIDZISZ w tym kafelku.\n- Jesli fragment zawiera legende/tabliczke zamiast planu - zwroc puste symbols i dodaj warning.\n</tile_context>`;

      let tileResult: z.infer<typeof countingSchema>;
      let modelUsed = "ES-Intelligence v2.1";

      const staticPromptPrefix = `${PASS2_SYSTEM_STATIC}\n\n${legendSection}${tileContext}\n\nOFFICIAL LEGEND JSON:\n${JSON.stringify(legend_data.legend_items, null, 2)}\n\nFRAGMENT: ${tilePosition} (${tileIdx + 1}/${tileTotal})\n\nINSTRUCTION: Policz DOKLADNIE wszystkie symbole elektryczne w tym fragmencie. Zaraportuj KAZDY kod z legendy (nawet count=0).`;

      try {
        if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          const { object } = await generateObject({
            model: google(AI_MODEL_TIER1),
            messages: [
              {
                role: "user" as const,
                content: [
                  { type: "text" as const, text: staticPromptPrefix },
                  { type: "image" as const, image: imageBase64 },
                ],
              },
            ],
            schema: countingSchema,
            temperature: 0.1,
            maxOutputTokens: 4000,
          });
          tileResult = object;
        } else {
          throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not configured");
        }
      } catch (gptError: unknown) {
        const gptErrMsg = gptError instanceof Error ? gptError.message : String(gptError);
        logger.error(`[blueprint] tile ${tileIdx + 1} failed: ${gptErrMsg}. Retrying.`, {});
        modelUsed = "ES-Intelligence v2.1 (fallback prompt)";

        const tileSystemPrompt = `${PASS2_SYSTEM_STATIC}\n\n${legendSection}${tileContext}`;
        const { object } = await generateObject({
          model: google(AI_MODEL_TIER1),
          messages: [
            { role: "system" as const, content: tileSystemPrompt },
            {
              role: "user" as const,
              content: [
                { type: "text" as const, text: `Policz symbole elektryczne w tym fragmencie (${tilePosition}) rzutu. Zaraportuj KAZDY kod z legendy, nawet jesli count=0.` },
                { type: "image" as const, image: imageBase64 },
              ],
            },
          ],
          schema: countingSchema,
          temperature: 0.0,
          maxOutputTokens: 6000,
        });
        tileResult = object;
      }

      return NextResponse.json({
        success: true,
        symbols: tileResult.symbols || [],
        total_symbols: tileResult.total_symbols,
        warnings: tileResult.warnings || [],
        tile_index: tileIdx,
        model_used: modelUsed,
      });
    }

    // MODE: FULL
    const aiCheck = await checkAndIncrementAiUsage(user.id, "blueprint");
    if (!aiCheck.allowed) {
      return NextResponse.json({ success: false, error: aiCheck.error || "Limit AI wyczerpany", remaining: 0 }, { status: 403 });
    }

    const { object: pass1 } = await generateObject({
      model: google(AI_MODEL_TIER1),
      messages: [
        { role: "system" as const, content: PASS1_SYSTEM },
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: "Odczytaj legende, tabliczke tytulowa i nazwy pomieszczen z tego rzutu elektrycznego. NIE licz symboli - tylko odczytaj legende." },
            { type: "image" as const, image: imageBase64 },
          ],
        },
      ],
      schema: legendSchema,
      temperature: 0.0,
      maxOutputTokens: 3000,
    });

    const legendItems = pass1.legend_items || [];
    const legendFound = pass1.legend_found && legendItems.length > 0;

    const legendSection = buildLegendSection(legendItems, pass1.project_type, legendFound);
    const pass2SystemPrompt = `${PASS2_SYSTEM_STATIC}\n\n${legendSection}`;

    const userPrompt = instructions
      ? `Instrukcje uzytkownika: ${instructions}\n\nPolicz symbole elektryczne na rzucie zgodnie z OFICJALNA LEGENDA.`
      : "Policz WSZYSTKIE symbole elektryczne na tym rzucie. Uzywaj WYLACZNIE symboli z oficjalnej legendy powyzej. Zaraportuj KAZDY kod z legendy, nawet jesli count=0.";

    const { object: pass2 } = await generateObject({
      model: google(AI_MODEL_TIER1),
      messages: [
        { role: "system" as const, content: pass2SystemPrompt },
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: userPrompt },
            { type: "image" as const, image: imageBase64 },
          ],
        },
      ],
      schema: countingSchema,
      temperature: 0.0,
      maxOutputTokens: 10000,
    });

    const symbols = pass2.symbols || [];

    if (symbols.length === 0) {
      return NextResponse.json({
        success: false,
        error: "AI nie znalazlo zadnych symboli elektrycznych na tym rzucie.",
        legend_found: legendFound,
        project_type: pass1.project_type,
        legend_symbols: legendItems.map((l) => `${l.code} = ${l.description}`),
      });
    }

    return NextResponse.json({
      success: true,
      project_type: pass1.project_type,
      drawing_number: pass1.drawing_number || null,
      scale: pass1.scale || null,
      legend_found: legendFound,
      legend_items: legendItems,
      legend_symbols: legendItems.map((l) => `${l.code} = ${l.description}`),
      rooms_detected: pass1.rooms || [],
      symbols,
      total_symbols: pass2.total_symbols,
      warnings: pass2.warnings || [],
      remaining: aiCheck.remaining,
    });
  } catch (error: unknown) {
    logger.error("[blueprint API] Error:", {}, error);
    const msg = error instanceof Error ? error.message : "Nieznany blad serwera";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
