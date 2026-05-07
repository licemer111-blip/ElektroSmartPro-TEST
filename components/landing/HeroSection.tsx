import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Sparkles, Shield } from "lucide-react";
import Link from "next/link";

const PDFDemoButton = dynamic(
  () => import("@/components/landing/pdf-demo-button").then(m => ({ default: m.PDFDemoButton })),
  { ssr: false, loading: () => <div className="h-12 sm:h-14 w-40 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" /> }
);

interface HeroSectionProps {
  normsCount?: number;
  categoriesCount?: number;
}

export function HeroSection({ normsCount = 8011, categoriesCount = 63 }: HeroSectionProps) {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16">
      <div className="relative grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">

        {/* Left Side — Text Content */}
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-left-8 duration-700">
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 badge-blue rounded-full text-sm font-medium hover:scale-105 transition-transform duration-300 shadow-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>v4.0 — Certyfikowany System Kosztorysowy | Normy KNR | PN-HD 60364</span>
          </div>

          {/* Engine badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 border border-slate-700/50 shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-300">Powered by</span>
            <span className="text-[11px] font-bold text-white tracking-wide">ES-Engine</span>
            <span className="text-[9px] text-slate-400 border-l border-slate-600 pl-2.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> PN-HD 60364
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
            Profesjonalne Kosztorysowanie{" "}
            <span className="gradient-text-pro">oparte na normach KNR i stawkach regionalnych</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-slate-900 dark:text-white">
              Jedyny system w Polsce, który automatycznie rozdziela Robociznę od Materiału,
            </strong>{" "}
            pilnuje stawek r-g dla Twojego województwa i inteligentnie dobiera VAT{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-200">(8% mieszkanie / 23% komercja)</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg btn-primary text-white rounded-xl shadow-lg shadow-blue-500/25"
              asChild
            >
              <Link href="/login?tab=signup">
                Wypróbuj za darmo — bez karty
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
            <PDFDemoButton />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4">
            <div className="pro-card rounded-xl p-3 sm:p-4 text-center hover-lift">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">350+</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Modułów DIN (Pełna baza osprzętu)</div>
            </div>
            <div className="pro-card rounded-xl p-3 sm:p-4 text-center hover-lift">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">Zestawy</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Twoje własne Assemblies</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Buduj zestawy r-g + materiały raz, używaj zawsze</div>
            </div>
            <div className="pro-card rounded-xl p-3 sm:p-4 text-center hover-lift">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{(Math.floor(normsCount / 1000) * 1000).toLocaleString("pl-PL")}+</div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">norm KNR</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{categoriesCount} kategorii · KNR 5-08 / 5-09</div>
            </div>
          </div>
        </div>

        {/* Right Side — A4 PDF Mockup */}
        <div className="relative flex justify-center lg:justify-end mt-8 lg:mt-0 animate-in fade-in slide-in-from-right-8 duration-700 delay-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/15 via-slate-500/10 to-blue-500/15 blur-3xl rounded-3xl transform translate-x-4 translate-y-4 glow-subtle" />

          <div className="relative w-full max-w-sm sm:max-w-md aspect-[1/1.4142] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-500/10 transform rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-500 overflow-hidden">
            <div className="h-full p-6 flex flex-col">
              {/* PDF Header */}
              <div className="flex items-start justify-between mb-5 pb-4 border-b-2 border-blue-600 dark:border-blue-500">
                <div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg mb-1.5 flex items-center justify-center shadow-md">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">TWOJA FIRMA SP. Z O.O.</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">NIP: 123-456-78-90</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Data wystawienia</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">12.01.2026</div>
                </div>
              </div>

              {/* PDF Title */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">OFERTA</h2>
                <div className="text-xs text-slate-600 dark:text-slate-400">Nr 2026/01/001</div>
              </div>

              {/* Client Info */}
              <div className="mb-4 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">Jan Kowalski</div>
                <div>ul. Przykładowa 123</div>
                <div>00-001 Warszawa</div>
              </div>

              {/* Table */}
              <div className="flex-1 mb-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                      <th className="text-left py-1.5 font-semibold text-slate-700 dark:text-slate-300">Nazwa</th>
                      <th className="text-center py-1.5 font-semibold text-slate-700 dark:text-slate-300 w-16">Ilość</th>
                      <th className="text-right py-1.5 font-semibold text-slate-700 dark:text-slate-300 w-20">Cena</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600 dark:text-slate-400">
                    {[
                      ["Punkt elektryczny w cegle", "24 szt", "4 320,00"],
                      ["Przewód YDYp 3x2.5mm²", "150 m", "2 850,00"],
                      ["Rozdzielnica 12-modułowa", "2 szt", "1 580,00"],
                      ["Montaż i uruchomienie", "1 kpl", "3 200,00"],
                    ].map(([name, qty, price]) => (
                      <tr key={name} className="border-b border-slate-200 dark:border-slate-700">
                        <td className="py-1.5">{name}</td>
                        <td className="text-center py-1.5">{qty}</td>
                        <td className="text-right py-1.5">{price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded p-2">
                  <div className="text-[0.6rem] font-semibold text-slate-900 dark:text-white mb-1">UWAGI</div>
                  <div className="text-[0.55rem] text-slate-600 dark:text-slate-400 space-y-0.5 leading-tight">
                    <div>1. Ceny materiałów mogą ulegać zmianom</div>
                    <div>2. Termin: do uzgodnienia</div>
                    <div>3. Ważność: 30 dni</div>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/50 border-2 border-blue-600 dark:border-blue-500 rounded p-2">
                  <div className="space-y-0.5 mb-1.5">
                    <div className="flex justify-between text-[0.6rem] text-slate-600 dark:text-slate-400">
                      <span>Materiał:</span><span>8 750,00</span>
                    </div>
                    <div className="flex justify-between text-[0.6rem] text-slate-600 dark:text-slate-400">
                      <span>Robocizna:</span><span>6 700,00</span>
                    </div>
                  </div>
                  <div className="border-t border-blue-200 dark:border-blue-800 pt-1.5">
                    <div className="flex justify-between items-center">
                      <div className="text-[0.65rem] font-semibold text-slate-900 dark:text-white">BRUTTO:</div>
                      <div className="text-base font-bold text-blue-600 dark:text-blue-400">15 450,00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
