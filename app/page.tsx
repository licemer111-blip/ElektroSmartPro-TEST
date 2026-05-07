import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Header from "@/components/header";
import { HeroSection } from "@/components/landing/HeroSection";
import { LandingStructuredData } from "@/components/landing/LandingStructuredData";
import { getGlobalCatalogCount } from "./actions";
import { DIN_MODULES_COUNT } from "@/lib/data/din-modules-stats";
import { getSystemStats } from "@/lib/actions/system-stats";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";

const FeaturesSection    = dynamic(() => import("@/components/landing/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const BentoFeaturesSection = dynamic(() => import("@/components/landing/BentoFeaturesSection").then(m => ({ default: m.BentoFeaturesSection })));
const FaqSection         = dynamic(() => import("@/components/landing/FaqSection").then(m => ({ default: m.FaqSection })));
const RoadmapSection     = dynamic(() => import("@/components/landing/RoadmapSection").then(m => ({ default: m.RoadmapSection })));
const FooterSection      = dynamic(() => import("@/components/landing/FooterSection").then(m => ({ default: m.FooterSection })));
const StickyCTA          = dynamic(() => import("@/components/landing/sticky-cta").then(m => ({ default: m.StickyCTA })), { ssr: false });

export const revalidate = 3600; // ISR: regenerate landing page once per hour

export const metadata: Metadata = {
  title: "ElektroSmart PRO — Ekspertowy System Kosztorysów Elektrycznych | ES-Engine",
  description:
    `Profesjonalny kosztorys elektryczny z ES-Engine: podział Robocizna/Materiał, ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR 5-04/5-08/5-09 w ${SYSTEM_STATS_FALLBACK.categoriesLabel} kategoriach, ceny 16 województw, Zestawy 360°, konfigurator rozdzielnic, Portal Klienta, eksport PDF. Demo bezpłatne.`,
  keywords: [
    "wycena elektryczna",
    "kosztorys elektryczny",
    "wycena instalacji elektrycznej",
    "kosztorys elektryczny online",
    "profesjonalne wyceny elektryczne",
    "wyceny KNR",
    "kosztorys KNR",
    "import KNR Excel",
    "program do wycen elektrycznych",
    "kosztorysowanie elektryczne",
    "program do kosztorysów dla elektryków",
    "wycena elektryczna online",
    "kosztorys instalacji elektrycznej",
    "profesjonalny kosztorys elektryczny",
    "zestawy materiałów elektrycznych",
    "ceny instalacji elektrycznych 2026",
    "VAT 8% budownictwo mieszkaniowe",
    "VAT 23% instalacje elektryczne",
    "program dla elektryków Polska",
    "kosztorysowanie instalacji elektrycznych",
    "wycena punktu elektrycznego",
    "ceny robocizny elektrycznej",
    "stawki robocizny elektrycznej 2026",
    "normy KNR 5-08 elektryka",
    "rozdzielnica elektryczna wycena",
    "kosztorys fotowoltaika",
    "wycena instalacji elektrycznej online",
    "oprogramowanie dla elektryka",
  ],
  openGraph: {
    title: "ElektroSmart PRO — Ekspertowy System Kosztorysów Elektrycznych | ES-Engine",
    description:
      "ES-Engine dla elektryków: kosztorys z podziałem Robocizna/Materiał, normy KNR, Zestawy 360°, ceny regionalne 16 województw, VAT 8%/23%, Portal Klienta, PDF w 30 sekund. Demo bezpłatne.",
    type: "website",
    locale: "pl_PL",
    url: "/",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ElektroSmart PRO - Program do Kosztorysowania Instalacji Elektrycznych",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElektroSmart PRO — Kosztorys Elektryczny z ES-Engine",
    description:
      "Kosztorys elektryczny z KNR, podziałem Robocizna/Materiał, Zestawami 360°, cenami 16 województw, eksportem PDF. ES-Engine. Demo bezpłatne.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [catalogCount, systemStats] = await Promise.all([
    getGlobalCatalogCount(),
    getSystemStats(),
  ]);
  const dinCount = DIN_MODULES_COUNT;

  return (
    <div className="min-h-screen mesh-gradient-hero">
      <LandingStructuredData catalogCount={catalogCount} dinCount={dinCount} />

      <Header isDashboard={false} />

      <main>
        {/* 1. Hero — above fold, loaded eagerly */}
        <HeroSection normsCount={systemStats.normsCount} categoriesCount={systemStats.categoriesCount} />

        {/* 2. Three Pillars + Tools */}
        <FeaturesSection dinCount={dinCount} normsCount={systemStats.normsCount} />

        {/* 3. Bento Features — 2x3 grid */}
        <BentoFeaturesSection catalogCount={catalogCount} />

        {/* 5. FAQ — 5 accordion items (SEO rich snippets) */}
        <FaqSection catalogCount={catalogCount} dinCount={dinCount} />

        {/* 6. Roadmap badge */}
        <RoadmapSection />
      </main>

      {/* Sticky CTA — client-only, ssr:false */}
      <StickyCTA />

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
