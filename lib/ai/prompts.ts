// ============================================================
// lib/ai/prompts.ts — AI prompt templates for AI Lab
// ============================================================
// Centralised config — edit here to update all prompt buttons.

export const ELEKTROSMART_BUSINESS_CONTEXT = `
KONTEKST BIZNESOWY ElektroSmart PRO:
- **SPLIT PRICING**: Każda pozycja ma OSOBNĄ cenę materiału (material_price) i robocizny (labor_price). NIGDY nie łącz ich w jedną cenę "price".
- **VAT**: Stawki VAT w Polsce: 8% (budynki mieszkalne, budownictwo społeczne) i 23% (budynki komercyjne, użyteczności publicznej, przemysłowe).
- **REGIONY**: Ceny robocizny różnią się w zależności od województwa. Współczynnik regionalny (0.85–1.25) jest mnożony przez cenę robocizny.
- **ZESTAWY (Assemblies)**: Grupy materiałów + robocizna tworzące kompletny punkt elektryczny (np. "Punkt gniazda" = puszka + przewód + gniazdo + montaż).
`;

export const COMMON_ELECTRICAL_ITEMS = `
POPULARNE POZYCJE KOSZTORYSOWE — PEŁNY ZAKRES (używaj tych nazw gdy pasują):

PRZEWODY I KABLE: Przewód YDYp 3x1,5mm² (mb), Przewód YDYp 3x2,5mm² (mb), Przewód YDYp 5x2,5mm² (mb), Przewód YDYp 5x4mm² (mb), Kabel YKY 5x4mm² (mb), Kabel YKY 5x10mm² (mb), Kabel YKY 5x16mm² (mb), Kabel YAKY 4x35mm² (mb), Przewód LgY 6mm² żółto-zielony (mb), Przewód LgY 16mm² żółto-zielony (mb), Kabel NYM 3x2,5mm² (mb), Kabel NHXMH 3x1,5mm² (mb), Kabel HDGs 3x1,5mm² (mb)

OSPRZĘT: Gniazdo pojedyncze z uziemieniem (szt), Gniazdo podwójne z uziemieniem (szt), Gniazdo hermetyczne IP44 (szt), Gniazdo hermetyczne IP55 (szt), Gniazdo przemysłowe CEE 16A 3P+N+PE IP44 (szt), Gniazdo przemysłowe CEE 32A 3P+N+PE IP44 (szt), Gniazdo przemysłowe CEE 63A 3P+N+PE IP44 (szt), Gniazdo DATA RJ45 kat.6 (szt), Gniazdo DATA RJ45 kat.6A (szt), Gniazdo TV-SAT końcowe (szt), Łącznik pojedynczy (szt), Łącznik podwójny świecznikowy (szt), Łącznik schodowy (szt), Łącznik krzyżowy (szt), Przycisk dzwonkowy (szt), Floorbox podłogowy 2x gniazdo + 2x RJ45 (szt)

PUSZKI I ROZDZIELNICE: Puszka podtynkowa Ø60 (szt), Puszka połączeniowa IP44 (szt), Puszka natynkowa hermetyczna IP65 (szt), Rozdzielnica podtynkowa 1x12 modułów (szt), Rozdzielnica podtynkowa 2x12 modułów (szt), Rozdzielnica natynkowa 2x24 modułów (szt), Rozdzielnica natynkowa IP65 48 modułów (szt), Rozdzielnica wolnostojąca IP54 96 modułów (szt)

APARATURA MODUŁOWA: Wyłącznik nadprądowy B10 1P (szt), Wyłącznik nadprądowy B16 1P (szt), Wyłącznik nadprądowy B20 1P (szt), Wyłącznik nadprądowy B32 1P (szt), Wyłącznik nadprądowy B16 3P (szt), Wyłącznik nadprądowy C25 3P (szt), Wyłącznik nadprądowy C32 3P (szt), Wyłącznik nadprądowy D63 3P (szt), Wyłącznik różnicowoprądowy 25A/30mA 2P (szt), Wyłącznik różnicowoprądowy 40A/30mA 4P (szt), Wyłącznik różnicowoprądowy 63A/300mA 4P (szt), Wyłącznik różnicowo-nadprądowy RCBO B16/30mA 1P (szt), Ogranicznik przepięć T1+T2 4P (szt), Ogranicznik przepięć T2 4P (szt), Stycznik 25A 3P (szt), Przekaźnik termiczny (szt), Falownik 3-fazowy (szt)

OPRAWY: Oprawa LED downlight Ø150 12W (szt), Oprawa LED downlight Ø200 18W (szt), Oprawa LED panel 60x60 40W (szt), Oprawa LED panel 30x120 36W (szt), Oprawa LED natynkowa liniowa 36W (szt), Oprawa LED zewnętrzna IP65 30W (szt), Oprawa LED highbay 100W IP65 (szt), Oprawa LED highbay 150W IP65 (szt), Oprawa awaryjna LED 3h (szt), Oprawa ewakuacyjna LED EXIT (szt), Oprawa LED hermetyczna IP65 36W (szt), Taśma LED 24V IP20 (mb)

TELETECHNIKA: Przewód UTP kat.6 (mb), Przewód UTP kat.6A (mb), Przewód FTP kat.6 (mb), Patch panel 24-portowy kat.6 (szt), Switch sieciowy 24-portowy PoE (szt), Access Point WiFi 6 sufitowy (szt), Szafa rack 19" 12U (szt), Szafa rack 19" 24U (szt), Szafa rack 19" 42U (szt), Kabel światłowodowy jednomodowy (mb), Kamera IP kopułkowa 4MP (szt), Kamera IP tubowa 4MP IP66 (szt), Kamera IP zewnętrzna 8MP 4K (szt), Rejestrator NVR 8-kanałowy (szt), Rejestrator NVR 16-kanałowy (szt), Czytnik kart RFID (szt), Kontroler dostępu 2-drzwiowy (szt), Elektrozaczep 12V (szt), Elektrozamek 12V (szt), Centrala alarmowa 8-strefowa (szt), Czujka PIR (szt), Czujka magnetyczna drzwiowa (szt), Centrala SSP adresowalna (szt), Czujka dymu optyczna adresowalna (szt), Ręczny ostrzegacz pożarowy (szt), Panel zewnętrzny wideodomofonowy (szt), Monitor wideodomofonowy 7" (szt), Antena TV naziemna DVB-T2 (szt), Kabel koncentryczny RG6 (mb)

ODGROMOWE: Zwód poziomy FeZn Ø8mm (mb), Zwód pionowy FeZn Ø8mm (mb), Uziom pionowy FeZn Ø20mm L=3m (szt), Szyna wyrównawcza główna (szt)

FOTOWOLTAIKA: Panel fotowoltaiczny 400Wp (szt), Falownik solarny 5kW (szt), Falownik solarny 10kW (szt), Kabel solarny 4mm² (mb), Złącze MC4 (szt)

EV: Ładowarka EV 7,4kW 1-faz (szt), Ładowarka EV 11kW 3-faz (szt), Ładowarka EV 22kW 3-faz (szt)

ROBOCIZNA: Montaż gniazda / łącznika (szt), Montaż puszki podtynkowej (szt), Montaż oprawy oświetleniowej (szt), Montaż rozdzielnicy (szt), Kucie bruzd pod przewody (mb), Układanie przewodu w rurce (mb), Układanie kabla w korytku (mb), Montaż korytka kablowego (mb), Pomiary elektryczne instalacji (kpl), Montaż kamery CCTV (szt), Montaż czytnika kontroli dostępu (szt), Montaż czujki alarmowej (szt), Montaż czujki pożarowej (szt), Montaż punktu LAN z okablowaniem (szt), Programowanie systemu alarmowego (kpl), Montaż instalacji odgromowej (kpl), Montaż instalacji PV (kpl)

JEDNOSTKI: szt (sztuka), mb (metr bieżący), kpl (komplet), m² (metr kwadratowy), h (godzina)
`;

