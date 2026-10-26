import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles } from "lucide-react";
import { GuideAccordion } from "./_parts/GuideAccordion";

interface GuideSectionProps {
  catalogCount?: number;
}

export function GuideSection(_props: GuideSectionProps = {}) {
  void _props;
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
                System kosztorysowy dla elektryków: norma ES, zestawy, kalkulatory i eksport PDF.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Guide Accordion */}
      <Card className="bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
        <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
          <GuideAccordion />
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
                <li><strong>1.</strong> Uzupełnij <strong>Profil firmy</strong> (NIP, logo) — pojawią się na PDF</li>
                <li><strong>2.</strong> Ustaw <strong>stawkę rbh</strong> i <strong>województwo</strong> w Finansach</li>
                <li><strong>3.</strong> Zrób <strong>szybką wycenę</strong> albo nowy projekt i dodaj pozycje z katalogu</li>
                <li><strong>4.</strong> Zestaw „punkt gniazda” wstawia gniazdo, puszkę, kabel i bruzdę</li>
                <li><strong>5.</strong> PDF: w DEMO jest znak wodny, czysty wydruk jest w PRO</li>
              </ol>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-indigo-200 dark:border-indigo-800">
                <p className="text-[10px] sm:text-xs text-indigo-700 dark:text-indigo-300">
                  <strong>W skrócie:</strong> rbh × stawka × województwo · materiał osobno · VAT 8% albo 23% · PDF
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}