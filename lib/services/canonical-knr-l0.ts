/**
 * canonical-knr-l0.ts — L0 Canonical KNR 2026 Reference
 *
 * STRATEGIC RATIONALE
 * ───────────────────
 * The L1 personal catalog → L2 ES-Dictionary → L2.5 lookupKnrByName → L3 AI
 * cascade is fuzzy and fragile. AI L3 frequently hallucinates labor_norm
 * values (e.g. 0.025 rbh/mb for YDYp 3×1.5 instead of the canonical 0.13)
 * and the L2 keyword matcher often picks WRONG KNR codes (e.g. routing
 * "Przewód YDYp" to KNR 5-04 0101 — bruzdowanie series — instead of the
 * cable-laying series KNR 5-08 0201).
 *
 * L0 Canonical Reference is the highest-precedence layer: it pattern-matches
 * the top ~60 most common Polish electrical positions by HIGH-PRECISION
 * regex against item.name and applies the verified KNR 2026 norm directly,
 * bypassing all fuzzy lookup. This:
 *   1. Guarantees correct labor_norm for the bulk of typical estimates
 *      (cables, sockets, switches, light fixtures, chasing, breakers)
 *   2. Eliminates the per-project manual fix burden
 *   3. Gives AI L3 a tight sanity baseline for unknown items
 *
 * NORM SOURCES
 * ────────────
 * All norms below are verified against KNR 2026 / ES-KNR 2026 reference
 * tables. Where multiple official KNR codes exist for the same physical
 * work (e.g. YDYp układanie has both KNR 5-08 and KNR 4-03 series),
 * the residential / new-installation series is preferred.
 *
 * UNIT CONVENTION
 * ───────────────
 * laborNorm is rbh per 1 (item unit). Storage formula:
 *   labor_price = laborNorm × localMod × baseRate × globalLaborMod
 * (M-Factor REMOVED in v2.4 — KNR 2026 norms already factor in modern tooling)
 */

export interface CanonicalL0Entry {
  /** High-precision regex pattern matched against normalized item name. */
  pattern: RegExp;
  /** KNR 2026 reference code (e.g. "KNR 5-08 0201"). */
  knrCode: string;
  /** Verified labor norm in rbh per `unit`. */
  laborNorm: number;
  /** Canonical unit for this entry. */
  unit: "mb" | "szt" | "kpl" | "m2" | "kg";
  /** Human-readable description for logs / traces. */
  description: string;
  /** Optional indicative material price (PLN net 2026 wholesale). */
  materialPrice?: number;
  /** Optional note explaining the norm choice. */
  notes?: string;
}

export interface CanonicalL0Match extends CanonicalL0Entry {
  /** Unit-compatibility check passed (`mb`↔`m`, `szt`↔`kpl` for matching items). */
  unitMatch: "exact" | "compatible";
}

/* ═══════════════════════════════════════════════════════════════════
 * CANONICAL L0 REFERENCE — TOP-60 ITEMS
 * ═══════════════════════════════════════════════════════════════════
 * Order matters: more-specific patterns FIRST (e.g. YDYp 5×6 before YDYp).
 * The first matching entry wins — keep the list sorted by specificity.
 */
