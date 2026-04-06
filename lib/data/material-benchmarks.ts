/**
 * material-benchmarks.ts
 *
 * Real wholesale electrical material prices — Polish market 2026 (netto PLN).
 * Sources: Elektroskandia, TIM SA, Keno, hurtownie.elektryczne.pl, ceneo.pl B2B.
 * Updated: Q1/2026. Prices are WHOLESALE NETTO (bez VAT).
 *
 * Usage:
 *   - Task3 AI material fallback: clamp AI-guessed prices to realistic ranges
 *   - L3 prompt: inject price references so Gemini returns accurate estimates
 *   - UI: show price confidence ("KNR" vs "~Rynk." vs "AI")
 *
 * Structure:
 *   Each entry has: keywords (for fuzzy match), unit, min/avg/max prices,
 *   and optional spec (cross-section, brand family) for precise matching.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface MaterialBenchmark {
  /** Category for grouping */
  category: MaterialCategory;
  /** Keywords for matching (all must be present in item name, lowercase) */
  keywords: string[];
  /** Unit of measure */
  unit: string;
  /** Minimum wholesale price (PLN netto) */
  min: number;
  /** Average wholesale price (PLN netto) — use as default suggestion */
  avg: number;
  /** Maximum reasonable wholesale price (PLN netto) */
  max: number;
  /** Optional: specific cable cross-section regex for precise matching */
  specPattern?: RegExp;
}

export type MaterialCategory =
  | "kable_instalacyjne"    // YDYp, YDY, YKYżo
  | "kable_zasilajace"      // YKY, WLZ, YAKY
  | "kable_sygnalowe"       // UTP, FTP, YTDY, YnTKSY
  | "kable_specjalne"       // H07V, LgY, NHXH, solar
  | "osprzet_elektroinstalacyjny" // gniazda, łączniki, puszki
  | "aparatura_modulowa"    // MCB, RCD, RCBO, rozłączniki
  | "rozdzielnice"          // obudowy natynkowe/podtynkowe
  | "oprawy_oswietleniowe"  // LED, downlight, panel, oprawa
  | "trasy_kablowe"         // korytka, drabinki, rury, peszle
  | "ochrona_przepieciowa"  // SPD, ograniczniki
  | "automatyka"            // styczniki, przekaźniki, timery
  | "pomiary_ochrona"       // uziemienie, odgromniki
  | "fotowoltaika"          // panele PV, falowniki, optymalizatory
  | "materialy_montazowe"   // dławnice, złączki, WAGO, taśmy
  | "smart_home"            // KNX, DALI, czujniki
  | "zasilanie_awaryjne"   // UPS, baterie, agregaty
  | "ladowarki_ev"          // wallbox, kable ładowania
  | "pomiary_liczniki"      // liczniki, przekładniki, analizatory
  | "ogrzewanie_elektryczne" // maty grzewcze, kable grzejne, termostaty
  | "przepusty_ppoz";       // przepusty ogniowe, masy ogniochronne

// ─── Benchmark Database ─────────────────────────────────────────────────────────

