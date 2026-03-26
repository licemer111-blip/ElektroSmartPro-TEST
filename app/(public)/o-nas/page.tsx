import Link from "next/link";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";
import { ArrowLeft, Users, Target, Shield, Zap, TrendingUp, CheckCircle, Sparkles, Award, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "O Nas — ElektroSmart PRO | Profesjonalny Program Kosztorysowy",
  description: `ElektroSmart PRO v1.0 — program kosztorysowy od elektryków dla elektryków. Import Excel/CSV + silnik inżynieryjny ES-Engine, konfigurator rozdzielnic 120+ modułów DIN, portal klienta z e-podpisem. ✓ ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR ✓ 12 kalkulatorów ✓ VAT 8%/23% ✓ 16 województw.`,
  keywords: [
    "o nas elektrosmart",
    "program dla elektryków",
    "kosztorysowanie elektryczne",
    "oprogramowanie dla elektryków polska",
    "firma elektrosmart pro",
    "narzędzie dla elektryków",
  ],
  openGraph: {
    title: "O Nas — ElektroSmart PRO v1.0 | Program Kosztorysowy",
    description: "Poznaj ElektroSmart PRO — import Excel/CSV + silnik inżynieryjny ES-Engine, konfigurator rozdzielnic 120+ modułów DIN, portal klienta z e-podpisem.",
    type: "website",
    locale: "pl_PL",
  },
};