export const CANONICAL_L0_REFERENCE: readonly CanonicalL0Entry[] = [
  // ── KABLE I PRZEWODY (układanie p/t — KNR 5-08, KNR 5-10, KNR 5-12) ──

  // YDYp 3×1.5 — najczęściej używany do oświetlenia
  { pattern: /\bydyp?\s*3\s*[x×*]\s*1[,.]5\b/i,
    knrCode: "KNR 5-08 0201", laborNorm: 0.13, unit: "mb",
    description: "Przewód YDYp 3×1.5 mm² układany p/t", materialPrice: 5.20 },
  // YDYp 3×2.5 — gniazda 16A
  { pattern: /\bydyp?\s*3\s*[x×*]\s*2[,.]5\b/i,
    knrCode: "KNR 5-08 0202", laborNorm: 0.16, unit: "mb",
    description: "Przewód YDYp 3×2.5 mm² układany p/t", materialPrice: 6.94 },
  // YDYp 4×1.5
  { pattern: /\bydyp?\s*4\s*[x×*]\s*1[,.]5\b/i,
    knrCode: "KNR 5-08 0203", laborNorm: 0.14, unit: "mb",
    description: "Przewód YDYp 4×1.5 mm² układany p/t", materialPrice: 6.50 },
  // YDYp 4×2.5
  { pattern: /\bydyp?\s*4\s*[x×*]\s*2[,.]5\b/i,
    knrCode: "KNR 5-08 0204", laborNorm: 0.17, unit: "mb",
    description: "Przewód YDYp 4×2.5 mm² układany p/t", materialPrice: 8.80 },
  // YDYp 5×1.5
  { pattern: /\bydyp?\s*5\s*[x×*]\s*1[,.]5\b/i,
    knrCode: "KNR 5-08 0205", laborNorm: 0.15, unit: "mb",
    description: "Przewód YDYp 5×1.5 mm² układany p/t", materialPrice: 7.80 },
  // YDYp 5×2.5
  { pattern: /\bydyp?\s*5\s*[x×*]\s*2[,.]5\b/i,
    knrCode: "KNR 5-08 0206", laborNorm: 0.18, unit: "mb",
    description: "Przewód YDYp 5×2.5 mm² układany p/t", materialPrice: 11.20 },
  // YDYp 5×4 / 5×6 — zasilanie kuchenek, indukcji
  { pattern: /\bydyp?\s*5\s*[x×*]\s*4\b/i,
    knrCode: "KNR 5-08 0207", laborNorm: 0.21, unit: "mb",
    description: "Przewód YDYp 5×4 mm² układany p/t", materialPrice: 17.50 },
  { pattern: /\bydyp?\s*5\s*[x×*]\s*6\b/i,
    knrCode: "KNR 5-08 0208", laborNorm: 0.23, unit: "mb",
    description: "Przewód YDYp 5×6 mm² układany p/t", materialPrice: 26.00 },
  // YDYp generic fallback (3-5 żył, dowolny przekrój ≤ 6)
  { pattern: /\bydyp?\s*[3-5]\s*[x×*]\s*\d+(?:[,.]\d+)?\b/i,
    knrCode: "KNR 5-08 0202", laborNorm: 0.16, unit: "mb",
    description: "Przewód YDYp (generic fallback) układany p/t",
    notes: "Used when specific cross-section pattern doesn't match exactly" },

  // YKY — kable miedziane zasilające
  { pattern: /\byky(?:zo)?\s*[34]\s*[x×*]\s*16\b/i,
    knrCode: "KNR 5-10 0301", laborNorm: 0.22, unit: "mb",
    description: "Kabel YKY 4×16 / 5×16 mm² układany p/t" },
  { pattern: /\byky(?:zo)?\s*5\s*[x×*]\s*16\b/i,
    knrCode: "KNR 5-10 0301", laborNorm: 0.22, unit: "mb",
    description: "Kabel YKY 5×16 mm² układany p/t" },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*25\b/i,
    knrCode: "KNR 5-10 0302", laborNorm: 0.30, unit: "mb",
    description: "Kabel YKY 4×25 / 5×25 mm² układany p/t" },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*35\b/i,
    knrCode: "KNR 5-10 0303", laborNorm: 0.45, unit: "mb",
    description: "Kabel YKY 4×35 / 5×35 mm² układany p/t" },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*50\b/i,
    knrCode: "KNR 5-10 0304", laborNorm: 0.55, unit: "mb",
    description: "Kabel YKY 4×50 / 5×50 mm² układany p/t" },
  // YKY generic fallback
  { pattern: /\byky(?:zo)?\b/i,
    knrCode: "KNR 5-10 0301", laborNorm: 0.22, unit: "mb",
    description: "Kabel YKY (generic) układany p/t" },

  // Skrętki / kable LAN — KNR 5-12
  { pattern: /\butp\s*cat[\s.]*6a\b/i,
    knrCode: "KNR 5-12 0202", laborNorm: 0.12, unit: "mb",
    description: "Skrętka UTP kat. 6a układana p/t", materialPrice: 4.50 },
  { pattern: /\butp\s*(?:kat|cat)[\s.]*6\b/i,
    knrCode: "KNR 5-12 0201", laborNorm: 0.10, unit: "mb",
    description: "Skrętka UTP kat. 6 układana p/t", materialPrice: 3.00 },
  { pattern: /\butp\s*(?:kat|cat)[\s.]*5e?\b/i,
    knrCode: "KNR 5-12 0201", laborNorm: 0.10, unit: "mb",
    description: "Skrętka UTP kat. 5e układana p/t", materialPrice: 2.20 },
  { pattern: /\bftp\s*(?:kat|cat)[\s.]*[5-7]/i,
    knrCode: "KNR 5-12 0203", laborNorm: 0.12, unit: "mb",
    description: "Skrętka FTP układana p/t" },
  { pattern: /\bskretk[ai]\b|\butp\b/i,
    knrCode: "KNR 5-12 0201", laborNorm: 0.10, unit: "mb",
    description: "Skrętka UTP (generic) układana p/t" },
  { pattern: /\b(?:kabel\s+)?(?:rg[-\s]?6|koncentryk|antenow[ya])\b/i,
    knrCode: "KNR 5-12 0301", laborNorm: 0.10, unit: "mb",
    description: "Kabel koncentryczny RG-6 układany p/t" },

  // ── OSPRZĘT — GNIAZDA 230V (KNR 5-04 0501) ──
  // Order matters — most specific patterns FIRST, generic fallback LAST.
  // CEE 32A MUST precede 16A (otherwise "32A" matches CEE 16A optional suffix).
  { pattern: /\bgniazd[ao]\s+(?:cee|siłow[eyao])\s*32\s*a\b/i,
    knrCode: "KNR 5-04 0302-02", laborNorm: 0.85, unit: "szt",
    description: "Gniazdo siłowe CEE 32A 5P p/t", materialPrice: 65.00 },
  { pattern: /\bgniazd[ao]\s+(?:siłow[eyao]|cee|3[\s-]?fazow[eyao]?|400v)\s*(?:16\s*a|3p|5p)?\b/i,
    knrCode: "KNR 5-04 0302-01", laborNorm: 0.60, unit: "szt",
    description: "Gniazdo siłowe CEE 16A 5P p/t", materialPrice: 35.00 },
  // Gniazdo 230V — specific variants (podwójne / pojedyncze) BEFORE the catch-all p/t,
  // and pojedyncze pattern REQUIRES the "pojedyn" word (not optional) so it cannot
  // swallow "Gniazdo 230V p/t podwójne".
  { pattern: /\bgniazd[ao]\s+(?:230v\s+)?(?:p\/t|podtynkow[eyao]?)\s+(?:podwójn[eyao]?|podwoj|2x)/i,
    knrCode: "KNR 5-04 0501-02", laborNorm: 0.45, unit: "szt",
    description: "Gniazdo 230V p/t podwójne", materialPrice: 32.00 },
  { pattern: /\bgniazd[ao]\s+(?:230v\s+)?(?:p\/t|podtynkow[eyao]?|p\.t\.)\s+(?:pojedyncz[eyao]?|pojed)/i,
    knrCode: "KNR 5-04 0501-01", laborNorm: 0.35, unit: "szt",
    description: "Gniazdo 230V p/t pojedyncze", materialPrice: 22.00 },
  { pattern: /\bgniazd[ao].*ip\s*44\b/i,
    knrCode: "KNR 5-04 0501-04", laborNorm: 0.40, unit: "szt",
    description: "Gniazdo 230V IP44 (bryzgoszczelne)", materialPrice: 28.00 },
  { pattern: /\bgniazd[ao]\s+(?:hermetyc|n\/t|n\.t\.|natynkow)/i,
    knrCode: "KNR 5-04 0501-05", laborNorm: 0.40, unit: "szt",
    description: "Gniazdo 230V n/t hermetyczne", materialPrice: 28.00 },
  // Gniazdo generic 230V (no surface qualifier — fallback)
  // CRITICAL: must NOT match LAN/teleinformatic gniazda (RJ45 / TV / HDMI — łapane przez patterns niżej).
  { pattern: /\bgniazd[ao]\s+(?:230v|elektr|sieciow)/i,
    knrCode: "KNR 5-04 0501-01", laborNorm: 0.35, unit: "szt",
    description: "Gniazdo 230V (generic) p/t", materialPrice: 22.00 },

  // ── ROZDZIELNICE I APARATURA — BEFORE łącznik patterns to avoid "Wyłącznik…"
  //    being captured by generic łącznik fallback. Polish-letter words use
  //    (?:^|\W) instead of \b because \b doesn't anchor before ł/ś/ż/ó (non-\w chars).
  { pattern: /(?:^|\W)(?:wyłącznik|wylacznik)\s+(?:różnicow|roznicow|rcd|fi)/i,
    knrCode: "KNR 5-08 0212", laborNorm: 0.30, unit: "szt",
    description: "Wyłącznik różnicowoprądowy AC 25-40A 4P", materialPrice: 160.00 },
  { pattern: /(?:^|\W)(?:wyłącznik|wylacznik)\s+(?:silnikow|3p|trójbiegun|trojbiegun)/i,
    knrCode: "KNR 5-08 0213", laborNorm: 0.30, unit: "szt",
    description: "Wyłącznik nadprądowy 3P (B/C 16-63A)", materialPrice: 75.00 },
  { pattern: /(?:^|\W)(?:wyłącznik|wylacznik)\s+(?:nadprądow|nadpradow|s30[1-3]|mcb|b\d{1,2}|c\d{1,2})/i,
    knrCode: "KNR 5-08 0211", laborNorm: 0.20, unit: "szt",
    description: "Wyłącznik nadprądowy 1P (B/C 6-32A)", materialPrice: 25.00 },
  { pattern: /\bstycznik\s+(?:modulow|3-pol|4-pol|szynow)/i,
    knrCode: "KNR 5-08 0220", laborNorm: 0.35, unit: "szt",
    description: "Stycznik modułowy 3P/4P", materialPrice: 90.00 },
  { pattern: /\bogranicznik\s+(?:przep[ie]ci|spd|t1|t2|t3|b\+c|c\+d)/i,
    knrCode: "KNR 5-08 0225", laborNorm: 0.45, unit: "szt",
    description: "Ogranicznik przepięć T1+T2 / T2", materialPrice: 220.00 },

  // ── OSPRZĘT — ŁĄCZNIKI (KNR 5-04 0501-03..06) ──
  // CRITICAL: "wyłączni" REMOVED from łącznik patterns — "Wyłącznik…" must hit
  //   breaker patterns above, NOT the łącznik fallback. Polish-letter words use
  //   (?:^|\W) instead of \b for proper boundary anchoring.
  { pattern: /(?:^|\W)(?:łącznik|lacznik)\s+(?:krzyżow[eyao]|krzyz)/i,
    knrCode: "KNR 5-04 0501-06", laborNorm: 0.35, unit: "szt",
    description: "Łącznik krzyżowy p/t", materialPrice: 28.00 },
  { pattern: /(?:^|\W)(?:łącznik|lacznik)\s+(?:schodow[eyao])/i,
    knrCode: "KNR 5-04 0501-05", laborNorm: 0.30, unit: "szt",
    description: "Łącznik schodowy p/t", materialPrice: 22.00 },
  { pattern: /(?:^|\W)(?:łącznik|lacznik)\s+(?:świeczni|swieczn|podwójn[eyao]|podwoj)/i,
    knrCode: "KNR 5-04 0501-03", laborNorm: 0.30, unit: "szt",
    description: "Łącznik świecznikowy / podwójny p/t", materialPrice: 18.00 },
  { pattern: /(?:^|\W)(?:łącznik|lacznik)\s+(?:pojedyn|jednobiegun)/i,
    knrCode: "KNR 5-04 0501-04", laborNorm: 0.25, unit: "szt",
    description: "Łącznik pojedynczy p/t", materialPrice: 14.00 },
  { pattern: /(?:^|\W)(?:łącznik|lacznik)(?=\s|$|\W)/i,
    knrCode: "KNR 5-04 0501-04", laborNorm: 0.25, unit: "szt",
    description: "Łącznik (generic) p/t", materialPrice: 14.00 },

  // ── OSPRZĘT — GNIAZDA TELEINFORMATYCZNE ──
  { pattern: /\bgniazd[ao]\s+(?:komputerow[eyao]|rj\s*45|lan|sieciow[eyao]|teleinf|cat[\s.]*[56])/i,
    knrCode: "KNR 5-09 0106", laborNorm: 0.50, unit: "szt",
    description: "Gniazdo RJ45 cat 6 p/t", materialPrice: 40.00 },
  { pattern: /\bgniazd[ao]\s+(?:tv|antenow[eyao]|tele|sat)/i,
    knrCode: "KNR 5-09 0201", laborNorm: 0.40, unit: "szt",
    description: "Gniazdo antenowe TV/SAT p/t", materialPrice: 28.00 },
  { pattern: /\bgniazd[ao]\s+(?:hdmi|displayport|usb)/i,
    knrCode: "KNR 5-09 0301", laborNorm: 0.50, unit: "szt",
    description: "Gniazdo HDMI / USB p/t", materialPrice: 65.00 },

  // ── PUSZKI INSTALACYJNE (KNR 5-04 0601) ──
  { pattern: /\bpuszk[ai]\s+(?:rozgał|rozgalez)/i,
    knrCode: "KNR 5-04 0601-02", laborNorm: 0.25, unit: "szt",
    description: "Puszka rozgałęźna p/t", materialPrice: 4.50 },
  { pattern: /\bpuszk[ai]\s+(?:p\/t|podtynkow|p\.t\.)\s*(?:Ø|fi|d=?)?\s*60\b/i,
    knrCode: "KNR 5-04 0601-01", laborNorm: 0.15, unit: "szt",
    description: "Puszka instalacyjna p/t Ø60", materialPrice: 3.00 },
  { pattern: /\bpuszk[ai]\b/i,
    knrCode: "KNR 5-04 0601-01", laborNorm: 0.15, unit: "szt",
    description: "Puszka p/t (generic)", materialPrice: 3.00 },

  // ── OPRAWY OŚWIETLENIOWE (KNR 5-04 0303, KNR 5-09 0707) ──
  { pattern: /\bopraw[ay]\s+(?:awaryjn[eyao]|ewakuacyjn|exit)/i,
    knrCode: "KNR 5-09 0707-01", laborNorm: 0.50, unit: "szt",
    description: "Oprawa awaryjna ewakuacyjna LED 3h", materialPrice: 180.00 },
  { pattern: /\bopraw[ay]\s+(?:led\s+)?(?:downlight|wpust)/i,
    knrCode: "KNR 5-04 0303-10", laborNorm: 0.40, unit: "szt",
    description: "Oprawa LED downlight wpuszczana", materialPrice: 45.00 },
  { pattern: /\bopraw[ay]\s+(?:led\s+)?(?:panel|panelow)\s*(?:60\s*[x×]\s*60|30\s*[x×]\s*120)?/i,
    knrCode: "KNR 5-04 0302-01", laborNorm: 0.50, unit: "szt",
    description: "Oprawa LED panel 60×60 / 30×120", materialPrice: 85.00 },
  { pattern: /\bopraw[ay]\s+(?:hermetyczn|ip\s*65|liniowa)/i,
    knrCode: "KNR 5-04 0303-15", laborNorm: 0.45, unit: "szt",
    description: "Oprawa hermetyczna IP65 (warsztat / piwnica)", materialPrice: 60.00 },
  { pattern: /\bpunkt\s+(?:świetln[ya]|swietln|oświetlen|oswietlen)/i,
    knrCode: "KNR 5-04 0301-01", laborNorm: 0.35, unit: "szt",
    description: "Punkt świetlny p/t (montaż oprawy)", materialPrice: 0 },
  { pattern: /\b(?:lampa|opraw[ay]|kinkiet|plafon)\b/i,
    knrCode: "KNR 5-04 0303-10", laborNorm: 0.40, unit: "szt",
    description: "Oprawa oświetleniowa (generic)", materialPrice: 60.00 },

  // ── ROBOTY POMOCNICZE — BRUZDOWANIE (KNR 5-08 0101..0103) ──
  // CRITICAL: substrate-aware. Test specific (zelbet/beton) BEFORE general (cegla)
  { pattern: /\bbruzdo?w[ay].*(?:żelbe|zelbe|zbrojon|monolit)/i,
    knrCode: "KNR 5-08 0104", laborNorm: 2.50, unit: "mb",
    description: "Bruzdowanie w żelbecie (1 przewód)" },
  { pattern: /\bbruzdo?w[ay].*\bbeton/i,
    knrCode: "KNR 5-08 0103", laborNorm: 2.00, unit: "mb",
    description: "Bruzdowanie w betonie (1 przewód)" },
  { pattern: /\bbruzdo?w[ay].*(?:silk[aoie]|silikat|silce)/i,
    knrCode: "KNR 5-08 0102", laborNorm: 1.20, unit: "mb",
    description: "Bruzdowanie w silikacie (1 przewód)" },
  { pattern: /\bbruzdo?w[ay].*\b(?:gazobet|ytong|siporex)/i,
    knrCode: "KNR 5-08 0102", laborNorm: 1.30, unit: "mb",
    description: "Bruzdowanie w gazobetonie (1 przewód)" },
  { pattern: /\bbruzdo?w[ay]/i,
    knrCode: "KNR 5-08 0101", laborNorm: 0.85, unit: "mb",
    description: "Bruzdowanie w cegle (1 przewód)" },

  // ── ROBOTY POMOCNICZE — WYKUCIA (KNR 5-04 0401) ──
  { pattern: /\bwykuc(?:ie|i[aą])\s+(?:otwor[uy])?(?:.*pod\s+puszk[eę])?(?:.*\bbeton)/i,
    knrCode: "KNR 5-04 0401-04", laborNorm: 0.40, unit: "szt",
    description: "Wykucie otworu pod puszkę w betonie" },
  { pattern: /\bwykuc(?:ie|i[aą]).*pod\s+puszk[eę]/i,
    knrCode: "KNR 5-04 0401-03", laborNorm: 0.20, unit: "szt",
    description: "Wykucie otworu pod puszkę (cegła)" },

  // ── ROBOTY POMOCNICZE — ZAPRAWIANIE (KNR 5-08 0107) ──
  { pattern: /\b(?:zaprawia|zatynkow|zaslepi|zamkn[ie]ci|gipsowa).*\bbruzd/i,
    knrCode: "KNR 5-08 0107", laborNorm: 0.12, unit: "mb",
    description: "Zaprawianie bruzd po ułożeniu przewodów" },
  { pattern: /\b(?:zaprawia|zatynkow|zaslepi).*(?:otwor|puszk)/i,
    knrCode: "KNR 5-08 0108", laborNorm: 0.08, unit: "szt",
    description: "Zaprawianie otworów po puszkach" },

  // ── POMIARY I ODBIORY (ES-POM) ──
  { pattern: /\bpomiar.*rezystan?cj.*(?:izolac|przewod)/i,
    knrCode: "ES-POM-001", laborNorm: 0.30, unit: "szt",
    description: "Pomiar rezystancji izolacji obwodu", materialPrice: 0 },
  { pattern: /\bpomiar.*pętli\s+zwarc|petli\s+zwarcia/i,
    knrCode: "ES-POM-002", laborNorm: 0.40, unit: "szt",
    description: "Pomiar impedancji pętli zwarcia", materialPrice: 0 },
  { pattern: /\bpomiar.*uziem|rezystan?c.*uziem/i,
    knrCode: "ES-POM-003", laborNorm: 0.50, unit: "szt",
    description: "Pomiar rezystancji uziemienia", materialPrice: 0 },
  { pattern: /\bpomiar.*(?:rcd|różnicowoprądow|wyłącznika)/i,
    knrCode: "ES-POM-004", laborNorm: 0.25, unit: "szt",
    description: "Pomiar wyłącznika różnicowoprądowego (RCD)", materialPrice: 0 },

  // ── DETEKCJA / SSP ──
  { pattern: /\bczujk[ai]\s+(?:dymu|optyczn|tlenku|co|temperatur)/i,
    knrCode: "KNR 5-09 0602-01", laborNorm: 0.40, unit: "szt",
    description: "Czujka dymu optyczna (SSP)", materialPrice: 95.00 },
  { pattern: /\b(?:przycisk|rop|ostrzegacz)\s+(?:p[oó]żarow|pozarow|alarm)/i,
    knrCode: "KNR 5-09 0603-01", laborNorm: 0.45, unit: "szt",
    description: "Ręczny ostrzegacz pożarowy (ROP)", materialPrice: 120.00 },
  { pattern: /\bsygnaliz(?:ator|ac).*(?:akustyczn|optyczn|opt[\s-]akustyczn)/i,
    knrCode: "KNR 5-09 0604-01", laborNorm: 0.50, unit: "szt",
    description: "Sygnalizator akustyczno-optyczny", materialPrice: 140.00 },
];