// ─── Vector-Search-Lite: keyword → catalog section mapping ───────────────────

const CATALOG_SECTIONS: { keywords: string[]; lines: string[] }[] = [
  {
    keywords: ["kabel", "przewód", "ydy", "yky", "nym", "nhxmh", "hdgs", "lgy", "yakxs", "utp", "ftp", "swiatłowód", "rg6", "solarny"],
    lines: [COMMON_ELECTRICAL_ITEMS.split("\n").find((l) => l.startsWith("PRZEWODY") || l.includes("KABLE")) ?? ""].concat(
      COMMON_ELECTRICAL_ITEMS.split("\n").filter((l) =>
        /ydy|yky|nym|utp|ftp|kabel|przewód|swiatłowód|rg6/i.test(l)
      )
    ),
  },
  {
    keywords: ["gniazdo", "łącznik", "puszka", "osprzęt", "floorbox", "rj45", "cee", "przycisk"],
    lines: COMMON_ELECTRICAL_ITEMS.split("\n").filter((l) =>
      /gniazdo|łącznik|puszka|floorbox|rj45|cee|przycisk/i.test(l)
    ),
  },
  {
    keywords: ["wyłącznik", "rcbo", "rcd", "mcb", "bezpiecznik", "rozdzielnica", "ogranicznik", "spd", "falownik", "stycznik"],
    lines: COMMON_ELECTRICAL_ITEMS.split("\n").filter((l) =>
      /wyłącznik|rcbo|rcd|mcb|bezpiecznik|rozdzielnica|ogranicznik|falownik|stycznik/i.test(l)
    ),
  },
  {
    keywords: ["oprawa", "led", "downlight", "panel", "highbay", "awaryjna", "ewakuacyjna", "taśma", "oświetlenie"],
    lines: COMMON_ELECTRICAL_ITEMS.split("\n").filter((l) =>
      /oprawa|led|downlight|highbay|awaryjna|ewakuacyjna|taśma/i.test(l)
    ),
  },
  {
    keywords: ["kamera", "nvr", "cctv", "alarm", "czujka", "centrala", "domofon", "access point", "wifi", "szafa rack", "patch panel", "switch", "kontrola dostępu", "elektrozaczep", "ssp", "pożar"],
    lines: COMMON_ELECTRICAL_ITEMS.split("\n").filter((l) =>
      /kamera|nvr|alarm|czujka|centrala|domofon|access|wifi|rack|patch|switch|rfid|elektrozaczep|ssp|pożar/i.test(l)
    ),
  },
  {
    keywords: ["odgromowa", "uziom", "bednarka", "zwód", "maszt", "pv", "fotowoltaika", "panel solarny", "falownik solarny", "ev", "ładowarka"],
    lines: COMMON_ELECTRICAL_ITEMS.split("\n").filter((l) =>
      /odgromow|uziom|bednarka|zwód|maszt|fotowoltaika|solarny|ładowarka/i.test(l)
    ),
  },
  {
    keywords: ["montaż", "robocizna", "kucie", "bruzda", "układanie", "pomiar", "programowanie"],
    lines: COMMON_ELECTRICAL_ITEMS.split("\n").filter((l) =>
      /montaż|robocizna|kucie|bruzda|układanie|pomiar|programowanie/i.test(l)
    ),
  },
];

