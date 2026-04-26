/**
 * canonical-knr-l0.test.ts — Unit tests for L0 Canonical KNR Reference
 *
 * Validates that:
 *   1. Top-60 patterns match the most common Polish electrician items
 *   2. Substrate-aware bruzdowanie returns DIFFERENT norms (cegła ≠ beton ≠ żelbet)
 *   3. Cable cross-sections (1.5/2.5/4/6/16/25/35/50 mm²) all resolve correctly
 *   4. Unit compatibility (mb↔m, szt↔kpl) works
 *   5. validateAgainstCanonicalL0 catches AI hallucinations (>3× / <0.33×)
 *
 * Run: npx vitest run tests/canonical-knr-l0.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  findCanonicalL0,
  validateAgainstCanonicalL0,
} from "@/lib/services/canonical-knr-l0";

describe("L0 Canonical KNR Reference — pattern matching", () => {
  describe("Cables (YDYp / YKY / UTP)", () => {
    it("YDYp 3×1.5 → KNR 5-08 0201, 0.13 rbh/mb", () => {
      const m = findCanonicalL0("Przewód YDYp 3×1.5 mm²", "mb");
      expect(m).not.toBeNull();
      expect(m?.knrCode).toBe("KNR 5-08 0201");
      expect(m?.laborNorm).toBe(0.13);
      expect(m?.unit).toBe("mb");
    });

    it("YDYp 3x2,5 (Polish comma + lowercase x) → KNR 5-08 0202, 0.16 rbh/mb", () => {
      const m = findCanonicalL0("Przewód YDYp 3x2,5 mm²", "mb");
      expect(m?.knrCode).toBe("KNR 5-08 0202");
      expect(m?.laborNorm).toBe(0.16);
    });

    it("YDYp 5×6 → 0.23 rbh/mb (kuchnia / indukcja)", () => {
      const m = findCanonicalL0("YDYp 5×6 mm² zasilanie kuchni", "mb");
      expect(m?.laborNorm).toBe(0.23);
    });

    it("YKY 5×16 → KNR 5-10 0301, 0.22 rbh/mb", () => {
      const m = findCanonicalL0("Kabel YKY 5×16 mm²", "mb");
      expect(m?.knrCode).toBe("KNR 5-10 0301");
      expect(m?.laborNorm).toBe(0.22);
    });

    it("YKY 4×35 → 0.45 rbh/mb (większy przekrój)", () => {
      const m = findCanonicalL0("YKY 4×35 mm²", "mb");
      expect(m?.laborNorm).toBe(0.45);
    });

    it("UTP cat 6 → KNR 5-12 0201, 0.10 rbh/mb", () => {
      const m = findCanonicalL0("Przewód UTP cat 6", "mb");
      expect(m?.knrCode).toBe("KNR 5-12 0201");
      expect(m?.laborNorm).toBe(0.10);
    });

    it("UTP kat. 5e (Polish kat. notation) → 0.10 rbh/mb", () => {
      const m = findCanonicalL0("Skrętka UTP kat. 5e ekranowana", "mb");
      expect(m?.laborNorm).toBe(0.10);
    });

    it("UTP cat 6a → 0.12 rbh/mb (grubsza skrętka)", () => {
      const m = findCanonicalL0("UTP cat 6a U/UTP 4P", "mb");
      expect(m?.laborNorm).toBe(0.12);
    });
  });

  describe("Sockets (Gniazda 230V / siłowe / RJ45 / TV)", () => {
    it("Gniazdo 230V pojedyncze p/t → 0.35 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo 230V p/t pojedyncze z ramką", "szt");
      expect(m?.knrCode).toBe("KNR 5-04 0501-01");
      expect(m?.laborNorm).toBe(0.35);
    });

    it("Gniazdo 230V podwójne p/t → 0.45 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo 230V p/t podwójne", "szt");
      expect(m?.laborNorm).toBe(0.45);
    });

    it("Gniazdo CEE 16A 5P → 0.60 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo siłowe 16A 5P (CEE) p/t", "szt");
      expect(m?.knrCode).toBe("KNR 5-04 0302-01");
      expect(m?.laborNorm).toBe(0.60);
    });

    it("Gniazdo CEE 32A → 0.85 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo CEE 32A 5P", "szt");
      expect(m?.laborNorm).toBe(0.85);
    });

    it("Gniazdo RJ45 cat 6 → KNR 5-09 0106, 0.50 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo komputerowe RJ45 cat 6 p/t", "szt");
      expect(m?.knrCode).toBe("KNR 5-09 0106");
      expect(m?.laborNorm).toBe(0.50);
    });

    it("Gniazdo TV antenowe → 0.40 rbh/szt", () => {
      const m = findCanonicalL0("Gniazdo TV antenowe SAT", "szt");
      expect(m?.laborNorm).toBe(0.40);
    });
  });

  describe("Switches (Łączniki)", () => {
    it("Łącznik pojedynczy → 0.25 rbh/szt", () => {
      const m = findCanonicalL0("Łącznik pojedynczy p/t", "szt");
      expect(m?.laborNorm).toBe(0.25);
    });

    it("Łącznik świecznikowy → 0.30 rbh/szt", () => {
      const m = findCanonicalL0("Łącznik świecznikowy p/t", "szt");
      expect(m?.laborNorm).toBe(0.30);
    });

    it("Łącznik schodowy → 0.30 rbh/szt", () => {
      const m = findCanonicalL0("Łącznik schodowy", "szt");
      expect(m?.laborNorm).toBe(0.30);
    });

    it("Łącznik krzyżowy → 0.35 rbh/szt (droższy montaż)", () => {
      const m = findCanonicalL0("Łącznik krzyżowy schodowy", "szt");
      expect(m?.laborNorm).toBe(0.35);
    });
  });

  describe("Boxes (Puszki)", () => {
    it("Puszka p/t Ø60 → 0.15 rbh/szt", () => {
      const m = findCanonicalL0("Puszka podtynkowa Ø60", "szt");
      expect(m?.knrCode).toBe("KNR 5-04 0601-01");
      expect(m?.laborNorm).toBe(0.15);
    });

    it("Puszka rozgałęźna → 0.25 rbh/szt", () => {
      const m = findCanonicalL0("Puszka rozgałęźna p/t", "szt");
      expect(m?.laborNorm).toBe(0.25);
    });
  });

  describe("Light fixtures (Oprawy)", () => {
    it("Oprawa LED downlight → 0.40 rbh/szt", () => {
      const m = findCanonicalL0("Oprawa LED downlight 12W", "szt");
      expect(m?.laborNorm).toBe(0.40);
    });

    it("Oprawa LED panel 60×60 → 0.50 rbh/szt", () => {
      const m = findCanonicalL0("Oprawa LED panel 60x60 36W", "szt");
      expect(m?.laborNorm).toBe(0.50);
    });

    it("Oprawa awaryjna ewakuacyjna LED 3h → KNR 5-09 0707-01, 0.50 rbh/szt", () => {
      const m = findCanonicalL0("Oprawa awaryjna ewakuacyjna LED 3h", "szt");
      expect(m?.knrCode).toBe("KNR 5-09 0707-01");
      expect(m?.laborNorm).toBe(0.50);
    });

    it("Punkt świetlny → 0.35 rbh/szt", () => {
      const m = findCanonicalL0("Punkt świetlny p/t", "szt");
      expect(m?.laborNorm).toBe(0.35);
    });
  });

  describe("CRITICAL: Substrate-aware bruzdowanie (cegła ≠ beton ≠ żelbet)", () => {
    it("Bruzdowanie w cegle → 0.85 rbh/mb", () => {
      const m = findCanonicalL0("Bruzdowanie w cegle (1 przewód)", "mb");
      expect(m?.knrCode).toBe("KNR 5-08 0101");
      expect(m?.laborNorm).toBe(0.85);
    });

    it("Bruzdowanie w betonie → 2.00 rbh/mb (2.35× cegła)", () => {
      const m = findCanonicalL0("Bruzdowanie w betonie", "mb");
      expect(m?.knrCode).toBe("KNR 5-08 0103");
      expect(m?.laborNorm).toBe(2.00);
    });

    it("Bruzdowanie w żelbecie → 2.50 rbh/mb (najtwardsze)", () => {
      const m = findCanonicalL0("Bruzdowanie w żelbecie zbrojonym", "mb");
      expect(m?.laborNorm).toBe(2.50);
    });

    it("Bruzdowanie w gazobetonie / Ytong → 1.30 rbh/mb", () => {
      const m = findCanonicalL0("Bruzdowanie w ytongu", "mb");
      expect(m?.laborNorm).toBe(1.30);
    });

    it("Bruzdowanie generic (no substrate) → cegła default 0.85 rbh/mb", () => {
      const m = findCanonicalL0("Bruzdowanie wgłębne", "mb");
      expect(m?.laborNorm).toBe(0.85);
    });

    it("Cegła ≠ beton ≠ żelbet (3 distinct values)", () => {
      const cegla = findCanonicalL0("Bruzdowanie cegła", "mb")?.laborNorm;
      const beton = findCanonicalL0("Bruzdowanie beton", "mb")?.laborNorm;
      const zelbet = findCanonicalL0("Bruzdowanie żelbet", "mb")?.laborNorm;
      expect(cegla).toBeLessThan(beton!);
      expect(beton).toBeLessThan(zelbet!);
      expect(new Set([cegla, beton, zelbet]).size).toBe(3);
    });
  });

  describe("Restoration (Zaprawianie)", () => {
    it("Zaprawianie bruzd → 0.12 rbh/mb (much lower than wykuwanie)", () => {
      const m = findCanonicalL0("Zaprawianie bruzd po ułożeniu przewodów", "mb");
      expect(m?.knrCode).toBe("KNR 5-08 0107");
      expect(m?.laborNorm).toBe(0.12);
    });

    it("Wykucie otworu pod puszkę cegła → 0.20 rbh/szt", () => {
      const m = findCanonicalL0("Wykucie otworu pod puszkę Ø60 w cegle", "szt");
      expect(m?.laborNorm).toBe(0.20);
    });

    it("Wykucie otworu pod puszkę BETON → 0.40 rbh/szt (2× cegła)", () => {
      const m = findCanonicalL0("Wykucie otworu pod puszkę w betonie", "szt");
      expect(m?.laborNorm).toBe(0.40);
    });
  });

  describe("Breakers / RCD / Measurements", () => {
    it("Wyłącznik różnicowoprądowy 4P → KNR 5-08 0212, 0.30 rbh/szt", () => {
      const m = findCanonicalL0("Wyłącznik różnicowoprądowy AC 25A/30mA 4P", "szt");
      expect(m?.knrCode).toBe("KNR 5-08 0212");
      expect(m?.laborNorm).toBe(0.30);
    });

    it("Wyłącznik nadprądowy 1P (B16) → 0.20 rbh/szt", () => {
      const m = findCanonicalL0("Wyłącznik nadprądowy B16 1P", "szt");
      expect(m?.laborNorm).toBe(0.20);
    });

    it("Pomiar rezystancji izolacji → ES-POM-001, 0.30 rbh/szt", () => {
      const m = findCanonicalL0("Pomiar rezystancji izolacji obwodu", "szt");
      expect(m?.knrCode).toBe("ES-POM-001");
      expect(m?.laborNorm).toBe(0.30);
    });

    it("Czujka dymu SSP → KNR 5-09 0602-01, 0.40 rbh/szt", () => {
      const m = findCanonicalL0("Czujka dymu optyczna (SSP)", "szt");
      expect(m?.knrCode).toBe("KNR 5-09 0602-01");
      expect(m?.laborNorm).toBe(0.40);
    });
  });

  describe("Unit compatibility", () => {
    it("mb ↔ m alias (linear units)", () => {
      const a = findCanonicalL0("Przewód YDYp 3×1.5", "mb");
      const b = findCanonicalL0("Przewód YDYp 3×1.5", "m");
      expect(a?.laborNorm).toBe(b?.laborNorm);
    });

    it("szt ↔ kpl alias (point units)", () => {
      const a = findCanonicalL0("Gniazdo 230V p/t pojedyncze", "szt");
      const b = findCanonicalL0("Gniazdo 230V p/t pojedyncze", "kpl");
      expect(a?.laborNorm).toBe(b?.laborNorm);
    });

    it("Unit mismatch (mb item vs szt canonical) → null", () => {
      // Gniazdo (canonical = szt) probed with mb unit must return null
      const m = findCanonicalL0("Gniazdo 230V p/t pojedyncze", "mb");
      expect(m).toBeNull();
    });

    it("Empty / null inputs → null", () => {
      expect(findCanonicalL0("", "szt")).toBeNull();
      expect(findCanonicalL0("Gniazdo", "")).toBeNull();
      expect(findCanonicalL0(null, "szt")).toBeNull();
      expect(findCanonicalL0("Gniazdo", undefined)).toBeNull();
    });
  });

  describe("No-match cases (rare / unknown items)", () => {
    it("Unknown industrial item → null (falls through to L1/L2/L3)", () => {
      const m = findCanonicalL0("Specjalistyczna szafa SCADA z osprzętem 19''", "szt");
      expect(m).toBeNull();
    });

    it("Generic too-vague item → null", () => {
      const m = findCanonicalL0("Robocizna ogólna", "rbh");
      expect(m).toBeNull();
    });
  });
});

describe("validateAgainstCanonicalL0 — AI hallucination detection", () => {
  it("AI norm matches canonical → ok", () => {
    const r = validateAgainstCanonicalL0("YDYp 3×1.5", "mb", 0.13);
    expect(r.ok).toBe(true);
  });

  it("AI norm within 50% tolerance → ok", () => {
    const r = validateAgainstCanonicalL0("YDYp 3×1.5", "mb", 0.18);
    expect(r.ok).toBe(true);
  });

  it("AI norm 5× too HIGH (RJ45 = 8.5 rbh) → REJECTED", () => {
    const r = validateAgainstCanonicalL0("Gniazdo RJ45 cat 6 p/t", "szt", 8.5);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.baseline).toBe(0.5);
      expect(r.deviation).toBeGreaterThan(3);
      expect(r.canonical.knrCode).toBe("KNR 5-09 0106");
    }
  });

  it("AI norm 5× too LOW (YDYp = 0.025) → REJECTED", () => {
    const r = validateAgainstCanonicalL0("Przewód YDYp 3×1.5", "mb", 0.025);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.baseline).toBe(0.13);
      expect(r.deviation).toBeLessThan(0.33);
    }
  });

  it("Bruzd cegła AI=0.20 (4× too LOW vs canonical 0.85) → REJECTED", () => {
    const r = validateAgainstCanonicalL0("Bruzdowanie w cegle (1 przewód)", "mb", 0.20);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.canonical.laborNorm).toBe(0.85);
    }
  });

  it("Bruzd beton AI=0.25 (8× too LOW vs canonical 2.00) → REJECTED", () => {
    const r = validateAgainstCanonicalL0("Bruzdowanie w betonie", "mb", 0.25);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.canonical.laborNorm).toBe(2.0);
    }
  });

  it("Unknown item (no canonical baseline) → ok=true, baseline=null", () => {
    const r = validateAgainstCanonicalL0("Specjalistyczne urządzenie XYZ", "szt", 999);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.baseline).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════
 * v2.7.0 EXPANSION TESTS — +40 NEW ENTRIES
 * ═══════════════════════════════════════════════════════════════════ */

