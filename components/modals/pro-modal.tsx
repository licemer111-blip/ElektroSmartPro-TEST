"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useModalStore } from "@/hooks/use-modal-store";
import { Crown, CheckCircle, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VATSelector, type VATRate } from "@/components/subscription/vat-selector";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  "Nielimitowana liczba projektów",
  "Pełny dostęp do cen i kalkulacji",
  "Eksport PDF z logo firmy",
  "ES Import + Baza KNR",
];

export function ProModal() {
  const { isOpen, type, onClose } = useModalStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVAT, setSelectedVAT] = useState<VATRate>(23);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const isModalOpen = isOpen && type === "proModal";

  const monthlyPrice = 159;
  const yearlyPrice = monthlyPrice * 10;

  const handleUpgrade = async () => {
    setIsLoading(true);
    import("@/app/admin/actions").then(({ logAnalyticsEvent }) =>
      logAnalyticsEvent("upgrade_click")
    );
    try {
      const response = await fetch("/api/billing/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle, vatRate: selectedVAT }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || "Błąd płatności.");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Nie otrzymano adresu płatności.");
      }
    } catch (error: unknown) {
      setIsLoading(false);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-6 py-5 text-white">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-2">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold leading-tight">
                  Przejdź na PRO
                </DialogTitle>
                <DialogDescription className="text-orange-100 text-xs mt-0.5">
                  Osiągnięto limit wersji Demo
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Features */}
          <div className="grid grid-cols-2 gap-1.5">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Billing toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`flex-1 rounded-lg border-2 py-2.5 px-3 text-center transition-all ${
                billingCycle === "monthly"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="text-xs text-muted-foreground">Miesięcznie</div>
              <div className="font-bold text-base">{monthlyPrice} zł</div>
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`flex-1 rounded-lg border-2 py-2.5 px-3 text-center transition-all relative ${
                billingCycle === "yearly"
                  ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <Badge className="absolute -top-2 -right-2 bg-green-600 text-white text-[10px] px-1.5 py-0">
                -17%
              </Badge>
              <div className="text-xs text-muted-foreground">Rocznie</div>
              <div className="font-bold text-base">{yearlyPrice} zł</div>
            </button>
          </div>

          {/* VAT */}
          <VATSelector
            onVATChange={setSelectedVAT}
            defaultRate={23}
            billingCycle={billingCycle}
          />

          {/* CTA */}
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold"
            onClick={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Przekierowywanie...</>
            ) : (
              "Upgrade do PRO →"
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Lock className="w-3 h-3" />
            <span>Bezpieczne płatności • 14 dni gwarancji zwrotu</span>
          </div>

          <button
            onClick={onClose}
            className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
            disabled={isLoading}
          >
            Może później
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