export const MATERIAL_BENCHMARKS: MaterialBenchmark[] = [
  // ═══════════════════════════════════════════════════════════════════
  // KABLE INSTALACYJNE (YDYp, YDY — mieszkaniowe)
  // ═══════════════════════════════════════════════════════════════════
  { category: "kable_instalacyjne", keywords: ["ydyp", "3x1,5"], unit: "mb", min: 3.80, avg: 5.20, max: 7.50 },
  { category: "kable_instalacyjne", keywords: ["ydyp", "3x1.5"], unit: "mb", min: 3.80, avg: 5.20, max: 7.50 },
  { category: "kable_instalacyjne", keywords: ["ydyp", "3x2,5"], unit: "mb", min: 5.50, avg: 7.20, max: 10.00 },
  { category: "kable_instalacyjne", keywords: ["ydyp", "3x2.5"], unit: "mb", min: 5.50, avg: 7.20, max: 10.00 },
  { category: "kable_instalacyjne", keywords: ["ydyp", "4x1,5"], unit: "mb", min: 5.00, avg: 6.80, max: 9.50 },
  { category: "kable_instalacyjne", keywords: ["ydyp", "4x1.5"], unit: "mb", min: 5.00, avg: 6.80, max: 9.50 },
  { category: "kable_instalacyjne", keywords: ["ydyp", "5x1,5"], unit: "mb", min: 6.50, avg: 8.50, max: 12.00 },
  { category: "kable_instalacyjne", keywords: ["ydyp", "5x2,5"], unit: "mb", min: 9.50, avg: 12.80, max: 17.00 },
  { category: "kable_instalacyjne", keywords: ["ydyp", "5x2.5"], unit: "mb", min: 9.50, avg: 12.80, max: 17.00 },
  { category: "kable_instalacyjne", keywords: ["ydy", "3x1,5"], unit: "mb", min: 4.00, avg: 5.50, max: 8.00 },
  { category: "kable_instalacyjne", keywords: ["ydy", "3x2,5"], unit: "mb", min: 6.00, avg: 7.80, max: 11.00 },
  { category: "kable_instalacyjne", keywords: ["ydy", "3x4"], unit: "mb", min: 9.00, avg: 12.00, max: 16.00 },
  { category: "kable_instalacyjne", keywords: ["ydy", "3x6"], unit: "mb", min: 13.00, avg: 17.00, max: 23.00 },
  { category: "kable_instalacyjne", keywords: ["ydy", "5x4"], unit: "mb", min: 14.00, avg: 18.50, max: 25.00 },
  { category: "kable_instalacyjne", keywords: ["ydy", "5x6"], unit: "mb", min: 20.00, avg: 26.00, max: 35.00 },

  // ═══════════════════════════════════════════════════════════════════
  // KABLE ZASILAJĄCE (YKY, WLZ, YAKY — ziemne, zasilające)
  // ═══════════════════════════════════════════════════════════════════
  { category: "kable_zasilajace", keywords: ["yky", "3x2,5"], unit: "mb", min: 7.00, avg: 9.50, max: 13.00 },
  { category: "kable_zasilajace", keywords: ["yky", "3x4"], unit: "mb", min: 10.00, avg: 13.00, max: 18.00 },
  { category: "kable_zasilajace", keywords: ["yky", "3x6"], unit: "mb", min: 14.00, avg: 18.00, max: 24.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x4"], unit: "mb", min: 15.00, avg: 20.00, max: 27.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x6"], unit: "mb", min: 22.00, avg: 28.00, max: 38.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x10"], unit: "mb", min: 35.00, avg: 42.00, max: 55.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x16"], unit: "mb", min: 52.00, avg: 65.00, max: 82.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x25"], unit: "mb", min: 80.00, avg: 98.00, max: 125.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x35"], unit: "mb", min: 110.00, avg: 135.00, max: 170.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x50"], unit: "mb", min: 155.00, avg: 190.00, max: 240.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x70"], unit: "mb", min: 220.00, avg: 265.00, max: 330.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x95"], unit: "mb", min: 310.00, avg: 370.00, max: 450.00 },
  { category: "kable_zasilajace", keywords: ["yky", "5x120"], unit: "mb", min: 390.00, avg: 460.00, max: 560.00 },
  // YKYżo (okrągły)
  { category: "kable_zasilajace", keywords: ["ykyżo", "3x2,5"], unit: "mb", min: 10.00, avg: 14.00, max: 19.00 },
  { category: "kable_zasilajace", keywords: ["ykyżo", "3x4"], unit: "mb", min: 15.00, avg: 19.50, max: 26.00 },
  { category: "kable_zasilajace", keywords: ["ykyżo", "5x10"], unit: "mb", min: 42.00, avg: 52.00, max: 65.00 },
  // YAKY (aluminiowe)
  { category: "kable_zasilajace", keywords: ["yaky", "4x35"], unit: "mb", min: 22.00, avg: 28.00, max: 36.00 },
  { category: "kable_zasilajace", keywords: ["yaky", "4x70"], unit: "mb", min: 38.00, avg: 48.00, max: 62.00 },
  { category: "kable_zasilajace", keywords: ["yaky", "4x120"], unit: "mb", min: 55.00, avg: 70.00, max: 90.00 },
  { category: "kable_zasilajace", keywords: ["yaky", "4x240"], unit: "mb", min: 95.00, avg: 120.00, max: 155.00 },

  // ═══════════════════════════════════════════════════════════════════
  // KABLE SYGNAŁOWE
  // ═══════════════════════════════════════════════════════════════════
  { category: "kable_sygnalowe", keywords: ["utp", "kat", "5e"], unit: "mb", min: 2.00, avg: 3.00, max: 5.00 },
  { category: "kable_sygnalowe", keywords: ["utp", "kat", "6"], unit: "mb", min: 3.00, avg: 4.20, max: 6.50 },
  { category: "kable_sygnalowe", keywords: ["ftp", "kat", "6"], unit: "mb", min: 4.50, avg: 6.00, max: 8.50 },
  { category: "kable_sygnalowe", keywords: ["ytdy", "2x0,5"], unit: "mb", min: 1.20, avg: 1.80, max: 3.00 },
  { category: "kable_sygnalowe", keywords: ["ytdy", "4x0,5"], unit: "mb", min: 1.80, avg: 2.50, max: 4.00 },
  { category: "kable_sygnalowe", keywords: ["yntks", "2x0,8"], unit: "mb", min: 2.00, avg: 3.20, max: 5.00 },
  { category: "kable_sygnalowe", keywords: ["yntks", "5x2x0,8"], unit: "mb", min: 6.00, avg: 8.50, max: 12.00 },

  // ═══════════════════════════════════════════════════════════════════
  // KABLE SPECJALNE (H07V, LgY, NHXH, solarny)
  // ═══════════════════════════════════════════════════════════════════
  { category: "kable_specjalne", keywords: ["lgy", "1x1,5"], unit: "mb", min: 1.50, avg: 2.20, max: 3.50 },
  { category: "kable_specjalne", keywords: ["lgy", "1x2,5"], unit: "mb", min: 2.00, avg: 3.00, max: 4.50 },
  { category: "kable_specjalne", keywords: ["lgy", "1x6"], unit: "mb", min: 4.50, avg: 6.50, max: 9.00 },
  { category: "kable_specjalne", keywords: ["lgy", "1x10"], unit: "mb", min: 7.50, avg: 10.00, max: 14.00 },
  { category: "kable_specjalne", keywords: ["lgy", "1x16"], unit: "mb", min: 11.00, avg: 15.00, max: 20.00 },
  { category: "kable_specjalne", keywords: ["lgy", "1x35"], unit: "mb", min: 22.00, avg: 30.00, max: 40.00 },
  { category: "kable_specjalne", keywords: ["h1z2z2"], unit: "mb", min: 3.50, avg: 5.00, max: 7.50 },
  { category: "kable_specjalne", keywords: ["kabel", "solar"], unit: "mb", min: 3.50, avg: 5.00, max: 7.50 },
  { category: "kable_specjalne", keywords: ["nhxh"], unit: "mb", min: 12.00, avg: 18.00, max: 28.00 },

  // ═══════════════════════════════════════════════════════════════════
  // OSPRZĘT ELEKTROINSTALACYJNY
  // ═══════════════════════════════════════════════════════════════════
  // Gniazda
  { category: "osprzet_elektroinstalacyjny", keywords: ["gniazdo", "pojedyncze", "podtynkow"], unit: "szt", min: 12.00, avg: 22.00, max: 45.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["gniazdo", "podwójne", "podtynkow"], unit: "szt", min: 18.00, avg: 30.00, max: 55.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["gniazdo", "ip44"], unit: "szt", min: 22.00, avg: 35.00, max: 65.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["gniazdo", "natynkow"], unit: "szt", min: 10.00, avg: 18.00, max: 35.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["gniazdo", "usb"], unit: "szt", min: 35.00, avg: 55.00, max: 90.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["gniazdo", "data", "rj45"], unit: "szt", min: 25.00, avg: 40.00, max: 70.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["gniazdo", "siłow", "16a"], unit: "szt", min: 15.00, avg: 25.00, max: 45.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["gniazdo", "siłow", "32a"], unit: "szt", min: 25.00, avg: 40.00, max: 65.00 },
  // Łączniki
  { category: "osprzet_elektroinstalacyjny", keywords: ["łącznik", "pojedynczy"], unit: "szt", min: 8.00, avg: 15.00, max: 30.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["łącznik", "świecznikow"], unit: "szt", min: 10.00, avg: 18.00, max: 35.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["łącznik", "schodow"], unit: "szt", min: 10.00, avg: 20.00, max: 38.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["łącznik", "krzyżow"], unit: "szt", min: 14.00, avg: 25.00, max: 42.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["przycisk", "dzwonkow"], unit: "szt", min: 8.00, avg: 14.00, max: 25.00 },
  // Puszki
  { category: "osprzet_elektroinstalacyjny", keywords: ["puszka", "podtynkow", "60"], unit: "szt", min: 1.50, avg: 3.00, max: 6.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["puszka", "podtynkow", "80"], unit: "szt", min: 3.00, avg: 5.00, max: 9.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["puszka", "natynkow"], unit: "szt", min: 3.00, avg: 6.00, max: 12.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["puszka", "odgałęźn"], unit: "szt", min: 4.00, avg: 8.00, max: 15.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["puszka", "hermetyczn"], unit: "szt", min: 8.00, avg: 15.00, max: 28.00 },
  // Ramki
  { category: "osprzet_elektroinstalacyjny", keywords: ["ramka", "pojedyncz"], unit: "szt", min: 3.00, avg: 6.00, max: 15.00 },
  { category: "osprzet_elektroinstalacyjny", keywords: ["ramka", "podwójn"], unit: "szt", min: 5.00, avg: 10.00, max: 22.00 },

  // ═══════════════════════════════════════════════════════════════════
  // APARATURA MODUŁOWA
  // ═══════════════════════════════════════════════════════════════════
  // MCB (wyłączniki nadprądowe)
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b6"], unit: "szt", min: 14.00, avg: 20.00, max: 35.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b10"], unit: "szt", min: 14.00, avg: 22.00, max: 36.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b16"], unit: "szt", min: 14.00, avg: 22.00, max: 38.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b20"], unit: "szt", min: 15.00, avg: 23.00, max: 40.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b25"], unit: "szt", min: 16.00, avg: 25.00, max: 42.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b32"], unit: "szt", min: 18.00, avg: 28.00, max: 48.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "c16"], unit: "szt", min: 16.00, avg: 25.00, max: 42.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "c25"], unit: "szt", min: 18.00, avg: 28.00, max: 48.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "c32"], unit: "szt", min: 22.00, avg: 35.00, max: 55.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "c40"], unit: "szt", min: 28.00, avg: 42.00, max: 65.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "c63"], unit: "szt", min: 45.00, avg: 65.00, max: 95.00 },
  // RCD (wyłączniki różnicowoprądowe)
  { category: "aparatura_modulowa", keywords: ["rcd", "25a", "30ma", "2p"], unit: "szt", min: 60.00, avg: 95.00, max: 150.00 },
  { category: "aparatura_modulowa", keywords: ["rcd", "40a", "30ma", "2p"], unit: "szt", min: 65.00, avg: 105.00, max: 165.00 },
  { category: "aparatura_modulowa", keywords: ["rcd", "40a", "30ma", "4p"], unit: "szt", min: 120.00, avg: 180.00, max: 280.00 },
  { category: "aparatura_modulowa", keywords: ["rcd", "63a", "30ma", "4p"], unit: "szt", min: 150.00, avg: 220.00, max: 340.00 },
  // RCBO (różnicowoprądowe z nadprądowym)
  { category: "aparatura_modulowa", keywords: ["rcbo", "b16", "30ma"], unit: "szt", min: 80.00, avg: 130.00, max: 200.00 },
  { category: "aparatura_modulowa", keywords: ["rcbo", "b10", "30ma"], unit: "szt", min: 80.00, avg: 125.00, max: 195.00 },
  // Rozłączniki
  { category: "aparatura_modulowa", keywords: ["rozłącznik", "izolacyjn", "40a"], unit: "szt", min: 35.00, avg: 55.00, max: 85.00 },
  { category: "aparatura_modulowa", keywords: ["rozłącznik", "izolacyjn", "63a"], unit: "szt", min: 45.00, avg: 70.00, max: 110.00 },
  { category: "aparatura_modulowa", keywords: ["rozłącznik", "izolacyjn", "100a"], unit: "szt", min: 65.00, avg: 100.00, max: 155.00 },

  // ═══════════════════════════════════════════════════════════════════
  // ROZDZIELNICE
  // ═══════════════════════════════════════════════════════════════════
  { category: "rozdzielnice", keywords: ["rozdzielnica", "podtynkow", "12"], unit: "szt", min: 40.00, avg: 65.00, max: 110.00 },
  { category: "rozdzielnice", keywords: ["rozdzielnica", "podtynkow", "24"], unit: "szt", min: 70.00, avg: 110.00, max: 180.00 },
  { category: "rozdzielnice", keywords: ["rozdzielnica", "podtynkow", "36"], unit: "szt", min: 100.00, avg: 160.00, max: 250.00 },
  { category: "rozdzielnice", keywords: ["rozdzielnica", "natynkow", "12"], unit: "szt", min: 30.00, avg: 50.00, max: 85.00 },
  { category: "rozdzielnice", keywords: ["rozdzielnica", "natynkow", "24"], unit: "szt", min: 55.00, avg: 85.00, max: 140.00 },
  { category: "rozdzielnice", keywords: ["rozdzielnica", "natynkow", "36"], unit: "szt", min: 80.00, avg: 130.00, max: 210.00 },
  { category: "rozdzielnice", keywords: ["rozdzielnica", "ip65"], unit: "szt", min: 120.00, avg: 200.00, max: 350.00 },

  // ═══════════════════════════════════════════════════════════════════
  // OPRAWY OŚWIETLENIOWE
  // ═══════════════════════════════════════════════════════════════════
  { category: "oprawy_oswietleniowe", keywords: ["oprawa", "led", "panel", "60x60"], unit: "szt", min: 55.00, avg: 85.00, max: 140.00 },
  { category: "oprawy_oswietleniowe", keywords: ["oprawa", "led", "panel", "30x120"], unit: "szt", min: 50.00, avg: 80.00, max: 130.00 },
  { category: "oprawy_oswietleniowe", keywords: ["downlight", "led"], unit: "szt", min: 25.00, avg: 45.00, max: 85.00 },
  { category: "oprawy_oswietleniowe", keywords: ["oprawa", "hermetyczn", "led"], unit: "szt", min: 35.00, avg: 65.00, max: 120.00 },
  { category: "oprawy_oswietleniowe", keywords: ["oprawa", "natynkow", "led"], unit: "szt", min: 30.00, avg: 55.00, max: 100.00 },
  { category: "oprawy_oswietleniowe", keywords: ["oprawa", "awaryjna"], unit: "szt", min: 60.00, avg: 110.00, max: 200.00 },
  { category: "oprawy_oswietleniowe", keywords: ["plafon", "led"], unit: "szt", min: 25.00, avg: 50.00, max: 90.00 },
  { category: "oprawy_oswietleniowe", keywords: ["oprawa", "ogrodow", "lampa"], unit: "szt", min: 50.00, avg: 120.00, max: 250.00 },

  // ═══════════════════════════════════════════════════════════════════
  // TRASY KABLOWE
  // ═══════════════════════════════════════════════════════════════════
  { category: "trasy_kablowe", keywords: ["korytko", "pcv", "25x16"], unit: "mb", min: 3.00, avg: 5.00, max: 8.00 },
  { category: "trasy_kablowe", keywords: ["korytko", "pcv", "40x25"], unit: "mb", min: 5.00, avg: 8.00, max: 13.00 },
  { category: "trasy_kablowe", keywords: ["korytko", "pcv", "60x40"], unit: "mb", min: 8.00, avg: 13.00, max: 20.00 },
  { category: "trasy_kablowe", keywords: ["korytko", "pcv", "100x40"], unit: "mb", min: 12.00, avg: 18.00, max: 28.00 },
  { category: "trasy_kablowe", keywords: ["rura", "peszel", "16"], unit: "mb", min: 0.80, avg: 1.40, max: 2.50 },
  { category: "trasy_kablowe", keywords: ["rura", "peszel", "20"], unit: "mb", min: 1.00, avg: 1.80, max: 3.00 },
  { category: "trasy_kablowe", keywords: ["rura", "peszel", "25"], unit: "mb", min: 1.50, avg: 2.50, max: 4.00 },
  { category: "trasy_kablowe", keywords: ["rura", "peszel", "32"], unit: "mb", min: 2.00, avg: 3.50, max: 5.50 },
  { category: "trasy_kablowe", keywords: ["rura", "instalacyjna", "rl"], unit: "mb", min: 1.50, avg: 2.50, max: 4.00 },
  { category: "trasy_kablowe", keywords: ["rura", "sztywna", "pcv"], unit: "mb", min: 2.00, avg: 3.50, max: 5.50 },
  { category: "trasy_kablowe", keywords: ["drabinka", "kablowa", "200"], unit: "mb", min: 35.00, avg: 55.00, max: 85.00 },
  { category: "trasy_kablowe", keywords: ["drabinka", "kablowa", "300"], unit: "mb", min: 45.00, avg: 70.00, max: 105.00 },
  { category: "trasy_kablowe", keywords: ["drabinka", "kablowa", "500"], unit: "mb", min: 60.00, avg: 90.00, max: 140.00 },

  // ═══════════════════════════════════════════════════════════════════
  // OCHRONA PRZEPIĘCIOWA (SPD)
  // ═══════════════════════════════════════════════════════════════════
  { category: "ochrona_przepieciowa", keywords: ["ogranicznik", "przepięć", "b+c"], unit: "szt", min: 120.00, avg: 200.00, max: 350.00 },
  { category: "ochrona_przepieciowa", keywords: ["ogranicznik", "przepięć", "typ", "2"], unit: "szt", min: 80.00, avg: 140.00, max: 250.00 },
  { category: "ochrona_przepieciowa", keywords: ["spd", "typ", "1+2"], unit: "szt", min: 250.00, avg: 400.00, max: 650.00 },
  { category: "ochrona_przepieciowa", keywords: ["spd", "typ", "2"], unit: "szt", min: 80.00, avg: 140.00, max: 250.00 },

  // ═══════════════════════════════════════════════════════════════════
  // AUTOMATYKA (styczniki, przekaźniki)
  // ═══════════════════════════════════════════════════════════════════
  { category: "automatyka", keywords: ["stycznik", "25a"], unit: "szt", min: 45.00, avg: 75.00, max: 120.00 },
  { category: "automatyka", keywords: ["stycznik", "40a"], unit: "szt", min: 65.00, avg: 100.00, max: 160.00 },
  { category: "automatyka", keywords: ["przekaźnik", "czasow"], unit: "szt", min: 50.00, avg: 85.00, max: 140.00 },
  { category: "automatyka", keywords: ["przekaźnik", "bistabiln"], unit: "szt", min: 45.00, avg: 75.00, max: 120.00 },
  { category: "automatyka", keywords: ["zegar", "sterown"], unit: "szt", min: 60.00, avg: 100.00, max: 170.00 },
  { category: "automatyka", keywords: ["czujnik", "zmierzchow"], unit: "szt", min: 35.00, avg: 60.00, max: 100.00 },
  { category: "automatyka", keywords: ["czujnik", "ruchu"], unit: "szt", min: 25.00, avg: 45.00, max: 80.00 },

  // ═══════════════════════════════════════════════════════════════════
  // POMIARY I OCHRONA
  // ═══════════════════════════════════════════════════════════════════
  { category: "pomiary_ochrona", keywords: ["bednarka", "25x4"], unit: "mb", min: 8.00, avg: 12.00, max: 18.00 },
  { category: "pomiary_ochrona", keywords: ["bednarka", "30x4"], unit: "mb", min: 10.00, avg: 15.00, max: 22.00 },
  { category: "pomiary_ochrona", keywords: ["uchwyt", "bednark"], unit: "szt", min: 1.50, avg: 3.00, max: 5.00 },
  { category: "pomiary_ochrona", keywords: ["złącze", "kontroln"], unit: "szt", min: 15.00, avg: 28.00, max: 45.00 },
  { category: "pomiary_ochrona", keywords: ["zwód", "odgromow"], unit: "mb", min: 8.00, avg: 12.00, max: 18.00 },
  { category: "pomiary_ochrona", keywords: ["iglica", "odgromow"], unit: "szt", min: 40.00, avg: 75.00, max: 130.00 },

  // ═══════════════════════════════════════════════════════════════════
  // FOTOWOLTAIKA
  // ═══════════════════════════════════════════════════════════════════
  { category: "fotowoltaika", keywords: ["panel", "pv", "400"], unit: "szt", min: 350.00, avg: 480.00, max: 650.00 },
  { category: "fotowoltaika", keywords: ["panel", "pv", "450"], unit: "szt", min: 380.00, avg: 520.00, max: 700.00 },
  { category: "fotowoltaika", keywords: ["panel", "fotowoltaiczn"], unit: "szt", min: 350.00, avg: 500.00, max: 700.00 },
  { category: "fotowoltaika", keywords: ["falownik", "3kw"], unit: "szt", min: 2500.00, avg: 3500.00, max: 5000.00 },
  { category: "fotowoltaika", keywords: ["falownik", "5kw"], unit: "szt", min: 3000.00, avg: 4200.00, max: 6000.00 },
  { category: "fotowoltaika", keywords: ["falownik", "8kw"], unit: "szt", min: 4000.00, avg: 5500.00, max: 7500.00 },
  { category: "fotowoltaika", keywords: ["falownik", "10kw"], unit: "szt", min: 4500.00, avg: 6200.00, max: 8500.00 },
  { category: "fotowoltaika", keywords: ["optymalizator"], unit: "szt", min: 120.00, avg: 180.00, max: 280.00 },
  { category: "fotowoltaika", keywords: ["konstrukcja", "pv", "dach"], unit: "szt", min: 80.00, avg: 130.00, max: 200.00 },

  // ═══════════════════════════════════════════════════════════════════
  // MATERIAŁY MONTAŻOWE
  // ═══════════════════════════════════════════════════════════════════
  { category: "materialy_montazowe", keywords: ["wago", "221", "2"], unit: "szt", min: 1.20, avg: 2.00, max: 3.50 },
  { category: "materialy_montazowe", keywords: ["wago", "221", "3"], unit: "szt", min: 1.50, avg: 2.50, max: 4.00 },
  { category: "materialy_montazowe", keywords: ["wago", "221", "5"], unit: "szt", min: 2.00, avg: 3.50, max: 5.50 },
  { category: "materialy_montazowe", keywords: ["złączka", "szynow", "2,5"], unit: "szt", min: 1.50, avg: 2.50, max: 4.50 },
  { category: "materialy_montazowe", keywords: ["złączka", "szynow", "4"], unit: "szt", min: 2.00, avg: 3.50, max: 6.00 },
  { category: "materialy_montazowe", keywords: ["złączka", "szynow", "10"], unit: "szt", min: 4.00, avg: 7.00, max: 11.00 },
  { category: "materialy_montazowe", keywords: ["dławnica", "m20"], unit: "szt", min: 1.00, avg: 2.00, max: 3.50 },
  { category: "materialy_montazowe", keywords: ["dławnica", "m25"], unit: "szt", min: 1.50, avg: 2.50, max: 4.50 },
  { category: "materialy_montazowe", keywords: ["dławnica", "m32"], unit: "szt", min: 2.00, avg: 3.50, max: 6.00 },
  { category: "materialy_montazowe", keywords: ["taśma", "izolacyjn"], unit: "szt", min: 2.00, avg: 4.00, max: 8.00 },
  { category: "materialy_montazowe", keywords: ["opaska", "zaciskowa", "200"], unit: "szt", min: 0.03, avg: 0.05, max: 0.10 },
  { category: "materialy_montazowe", keywords: ["szyna", "th35"], unit: "mb", min: 3.00, avg: 5.50, max: 9.00 },

  // ═══════════════════════════════════════════════════════════════════
  // SMART HOME
  // ═══════════════════════════════════════════════════════════════════
  { category: "smart_home", keywords: ["aktor", "knx"], unit: "szt", min: 200.00, avg: 350.00, max: 550.00 },
  { category: "smart_home", keywords: ["zasilacz", "knx"], unit: "szt", min: 180.00, avg: 280.00, max: 420.00 },
  { category: "smart_home", keywords: ["przycisk", "knx"], unit: "szt", min: 150.00, avg: 250.00, max: 400.00 },
  { category: "smart_home", keywords: ["czujnik", "knx"], unit: "szt", min: 120.00, avg: 200.00, max: 350.00 },
  { category: "smart_home", keywords: ["moduł", "dali"], unit: "szt", min: 150.00, avg: 250.00, max: 400.00 },

  // ═══════════════════════════════════════════════════════════════════
  // ZASILANIE AWARYJNE (UPS, baterie, agregaty)
  // ═══════════════════════════════════════════════════════════════════
  { category: "zasilanie_awaryjne", keywords: ["ups", "1kva"], unit: "szt", min: 800.00, avg: 1200.00, max: 1800.00 },
  { category: "zasilanie_awaryjne", keywords: ["ups", "2kva"], unit: "szt", min: 1500.00, avg: 2200.00, max: 3200.00 },
  { category: "zasilanie_awaryjne", keywords: ["ups", "3kva"], unit: "szt", min: 2200.00, avg: 3500.00, max: 5000.00 },
  { category: "zasilanie_awaryjne", keywords: ["ups", "5kva"], unit: "szt", min: 3500.00, avg: 5500.00, max: 8000.00 },
  { category: "zasilanie_awaryjne", keywords: ["ups", "10kva"], unit: "szt", min: 6000.00, avg: 9500.00, max: 14000.00 },
  { category: "zasilanie_awaryjne", keywords: ["bateria", "ups"], unit: "szt", min: 150.00, avg: 280.00, max: 500.00 },
  { category: "zasilanie_awaryjne", keywords: ["szafa", "bateryjn"], unit: "szt", min: 800.00, avg: 1500.00, max: 2500.00 },
  { category: "zasilanie_awaryjne", keywords: ["agregat", "prądotwórcz"], unit: "szt", min: 8000.00, avg: 15000.00, max: 35000.00 },
  { category: "zasilanie_awaryjne", keywords: ["przełącznik", "sieć", "agregat"], unit: "szt", min: 1200.00, avg: 2500.00, max: 5000.00 },

  // ═══════════════════════════════════════════════════════════════════
  // ŁADOWARKI EV (wallbox, stacje ładowania)
  // ═══════════════════════════════════════════════════════════════════
  { category: "ladowarki_ev", keywords: ["wallbox", "7kw"], unit: "szt", min: 1800.00, avg: 2800.00, max: 4500.00 },
  { category: "ladowarki_ev", keywords: ["wallbox", "11kw"], unit: "szt", min: 2500.00, avg: 3800.00, max: 6000.00 },
  { category: "ladowarki_ev", keywords: ["wallbox", "22kw"], unit: "szt", min: 3500.00, avg: 5500.00, max: 8500.00 },
  { category: "ladowarki_ev", keywords: ["ładowarka", "ev"], unit: "szt", min: 2000.00, avg: 3500.00, max: 6000.00 },
  { category: "ladowarki_ev", keywords: ["stacja", "ładowani"], unit: "szt", min: 2500.00, avg: 4500.00, max: 8000.00 },

  // ═══════════════════════════════════════════════════════════════════
  // POMIARY I LICZNIKI (mierniki, przekładniki, analizatory)
  // ═══════════════════════════════════════════════════════════════════
  { category: "pomiary_liczniki", keywords: ["licznik", "energii", "1-faz"], unit: "szt", min: 80.00, avg: 140.00, max: 220.00 },
  { category: "pomiary_liczniki", keywords: ["licznik", "energii", "3-faz"], unit: "szt", min: 200.00, avg: 350.00, max: 550.00 },
  { category: "pomiary_liczniki", keywords: ["licznik", "modbus"], unit: "szt", min: 250.00, avg: 400.00, max: 600.00 },
  { category: "pomiary_liczniki", keywords: ["przekładnik", "prądow"], unit: "szt", min: 25.00, avg: 50.00, max: 90.00 },
  { category: "pomiary_liczniki", keywords: ["analizator", "sieci"], unit: "szt", min: 800.00, avg: 1500.00, max: 2800.00 },
  { category: "pomiary_liczniki", keywords: ["amperomierz", "moduł"], unit: "szt", min: 40.00, avg: 70.00, max: 120.00 },
  { category: "pomiary_liczniki", keywords: ["woltomierz", "moduł"], unit: "szt", min: 40.00, avg: 70.00, max: 120.00 },

  // ═══════════════════════════════════════════════════════════════════
  // OGRZEWANIE ELEKTRYCZNE (maty grzewcze, kable, termostaty)
  // ═══════════════════════════════════════════════════════════════════
  { category: "ogrzewanie_elektryczne", keywords: ["mata", "grzewcz", "150w"], unit: "m2", min: 90.00, avg: 140.00, max: 220.00 },
  { category: "ogrzewanie_elektryczne", keywords: ["mata", "grzewcz", "200w"], unit: "m2", min: 120.00, avg: 180.00, max: 280.00 },
  { category: "ogrzewanie_elektryczne", keywords: ["mata", "grzewcz"], unit: "m2", min: 90.00, avg: 150.00, max: 250.00 },
  { category: "ogrzewanie_elektryczne", keywords: ["kabel", "grzejn"], unit: "mb", min: 8.00, avg: 15.00, max: 25.00 },
  { category: "ogrzewanie_elektryczne", keywords: ["termostat", "podłogow"], unit: "szt", min: 80.00, avg: 150.00, max: 280.00 },
  { category: "ogrzewanie_elektryczne", keywords: ["termostat", "programowaln"], unit: "szt", min: 120.00, avg: 200.00, max: 350.00 },
  { category: "ogrzewanie_elektryczne", keywords: ["grzejnik", "elektryczn"], unit: "szt", min: 300.00, avg: 600.00, max: 1200.00 },
  { category: "ogrzewanie_elektryczne", keywords: ["grzałka", "elektryczn"], unit: "szt", min: 60.00, avg: 120.00, max: 250.00 },

  // ═══════════════════════════════════════════════════════════════════
  // PRZEPUSTY PPOŻ (przepusty ogniowe, masy ogniochronne)
  // ═══════════════════════════════════════════════════════════════════
  { category: "przepusty_ppoz", keywords: ["przepust", "ogniochronn"], unit: "szt", min: 25.00, avg: 55.00, max: 100.00 },
  { category: "przepusty_ppoz", keywords: ["przepust", "ei60"], unit: "szt", min: 30.00, avg: 60.00, max: 110.00 },
  { category: "przepusty_ppoz", keywords: ["przepust", "ei90"], unit: "szt", min: 40.00, avg: 75.00, max: 130.00 },
  { category: "przepusty_ppoz", keywords: ["przepust", "ei120"], unit: "szt", min: 50.00, avg: 90.00, max: 150.00 },
  { category: "przepusty_ppoz", keywords: ["masa", "ogniochronn"], unit: "szt", min: 40.00, avg: 80.00, max: 150.00 },
  { category: "przepusty_ppoz", keywords: ["kołnierz", "ogniochronn"], unit: "szt", min: 60.00, avg: 110.00, max: 200.00 },
  { category: "przepusty_ppoz", keywords: ["opaska", "ogniochronn"], unit: "szt", min: 40.00, avg: 75.00, max: 140.00 },

  // ═══════════════════════════════════════════════════════════════════
  // DODATKOWY OSPRZĘT (uzupełnienie istniejących kategorii)
  // ═══════════════════════════════════════════════════════════════════
  // Tulejki kablowe
  { category: "materialy_montazowe", keywords: ["tulejka", "kablow", "1,5"], unit: "szt", min: 0.05, avg: 0.10, max: 0.20 },
  { category: "materialy_montazowe", keywords: ["tulejka", "kablow", "2,5"], unit: "szt", min: 0.06, avg: 0.12, max: 0.25 },
  { category: "materialy_montazowe", keywords: ["tulejka", "kablow", "6"], unit: "szt", min: 0.10, avg: 0.20, max: 0.40 },
  { category: "materialy_montazowe", keywords: ["tulejka", "kablow", "10"], unit: "szt", min: 0.15, avg: 0.30, max: 0.60 },
  { category: "materialy_montazowe", keywords: ["tulejka", "kablow", "16"], unit: "szt", min: 0.25, avg: 0.50, max: 1.00 },
  // Listwy zaciskowe
  { category: "materialy_montazowe", keywords: ["listwa", "zaciskow", "12"], unit: "szt", min: 2.00, avg: 4.00, max: 7.00 },
  { category: "materialy_montazowe", keywords: ["listwa", "zaciskow", "n"], unit: "szt", min: 5.00, avg: 10.00, max: 18.00 },
  { category: "materialy_montazowe", keywords: ["listwa", "zaciskow", "pe"], unit: "szt", min: 5.00, avg: 10.00, max: 18.00 },
  // Kołki
  { category: "materialy_montazowe", keywords: ["kołek", "rozporow"], unit: "szt", min: 0.15, avg: 0.30, max: 0.60 },
  { category: "materialy_montazowe", keywords: ["kołek", "motylek"], unit: "szt", min: 0.30, avg: 0.60, max: 1.20 },
  // Mufy kablowe
  { category: "materialy_montazowe", keywords: ["mufa", "kablow"], unit: "szt", min: 25.00, avg: 55.00, max: 100.00 },
  { category: "materialy_montazowe", keywords: ["głowica", "kablow"], unit: "szt", min: 30.00, avg: 65.00, max: 120.00 },
  // Szyny zbiorcze
  { category: "materialy_montazowe", keywords: ["szyna", "zbiorcz", "miedzian"], unit: "mb", min: 20.00, avg: 40.00, max: 70.00 },
  { category: "materialy_montazowe", keywords: ["grzebień", "łączeniow"], unit: "szt", min: 15.00, avg: 28.00, max: 45.00 },
  // Dławice dodatkowe rozmiary
  { category: "materialy_montazowe", keywords: ["dławnica", "m40"], unit: "szt", min: 3.00, avg: 5.50, max: 9.00 },
  { category: "materialy_montazowe", keywords: ["dławnica", "m50"], unit: "szt", min: 5.00, avg: 9.00, max: 15.00 },
  { category: "materialy_montazowe", keywords: ["dławnica", "m63"], unit: "szt", min: 8.00, avg: 14.00, max: 22.00 },

  // ═══════════════════════════════════════════════════════════════════
  // DODATKOWA APARATURA MODUŁOWA
  // ═══════════════════════════════════════════════════════════════════
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b40"], unit: "szt", min: 22.00, avg: 35.00, max: 55.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b50"], unit: "szt", min: 28.00, avg: 42.00, max: 65.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "b63"], unit: "szt", min: 35.00, avg: 52.00, max: 80.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "c10"], unit: "szt", min: 15.00, avg: 23.00, max: 40.00 },
  { category: "aparatura_modulowa", keywords: ["wyłącznik", "c20"], unit: "szt", min: 17.00, avg: 26.00, max: 45.00 },
  { category: "aparatura_modulowa", keywords: ["rcd", "25a", "30ma", "4p"], unit: "szt", min: 100.00, avg: 160.00, max: 250.00 },
  { category: "aparatura_modulowa", keywords: ["rcd", "63a", "300ma", "4p"], unit: "szt", min: 130.00, avg: 200.00, max: 310.00 },
  { category: "aparatura_modulowa", keywords: ["rozłącznik", "izolacyjn", "160a"], unit: "szt", min: 90.00, avg: 140.00, max: 220.00 },
  { category: "aparatura_modulowa", keywords: ["rozłącznik", "izolacyjn", "250a"], unit: "szt", min: 150.00, avg: 230.00, max: 360.00 },
  // Bezpieczniki
  { category: "aparatura_modulowa", keywords: ["wkładka", "bezpiecznikow", "nh00"], unit: "szt", min: 8.00, avg: 15.00, max: 28.00 },
  { category: "aparatura_modulowa", keywords: ["wkładka", "bezpiecznikow", "nh1"], unit: "szt", min: 12.00, avg: 22.00, max: 40.00 },
  { category: "aparatura_modulowa", keywords: ["wkładka", "bezpiecznikow", "nh2"], unit: "szt", min: 18.00, avg: 35.00, max: 60.00 },
  { category: "aparatura_modulowa", keywords: ["podstawa", "bezpiecznikow", "nh00"], unit: "szt", min: 20.00, avg: 38.00, max: 65.00 },
  { category: "aparatura_modulowa", keywords: ["podstawa", "bezpiecznikow", "nh1"], unit: "szt", min: 30.00, avg: 55.00, max: 90.00 },

  // ═══════════════════════════════════════════════════════════════════
  // DODATKOWE OPRAWY OŚWIETLENIOWE
  // ═══════════════════════════════════════════════════════════════════
  { category: "oprawy_oswietleniowe", keywords: ["oprawa", "led", "liniow"], unit: "szt", min: 40.00, avg: 75.00, max: 130.00 },
  { category: "oprawy_oswietleniowe", keywords: ["oprawa", "przemysłow", "led"], unit: "szt", min: 80.00, avg: 150.00, max: 280.00 },
  { category: "oprawy_oswietleniowe", keywords: ["naświetlacz", "led"], unit: "szt", min: 30.00, avg: 70.00, max: 150.00 },
  { category: "oprawy_oswietleniowe", keywords: ["taśma", "led"], unit: "mb", min: 8.00, avg: 18.00, max: 40.00 },
  { category: "oprawy_oswietleniowe", keywords: ["zasilacz", "led"], unit: "szt", min: 20.00, avg: 45.00, max: 90.00 },

  // ═══════════════════════════════════════════════════════════════════
  // DODATKOWE TRASY KABLOWE
  // ═══════════════════════════════════════════════════════════════════
  { category: "trasy_kablowe", keywords: ["rura", "stalowa", "rl"], unit: "mb", min: 5.00, avg: 9.00, max: 15.00 },
  { category: "trasy_kablowe", keywords: ["uchwyt", "kablowy"], unit: "szt", min: 0.50, avg: 1.20, max: 2.50 },
  { category: "trasy_kablowe", keywords: ["uchwyt", "dystansow"], unit: "szt", min: 1.00, avg: 2.00, max: 4.00 },
  { category: "trasy_kablowe", keywords: ["korytko", "siatkow", "100"], unit: "mb", min: 15.00, avg: 25.00, max: 40.00 },
  { category: "trasy_kablowe", keywords: ["korytko", "siatkow", "200"], unit: "mb", min: 20.00, avg: 35.00, max: 55.00 },
  { category: "trasy_kablowe", keywords: ["korytko", "siatkow", "300"], unit: "mb", min: 28.00, avg: 45.00, max: 70.00 },
  { category: "trasy_kablowe", keywords: ["rura", "ochronna", "dvr"], unit: "mb", min: 2.50, avg: 5.00, max: 8.50 },
  { category: "trasy_kablowe", keywords: ["rura", "osłonowa", "arot"], unit: "mb", min: 4.00, avg: 7.50, max: 12.00 },
];

