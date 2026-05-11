import { Metadata } from "next";
import { getGlobalHourlyRate } from "./actions";
import { getProfile } from "../actions";
import { getRegions } from "@/app/dashboard/project-ops-actions";
import { Suspense } from "react";
import { KnrClient } from "./knr-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Centrum Kalkulacji i Norm KNR — Stawka R-G i ES-Engine",
  description: "Konfiguruj domyślną stawkę robocizny (PLN/rbh), współczynniki regionalne 16 województw, mnożnik materiałów i kontekst inwestycji. Import norm KNR, kalibracja silnika ES-Engine.",
};

export default async function KnrCalculatorPage() {
  const [{ rate, materialMultiplier, materialMargin }, { data: profile }, regions] = await Promise.all([
    getGlobalHourlyRate(),
    getProfile(),
    getRegions(),
  ]);

  const isPro = profile?.is_pro ?? false;
  const useCustomRates = profile?.use_custom_rates ?? false;
  const customLaborRate = profile?.custom_labor_rate ?? null;
  const defaultRegionUuid = profile?.default_region_id ?? null;
  const investmentContext = profile?.investment_context ?? "";

  return (
    <div className="container mx-auto max-w-5xl py-6 px-4 md:px-8">
      <Suspense fallback={<div className="h-40 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />}>
        <KnrClient
          initialRate={rate}
          initialMaterialMultiplier={materialMultiplier}
          initialMaterialMargin={materialMargin}
          isPro={isPro}
          initialUseCustomRates={useCustomRates}
          initialCustomLaborRate={customLaborRate}
          initialRegionUuid={defaultRegionUuid}
          dbRegions={regions.map(r => ({ id: r.id, name: r.name, slug: r.slug, price_modifier: r.price_modifier }))}
          initialInvestmentContext={investmentContext}
        />
      </Suspense>
    </div>
  );
}
