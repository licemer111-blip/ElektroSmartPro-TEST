import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Layers, BookOpen, CheckCircle, SplitSquareHorizontal,
  ReceiptText, Cpu, Sparkles,
} from "lucide-react";

const PILLARS = [
  {
    num: "I",
    gradient: "from-blue-600 to-blue-800",
    icon: SplitSquareHorizontal,
    title: "Inteligentna Architektura Ceny",
    intro:
      "System, który wie, że Robocizna i Materiał to dwie osobne rzeczy.",
    points: [
      {
        label: "Pełne rozdzielenie kosztów",
        text: "Robocizna i Materiał zawsze oddzielnie — w bazie, w tabeli i w PDF. Nigdy nie zlane w jedną kwotę.",
      },
      {
        label: "Regionalna dokładność — 16 województw",
        text: "Mazowieckie +20%, Podkarpackie i Podlaskie −12%. Współczynnik mnoży tylko robociznę.",
      },
      {
        label: "Smart VAT — 8% lub 23%",
        text: "Wybierasz typ obiektu (dom/biuro) — system sam ustawia właściwą stawkę VAT i przelicza sumę brutto.",
      },
    ],
  },
  {
    num: "II",
    gradient: "from-slate-600 to-slate-800",
    icon: BookOpen,
    title: "Godziny normy ES i własne ceny",
    intro:
      "Godziny rbh na gniazdo, kabel i bruzdę. To normy ES, nie tablica ORGBUD.",
    points: [
      {
        label: "NORMS_LABEL_PLACEHOLDER",
        text: "Każda pozycja ma kod ES, jednostkę i nakład rbh. Szacunek AI jest podpisany osobno i nie udaje urzędowego KNR.",
      },
      {
        label: "Złotówki ze stawki, nie z ukrytego mnożnika",
        text: "Kabel YDYp 3×2,5, gniazdo i bruzda w betonie mają osobne godziny. Kwota = rbh × Twoja stawka × województwo.",
      },
      {
        label: "Twoje ceny obok bazy ES",
        text: "Własna pozycja ma Twoją cenę materiału i robocizny. Baza ES nie nadpisuje jej po cichu.",
      },
    ],
  },
  {
    num: "III",
    gradient: "from-blue-500 to-blue-700",
    icon: Layers,
    title: "System Inteligentnych Zestawów",
    intro:
      "Wybierasz punkt — system sam liczy całą resztę.",
    points: [
      {
        label: "Jeden klik = kompletny BOM",
        text: "Punkt gniazda 230 V dokłada gniazdo, puszkę, YDYp 3×2,5 i bruzdę w cegle. Godziny są z normy ES.",
      },
      {
        label: "Żadnej ręcznej roboty",
        text: "Długość kabla w gotowym zestawie jest wpisana w przepis (dla gniazda 3,5 m). Sam jej z rysunku nie mierzy.",
      },
      {
        label: "Szablony wielokrotnego użycia",
        text: "Zapisujesz zestaw raz — używasz na każdym mieszkaniu. Wycena 3-pokojowego mieszkania: poniżej 5 minut.",
      },
    ],
  },
] as const;

interface FeaturesProps {
  dinCount?: number;
  normsCount?: number;
}

function FeaturesSectionInner({ normsCount = 0 }: FeaturesProps) {
  const normsLabel = normsCount > 0
    ? `Ponad ${(Math.floor(normsCount / 100) * 100).toLocaleString("pl-PL")} norm ES`
    : "Baza norm ES";
  const TOOLS = [
    {
      gradient: "from-blue-500 to-blue-700",
      icon: Cpu,
      title: "ES-Engine — Silnik Kosztorysowy",
      desc: "Najpierw Twój katalog, potem norma ES, na końcu szacunek AI. Godziny widać w rbh, złotówki liczy stawka.",
    },
    {
      gradient: "from-slate-500 to-slate-700",
      icon: Sparkles,
      title: "Kreator i szybka wycena",
      desc: "Szybka wycena bierze metraż i liczbę pomieszczeń. Suma na ekranie jest tą samą sumą w projekcie.",
    },
    {
      gradient: "from-blue-600 to-blue-800",
      icon: CheckCircle,
      title: "Widoczne ceny od pierwszego dnia",
      desc: "Na FREE widzisz pełne sumy. PDF z watermarkiem DEMO. PRO = nielimitowane projekty i czysty PDF do klienta.",
    },
    {
      gradient: "from-slate-500 to-slate-700",
      icon: ReceiptText,
      title: "PDF z logo i NIP",
      desc: "Wydruk dzieli materiał i robociznę. W DEMO jest znak wodny. Czysty plik dla klienta jest w PRO.",
    },
  ];
  return (
    <section className="relative py-20">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Trzy filary{" "}
            <span className="gradient-text-pro">profesjonalnej wyceny</span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Cena, godziny normy ES i zestawy punktów. Bez obietnic, których program nie liczy.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PILLARS.map(({ num, gradient, icon: Icon, title, intro, points }) => (
            <Card key={num} className="pro-card rounded-2xl hover-lift overflow-hidden group flex flex-col">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-4 relative">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-4xl font-black text-slate-200 dark:text-slate-700 select-none">{num}</span>
                </div>
                <CardTitle className="text-xl text-slate-900 dark:text-white leading-snug">
                  {title}
                </CardTitle>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">{intro}</p>
              </CardHeader>
              <CardContent className="relative flex-1 flex flex-col justify-start">
                <div className="space-y-4">
                  {points.map(({ label, text }) => (
                    <div key={label} className="flex gap-2.5">
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">{label === "NORMS_LABEL_PLACEHOLDER" ? normsLabel : label}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 4 Tool cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS.map(({ gradient, icon: Icon, title, desc }) => (
            <Card key={title} className="slate-card rounded-xl border hover:shadow-lg transition-all duration-300 hover-lift">
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-base text-slate-900 dark:text-white leading-snug">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export const FeaturesSection = React.memo(FeaturesSectionInner) as typeof FeaturesSectionInner;
