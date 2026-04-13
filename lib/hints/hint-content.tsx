import React from "react";

export const HINTS = {
  // ── Estimate Table Columns ─────────────────────────────────────────
  columnMaterial: (
    <div className="space-y-1.5">
      <p className="font-semibold text-amber-700 dark:text-amber-300">💰 Materiał</p>
      <p>Koszt materiałów netto za jednostkę i łącznie (ilość × cena).</p>
      <p className="text-slate-400">Cena bazowa bez narzutów. Regionalizacja i marże stosowane osobno.</p>
    </div>
  ),

  columnLabor: (
    <div className="space-y-1.5">
      <p className="font-semibold text-emerald-700 dark:text-emerald-300">👷 Robocizna (r-g)</p>
      <p>Koszt robocizny (montażu) netto za jednostkę i łącznie.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• Obliczana wg norm KNR × stawka PLN/rbh</li>
        <li>• Górna wartość = cena za 1 jedn.</li>
        <li>• Dolna wartość = suma (× ilość)</li>
      </ul>
    </div>
  ),

  columnKnr: (
    <div className="space-y-1.5">
      <p className="font-semibold text-violet-700 dark:text-violet-300">📋 Kod KNR</p>
      <p>Kod normy z Katalogów Nakładów Rzeczowych (KNR) — polskiego standardu kosztorysowego.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• <span className="text-emerald-600">KNR kat. A</span> — norma oficjalna z bazy</li>
        <li>• <span className="text-emerald-500">≈ KNR kat. B</span> — norma analogowa (ES)</li>
        <li>• Brak — pozycja bez normy (cena ręczna)</li>
      </ul>
    </div>
  ),

  columnTime: (
    <div className="space-y-1.5">
      <p className="font-semibold text-cyan-700 dark:text-cyan-300">⏱ Czas pracy (rbh)</p>
      <p>Norma czasu pracy w roboczogodzinach (rbh) na jednostkę miary.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• rbh/jedn. = norma KNR na 1 szt/mb/kpl</li>
        <li>• Σ rbh = czas całkowity (× ilość)</li>
        <li>• Wpływa na koszt: stawka PLN/rbh × norma</li>
      </ul>
    </div>
  ),

  columnSum: (
    <div className="space-y-1.5">
      <p className="font-semibold text-blue-700 dark:text-blue-300">💎 Suma pozycji</p>
      <p>Łączna wartość netto pozycji = Materiał + Robocizna (× ilość).</p>
      <p className="text-slate-400">Bez VAT. VAT naliczany w podsumowaniu projektu.</p>
    </div>
  ),

  columnActions: (
    <div className="space-y-1.5">
      <p className="font-semibold">⚙️ Akcje</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>✏️ Edytuj nazwę, ilość, ceny</li>
        <li>🔄 Przelicz cenę z AI/KNR</li>
        <li>🗑️ Usuń pozycję</li>
        <li>🛡 Resetuj normę do KNR</li>
      </ul>
    </div>
  ),

  // ── Right Panel ───────────────────────────────────────────────────
  negotiationSlider: (
    <div className="space-y-1.5">
      <p className="font-semibold text-blue-700 dark:text-blue-300">🤝 Negocjacje Ceny</p>
      <p>Globalny mnożnik ceny końcowej dla klienta (negocjacyjny).</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• 100% = cena bazowa bez zmiany</li>
        <li>• 90% = rabat 10% dla klienta</li>
        <li>• 110% = narzut 10% ponad bazę</li>
      </ul>
      <p className="text-slate-400">Nie zmienia cen w bazie — tylko wyświetlanie.</p>
    </div>
  ),

  pdfExport: (
    <div className="space-y-1.5">
      <p className="font-semibold text-red-700 dark:text-red-300">📄 Eksport PDF</p>
      <p>Generuje profesjonalny kosztorys PDF gotowy do wysłania klientowi.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• Pełne ceny (materiał + robocizna)</li>
        <li>• Logo i dane firmy z profilu</li>
        <li>• Uwagi i warunki płatności</li>
        <li>• Wymaga zapisania projektu (status: Final)</li>
      </ul>
    </div>
  ),

  excelExport: (
    <div className="space-y-1.5">
      <p className="font-semibold text-emerald-700 dark:text-emerald-300">📊 Eksport Excel</p>
      <p>Eksportuje kosztorys do pliku .xlsx z rozpisaniem na arkusze.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• Arkusz Kosztorys — pełna tabela</li>
        <li>• Arkusz Podsumowanie — sumy sekcji</li>
        <li>• Gotowy do edycji lub wysłania</li>
      </ul>
    </div>
  ),

  portalKlienta: (
    <div className="space-y-1.5">
      <p className="font-semibold text-blue-700 dark:text-blue-300">🌐 Portal Klienta</p>
      <p>Generuje unikalny link do oferty — klient widzi kosztorys online bez logowania.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• Widok tylko do odczytu</li>
        <li>• Możliwość akceptacji lub odrzucenia</li>
        <li>• Wymaga zapisanego projektu (Final)</li>
      </ul>
    </div>
  ),

  // ── Toolbar / AI ──────────────────────────────────────────────────
  aiPricing: (
    <div className="space-y-1.5">
      <p className="font-semibold text-indigo-700 dark:text-indigo-300">🤖 Wycena AI</p>
      <p>Automatycznie wycenia zaznaczone pozycje używając bazy KNR i cen rynkowych 2026.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• L0: bezpośredni KNR (najdokładniejszy)</li>
        <li>• L1: Twój katalog osobisty</li>
        <li>• L2: baza ES-Dictionary</li>
        <li>• L3: AI Gemini (dla nieznanych pozycji)</li>
      </ul>
    </div>
  ),

  addSection: (
    <div className="space-y-1.5">
      <p className="font-semibold">📂 Dodaj Sekcję</p>
      <p>Grupuje pozycje kosztorysu w logiczne sekcje (np. &quot;Salon&quot;, &quot;Łazienka&quot;).</p>
      <p className="text-slate-400">Sekcje pojawiają się jako nagłówki w PDF i Excelu.</p>
    </div>
  ),

  addKit: (
    <div className="space-y-1.5">
      <p className="font-semibold text-blue-700 dark:text-blue-300">📦 Zestawy (Kits)</p>
      <p>Gotowe zestawy pozycji — np. &quot;Gniazdko p/t&quot; automatycznie dodaje urządzenie, puszkę, przewód i bruzdę.</p>
      <p className="text-slate-400">Eliminuje ręczne wpisywanie powiązanych pozycji.</p>
    </div>
  ),

  materialInwestora: (
    <div className="space-y-1.5">
      <p className="font-semibold text-orange-700 dark:text-orange-300">🏗️ Materiał Inwestora</p>
      <p>Zaznacz jeśli klient dostarcza materiały sam — wtedy kosztorys zawiera tylko robociznę.</p>
      <p className="text-slate-400">Cena materiału = 0 zł, robocizna bez zmian.</p>
    </div>
  ),

  projectFinal: (
    <div className="space-y-1.5">
      <p className="font-semibold text-emerald-700 dark:text-emerald-300">✅ Zapisz / Zablokuj</p>
      <p>Zatwierdza projekt i blokuje edycję. Odblokowuje PDF, Excel i Portal Klienta.</p>
      <p className="text-slate-400">Możesz odblokować ponownie w dowolnym momencie.</p>
    </div>
  ),

  // ── Navigation ────────────────────────────────────────────────────
  navSzybkaWycena: (
    <div className="space-y-1.5">
      <p className="font-semibold text-yellow-700 dark:text-yellow-300">⚡ Szybka Wycena</p>
      <p>Kreator AI — opisz obiekt (m², typ, zakres) i otrzymaj wstępny kosztorys w 30 sekund.</p>
      <p className="text-slate-400">Idealny do szybkiej orientacji w cenie przed wizją.</p>
    </div>
  ),

  navKreator: (
    <div className="space-y-1.5">
      <p className="font-semibold text-violet-700 dark:text-violet-300">🎨 Kreator</p>
      <p>Krok po kroku tworzy projekt na podstawie rzutu lub opisu pomieszczeń.</p>
    </div>
  ),

  navKatalog: (
    <div className="space-y-1.5">
      <p className="font-semibold">📚 Katalog</p>
      <p>Twój osobisty cennik materiałów i robocizny. Pozycje z katalogu są używane priorytetowo przez AI (L1).</p>
      <p className="text-slate-400">Im lepszy katalog, tym dokładniejsza automatyczna wycena.</p>
    </div>
  ),

  navZestawy: (
    <div className="space-y-1.5">
      <p className="font-semibold text-blue-700 dark:text-blue-300">📦 Zestawy</p>
      <p>Predefiniowane grupy pozycji (np. punkt elektryczny = urządzenie + puszka + przewód + kucie).</p>
      <p className="text-slate-400">Dodajesz 1 pozycję — system wstawia 4-5 powiązanych.</p>
    </div>
  ),

  // ── VAT ───────────────────────────────────────────────────────────
  vatSelector: (
    <div className="space-y-1.5">
      <p className="font-semibold">🧾 Stawka VAT</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• <strong>8%</strong> — budownictwo mieszkaniowe (PKOB 11)</li>
        <li>• <strong>23%</strong> — komercja, B2B, biura, usługi</li>
      </ul>
      <p className="text-slate-400">Zmień w ustawieniach projektu → Typ obiektu.</p>
    </div>
  ),

  narzutyMarze: (
    <div className="space-y-1.5">
      <p className="font-semibold">📈 Narzuty i Marże</p>
      <p>Definiuje procentowe marże na materiały i robociznę doliczane do ceny bazowej.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• Marża mat. — narzut na zakup materiałów</li>
        <li>• Marża rob. — narzut na stawkę robocizny</li>
        <li>• Nie zmieniają cen w bazie danych</li>
      </ul>
    </div>
  ),
} as const;
