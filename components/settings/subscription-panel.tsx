"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, CreditCard, Zap, Infinity, DollarSign, FileText, Headphones, X, Check, Shield, Lock, Sparkles, ArrowRight, Calendar, AlertCircle } from "lucide-react";
import { UpgradeProButton } from "@/components/dashboard/upgrade-pro-button";
import { ManageBillingButton } from "@/components/subscription/manage-billing-button";
import type { Profile } from "@/lib/types/database";

interface SubscriptionPanelProps {
  profile: Profile | null;
}

export function SubscriptionPanel({ profile }: SubscriptionPanelProps) {
  const isPro = profile?.is_pro || false;

  // Format dates for display (Polish format: DD.MM.YYYY)
  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const activationDate = formatDate(profile?.current_period_start || null);
  const renewalDate = formatDate(profile?.current_period_end || null);
  const isCanceled = profile?.cancel_at_period_end || false;
  const hasStripeCustomer = !!profile?.stripe_customer_id;

  if (!isPro) {
    // FREE USER VIEW - Compact for Settings Tab
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Current Plan Status */}
        <Card className="border-2 border-slate-200/80 dark:border-slate-800/80">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-base sm:text-lg">Plan Demo (Bezpłatny)</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Wypróbuj system z ograniczeniami</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
            {/* Current Limitations */}
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Tylko 1 aktywny projekt</div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Usuń stary, aby stworzyć nowy</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Ceny ukryte (blur)</div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Nie widzisz kosztów materiałów i robocizny</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Brak eksportu PDF</div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Nie możesz wysłać oferty do klienta</p>
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <UpgradeProButton 
              size="lg" 
              className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:via-orange-700 hover:to-amber-700"
              fullWidth
            />
          </CardContent>
        </Card>

        {/* PRO Benefits */}
        <Card className="border-2 border-amber-200 dark:border-amber-800/60 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-amber-50/80 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <CardTitle className="text-base sm:text-lg">ElektroSmart PRO</CardTitle>
                <CardDescription className="text-xs sm:text-sm">159 zł/miesiąc • Anuluj kiedy chcesz</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-1.5 sm:space-y-2 px-4 sm:px-6">
            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg">
              <Infinity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Nielimitowane projekty</h4>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Twórz dowolną ilość wycen bez ograniczeń</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Pełna widoczność cen</h4>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Dostęp do wszystkich kalkulacji i marż</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Profesjonalny eksport PDF</h4>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Oferty z Twoim logo i brandingiem</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg">
              <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">Wsparcie priorytetowe</h4>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">Szybka pomoc dedykowana dla PRO</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <Card className="border-2 border-green-200 dark:border-green-800/60 bg-gradient-to-br from-green-50/80 to-emerald-50/60 dark:from-green-950/20 dark:to-emerald-950/15">
          <CardContent className="pt-6 pb-6">
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full border-2 border-green-600 dark:border-green-500">
                  <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-bold text-green-700 dark:text-green-400">Bank-level security</span>
                </div>
              </div>
              <p className="text-xs text-center text-slate-700 dark:text-slate-300">
                Płatności obsługiwane przez <span className="font-bold text-[#635BFF]">Stripe</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // PRO USER VIEW
  return (
    <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-amber-50/80 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30">
      <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-2.5 sm:p-3 rounded-full flex-shrink-0">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              Twój plan: ElektroSmart PRO
            </CardTitle>
            <Badge className={`${isCanceled ? 'bg-orange-600' : 'bg-green-600'} text-white font-bold mt-1.5 sm:mt-2`}>
              <CheckCircle className="w-3 h-3 mr-1" />
              {isCanceled ? 'Aktywny (anulowany)' : 'Aktywny'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
        {/* Thank You */}
        <div className="text-center py-2">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-bold text-amber-700 dark:text-amber-400">Dziękujemy!</span> Masz pełny dostęp do wszystkich funkcji PRO.
          </p>
        </div>

        {/* Subscription Dates */}
        <div className="space-y-3 p-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-sm">Szczegóły subskrypcji</h3>
          </div>
          
          {activationDate && (
            <div className="flex justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm">
              <span className="text-slate-700 dark:text-slate-300">Data aktywacji:</span>
              <span className="font-bold">{activationDate}</span>
            </div>
          )}
          
          {renewalDate ? (
            <div className="flex justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm">
              <span className="text-slate-700 dark:text-slate-300">
                {isCanceled ? 'Ważne do:' : 'Następna płatność:'}
              </span>
              <span className="font-bold">{renewalDate}</span>
            </div>
          ) : (
            <div className="flex justify-between py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
              <span className="text-green-700 dark:text-green-300">Ważność:</span>
              <span className="font-bold text-green-900 dark:text-green-100 flex items-center gap-1">
                <Infinity className="w-4 h-4" />
                Bezterminowo
              </span>
            </div>
          )}

          {isCanceled && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-900 dark:text-orange-100">Subskrypcja anulowana</p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                  Dostęp PRO będzie aktywny do {renewalDate}. Możesz wznowić w dowolnym momencie.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Active Benefits */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 p-2 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg text-xs sm:text-sm">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="font-semibold truncate">Nielimitowane projekty</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 p-2 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg text-xs sm:text-sm">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="font-semibold truncate">Pełne ceny</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 p-2 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg text-xs sm:text-sm">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="font-semibold truncate">Eksport PDF</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 p-2 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-lg text-xs sm:text-sm">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="font-semibold truncate">Wsparcie PRO</span>
          </div>
        </div>

        {/* Billing */}
        <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
          <div className="flex justify-between mb-3 text-sm">
            <div>
              <p className="font-bold">Plan miesięczny</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">159 zł / miesiąc</p>
            </div>
            {renewalDate && (
              <div className="text-right">
                <p className="font-bold">{isCanceled ? 'Anulowano' : 'Auto-odnowienie'}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Stripe Portal</p>
              </div>
            )}
          </div>

          {hasStripeCustomer ? (
            <>
              <ManageBillingButton />
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
                Zarządzaj metodą płatności i pobieraj faktury
              </p>
            </>
          ) : (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-center text-blue-900 dark:text-blue-100 font-medium">
                Status nadany przez Administratora
              </p>
              <p className="text-xs text-center text-blue-700 dark:text-blue-300 mt-1">
                Subskrypcja zarządzana ręcznie
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
