import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, FileText, Headphones, Infinity, DollarSign, Lock, AlertCircle, Check, X, Shield } from "lucide-react";
import { UpgradeProButton } from "@/components/dashboard/upgrade-pro-button";

export function PricingPlans() {
  return (
    <>
      {/* Current Plan Status */}
      <Card className="border-2 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600" />
        <CardHeader className="pb-4 pt-6">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Plan Demo (Bezpłatny)</CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-400">Wypróbuj system z ograniczeniami</CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-300 dark:border-slate-700 text-foreground text-xs font-semibold">Aktywny</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">Aktualne ograniczenia</p>
            <div className="space-y-2.5">
              {[
                { icon: AlertCircle, color: "amber", title: "Maksymalnie 1 aktywny projekt", desc: "PRO daje nielimitowane projekty" },
                { icon: Lock, color: "red", title: "Ceny ukryte (blur)", desc: "Nie widzisz kosztów materiałów i robocizny" },
                { icon: FileText, color: "amber", title: "PDF/Excel z ukrytymi cenami", desc: "Eksport działa, ale ceny są zamaskowane" },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className={`flex items-start gap-3 p-3 rounded-lg bg-${color}-50 dark:bg-${color}-950/20 border border-${color}-100 dark:border-${color}-900/30`}>
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-7 h-7 rounded-full bg-${color}-100 dark:bg-${color}-900/40 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3">
            <UpgradeProButton
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 hover:from-amber-600 hover:via-orange-700 hover:to-amber-700 text-white font-bold shadow-2xl shadow-orange-600/50 hover:shadow-orange-700/60 transition-all duration-300 border-0"
              fullWidth
            />
          </div>
        </CardContent>
      </Card>

      {/* PRO Benefits */}
      <Card className="border-2 border-amber-200 dark:border-amber-800/60 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-amber-950/20 shadow-xl shadow-amber-200/30 dark:shadow-amber-950/30 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />
        <CardHeader className="pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl blur-md opacity-50" />
              <div className="relative p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">ElektroSmart PRO</CardTitle>
              <CardDescription className="text-sm text-slate-700 dark:text-slate-400 font-medium">159 zł/miesiąc • Anuluj kiedy chcesz</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { icon: Infinity, gradient: "from-blue-500 to-indigo-600", title: "Nielimitowane projekty", desc: "Twórz dowolną ilość wycen bez ograniczeń" },
            { icon: DollarSign, gradient: "from-green-500 to-emerald-600", title: "Pełna widoczność cen", desc: "Dostęp do wszystkich kalkulacji i marż" },
            { icon: FileText, gradient: "from-amber-500 to-orange-600", title: "Profesjonalny eksport PDF", desc: "Oferty z Twoim logo i brandingiem" },
            { icon: Headphones, gradient: "from-purple-500 to-indigo-600", title: "Wsparcie priorytetowe", desc: "Szybka pomoc dedykowana dla PRO" },
          ].map(({ icon: Icon, gradient, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-3.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl border border-amber-100 dark:border-amber-900/40 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-0.5">{title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card className="border-2 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Porównanie planów</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            {[
              { label: "Liczba projektów", free: <Badge variant="outline" className="text-xs font-semibold">1</Badge>, pro: <Check className="w-5 h-5 text-green-600 dark:text-green-400" /> },
              { label: "Widoczność cen", free: <X className="w-5 h-5 text-red-500" />, pro: <Check className="w-5 h-5 text-green-600 dark:text-green-400" /> },
              { label: "Eksport PDF", free: <X className="w-5 h-5 text-red-500" />, pro: <Check className="w-5 h-5 text-green-600 dark:text-green-400" /> },
              { label: "Wsparcie", free: <Badge variant="outline" className="text-xs font-semibold">Email</Badge>, pro: <Badge className="text-xs bg-purple-600 hover:bg-purple-600 text-white font-semibold">Priorytet</Badge> },
            ].map(({ label, free, pro }) => (
              <div key={label} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <div className="flex items-center gap-4">{free}{pro}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Security */}
      <Card className="border-2 border-green-200 dark:border-green-800/60 bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-green-50/80 dark:from-green-950/20 dark:via-emerald-950/15 dark:to-green-950/20 shadow-xl shadow-green-200/30 dark:shadow-green-950/30 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />
        <CardContent className="pt-5 pb-5">
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-full border-2 border-green-600 dark:border-green-500 shadow-lg shadow-green-600/20">
                <div className="relative">
                  <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <span className="text-xs font-bold text-green-700 dark:text-green-400">Bank-level security</span>
              </div>
            </div>
            <p className="text-xs text-center text-foreground leading-relaxed font-medium px-2">
              Płatności obsługiwane przez <span className="font-bold text-[#635BFF]">Stripe</span>. Twoje dane są bezpieczne.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] font-semibold border-slate-300 dark:border-slate-700">💳 Visa/Mastercard</Badge>
              <Badge variant="outline" className="text-[10px] font-semibold border-slate-300 dark:border-slate-700">🍎 Apple Pay</Badge>
              <Badge variant="outline" className="text-[10px] font-semibold border-slate-300 dark:border-slate-700">🤖 Google Pay</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guarantees */}
      <Card className="border-2 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
        <CardContent className="pt-5 pb-5">
          <div className="space-y-3.5">
            {[
              { icon: CheckCircle, gradient: "from-green-500 to-emerald-600", title: "14 dni gwarancji", desc: "Zwrot 100% wpłaty bez pytań" },
              { icon: FileText, gradient: "from-blue-500 to-indigo-600", title: "Faktura VAT", desc: "Automatyczna w Stripe Portal" },
              { icon: Lock, gradient: "from-slate-500 to-slate-700", title: "Bez zobowiązań", desc: "Anuluj w każdej chwili" },
            ].map(({ icon: Icon, gradient, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-0.5">{title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
