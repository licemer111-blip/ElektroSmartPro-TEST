"use client";

import { useState } from "react";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PAY_PER_EXPORT_PRICE_PLN } from "@/lib/config/tier-limits";

interface UnlockPdfButtonProps {
  projectId: string;
  /** Whether the unlock is ALREADY paid and active — shows a different state. */
  alreadyUnlocked?: boolean;
  className?: string;
}

/**
 * v2.0 Pay-per-Export button.
 *
 * One-time 29 zł payment to unlock a single clean PDF for THIS project.
 * POSTs to /api/billing/pay-per-export → Stripe Checkout → webhook flips the
 * project flag → next PDF export skips the DEMO watermark (and consumes the flag).
 *
 * Styling: intentionally prominent but NOT competing with the primary PDF button.
 * The primary CTA is still "generuj PDF" (works for free, with watermark).
 */
export function UnlockPdfButton({ projectId, alreadyUnlocked = false, className = "" }: UnlockPdfButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (alreadyUnlocked) {
    return (
      <div
        className={`flex items-start gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 ${className}`}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-[11px] text-emerald-800 dark:text-emerald-200 leading-tight">
          <p className="font-semibold">Eksport odblokowany</p>
          <p className="opacity-80">
            Kliknij „PDF”, aby pobrać jeden czysty egzemplarz bez znaku „DEMO”.
            Po pobraniu odblokowanie zostanie wykorzystane.
          </p>
        </div>
      </div>
    );
  }

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing/pay-per-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          typeof data?.error === "string" ? data.error : "Nie udało się zainicjować płatności.";
        toast({ title: "Błąd płatności", description: msg, variant: "destructive" });
        return;
      }

      if (data?.alreadyUnlocked) {
        toast({
          title: "Ten projekt jest już odblokowany",
          description:
            data?.message ?? "Wygeneruj PDF, aby wykorzystać opłacony eksport.",
        });
        return;
      }

      if (typeof data?.url === "string") {
        // Redirect to Stripe Checkout (hosted)
        window.location.href = data.url;
        return;
      }

      toast({
        title: "Błąd płatności",
        description: "Stripe nie zwrócił adresu płatności. Spróbuj ponownie.",
        variant: "destructive",
      });
    } catch (err) {
      const description = err instanceof Error ? err.message : "Spróbuj ponownie.";
      toast({ title: "Błąd sieci", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold
                  bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
                  text-white shadow-md shadow-orange-500/20 disabled:cursor-not-allowed disabled:opacity-70
                  transition-all ${className}`}
      aria-label={`Odblokuj czysty PDF za ${PAY_PER_EXPORT_PRICE_PLN} zł`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      <span>
        {loading
          ? "Przekierowuję do płatności..."
          : `Odblokuj czysty PDF — ${PAY_PER_EXPORT_PRICE_PLN} zł`}
      </span>
    </button>
  );
}
