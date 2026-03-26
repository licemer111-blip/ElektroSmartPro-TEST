import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { buildDynamicSystemPrompt, injectKbContext } from "@/lib/ai-master-brain";
import { fetchKbContext, listKbFileNames } from "@/lib/kb-storage";
export const maxDuration = 120;

async function fetchVisionKbContext(): Promise<string | null> {
  try {
    const fileNames = await Promise.race([
      listKbFileNames(),
      new Promise<string[]>((resolve) => setTimeout(() => resolve([]), 3000)),
    ]);
    if (!fileNames || fileNames.length === 0) return null;
    const ctx = await Promise.race([
      fetchKbContext(fileNames, "knr_knowledge_base"),
      new Promise<string>((resolve) => setTimeout(() => resolve(""), 3000)),
    ]);
    return ctx && ctx.length > 30 ? ctx : null;
  } catch {
    return null;
  }
}

// ─── OUTPUT SCHEMA — OCR only (no pricing) ───
const materialsSchema = z.object({
  materials: z.array(z.object({
    name: z.string(),
    quantity: z.number(),
    unit: z.string(),
    knr_code: z.string().optional(), // extracted from "Podstawa" column if present
  })),
});

type VisionResult = z.infer<typeof materialsSchema>;

type ContentPart = { type: "text"; text: string } | { type: "image"; image: string };

const RATE_LIMIT_RE = /resource exhausted|quota|rate limit|429/i;

