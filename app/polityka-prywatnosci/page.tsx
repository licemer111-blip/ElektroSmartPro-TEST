import Link from "next/link";
import { ArrowLeft, Shield, Lock, Database, Mail, Eye, UserCheck, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polityka Prywatności - ElektroSmart PRO | RODO",
  description: "Polityka Prywatności i Ochrona Danych Osobowych zgodna z RODO (UE 2016/679). ElektroSmart PRO - profesjonalny program do kosztorysowania dla elektryków. Bezpieczeństwo danych, prawa użytkowników, cookies.",
  keywords: [
    "polityka prywatności elektrosmart",
    "RODO elektrosmart pro",
    "ochrona danych elektryk",
    "prywatność kosztorysowanie",
  ],
  alternates: { canonical: "/polityka-prywatnosci" },
};

export default function PolitykaPrywatnosciPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrót do strony głównej
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Polityka Prywatności
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Ochrona Danych Osobowych (RODO) - Ostatnia aktualizacja: 12 stycznia 2026
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Important Notice */}
        <Alert className="mb-8 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-900 dark:text-green-100 font-semibold">
            Twoje dane są bezpieczne
          </AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-300 text-sm">
            Przetwarzamy Twoje dane osobowe zgodnie z RODO (Rozporządzenie UE 2016/679). 
            Szanujemy Twoją prywatność i stosujemy najwyższe standardy bezpieczeństwa.
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
                Administrator Danych Osobowych
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="text-sm">
                  Administratorem danych osobowych przetwarzanych w ramach systemu <strong>ElektroSmart PRO</strong> jest:
                </p>
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    ElektroSmart PRO
                  </p>
                  <p className="text-sm mt-2">
                    <Mail className="w-4 h-4 inline mr-2 text-blue-600 dark:text-blue-400" />
                    Kontakt w sprawach ochrony danych:{" "}
                    <a href="mailto:elektrosmartpro@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                      elektrosmartpro@gmail.com
                    </a>
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm">
                  Administrator zobowiązuje się przestrzegać zasad ochrony danych określonych w:
                </p>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside ml-4">
                  <li>Rozporządzeniu UE 2016/679 (RODO)</li>
                  <li>Ustawie o ochronie danych osobowych</li>
                  <li>Ustawie o świadczeniu usług drogą elektroniczną</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-sm font-bold">
                  2
                </span>
                Jakie Dane Zbieramy?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  2.1. Dane Podawane Przy Rejestracji
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong>Adres e-mail</strong> – niezbędny do logowania i kontaktu z Tobą</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span><strong>Hasło</strong> – przechowywane w formie zaszyfrowanej (hash)</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                  2.2. Dane Podawane Opcjonalnie (Profil Użytkownika)
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span><strong>Nazwa firmy</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span><strong>Numer telefonu</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span><strong>Adres firmy</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                    <span><strong>NIP</strong> (jeśli prowadzisz działalność gospodarczą)</span>
                  </li>
                </ul>
                <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 italic">
                  Uwaga: Te dane są <strong>opcjonalne</strong> i możesz je uzupełnić w Ustawieniach.
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  2.3. Dane Generowane Automatycznie
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                    <span><strong>Adres IP</strong> – w celach bezpieczeństwa i diagnostycznych</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                    <span><strong>Dane techniczne</strong> (przeglądarka, system operacyjny) – w celach optymalizacji UX</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                    <span><strong>Logi aktywności</strong> – daty logowania, akcje w systemie (do celów diagnostycznych)</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  2.4. Dane Tworzone Przez Ciebie
                </p>
                <ul className="text-sm mt-2 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 dark:text-slate-400 mt-0.5">•</span>
                    <span><strong>Projekty i kosztorysy</strong> – nazwy, opisy, pozycje, wyceny</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 dark:text-slate-400 mt-0.5">•</span>
                    <span><strong>Własne pozycje katalogu</strong> – dodane przez Ciebie do bazy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-slate-600 dark:text-slate-400 mt-0.5">•</span>
                    <span><strong>Zestawy (Assemblies)</strong> – tworzone konfiguracje</span>
                  </li>
                </ul>
                <p className="text-sm mt-2 text-slate-600 dark:text-slate-400 italic">
                  Uwaga: Te dane są <strong>Twoją własnością</strong> i możesz je usunąć w dowolnym momencie.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-sm font-bold">
                  3
                </span>
                W Jakim Celu Przetwarzamy Dane?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div className="grid gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    📝 Świadczenie Usług
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Twój e-mail jest niezbędny do logowania, wysyłania powiadomień oraz kontaktu w sprawach technicznych.
                    <br/><strong>Podstawa prawna:</strong> Wykonanie umowy (Art. 6 ust. 1 lit. b RODO).
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    🔒 Bezpieczeństwo i Ochrona
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Logi aktywności i adresy IP służą do ochrony przed nieautoryzowanym dostępem i atakami.
                    <br/><strong>Podstawa prawna:</strong> Prawnie uzasadniony interes (Art. 6 ust. 1 lit. f RODO).
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    💳 Rozliczenia i Subskrypcje
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    E-mail i dane rozliczeniowe (jeśli podane) są przetwarzane w celu obsługi płatności (Stripe).
                    <br/><strong>Podstawa prawna:</strong> Wykonanie umowy (Art. 6 ust. 1 lit. b RODO).
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <p className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    📊 Analiza i Ulepszanie Usług
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    Dane techniczne (typ przeglądarki, rozdzielczość) pomagają nam optymalizować interfejs.
                    <br/><strong>Podstawa prawna:</strong> Prawnie uzasadniony interes (Art. 6 ust. 1 lit. f RODO).
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    📧 Marketing (Opcjonalnie)
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Jeśli wyrazisz zgodę, możemy wysyłać Ci newsletter z nowościami o produkcie.
                    <br/><strong>Podstawa prawna:</strong> Zgoda (Art. 6 ust. 1 lit. a RODO) – w każdej chwili możesz ją wycofać.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm font-bold">
                  4
                </span>
                Gdzie Przechowujemy Dane?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Supabase (PostgreSQL)
                </p>
                <p className="text-sm mt-2">
                  Wszystkie dane użytkowników są przechowywane w bazie danych <strong>Supabase</strong> (PostgreSQL).
                </p>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside ml-4">
                  <li><strong>Lokalizacja serwerów:</strong> Unia Europejska (zgodność z RODO)</li>
                  <li><strong>Szyfrowanie:</strong> SSL/TLS dla wszystkich połączeń</li>
                  <li><strong>Backup:</strong> Automatyczne kopie zapasowe co 24h</li>
                  <li><strong>Certyfikacja:</strong> Supabase posiada certyfikat SOC 2 Type II</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Bezpieczeństwo
                </p>
                <p className="text-sm mt-2">
                  Stosujemy następujące środki bezpieczeństwa:
                </p>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside ml-4">
                  <li><strong>Szyfrowanie haseł</strong> (bcrypt/Argon2)</li>
                  <li><strong>Firewall</strong> i monitoring ruchu sieciowego</li>
                  <li><strong>Row Level Security (RLS)</strong> – izolacja danych między użytkownikami</li>
                  <li><strong>Regularne audyty bezpieczeństwa</strong></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-sm font-bold">
                  5
                </span>
                Udostępnianie Danych Podmiotom Trzecim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="text-sm">
                  <strong>Nie sprzedajemy</strong> Twoich danych osobowych żadnym podmiotom trzecim.
                </p>
                <p className="text-sm mt-2">
                  Twoje dane mogą być udostępniane wyłącznie w następujących przypadkach:
                </p>
              </div>
              <div className="space-y-3 mt-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    💳 Stripe (Operator Płatności)
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    Przy zakupie subskrypcji PRO, Twój e-mail jest przekazywany do Stripe w celu przetworzenia płatności.
                    <br/><strong>Podstawa prawna:</strong> Wykonanie umowy.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    📊 Usługi Analityczne (Opcjonalnie)
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    Możemy korzystać z narzędzi analitycznych (np. Google Analytics) w celu poprawy UX. 
                    Dane są anonimizowane.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    ⚖️ Wymóg Prawny
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    Możemy ujawnić dane na żądanie organów ścigania lub sądu (zgodnie z prawem polskim).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-sm font-bold">
                  6
                </span>
                Twoje Prawa (RODO)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="text-sm mb-4">
                  Zgodnie z RODO, przysługują Ci następujące prawa:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        Prawo Dostępu (Art. 15 RODO)
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Możesz zażądać kopii swoich danych osobowych, które przetwarzamy.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        Prawo do Sprostowania (Art. 16 RODO)
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Możesz poprawić nieprawidłowe dane (np. zmienić e-mail w Ustawieniach).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Database className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        Prawo do Usunięcia (Art. 17 RODO)
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Możesz zażądać usunięcia swojego konta i wszystkich danych. Skontaktuj się z nami: 
                        <a href="mailto:elektrosmartpro@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline ml-1">
                          elektrosmartpro@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        Prawo do Ograniczenia Przetwarzania (Art. 18 RODO)
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Możesz zażądać wstrzymania przetwarzania danych (np. podczas weryfikacji ich poprawności).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        Prawo do Przenoszenia Danych (Art. 20 RODO)
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Możesz otrzymać swoje dane w ustrukturyzowanym formacie (np. JSON/CSV) i przenieść je do innego systemu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                        Prawo do Sprzeciwu (Art. 21 RODO)
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        Możesz sprzeciwić się przetwarzaniu danych (np. dla celów marketingowych).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2">
                  Jak skorzystać z praw?
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Aby skorzystać z któregokolwiek z powyższych praw, wyślij wiadomość na:{" "}
                  <a href="mailto:elektrosmartpro@gmail.com" className="font-semibold hover:underline">
                    elektrosmartpro@gmail.com
                  </a>
                  <br/>
                  Odpowiemy w ciągu <strong>30 dni</strong> od otrzymania żądania (zgodnie z RODO).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold">
                  7
                </span>
                Pliki Cookie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="text-sm">
                  ElektroSmart PRO używa <strong>niezbędnych plików cookie</strong> do:
                </p>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside ml-4">
                  <li>Utrzymania sesji logowania (authentication token)</li>
                  <li>Zapamiętania preferencji UI (np. tryb ciemny/jasny)</li>
                  <li>Zapewnienia bezpieczeństwa (CSRF protection)</li>
                </ul>
              </div>
              <div>
                <p className="text-sm">
                  <strong>Nie używamy</strong> cookies śledzących do celów marketingowych bez Twojej zgody.
                </p>
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
                Okres Przechowywania Danych
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    📧 Dane Konta (e-mail, profil)
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    Przechowywane <strong>przez cały okres aktywności konta</strong>. 
                    Po usunięciu konta – dane są trwale usuwane w ciągu <strong>30 dni</strong>.
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    📊 Logi Aktywności
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    Przechowywane przez <strong>90 dni</strong> (w celach bezpieczeństwa i diagnostyki).
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    💳 Dane Rozliczeniowe (Stripe)
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    Przechowywane przez Stripe zgodnie z wymogami prawnymi (np. przepisy podatkowe) – 
                    zazwyczaj <strong>5-7 lat</strong>.
                  </p>
                </div>
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
                Zmiany w Polityce Prywatności
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="text-sm">
                  Zastrzegamy sobie prawo do aktualizacji niniejszej Polityki Prywatności. 
                  O istotnych zmianach poinformujemy Cię:
                </p>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside ml-4">
                  <li>Drogą mailową (na adres powiązany z kontem)</li>
                  <li>Przez powiadomienie w Systemie po zalogowaniu</li>
                </ul>
                <p className="text-sm mt-2">
                  Zalecamy regularne przeglądanie tej strony, aby być na bieżąco z naszymi praktykami ochrony danych.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 10 */}
          <Card className="dark:bg-slate-900 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 text-sm font-bold">
                  10
                </span>
                Kontakt w Sprawach Danych Osobowych
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700 dark:text-slate-300">
              <div>
                <p className="text-sm mb-3">
                  Jeśli masz pytania dotyczące przetwarzania danych osobowych lub chcesz skorzystać ze swoich praw RODO, 
                  skontaktuj się z nami:
                </p>
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-semibold text-green-900 dark:text-green-100 text-sm">
                    Administrator Danych Osobowych
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-300 mt-2">
                    <strong>ElektroSmart PRO</strong>
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-mail:{" "}
                    <a href="mailto:elektrosmartpro@gmail.com" className="font-semibold hover:underline">
                      elektrosmartpro@gmail.com
                    </a>
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400 mt-3 italic">
                    Odpowiemy w ciągu 30 dni od otrzymania Twojego zapytania.
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-2">
                  🛡️ Prawo do Wniesienia Skargi
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Jeśli uważasz, że przetwarzanie Twoich danych narusza RODO, masz prawo wnieść skargę do:
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                  <strong>Urząd Ochrony Danych Osobowych (UODO)</strong>
                  <br />
                  ul. Stawki 2, 00-193 Warszawa
                  <br />
                  <a href="https://uodo.gov.pl" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    https://uodo.gov.pl
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Twoje bezpieczeństwo jest dla nas priorytetem
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Niniejsza Polityka Prywatności obowiązuje od dnia <strong>12 stycznia 2026 roku</strong> i jest zgodna z:
                </p>
                <ul className="text-sm text-slate-700 dark:text-slate-300 mt-2 space-y-1">
                  <li>• Rozporządzeniem UE 2016/679 (RODO)</li>
                  <li>• Ustawą o ochronie danych osobowych z dnia 10 maja 2018 r.</li>
                  <li>• Ustawą o świadczeniu usług drogą elektroniczną</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
