"use client";

import { useState } from "react";
import { VATSelector, type VATRate } from "./vat-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, CheckCircle, Loader2, Zap, Shield, FileText, Infinity, DollarSign, Headphones } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export function CheckoutForm() {
  const [selectedVAT, setSelectedVAT] = useState<VATRate>(23);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const monthlyPrice = 159;
  const yearlyPrice = monthlyPrice * 10;
  const savingsPercent = 17;

  const handleCheckout = async () => {
    setIsLoading(true);
    import("@/app/admin/actions").then(({ logAnalyticsEvent }) =>
      logAnalyticsEvent("upgrade_click")
    );

    try {
      const response = await fetch("/api/billing/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingCycle,
          vatRate: selectedVAT,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Nie udało się rozpocząć procesu płatności.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Nie otrzymano adresu płatności.");
      }
    } catch (error: unknown) {
      setIsLoading(false);
      toast({
        title: "Błąd",
        description: error instanceof Error ? error.message : "Nie udało się rozpocząć procesu płatności. Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid lg:grid-cols-3 gap-6">
      {/* Main Checkout Area (2/3 width) */}
      <div className="order-2 lg:order-1 lg:col-span-2 space-y-6">
        {/* Billing Cycle Selection */}
        <Card className="border-2 border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-indigo-50/80 dark:from-indigo-950/20 dark:via-blue-950/15 dark:to-indigo-950/20 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Wybierz okres rozliczeniowy
            </CardTitle>
            <CardDescription>
              Oszczędź {savingsPercent}% wybierając plan roczny
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`relative rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
              >
                <div className={`font-semibold text-sm ${
                  billingCycle === "monthly" ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                }`}>Miesięcznie</div>
                <div className={`text-2xl font-bold mt-1 ${
                  billingCycle === "monthly" ? "text-indigo-900 dark:text-indigo-100" : "text-slate-900 dark:text-slate-100"
                }`}>{monthlyPrice} zł</div>
                <div className="text-xs text-muted-foreground mt-0.5">za miesiąc</div>
              </button>

              <button
                onClick={() => setBillingCycle("yearly")}
                className={`relative rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                  billingCycle === "yearly"
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-400/30"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
              >
                <Badge className="absolute -top-2 -right-2 bg-green-600 hover:bg-green-600 text-white text-xs px-2 py-0.5">
                  -{savingsPercent}%
                </Badge>
                <div className={`font-semibold text-sm ${
                  billingCycle === "yearly" ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300"
                }`}>Rocznie</div>
                <div className={`text-2xl font-bold mt-1 ${
                  billingCycle === "yearly" ? "text-indigo-900 dark:text-indigo-100" : "text-slate-900 dark:text-slate-100"
                }`}>{yearlyPrice} zł</div>
                <div className="text-xs text-muted-foreground mt-0.5">za rok (2 miesiące gratis)</div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* VAT Selection */}
        <VATSelector 
          onVATChange={setSelectedVAT} 
          defaultRate={23}
          billingCycle={billingCycle}
        />

        {/* Checkout Button */}
        <Card className="border-2 border-green-200 dark:border-green-800/60 bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-green-50/80 dark:from-green-950/20 dark:via-emerald-950/15 dark:to-green-950/20 shadow-xl">
          <CardContent className="pt-6 pb-6">
            <Button
              size="lg"
              className="w-full h-14 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:via-orange-700 hover:to-amber-700 text-white font-bold shadow-2xl shadow-orange-600/50 hover:shadow-orange-700/60 transition-all duration-300 border-0 text-lg"
              onClick={handleCheckout}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  <span className="truncate">Przekierowywanie do Stripe...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="truncate">Przejdź do bezpiecznej płatności</span>
                  <Shield className="w-5 h-5 ml-2 flex-shrink-0" />
                </>
              )}
            </Button>

            <div className="mt-4 text-center">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Po kliknięciu zostaniesz przekierowany do bezpiecznego formularza płatności Stripe
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar (1/3 width) */}
      <div className="order-1 lg:order-2 space-y-5">
        {/* PRO Benefits Summary */}
        <Card className="border-2 border-amber-200 dark:border-amber-800/60 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400"></div>
          
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-md opacity-50"></div>
                <div className="relative p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                  <Crown className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Co dostajesz?
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-2.5">
            <div className="flex items-start gap-2.5 p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg border border-amber-100 dark:border-amber-900/40 shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Infinity className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Nielimitowane projekty
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Bez ograniczeń
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg border border-amber-100 dark:border-amber-900/40 shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Pełne ceny
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Wszystkie kalkulacje
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg border border-amber-100 dark:border-amber-900/40 shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Eksport PDF
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Z Twoim logo
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg border border-amber-100 dark:border-amber-900/40 shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Wsparcie PRO
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Priorytetowe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust & Security */}
        <Card className="border-2 border-green-200 dark:border-green-800/60 bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-green-50/80 dark:from-green-950/20 dark:via-emerald-950/15 dark:to-green-950/20 shadow-xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"></div>
          
          <CardContent className="pt-5 pb-5">
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <Badge className="bg-green-600 hover:bg-green-600 text-white font-bold text-xs px-3 py-1.5">
                  <Shield className="w-4 h-4 mr-1.5" />
                  Bezpieczna płatność
                </Badge>
              </div>
              
              <p className="text-xs text-center text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                Płatności obsługiwane przez <span className="font-bold text-[#635BFF]">Stripe</span>
              </p>

              <div className="flex items-center justify-center pt-2">
                <svg className="h-6 w-auto" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
                  <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 01-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 013.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 01-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 01-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 00-4.1-1.06c-.86 0-1.44.25-1.44.9 0 1.85 6.29.97 6.29 5.88z" fill="#635BFF"/>
                </svg>
              </div>

              <div className="pt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>14 dni gwarancji zwrotu</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>Faktura VAT automatyczna</span>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>Anuluj kiedy chcesz</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  );
}
