import React from "react";

interface FaqProps {
  catalogCount?: number;
  dinCount?: number;
}

function FaqSectionInner({ catalogCount = 1400, dinCount = 295 }: FaqProps) {
  const FAQ_ITEMS = [
  {
    q: "Jak szybko zrobić profesjonalny kosztorys instalacji elektrycznej?",
    a: (
      <>
        <p className="font-medium text-slate-900 dark:text-white">Z ElektroSmart PRO — 3 kroki, mniej niż 10 minut:</p>
        <ol className="list-decimal list-inside mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
          <li><strong>Województwo + rodzaj obiektu</strong> — system ustawia stawki r-g i VAT (8%/23%) automatycznie</li>
          <li><strong>Dodaj pozycje</strong> — z katalogu {catalogCount}+ pozycji KNR, importuj Excel/CSV lub opisz zakres językiem naturalnym</li>
          <li><strong>Eksportuj PDF</strong> z Twoim logo i NIP — profesjonalna oferta gotowa w 10 sekund</li>
        </ol>
        <p className="mt-2 sm:mt-3 font-medium text-blue-600 dark:text-blue-400">
          💡 Bonus: ES-Engine analizuje rzuty budowlane i liczy symbole elektryczne wg IEC 60617 — bez ręcznego zliczania.
        </p>
      </>
    ),
  },
  {
    q: "Ile kosztuje punkt elektryczny w Polsce w 2026 roku?",
    a: (
      <>
        <p>Cena punktu elektrycznego w 2026 roku zależy od województwa i rodzaju instalacji:</p>
        <ul className="list-disc list-inside mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
          <li><strong>Warszawa/Mazowieckie:</strong> 180-220 zł/punkt (z materiałem)</li>
          <li><strong>Kraków/Małopolskie:</strong> 170-210 zł/punkt</li>
          <li><strong>Wrocław/Dolnośląskie:</strong> 165-200 zł/punkt</li>
        </ul>
        <p className="mt-2 sm:mt-3 font-medium text-blue-600 dark:text-blue-400">
          💡 ElektroSmart PRO automatycznie przelicza ceny wg Twojego województwa i typu obiektu. Nie musisz pamiętać tabel stawek.
        </p>
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
    q: "Czy mogę użyć ES-Engine do liczenia gniazdek z rzutu budowlanego?",
    a: (
      <>
        <p>Tak! ES-Engine oferuje Vision Mode — analizę rzutów budowlanych:</p>
        <ul className="list-disc list-inside mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
          <li><strong>Wgraj PDF</strong> z rzutem budowlanym (do 10MB)</li>
          <li><strong>Rozpoznawanie symboli</strong> wg IEC 60617 — gniazdka, wyłączniki, oprawy</li>
          <li><strong>Metoda Grid Search</strong> — podział strony na sektory i zliczanie</li>
          <li><strong>Weryfikacja i akceptacja</strong> — sprawdzasz wyniki przed dodaniem</li>
        </ul>
        <p className="mt-2 sm:mt-3 font-medium text-blue-600 dark:text-blue-400">
          ⚡ Silnik inżynieryjny przyspiesza pracę, ale to Ty podejmujesz ostateczną decyzję!
        </p>
      </>
    ),
  },
  {
    q: "Ile kosztuje program do kosztorysowania dla elektryków?",
    a: (
      <>
        <div className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950/50 dark:to-slate-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-5">
          <div className="text-xl sm:text-2xl font-bold gradient-text mb-2">159 zł netto / miesiąc</div>
          <p className="text-slate-900 dark:text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">ElektroSmart PRO — Pełen dostęp bez ograniczeń</p>
          <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
            <li>✅ Nielimitowane projekty, kosztorysy i eksporty PDF</li>
            <li>✅ Baza KNR {catalogCount}+ pozycji + własny katalog</li>
            <li>✅ ES-Engine + Vision Mode (analiza rzutów) + 12 kalkulatorów</li>
            <li>✅ Konfigurator rozdzielnic {dinCount}+ modułów DIN w 15 kategoriach</li>
            <li>✅ Portal Klienta z negocjacjami online</li>
            <li>✅ Eksport PDF/Excel + integracja InFakt</li>
            <li>✅ Ceny regionalne 16 województw + aktualizacje co 2–6 miesięcy</li>
          </ul>
        </div>
        <p className="mt-3 sm:mt-4 font-medium text-sm sm:text-base text-blue-600 dark:text-blue-400">
          💡 Wersja DEMO bezpłatna — przetestuj wszystkie funkcje bez podawania karty płatniczej.
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