describe("L0 v2.7.0 — Łącznik specialized (PIR / kartowy)", () => {
  it("Łącznik z czujnikiem ruchu PIR → 0.81 rbh/szt (NOT generic 0.25)", () => {
    const m = findCanonicalL0("Łącznik z czujnikiem ruchu PIR", "szt");
    expect(m?.knrCode).toBe("KNR 5-04 0501-08");
    expect(m?.laborNorm).toBe(0.81);
  });

  it("Łącznik kartowy hotelowy → 0.50 rbh/szt", () => {
    const m = findCanonicalL0("Łącznik kartowy hotelowy 230V", "szt");
    expect(m?.knrCode).toBe("KNR 5-04 0501-09");
    expect(m?.laborNorm).toBe(0.50);
  });

  it("Generic łącznik fallback still works (precedence preserved)", () => {
    const m = findCanonicalL0("Łącznik 1-biegunowy biały", "szt");
    expect(m?.laborNorm).toBe(0.25);
  });
});

describe("L0 v2.7.0 — Oprawy specialized (plafon / kinkiet / ogrodowa / reflektor / listwa LED)", () => {
  it("Plafon LED sufitowy → 0.68 rbh/szt (NOT generic 0.40)", () => {
    const m = findCanonicalL0("Plafon LED sufitowy 24W", "szt");
    expect(m?.knrCode).toBe("KNR 5-04 0303-11");
    expect(m?.laborNorm).toBe(0.68);
  });

  it("Kinkiet ścienny LED → 0.65 rbh/szt", () => {
    const m = findCanonicalL0("Kinkiet ścienny LED zewnętrzny", "szt");
    expect(m?.laborNorm).toBe(0.65);
  });

  it("Lampa ogrodowa słupkowa → 1.20 rbh/szt", () => {
    const m = findCanonicalL0("Lampa ogrodowa słupkowa LED 60cm", "szt");
    expect(m?.laborNorm).toBe(1.20);
  });

  it("Reflektor LED → 0.55 rbh/szt", () => {
    const m = findCanonicalL0("Reflektor LED 50W IP65", "szt");
    expect(m?.laborNorm).toBe(0.55);
  });

  it("Naświetlacz LED → 0.55 rbh/szt", () => {
    const m = findCanonicalL0("Naświetlacz LED 100W", "szt");
    expect(m?.laborNorm).toBe(0.55);
  });

  it("Listwa LED kpl → 1.22 rbh/kpl", () => {
    const m = findCanonicalL0("Listwa LED 5m z zasilaczem", "kpl");
    expect(m?.knrCode).toBe("KNR 5-04 0303-30");
    expect(m?.laborNorm).toBe(1.22);
  });

  it("Taśma LED kpl → 1.22 rbh/kpl", () => {
    const m = findCanonicalL0("Taśma LED RGB 5m", "kpl");
    expect(m?.laborNorm).toBe(1.22);
  });

  it("Generic oprawa fallback still works → 0.40 rbh/szt", () => {
    const m = findCanonicalL0("Oprawa biurowa standardowa", "szt");
    expect(m?.laborNorm).toBe(0.40);
  });
});