/**
 * Vector-Search-Lite: given a chunk of raw text, return only the catalog
 * sections relevant to keywords found in that chunk. Falls back to full catalog.
 */
export function getRelevantCatalogContext(chunkText: string): string {
  const lower = chunkText.toLowerCase();
  const matched = new Set<string>();

  for (const section of CATALOG_SECTIONS) {
    if (section.keywords.some((kw) => lower.includes(kw))) {
      section.lines.forEach((l) => { if (l.trim()) matched.add(l); });
    }
  }

  if (matched.size < 5) {
    return COMMON_ELECTRICAL_ITEMS;
  }

  return `KATALOG (dopasowane pozycje):\n${[...matched].join("\n")}`;
}

// ─── Schema-First JSON schema for AI parser ───────────────────────────────────

export const AI_PARSER_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          originalName:      { type: "string",  description: "Nazwa z dokumentu" },
          matchedCatalogId:  { type: "string",  description: "ID z katalogu lub pusty string" },
          name:              { type: "string",  description: "Polska nazwa techniczna" },
          quantity:          { type: "number",  description: "Ilość" },
          unit:              { type: "string",  description: "szt|mb|kpl|m²|h" },
          material_price:    { type: "number",  description: "Cena materiału PLN netto/jed." },
          labor_price:       { type: "number",  description: "Cena robocizny PLN netto/jed." },
          confidence:        { type: "number",  description: "Pewność dopasowania 0.0–1.0" },
        },
        required: ["name", "quantity", "unit", "material_price", "labor_price"],
      },
    },
  },
  required: ["items"],
} as const;

