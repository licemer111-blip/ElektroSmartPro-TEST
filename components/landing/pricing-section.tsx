"use client";

import { Check, X, Crown, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PricingSectionProps {
  catalogCount?: number;
  dinCount?: number;
}

export function PricingSection({ catalogCount = 1400, dinCount = 295 }: PricingSectionProps) {
  return (
    <section id="pricing" className="relative py-20 scroll-mt-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient-hero" />
      <div className="absolute inset-0 grid-pattern opacity-50" />
      
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            <Sparkles className="w-3 h-3 mr-1" />
            Prosty cennik
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Wybierz swój <span className="gradient-text-pro">plan</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Zacznij za darmo, przejdź na PRO gdy będziesz gotowy
          </p>
        </div>

        {/* Pricing Cards — 2 columns */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          
          {/* FREE Plan */}
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-2xl">FREE</CardTitle>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">0</span>
                <span className="text-slate-500 dark:text-slate-400 text-lg">PLN / na zawsze</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Poznaj system bez zobowiązań
              </p>
            </CardHeader>

            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                {[
                  { text: "1 projekt + projekt demonstracyjny", included: true },
                  { text: `Katalog ${catalogCount}+ pozycji KNR`, included: true },
                  { text: "Ceny pozycji widoczne (sumy ukryte)", included: true },
                  { text: "12 kalkulatorów inżynierskich", included: true },
                  { text: "Zestawy materiałów", included: true },
                  { text: "5 zapytań ES-Engine / miesiąc", included: true },
                  { text: `Konfigurator rozdzielnic ${dinCount}+ DIN`, included: true },
                  { text: "PDF/Excel z watermarkiem DEMO", included: true },
                  { text: "Portal Klienta", included: false },
                  { text: "Czysty PDF bez watermarku", included: false },
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      feature.included 
                        ? "bg-green-100 dark:bg-green-900/50" 
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}>
                      {feature.included ? (
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                      )}
                    </div>
                    <span className={feature.included ? "text-slate-700 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="w-full h-12 text-base font-semibold bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white"
              >
                <Link href="/login?tab=signup">
                  Rozpocznij za darmo
                </Link>
              </Button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                Bez karty kredytowej • Aktywacja w 30 sekund
              </p>
            </CardContent>
          </Card>

          {/* PRO Plan */}
          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20">
            {/* Popular Badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg flex items-center gap-1">
                <Crown className="w-3 h-3" />
                REKOMENDOWANY
              </div>
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-2xl">PRO</CardTitle>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-slate-900 dark:text-white">159</span>
                <span className="text-slate-500 dark:text-slate-400 text-lg">PLN / miesiąc</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Pełna moc dla profesjonalistów
              </p>
            </CardHeader>

            <CardContent className="pt-0">
              <ul className="space-y-3 mb-6">
                {[
                  { text: "Nieograniczone projekty", included: true },
                  { text: `Katalog ${catalogCount}+ pozycji KNR`, included: true },
                  { text: "Wszystkie ceny i sumy widoczne", included: true },
                  { text: "12 kalkulatorów inżynierskich", included: true },
                  { text: "Zestawy materiałów", included: true },
                  { text: "500 zapytań ES-Engine / miesiąc", included: true },
                  { text: `Konfigurator rozdzielnic ${dinCount}+ DIN`, included: true },
                  { text: "Czysty PDF/Excel (bez watermarku)", included: true },
                  { text: "Portal Klienta z negocjacjami", included: true },
                  { text: "CRM klientów + Analityka biznesowa", included: true },
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">{feature.text}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25"
              >
                <Link href="/dashboard/subscription">
                  <Crown className="w-4 h-4 mr-2" />
                  Wybierz PRO
                </Link>
              </Button>
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                7 dni za darmo • Anuluj w dowolnym momencie
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trial Banner */}
        <div className="mt-8 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 text-center">
            <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-1">
              Nie jesteś pewien? Wypróbuj PRO przez 7 dni za darmo
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              Bez karty kredytowej. Po 7 dniach automatyczny powrót do planu FREE. Bez niespodzianek.
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Profesjonalne narzędzie kosztorysowe dla <strong className="text-slate-700 dark:text-slate-300">elektryków w całej Polsce</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              Bezpieczne płatności Stripe
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              Faktura VAT
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-4 h-4 text-green-500" />
              Wsparcie techniczne
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
