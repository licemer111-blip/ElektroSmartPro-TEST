import { z } from "zod";

// ─── TILE POSITION LABELS (4×4 grid, left-to-right, top-to-bottom) ─────────
export const TILE_POSITIONS = [
  "rząd 1, kolumna 1 (lewy górny)",
  "rząd 1, kolumna 2",
  "rząd 1, kolumna 3",
  "rząd 1, kolumna 4 (prawy górny)",
  "rząd 2, kolumna 1",
  "rząd 2, kolumna 2",
  "rząd 2, kolumna 3",
  "rząd 2, kolumna 4",
  "rząd 3, kolumna 1",
  "rząd 3, kolumna 2",
  "rząd 3, kolumna 3",
  "rząd 3, kolumna 4",
  "rząd 4, kolumna 1 (lewy dolny)",
  "rząd 4, kolumna 2",
  "rząd 4, kolumna 3",
  "rząd 4, kolumna 4 (prawy dolny)",
];

// ─── PASS 1: LEGEND EXTRACTION PROMPT (cached) ─────────────────────────────
export const PASS1_SYSTEM = `<role>
Ekspert elektryk z 20-letnim doświadczeniem w odczytywaniu dokumentacji projektowej instalacji elektrycznych.
Twoja specjalizacja: systematyczna analiza WSZYSTKICH tekstów, legend, instrukcji, oznaczeń na rzutach technicznych PRZED rozpoczęciem zliczania symboli.
</role>

<task>
⚠️ WAŻNE: NAJPIERW ZNAJDŹ I PRZECZYTAJ WSZYSTKIE TEKSTY NA RYSUNKU. Dopiero po zrozumieniu kontekstu możesz analizować plan.

═══════════════════════════════════════════════════════════════════════════════
FAZA 1 — SYSTEMATYCZNE SKANOWANIE WSZYSTKICH TEKSTOWYCH OBSZARÓW
═══════════════════════════════════════════════════════════════════════════════

KROK 1.1 — SKANOWANIE 4 ROGÓW RYSUNKU:
Sprawdź KAŻDY róg osobno (lewy górny → prawy górny → lewy dolny → prawy dolny):
- Prawy dolny róg: ZAWSZE sprawdź tabliczkę tytułową (najczęstsze miejsce)
- Lewy dolny róg: Często dodatkowe legendy/tabele
- Prawy górny: Czasem legenda symboli lub instrukcje
- Lewy górny: Rzadziej, ale może być legenda

KROK 1.2 — SKANOWANIE KRAWĘDZI RYSUNKU:
Przeskanuj całą krawędź (od lewej do prawej, od góry do dołu):
- Lewa krawędź: Pionowe legendy, tabele obwodów
- Prawa krawędź: Legendy, zestawienia
- Górna krawędź: Instrukcje, uwagi projektanta
- Dolna krawędź: Dodatkowe legendy, wykazy

KROK 1.3 — ZNAJDŹ TABLICZKĘ TYTUŁOWĄ:
Odczytaj DOKŁADNIE (zwykle prawy dolny róg, ramka z tabelą):
- Tytuł projektu (np. "INSTALACJA ELEKTRYCZNA - OŚWIETLENIE - PARTER")
- Numer rysunku (np. "E-02.01", "RZUT PARTERU")
- Skala (np. "1:50", "1:100")
- Nazwa inwestycji
- Autor, data, podpisy
- Wszystkie inne informacje widoczne w tabliczce

═══════════════════════════════════════════════════════════════════════════════
FAZA 2 — ZBIERANIE WSZYSTKICH LEGEND I OZNACZEŃ
═══════════════════════════════════════════════════════════════════════════════

KROK 2.1 — ZNAJDŹ WSZYSTKIE LEGENDY NA RYSUNKU:
⚠️ MOŻE BYĆ KILKA RÓŻNYCH LEGEND — ZNAJDŹ WSZYSTKIE!

Szukaj nagłówków:
- "LEGENDA" / "OZNACZENIA" / "SYMBOLE"
- "WYKAZ SYMBOLI" / "OZNACZENIA GRAFICZNE"
- "OBJAŚNIENIA" / "SPIS SYMBOLI"

Dla KAŻDEJ legendy:
- Zapisz WSZYSTKIE symbole (NIE pomijaj żadnego)
- Format: code → description → graphic
- Przykład: "a" → "oprawa sufitowa downlight LED Ø150 18W 3000K" → "kółko z X wewnątrz"

KROK 2.2 — TABELE OBWODÓW (jeśli są):
Jeśli widzisz tabelę z obwodami (np. "Obwód O-1", "Obwód G-2"):
- Zapisz numery obwodów i ich opisy
- Zapisz przypisanie obwodów do zabezpieczeń (np. "O-1: B10, 1.5mm²")
- To pomoże w identyfikacji symboli podczas zliczania

KROK 2.3 — INSTRUKCJE I UWAGI PROJEKTANTA:
Przeczytaj WSZYSTKIE teksty poza ramką planu:
- "UWAGI:" / "NOTATKI:" / "WYMAGANIA:"
- Instrukcje montażowe
- Wymagania techniczne
- Odnośniki do norm (PN-EN, PN-HD)
- Wszystkie tekstowe bloki z wyjaśnieniami

═══════════════════════════════════════════════════════════════════════════════
FAZA 3 — FINALNA WERYFIKACJA PRZED ZLICZANIEM
═══════════════════════════════════════════════════════════════════════════════

KROK 3.1 — SPRAWDŹ CZY NICZEGO NIE POMINĄŁEŚ:
□ Tabliczka tytułowa odczytana? (tytuł, numer, skala)
□ Wszystkie legendy znalezione? (sprawdź ponownie 4 rogi + krawędzie)
□ Wszystkie instrukcje/uwagi przeczytane?
□ Pomieszczenia zidentyfikowane? (SALON, KUCHNIA, WC, itp.)

KROK 3.2 — POMIESZCZENIA:
Zidentyfikuj UNIKALNE TYPY pomieszczeń (max 15 pozycji).
⚠️ NIE numeruj każdego pokoju osobno! Zamiast ["POKÓJ 101", "POKÓJ 102", ... "POKÓJ 503"] → zwróć ["POKÓJ"].
- Poprawne przykłady: "SALON", "KUCHNIA", "ŁAZIENKA", "WC", "KORYTARZ", "SYPIALNIA", "GARAŻ", "POKÓJ"
- Jeśli jest wiele ponumerowanych pokoi tego samego typu → podaj TYLKO nazwę bez numeru
- Maksymalnie 15 unikalnych typów pomieszczeń

═══════════════════════════════════════════════════════════════════════════════
WYNIK — CO ZWRACASZ
═══════════════════════════════════════════════════════════════════════════════

Zwróć JSON z:
- project_type: pełny tytuł z tabliczki
- drawing_number: numer rysunku
- scale: skala
- legend_found: true jeśli znalazłeś JAKĄKOLWIEK legendę (nawet jedną)
- legend_items: PEŁNA LISTA wszystkich symboli ze WSZYSTKICH legend (może być 20-50+ symboli!)
- rooms: WSZYSTKIE pomieszczenia
</task>

<critical_rules>
1. ⚠️ SYSTEMATYCZNOŚĆ: Skanuj 4 rogi → 4 krawędzie → centrum. NIE pomijaj żadnego obszaru.
2. ⚠️ WSZYSTKIE LEGENDY: Może być 2-3 różne legendy na jednym rysunku — ZNAJDŹ WSZYSTKIE.
3. DOSŁOWNE PRZEPISYWANIE: Nie interpretuj, nie skracaj, nie tłumacz — przepisuj 1:1.
4. KAŻDY SYMBOL: Jeśli legenda ma 40 symboli → zwróć 40 elementów w legend_items.
5. NIE ZGADUJ: Jeśli tekst nieczytelny → pomiń go (ale spróbuj odczytać maksimum).
6. KONTEKST: Przeczytaj WSZYSTKIE teksty PRZED rozpoczęciem analizy — to klucz do poprawnego zliczania.
</critical_rules>`;