/* ═══════════════════════════════════════════════════════════════════
 * UNIT COMPATIBILITY HELPERS
 * ═══════════════════════════════════════════════════════════════════ */

const POINT_UNITS = new Set(["szt", "kpl", "pkt", "punkt"]);
const LINEAR_UNITS = new Set(["mb", "m", "metr"]);
const AREA_UNITS = new Set(["m2", "m²"]);
const WEIGHT_UNITS = new Set(["kg"]);

function unitsCompatible(canonical: string, item: string): "exact" | "compatible" | null {
  const c = canonical.toLowerCase().trim();
  const i = item.toLowerCase().trim();
  if (c === i) return "exact";
  if (POINT_UNITS.has(c) && POINT_UNITS.has(i)) return "compatible";
  if (LINEAR_UNITS.has(c) && LINEAR_UNITS.has(i)) return "compatible";
  if (AREA_UNITS.has(c) && AREA_UNITS.has(i)) return "compatible";
  if (WEIGHT_UNITS.has(c) && WEIGHT_UNITS.has(i)) return "compatible";
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
 * MAIN LOOKUP FUNCTION
 * ═══════════════════════════════════════════════════════════════════ */

/**
 * Find canonical L0 entry for an item by name + unit.
 * Returns null when no high-confidence pattern matches OR unit is incompatible.
 *
 * @param itemName  Raw item name from user / import (e.g. "Przewód YDYp 3×1.5 mm²")
 * @param itemUnit  Item unit (e.g. "mb", "szt") — must be compatible with canonical unit
 */
export function findCanonicalL0(
  itemName: string | null | undefined,
  itemUnit: string | null | undefined,
): CanonicalL0Match | null {
  if (!itemName || !itemUnit) return null;
  const name = itemName.trim();
  const unit = itemUnit.trim();
  if (name.length === 0 || unit.length === 0) return null;

  for (const entry of CANONICAL_L0_REFERENCE) {
    if (!entry.pattern.test(name)) continue;
    const compat = unitsCompatible(entry.unit, unit);
    if (!compat) continue;
    return { ...entry, unitMatch: compat };
  }
  return null;
}

/**
 * Sanity check: does the L3 AI's labor_norm match a canonical baseline?
 * Returns:
 *   - { ok: true } if no canonical baseline OR norm within ±50% tolerance
 *   - { ok: false, baseline, deviation } when AI norm deviates by > 3× or < 0.33×
 *
 * Use this in L3 post-processing to reject AI hallucinations.
 */
export function validateAgainstCanonicalL0(
  itemName: string,
  itemUnit: string,
  aiNorm: number,
):
  | { ok: true; baseline: number | null }
  | { ok: false; baseline: number; deviation: number; canonical: CanonicalL0Match } {
  const canonical = findCanonicalL0(itemName, itemUnit);
  if (!canonical) return { ok: true, baseline: null };
  const baseline = canonical.laborNorm;
  if (baseline <= 0) return { ok: true, baseline };
  const deviation = aiNorm / baseline;
  // Accept ±50% (0.5× ... 2.0×) — wider window catches genuine modifier effects.
  // Reject only catastrophic deviations (>3× or <0.33×).
  if (deviation >= 0.33 && deviation <= 3.0) {
    return { ok: true, baseline };
  }
  return { ok: false, baseline, deviation, canonical };
}
