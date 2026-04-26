import { describe, it, expect } from "vitest";
import { GROOVE_RE } from "../app/dashboard/projects/[id]/_ai_actions/pricing-helpers";

/**
 * Regression test for v2.6.1 GROOVE_RE bug.
 *
 * Bug: GROOVE_RE was `/\b(bruzd|kucie|rowek|kanal)\b/i`. Trailing `\b`
 * after the Polish stem `bruzd` failed on "Bruzdowanie" because the
 * next char `o` is a word char (no boundary). applySanityCheck then
 * used the strict cable-laying cap 0.35 rbh/mb instead of groove cap
 * 3.0 rbh/mb — zeroing canonical norms (cegła 0.85, beton 2.00).
 *
 * Fix: `/\b(?:bruzd|kuci|wykuci|rowek|kanal|kuc[ie])/i` (no trailing \b).
 */
describe("GROOVE_RE — Polish stem matching (v2.6.1 regression)", () => {
  it("matches 'Bruzdowanie w cegle (1 przewód)' (canonical L0 entry)", () => {
    expect(GROOVE_RE.test("Bruzdowanie w cegle (1 przewód)")).toBe(true);
  });

  it("matches 'Bruzdowanie w betonie' (canonical L0 entry)", () => {
    expect(GROOVE_RE.test("Bruzdowanie w betonie")).toBe(true);
  });

  it("matches 'Bruzdowanie w żelbecie'", () => {
    expect(GROOVE_RE.test("Bruzdowanie w żelbecie (1 przewód)")).toBe(true);
  });

  it("matches 'Wykucie otworu pod puszkę Ø60 w cegle' (wykuci stem)", () => {
    expect(GROOVE_RE.test("Wykucie otworu pod puszkę Ø60 w cegle")).toBe(true);
  });

  it("matches 'Kucie cegły' (bare kuci stem)", () => {
    expect(GROOVE_RE.test("Kucie cegły")).toBe(true);
  });

  it("matches 'Rowek pod kabel'", () => {
    expect(GROOVE_RE.test("Rowek pod kabel")).toBe(true);
  });

  it("does NOT match 'Przewód YDYp 3x1.5 mm²' (cable laying)", () => {
    expect(GROOVE_RE.test("Przewód YDYp 3x1.5 mm²")).toBe(false);
  });

  it("does NOT match 'Gniazdo 230V p/t pojedyncze' (osprzęt)", () => {
    expect(GROOVE_RE.test("Gniazdo 230V p/t pojedyncze")).toBe(false);
  });
});
