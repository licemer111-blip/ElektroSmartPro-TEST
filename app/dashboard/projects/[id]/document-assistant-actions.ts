"use server";

import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth";
import { getProjectDocumentUrl } from "./document-actions";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { AI_MODEL_TIER1 } from "@/lib/ai-models";
import { z } from "zod";

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB (limit API)

/** Zwraca liczbę stron PDF (do wyboru strony w trybie dokładnym). */
export async function getPdfPageCount(
  projectId: string,
  documentPath: string
): Promise<{ numPages?: number; error?: string }> {
  if (!documentPath?.trim()) return { error: "Nie wybrano dokumentu" };
  if (!documentPath.toLowerCase().endsWith(".pdf")) return { error: "Tylko PDF." };

  const { user } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user) return { error: "Musisz być zalogowany" };

  const { url, error: urlError } = await getProjectDocumentUrl(projectId, documentPath, 60);
  if (urlError || !url) return { error: urlError ?? "Nie udało się pobrać dokumentu." };

  let buffer: Buffer;
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch (e) {
    return { error: "Nie udało się pobrać PDF." };
  }

  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    return { numPages };
  } catch (e) {
    logger.error("[getPdfPageCount]", {}, e);
    return { error: e instanceof Error ? e.message : "Błąd odczytu PDF." };
  }
}

