import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles } from "lucide-react";
import { GuideAccordion } from "./_parts/GuideAccordion";
import { DIN_MODULES } from "@/lib/data/din-modules-catalog";

interface GuideSectionProps {
  catalogCount?: number;
}

export function GuideSection({ catalogCount: catalogCountProp }: GuideSectionProps = {}) {
  const catalogCount = catalogCountProp || 1400;
  const dinCount = DIN_MODULES.length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Card */}
      <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex-shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg">Przewodnik ElektroSmart PRO</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                System kosztorysowy dla elektryków: wyceny AI (8500+ norm KNR), konfigurator rozdzielnic, zestawy, kalkulatory, portal klienta i więcej.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Guide Accordion */}
      <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <GuideAccordion catalogCount={catalogCount} dinCount={dinCount} />
        </CardContent>
      </Card>

      {/* Quick Tips Card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-200 dark:border-indigo-800">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-indigo-900 dark:text-indigo-100 mb-2">
                Szybki Start — ElektroSmart PRO
              </h3>
              <ol className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-indigo-800 dark:text-indigo-200">
                <li><strong>1.</strong> Uzupełnij <strong>Profil Firmy</strong> (NIP, logo, dane) — pojawią się na PDF-ach</li>
                <li><strong>2.</strong> Ustaw <strong>województwo</strong> i <strong>stawkę R-G</strong> w Ustawienia → Finanse</li>
                <li><strong>3.</strong> Utwórz pierwszy <strong>projekt</strong> i dodaj pozycje ręcznie lub przez <strong>ES Import</strong></li>
                <li><strong>4.</strong> Kliknij <strong>ES Wycena</strong> — system przeliczy ceny na podstawie 8500+ norm KNR</li>
                <li><strong>5.</strong> Wgraj własne cenniki do <strong>Moje Dane</strong> — Twoje ceny będą miały priorytet P1</li>
                <li><strong>6.</strong> Stwórz <strong>Zestawy</strong> (np. „Punkt gniazda”) — dodawaj gotowe komplety jednym klikiem</li>
                <li><strong>7.</strong> Skonfiguruj <strong>Rozdzielnicę</strong> — {dinCount}+ modułów DIN, bilans faz, schemat PDF</li>
                <li><strong>8.</strong> Eksportuj <strong>PDF z logo</strong> i wyślij klientowi lub użyj <strong>Portalu Klienta</strong></li>
                <li><strong>9.</strong> <strong>Zainstaluj aplikację</strong> (PWA) — działa też na telefonie i offline</li>
              </ol>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-indigo-200 dark:border-indigo-800">
                <p className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-300">
                  <strong>W skrócie:</strong> 8500+ norm KNR · Konfigurator rozdzielnic ({dinCount}+ DIN) · Wyceny AI · Zestawy · Portal Klienta · PDF z logo · Sekcje wg pomieszczeń · Współpraca zespołowa
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}