import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Cable, 
  Zap, 
  Calculator, 
  Lightbulb,
  ArrowRightLeft,
  Wrench,
  Info,
  CheckCircle2,
  Activity,
  Shield,
  Cog,
  Battery,
  Anchor,
  Sun,
  ArrowRight,
  Cpu
} from "lucide-react";

export const metadata: Metadata = {
  title: "12 Kalkulatorów Inżynierskich dla Elektryków",
  description: "Profesjonalne kalkulatory elektryczne: przekrój kabla, spadek napięcia, prąd zwarcia Ik3/Ik1, dobrór zabezpieczeń MCB/RCD, fotowoltaika PV, oświetlenie PN-EN 12464, uziemienie, bilans obciążeń, silnik, cosφ, konwerter jednostek — zgodne z PN-HD 60364",
};

const tools = [
  {
    id: "short-circuit",
    title: "Prąd zwarcia",
    description: "Oblicz Ik3 i Ik1 dla transformatorów do 1600 kVA",
    features: ["Cu/Al do 300mm²", "PN-EN 60909", "Icn 6-50kA"],
    icon: Zap,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/20",
    href: "/dashboard/tools/short-circuit",
    popular: true,
  },
  {
    id: "load-calculator",
    title: "Obciążenie tablicy",
    description: "Sumowanie obciążeń z współczynnikiem jednoczesności",
    features: ["Tablice PN-HD", "Korekcje temp.", "Zabezpieczenia"],
    icon: Activity,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    href: "/dashboard/tools/load-calculator",
    popular: true,
  },
  {
    id: "cable-calculator",
    title: "Przekrój kabla",
    description: "Dobór przekroju 1.5-300mm² z 2 kryteriami (Iz i ΔU)",
    features: ["Cu/Al", "Metody B1/C", "PN-HD tablice"],
    icon: Cable,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    href: "/dashboard/tools/cable-calculator",
    popular: true,
  },
  {
    id: "voltage-drop",
    title: "Spadek napięcia",
    description: "Oblicz ΔU z reaktancją i impedancją (tryb zaawansowany)",
    features: ["R, X, Z", "cos φ", "Norma 3%/5%"],
    icon: Zap,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
    href: "/dashboard/tools/voltage-drop",
    popular: false,
  },
  {
    id: "unit-converter",
    title: "Konwerter jednostek",
    description: "Szybka konwersja: mm² ↔ AWG, kW ↔ HP, A ↔ kVA",
    features: ["AWG standard", "3-fazy", "Instant"],
    icon: ArrowRightLeft,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    href: "/dashboard/tools/unit-converter",
    popular: false,
  },
  {
    id: "lighting",
    title: "Oświetlenie",
    description: "17 typów pomieszczeń, metoda strumienia świetlnego",
    features: ["PN-EN 12464", "UF/MF", "7 typów opraw"],
    icon: Lightbulb,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/20",
    href: "/dashboard/tools/lighting",
    popular: false,
  },
  {
    id: "circuit-breaker",
    title: "Zabezpieczenia",
    description: "Dobór wyłączników: B/C/D curves, RCD 30/100/300mA",
    features: ["Ib≤In≤Iz", "Icn≥Ik", "PN-IEC"],
    icon: Shield,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/20",
    href: "/dashboard/tools/circuit-breaker",
    popular: true,
  },
  {
    id: "motor",
    title: "Silniki elektryczne",
    description: "Prądy rozruchowe DOL/Y-Δ/VFD, dobór zabezpieczeń",
    features: ["0.37-250kW", "IE1-IE4", "Ist 1.2-6.5×In"],
    icon: Cog,
    color: "text-cyan-600 dark:text-cyan-400",
    bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    href: "/dashboard/tools/motor",
    popular: true,
  },
  {
    id: "power-factor",
    title: "Moc bierna",
    description: "Baterie kondensatorów 2.5-250kvar, oszczędności i ROI",
    features: ["cos φ 0.9-0.98", "Payback", "Ekonomia"],
    icon: Battery,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/20",
    href: "/dashboard/tools/power-factor",
    popular: false,
  },
  {
    id: "earth-resistance",
    title: "Uziemienie",
    description: "Opór uziemienia dla TT/TN, 7 typów gruntów (10-10000Ω·m)",
    features: ["Multi-electrode", "PN-IEC 61936", "Auto count"],
    icon: Anchor,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/20",
    href: "/dashboard/tools/earth-resistance",
    popular: false,
  },
  {
    id: "pv",
    title: "Fotowoltaika",
    description: "Instalacja PV: moduły, produkcja, ROI 25 lat, CO₂",
    features: ["350-500Wp", "Prosument 1:0.8", "Autarky %"],
    icon: Sun,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    href: "/dashboard/tools/pv",
    popular: true,
  },
  {
    id: "automation-bms",
    title: "Automatyka BMS",
    description: "Złączki ZUG, DALI/KNX, sygnałowe — specyfikacja wg KNR 5-08",
    features: ["ZUG 1P/3P", "DALI / KNX", "KNR 5-08 0401"],
    icon: Cpu,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-100 dark:bg-violet-900/20",
    href: "/dashboard/tools/automation-bms",
    popular: false,
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Compact Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Narzędzia & Kalkulatory
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                12 profesjonalnych kalkulatorów elektrycznych
              </p>
            </div>
          </div>

          {/* Compact Info Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Obliczenia zgodne z normami PN-HD, PN-IEC, PN-EN.</strong> Wszystkie wyniki mają charakter orientacyjny – weryfikuj w dokumentacji producenta.
              </p>
            </div>
          </div>

          {/* Compact Tools Grid - 3 columns */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.id} href={tool.href}>
              <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer h-full flex flex-col border-2 border-blue-300 dark:border-blue-700/60 hover:border-blue-500 dark:hover:border-blue-400 hover:-translate-y-1 bg-white dark:bg-slate-900 shadow-[0_2px_12px_-2px_rgba(59,130,246,0.15)] hover:shadow-[0_8px_24px_-4px_rgba(59,130,246,0.25)]">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-cyan-500/[0.02] to-indigo-500/[0.02] dark:from-blue-500/[0.04] dark:via-cyan-500/[0.04] dark:to-indigo-500/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Glowing border effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300 rounded-lg bg-gradient-to-r from-blue-500/40 via-cyan-400/40 to-indigo-500/40 blur-sm -z-10 group-hover:blur-md"></div>
                
                <CardHeader className="relative p-5 pb-3 flex-1">
                  {/* Icon and Badge Row */}
                  <div className="flex items-center justify-between mb-4">
                    {/* Gradient Icon Container */}
                    <div className="relative">
                      <div className={`absolute inset-0 ${tool.bgColor} rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                      <div className={`relative p-3 rounded-xl ${tool.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-xl`}>
                        <Icon className={`w-6 h-6 ${tool.color} group-hover:rotate-6 transition-transform duration-300`} />
                      </div>
                    </div>
                    
                    {/* HOT Badge */}
                    {tool.popular && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                        <div className="relative flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white text-[10px] font-bold shadow-lg">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          HOT
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Title - with color change on hover */}
                  <CardTitle className="text-base font-bold mb-2 text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-all duration-300 text-center">
                    {tool.title}
                  </CardTitle>
                  
                  {/* Description */}
                  <CardDescription className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-4 text-center min-h-[2.5rem]">
                    {tool.description}
                  </CardDescription>
                  
                  {/* Features - with better styling */}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {tool.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-lg text-[10px] font-medium bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 shadow-sm group-hover:shadow-md transition-shadow"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardHeader>
                
                {/* Footer with enhanced action button */}
                <CardContent className="relative p-5 pt-0 mt-auto">
                  <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 group-hover:from-blue-500 group-hover:to-indigo-500 group-hover:text-white group-hover:border-transparent group-hover:shadow-lg transition-all duration-300">
                      <span className="text-xs">Otwórz kalkulator</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

          {/* Bottom Compact Info */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50 p-4 mt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                  Profesjonalne obliczenia
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  Tablice PN-HD, współczynniki korekcyjne, zaawansowane formuły – wszystko w jednym miejscu. 
                  <strong> 12 kalkulatorów</strong> używanych przez profesjonalistów.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
