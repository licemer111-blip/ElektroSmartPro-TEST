"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OfferTerms } from "@/lib/offer-terms";

interface OfferTermsFieldsProps {
  terms: OfferTerms;
  onChange: (terms: OfferTerms) => void;
  disabled?: boolean;
  idPrefix?: string;
  onBlur?: () => void;
}

export function OfferTermsFields({ terms, onChange, disabled, idPrefix = "offer", onBlur }: OfferTermsFieldsProps) {
  const fieldClass = "h-8 bg-white dark:bg-slate-800 dark:text-slate-100";
  return (
    <div className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-valid-days`} className="text-xs text-slate-600 dark:text-slate-300">Ważność oferty</Label>
          <div className="relative">
            <Input
              id={`${idPrefix}-valid-days`}
              name={`${idPrefix}-valid-days`}
              type="number"
              min={1}
              max={365}
              inputMode="numeric"
              value={terms.validDays}
              disabled={disabled}
              className={`${fieldClass} pr-10`}
              onChange={(e) => onChange({ ...terms, validDays: Number(e.target.value) || 1 })}
              onBlur={onBlur}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">dni</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-payment-days`} className="text-xs text-slate-600 dark:text-slate-300">Termin płatności</Label>
          <div className="relative">
            <Input
              id={`${idPrefix}-payment-days`}
              name={`${idPrefix}-payment-days`}
              type="number"
              min={0}
              max={365}
              inputMode="numeric"
              value={terms.paymentDays}
              disabled={disabled}
              className={`${fieldClass} pr-10`}
              onChange={(e) => onChange({ ...terms, paymentDays: Number(e.target.value) || 0 })}
              onBlur={onBlur}
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">dni</span>
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-deposit`} className="text-xs text-slate-600 dark:text-slate-300">Zaliczka</Label>
        <div className="relative">
          <Input
            id={`${idPrefix}-deposit`}
            name={`${idPrefix}-deposit`}
            type="number"
            min={0}
            max={100}
            inputMode="decimal"
            placeholder="bez zaliczki"
            value={terms.depositPercent ?? ""}
            disabled={disabled}
            className={`${fieldClass} pr-8`}
              onChange={(e) => {
              const raw = e.target.value.trim();
              onChange({ ...terms, depositPercent: raw === "" ? null : Number(raw) });
            }}
              onBlur={onBlur}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
        </div>
        <p className="text-[10px] text-slate-500">Puste pole — w PDF nie będzie linii zaliczki.</p>
      </div>
    </div>
  );
}
