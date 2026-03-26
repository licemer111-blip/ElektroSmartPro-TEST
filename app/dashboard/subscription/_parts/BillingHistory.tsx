import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, Infinity, AlertCircle, Check, Headphones } from "lucide-react";
import { ManageBillingButton } from "@/components/subscription/manage-billing-button";

interface BillingHistoryProps {
  isCanceled: boolean;
  activationDate: string | null;
  renewalDate: string | null;
  hasStripeCustomer: boolean;
}

export function BillingHistory({
  isCanceled,
  activationDate,
  renewalDate,
  hasStripeCustomer,
}: BillingHistoryProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/30 dark:via-orange-950/30 dark:to-amber-950/30 border-2 border-amber-300 dark:border-amber-700 shadow-2xl">
      <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-orange-500/10 animate-pulse" />

      <CardHeader className="relative pt-7">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-xl opacity-60" />
            <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-4 rounded-full shadow-2xl">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent mb-2">
              Twój plan: ElektroSmart PRO
            </CardTitle>
            <CardDescription className="text-sm text-foreground">
              <Badge className={`${isCanceled ? "bg-orange-600 hover:bg-orange-600" : "bg-green-600 hover:bg-green-600"} text-white font-bold shadow-lg`}>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                {isCanceled ? "Aktywny (anulowany)" : "Aktywny"}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-6">
        <div className="text-center py-4">
          <p className="text-base text-foreground leading-relaxed">
            <span className="font-bold text-amber-700 dark:text-amber-400">Dziękujemy!</span> Masz pełny dostęp do wszystkich funkcji PRO.
          </p>
        </div>

        {/* Subscription dates */}
        <div className="space-y-3 p-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-200 dark:border-amber-800 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Szczegóły subskrypcji</h3>
          </div>
          <div className="space-y-2.5">
            {activationDate && (
              <div className="flex items-start justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">Data aktywacji:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{activationDate}</span>
              </div>
            )}
            {renewalDate ? (
              <div className="flex items-start justify-between py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm font-medium text-foreground">
                  {isCanceled ? "Ważne do:" : "Następna płatność:"}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{renewalDate}</span>
              </div>
            ) : (
              <div className="flex items-start justify-between py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Ważność:</span>
                <span className="text-sm font-bold text-green-900 dark:text-green-100 flex items-center gap-1">
                  <Infinity className="w-4 h-4" />
                  Bezterminowo
                </span>
              </div>
            )}
            {isCanceled && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-orange-900 dark:text-orange-100">Subskrypcja anulowana</p>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                    Dostęp PRO będzie aktywny do {renewalDate}. Możesz wznowić subskrypcję w dowolnym momencie.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active benefits grid */}
        <div className="grid sm:grid-cols-2 gap-3">
          {["Nielimitowane projekty", "Pełne ceny", "Eksport PDF", "Wsparcie PRO"].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2.5 p-3 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-200 dark:border-amber-800 shadow-md">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Billing info */}
        <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-4 text-sm">
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">Plan miesięczny</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">159 zł / miesiąc</p>
            </div>
            {renewalDate && (
              <div className="text-right">
                <p className="font-bold text-slate-900 dark:text-slate-100">{isCanceled ? "Anulowano" : "Auto-odnowienie"}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Stripe Portal</p>
              </div>
            )}
          </div>
          {hasStripeCustomer ? (
            <>
              <ManageBillingButton />
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3">Zarządzaj metodą płatności i pobieraj faktury</p>
            </>
          ) : (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-center text-blue-900 dark:text-blue-100 font-medium">Status nadany przez Administratora</p>
              <p className="text-xs text-center text-blue-700 dark:text-blue-300 mt-1">Subskrypcja zarządzana ręcznie</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* PRO support */}
      <div className="relative mx-6 mb-6">
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Wsparcie priorytetowe PRO</p>
                <a href="mailto:elektrosmartpro@gmail.com" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold transition-colors">
                  elektrosmartpro@gmail.com
                </a>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700">⚡ Odpowiedź w 24h</Badge>
                  <Badge className="text-xs bg-amber-600 hover:bg-amber-600 text-white">
                    <Crown className="w-3 h-3 mr-1" />Priorytet
                  </Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Card>
  );
}