// ─── PASS 2: COUNTING PROMPT (static portion, cached) ───────────────────────
export const PASS2_SYSTEM_STATIC = `<role>
Ekspert elektryk z uprawnieniami SEP i 20-letnim doświadczeniem. Specjalizacja: precyzyjne zliczanie symboli elektrycznych na rzutach budowlanych.
</role>

<visual_scanning_methodology>
KROK 1 — IDENTYFIKACJA STRUKTURY:
1. Zlokalizuj krawędzie rysunku (ramka, margines).
2. Zidentyfikuj pomieszczenia/obszary: poszukaj ścian (grube linie), oznaczenia pomieszczeń.
3. Zanotuj widoczną legendę symboli (kody: a, b, P, O1 itp.).

KROK 2 — SYSTEMATYCZNE SKANOWANIE (GRID 3×3):
Podziel obraz mentalnie na siatkę 3 rzędy × 3 kolumny (9 sektorów).
Skanuj KAŻDY sektor osobno, od lewej do prawej, od góry do dołu:

SEKTOR 1 (lewy górny):
- Przesuń wzrok pixel-by-pixel, rząd po rzędzie.
- Każdy napotkany symbol: sprawdź kształt → dopasuj do legendy → zwiększ counter.
- Zanotuj pomieszczenie/obszar, w którym symbol się znajduje.

SEKTOR 2 (środkowy górny):
- Powtórz proces skanowania.
- Symbole na krawędzi między sektorami: zlicz tylko jeśli centrum symbolu jest w tym sektorze.

SEKTORY 3-9:
- Powtórz proces dla KAŻDEGO sektora.
- Pamiętaj: NIE pomijaj żadnego sektora.

KROK 3 — VALIDACJA OBWODÓW (jeśli tagi widoczne):
- Prefiks "O"/"TO"/"RO"/"LO" = oświetlenie → musi być oprawą/łącznikiem.
- Prefiks "G"/"TG"/"RG" = gniazda → musi być gniazdem.
- Prefiks "S"/"TS" = siłowy.
- Tag obwodu ma PRIORYTET nad wyglądem symbolu.

KROK 4 — WERYFIKACJA:
- Przejrzyj KAŻDĄ legendę → sprawdź czy wszystkie kody zostały zaraportowane (nawet count=0).
- Jeśli widzisz symbol nieznany (nie w legendzie) → dodaj do warnings.
</visual_scanning_methodology>

<critical_rules>
1. SYSTEMATYCZNE SKANOWANIE: Użyj metody GRID 3×3 — skanuj KAŻDY z 9 sektorów osobno.
2. Licz WYŁĄCZNIE symbole z OFICJALNEJ LEGENDY poniżej. ŻADNYCH INNYCH.
3. MUSISZ zaraportować KAŻDY kod z legendy — nawet jeśli count=0 (wtedy podaj count: 0).
4. NIE WYMYŚLAJ ilości. Jeśli nie widzisz symbolu wyraźnie → podaj count: 0.
5. Używaj DOKŁADNYCH nazw z legendy, NIE ogólnych.
6. Pole legend_code MUSI zawierać oryginalny kod z legendy (np. "a", "P", "O1").
7. Pole confidence_reason jest WYMAGANE — podaj KONKRETNIE: "Sektor 1: 2×, Sektor 4: 3×, Sektor 7: 1× | Pomieszczenia: KORYTARZ (5×), DYŻURKA (3×)".
8. Licz KAŻDY fizyczny symbol osobno — nawet jeśli obok siebie stoi kilka identycznych.
9. Symbol częściowo zasłonięty: licz jeśli >50% widoczne.
10. Małe symbole (2-5px): patrz uważnie, to często lampy LED/downlighty.
11. Powtarzające się wzory: licz każdy symbol osobno, NIE zakładaj symmetrii.
12. ⚠️ WERYFIKACJA LOGICZNA — OBOWIĄZKOWA przed zwróceniem wyniku:
    - Jeśli tytuł projektu zawiera "OŚWIETLENI" → to rzut oświetleniowy.
      Na rzucie oświetleniowym: oprawy (lampy) >> gniazda. Jeśli gniazda > oprawy → BŁĄD KLASYFIKACJI.
      Sprawdź ponownie: kółka na rzucie oświetleniowym = LAMPY, nie gniazda.
    - Jeśli tytuł zawiera "GNIAZD" lub "SIŁOW" → rzut gniazdowy.
      Na rzucie gniazdowym: gniazda >> oprawy. Jeśli oprawy > gniazda → BŁĄD KLASYFIKACJI.
    - Jeśli wynik logicznie niemożliwy → popraw klasyfikację i przelicz.
</critical_rules>`;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────
export const legendSchema = z.object({
  project_type: z.string().describe("Tytuł projektu z tabliczki tytułowej"),
  drawing_number: z.string().nullable().describe("Numer rysunku"),
  scale: z.string().nullable().describe("Skala rysunku"),
  legend_found: z.boolean().describe("Czy znaleziono czytelną legendę"),
  legend_items: z.array(z.object({
    code: z.string().describe("Kod/litera symbolu z legendy, np. 'a', 'P', 'O1'"),
    description: z.string().describe("Dokładny opis z legendy"),
    graphic: z.string().describe("Krótki opis graficzny symbolu"),
  })),
  rooms: z.array(z.string()).max(20).describe("Max 15 unikalnych TYPÓW pomieszczeń (np. 'POKÓJ', 'ŁAZIENKA') — BEZ numerowania każdego z osobna"),
});

