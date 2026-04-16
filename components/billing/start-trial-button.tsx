"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TRIAL_DURATION_DAYS } from "@/lib/auth/entitlements";

interface StartTrialButtonProps {
  /** Custom label; defaults to "Start 7-dniowego darmowego trialu". */
  label?: string;
  /** Called after successful activation (e.g. to refresh parent state). */
  onActivated?: () => void;
  /** Visual variant: full CTA or compact pill. */
  variant?: "cta" | "compact";
  className?: string;
}

/**
 * v2.1 UI entry point for activating the 7-day free PRO trial.
 *
 * Flow:
 *   1. POST /api/billing/start-trial
 *   2. Show success toast + refresh the current page (fresh server data
 *      will flip all entitlement flags to PRO across the UI)
 *   3. If already-used or already-pro → show appropriate info toast
 *
 * No card collected. Single-button activation.
 */
export function StartTrialButton({
  label,
  onActivated,
  variant = "cta",
  className = "",
}: StartTrialButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/billing/start-trial", { method: "POST" });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409) {
        toast({
          title: "Trial już wykorzystany",
          description:
            data?.error ?? "Twój trial 7-dniowy został już wykorzystany. Aktywuj PRO (159 zł/m-c), aby odblokować AI i czysty PDF.",
          variant: "destructive",
        });
        return;
      }

      if (!res.ok) {
        toast({
          title: "Błąd",
          description: data?.error ?? "Nie udało się aktywować trialu.",
          variant: "destructive",
        });
        return;
      }

      if (data?.alreadyPro) {
        toast({
          title: "Masz już PRO",
          description: "Trial nie jest potrzebny — wszystkie funkcje są odblokowane.",
        });
        return;
      }

      if (data?.started) {
        toast({
          title: `🚀 Trial aktywny przez ${TRIAL_DURATION_DAYS} dni`,
          description:
            "Wszystkie funkcje PRO są odblokowane: AI bez limitów, czysty PDF, Portal Klienta, pełna baza KNR 2026.",
        });
      } else if (data?.active) {
        toast({
          title: "Trial już działa",
          description: "Twój trial jest aktywny — korzystaj ze wszystkich funkcji PRO.",
        });
      }

      onActivated?.();
      // Server components re-render with fresh is_pro effective state.
      router.refresh();
    } catch (err) {
      const description = err instanceof Error ? err.message : "Spróbuj ponownie.";
      toast({ title: "Błąd sieci", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const effectiveLabel = label ?? `Aktywuj ${TRIAL_DURATION_DAYS}-dniowy trial PRO za darmo`;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                    bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-70 disabled:cursor-not-allowed
                    transition-colors ${className}`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Rocket className="w-3 h-3" />
        )}
        <span>{loading ? "Aktywuję..." : "Trial 7 dni"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold
                  bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
                  text-white shadow-md shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70
                  transition-all ${className}`}
      aria-label="Aktywuj darmowy trial PRO"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Rocket className="w-4 h-4" />
      )}
      <span>{loading ? "Aktywuję trial..." : effectiveLabel}</span>
    </button>
  );
}