export default function ONasPage() {
  return (
    <div className="min-h-screen">
      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Powrót do strony głównej
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              O Nas
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Kim jesteśmy i co robimy?
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Hero Section */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  🔌 Od elektryków dla elektryków
                </Badge>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                ElektroSmart PRO
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Profesjonalny program kosztorysowy stworzony z szacunkiem do pracy elektryków. 
                Pomagamy polskim specjalistom <strong>oszczędzać czas</strong>, <strong>wyglądać profesjonalnie</strong> 
                i <strong>zarabiać więcej</strong>.
              </p>
            </div>
          </Card>

          {/* Mission */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Nasza Misja</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <p className="text-base leading-relaxed">
                Wiemy, jak wymagająca jest praca elektryka. Setki pozycji do zapamiętania, różne stawki regionalne, 
                ciągłe zmiany cen materiałów, konieczność uwzględnienia VAT 8% i 23%... 
                To wszystko <strong>zabiera czas i energię</strong>, którą można przeznaczyć na rzeczywistą pracę.
              </p>
              <p className="text-base leading-relaxed">
                Dlatego stworzyliśmy <strong>ElektroSmart PRO</strong> – program, który <strong>ułatwia proces wyceny</strong>, 
                pomaga eliminować błędy i pozwala szybko przygotować profesjonalny kosztorys, który zaimponuje klientowi.
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  💡 "Mniej czasu na liczenie, więcej na zarabianie"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Why We Created This */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle>Dlaczego To Zrobiliśmy?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <p className="text-base leading-relaxed">
                Rozmawialiśmy z dziesiątkami elektryków w całej Polsce. Wszyscy mówili o tym samym:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm">
                    <strong>"Liczenie kosztorysów zabiera mi pół dnia"</strong> – Wycena dla średniego domu to godziny pracy z Excelem.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm">
                    <strong>"Trudno nadążyć za cenami materiałów"</strong> – Ceny miedzi i kabli zmieniają się co tydzień.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm">
                    <strong>"Klienci mówią, że moje wyceny wyglądają nieprofesjonalnie"</strong> – Kartka papieru z ręcznym pismem to nie 2026 rok.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                  <p className="text-sm">
                    <strong>"Każde województwo ma inne stawki"</strong> – Jak uwzględnić współczynniki regionalne?
                  </p>
                </div>
              </div>
              <p className="text-base leading-relaxed mt-4">
                To właśnie te problemy chcieliśmy rozwiązać. I tak powstał <strong>ElektroSmart PRO</strong>.
              </p>
            </CardContent>
          </Card>

          {/* What Makes Us Different */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle>Co Nas Wyróżnia?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Efektywność
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Kosztorys, który wcześniej zajmował Ci 3 godziny, teraz przygotuj w <strong>15 minut</strong>. 
                        Szybkie obliczenia, gotowe szablony zestawów (np. "Punkt gniazda podtynkowy"), 
                        katalog {SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR i możliwość importu Excel/CSV.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Precyzja (Katalog {SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR)
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Nasz <strong>Katalog</strong> zawiera <strong>{SYSTEM_STATS_FALLBACK.normsLabelRounded} norm KNR</strong> z rynku polskiego: 
                        ceny materiałów, robocizny, jednostki miary. Wszystko oparte na rzeczywistych ofertach z 2026 roku. 
                        Fulltext search z obsługą błędów pisowni. Bez guessingu, bez błędów.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Polski Rynek (VAT 8% i 23%)
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Program <strong>automatycznie</strong> liczy VAT 8% dla budownictwa mieszkaniowego i 23% dla komercyjnego. 
                        Współczynniki regionalne dla 16 województw. Aktualne ceny materiałów 2026.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        Profesjonalny Wizerunek
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Eksport do PDF z logo firmy, czytelne tabele, podsumowanie VAT, warunki płatności. 
                        Klient dostaje dokument, który wygląda jak z dużej firmy. <strong>First impression matters.</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        ⚡ ElektroSmart Core + Konfigurator Rozdzielnic (v4.0)
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <strong>Silnik inżynieryjny ES-Engine wspomaga analizę dokumentów i specyfikacji.</strong>{" "}
                        Import ręczny Excel/CSV lub z pomocą silnika inżynieryjnego. Konfigurator rozdzielnic 120+ modułów DIN wg PN-EN 61439, schemat jednokreskowy, Live Chat i protokoły PN-HD 60364-6.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                        👥 CRM + Zespoły + Portal Klienta 2.0
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <strong>Baza klientów z historią projektów</strong>, portal klienta z e-podpisem i galerią portfolio, 
                        współpraca zespołowa z Live Chat, wspólnym katalogiem i edytowaniem projektów w czasie rzeczywistym.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* For Who */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                  <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Dla Kogo?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <p className="text-base leading-relaxed">
                ElektroSmart PRO jest stworzony z myślą o:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Jednoosobowych Działalnościach Gospodarczych
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Elektryk, który sam prowadzi firmę i nie ma czasu na biurokrację.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Małych Firmach Elektrycznych (2-10 osób)
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Firma, która chce standaryzować proces wyceny i wyglądać profesjonalnie.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Średnich Wykonawcach (10-50 osób)
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Firma, która potrzebuje systemu do zarządzania wieloma projektami jednocześnie.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Studentach i Początkujących
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Osobach uczących się zawodu, które chcą poznać rynkowe ceny i nauczyć się wyceniać projekty.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Values */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <Heart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>Nasze Wartości</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">
                    🎯 Transparentność
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Nie ukrywamy cen ani funkcji. FREE to FREE, PRO to PRO.
                  </p>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-semibold text-green-900 dark:text-green-100 text-sm mb-1">
                    🚀 Innowacyjność
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-300">
                    Ciągle rozwijamy system na podstawie Waszych feedbacków.
                  </p>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-1">
                    🤝 Szacunek
                  </p>
                  <p className="text-xs text-purple-800 dark:text-purple-300">
                    Rozumiemy, że praca elektryka to ciężka fizyczna robota i odpowiedzialność.
                  </p>
                </div>

                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="font-semibold text-orange-900 dark:text-orange-100 text-sm mb-1">
                    💰 Uczciwość
                  </p>
                  <p className="text-xs text-orange-800 dark:text-orange-300">
                    159 PLN/m-c to uczciwa cena za narzędzie, które zaoszczędzi Ci dziesiątki godzin.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-3">
                Dołącz do Rosnącej Społeczności
              </h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Dziesiątki elektryków w całej Polsce już korzysta z ElektroSmart PRO. 
                Zacznij oszczędzać czas i zarabiać więcej.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link 
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Zap className="w-5 h-5" />
                  Zacznij Za Darmo
                </Link>
                <Link 
                  href="/kontakt"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/30 rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  Skontaktuj Się
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