async function callGeminiVision(userContent: ContentPart[], systemPrompt: string): Promise<VisionResult | { rateLimited: true } | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;

  const DELAYS = [2000, 6000, 15000]; // 2s → 6s → 15s exponential backoff
  let lastErr: unknown = null;

  for (let attempt = 0; attempt < DELAYS.length; attempt++) {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.0-flash"),
        messages: [
          { role: "system" as const, content: systemPrompt },
          { role: "user" as const, content: userContent },
        ],
        schema: materialsSchema,
        temperature: 0.0,
        maxOutputTokens: 16000,
        maxRetries: 0, // manual retry with backoff below
      });
      return object;
    } catch (err: unknown) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (RATE_LIMIT_RE.test(msg)) {
        if (attempt < DELAYS.length - 1) {
          await new Promise(r => setTimeout(r, DELAYS[attempt]));
          continue;
        }
        return { rateLimited: true };
      }
      logger.error(`[vision] Gemini error: ${msg.slice(0, 120)}`);
      return null;
    }
  }

  logger.error(`[vision] Gemini failed after retries: ${lastErr instanceof Error ? lastErr.message.slice(0, 120) : String(lastErr)}`);
  return null;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Musisz być zalogowany" }, { status: 401 });
    }

    // 2. Usage limit
    const aiCheck = await checkAndIncrementAiUsage(user.id, AI_FUNCTION_NAMES.aiVision);
    if (!aiCheck.allowed) {
      return NextResponse.json({ success: false, error: aiCheck.error || "Limit AI wyczerpany" }, { status: 403 });
    }

    // 3. API key check
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json({ success: false, error: "Brak klucza API (GOOGLE_GENERATIVE_AI_API_KEY)" }, { status: 500 });
    }

    // 4. Parse body
    const body = await request.json();
    const { imageBase64, instructions, contextImageBase64 } = body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ success: false, error: "Brak obrazu do analizy" }, { status: 400 });
    }


    // 5. Build system prompt — ES-Engine 2 OCR specialist (no pricing)
    const kbContext = await fetchVisionKbContext();
    void buildDynamicSystemPrompt; void injectKbContext;
    const systemPrompt = `Jesteś ekspertem-kosztorysantem ElektroSmart (ES-Engine 2). Specjalizujesz się w odczycie polskich Przedmiarów Robót (BOQ). Twoje zadanie to WYŁĄCZNIE precyzyjna ekstrakcja pozycji kosztorysowych.

═══════════════════════════════════════════════════
ZŁOTY FILTR — wyodrębnij wiersz TYLKO jeśli spełnia WSZYSTKIE 4 warunki jednocześnie:
═══════════════════════════════════════════════════
1. Lp. (numer porządkowy) — wiersz musi mieć numer pozycji (np. "1", "1.1", "2.3.4")
2. j.m. (jednostka miary) — wymagana: m, m², m³, szt, kpl, r-g, t, kg, otw, punkt, pkt, krot, mb, i inne
3. Ilość — musi być liczbą > 0 lub wyrażeniem matematycznym (np. "2×3.5", "15+6") → oblicz i podaj wynik
4. Podstawa — kolumna musi zawierać kod KNR/KNNR/KSNR lub tekst "kalk. własna" / "kalkulacja własna"

Jeśli KTÓRYKOLWIEK z 4 warunków nie jest spełniony → POMIŃ wiersz, nie dodawaj do wyników.

═══════════════════════════════════════════════════
STOP-PARSING — natychmiast ZAKOŃCZ zbieranie pozycji gdy napotkasz KTÓRYKOLWIEK z nagłówków:
═══════════════════════════════════════════════════
• "Zestawienie materiałów"
• "Zestawienie sprzętu"
• "Zestawienie robocizny"
• "Tabela elementów scalonych"
• "Podsumowanie"
• "R A Z E M" / "RAZEM" jako samodzielny nagłówek sekcji
Sekcje po tych nagłówkach to tabele zbiorcze — NIE są to osobne pozycje robocze.

═══════════════════════════════════════════════════
NORMALIZACJA DANYCH:
═══════════════════════════════════════════════════
Kody KNR (pole knr_code) — OBOWIĄZKOWA NORMALIZACJA:
- Usuń oznaczenie rozdziału "c.X" lub "d.X": "KNR 5-10 c.1 0118-23" → "KNR 5-10 0118-23"
- Usuń zbędne prefiksy jeśli są duplikowane: "KNNR 5-10/0118-23" → "KNNR 5-10 0118-23"
- Napraw brakujący myślnik w kodach AT i AL: "KNR AT13" → "KNR AT-13", "KNR AL01" → "KNR AL-01"
- Napraw sklejone kody: "KNRAT-13" → "KNR AT-13", "KNRAL01" → "KNR AL-01"
- Napraw KNNR bez spacji: "KNNR5" → "KNNR 5", "KNNR5-08" → "KNNR 5-08"
- Separator katalogu: ukośnik między katalogiem a normą → spacja: "KNR 5-08/0301-01" → "KNR 5-08 0301-01"
- Separator wariantu: ukośnik między normą a wariantem → myślnik: "KNR 5-08 0401/01" → "KNR 5-08 0401-01"
- Format docelowy: "KNR X-XX NNNN-NN" | "KNR AT-XX NNNN-NN" | "KNR AL-XX NNNN-NN" | "KNNR X NNNN-NN"
- Katalogi w naszej bazie: KNR 5-08, KNR 5-10, KNR AT-13, KNR AL-01, KNNR 5, KNR 5-06, KNR 4-03, KNR 5-12
- "kalk. własna" / "kalkulacja własna" → zapisz jako knr_code: "kalk. własna"
- Jeśli Podstawa jest pusta lub nieczytelna → pomiń pole knr_code

Nazwy pozycji (pole name):
- Usuń techniczne adnotacje kalkulacyjne z nazwy: "Krotność = 0.45", "= 2.00", "(krotność 1.5)" itp.
- Zostaw tylko opis pracy: "Montaż opraw oświetleniowych Krotność = 0.45" → "Montaż opraw oświetleniowych"
- Skróć nadmiernie długie opisy, zachowując sens techiczny (max ~120 znaków)

Ilości:
- Oblicz wyrażenia matematyczne: "2×15.5" → 31, "3+2×4" → 11
- Jeśli ilość zapisana jako "1 kpl" w kolumnie — oddziel: quantity=1, unit="kpl"

═══════════════════════════════════════════════════
ZAWSZE IGNORUJ (bez wyjątku):
═══════════════════════════════════════════════════
- Kody CPV: "45311000-0", "45314000-1" itp. (8 cyfr + myślnik + cyfra) — klasyfikacja zamówień, NIE praca
- Spis treści: "1 Tytuł rozdziału  4", "3 Instalacja  5" — liczba na końcu to numer strony
- Nagłówki sekcji bez j.m. i ilości: "1. WLZ", "2.1 Oświetlenie ogólne", "Dział I"
- Metadane: Inwestor, Wykonawca, Sporządził, Data, Adres, NIP, nr projektu
- Wiersze RAZEM/Ogółem wewnątrz tabeli (sumy cząstkowe)
- NIE generuj cen — tylko name, quantity, unit, knr_code
${kbContext ? `\n<knr_context>\n${kbContext}\n</knr_context>` : ""}`;

    // 6. Build user message
    const userContent: ContentPart[] = [];

    if (contextImageBase64 && typeof contextImageBase64 === "string") {
      userContent.push({ type: "text", text: "OBRAZ 1 — KONTEKST/LEGENDA: Użyj do zrozumienia symboli i kontekstu projektu." });
      userContent.push({ type: "image", image: contextImageBase64 });
      userContent.push({ type: "text", text: "OBRAZ 2 — DOCELOWY: Tu wykonaj analizę i zliczanie." });
    }
    userContent.push({ type: "image", image: imageBase64 });

    const baseTask = `Przeanalizuj dokument stosując ZŁOTY FILTR:
1. Odczytaj wszystkie wiersze — wyodrębnij TYLKO te spełniające wszystkie 4 warunki (Lp. + j.m. + Ilość + Podstawa KNR)
2. ZATRZYMAJ się gdy napotkasz nagłówek sekcji zbiorczej (Zestawienie materiałów / Podsumowanie itp.)
3. Znormalizuj kody KNR (usuń c.X/d.X) i nazwy (usuń Krotność=X)
4. Oblicz wyrażenia matematyczne w kolumnie Ilość
5. NIE zwracaj cen ani kwot`;

    const task = instructions?.trim()
      ? `<voice_command priority="HIGH">
POLECENIE UŻYTKOWNIKA (głosowe lub tekstowe — wykonaj DOKŁADNIE):
${instructions.trim()}
</voice_command>

${baseTask}`
      : baseTask;

    userContent.push({ type: "text", text: task });

    // 7. Call AI — Gemini 2.0 Pro (Vision/OCR)
    const result = await callGeminiVision(userContent, systemPrompt);

    if (!result) {
      return NextResponse.json({ success: false, error: "ES-Engine 2 nie znalazł pozycji w dokumencie. Sprawdź jakość obrazu lub spróbuj inną stronę." });
    }
    if ("rateLimited" in result) {
      return NextResponse.json(
        { success: false, error: "Limit zapytań API Google Gemini został wyczerpany. Poczekaj ok. 1 minutę i spróbuj ponownie." },
        { status: 429 },
      );
    }
    if (result.materials.length === 0) {
      return NextResponse.json({ success: false, error: "ES-Engine 2 nie znalazł pozycji w dokumencie. Sprawdź jakość obrazu lub spróbuj inną stronę." });
    }

    type MatItem = VisionResult["materials"][number];
    const materialsWithZeroPrices = result.materials.map((m: MatItem) => ({
      ...m,
      material_price: 0,
      labor_price: 0,
      knr_code: m.knr_code?.trim() || null,
    }));
    return NextResponse.json({ success: true, materials: materialsWithZeroPrices });
  } catch (error: unknown) {
    logger.error("[vision API] Error:", {}, error);
    const msg = error instanceof Error ? error.message : "Nieznany błąd serwera";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
