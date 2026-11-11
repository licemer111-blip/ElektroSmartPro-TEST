export interface OfferTerms {
  validDays: number;
  paymentDays: number;
  depositPercent: number | null;
}

const MARK = /^\[\[ES1\|(\d{1,3})\|(\d{1,3})\|(\d{0,3}(?:[.,]\d{1,2})?)\]\]\r?\n?/;

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export const DEFAULT_OFFER_TERMS: OfferTerms = {
  validDays: 14,
  paymentDays: 14,
  depositPercent: null,
};

export function splitOfferNotes(raw: string | null | undefined): { terms: OfferTerms; notes: string } {
  const text = raw ?? "";
  const match = text.match(MARK);
  if (!match) return { terms: { ...DEFAULT_OFFER_TERMS }, notes: text };
  const depositRaw = match[3].replace(",", ".");
  const deposit = depositRaw === "" ? null : clamp(Number(depositRaw), 0, 100);
  return {
    terms: {
      validDays: clamp(Number(match[1]), 1, 365),
      paymentDays: clamp(Number(match[2]), 0, 365),
      depositPercent: deposit != null && deposit > 0 ? deposit : null,
    },
    notes: text.slice(match[0].length),
  };
}

export function joinOfferNotes(terms: OfferTerms, notes: string): string {
  const validDays = clamp(terms.validDays, 1, 365);
  const paymentDays = clamp(terms.paymentDays, 0, 365);
  const deposit = terms.depositPercent != null && terms.depositPercent > 0
    ? String(clamp(terms.depositPercent, 1, 100))
    : "";
  return `[[ES1|${validDays}|${paymentDays}|${deposit}]]\n${notes ?? ""}`;
}

export function offerTermsLines(
  terms: OfferTerms,
  gross: number,
  hideAmount = false,
  amountKind: "netto" | "brutto" = "brutto",
): string[] {
  const lines = [
    `Oferta ważna ${clamp(terms.validDays, 1, 365)} dni od daty wystawienia.`,
    `Termin płatności: ${clamp(terms.paymentDays, 0, 365)} dni.`,
  ];
  if (terms.depositPercent != null && terms.depositPercent > 0) {
    const pct = clamp(terms.depositPercent, 1, 100);
    const amount = Math.round(gross * pct) / 100;
    if (hideAmount) {
      lines.push(`Zaliczka ${pct}% przed rozpoczęciem prac. Reszta po odbiorze.`);
    } else {
      const [whole, frac] = amount.toFixed(2).split(".");
      const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      lines.push(`Zaliczka ${pct}% (${grouped},${frac} zł ${amountKind}) przed rozpoczęciem prac. Reszta po odbiorze.`);
    }
  }
  return lines;
}
