import Link from "next/link";
import { ArrowLeft, FileText, Shield, CreditCard, Database, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Regulamin - ElektroSmart PRO | Warunki Korzystania",
  description: "Regulamin świadczenia usług ElektroSmart PRO - profesjonalny program do kosztorysowania instalacji elektrycznych. Warunki korzystania, subskrypcja PRO 159 PLN/mies, ochrona danych, prawa użytkowników.",
  keywords: [
    "regulamin elektrosmart",
    "warunki korzystania elektrosmart pro",
    "subskrypcja pro elektryk",
    "cennik elektrosmart",
  ],
  alternates: { canonical: "/regulamin" },
};

export default function RegulaminPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrót do strony głównej
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Regulamin Świadczenia Usług
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                ElektroSmart PRO - Ostatnia aktualizacja: 12 stycznia 2026
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Important Notice */}
        <Alert className="mb-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100 font-semibold">
            Ważne informacje
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-300 text-sm">
            Korzystając z ElektroSmart PRO, akceptujesz niniejszy Regulamin. 
            Prosimy o uważne przeczytanie wszystkich postanowień.
          </AlertDescription>
        </Alert>

        <div className="space-y-8">
          {/* Section 1 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  1
                </span>
                Definicje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">1.1. System</p>
                <p className="text-sm mt-1">
                  <strong>ElektroSmart PRO</strong> – webowy system ekspertowy do tworzenia profesjonalnych kosztorysów instalacji elektrycznych, 
                  dostępny pod adresem elektrosmart.pro (lub domeną wskazaną przez Usługodawcę).
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">1.2. Usługodawca</p>
                <p className="text-sm mt-1">
                  Podmiot świadczący usługi drogą elektroniczną za pośrednictwem Systemu. 
                  Kontakt: <a href="mailto:elektrosmartpro@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">elektrosmartpro@gmail.com</a>
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">1.3. Użytkownik</p>
                <p className="text-sm mt-1">
                  Osoba fizyczna, prawna lub jednostka organizacyjna nieposiadająca osobowości prawnej, 
                  która korzysta z Systemu po utworzeniu konta.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">1.4. Baza Macierzowa (Katalog Pozycji)</p>
                <p className="text-sm mt-1">
                  Zbiór danych o pozycjach elektrycznych (ceny, jednostki, opisy), będący własnością intelektualną Usługodawcy. 
                  Baza jest udostępniana Użytkownikowi wyłącznie w ramach korzystania z Systemu.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">1.5. Subskrypcja PRO</p>
                <p className="text-sm mt-1">
                  Płatny model dostępu do pełnej funkcjonalności Systemu, rozliczany cyklicznie (miesięcznie).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  2
                </span>
                Postanowienia Ogólne
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">2.1. Cel Systemu</p>
                <p className="text-sm mt-1">
                  System służy do <strong>wspomagania procesu tworzenia kosztorysów</strong> instalacji elektrycznych 
                  dla obiektów na terenie Polski. Wyniki działania Systemu mają charakter <strong>szacunkowy i orientacyjny</strong>.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">2.2. Odpowiedzialność Użytkownika</p>
                <p className="text-sm mt-1">
                  Użytkownik jest <strong>wyłącznie odpowiedzialny</strong> za ostateczne wyceny przedstawiane klientom. 
                  System dostarcza jedynie narzędzi do szacowania – ostateczne decyzje cenowe podejmuje Użytkownik.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">2.3. Akceptacja Regulaminu</p>
                <p className="text-sm mt-1">
                  Rejestracja w Systemie i korzystanie z jego funkcji oznacza pełną akceptację niniejszego Regulaminu.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  3
                </span>
                Rejestracja i Konto Użytkownika
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">3.1. Warunki Rejestracji</p>
                <ul className="text-sm mt-1 space-y-1 list-disc list-inside">
                  <li>Rejestracja wymaga podania aktywnego adresu e-mail i hasła.</li>
                  <li>Użytkownik potwierdza, że jest pełnoletni i ma pełną zdolność do czynności prawnych.</li>
                  <li>Jeden adres e-mail może być przypisany tylko do jednego konta.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">3.2. Ochrona Konta</p>
                <p className="text-sm mt-1">
                  Użytkownik jest zobowiązany do zachowania w tajemnicy danych logowania. 
                  Wszelkie działania wykonane z poziomu konta Użytkownika są przypisane do niego.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">3.3. Usunięcie Konta</p>
                <p className="text-sm mt-1">
                  Użytkownik może w każdej chwili usunąć swoje konto, kontaktując się z Usługodawcą. 
                  Usunięcie konta jest nieodwracalne i skutkuje trwałym usunięciem wszystkich danych Użytkownika.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-sm font-bold">
                  4
                </span>
                Rodzaje Kont i Subskrypcja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">4.1. Konto Darmowe (FREE)</p>
                <ul className="text-sm mt-1 space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Możliwość tworzenia kosztorysów (ograniczenie: 1 aktywny projekt).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <span><strong>BRAK dostępu do cen końcowych</strong> – ceny są ukryte (blur mode).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <span><strong>BRAK eksportu do PDF.</strong></span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">4.2. Subskrypcja PRO</p>
                <ul className="text-sm mt-1 space-y-1">
                  <li className="flex items-start gap-2">
                    <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Cena: 159 PLN netto/miesiąc</strong> (płatność cykliczna przez Stripe).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Nieograniczona liczba projektów.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Pełny dostęp do cen i wycen końcowych.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Eksport kosztorysów do PDF.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <span>Priorytetowe wsparcie techniczne.</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">4.3. Rezygnacja z Subskrypcji</p>
                <p className="text-sm mt-1">
                  Użytkownik może anulować subskrypcję w każdej chwili przez Panel Zarządzania Subskrypcją (Stripe Customer Portal). 
                  Anulowanie skutkuje zakończeniem dostępu z końcem bieżącego okresu rozliczeniowego (brak zwrotów za niewykorzystany czas).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-sm font-bold">
                  5
                </span>
                Własność Intelektualna
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">5.1. Baza Macierzowa</p>
                <p className="text-sm mt-1">
                  <strong>Baza Macierzowa (Katalog Pozycji)</strong> jest własnością intelektualną Usługodawcy i jest <strong>chroniona prawem autorskim</strong>. 
                  Użytkownik otrzymuje wyłącznie prawo do korzystania z Bazy w ramach Systemu.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">5.2. Zakaz Kopiowania i Dystrybucji</p>
                <p className="text-sm mt-1">
                  Zabronione jest:
                </p>
                <ul className="text-sm mt-1 space-y-1 list-disc list-inside ml-4">
                  <li>Kopiowanie, powielanie, dystrybucja Bazy Macierzowej poza Systemem.</li>
                  <li>Odtwarzanie struktury bazy danych (reverse engineering).</li>
                  <li>Wykorzystywanie danych z Bazy do tworzenia konkurencyjnych produktów.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">5.3. Dane Użytkownika</p>
                <p className="text-sm mt-1">
                  Projekty i kosztorysy tworzone przez Użytkownika pozostają jego własnością. 
                  Usługodawca nie rości sobie praw do treści tworzonych przez Użytkownika.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-sm font-bold">
                  6
                </span>
                Wyłączenie Odpowiedzialności
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">6.1. Charakter Szacunkowy</p>
                <p className="text-sm mt-1">
                  Wszystkie ceny, wyceny i wyniki generowane przez System mają charakter <strong>szacunkowy i pomocniczy</strong>. 
                  Usługodawca nie gwarantuje ich zgodności z rzeczywistymi kosztami realizacji projektu.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">6.2. Odpowiedzialność Użytkownika</p>
                <p className="text-sm mt-1">
                  Użytkownik ponosi <strong>pełną odpowiedzialność</strong> za ostateczne wyceny przedstawiane swoim klientom. 
                  System jest jedynie narzędziem wspomagającym – nie zastępuje profesjonalnej oceny technicznej i cenowej.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">6.3. Wyłączenie Gwarancji</p>
                <p className="text-sm mt-1">
                  System jest dostarczany w stanie „as is" (tak jak jest). Usługodawca nie udziela gwarancji:
                </p>
                <ul className="text-sm mt-1 space-y-1 list-disc list-inside ml-4">
                  <li>Nieprzerwanego działania Systemu (możliwe przerwy techniczne).</li>
                  <li>Braku błędów w Bazie Macierzowej lub algorytmach wyceny.</li>
                  <li>Dostępności wszystkich funkcji w każdym momencie.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold">
                  7
                </span>
                Zakazy i Naruszenia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">7.1. Zabronione Działania</p>
                <p className="text-sm mt-1">
                  Użytkownik zobowiązuje się nie podejmować następujących działań:
                </p>
                <ul className="text-sm mt-1 space-y-1 list-disc list-inside ml-4">
                  <li>Łamanie zabezpieczeń Systemu (hacking, ataki DDoS).</li>
                  <li>Próby wydobycia Bazy Macierzowej (web scraping, API abuse).</li>
                  <li>Udostępnianie dostępu do konta osobom trzecim.</li>
                  <li>Wykorzystywanie Systemu w celach niezgodnych z prawem.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">7.2. Konsekwencje Naruszeń</p>
                <p className="text-sm mt-1">
                  W przypadku naruszenia Regulaminu, Usługodawca ma prawo do:
                </p>
                <ul className="text-sm mt-1 space-y-1 list-disc list-inside ml-4">
                  <li><strong>Natychmiastowego zablokowania konta</strong> bez zwrotu opłat.</li>
                  <li>Dochodzenia roszczeń odszkodowawczych.</li>
                  <li>Zgłoszenia sprawy organom ścigania (w przypadku działań przestępczych).</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold">
                  8
                </span>
                Ochrona Danych Osobowych
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="text-sm">
                  Szczegółowe informacje na temat przetwarzania danych osobowych znajdują się w{" "}
                  <Link href="/polityka-prywatnosci" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                    Polityce Prywatności
                  </Link>.
                </p>
              </div>
              <div>
                <p className="text-sm">
                  System przetwarza dane osobowe zgodnie z RODO (Rozporządzenie UE 2016/679). 
                  Administratorem danych jest Usługodawca.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 9 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold">
                  9
                </span>
                Postanowienia Końcowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">9.1. Zmiany Regulaminu</p>
                <p className="text-sm mt-1">
                  Usługodawca zastrzega sobie prawo do zmiany Regulaminu. 
                  Użytkownicy zostaną poinformowani o zmianach drogą mailową z 14-dniowym wyprzedzeniem.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">9.2. Prawo Właściwe</p>
                <p className="text-sm mt-1">
                  Regulamin podlega prawu polskiemu. Wszelkie spory będą rozstrzygane przez sądy powszechne właściwe dla siedziby Usługodawcy.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">9.3. Kontakt</p>
                <p className="text-sm mt-1">
                  W sprawach dotyczących Regulaminu lub funkcjonowania Systemu prosimy o kontakt:
                </p>
                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">ElektroSmart PRO</p>
                  <p className="text-sm">
                    Email: <a href="mailto:elektrosmartpro@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">elektrosmartpro@gmail.com</a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="mt-8 p-6 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
              Niniejszy Regulamin obowiązuje od dnia 12 stycznia 2026 roku.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center mt-2">
              Korzystanie z ElektroSmart PRO jest równoznaczne z akceptacją postanowień Regulaminu.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
