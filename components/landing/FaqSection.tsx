import React from "react";

interface FaqProps {
  catalogCount?: number;
  dinCount?: number;
}

function FaqSectionInner(_props: FaqProps) {
  void _props;
  const FAQ_ITEMS = [
  {
    q: "Jak szybko zrobić profesjonalny kosztorys instalacji elektrycznej?",
    a: (
      <>
        <p className="font-medium text-slate-900 dark:text-white">Z ElektroSmart PRO — 3 kroki, mniej niż 10 minut:</p>
        <ol className="list-decimal list-inside mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
          <li><strong>Województwo + rodzaj obiektu</strong> — system ustawia stawki r-g i VAT (8%/23%) automatycznie</li>
          <li><strong>Dodaj pozycje</strong> — z katalogu, z zestawu albo z szybkiej wyceny po metrażu</li>
          <li><strong>Eksportuj PDF</strong> z logo i NIP. W DEMO jest znak wodny</li>
        </ol>
        <p className="mt-2 sm:mt-3 font-medium text-blue-600 dark:text-blue-400">
          Robocizna = godziny normy ES × Twoja stawka × województwo. Materiał zostaje bez tej korekty.
        </p>
      </>
    ),
  },
  {
    q: "Ile kosztuje punkt elektryczny w Polsce w 2026 roku?",
    a: (
      <>
        <p>Program nie podaje jednej ceny „punktu” z ulicy. Punkt gniazda to gniazdo, puszka, kabel i bruzda. Robocizna wychodzi z godzin normy ES i Twojej stawki. Mazowieckie dodaje 20% tylko do robocizny, Podkarpackie odejmuje 12%. Materiał zostaje w cenie z katalogu.</p>
      </>
    ),
  },
  {
    q: "Jaki VAT stosować dla instalacji elektrycznych?",
    a: (
      <div className="space-y-2 sm:space-y-3">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <div className="font-semibold text-sm sm:text-base text-blue-900 dark:text-blue-100 mb-1">✅ VAT 8% - Budownictwo mieszkaniowe</div>
          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">Domy jednorodzinne, mieszkania w budownictwie społecznym - zgodnie z ustawą VAT 2026</p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
          <div className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 mb-1">📊 VAT 23% - Działalność gospodarcza</div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Biura, sklepy, hotele, obiekty komercyjne</p>
        </div>
        <p className="mt-2 sm:mt-3 font-medium text-blue-600 dark:text-blue-400">
          💡 W ElektroSmart PRO wybierasz rodzaj obiektu przy tworzeniu projektu - VAT liczy się automatycznie.
        </p>
      </div>
    ),
  },
  {
    q: "Czy program sam policzy gniazdka z rzutu budowlanego?",
    a: (
      <>
        <p>Nie. Rysunku nie czyta. Gniazdka liczysz sam albo podajesz metraż i liczbę pomieszczeń w szybkiej wycenie. Lista i suma powstają z tych liczb, nie ze skanu ściany.</p>
      </>
    ),
  },
  {
    q: "Ile kosztuje program do kosztorysowania dla elektryków?",
    a: (
      <>
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/50 dark:to-slate-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-5">
          <div className="text-xl sm:text-2xl font-bold gradient-text mb-2">159 zł netto / miesiąc</div>
          <p className="text-slate-900 dark:text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">PRO: więcej niż jeden projekt i PDF bez znaku wodnego</p>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <li>✅ DEMO za darmo: ceny widać, własny projekt jest jeden, na PDF jest znak DEMO</li>
            <li>✅ PRO: czysty PDF, więcej projektów, wyższy limit zapytań</li>
            <li>✅ Katalog pozycji i własne ceny. Materiał i robocizna osobno</li>
            <li>✅ Zestawy punktów i 12 kalkulatorów. Dwa z nich wstawiają pozycję do kosztorysu</li>
            <li>✅ 16 województw — współczynnik tylko na robociznę</li>
          </ul>
        </div>
        <p className="mt-3 sm:mt-4 font-medium text-sm sm:text-base text-blue-600 dark:text-blue-400">
          Karty na starcie nie trzeba. DEMO wystarczy, żeby policzyć pierwszą wycenę.
        </p>
      </>
    ),
  },
  ];

  return (
    <section className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="text-center mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4">
          Najczęściej zadawane pytania
        </h2>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 px-4">
          Wszystko o wycenach i kosztorysach instalacji elektrycznych
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {FAQ_ITEMS.map(({ q, a }) => (
          <details
            key={q}
            className="group bg-white dark:bg-slate-800/50 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300"
          >
            <summary className="flex items-center justify-between cursor-pointer px-4 sm:px-6 py-4 sm:py-5 font-semibold text-sm sm:text-base text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="pr-4">{q}</span>
              <span className="text-blue-600 dark:text-blue-400 transition-transform group-open:rotate-180 flex-shrink-0">▼</span>
            </summary>
            <div className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              {a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export const FaqSection = React.memo(FaqSectionInner) as typeof FaqSectionInner;