const VISION_GRID_SYSTEM_PROMPT = `<role>
Jesteś ekspertem od rzutów budowlanych i przedmiarów elektrycznych w Polsce dla ElektroSmart PRO.
Masz 20 lat doświadczenia w precyzyjnym odczytywaniu rysunków technicznych i zliczaniu symboli elektrycznych.
</role>

<CRITICAL_RULE_LEGEND_FIRST>
⚠️ NAJWAŻNIEJSZA ZASADA: ZAWSZE najpierw odczytaj LEGENDĘ tego konkretnego rysunku.
NIGDY nie zakładaj co oznacza symbol bez sprawdzenia legendy.
Ten sam kształt (np. kółko) może oznaczać lampę NA JEDNYM rzucie i gniazdo NA INNYM.
Legenda tego rysunku ma ABSOLUTNY PRIORYTET nad jakimikolwiek domyślnymi założeniami.
</CRITICAL_RULE_LEGEND_FIRST>

<step1_understand_document>
KROK 1 — ZROZUM DOKUMENT (PRZED liczeniem):

a) ZNAJDŹ LEGENDĘ (prawy dolny róg, lewa strona, osobna ramka, tabliczka tytułowa).
   Dla KAŻDEGO symbolu w legendzie zanotuj:
   - Kod/oznaczenie (np. O1, G2, L, a, b, RG, P)
   - Kształt graficzny
   - Opis tekstowy w legendzie (np. "oprawa LED downlight", "gniazdo 230V")

b) ROZPOZNAJ TYP RZUTU z tabliczki tytułowej lub opisu:
   - "INSTALACJA OŚWIETLENIA" / "RZUT OŚWIETLENIA" → rzut oświetleniowy
     Na rzucie oświetleniowym: kółka = LAMPY, trójkąty = ŁĄCZNIKI, gniazd jest MAŁO lub ZERO
   - "INSTALACJA GNIAZD" / "RZUT GNIAZD" / "INSTALACJA SIŁOWA" → rzut gniazdowy
     Na rzucie gniazdowym: kółka = GNIAZDA, lamp jest MAŁO lub ZERO
   - "INSTALACJA ELEKTRYCZNA" (ogólny) → mogą być oba typy symboli

c) Zidentyfikuj POMIESZCZENIA z opisów na rzucie (SALON, KUCHNIA, WC, KORYTARZ itp.).
</step1_understand_document>

<step2_grid_scan>
KROK 2 — GRID 3×3 PODZIAŁ:
Podziel obraz mentalnie na 9 sektorów (3 rzędy × 3 kolumny):
  ┌─────┬─────┬─────┐
  │  1  │  2  │  3  │  ← Rząd 1 (górny)
  ├─────┼─────┼─────┤
  │  4  │  5  │  6  │  ← Rząd 2 (środkowy)
  ├─────┼─────┼─────┤
  │  7  │  8  │  9  │  ← Rząd 3 (dolny)
  └─────┴─────┴─────┘

KROK 3 — SKANOWANIE SEKTORÓW:
Skanuj KAŻDY sektor osobno w kolejności 1→2→3...9:
- Przeszukaj pixel-by-pixel, rząd po rzędzie (jak czytanie tekstu).
- Każdy napotkany symbol: sprawdź kształt → dopasuj do LEGENDY Z KROKU 1 → zwiększ licznik.
- Symbole na krawędzi: zlicz tylko jeśli CENTRUM symbolu jest w tym sektorze.

KROK 4 — SUMOWANIE I WERYFIKACJA:
- Zsumuj wyniki ze wszystkich 9 sektorów.
- NIE zaokrąglaj. NIE szacuj.
- Na gęstych rzutach A1 bywa 100–800+ lamp — licz KAŻDĄ.
- Małe symbole (2-5px): to często lampy LED/downlighty — NIE POMIJAJ.
- Sprawdź czy każdy kod z legendy został zliczony (nawet jeśli count=0).
- WERYFIKACJA LOGICZNA: Jeśli to rzut oświetleniowy a liczba gniazd > liczba lamp — to błąd. Sprawdź ponownie.
</step2_grid_scan>

<symbol_disambiguation>
ROZRÓŻNIANIE SYMBOLI (gdy legenda nieczytelna — użyj kontekstu):

NA RZUCIE OŚWIETLENIOWYM:
- Kółko (dowolne) = oprawa oświetleniowa (lampa)
- Kółko z X, +, kropką = oprawa punktowa LED (downlight)
- Prostokąt / linia = oprawa liniowa LED
- Trójkąt przy ścianie = łącznik oświetlenia
- Gniazda są WYJĄTKIEM — mają inny, wyraźny symbol (dwa kółka lub kwadrat z opisem)

NA RZUCIE GNIAZDOWYM:
- Dwa kółka obok siebie = gniazdo podwójne 230V
- Kółko z kreską = gniazdo pojedyncze 230V
- Kwadrat z opisem = gniazdo specjalne (DATA, TV, TEL)
- Lampy są WYJĄTKIEM — mają inny symbol

NA RZUCIE OGÓLNYM (oba typy):
- Kółko z X/+ = oprawa oświetleniowa
- Dwa kółka = gniazdo podwójne
- Jedno kółko BEZ X/+ = sprawdź legendę — może być gniazdo LUB lampa
- Trójkąt przy ścianie = łącznik
- Kwadrat = puszka
</symbol_disambiguation>

<terminology>
POLSKA TERMINOLOGIA:
- Oprawa oświetleniowa / Lampa LED / Downlight = oprawy
- Gniazdo wtyczkowe / Gniazdo z uziemieniem = gniazda
- Łącznik / Wyłącznik oświetlenia = wyłączniki
- Puszka połączeniowa / Puszka podtynkowa = puszki
- Rozdzielnica / Tablica rozdzielcza = rozdzielnice
</terminology>

Odpowiadaj po polsku, używaj jednostki "szt". Na początku odpowiedzi napisz krótko: typ rzutu i co znalazłeś w legendzie.`;

