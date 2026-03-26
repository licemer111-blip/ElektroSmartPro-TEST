"use client";

import { Check, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface PricingSectionProps {
  catalogCount?: number;
  dinCount?: number;
}

export function PricingSection({ catalogCount = 1400, dinCount = 295 }: PricingSectionProps) {
  const plans = [
    {
      name: "PRO",
      price: "159",
      period: "PLN / miesiąc",
      description: "Pełna moc dla profesjonalistów",
      features: [
        { text: "Nieograniczone projekty (Demo: 3 projekty)", included: true },
        { text: `Katalog ${catalogCount}+ pozycji KNR`, included: true },
        { text: "Eksport PDF/Excel (bez watermarku)", included: true },
        { text: "12 kalkulatorów inżynierskich", included: true },
        { text: "Zestawy 360° (Zestawy materiałów)", included: true },
        { text: "ES-Engine — analiza PDF/Excel/rzutów budowlanych", included: true },
        { text: "200 zapytań ES-Engine/mies. (Demo: 20)", included: true },
        { text: `Konfigurator rozdzielnic ${dinCount}+ DIN`, included: true },
        { text: "Portal Klienta z negocjacjami", included: true },
        { text: "CRM klientów + Analityka biznesowa", included: true },
      ],
      cta: "Wybierz PRO",
      href: "/dashboard/subscription",
      popular: true,
    },
  ];
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

        {/* Pricing Cards */}
        <div className="flex justify-center max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl w-full max-w-md ${
                plan.popular
                  ? "border-2 border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    NAJPOPULARNIEJSZY
                  </div>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-lg">
                    {plan.period}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{feature.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  asChild
                  className={`w-full h-12 text-base font-semibold ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white"
                  }`}
                >
                  <Link href={plan.href}>
                    {plan.popular && <Crown className="w-4 h-4 mr-2" />}
                    {plan.cta}
                  </Link>
                </Button>

                {/* Money Back Guarantee */}
                {plan.popular && (
                  <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                    ✓ Anuluj w dowolnym momencie • Bez zobowiązań
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Zaufało nam już ponad <strong className="text-slate-700 dark:text-slate-300">500+ elektryków</strong> w całej Polsce
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