// ─── Lookup Functions ───────────────────────────────────────────────────────────

/**
 * Find the best matching benchmark for a given item name and unit.
 * Returns null if no match found.
 * Uses greedy keyword matching — entry with most matching keywords wins.
 */
export function findMaterialBenchmark(
  name: string,
  unit: string,
): MaterialBenchmark | null {
  const nameLower = name.toLowerCase().replace(/×/g, "x");
  const unitLower = unit.toLowerCase().trim();

  let bestMatch: MaterialBenchmark | null = null;
  let bestScore = 0;

  for (const bench of MATERIAL_BENCHMARKS) {
    // Unit must match (mb/m treated as equivalent)
    const benchUnit = bench.unit.toLowerCase();
    const unitMatch =
      benchUnit === unitLower ||
      (benchUnit === "mb" && unitLower === "m") ||
      (benchUnit === "m" && unitLower === "mb");
    if (!unitMatch) continue;

    // All keywords must be present
    const allMatch = bench.keywords.every((kw) => nameLower.includes(kw));
    if (!allMatch) continue;

    // Score by keyword count (more specific = better)
    const score = bench.keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = bench;
    }
  }

  return bestMatch;
}

/**
 * Clamp an AI-suggested material price to the benchmark range.
 * Returns { price, source } where source indicates what happened:
 *   - "benchmark" = price was clamped to benchmark range
 *   - "original"  = price was within range or no benchmark found
 */
