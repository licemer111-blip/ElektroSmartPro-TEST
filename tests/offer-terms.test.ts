import { describe, expect, it } from "vitest";
import { joinOfferNotes, offerTermsLines, splitOfferNotes } from "@/lib/offer-terms";

describe("offer terms", () => {
  it("keeps the marker out of the printed notes", () => {
    const stored = joinOfferNotes({ validDays: 21, paymentDays: 7, depositPercent: 40 }, "Bez rusztowania");
    const parsed = splitOfferNotes(stored);
    expect(parsed.notes).toBe("Bez rusztowania");
    expect(parsed.terms).toEqual({ validDays: 21, paymentDays: 7, depositPercent: 40 });
    expect(parsed.notes.includes("[[ES1")).toBe(false);
  });

  it("prints a deposit only when the electrician sets one", () => {
    const plain = offerTermsLines({ validDays: 14, paymentDays: 14, depositPercent: null }, 1000);
    expect(plain.some((line) => line.includes("Zaliczka"))).toBe(false);
    const withDeposit = offerTermsLines({ validDays: 14, paymentDays: 14, depositPercent: 40 }, 1000);
    expect(withDeposit.some((line) => line.includes("400,00 zł"))).toBe(true);
  });

  it("hides the deposit amount on a blind estimate", () => {
    const lines = offerTermsLines({ validDays: 14, paymentDays: 14, depositPercent: 40 }, 1000, true);
    expect(lines.some((line) => line.includes("zł"))).toBe(false);
    expect(lines.some((line) => line.includes("40%"))).toBe(true);
  });
});