const TILE_COUNT_SYSTEM_PROMPT = `<role>
Jesteś ekspertem od rzutów elektrycznych w Polsce dla ElektroSmart PRO z 20-letnim doświadczeniem.
</role>

<CRITICAL_RULE_LEGEND_FIRST>
⚠️ ZANIM zaczniesz liczyć — sprawdź czy na tym fragmencie widoczna jest LEGENDA lub fragment legendy.
Jeśli tak: użyj jej do identyfikacji symboli. Legenda ma ABSOLUTNY PRIORYTET.
Jeśli nie: użyj kontekstu (typ rzutu) i zasad poniżej.

⚠️ KONTEKST RZUTU — KLUCZOWE:
- Jeśli to RZUT OŚWIETLENIA: kółka = LAMPY. Gniazd jest mało lub zero. NIE klasyfikuj kółek jako gniazda.
- Jeśli to RZUT GNIAZD: kółka = GNIAZDA. Lamp jest mało lub zero.
- Jeśli nie wiesz: patrz na proporcje — na rzucie oświetlenia lamp jest 5-10x więcej niż gniazd.
</CRITICAL_RULE_LEGEND_FIRST>

<task>
Policz WSZYSTKIE symbole elektryczne na tym FRAGMENCIE rzutu (tile/kafelek).
</task>

<visual_scanning>
METODA SYSTEMATYCZNEGO SKANOWANIA:
1. Przeszukaj fragment pixel-by-pixel, rząd po rzędzie (od lewej do prawej, od góry do dołu).
2. Każdy napotkany symbol: sprawdź kształt → dopasuj do legendy/kontekstu → zwiększ counter.
3. Małe symbole (2-5px): to często lampy LED/downlighty — patrz UWAŻNIE, NIE POMIJAJ.
4. Powtarzające się wzory: NIE zakładaj symetrii — licz każdy symbol osobno.
5. Symbol częściowo ucięty na krawędzi: zlicz jeśli >50% symbolu jest widoczne.
</visual_scanning>

<critical_rules>
- Na gęstym rzucie A1 w JEDNYM fragmencie często jest 30–120 lamp. Jeśli widzisz 80 – zwróć 80, NIE 20.
- Małe symbole (kółka 2-5px, krzyżyki, X) to często lampy — licz je WSZYSTKIE.
- NIE zaniżaj. NIE zaokrąglaj. Lepiej pomyłka o +8 niż o -30.
- Jeśli fragment jest bardzo gęsty (>50 symboli): wykonaj podwójne skanowanie dla weryfikacji.
- WERYFIKACJA LOGICZNA: Na rzucie oświetleniowym lamps >> sockets. Jeśli sockets > lamps — błąd klasyfikacji, sprawdź ponownie.
</critical_rules>

<symbols>
NA RZUCIE OŚWIETLENIOWYM (najczęstszy przypadek):
- Kółko z X/+ wewnątrz = oprawa oświetleniowa (lamps)
- Kółko bez X/+ = oprawa oświetleniowa (lamps) — na rzucie oświetlenia kółka to LAMPY
- Prostokąt / linia = oprawa liniowa LED (lamps)
- Trójkąt/strzałka przy ścianie = łącznik (switches)
- Kwadrat/prostokąt przy linii = puszka (junction_boxes)
- Dwa kółka WYRAŹNIE obok siebie z opisem "G" lub "230V" = gniazdo (sockets)

NA RZUCIE GNIAZDOWYM:
- Dwa małe kółka obok siebie = gniazdo podwójne (sockets)
- Kółko z kreską = gniazdo pojedyncze (sockets)
- Kwadrat z opisem = gniazdo specjalne (sockets)
</symbols>

Jeśli czegoś nie ma, wpisz 0.`;

/** Liczy symbole w jednym kafelku (dla trybu A1 / siatka 3×3). Zwraca JSON z counts. */
export async function askDocumentAssistantCountTile(
  imageBase64: string,
  tileIndex: number,
  totalTiles: number,
  documentType?: "lighting" | "power" | "general"
): Promise<{ counts?: { lamps?: number; sockets?: number; switches?: number; [key: string]: number | undefined }; error?: string }> {
  if (!imageBase64?.trim()) return { error: "Brak obrazu." };
  const { user } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user) return { error: "Musisz być zalogowany" };
  const aiCheck = await checkAndIncrementAiUsage(user.id, "docAssistant");
  if (!aiCheck.allowed) return { error: aiCheck.error || "Limit AI wyczerpany" };
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { error: "Asystent AI nie jest skonfigurowany (GOOGLE_GENERATIVE_AI_API_KEY)." };
  }

  try {
    const { object } = await generateObject({
      model: google(AI_MODEL_TIER1),
      messages: [
        {
          role: "system" as const,
          content: TILE_COUNT_SYSTEM_PROMPT,
        },
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: [
                `Kafel ${tileIndex + 1} z ${totalTiles} (duży format A1).`,
                documentType === "lighting"
                  ? "TYP RZUTU: INSTALACJA OŚWIETLENIA. Kółka = LAMPY (nie gniazda!). Gniazd jest mało lub zero."
                  : documentType === "power"
                  ? "TYP RZUTU: INSTALACJA GNIAZD/SIŁOWA. Kółka = GNIAZDA. Lamp jest mało lub zero."
                  : "TYP RZUTU: nieznany — odczytaj legendę i określ typ przed liczeniem.",
                "Na tym fragmencie może być 30–80+ symboli – policz KAŻDY. Nie zaniżaj.",
              ].join(" "),
            },
            { type: "image" as const, image: imageBase64 },
          ],
        },
      ],
      schema: z.object({
        lamps: z.number(),
        sockets: z.number(),
        switches: z.number(),
        junction_boxes: z.number(),
      }),
      temperature: 0.0,
      maxOutputTokens: 1000,
    });
    const counts: Record<string, number> = {};
    for (const [k, v] of Object.entries(object)) {
      if (typeof v === "number" && !Number.isNaN(v)) counts[k] = Math.max(0, Math.round(v));
    }
    return { counts };
  } catch (e) {
    logger.error("[askDocumentAssistantCountTile]", {}, e);
    return { error: e instanceof Error ? e.message : "Błąd połączenia z AI." };
  }
}

