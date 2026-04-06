"use client";

import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Sparkles, Zap, TrendingUp, Shield, FileText, Rocket, Copy, Upload, Wrench } from "lucide-react";

interface GuideAccordionProps {
  catalogCount?: number;
  dinCount?: number;
}

export function GuideAccordion({ catalogCount = 1400, dinCount = 295 }: GuideAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {/* Item 1: Workflow */}
      <AccordionItem value="item-1" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">🚀 Jak zacząć? Workflow ElektroSmart PRO</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p>ElektroSmart PRO oferuje <strong>4 sposoby</strong> tworzenia kosztorysów. Wybierz najwygodniejszy:</p>
          <p className="mt-3"><strong className="text-orange-600 dark:text-orange-400">Sposób 1: ⚡ Szybka Wycena (60 sekund!)</strong></p>
          <ul className="mt-2 ml-4 space-y-1 text-sm">
            <li>• Wybierz typ obiektu (mieszkanie, dom, biuro), mitraż i standard</li>
            <li>• ES-Engine automatycznie wygeneruje kompletny kosztorys z cenami</li>
            <li>• Idealny do szybkich szacunków na spotkaniu z klientem</li>
          </ul>
          <p className="mt-3"><strong className="text-purple-600 dark:text-purple-400">Sposób 2: 📄 ES Import (analiza PDF/Excel/KNR)</strong></p>
          <ul className="mt-2 ml-4 space-y-1 text-sm">
            <li>• Wgraj specyfikację (PDF), wykaz KNR lub listę materiałów (Excel .xlsx)</li>
            <li>• ES-Engine wyodrębni pozycje i dopasuje ceny z Twojej Bazy KNR i katalogu</li>
            <li>• Vision Mode: wgraj rzut budowlany — ES-Engine policzy gniazdka, lampy i wyłączniki!</li>
            <li>• Kliknij &quot;Szybka Wycena z dokumentu&quot; aby od razu utworzyć projekt</li>
          </ul>
          <p className="mt-3"><strong className="text-blue-600 dark:text-blue-400">Sposób 3: 📋 Szablony Projektów</strong></p>
          <ul className="mt-2 ml-4 space-y-1 text-sm">
            <li>• Utwórz projekt z gotowego szablonu jednym kliknięciem</li>
            <li>• Twórz własne szablony z istniejących projektów — używaj wielokrotnie!</li>
            <li>• Gotowe szablony systemowe: Mieszkanie 50m², Łazienka, Rozdzielnica</li>
          </ul>
          <p className="mt-3"><strong className="text-violet-600 dark:text-violet-400">Sposób 4: 🔌 Konfigurator Rozdzielnic</strong></p>
          <ul className="mt-2 ml-4 space-y-1 text-sm">
            <li>• Skonfiguruj rozdzielnicę z {dinCount}+ modułów DIN (wyłączniki, RCD, SPD, złączki...)</li>
            <li>• Schemat wieloliniowy L1/L2/L3/N/PE generowany automatycznie</li>
            <li>• Eksport BOM do projektu lub PDF z pełnym zestawieniem</li>
          </ul>
          <p className="mt-3"><strong className="text-green-600 dark:text-green-400">Dalej: Edytor & Zestawy</strong></p>
          <ul className="mt-2 ml-4 space-y-1 text-sm">
            <li>• Edytuj pozycje w Kreatorze — sekcje wg pomieszczeń (Kuchnia, Łazienka, Salon...)</li>
            <li>• Dodaj Zestawy (np. &quot;Punkt Gniazdo&quot; = puszka + kabel + bruzda + robocizna)</li>
            <li>• Region automatycznie wpływa na stawki r-g i modyfikatory cen</li>
            <li>• Eksportuj PDF/Excel lub wyślij ofertę mailem z podpisem elektronicznym</li>
          </ul>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            💡 <em>Gotowa baza {catalogCount}+ pozycji katalogowych. Ceny ściśle rozdzielone na Materiał i Robociznę.</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 1b: Tryby Wyceny */}
      <AccordionItem value="item-modes" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">⚙️ 3 Tryby Wyceny — ES-Engine / Hybrydowy / Własna Baza</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p>ElektroSmart PRO oferuje <strong>3 tryby pracy silnika wyceny</strong>. Przełączasz w <strong>Katalogu</strong> (panel kategorii) lub w <strong>Kreatorze</strong> (sidebar):</p>
          <p className="mt-3">
            <strong className="text-orange-600 dark:text-orange-400">🟠 ES-Engine (domyślny)</strong>
          </p>
          <ul className="mt-1 ml-4 space-y-1 text-sm">
            <li>• Wyceny oparte wyłącznie na normach ES-KNR 2026 + Twoja stawka R-G</li>
            <li>• Przeszukuje globalną bazę ES-Dictionary (8 500+ pozycji)</li>
            <li>• Idealny gdy zaczynasz i nie masz jeszcze własnego katalogu</li>
          </ul>
          <p className="mt-3">
            <strong className="text-blue-600 dark:text-blue-400">🔵 Tryb Hybrydowy ★ (zalecany)</strong>
          </p>
          <ul className="mt-1 ml-4 space-y-1 text-sm">
            <li>• <strong>Twój katalog osobisty ma priorytet</strong> — ściśle Twoje ceny</li>
            <li>• Dla pozycji bez ceny w katalogu → fallback na normy KNR</li>
            <li>• Wyszukiwanie pokazuje pozycje z obu źródeł jednocześnie</li>
            <li>• Najlepszy balans: własne ceny + pełna baza KNR dla braków</li>
          </ul>
          <p className="mt-3">
            <strong className="text-violet-600 dark:text-violet-400">🟣 Własna Baza (ekspert)</strong>
          </p>
          <ul className="mt-1 ml-4 space-y-1 text-sm">
            <li>• Wyłącznie Twój prywatny katalog — żadna baza zewnętrzna</li>
            <li>• Brak pozycji w katalogu = brak wyceny (nie sięga do KNR)</li>
            <li>• Dla firm z własnym, kompletnym cennikiem</li>
          </ul>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            💡 <em>Tryb widoczny w panelu kategorii (Własna / ES-Engine / Hybrydowy). Zmiana natychmiast filtruje pozycje.</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 2: Zestawy */}
      <AccordionItem value="item-2" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">⚡ Zestawy - Licz szybciej</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p>Przestań liczyć pojedyncze śrubki. <strong className="text-indigo-600 dark:text-indigo-400">&quot;Zestaw&quot;</strong> to grupa materiałów i robocizny.</p>
          <p className="mt-3">Np. wybierając <strong>&quot;Punkt Gniazdo&quot;</strong>, system automatycznie dodaje:</p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Puszkę podtynkową</li>
            <li>3m przewodu YDYp</li>
            <li>Gips montażowy</li>
            <li>Robociznę (czas montażu)</li>
          </ul>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            💡 <em>Możesz tworzyć własne zestawy w zakładce <strong>&quot;Zestawy&quot;</strong>.</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 3: Rynek */}
      <AccordionItem value="item-3" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">📈 Analiza Rynku i Trendy</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p>Monitorujemy ceny w <strong>16 województwach</strong>. W zakładce <strong className="text-green-600 dark:text-green-400">&quot;Rynek&quot;</strong> możesz sprawdzić średnie stawki dla Twojego regionu.</p>
          <p className="mt-3">Jeśli masz wersję <strong>DEMO</strong>, ceny są ukryte (gwiazdki <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">**** zł</code>).</p>
          <p className="mt-3">Wersja <strong className="text-indigo-600 dark:text-indigo-400">PRO</strong> odblokowuje:</p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Pełny wgląd w stawki regionalne</li>
            <li>Trendy tygodniowe (zmiana cen t/t)</li>
            <li>Porównanie z średnią krajową</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      {/* Item 4: Katalog */}
      <AccordionItem value="item-4" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">📦 Katalog & Zarządzanie Pozycjami</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p>W zakładce <strong className="text-purple-600 dark:text-purple-400">&quot;Katalog&quot;</strong> masz pełną kontrolę nad bazą pozycji:</p>
          <p className="mt-3"><strong className="text-indigo-600 dark:text-indigo-400">3 tryby źródła (przełącznik w panelu kategorii)</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li><strong>Własna</strong> — tylko Twoje pozycje; możesz dodawać kategorie i edytować ceny</li>
            <li><strong>ES-Engine</strong> — globalna baza 8500+ norm KNR z cenami materiału i robocizny</li>
            <li><strong>Hybrydowy</strong> — oba źródła razem, Twoje pozycje mają priorytet</li>
          </ul>
          <p className="mt-3"><strong className="text-green-600 dark:text-green-400">Własne Pozycje i ES-Engine</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>W trybie <strong>Własne</strong> kliknij <strong>+ Kategoria</strong> lub <strong>+ Pozycja</strong> w sidebarze</li>
            <li>Generuj pozycje przez <strong>ES Creator</strong> w pasku narzędzi (oznaczone ⚡)</li>
            <li>Importuj pozycje przez <strong>ES Import</strong> z pliku Excel/CSV</li>
          </ul>
          <p className="mt-3 text-sm text-purple-600 dark:text-purple-400">
            💡 <em>Baza KNR jest wspólna dla wszystkich użytkowników. Twoje pozycje są prywatne i widoczne tylko dla Ciebie (lub zespołu).</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 5: ES Import */}
      <AccordionItem value="item-5" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Upload className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">📤 ES Import — Analiza PDF/Excel/KNR i Vision Mode</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p><strong className="text-amber-600 dark:text-amber-400">ES Import</strong> — centrum analizy dokumentów elektrycznych (dostępny w Kreatorze projektu).</p>
          <p className="mt-3"><strong>📄 Tryb Tekstowy (PDF/Excel/KNR)</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Wgraj specyfikację materiałową (PDF), wykaz KNR lub listę z Excel (.xlsx)</li>
            <li>ES-Engine wyciąga pozycje, ilości i ceny automatycznie</li>
            <li><strong className="text-amber-600 dark:text-amber-400">Kody KNR:</strong> ES-Engine zamienia kody KNR 5-08/5-09 na czytelne pozycje kosztorysowe!</li>
          </ul>
          <p className="mt-3"><strong>👁️ Vision Mode (Rzuty budowlane i zdjęcia)</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Wgraj rzut instalacji elektrycznej (PDF lub zdjęcie)</li>
            <li>ES-Engine rozpoznaje symbole: gniazdka, lampy, wyłączniki, RCD, gniazda 3-fazowe</li>
            <li>Liczy ilości każdego elementu automatycznie</li>
          </ul>
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            ⚡ <em>ES-Engine z bazą ES-KNR 2026 + Twój prywatny katalog KNR!</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 6: Szybka Wycena */}
      <AccordionItem value="item-6" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Rocket className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">⚡ Szybka Wycena - Kosztorys w 60 sekund</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p><strong className="text-orange-600 dark:text-orange-400">Szybka Wycena</strong> to najszybszy sposób na przygotowanie kosztorysu.</p>
          <p className="mt-3"><strong>🏠 Jak to działa?</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li><strong>Krok 1:</strong> Wybierz typ obiektu (mieszkanie, dom jednorodzinny, biuro, magazyn)</li>
            <li><strong>Krok 2:</strong> Podaj metraż i liczbę pomieszczeń</li>
            <li><strong>Krok 3:</strong> Wybierz standard wykonania (ekonomiczny / standardowy / premium)</li>
            <li><strong>Krok 4:</strong> ES-Engine wygeneruje kompletny kosztorys z pozycjami i cenami</li>
          </ul>
          <p className="mt-3"><strong>💰 Co otrzymasz?</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Kompletną listę materiałów i robocizny z cenami</li>
            <li>Ceny dostosowane do Twojego województwa</li>
            <li>VAT 8% lub 23% w zależności od typu obiektu</li>
            <li>Gotowy projekt, który możesz dalej edytować w Kreatorze</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      {/* Item 7: Szablony */}
      <AccordionItem value="item-7" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Copy className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">📋 Szablony Projektów - Twórz szybciej</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p><strong className="text-teal-600 dark:text-teal-400">Szablony</strong> pozwalają tworzyć nowe projekty z gotowych wzorców.</p>
          <p className="mt-3"><strong>📋 Jak utworzyć szablon?</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Otwórz dowolny gotowy projekt</li>
            <li>Kliknij menu (⋮) na karcie projektu → <strong>&quot;Utwórz szablon&quot;</strong></li>
            <li>Szablon zachowa wszystkie pozycje, ilości i ceny</li>
          </ul>
          <p className="mt-3"><strong>🚀 Jak użyć szablonu?</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Przejdź do zakładki <strong>&quot;Szablony&quot;</strong> w menu głównym</li>
            <li>Kliknij na wybrany szablon — system utworzy nowy projekt z kopiami pozycji</li>
          </ul>
          <p className="mt-3 text-sm text-teal-600 dark:text-teal-400">
            💡 <em>Twórz raz — używaj wielokrotnie!</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 8: Konfigurator */}
      <AccordionItem value="item-8" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">🏗️ Konfigurator Rozdzielnic i Schemat Wieloliniowy</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p><strong className="text-violet-600 dark:text-violet-400">Konfigurator Rozdzielnic</strong> — profesjonalne narzędzie do projektowania tablic elektrycznych zgodnie z PN-EN 61439.</p>
          <p className="mt-3"><strong>🔌 {dinCount}+ modułów DIN w 15 kategoriach:</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li><strong>Wyłączniki MCB</strong> — B/C/D, 1P/2P/3P/4P, 6–125A (Legrand, ABB, Schneider)</li>
            <li><strong>RCD/RCBO</strong> — 30mA/300mA, typ AC/A/F/B, 2P/4P</li>
            <li><strong>SPD</strong> — ochronniki przepięć Typ 1/2/3</li>
            <li><strong>Złączki i zaciski</strong> — WAGO 221, szyny Cu, końcówki tulejkowe</li>
          </ul>
          <p className="mt-3"><strong>📊 Schemat Wieloliniowy (L1/L2/L3/N/PE):</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Automatyczny schemat 5-przewodowy z kolorowymi liniami fazowymi</li>
            <li>Eksport SVG/PDF + zapis w dokumentach projektu</li>
          </ul>
          <p className="mt-3 text-sm text-violet-600 dark:text-violet-400">
            🔌 <em>Eksportuj BOM bezpośrednio do kosztorysu!</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 9: Portal Klienta */}
      <AccordionItem value="item-9" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">🌐 Portal Klienta — Oferty i Negocjacje</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p><strong className="text-amber-600 dark:text-amber-400">Portal Klienta</strong> pozwala wysłać klientowi interaktywny link do przeglądania kosztorysu.</p>
          <p className="mt-3"><strong>🚀 Jak wysłać ofertę klientowi?</strong></p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li>Otwórz projekt → kliknij <strong>&quot;Wyślij ofertę&quot;</strong> w pasku narzędzi</li>
            <li>Klient może <strong>zaakceptować</strong>, <strong>odrzucić</strong> lub <strong>zaproponować zmiany</strong></li>
            <li>Po akceptacji klient składa <strong>e-podpis</strong> bezpośrednio w przeglądarce</li>
          </ul>
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            🔒 <em>Link jest jednorazowy i bezpieczny.</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 10: Kalkulatory */}
      <AccordionItem value="item-10" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">⚡ 12 Kalkulatorów Inżynierskich</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p><strong className="text-cyan-600 dark:text-cyan-400">12 profesjonalnych kalkulatorów elektrycznych</strong> zgodnych z normami.</p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li><strong>Prąd zwarcia</strong> - Oblicz Ik3 i Ik1 (PN-EN 60909)</li>
            <li><strong>Przekrój kabla</strong> - Dobór 1.5-300mm² z 2 kryteriami (Iz i ΔU)</li>
            <li><strong>Zabezpieczenia</strong> - Dobór wyłączników B/C/D, RCD</li>
            <li><strong>Silniki elektryczne</strong> - Prądy rozruchowe DOL/Y-Δ/VFD</li>
            <li><strong>Fotowoltaika</strong> - Instalacja PV: moduły, ROI 25 lat, CO₂</li>
            <li>Oświetlenie, Moc bierna, Uziemienie, Konwerter jednostek</li>
          </ul>
          <p className="mt-3 text-sm text-cyan-600 dark:text-cyan-400">
            🔧 <em>Wszystkie kalkulatory dostępne w zakładce &quot;Narzędzia&quot;!</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 11: PWA */}
      <AccordionItem value="item-11" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">📱 Instalacja Aplikacji (PWA)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p><strong className="text-blue-600 dark:text-blue-400">Zainstaluj ElektroSmart PRO jako aplikację</strong> i korzystaj z pełnych możliwości PWA.</p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li><strong>Tryb Offline</strong> - Pracuj bez internetu</li>
            <li><strong>Push Notifications</strong> - Otrzymuj powiadomienia o nowych funkcjach</li>
            <li><strong>Dostęp do aparatu</strong> - Rób zdjęcia bezpośrednio w projektach</li>
          </ul>
          <p className="mt-3 text-sm text-blue-600 dark:text-blue-400">
            📱 <em>Instalacja dostępna na Android, iOS i Desktop (Chrome/Edge).</em>
          </p>
        </AccordionContent>
      </AccordionItem>

      {/* Item 12: PDF */}
      <AccordionItem value="item-12" className="border-slate-200 dark:border-slate-800">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3 text-left">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-slate-100">📄 Profesjonalny PDF i Oferty</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="text-slate-700 dark:text-slate-300 leading-relaxed pt-4">
          <p>Uzupełnij dane w <strong className="text-blue-600 dark:text-blue-400">&quot;Profil Firmy&quot;</strong> (NIP, Logo), aby generować dokumenty budujące zaufanie Inwestora.</p>
          <p className="mt-3">System automatycznie rozdziela VAT:</p>
          <ul className="mt-2 ml-6 space-y-1 list-disc text-sm">
            <li><strong>Materiał:</strong> VAT 23% (standardowy)</li>
            <li><strong>Usługa:</strong> VAT 8% (opcja dla budownictwa mieszkaniowego)</li>
          </ul>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            💡 <em>Eksport do PDF dostępny w każdym projekcie.</em>
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
