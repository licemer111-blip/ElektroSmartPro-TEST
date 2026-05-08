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
 * CANONICAL L0 REFERENCE — TOP-170 ITEMS (v2.8.0 max coverage)
 * ═══════════════════════════════════════════════════════════════════
 * Order matters: more-specific patterns FIRST (e.g. YDYp 5×6 before YDYp).
 * The first matching entry wins — keep the list sorted by specificity.
 */
export const CANONICAL_L0_REFERENCE: readonly CanonicalL0Entry[] = [
  // ── KABLE I PRZEWODY (układanie p/t — KNR 5-08, KNR 5-10, KNR 5-12) ──

  // YDYp 2×1.5 — dzwonek, sygnalizacja, 2-przewodowe obwody
  { pattern: /\bydyp?\s*2\s*[x×*]\s*1[,.]5\b/i,
    knrCode: "KNR 5-08 0200", laborNorm: 0.11, unit: "mb",
    description: "Przewód YDYp 2×1.5 mm² układany p/t", materialPrice: 3.50 },

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
  // YKY duże przekroje — MUST precede generic fallback (0.22 rbh/mb would undercharge ×6+ vs 240mm²)
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*70\b/i,
    knrCode: "KNR 5-10 0305", laborNorm: 0.70, unit: "mb",
    description: "Kabel YKY 4×70 / 5×70 mm² układany p/t", materialPrice: 38.00 },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*95\b/i,
    knrCode: "KNR 5-10 0306", laborNorm: 0.85, unit: "mb",
    description: "Kabel YKY 4×95 / 5×95 mm² układany p/t", materialPrice: 55.00 },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*120\b/i,
    knrCode: "KNR 5-10 0307", laborNorm: 1.00, unit: "mb",
    description: "Kabel YKY 4×120 / 5×120 mm² układany p/t", materialPrice: 72.00 },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*150\b/i,
    knrCode: "KNR 5-10 0308", laborNorm: 1.15, unit: "mb",
    description: "Kabel YKY 4×150 / 5×150 mm² układany p/t", materialPrice: 95.00 },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*185\b/i,
    knrCode: "KNR 5-10 0309", laborNorm: 1.25, unit: "mb",
    description: "Kabel YKY 4×185 / 5×185 mm² układany p/t", materialPrice: 120.00 },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*240\b/i,
    knrCode: "KNR 5-10 0310", laborNorm: 1.40, unit: "mb",
    description: "Kabel YKY 4×240 / 5×240 mm² układany p/t", materialPrice: 158.00 },
  { pattern: /\byky(?:zo)?\s*[45]\s*[x×*]\s*(?:300|400)\b/i,
    knrCode: "KNR 5-10 0311", laborNorm: 1.70, unit: "mb",
    description: "Kabel YKY 5×300 / 5×400 mm² układany p/t", materialPrice: 210.00 },
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
  // Stycznik modułowy — use .* + Polish letter class so 'modułowy' (ł) and
  // non-adjacent keywords like 'Stycznik modułowy 3-pol 25A' both match.
  { pattern: /\bstycznik\b.*\b(?:modu[lł]ow|3[\s-]?pol|4[\s-]?pol|szynow)/i,
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
  // Łącznik specialized — must precede generic fallback (each matches łącznik\W)
  { pattern: /(?:^|\W)(?:łącznik|lacznik)\s+(?:z\s+)?(?:pir|czujnikiem\s+ruchu|ruchu|ruchem)/i,
    knrCode: "KNR 5-04 0501-08", laborNorm: 0.81, unit: "szt",
    description: "Łącznik z czujnikiem ruchu PIR", materialPrice: 95.00 },
  { pattern: /(?:^|\W)(?:łącznik|lacznik)\s+(?:kart|hotelo)/i,
    knrCode: "KNR 5-04 0501-09", laborNorm: 0.50, unit: "szt",
    description: "Łącznik kartowy hotelowy", materialPrice: 65.00 },
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
  // Oprawy specialized — must precede generic (lampa|oprawa|kinkiet|plafon) fallback
  { pattern: /\bplafon\b/i,
    knrCode: "KNR 5-04 0303-11", laborNorm: 0.68, unit: "szt",
    description: "Plafon LED sufitowy", materialPrice: 90.00 },
  { pattern: /\bkinkiet\b/i,
    knrCode: "KNR 5-04 0303-12", laborNorm: 0.65, unit: "szt",
    description: "Kinkiet ścienny LED", materialPrice: 75.00 },
  // 'park' removed — 'Lampa parkowa' (4-5m uliczna) ma osobny wpis 2.50 rbh.
  { pattern: /\b(?:lampa|opraw[ay])\s+(?:ogrodow|s[lł]upkow)|\bs[lł]upek\s+ogrodow/i,
    knrCode: "KNR 5-04 0303-20", laborNorm: 1.20, unit: "szt",
    description: "Lampa ogrodowa słupkowa", materialPrice: 250.00 },
  // Reflektor architektoniczny / elewacyjny — BEFORE generic reflektor (specific first).
  // Use .* between reflektor and qualifier — 'LED' model often appears between.
  { pattern: /\b(?:reflektor|naświetlacz)\b.*\b(?:architekt|elewacyjn|fasadow|liniow.*zewn)/i,
    knrCode: "KNR 5-04 0303-26", laborNorm: 0.85, unit: "szt",
    description: "Reflektor LED architektoniczny / elewacyjny", materialPrice: 280.00 },
  { pattern: /\b(?:reflektor|naświetlacz|naswietlacz|halogen)\b/i,
    knrCode: "KNR 5-04 0303-13", laborNorm: 0.55, unit: "szt",
    description: "Reflektor / naświetlacz LED", materialPrice: 95.00 },
  { pattern: /\b(?:listwa|ta[śs]ma)\s+led\b/i,
    knrCode: "KNR 5-04 0303-30", laborNorm: 1.22, unit: "kpl",
    description: "Listwa / taśma LED kpl", materialPrice: 180.00 },
  // Oprawa biurowa / zwieszana / nablat — BEFORE generic (specific first).
  // Use .* — 'LED' model often appears between 'Oprawa' and 'biurowa'.
  { pattern: /\bopraw[ay]\b.*\b(?:biurow|zwieszan|liniowa\s+led|nablat)/i,
    knrCode: "ES-BIU-010", laborNorm: 0.60, unit: "szt",
    description: "Oprawa LED biurowa zwieszana / nablat", materialPrice: 280.00 },
  // Lampa parkowa / uliczna — BEFORE generic lampa fallback (4-5m uliczna != 1m ogrodowa).
  { pattern: /\blampa\s+(?:parkow|uliczn|drogow|sodow)/i,
    knrCode: "KNR 5-04 0303-25", laborNorm: 2.50, unit: "szt",
    description: "Lampa parkowa / uliczna 4-5m", materialPrice: 850.00 },
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

  // ── STEROWANIE / AUTOMATYKA (KNR 5-04, KNR 5-09) ──
  // Polish-letter front-anchor: \b doesn't anchor before Ś (non-\w char in JS regex).
  { pattern: /(?:^|\W)(?:[śs]ciemniacz|dimmer)(?=\W|$)/i,
    knrCode: "KNR 5-04 0501-10", laborNorm: 0.82, unit: "szt",
    description: "Ściemniacz / dimmer obrotowy lub klawiszowy", materialPrice: 85.00 },
  // "Czujnik ruchu PIR" — distinct from "Łącznik z czujnikiem ruchu" (caught above)
  { pattern: /\b(?:czujnik|detektor|sensor)\s+(?:ruchu|pir)\b|\bpir\s+(?:czujnik|detekt|sensor)/i,
    knrCode: "KNR 5-09 0410", laborNorm: 0.81, unit: "szt",
    description: "Czujnik ruchu PIR (sterowanie oświetleniem)", materialPrice: 75.00 },
  { pattern: /\bczujnik\s+zmierz|\bzmierzchow[yao]/i,
    knrCode: "KNR 5-09 0411", laborNorm: 0.65, unit: "szt",
    description: "Czujnik zmierzchowy", materialPrice: 80.00 },
  { pattern: /\btermostat\b/i,
    knrCode: "KNR 5-09 0501", laborNorm: 0.55, unit: "szt",
    description: "Termostat pokojowy / podłogówka", materialPrice: 95.00 },
  { pattern: /\bregulator\s+(?:obrot|wentyl|pr[eę]dko[śs])/i,
    knrCode: "KNR 5-09 0502", laborNorm: 0.45, unit: "szt",
    description: "Regulator obrotów wentylatora", materialPrice: 65.00 },

  // ── ROZDZIELNICE — KOMPONENTY (KNR 5-08 0301..0312) ──
  // Specific (24-mod) BEFORE generic — order matters
  { pattern: /\b(?:obudowa|rozdzielni[ac])\b.*\b(?:24|do\s*24)\s*mod|\brozdzielni[ac].*24[\s-]?mod/i,
    knrCode: "KNR 5-08 0302", laborNorm: 3.00, unit: "szt",
    description: "Obudowa rozdzielnicy p/t do 24 modułów", materialPrice: 290.00 },
  { pattern: /\b(?:obudowa|rozdzielni[ac])\b.*\b(?:12|do\s*12)\s*mod|\brozdzielni[ac].*12[\s-]?mod/i,
    knrCode: "KNR 5-08 0301", laborNorm: 1.80, unit: "szt",
    description: "Obudowa rozdzielnicy p/t do 12 modułów", materialPrice: 180.00 },
  { pattern: /\blistw[aą]\s+zaciskow|\bzacisk\s+(?:n|pe)\b/i,
    knrCode: "KNR 5-08 0310", laborNorm: 0.20, unit: "szt",
    description: "Listwa zaciskowa N/PE w rozdzielnicy", materialPrice: 25.00 },
  { pattern: /\blampka\s+(?:kontroln|sygnaliz)/i,
    knrCode: "KNR 5-08 0312", laborNorm: 0.15, unit: "szt",
    description: "Lampka kontrolna / sygnalizacyjna", materialPrice: 18.00 },
  { pattern: /\b(?:opisanie|opis|etykiet|znakowani)\b.*(?:obwod|rozdzielni)|\betykiet\s+(?:rozdzielni|obwod)/i,
    knrCode: "ES-RPN-001", laborNorm: 0.10, unit: "szt",
    description: "Opisanie obwodów / etykietowanie rozdzielnicy", materialPrice: 5.00 },

  // ── ANTENA / SAT / RTV (KNR 5-12 04xx) ──
  { pattern: /\bantena\s+(?:dvb|sat|tv|telewizyjn|naziemn|satelitar)/i,
    knrCode: "KNR 5-12 0401", laborNorm: 1.50, unit: "szt",
    description: "Antena DVB-T/T2 / SAT z montażem", materialPrice: 380.00 },
  { pattern: /\bmulti[\s-]?switch\b/i,
    knrCode: "KNR 5-12 0402", laborNorm: 0.80, unit: "szt",
    description: "Multiswitch SAT/TV", materialPrice: 250.00 },
  { pattern: /\bwzmacniacz\s+(?:anten|sygna[lł]u|tv|sat)/i,
    knrCode: "KNR 5-12 0403", laborNorm: 0.50, unit: "szt",
    description: "Wzmacniacz antenowy TV/SAT", materialPrice: 120.00 },
  { pattern: /\bmaszt\s+(?:anten|tv)|\bmaszt\b(?!.*spaw)/i,
    knrCode: "KNR 5-12 0404", laborNorm: 2.50, unit: "szt",
    description: "Maszt antenowy z montażem", materialPrice: 250.00 },

  // ── DOMOFONY / WIDEODOMOFONY (KNR 5-09 08xx) ──
  { pattern: /\bpanel\s+(?:zewn[eę]trzn|domofon|wej[śs]ciow)|\b(?:wideo|video)?domofon.*panel/i,
    knrCode: "KNR 5-09 0801", laborNorm: 1.20, unit: "szt",
    description: "Panel zewnętrzny domofonu / wideodomofonu", materialPrice: 480.00 },
  { pattern: /\b(?:unifon|wideounifon|videounifon|monitor\s+(?:domofon|wideodomofon))/i,
    knrCode: "KNR 5-09 0802", laborNorm: 0.80, unit: "szt",
    description: "Unifon / wideounifon", materialPrice: 320.00 },
  { pattern: /\bczytnik\s+(?:kart|rfid|zbli[zż]eni|breloko)/i,
    knrCode: "KNR 5-09 0803", laborNorm: 0.65, unit: "szt",
    description: "Czytnik kart RFID / kontrola dostępu", materialPrice: 180.00 },

  // ── KORYTKA / DRABINKI / KANAŁY (KNR 5-08 05xx) ──
  { pattern: /\bdrabinka\s+kablow|\bdrabinka\b/i,
    knrCode: "KNR 5-08 0502", laborNorm: 0.55, unit: "mb",
    description: "Drabinka kablowa metalowa", materialPrice: 65.00 },
  { pattern: /\bkorytko\s+(?:kablow|metalow|siatkow|drucian)|\bkorytk[ao]\b/i,
    knrCode: "KNR 5-08 0501", laborNorm: 0.40, unit: "mb",
    description: "Korytko kablowe metalowe / siatkowe", materialPrice: 35.00 },
  { pattern: /\b(?:listwa\s+(?:pcv|elektroin|instalacyjn|kablowa)|kana[lł]\s+kablow|peszel)/i,
    knrCode: "KNR 5-08 0503", laborNorm: 0.20, unit: "mb",
    description: "Listwa PCV / kanał kablowy / peszel", materialPrice: 12.00 },

  // ── POMIARY ROZSZERZONE (ES-POM 005..099) ──
  { pattern: /\bpomiar.*(?:nat[eę][zż]eni[ae]\s+o[śs]wietl|luksomet|luxomet|jasno[śs])/i,
    knrCode: "ES-POM-005", laborNorm: 0.35, unit: "szt",
    description: "Pomiar natężenia oświetlenia (luksomierz)", materialPrice: 0 },
  // Genitive case 'ciągłości' — stem matches 'ciągłośc' but then 'i' follows (no \s), so accept optional case ending [iy].
  { pattern: /\bpomiar.*(?:ci[aą]g[lł]o[śs]ci|ciaglosci|ci[aą]g[lł]o[śs]c[iy]?)\s+(?:przewod|po[lł][aą]cze)|\bbadanie\s+ci[aą]g[lł]o[śs]c/i,
    knrCode: "ES-POM-006", laborNorm: 0.20, unit: "szt",
    description: "Pomiar ciągłości przewodów ochronnych", materialPrice: 0 },
  { pattern: /\b(?:protokó[lł]|protokol)\s+(?:ko[nń]cow|odbiorow|pomiar|elektryczn|powykonaw)/i,
    knrCode: "ES-POM-099", laborNorm: 1.50, unit: "kpl",
    description: "Protokół końcowy z pomiarów elektrycznych", materialPrice: 0 },

  // ── SSP / DSO ROZSZERZENIE (KNR 5-09 06xx) ──
  { pattern: /\bcentrala\s+(?:ssp|sygnaliz.*po[zż]arow|po[zż]arow|alarm.*po[zż]arow)/i,
    knrCode: "KNR 5-09 0610", laborNorm: 5.00, unit: "szt",
    description: "Centrala SSP (sygnalizacji pożarowej)", materialPrice: 3500.00 },
  { pattern: /\bmoduł\s+(?:kontroln|steruj|kontroln[\s-]?steruj)|\bmoduł\s+ks\b/i,
    knrCode: "KNR 5-09 0611", laborNorm: 1.20, unit: "szt",
    description: "Moduł kontrolno-sterujący SSP", materialPrice: 380.00 },
  { pattern: /\bczujk[ai]\s+(?:zalan|wody|wodn|wycieku|przeciek)/i,
    knrCode: "KNR 5-09 0612", laborNorm: 0.40, unit: "szt",
    description: "Czujka zalania / wycieku wody", materialPrice: 85.00 },
  // Note: czujka tlenku/CO already handled by line 305 dymu/CO pattern.
  // This entry covers gas leak detectors (metan/propan/LPG).
  { pattern: /\bczujk[ai]\s+(?:gazu|metanu|propan|wybuchowy|lpg)|\bdetektor\s+gazu\b/i,
    knrCode: "KNR 5-09 0613", laborNorm: 0.40, unit: "szt",
    description: "Czujka gazu (metan/propan/LPG)", materialPrice: 130.00 },

  // ── SSWiN / SYSTEMY ALARMOWE (KNR 5-09 062x) ──
  { pattern: /\bcentrala\s+(?:alarmow|sswin|w[lł]amaniow)/i,
    knrCode: "KNR 5-09 0620", laborNorm: 4.50, unit: "szt",
    description: "Centrala alarmowa SSWiN", materialPrice: 1200.00 },
  { pattern: /\b(?:kontaktron|czujk[ai]\s+magnetyczn|czujnik\s+otwarcia)/i,
    knrCode: "KNR 5-09 0621", laborNorm: 0.30, unit: "szt",
    description: "Czujka kontaktron magnetyczny", materialPrice: 35.00 },
  { pattern: /\b(?:manipulator|klawiatura)\s+(?:alarmow|sswin)|\bmanipulator\b/i,
    knrCode: "KNR 5-09 0622", laborNorm: 0.80, unit: "szt",
    description: "Manipulator / klawiatura SSWiN", materialPrice: 280.00 },
  { pattern: /\bsygnalizator\s+(?:alarmow|zewn[eę]trzn|sswin)/i,
    knrCode: "KNR 5-09 0623", laborNorm: 0.90, unit: "szt",
    description: "Sygnalizator alarmowy zewnętrzny", materialPrice: 320.00 },

  // ── UZIEMIENIE / OCHRONA ODGROMOWA (KNR 5-08 070x) ──
  { pattern: /\bbednarka\b|\b(?:fezn|fe[\s-]?zn)\s+(?:25|30)/i,
    knrCode: "KNR 5-08 0701", laborNorm: 0.45, unit: "mb",
    description: "Bednarka FeZn 25×4 — układanie w wykopie", materialPrice: 18.00 },
  { pattern: /\b(?:pr[eę]t\s+uziem|sonda\s+uziem|szpilka\s+uziem|elektroda\s+uziem)/i,
    knrCode: "KNR 5-08 0702", laborNorm: 1.50, unit: "szt",
    description: "Pręt uziemiający / sonda 1.5m", materialPrice: 65.00 },
  { pattern: /\bzł[aą]cze\s+kontroln|\bszpilka\s+kontroln|\bzwora\s+pomiarow/i,
    knrCode: "KNR 5-08 0703", laborNorm: 0.50, unit: "szt",
    description: "Złącze kontrolne uziemienia", materialPrice: 25.00 },

  // ═══ v2.8.0 MAX EXPANSION — 70+ entries: PV, EV, smart home, CCTV, klima ═══

  // ── KABLE DODATKOWE (OWY, LgY, NHXH, dzwonkowe) ──
  // OWY — kabel oponowy (gumowy) do użytku zewnętrznego/przenośnego
  { pattern: /\bowy\s*[2-5]\s*[x×*]\s*\d|\bh07rn[\s-]?f/i,
    knrCode: "KNR 5-08 0301", laborNorm: 0.18, unit: "mb",
    description: "Kabel OWY / H07RN-F (oponowy zewnętrzny)", materialPrice: 8.50 },
  // LgY — linka miedziana izolowana
  { pattern: /\blg[yż][\s.]*(?:zo)?\s*\d|\blinka\s+miedzian/i,
    knrCode: "KNR 5-08 0302", laborNorm: 0.10, unit: "mb",
    description: "Linka miedziana LgY/LgYzo", materialPrice: 3.50 },
  // NHXH / N2XH — kabel ognioodporny dla SSP/DSO
  { pattern: /\b(?:nhxh|n2xh|hdgs|hlgs|xztkmxpw)\b/i,
    knrCode: "KNR 5-12 0205", laborNorm: 0.16, unit: "mb",
    description: "Kabel ognioodporny NHXH / N2XH (SSP/DSO)", materialPrice: 12.00 },
  // Dzwonek / przycisk dzwonkowy
  { pattern: /\bdzwonek\s+(?:elektroniczn|przewodow|bezprzewod)|\bgong\s+drzwi/i,
    knrCode: "KNR 5-04 0610", laborNorm: 0.40, unit: "szt",
    description: "Dzwonek elektroniczny / gong", materialPrice: 65.00 },
  { pattern: /\bprzycisk\s+dzwonkow|\bprzycisk\s+drzwiow/i,
    knrCode: "KNR 5-04 0611", laborNorm: 0.20, unit: "szt",
    description: "Przycisk dzwonkowy", materialPrice: 22.00 },

  // ── WLZ / TABLICE / ZŁĄCZA POMIAROWE ──
  { pattern: /\b(?:zł[aą]cze\s+kablow|zk\s+przy[lł][aą]czeniow|s[lł]upek\s+(?:wlz|przy[lł][aą]czeniow))/i,
    knrCode: "KNR 5-08 0801", laborNorm: 4.50, unit: "szt",
    description: "Złącze kablowe / WLZ słupek przyłączeniowy", materialPrice: 850.00 },
  { pattern: /\btablica\s+(?:licznikow|tl\b)|\bzestaw\s+licznikow/i,
    knrCode: "KNR 5-08 0802", laborNorm: 3.80, unit: "szt",
    description: "Tablica licznikowa TL", materialPrice: 450.00 },
  { pattern: /\btablica\s+(?:gł[oó]wn|tg\b)|\bgłówn[ay]\s+rozdzielni/i,
    knrCode: "KNR 5-08 0803", laborNorm: 4.50, unit: "szt",
    description: "Tablica główna TG", materialPrice: 600.00 },
  { pattern: /\bskrzynka\s+(?:pomiarow|licznik)|\bobudowa\s+licznik/i,
    knrCode: "KNR 5-08 0804", laborNorm: 1.50, unit: "szt",
    description: "Skrzynka pomiarowa licznika", materialPrice: 220.00 },
  { pattern: /\bprzy[lł][aą]cze\s+(?:elektroenerg|napowietrz|kablow)/i,
    knrCode: "KNR 5-08 0805", laborNorm: 8.00, unit: "kpl",
    description: "Przyłącze elektroenergetyczne (kpl)", materialPrice: 0 },
  { pattern: /\bwlz\b|\bwewn[eę]trzn[ae]\s+lini[ae]\s+zasilaj/i,
    knrCode: "KNR 5-08 0806", laborNorm: 0.45, unit: "mb",
    description: "WLZ — wewnętrzna linia zasilająca", materialPrice: 22.00 },

  // ── FOTOWOLTAIKA / PV (ES-PV-xxx) ──
  // Panel PV nie koliduje z "Oprawa LED panel" (tamten wymaga 'oprawa' prefix)
  { pattern: /\bpanel\s+(?:fotowolt|pv|słonec|slonec)/i,
    knrCode: "ES-PV-001", laborNorm: 0.80, unit: "szt",
    description: "Panel fotowoltaiczny — montaż", materialPrice: 0 },
  { pattern: /\bkonstrukcj[ae]\s+(?:pv|fotowolt)|\b(?:rail|szyna)\s+(?:pv|fotowolt|monta[zż]ow)/i,
    knrCode: "ES-PV-002", laborNorm: 0.40, unit: "mb",
    description: "Konstrukcja montażowa PV (rail / szyna)", materialPrice: 35.00 },
  { pattern: /\b(?:hak|łapa|klamra|trzymak)\s+(?:pv|dachow|montażow)|\bzaczep\s+pv/i,
    knrCode: "ES-PV-003", laborNorm: 0.30, unit: "szt",
    description: "Hak / klamra montażowa PV", materialPrice: 18.00 },
  // Inwerter 3-faz BEFORE 1-faz (more specific keywords first).
  // Use .* between 'inwerter' and faz keyword — model name / kW often appear between.
  // No trailing \b after Polish stem 'faz' — 'fazowy/fazowa' suffix would block boundary.
  { pattern: /\binwerter\b.*\b(?:3[\s-]?faz|trójfaz|trojfaz|\b3p\b)/i,
    knrCode: "ES-PV-010", laborNorm: 4.50, unit: "szt",
    description: "Inwerter PV 3-fazowy (string)", materialPrice: 0 },
  { pattern: /\binwerter\b.*\b(?:1[\s-]?faz|jednofaz|hybryd|\b1p\b)/i,
    knrCode: "ES-PV-011", laborNorm: 3.50, unit: "szt",
    description: "Inwerter PV 1-fazowy / hybrydowy", materialPrice: 0 },
  { pattern: /\binwerter\b|\bfalownik\s+pv/i,
    knrCode: "ES-PV-010", laborNorm: 4.00, unit: "szt",
    description: "Inwerter PV (generic)", materialPrice: 0 },
  { pattern: /\boptymalizator\s+(?:mocy|pv)|\b(?:tigo|solaredge)\s+optymaliz/i,
    knrCode: "ES-PV-012", laborNorm: 0.45, unit: "szt",
    description: "Optymalizator mocy PV", materialPrice: 320.00 },
  { pattern: /\bmikroinwerter|\bmikro[\s-]inwerter/i,
    knrCode: "ES-PV-013", laborNorm: 0.55, unit: "szt",
    description: "Mikroinwerter PV", materialPrice: 480.00 },
  // Kabel solarny PV1-F: specific (4mm/6mm) BEFORE generic
  { pattern: /\b(?:kabel|przewód)\s+(?:solarn|pv1[\s-]?f|fotowolt).*\b6(?:[,.]0)?(?:\s*mm)?/i,
    knrCode: "ES-PV-021", laborNorm: 0.12, unit: "mb",
    description: "Kabel solarny PV1-F 6 mm²", materialPrice: 6.20 },
  { pattern: /\b(?:kabel|przewód)\s+(?:solarn|pv1[\s-]?f|fotowolt).*\b4(?:[,.]0)?(?:\s*mm)?/i,
    knrCode: "ES-PV-020", laborNorm: 0.10, unit: "mb",
    description: "Kabel solarny PV1-F 4 mm²", materialPrice: 4.50 },
  { pattern: /\b(?:kabel|przewód)\s+(?:solarn|pv1[\s-]?f|fotowolt)/i,
    knrCode: "ES-PV-020", laborNorm: 0.10, unit: "mb",
    description: "Kabel solarny PV1-F (generic)", materialPrice: 4.50 },
  { pattern: /\b(?:konektor|złącze|wtyk)\s+mc4|\bmc4\s+(?:kompletn|zarobi|wykonan|para)/i,
    knrCode: "ES-PV-022", laborNorm: 0.15, unit: "szt",
    description: "Konektor MC4 — zarobienie złącza", materialPrice: 12.00 },
  { pattern: /\broz[lł][aą]cznik\s+(?:dc|po[zż]arow|pv)|\bwy[lł][aą]cznik\s+po[zż]arow.*pv/i,
    knrCode: "ES-PV-023", laborNorm: 0.55, unit: "szt",
    description: "Rozłącznik DC pożarowy PV", materialPrice: 280.00 },
  { pattern: /\bogranicznik\s+(?:dc|przep[ię][eę]ci.*dc|spd.*dc|t1\+t2.*dc)/i,
    knrCode: "ES-PV-024", laborNorm: 0.55, unit: "szt",
    description: "Ogranicznik przepięć DC T1+T2", materialPrice: 320.00 },
  { pattern: /\b(?:smart\s*meter|licznik\s+dwukierunk|opomiarowanie\s+pv)/i,
    knrCode: "ES-PV-030", laborNorm: 1.20, unit: "szt",
    description: "Smart meter / licznik dwukierunkowy PV", materialPrice: 280.00 },
  { pattern: /\b(?:magazyn\s+energii|battery|akumulator)\s+(?:pv|fotowolt|li|domow|tesla|powerwall)/i,
    knrCode: "ES-PV-040", laborNorm: 6.00, unit: "kpl",
    description: "Magazyn energii (bateria) — montaż", materialPrice: 0 },
  { pattern: /\bstring\s*box|\bskrzynka\s+pv\b|\b(?:rozdzielnica|tablica)\s+pv/i,
    knrCode: "ES-PV-050", laborNorm: 1.80, unit: "szt",
    description: "String box / rozdzielnica PV DC", materialPrice: 480.00 },

  // ── EV / WALLBOX / STACJE ŁADOWANIA (ES-EV-xxx) ──
  { pattern: /\bwallbox\s*(?:22|22\s*kw)|\b(?:stacja|punkt)\s+ładowania.*22\s*kw/i,
    knrCode: "ES-EV-002", laborNorm: 3.00, unit: "szt",
    description: "Wallbox AC 22kW (3-faz) — montaż", materialPrice: 0 },
  { pattern: /\bwallbox|\b(?:stacja|punkt)\s+ładowania\s+(?:ev|pojazd|elektr)|\bcharger\s+(?:ac|ev)/i,
    knrCode: "ES-EV-001", laborNorm: 2.50, unit: "szt",
    description: "Wallbox AC 11kW — montaż", materialPrice: 0 },
  { pattern: /\bstacja\s+(?:dc\s+szybk|szybkiego\s+ładowania|fast\s+charg)/i,
    knrCode: "ES-EV-010", laborNorm: 8.00, unit: "szt",
    description: "Stacja DC szybkiego ładowania", materialPrice: 0 },

  // ── OGRZEWANIE PRZEPONOWE / WENTYLACJA (ES-OGR-xxx) ──
  { pattern: /\bmata\s+grzewcz/i,
    knrCode: "ES-OGR-001", laborNorm: 0.65, unit: "m2",
    description: "Mata grzewcza podłogowa", materialPrice: 95.00 },
  { pattern: /\b(?:kabel|przewód)\s+grzewcz/i,
    knrCode: "ES-OGR-002", laborNorm: 0.20, unit: "mb",
    description: "Kabel grzewczy podłogowy", materialPrice: 18.00 },
  { pattern: /\bfolia\s+grzewcz/i,
    knrCode: "ES-OGR-003", laborNorm: 0.55, unit: "m2",
    description: "Folia grzewcza ścienna / sufitowa", materialPrice: 75.00 },
  { pattern: /\brekuperator|\bcentrala\s+wentylacyjn|\bwentylacja\s+mechaniczna\s+z\s+rekup/i,
    knrCode: "ES-OGR-010", laborNorm: 6.00, unit: "kpl",
    description: "Rekuperator — montaż + sterowanie (kpl)", materialPrice: 0 },
  { pattern: /\b(?:wentylator|wywietrznik)\s+(?:łazienkow|kuchen|kanal|sufit|ścienn)/i,
    knrCode: "ES-OGR-020", laborNorm: 0.55, unit: "szt",
    description: "Wentylator łazienkowy / kuchenny / kanałowy", materialPrice: 65.00 },

  // ── SMART HOME / KNX / DALI (ES-SMART-xxx) ──
  { pattern: /\b(?:moduł|aktor|bramka)\s+knx|\bknx\s+(?:moduł|aktor|bramka|i\/o|wej[śs]cia)/i,
    knrCode: "ES-SMART-001", laborNorm: 0.85, unit: "szt",
    description: "Moduł / aktor KNX", materialPrice: 280.00 },
  { pattern: /\bczujnik\s+knx|\bknx\s+czujnik/i,
    knrCode: "ES-SMART-002", laborNorm: 0.55, unit: "szt",
    description: "Czujnik KNX (temp / ruchu / wilgoci)", materialPrice: 220.00 },
  { pattern: /\bzasilacz\s+knx|\bknx\s+(?:zasilacz|psu|640ma)/i,
    knrCode: "ES-SMART-003", laborNorm: 0.75, unit: "szt",
    description: "Zasilacz magistrali KNX", materialPrice: 320.00 },
  { pattern: /\bdali\s+(?:driver|aktor|moduł|interfejs|sterow)|\bsterow.*dali\b/i,
    knrCode: "ES-SMART-010", laborNorm: 0.40, unit: "szt",
    description: "Driver / aktor DALI", materialPrice: 180.00 },
  { pattern: /\b(?:bramka|hub|gateway)\s+(?:smart|home|zigbee|z[\s-]?wave|matter)/i,
    knrCode: "ES-SMART-020", laborNorm: 0.45, unit: "szt",
    description: "Bramka smart home (HUB)", materialPrice: 280.00 },
  { pattern: /\b(?:przekaznik|aktor|przełącznik)\s+(?:smart|zigbee|z[\s-]?wave|wi[\s-]?fi|matter)/i,
    knrCode: "ES-SMART-021", laborNorm: 0.50, unit: "szt",
    description: "Inteligentny przełącznik / przekaznik (smart)", materialPrice: 95.00 },

  // ── ŚWIATŁOWODY / SIEĆ / RACK (ES-FO-xxx) ──
  { pattern: /\b(?:kabel|przewód)\s+(?:światłowodow|fo\b|swiatlowod|fiber)/i,
    knrCode: "ES-FO-001", laborNorm: 0.18, unit: "mb",
    description: "Kabel światłowodowy", materialPrice: 8.00 },
  { pattern: /\bspaw(?:anie)?\s+(?:światłowod|fo|fiber)|\bzgrzew.*światłowod/i,
    knrCode: "ES-FO-002", laborNorm: 0.60, unit: "szt",
    description: "Spawanie światłowodu (per spaw)", materialPrice: 0 },
  // Patch panel: specific (24/48) BEFORE generic
  { pattern: /\bpatch[\s-]?panel\s*(?:48|48[\s-]?port)/i,
    knrCode: "ES-FO-011", laborNorm: 1.50, unit: "szt",
    description: "Patch panel 48-portowy", materialPrice: 480.00 },
  { pattern: /\bpatch[\s-]?panel\s*(?:24|24[\s-]?port)/i,
    knrCode: "ES-FO-010", laborNorm: 1.20, unit: "szt",
    description: "Patch panel 24-portowy", materialPrice: 280.00 },
  { pattern: /\bpatch[\s-]?panel\b/i,
    knrCode: "ES-FO-010", laborNorm: 1.20, unit: "szt",
    description: "Patch panel (generic)", materialPrice: 280.00 },
  { pattern: /\b(?:switch|przełącznik)\s+(?:sieciow|gigabit|24[\s-]?port|48[\s-]?port|poe)/i,
    knrCode: "ES-FO-020", laborNorm: 0.85, unit: "szt",
    description: "Switch sieciowy 24/48-port", materialPrice: 0 },
  { pattern: /\bszafa\s+(?:rack|serwerow|teleinform)|\brack\s+19/i,
    knrCode: "ES-FO-030", laborNorm: 4.50, unit: "szt",
    description: "Szafa rack 19'' — montaż", materialPrice: 0 },
  { pattern: /\b(?:ont|onu)\s+(?:gpon|światłowodow|huawei)|\bmodem\s+światłowod/i,
    knrCode: "ES-FO-040", laborNorm: 0.55, unit: "szt",
    description: "ONT światłowodowy (terminal)", materialPrice: 0 },

  // ── CCTV / MONITORING (ES-CCTV-xxx) ──
  { pattern: /\bkamera\s+(?:ip|cctv|zewn|kopułow|kopulow|tubow|bullet|obrotow|ptz)/i,
    knrCode: "ES-CCTV-001", laborNorm: 1.20, unit: "szt",
    description: "Kamera IP CCTV — montaż", materialPrice: 350.00 },
  { pattern: /\b(?:rejestrator|nvr|dvr)\s*(?:8|16|32)?[\s-]?kana[lł]|\b(?:nvr|dvr)\b/i,
    knrCode: "ES-CCTV-010", laborNorm: 1.50, unit: "szt",
    description: "Rejestrator NVR / DVR", materialPrice: 0 },
  // Czujka PIR zewnętrzna (alarmowa, IP66) — często myli się z czujnikiem ruchu
  // wewnętrznym (sterowanie oświetleniem). Wymagamy 'zewn' / 'alarm' / 'sswin'.
  { pattern: /\bczujka\s+(?:pir\s+zewn|zewn[\s.]\s*pir|alarm.*pir|pir\s+sswin|pir\s+ip6)/i,
    knrCode: "ES-CCTV-020", laborNorm: 0.55, unit: "szt",
    description: "Czujka PIR zewnętrzna alarmowa", materialPrice: 130.00 },
  { pattern: /\bbariera\s+(?:podczerw|aktywn|alarm|fotoelektr)/i,
    knrCode: "ES-CCTV-021", laborNorm: 1.20, unit: "szt",
    description: "Bariera podczerwona alarmowa", materialPrice: 280.00 },
  { pattern: /\bczujka\s+(?:tłucz|zbicia|szyby|wibracj)/i,
    knrCode: "ES-CCTV-022", laborNorm: 0.40, unit: "szt",
    description: "Czujka tłuczenia szyby", materialPrice: 95.00 },

  // ── BIURO / KOMERCJA (ES-BIU-xxx) ──
  // Note: 'Oprawa biurowa' moved up to oprawy section (before generic fallback).
  { pattern: /\b(?:floorbox|floor[\s-]?box|kaseta\s+podłogow|puszka\s+podłogow)/i,
    knrCode: "ES-BIU-001", laborNorm: 1.80, unit: "szt",
    description: "Floorbox / kaseta podłogowa", materialPrice: 380.00 },
  { pattern: /\bups\b|\bzasilacz\s+(?:awaryjn|bezprzerw)|\b(?:no[\s-]?break)\b/i,
    knrCode: "ES-BIU-020", laborNorm: 1.50, unit: "szt",
    description: "UPS / zasilacz awaryjny — montaż", materialPrice: 0 },
  { pattern: /\btablica\s+(?:rozdzielcz|pi[eę]trow|tr\b|tt\b)|\brozdzielnia\s+pi[eę]trow/i,
    knrCode: "ES-BIU-030", laborNorm: 5.50, unit: "szt",
    description: "Tablica rozdzielcza piętrowa TR/TT", materialPrice: 0 },

  // ── KLIMATYZACJA (ES-KLIM-xxx) ──
  // Jednostka zewn BEFORE jednostka wewn (specific keyword first)
  { pattern: /\bklimatyzator\s+(?:zewn|jednost.*zewn|jedn[\s.]\s*zewn)|\bagregat\s+(?:klima|chillera)/i,
    knrCode: "ES-KLIM-001", laborNorm: 2.50, unit: "szt",
    description: "Klimatyzator split — jednostka zewnętrzna", materialPrice: 0 },
  { pattern: /\bklimatyzator|\b(?:split|multi[\s-]?split|fan[\s-]?coil|fancoil)\b/i,
    knrCode: "ES-KLIM-002", laborNorm: 1.80, unit: "szt",
    description: "Klimatyzator split — jednostka wewnętrzna", materialPrice: 0 },
  { pattern: /\bsterownik\s+klima|\bpilot\s+(?:klima|przewodow|naczynkow)/i,
    knrCode: "ES-KLIM-010", laborNorm: 0.50, unit: "szt",
    description: "Sterownik / pilot klimatyzacji", materialPrice: 95.00 },

  // ── OUTDOOR LAMPY ZEWN (uzupełnienie KNR 5-04 0303-2x) ──
  // Note: 'Reflektor architektoniczny' + 'Lampa parkowa' moved up to oprawy section.
  { pattern: /\biluminacj[aą]\s+(?:led|elewac|świąteczn)|\boświetleni[ae]\s+(?:elewacyjn|fasadow|nastrojow)/i,
    knrCode: "KNR 5-04 0303-27", laborNorm: 1.80, unit: "kpl",
    description: "Iluminacja / oświetlenie elewacji LED", materialPrice: 0 },

  // ── POMIARY ROZSZERZONE II (ES-POM-007..010) ──
  { pattern: /\bpomiar\s+(?:napi[eę]ci|napiec|parametr.*sieci|jako[śs]ci\s+ene)/i,
    knrCode: "ES-POM-007", laborNorm: 0.30, unit: "szt",
    description: "Pomiar napięcia / parametrów sieci", materialPrice: 0 },
  { pattern: /\binspekcja\s+termowizyjn|\btermowizyjn.*pomiar|\btermowizja/i,
    knrCode: "ES-POM-008", laborNorm: 0.50, unit: "szt",
    description: "Inspekcja termowizyjna", materialPrice: 0 },
  { pattern: /\bpomiar.*1000\s*v|\b(?:opor|izolac).*1000\s*v/i,
    knrCode: "ES-POM-009", laborNorm: 0.40, unit: "szt",
    description: "Pomiar oporu izolacji 1000V (przemysł)", materialPrice: 0 },

  // ── ROBOTY POMOCNICZE II (rurki / taśmy) ──
  { pattern: /\b(?:rurka|rura)\s+(?:karbowan|ognioodporn|rvs|rvks)|\bpeszel\s+(?:karbowan|ognioodporn)/i,
    knrCode: "KNR 5-08 0510", laborNorm: 0.18, unit: "mb",
    description: "Rurka karbowana / peszel ognioodporny", materialPrice: 8.00 },
  { pattern: /\btaśma\s+(?:ostrzegawcz|sygnaliz|kablow\s+ostrzeg)/i,
    knrCode: "KNR 5-08 0520", laborNorm: 0.05, unit: "mb",
    description: "Taśma ostrzegawcza w wykopie", materialPrice: 1.50 },

  // ── STYCZNIK MOCY / FALOWNIK / SILNIK (ES-STY/PRZ-xxx) ──
  // "Stycznik mocy" wymaga 'mocy/duży/3-faz' — nie koliduje z istniejącym
  // "Stycznik modułowy" (linia 188) który wymaga modulow/3-pol/4-pol/szynow.
  { pattern: /\bstycznik\s+(?:mocy|du[zż]y|mocow|pr[aą]du)|\bstycznik\b.*\b(?:25a|40a|63a|100a|160a)\b/i,
    knrCode: "ES-STY-001", laborNorm: 0.85, unit: "szt",
    description: "Stycznik mocy 25-160A", materialPrice: 280.00 },
  { pattern: /\bfalownik\b|\bvfd\b|\bprzemiennik\s+cz[eę]stotliwośc/i,
    knrCode: "ES-PRZ-001", laborNorm: 2.50, unit: "szt",
    description: "Falownik / przemiennik częstotliwości", materialPrice: 0 },
  { pattern: /\bsilnik\s+(?:elektryczn|asynchron|3[\s-]?faz|1[\s-]?faz).*monta[zż]|\bmonta[zż]\s+silnik/i,
    knrCode: "ES-PRZ-010", laborNorm: 3.50, unit: "szt",
    description: "Silnik elektryczny — montaż", materialPrice: 0 },

  // ── ROLETY / BRAMY / NAPĘDY (ES-NAP-xxx) ──
  { pattern: /\b(?:nap[eę]d|silnik)\s+(?:bramy\s+gara[zż]|gara[zż]ow|przesuwn|skrzyd[lł]ow)/i,
    knrCode: "ES-NAP-001", laborNorm: 3.50, unit: "szt",
    description: "Napęd bramy garażowej / skrzydłowej", materialPrice: 0 },
  { pattern: /\b(?:silnik|nap[eę]d)\s+(?:rolet|markiz|żaluzj)|\brolet[aą]\s+elektryczn/i,
    knrCode: "ES-NAP-010", laborNorm: 0.85, unit: "szt",
    description: "Silnik / napęd rolety / markizy", materialPrice: 0 },
  { pattern: /\belektrozaczep\b|\b(?:rygiel|zamek)\s+elektryczn/i,
    knrCode: "ES-NAP-020", laborNorm: 0.65, unit: "szt",
    description: "Elektrozaczep / rygiel elektryczny", materialPrice: 95.00 },

  // ── KABLE ALUMINIOWE (ASXSN / YAKY / ALmYn) — hale, WLZ zewnętrzne ──
  // ASXSN = aluminium + żyła stalowa koncentryczna (outdoor/underground)
  { pattern: /\b(?:asxsn|ymaly|yaky|almyn|alxsn|alfyn)\b.*\b(?:4|5)\s*[x×*]\s*(?:16|25)\b/i,
    knrCode: "KNR 5-10 0401", laborNorm: 0.22, unit: "mb",
    description: "Kabel Al 4×16 / 4×25 mm² układany", materialPrice: 14.00 },
  { pattern: /\b(?:asxsn|ymaly|yaky|almyn|alxsn|alfyn)\b.*\b(?:4|5)\s*[x×*]\s*(?:35|50)\b/i,
    knrCode: "KNR 5-10 0402", laborNorm: 0.30, unit: "mb",
    description: "Kabel Al 4×35 / 4×50 mm² układany", materialPrice: 25.00 },
  { pattern: /\b(?:asxsn|ymaly|yaky|almyn|alxsn|alfyn)\b.*\b(?:4|5)\s*[x×*]\s*(?:70|95)\b/i,
    knrCode: "KNR 5-10 0403", laborNorm: 0.45, unit: "mb",
    description: "Kabel Al 4×70 / 4×95 mm² układany", materialPrice: 40.00 },
  { pattern: /\b(?:asxsn|ymaly|yaky|almyn|alxsn|alfyn)\b.*\b(?:4|5)\s*[x×*]\s*(?:120|150|185)\b/i,
    knrCode: "KNR 5-10 0404", laborNorm: 0.60, unit: "mb",
    description: "Kabel Al 4×120–185 mm² układany", materialPrice: 60.00 },
  { pattern: /\b(?:asxsn|ymaly|yaky|almyn|alxsn|alfyn)\b.*\b(?:4|5)\s*[x×*]\s*(?:240|300)\b/i,
    knrCode: "KNR 5-10 0405", laborNorm: 0.80, unit: "mb",
    description: "Kabel Al 4×240 / 4×300 mm² układany", materialPrice: 85.00 },
  { pattern: /\b(?:asxsn|ymaly|yaky|almyn|alxsn|alfyn)\b/i,
    knrCode: "KNR 5-10 0401", laborNorm: 0.22, unit: "mb",
    description: "Kabel aluminiowy (generic)" },

  // ── SZYNOPRZEWÓD / BUSDUCT — hale przemysłowe (ES-IND-xxx) ──
  { pattern: /\bszynoprzew[oó]d\b.*\b(?:100|160|250)\s*a\b/i,
    knrCode: "ES-IND-001", laborNorm: 0.60, unit: "mb",
    description: "Szynoprzewód do 250A", materialPrice: 0 },
  { pattern: /\bszynoprzew[oó]d\b.*\b(?:400|630)\s*a\b/i,
    knrCode: "ES-IND-002", laborNorm: 0.90, unit: "mb",
    description: "Szynoprzewód 400–630A", materialPrice: 0 },
  { pattern: /\bszynoprzew[oó]d\b.*\b(?:800|1000|1250|1600)\s*a\b/i,
    knrCode: "ES-IND-003", laborNorm: 1.30, unit: "mb",
    description: "Szynoprzewód 800–1600A (wielkoprzemysłowy)", materialPrice: 0 },
  { pattern: /\bszynoprzew[oó]d\b/i,
    knrCode: "ES-IND-001", laborNorm: 0.75, unit: "mb",
    description: "Szynoprzewód (generic)", materialPrice: 0 },

  // ── RURY INSTALACYJNE STALOWE (KNR 5-08 0511..0513) ──
  { pattern: /\brur[ak]\s+(?:stalo|rst\b|psl\b)|\brst\s+(?:m?g?\d|instal)/i,
    knrCode: "KNR 5-08 0511", laborNorm: 0.30, unit: "mb",
    description: "Rura stalowa RST / instalacyjna", materialPrice: 18.00 },
  { pattern: /\brur[ak]\s+(?:hdpe|pvc\s+kabel|dvk\b|rde\b|ekd\b)/i,
    knrCode: "KNR 5-08 0512", laborNorm: 0.15, unit: "mb",
    description: "Rura PVC kablowa / HDPE", materialPrice: 8.00 },

  // ── POMPA CIEPŁA — podłączenie elektryczne (ES-HVAC-xxx) ──
  { pattern: /\b(?:pod[lł][aą]cz|zasilanie|obw[oó]d)\s+(?:pompy?|pc)\s+ciep[lł]|pompa\s+ciep[lł].*pod[lł][aą]cz/i,
    knrCode: "ES-HVAC-001", laborNorm: 4.50, unit: "kpl",
    description: "Podłączenie elektryczne pompy ciepła (kpl)", materialPrice: 0 },
  { pattern: /\bpompa\s+ciep[lł]/i,
    knrCode: "ES-HVAC-001", laborNorm: 4.50, unit: "kpl",
    description: "Pompa ciepła — elektryka (kpl)", materialPrice: 0 },

  // ── KABEL DOZIEMNY / ZBROJONY (YKXs / YAKXS) — układanie w ziemi ──
  { pattern: /\b(?:ykxs|yakxs|xruhakxs|kabel\s+doziem|kabel\s+ziemn)/i,
    knrCode: "ES-IND-010", laborNorm: 0.25, unit: "mb",
    description: "Kabel doziemny / ziemny (bez wykopów)", materialPrice: 0 },

  // ── AGREGAT PRĄDOTWÓRCZY (ES-AGR-xxx) ──
  { pattern: /\bagregat\s+(?:pr[aą]dotw[oó]rczy|pr[aą]dotw|generator|dieslowy|benzynowy)/i,
    knrCode: "ES-AGR-001", laborNorm: 6.00, unit: "szt",
    description: "Agregat prądotwórczy — montaż + podłączenie", materialPrice: 0 },
  { pattern: /\bats\b|\b(?:automatyczny?|auto)\s+przełącznik\s+(?:zasilani|rezerw)|\bszafa\s+(?:ats|szs)\b/i,
    knrCode: "ES-AGR-002", laborNorm: 2.50, unit: "szt",
    description: "Szafa ATS / automatyczny przełącznik zasilania", materialPrice: 0 },
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