export interface PromptTemplate {
  label: string;
  text: string;
  hint: string;
}

// ─── Text Mode (Excel / CSV / TXT) ───────────────────────────────────────────

export const TEXT_MODE_TEMPLATES: PromptTemplate[] = [
  {
    label: "📊 Pełny Przedmiar",
    text: "Wyodrębnij WSZYSTKIE pozycje kosztorysowe z dokumentu. Dla każdej pozycji podaj: nazwę (używaj polskich nazw technicznych), ilość i jednostkę (szt, mb, kpl). Zachowaj strukturę dokumentu.",
    hint: "Wszystkie pozycje",
  },
  {
    label: "🔌 Materiały + Robocizna",
    text: "Podziel pozycje na dwie grupy: MATERIAŁY (przewody, osprzęt, aparatura) i ROBOCIZNA (montaż, układanie, pomiary). Dla każdej pozycji podaj nazwę, ilość i jednostkę.",
    hint: "Rozdziel materiał/robociznę",
  },
  {
    label: "⚡ Tylko Przewody i Kable",
    text: "Wypisz TYLKO przewody i kable z dokumentu. Użyj polskich oznaczeń: YDYp, YKY, NYM, UTP. Podaj typ, przekrój i długość w mb. Zsumuj długości dla każdego typu.",
    hint: "Zestawienie kabli",
  },
  {
    label: "🏠 Osprzęt Instalacyjny",
    text: "Wypisz TYLKO osprzęt: gniazda (pojedyncze/podwójne, z uziemieniem, IP44), łączniki (pojedyncze, schodowe, krzyżowe), puszki. Podaj ilość w sztukach.",
    hint: "Gniazda, łączniki, puszki",
  },
  {
    label: "🛡️ Rozdzielnica i Aparatura",
    text: "Wypisz TYLKO pozycje dotyczące rozdzielnicy: typ obudowy, wyłączniki nadprądowe (B10/B16/B20), RCD (30mA/300mA), rozłączniki, ograniczniki przepięć, szyny. Podaj ilości.",
    hint: "Aparatura modułowa",
  },
  {
    label: "📋 Import KNR",
    text: "Dokument zawiera kody KNR. Zamień KAŻDY kod KNR na czytelną polską nazwę pozycji kosztorysowej. Zachowaj ilości i jednostki. Użyj standardowych nazw: Przewód YDYp, Gniazdo z uziemieniem, Wyłącznik nadprądowy itd.",
    hint: "Dekodowanie KNR",
  },
];

// ─── Project Import: Przedmiar Cleanup ───────────────────────────────────────

