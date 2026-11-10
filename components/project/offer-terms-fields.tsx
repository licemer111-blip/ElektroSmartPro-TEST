"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OfferTerms } from "@/lib/offer-terms";

interface OfferTermsFieldsProps {
  terms: OfferTerms;
  onChange: (terms: OfferTerms) => void;
  disabled?: boolean;
  idPrefix?: string;
}

export function OfferTermsFields({ terms, onChange, disabled, idPrefix = "offer" }: OfferTermsFieldsProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-valid-days`} className="text-xs">Ważność oferty (dni)</Label>
        <Input
          id={`${idPrefix}-valid-days`}
          name={`${idPrefix}-valid-days`}
          type="number"
          min={1}
          max={365}
          inputMode="numeric"
          value={terms.validDays}
          disabled={disabled}
          onChange={(e) => onChange({ ...terms, validDays: Number(e.target.value) || 1 })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-payment-days`} className="text-xs">Termin płatności (dni)</Label>
        <Input
          id={`${idPrefix}-payment-days`}
          name={`${idPrefix}-payment-days`}
          type="number"
          min={0}
          max={365}
          inputMode="numeric"
          value={terms.paymentDays}
          disabled={disabled}
          onChange={(e) => onChange({ ...terms, paymentDays: Number(e.target.value) || 0 })}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-deposit`} className="text-xs">Zaliczka (%)</Label>
        <Input
          id={`${idPrefix}-deposit`}
          name={`${idPrefix}-deposit`}
          type="number"
          min={0}
          max={100}
          inputMode="decimal"
          placeholder="brak"
          value={terms.depositPercent ?? ""}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value.trim();
            onChange({ ...terms, depositPercent: raw === "" ? null : Number(raw) });
          }}
        />
      </div>
    </div>
  );
}