describe("L0 v2.7.0 — Sterowanie / automatyka", () => {
  it("Ściemniacz / dimmer → 0.82 rbh/szt", () => {
    const m = findCanonicalL0("Ściemniacz obrotowy 600W", "szt");
    expect(m?.knrCode).toBe("KNR 5-04 0501-10");
    expect(m?.laborNorm).toBe(0.82);
  });

  it("Czujnik ruchu PIR (NOT 'Łącznik z PIR') → 0.81 rbh/szt", () => {
    const m = findCanonicalL0("Czujnik ruchu PIR sufitowy", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0410");
    expect(m?.laborNorm).toBe(0.81);
  });

  it("Czujnik zmierzchowy → 0.65 rbh/szt", () => {
    const m = findCanonicalL0("Czujnik zmierzchowy IP44", "szt");
    expect(m?.laborNorm).toBe(0.65);
  });

  it("Termostat pokojowy → 0.55 rbh/szt", () => {
    const m = findCanonicalL0("Termostat pokojowy programowalny", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0501");
    expect(m?.laborNorm).toBe(0.55);
  });

  it("Regulator obrotów wentylatora → 0.45 rbh/szt", () => {
    const m = findCanonicalL0("Regulator obrotów wentylatora 230V", "szt");
    expect(m?.laborNorm).toBe(0.45);
  });
});

describe("L0 v2.7.0 — Rozdzielnice komponenty", () => {
  it("Obudowa rozdzielnicy 24-mod p/t → 3.00 rbh/szt", () => {
    const m = findCanonicalL0("Obudowa rozdzielnicy p/t 24 modułów", "szt");
    expect(m?.knrCode).toBe("KNR 5-08 0302");
    expect(m?.laborNorm).toBe(3.00);
  });

  it("Obudowa rozdzielnicy 12-mod p/t → 1.80 rbh/szt", () => {
    const m = findCanonicalL0("Rozdzielnica p/t 12 modułów RP-12", "szt");
    expect(m?.knrCode).toBe("KNR 5-08 0301");
    expect(m?.laborNorm).toBe(1.80);
  });

  it("Listwa zaciskowa N/PE → 0.20 rbh/szt", () => {
    const m = findCanonicalL0("Listwa zaciskowa N w rozdzielnicy", "szt");
    expect(m?.laborNorm).toBe(0.20);
  });

  it("Lampka kontrolna sygnalizacyjna → 0.15 rbh/szt", () => {
    const m = findCanonicalL0("Lampka kontrolna LED 230V czerwona", "szt");
    expect(m?.laborNorm).toBe(0.15);
  });

  it("Opisanie obwodów → 0.10 rbh/szt", () => {
    const m = findCanonicalL0("Opisanie obwodów rozdzielnicy", "szt");
    expect(m?.knrCode).toBe("ES-RPN-001");
    expect(m?.laborNorm).toBe(0.10);
  });
});

describe("L0 v2.7.0 — Antena / SAT / RTV", () => {
  it("Antena DVB-T → 1.50 rbh/szt", () => {
    const m = findCanonicalL0("Antena DVB-T2 zewnętrzna", "szt");
    expect(m?.knrCode).toBe("KNR 5-12 0401");
    expect(m?.laborNorm).toBe(1.50);
  });

  it("Antena satelitarna → 1.50 rbh/szt", () => {
    const m = findCanonicalL0("Antena satelitarna 80cm", "szt");
    expect(m?.laborNorm).toBe(1.50);
  });

  it("Multiswitch → 0.80 rbh/szt", () => {
    const m = findCanonicalL0("Multiswitch 5/8 SAT", "szt");
    expect(m?.laborNorm).toBe(0.80);
  });

  it("Wzmacniacz antenowy → 0.50 rbh/szt", () => {
    const m = findCanonicalL0("Wzmacniacz antenowy szerokopasmowy", "szt");
    expect(m?.laborNorm).toBe(0.50);
  });

  it("Maszt antenowy → 2.50 rbh/szt", () => {
    const m = findCanonicalL0("Maszt antenowy 3m ocynkowany", "szt");
    expect(m?.laborNorm).toBe(2.50);
  });
});

describe("L0 v2.7.0 — Domofony", () => {
  it("Panel zewnętrzny domofonu → 1.20 rbh/szt", () => {
    const m = findCanonicalL0("Panel zewnętrzny wideodomofonu z kamerą", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0801");
    expect(m?.laborNorm).toBe(1.20);
  });

  it("Unifon → 0.80 rbh/szt", () => {
    const m = findCanonicalL0("Unifon słuchawkowy domofonu", "szt");
    expect(m?.laborNorm).toBe(0.80);
  });

  it("Wideounifon → 0.80 rbh/szt", () => {
    const m = findCanonicalL0("Wideounifon 7'' kolorowy", "szt");
    expect(m?.laborNorm).toBe(0.80);
  });

  it("Czytnik kart RFID → 0.65 rbh/szt", () => {
    const m = findCanonicalL0("Czytnik kart RFID Mifare 13.56MHz", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0803");
    expect(m?.laborNorm).toBe(0.65);
  });
});

describe("L0 v2.7.0 — Korytka / drabinki / kanały", () => {
  it("Drabinka kablowa → 0.55 rbh/mb", () => {
    const m = findCanonicalL0("Drabinka kablowa 200mm ocynk", "mb");
    expect(m?.knrCode).toBe("KNR 5-08 0502");
    expect(m?.laborNorm).toBe(0.55);
  });

  it("Korytko kablowe metalowe → 0.40 rbh/mb", () => {
    const m = findCanonicalL0("Korytko kablowe metalowe 100×60", "mb");
    expect(m?.laborNorm).toBe(0.40);
  });

  it("Korytko siatkowe → 0.40 rbh/mb", () => {
    const m = findCanonicalL0("Korytko siatkowe druciane 100mm", "mb");
    expect(m?.laborNorm).toBe(0.40);
  });

  it("Listwa PCV instalacyjna → 0.20 rbh/mb", () => {
    const m = findCanonicalL0("Listwa PCV instalacyjna 25×16", "mb");
    expect(m?.laborNorm).toBe(0.20);
  });

  it("Kanał kablowy → 0.20 rbh/mb", () => {
    const m = findCanonicalL0("Kanał kablowy parapetowy 100×50", "mb");
    expect(m?.laborNorm).toBe(0.20);
  });
});

describe("L0 v2.7.0 — Pomiary rozszerzone", () => {
  it("Pomiar natężenia oświetlenia (luksomierz) → 0.35 rbh/szt", () => {
    const m = findCanonicalL0("Pomiar natężenia oświetlenia luksomierzem", "szt");
    expect(m?.knrCode).toBe("ES-POM-005");
    expect(m?.laborNorm).toBe(0.35);
  });

  it("Pomiar ciągłości przewodów ochronnych → 0.20 rbh/szt", () => {
    const m = findCanonicalL0("Pomiar ciągłości przewodów ochronnych PE", "szt");
    expect(m?.knrCode).toBe("ES-POM-006");
    expect(m?.laborNorm).toBe(0.20);
  });

  it("Protokół końcowy z pomiarów → 1.50 rbh/kpl", () => {
    const m = findCanonicalL0("Protokół końcowy z pomiarów elektrycznych", "kpl");
    expect(m?.knrCode).toBe("ES-POM-099");
    expect(m?.laborNorm).toBe(1.50);
  });
});

describe("L0 v2.7.0 — SSP / DSO rozszerzenie", () => {
  it("Centrala SSP → 5.00 rbh/szt", () => {
    const m = findCanonicalL0("Centrala SSP 8-strefowa Polon-Alfa", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0610");
    expect(m?.laborNorm).toBe(5.00);
  });

  it("Moduł kontrolno-sterujący SSP → 1.20 rbh/szt", () => {
    const m = findCanonicalL0("Moduł kontrolno-sterujący 2 wejścia/2 wyjścia", "szt");
    expect(m?.laborNorm).toBe(1.20);
  });

  it("Czujka zalania → 0.40 rbh/szt", () => {
    const m = findCanonicalL0("Czujka zalania wodne", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0612");
    expect(m?.laborNorm).toBe(0.40);
  });

  it("Czujka gazu → 0.40 rbh/szt", () => {
    const m = findCanonicalL0("Czujka gazu metanu domowa", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0613");
    expect(m?.laborNorm).toBe(0.40);
  });

  it("Detektor gazu → 0.40 rbh/szt", () => {
    const m = findCanonicalL0("Detektor gazu LPG", "szt");
    expect(m?.laborNorm).toBe(0.40);
  });

  it("Czujka dymu (existing) NOT overridden by gas pattern → 0.40 / KNR 5-09 0602-01", () => {
    const m = findCanonicalL0("Czujka dymu optyczna SSP", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0602-01");
  });
});

describe("L0 v2.7.0 — SSWiN / systemy alarmowe", () => {
  it("Centrala alarmowa SSWiN → 4.50 rbh/szt", () => {
    const m = findCanonicalL0("Centrala alarmowa SSWiN Satel", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0620");
    expect(m?.laborNorm).toBe(4.50);
  });

  it("Czujka kontaktron magnetyczny → 0.30 rbh/szt", () => {
    const m = findCanonicalL0("Kontaktron magnetyczny do drzwi", "szt");
    expect(m?.laborNorm).toBe(0.30);
  });

  it("Manipulator SSWiN → 0.80 rbh/szt", () => {
    const m = findCanonicalL0("Manipulator alarmowy LCD", "szt");
    expect(m?.laborNorm).toBe(0.80);
  });

  it("Sygnalizator alarmowy zewnętrzny → 0.90 rbh/szt", () => {
    const m = findCanonicalL0("Sygnalizator alarmowy zewnętrzny IP65", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0623");
    expect(m?.laborNorm).toBe(0.90);
  });

  it("Existing 'Sygnalizator akustyczno-optyczny' NOT clobbered by SSWiN pattern", () => {
    // Existing pattern should still match — akustyczno-optyczny precedence preserved
    const m = findCanonicalL0("Sygnalizator akustyczno-optyczny", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0604-01");
    expect(m?.laborNorm).toBe(0.50);
  });
});

describe("L0 v2.7.0 — Uziemienie / ochrona odgromowa", () => {
  it("Bednarka FeZn 25×4 → 0.45 rbh/mb", () => {
    const m = findCanonicalL0("Bednarka FeZn 25×4 ocynkowana", "mb");
    expect(m?.knrCode).toBe("KNR 5-08 0701");
    expect(m?.laborNorm).toBe(0.45);
  });

  it("Pręt uziemiający → 1.50 rbh/szt", () => {
    const m = findCanonicalL0("Pręt uziemiający 1.5m FeZn", "szt");
    expect(m?.laborNorm).toBe(1.50);
  });

  it("Sonda uziemiająca → 1.50 rbh/szt", () => {
    const m = findCanonicalL0("Sonda uziemiająca głębinowa", "szt");
    expect(m?.laborNorm).toBe(1.50);
  });

  it("Złącze kontrolne uziemienia → 0.50 rbh/szt", () => {
    const m = findCanonicalL0("Złącze kontrolne uziemienia w obudowie", "szt");
    expect(m?.laborNorm).toBe(0.50);
  });
});

describe("L0 v2.7.0 — Precedence regression (no clobbering)", () => {
  it("Czujka dymu still wins over generic czujka pattern", () => {
    const m = findCanonicalL0("Czujka dymu optyczna", "szt");
    expect(m?.knrCode).toBe("KNR 5-09 0602-01");
  });

  it("Existing Wyłącznik różnicowoprądowy still wins (no łącznik fallback)", () => {
    const m = findCanonicalL0("Wyłącznik różnicowoprądowy 4P 40A/30mA", "szt");
    expect(m?.knrCode).toBe("KNR 5-08 0212");
    expect(m?.laborNorm).toBe(0.30);
  });

  it("Existing Bruzdowanie cegła not affected by new substrate-aware patterns", () => {
    const m = findCanonicalL0("Bruzdowanie w cegle (1 przewód)", "mb");
    expect(m?.laborNorm).toBe(0.85);
  });

  it("New Plafon does NOT match generic Oprawa fallback (different norm)", () => {
    const m1 = findCanonicalL0("Plafon LED 24W", "szt");
    const m2 = findCanonicalL0("Oprawa standardowa", "szt");
    expect(m1?.laborNorm).toBe(0.68);
    expect(m2?.laborNorm).toBe(0.40);
    expect(m1?.laborNorm).not.toBe(m2?.laborNorm);
  });
});