export function clampToBenchmark(
  name: string,
  unit: string,
  aiPrice: number,
): { price: number; source: "benchmark" | "original"; benchmark: MaterialBenchmark | null } {
  const bench = findMaterialBenchmark(name, unit);
  if (!bench) return { price: aiPrice, source: "original", benchmark: null };

  if (aiPrice < bench.min * 0.5) {
    // Way too low — use average
    return { price: bench.avg, source: "benchmark", benchmark: bench };
  }
  if (aiPrice > bench.max * 1.5) {
    // Way too high — use average
    return { price: bench.avg, source: "benchmark", benchmark: bench };
  }
  if (aiPrice < bench.min) {
    // Slightly too low — clamp to min
    return { price: bench.min, source: "benchmark", benchmark: bench };
  }
  if (aiPrice > bench.max) {
    // Slightly too high — clamp to max
    return { price: bench.max, source: "benchmark", benchmark: bench };
  }

  return { price: aiPrice, source: "original", benchmark: bench };
}

/**
 * Build a price reference string for AI prompts.
 * Returns a compact table of benchmark prices for the given category.
 */
export function buildBenchmarkPromptContext(categories?: MaterialCategory[]): string {
  const cats = categories ?? [
    "kable_instalacyjne",
    "kable_zasilajace",
    "osprzet_elektroinstalacyjny",
    "aparatura_modulowa",
    "oprawy_oswietleniowe",
    "trasy_kablowe",
    "zasilanie_awaryjne",
    "ladowarki_ev",
    "pomiary_liczniki",
    "ogrzewanie_elektryczne",
    "przepusty_ppoz",
  ];

  const lines: string[] = ["<price_reference_2026>"];
  for (const cat of cats) {
    const entries = MATERIAL_BENCHMARKS.filter((b) => b.category === cat);
    if (entries.length === 0) continue;
    lines.push(`# ${cat.replace(/_/g, " ").toUpperCase()}`);
    for (const e of entries) {
      lines.push(`  ${e.keywords.join(" ")} [${e.unit}]: ${e.min}-${e.max} PLN (avg ${e.avg})`);
    }
  }
  lines.push("</price_reference_2026>");
  return lines.join("\n");
}

/**
 * Get summary stats for the benchmark database.
 */
export function getBenchmarkStats(): { totalEntries: number; categories: number } {
  const cats = new Set(MATERIAL_BENCHMARKS.map((b) => b.category));
  return { totalEntries: MATERIAL_BENCHMARKS.length, categories: cats.size };
}