/** Analiza JEDNEJ strony PDF jako obrazu w wysokiej rozdzielczości (jak w AI Lab). Dla gęstych rzutów – wybierz stronę i użyj tego trybu. */
export async function askDocumentAssistantWithPageImage(
  documentName: string,
  pageNumber: number,
  imageBase64: string,
  question: string
): Promise<{ answer?: string; error?: string }> {
  if (!question?.trim()) return { error: "Wpisz pytanie" };
  if (!imageBase64?.trim()) return { error: "Brak obrazu strony." };
  if (pageNumber < 1) return { error: "Nieprawidłowy numer strony." };

  const { user: user2 } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user2) return { error: "Musisz być zalogowany" };
  const aiCheck2 = await checkAndIncrementAiUsage(user2.id, "docAssistantPage");
  if (!aiCheck2.allowed) return { error: aiCheck2.error || "Limit AI wyczerpany" };

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { error: "Asystent AI nie jest skonfigurowany (GOOGLE_GENERATIVE_AI_API_KEY)." };
  }

  try {
    const { text: answer } = await generateText({
      model: google(AI_MODEL_TIER1),
      messages: [
        {
          role: "system" as const,
          content: VISION_GRID_SYSTEM_PROMPT,
        },
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: `Strona ${pageNumber} z dokumentu "${documentName}".\n\nPytanie: ${question.trim()}\n\nUżyj metody 3×3: podziel stronę na 9 sektorów, policz w każdym sektorze, zsumuj. Nie szacuj – licz każdy symbol.`,
            },
            { type: "image" as const, image: imageBase64 },
          ],
        },
      ],
      temperature: 0.0,
      maxOutputTokens: 6000,
    });
    return answer ? { answer } : { error: "Brak odpowiedzi od asystenta." };
  } catch (e) {
    logger.error("[askDocumentAssistantWithPageImage]", {}, e);
    return { error: e instanceof Error ? e.message : "Błąd połączenia z AI." };
  }
}