export const CLEAN_PRZEDMIAR_SYSTEM_PROMPT = `Jesteś ekspertem od polskich kosztorysów elektrycznych.
Zadanie: Przetwórz surowy tekst przedmiaru na ustrukturyzowaną listę pozycji.

Zasady:
1. Rozdziel każdą pozycję na: name (nazwa), quantity (ilość), unit (jednostka)
2. Jednostki: szt, mb, kpl, m², h, kg, pkt — tylko polskie skróty
3. Jeśli brak ilości — wpisz 1
4. Jeśli brak jednostki — wpisz "szt"
5. Połącz zduplikowane pozycje, sumując ilości
6. Popraw oczywiste literówki w nazwach (np. "gnizdo" → "gniazdo")
7. NIE wymyślaj pozycji których nie ma w tekście
8. Ceny: zawsze 0 — to tylko porządkowanie struktury, nie wycena
9. Obsługuj formaty: "12 szt Gniazdo", "Gniazdo;szt;12", "Gniazdo 12szt", mieszane

WAŻNE — tabele z kolumnami (TSV/CSV):
Jeśli tekst zawiera nagłówek z kolumnami np. "Lp. | Opis prac i materiałów | J.m. | Ilość":
- Kolumna "Lp." to numer porządkowy wiersza — IGNORUJ ją (nie jest to ilość!)
- Kolumna "Opis prac i materiałów" lub "Nazwa" → name
- Kolumna "J.m." lub "Jm" → unit
- Kolumna "Ilość" → quantity (to jest PRAWDZIWA ilość, czytaj z tej kolumny!)
Przykład: wiersz "7\tEska B16 na gniazdka (kuchnia)\tszt\t3" → name="Eska B16 na gniazdka (kuchnia)", unit="szt", quantity=3

10. Kody KNR: jeśli w tekście widoczny kod KNR (np. "KNR 5-10 c.1 0118-23", "KNR AT-13 0109-23"), zapisz go w polu knr_code. Usuń "c.X" — format: "KNR 5-10 0118-23". Jeśli brak kodu — pomiń pole.`;

// ─── Vision Mode (PDF / Images) ──────────────────────────────────────────────

export const VISION_MODE_TEMPLATES: PromptTemplate[] = [
  {
    label: "📋 Pełny Kosztorys",
    text: "Wyodrębnij WSZYSTKIE pozycje kosztorysowe z dokumentu PDF. Dla każdej podaj: nazwę (polskie nazwy techniczne), ilość, jednostkę (szt/mb/kpl). Jeśli widoczne ceny — podaj je też.",
    hint: "Wszystkie pozycje z PDF",
  },
  {
    label: "🔌 Materiały z Przedmiaru",
    text: "Wyodrębnij pozycje materiałowe z przedmiaru/kosztorysu PDF. Podziel na: Przewody, Osprzęt, Aparatura modułowa, Oprawy. Pomiń pozycje czysto robocizny.",
    hint: "Materiały bez robocizny",
  },
  {
    label: "💡 Symbole z Rzutu",
    text: "Policz symbole elektryczne na rysunku/rzucie: lampy, gniazda, łączniki, puszki. Szukaj legendy z opisem symboli. Grupuj po pomieszczeniach jeśli możliwe.",
    hint: "Przedmiar z rysunku",
  },
  {
    label: "📋 KNR z PDF",
    text: "Dokument zawiera kody KNR. Odczytaj OPIS obok każdego kodu KNR i zamień na czytelne nazwy: Przewód YDYp, Gniazdo z uziemieniem, Wyłącznik nadprądowy. Zachowaj ilości i jednostki.",
    hint: "Dekodowanie KNR z PDF",
  },
  {
    label: "💰 Pozycje z Cenami",
    text: "Wyodrębnij TYLKO pozycje z widocznymi cenami. Podaj: nazwę, ilość, cenę jednostkową materiału i robocizny osobno (jeśli rozdzielone). Zsumuj wartości.",
    hint: "Wycenione pozycje",
  },
  {
    label: "📄 Specyfikacja Techniczna",
    text: "Odczytaj dane techniczne: nazwy urządzeń, parametry (moc, napięcie, IP), producenci, numery katalogowe. Uporządkuj: Przewody, Osprzęt, Aparatura, Oprawy.",
    hint: "Parametry i modele",
  },
];
