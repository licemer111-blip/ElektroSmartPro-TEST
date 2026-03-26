import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database, TrendingUp, Layers, Shield, DollarSign,
  FileText, Zap, Users, GitBranch,
} from "lucide-react";

interface BentoFeaturesSectionProps {
  catalogCount: number;
}

const BENTO_FEATURES = [
  {
    gradient: "from-blue-500 to-blue-700",
    icon: Database,
    titleFn: (n: number) => `Katalog ${n}+ pozycji KNR`,
    descFn: (n: number) =>
      `<strong>${n}+ pozycji</strong> z kodami KNR 5-04/5-08/5-09, jednostkami i nakładami r-g. Własny katalog bez limitu.`,
  },
  {
    gradient: "from-slate-600 to-slate-800",
    icon: Shield,
    titleFn: () => "Smart VAT 8% / 23%",
    descFn: () =>
      "<strong>Dom/mieszkanie → 8%, biuro/komercja → 23%</strong>. Stawka ustawiana automatycznie na podstawie typu projektu.",
  },
  {
    gradient: "from-blue-600 to-blue-800",
    icon: DollarSign,
    titleFn: () => "Ochrona Marży",
    descFn: () =>
      "Widzisz <strong>marżę brutto, zysk netto i Narzut</strong> przed wysłaniem oferty. Zero nieprzyjemnych niespodzianek.",
  },
  {
    gradient: "from-slate-500 to-slate-700",
    icon: Zap,
    titleFn: () => "12 Kalkulatorów Inżynierskich",
    descFn: () =>
      "Ik3/Ik1, przekrój kabla, spadek napięcia, <strong>PV, oświetlenie PN-EN 12464, silnik, cosφ</strong> — wyniki wg norm PN-HD 60364.",
  },
  {
    gradient: "from-blue-500 to-blue-700",
    icon: Users,
    titleFn: () => "CRM + Analityka",
    descFn: () =>
      "<strong>Baza klientów</strong> z historią projektów i tagami. Wykresy przychodów i marż — decydujesz na podstawie liczb.",
  },
  {
    gradient: "from-slate-600 to-slate-800",
    icon: GitBranch,
    titleFn: () => "Współpraca Zespołowa",
    descFn: () =>
      "<strong>Real-time edycja kosztorysu</strong> z zespołem i Importer KNR z Excel/CSV — 130+ rozpoznawanych nagłówków.",
  },
] as const;

function BentoFeaturesSectionInner({ catalogCount }: BentoFeaturesSectionProps) {
  return (
    <section id="features" className="relative py-20 scroll-mt-20 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Wszystko w{" "}
            <span className="gradient-text-pro">jednym narzędziu</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            KNR, rozdzielnice, Portal Klienta, kalkulatory inżynierskie, CRM — zamiast pięciu osobnych programów.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENTO_FEATURES.map((f) => {
            const Icon = f.icon;
            const title = f.titleFn(catalogCount);
            const desc = f.descFn(catalogCount);
            return (
              <Card key={title} className="pro-card rounded-xl hover-lift group">
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-br ${f.gradient} rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-900 dark:text-white mb-2">{title}</CardTitle>
                  <CardDescription
                    className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: desc }}
                  />
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export const BentoFeaturesSection = React.memo(BentoFeaturesSectionInner);