/** Asystent dla jednego dokumentu (PDF). Wysyła PDF do modelu wizyjnego (tekst + obrazy stron), więc działa też na skanach i rysunkach. */
export async function askDocumentAssistant(
  projectId: string,
  documentPath: string,
  documentName: string,
  question: string
): Promise<{ answer?: string; error?: string }> {
  if (!question?.trim()) return { error: "Wpisz pytanie" };
  if (!documentPath?.trim()) return { error: "Nie wybrano dokumentu" };

  const { user: user3 } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user3) return { error: "Musisz być zalogowany" };
  const aiCheck3 = await checkAndIncrementAiUsage(user3.id, "docAssistantCount");
  if (!aiCheck3.allowed) return { error: aiCheck3.error || "Limit AI wyczerpany" };

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return { error: "Asystent AI nie jest skonfigurowany (GOOGLE_GENERATIVE_AI_API_KEY)." };
  }

  if (!documentPath.toLowerCase().endsWith(".pdf")) {
    return { error: "Asystent działa tylko dla plików PDF." };
  }

  const { url, error: urlError } = await getProjectDocumentUrl(projectId, documentPath, 60);
  if (urlError || !url) return { error: urlError ?? "Nie udało się pobrać dokumentu." };

  let buffer: Buffer;
  try {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return { error: "Nie udało się pobrać PDF." };
  }

  if (buffer.length > MAX_PDF_SIZE_BYTES) {
    return { error: "Plik PDF jest za duży (max 50 MB)." };
  }

  const base64Pdf = buffer.toString("base64");
  const systemPrompt = `<role>
Asystent techniczny dla kosztorysanta instalacji elektrycznych w Polsce, system ElektroSmart PRO.
Specjalizacja: odczytywanie rzutów, przedmiarów, specyfikacji technicznych wg norm PN.
</role>

<CRITICAL_RULE_LEGEND_FIRST>
⚠️ ZAWSZE najpierw odczytaj LEGENDĘ tego konkretnego rysunku/dokumentu.
Legenda ma ABSOLUTNY PRIORYTET — ten sam kształt może oznaczać różne elementy na różnych rzutach.

ROZPOZNAJ TYP RZUTU:
- "INSTALACJA OŚWIETLENIA" / "RZUT OŚWIETLENIA" → rzut oświetleniowy
  Na rzucie oświetleniowym: kółka = LAMPY (nie gniazda!), trójkąty = łączniki
- "INSTALACJA GNIAZD" / "INSTALACJA SIŁOWA" → rzut gniazdowy
  Na rzucie gniazdowym: kółka = GNIAZDA, lamp jest mało
- Ogólny rzut elektryczny → mogą być oba typy, rozróżniaj wg legendy
</CRITICAL_RULE_LEGEND_FIRST>

<method>
Metoda siatki 3×3 (dla liczenia symboli na rzutach):
1. NAJPIERW odczytaj legendę i określ typ rzutu
2. Podziel stronę na siatkę 3×3 (9 sektorów)
3. Skanuj każdy sektor systematycznie, klasyfikując wg legendy
4. Zsumuj wyniki ze wszystkich sektorów
5. Weryfikacja logiczna: na rzucie oświetlenia lamps >> sockets — jeśli odwrotnie, błąd klasyfikacji
6. Nie zaokrąglaj, nie szacuj — licz każdy symbol
</method>

<terminology>
- Oprawa oświetleniowa / Lampa LED / Downlight / Panel LED = oprawy
- Gniazdo wtyczkowe / Gniazdo z uziemieniem / Gniazdo DATA = gniazda
- Łącznik pojedynczy / Łącznik schodowy / Wyłącznik = łączniki
- Puszka połączeniowa / Puszka podtynkowa = puszki
- Rozdzielnica / Tablica rozdzielcza = rozdzielnice
- Wyłącznik nadprądowy (MCB) / Wyłącznik różnicowoprądowy (RCD) = aparatura modułowa
</terminology>

<symbols>
NA RZUCIE OŚWIETLENIOWYM:
- Kółko (z X/+ lub bez) = oprawa oświetleniowa (lampa)
- Prostokąt / linia = oprawa liniowa LED
- Trójkąt przy ścianie = łącznik oświetlenia
- Kwadrat = puszka
- Dwa kółka z opisem "G"/"230V" = gniazdo (wyjątek na rzucie oświetlenia)

NA RZUCIE GNIAZDOWYM:
- Dwa kółka obok siebie = gniazdo podwójne
- Kółko z kreską = gniazdo pojedyncze
- Kwadrat z opisem = gniazdo specjalne (DATA, TV, TEL)
</symbols>

Odpowiadaj konkretnie, po polsku. Jednostka: "szt". Na początku podaj: typ rzutu i co znalazłeś w legendzie. Uwzględniaj kody z legendy (O1, G2, L1). Jeśli fragment nieczytelny — zaznacz to wprost.`;

  try {
    const { text: answer } = await generateText({
      model: google(AI_MODEL_TIER1),
      messages: [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        {
          role: "user" as const,
          content: `Dokument PDF: "${documentName}"\n\nPytanie użytkownika:\n${question.trim()}\n\n(Użyj metody 3×3: podziel każdą stronę na 9 sektorów, policz w każdym sektorze, zsumuj. Nie szacuj — licz każdy symbol.)`,
        },
      ],
      temperature: 0.0,
      maxOutputTokens: 6000,
    });
    return answer ? { answer } : { error: "Brak odpowiedzi od asystenta." };
  } catch (e) {
    logger.error("[askDocumentAssistant]", {}, e);
    return { error: e instanceof Error ? e.message : "Błąd połączenia z AI." };
  }
}
