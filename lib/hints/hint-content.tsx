import React from "react";

export const HINTS = {
  // ── Estimate Table Columns ─────────────────────────────────────────
  columnMaterial: (
    <div className="space-y-1.5">
      <p className="font-semibold text-amber-700 dark:text-amber-300">💰 Materiał</p>
      <p>Cena materiału netto za jednostkę i łącznie (ilość × cena).</p>
      <p className="text-slate-400">Pusta, dopóki nie wpiszesz jej sam albo nie weźmiesz z zakładki Moje. Województwo materiału nie rusza.</p>
    </div>
  ),

  columnLabor: (
    <div className="space-y-1.5">
      <p className="font-semibold text-emerald-700 dark:text-emerald-300">👷 Robocizna (r-g)</p>
      <p>Koszt robocizny (montażu) netto za jednostkę i łącznie.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• Godzina normy ES × Twoja stawka</li>
        <li>• Górna wartość = cena za 1 jedn.</li>
        <li>• Dolna wartość = suma (× ilość)</li>
      </ul>
    </div>
  ),

  columnKnr: (
    <div className="space-y-1.5">
      <p className="font-semibold text-violet-700 dark:text-violet-300">📋 Kod KNR</p>
      <p>Numer normy ES. To godzina pracy, nie urzędowy tom KNR.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• Zielony — godzina z normy ES</li>
        <li>• Przybliżenie — podobna pozycja, sprawdź przed ofertą</li>
        <li>• Brak — wpisz cenę ręcznie</li>
      </ul>
    </div>
  ),

  columnTime: (
    <div className="space-y-1.5">
      <p className="font-semibold text-cyan-700 dark:text-cyan-300">⏱ Czas pracy (rbh)</p>
      <p>Norma czasu pracy w roboczogodzinach (rbh) na jednostkę miary.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• rbh/jedn. = godzina normy ES na 1 szt/mb/kpl</li>
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
        <li>Edytuj nazwę, ilość i ceny</li>
        <li>Usuń pozycję</li>
        <li>Wyceń liczy robociznę z godziny i stawki</li>
      </ul>
    </div>
  ),

  // ── Right Panel ───────────────────────────────────────────────────
  negotiationSlider: (
    <div className="space-y-1.5">
      <p className="font-semibold text-blue-700 dark:text-blue-300">🤝 Negocjacje Ceny</p>
      <p>Jeden rabat albo narzut na cały kosztorys. Suwak od −20% do +20%.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• 0% — bez zmiany</li>
        <li>• −10% — rabat dla klienta</li>
        <li>• +10% — narzut</li>
      </ul>
      <p className="text-slate-400">Nie przepisuje zapisanych cen. Widać go na ekranie i w PDF.</p>
    </div>
  ),

  pdfExport: (
    <div className="space-y-1.5">
      <p className="font-semibold text-red-700 dark:text-red-300">📄 Eksport PDF</p>
      <p>Kosztorys PDF. Działa też przed zatwierdzeniem oferty.</p>
      <ul className="space-y-0.5 text-slate-400">
        <li>• Robocizna i materiał osobno</li>
        <li>• Logo i dane firmy z profilu</li>
        <li>• Na darmowym koncie znak DEMO</li>
        <li>• Czysty PDF jest w PRO</li>
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
      <p className="font-semibold text-indigo-700 dark:text-indigo-300">Wczytaj, potem Wyceń</p>
      <p>Wczytaj bierze listę z SMS, Excela albo PDF. Pozycje wchodzą bez cen, jeśli plik ich nie ma.</p>
      <p>Wyceń liczy robociznę: godzina normy ES × Twoja stawka. Asystent dopisuje brakujące nazwy.</p>
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
      <p>Przycisk Dodaj Zestaw wstawia składniki jako osobne wiersze. Samo słowo „zestaw” w nazwie ceny nie zmienia.</p>
      <p className="text-slate-400">Robocizna ze stawki. Materiał pusty, dopóki go nie wpiszesz.</p>
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
      <p className="font-semibold text-emerald-700 dark:text-emerald-300">✅ Zatwierdź ofertę</p>
      <p>Blokuje edycję, żeby wysłana oferta się nie zmieniła. PDF i Excel działają też przed zatwierdzeniem.</p>
      <p className="text-slate-400">Odblokujesz projekt w dowolnym momencie.</p>
    </div>
  ),

  // ── Navigation ────────────────────────────────────────────────────
  navSzybkaWycena: (
    <div className="space-y-1.5">
      <p className="font-semibold text-yellow-700 dark:text-yellow-300">⚡ Szybka Wycena</p>
      <p>Z metrażu układa listę prac. Robociznę liczy godzina × stawka. Materiału nie wymyśla.</p>
      <p className="text-slate-400">Do pierwszej rozmowy z klientem, zanim wpiszesz swoje ceny.</p>
    </div>
  ),

  navKreator: (
    <div className="space-y-1.5">
      <p className="font-semibold text-violet-700 dark:text-violet-300">🎨 Kreator</p>
      <p>Nowy projekt: nazwa, typ obiektu i VAT. Potem katalog albo Wczytaj, na końcu Wyceń.</p>
    </div>
  ),

  navKatalog: (
    <div className="space-y-1.5">
      <p className="font-semibold">📚 Katalog</p>
      <p>Moje to Twój cennik. Baza to wspólne nazwy i godziny, bez ceny materiału. Razem pokazuje oba.</p>
      <p className="text-slate-400">Cenę materiału z Moje program bierze do kosztorysu. Z Bazy — nie.</p>
    </div>
  ),

  navZestawy: (
    <div className="space-y-1.5">
      <p className="font-semibold text-blue-700 dark:text-blue-300">📦 Zestawy</p>
      <p>Gotowa lista prac, którą dodajesz jednym kliknięciem. Każda praca to osobny wiersz.</p>
      <p className="text-slate-400">Godziny ze stawki. Ceny materiału dopisujesz sam.</p>
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
      <p className="text-slate-400">Jedna stawka na cały kosztorys. Przełącznik 8% / 23% jest na pasku.</p>
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
