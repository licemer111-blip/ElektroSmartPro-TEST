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
    // ══════════════════════════════════════════════════════════════════════
    // FREE USER VIEW — v2.0 (Freemium z zablokowaną monetyzacją)
    // Kluczowa zmiana: FREE user ma PEŁNY kalkulator. Blokada jest na
    // WYSYŁCE do klienta (PDF bez DEMO, Portal Klienta, branding, team).
    // ══════════════════════════════════════════════════════════════════════
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* ─── Current FREE plan: co masz ─────────────────────────── */}
        <Card className="border-2 border-green-200/80 dark:border-green-800/60 bg-gradient-to-br from-green-50/60 to-emerald-50/40 dark:from-green-950/20 dark:to-emerald-950/10">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-[10px] uppercase">Plan Demo</Badge>
              <CardTitle className="text-base sm:text-lg">Masz pełny dostęp do narzędzia</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Licz, wyceniaj, planuj bez ograniczeń. Płacisz dopiero kiedy chcesz wysłać <strong>czysty PDF</strong> klientowi.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2 px-4 sm:px-6">
            {[
              { icon: Infinity, title: "Nielimitowane projekty i pozycje", desc: "Buduj kosztorysy dla 1 mieszkania lub 100 obiektów" },
              { icon: DollarSign, title: "Pełna widoczność wszystkich cen", desc: "Materiał / Robocizna / VAT / Brutto — bez zamazywania" },
              { icon: Zap, title: "ES-Engine + KNR 2026 + AI", desc: "Silnik kalkulacji, zestawy 360°, rozpoznawanie importu PDF/Excel" },
              { icon: FileText, title: "Eksport PDF ze znakiem wodnym DEMO", desc: "Do Twojej pracy wewnętrznej — do klienta potrzebujesz PRO lub Pay-per-Export" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/40 border border-green-200/60 dark:border-green-800/30">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{title}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 ml-5">{desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ─── PRO upgrade card — co odblokowujesz ────────────────── */}
        <Card className="border-2 border-amber-300 dark:border-amber-700/60 bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-amber-50/80 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 shadow-lg shadow-amber-500/10">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Zupgraduj do PRO
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  159 zł/m-c • Anuluj kiedy chcesz • 1 wycena dla klienta zwraca koszt
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2 px-4 sm:px-6">
            <div className="rounded-lg bg-white/80 dark:bg-slate-900/50 p-3 border border-amber-200/70 dark:border-amber-800/30 mb-2">
              <p className="text-[11px] sm:text-xs font-semibold text-amber-900 dark:text-amber-200">
                🎯 Co odblokowujesz w PRO:
              </p>
            </div>

            {[
              { icon: FileText, title: "Czysty PDF bez znaku wodnego", desc: "Gotowy do wysłania klientowi — profesjonalny, z Twoim logo i NIP" },
              { icon: Sparkles, title: "Portal Klienta z e-podpisem", desc: "Klient akceptuje wycenę online — bez maila, bez drukarki" },
              { icon: Crown, title: "Własne branding firmy w PDF", desc: "Logo, dane firmy, kolory dokumentów — wyglądasz jak wielka firma" },
              { icon: Zap, title: "Tryb zespołowy (multi-user)", desc: "Zapraszaj pracowników do projektów, role i uprawnienia" },
              { icon: Shield, title: "Tryb offline + sync PWA", desc: "Pracuj bez internetu na placu budowy — synchronizacja po powrocie" },
              { icon: Headphones, title: "Wsparcie priorytetowe", desc: "Odpowiadamy w ciągu 2h w dni robocze" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-2.5 p-2.5 bg-white/70 dark:bg-slate-900/40 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{title}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}

            {/* ROI banner */}
            <div className="mt-3 rounded-lg p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border border-emerald-300 dark:border-emerald-700/50">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    PRO zwraca się po 1 kliencie
                  </p>
                  <p className="text-[10px] sm:text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Jedna profesjonalna wycena z własnym logo i Portalem Klienta buduje zaufanie
                    warte znacznie więcej niż 159 zł/m-c. Średni elektryk oszczędza <strong>8–12 h/m-c</strong> dzięki automatyzacji KNR.
                  </p>
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <UpgradeProButton
              size="lg"
              className="w-full bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:via-orange-700 hover:to-amber-700 mt-3"
              fullWidth
            />

            {/* Pay-per-export alternative */}
            <div className="mt-2 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    Robisz wyceny tylko sporadycznie?
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                    <strong>Pay-per-Export (29 zł)</strong> — jedna płatność zdejmuje znak wodny z konkretnego PDF-a.
                    Bez subskrypcji. <span className="italic">Wkrótce dostępne w panelu projektu.</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trust Signals */}
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Płatność Stripe</span>
              </div>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">Anuluj w każdej chwili</span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">Bez kontraktu długoterminowego</span>
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