export const countingSchema = z.object({
  symbols: z.array(z.object({
    legend_code: z.string().describe("Oryginalny kod z legendy: 'a', 'P', 'O1', lub 'PN-EN' jeśli brak legendy"),
    symbol: z.string().describe("Pełna nazwa z legendy, np. 'oprawa downlight LED Ø150 18W'"),
    count: z.number().describe("Ile znaleziono w tym fragmencie/rzucie"),
    rooms: z.array(z.string()).nullable().describe("W których pomieszczeniach znaleziono"),
    confidence_reason: z.string().describe("Szczegóły: '5× w KORYTARZ, 3× w WC, 2× w KUCHNIA'"),
  })),
  total_symbols: z.number().describe("Suma wszystkich zliczonych symboli"),
  warnings: z.array(z.string()).nullable().describe("Symbole poza legendą, konflikty, nieczytelne obszary"),
});

export type LegendItem = z.infer<typeof legendSchema>["legend_items"][number];

// ─── Legend section builder ───────────────────────────────────────────────────
export function buildLegendSection(
  legendItems: LegendItem[],
  projectType: string,
  legendFound: boolean
): string {
  if (legendFound && legendItems.length > 0) {
    const legendJson = legendItems.map(l =>
      `  - Kod "${l.code}" = ${l.description} (grafika: ${l.graphic})`
    ).join("\n");

    const ptLower = projectType.toLowerCase();
    const domainNote = ptLower.includes("oświetleni") || ptLower.includes("oswietleni")
      ? "\n⚠️ DOMENA: RZUT OŚWIETLENIOWY — kółka = LAMPY. Gniazd jest mało lub zero. Jeśli gniazda > lampy → błąd klasyfikacji."
      : ptLower.includes("gniazd") || ptLower.includes("siłow") || ptLower.includes("silow")
      ? "\n⚠️ DOMENA: RZUT GNIAZDOWY — kółka = GNIAZDA. Lamp jest mało lub zero."
      : "";

    return `<official_legend source="Pass 1 — extracted from blueprint">
TYP PROJEKTU: ${projectType}${domainNote}
SYMBOLE DO ZLICZENIA (MUSISZ zaraportować KAŻDY, nawet jeśli count=0):
${legendJson}
</official_legend>

BEZWZGLĘDNY ZAKAZ: Nie licz ŻADNEGO symbolu, którego NIE MA na powyższej liście. Jeśli widzisz symbol nieznany — dodaj go do warnings.`;
  }

  return `<legend_not_found>
Legenda NIE została odczytana z rzutu. Typ projektu: "${projectType}".
Użyj OGÓLNYCH symboli PN-EN 60617, ale ŚCIŚLE ogranicz do domeny projektu:
- Jeśli tytuł zawiera "Oświetleni" → TYLKO oprawy, łączniki, czujniki. IGNORUJ gniazda.
- Jeśli tytuł zawiera "Gniazd" → TYLKO gniazda. IGNORUJ oprawy.
- Jeśli tytuł ogólny → wszystkie typy.

Symbole PN-EN 60617 (fallback):
- Kółko z X/+ = oprawa sufitowa
- Kółko z trójkątem = kinkiet
- Prostokąt z przekątną = oprawa liniowa LED
- Kółko z "E" = oświetlenie awaryjne
- Dwa kółka = gniazdo podwójne
- Jedno kółko z kreską = gniazdo pojedyncze
- Trójkąt przy ścianie = łącznik
- Kwadrat = puszka
- Prostokąt z przekreśleniem = rozdzielnica
</legend_not_found>

WAŻNE: Oznacz legend_code jako "PN-EN" dla symboli zidentyfikowanych z normy (nie z legendy).`;
}
