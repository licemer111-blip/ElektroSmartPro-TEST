export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  emoji: string;
  color: "orange" | "blue" | "amber" | "green" | "violet" | "indigo" | "rose" | "teal";
  ctaLabel?: string;
  ctaHref?: string;
}

export const TOUR_STEPS: TourStep[] = [
  // ── KROK 1: Powitanie ─────────────────────────────────────────────
  {
    id: "welcome",
    title: "Witaj w ElektroSmart PRO!",
    description:
      "System kosztorysowy oparty na normach KNR 2026 — dla elektryków, którzy cenią czas. " +
      "W 2 minutach pokażemy Ci 8 najważniejszych funkcji: od tworzenia projektu, przez zestawy i wyceny AI, po eksport PDF dla klienta.",
    position: "center",
    emoji: "⚡",
    color: "indigo",
  },

  // ── KROK 2: Tworzenie projektu ────────────────────────────────────
  {
    id: "new-project",
    title: "Krok 1 — Utwórz projekt",
    description:
      "Kliknij \"+ Nowy projekt\", podaj nazwę (np. \"Mieszkanie Kowalski\"), wybierz województwo i typ obiektu. " +
      "System automatycznie ustawi stawkę VAT (8% mieszkania / 23% biuro) i regionalny współczynnik robocizny. " +
      "Każdy projekt to osobny kosztorys z pełną historią zmian.",
    targetSelector: '[data-tour="new-project"]',
    position: "bottom",
    emoji: "📁",
    color: "blue",
  },

  // ── KROK 3: Dodawanie pozycji ─────────────────────────────────────
  {
    id: "add-items",
    title: "Krok 2 — Dodaj pozycje kosztorysowe",
    description:
      "W projekcie masz 3 sposoby dodawania pozycji:\n" +
      "① \"+ Szybka pozycja\" — wpisujesz nazwę i cenę ręcznie\n" +
      "② \"Katalog KNR\" — baza 5000+ norm z gotowymi cenami\n" +
      "③ Przycisk AI Import — wklej zdjęcie lub tekst, AI tworzy listę automatycznie",
    position: "center",
    emoji: "➕",
    color: "teal",
  },

  // ── KROK 4: Zestawy (Smart Assembly) ─────────────────────────────
  {
    id: "zestawy",
    title: "Krok 3 — Zestawy 360° (kluczowa funkcja!)",
    description:
      "Wpisz \"Punkt gniazdkowy\" lub \"Punkt oświetleniowy\" — ElektroSmart AUTOMATYCZNIE rozbija to na składniki: " +
      "bruzda + kabel YDYp (4mb) + puszka p/t + gniazdo + robocizna montażu. " +
      "Zmienisz ilość punktów — wszystkie składniki przeliczą się automatycznie. " +
      "Możesz edytować każdy składnik w panelu Zestawu (ikona ołówka przy pozycji).",
    position: "center",
    emoji: "�",
    color: "orange",
  },

  // ── KROK 5: Katalog i import ──────────────────────────────────────
  {
    id: "catalog",
    title: "Krok 4 — Katalog KNR i import AI",
    description:
      "Katalog → 5000+ norm KNR 5-08 z opisem, jednostką i czasem r-g. Znajdź po nazwie lub kodzie KNR. " +
      "AI Import (zakładka \"Do wyceny\"): wklej specyfikację z Worda, foto z telefonu lub e-mail od klienta — " +
      "system rozpozna pozycje i doda je do projektu. Oszczędza 30-60 minut na kosztorys.",
    targetSelector: 'a[href="/dashboard/catalog"]',
    position: "bottom",
    emoji: "📦",
    color: "amber",
  },

  // ── KROK 6: ES-Engine Wycena ──────────────────────────────────────
  {
    id: "es-engine",
    title: "Krok 5 — ES-Engine: automatyczna wycena KNR",
    description:
      "Masz listę pozycji bez cen? Wejdź do projektu → kliknij pomarańczowy przycisk \"Tryb: Expert Engine\". " +
      "System przeliczy każdą pozycję wg norm KNR 2026 × Twoja stawka r-g × współczynnik regionu. " +
      "Robocizna i Materiał są oddzielone — możesz włączyć \"Tylko Robocizna\" jeśli klient dostarcza materiały.",
    position: "center",
    emoji: "🤖",
    color: "green",
  },

  // ── KROK 7: Podsumowanie i negocjacje ────────────────────────────
  {
    id: "summary",
    title: "Krok 6 — Podsumowanie z ceną końcową",
    description:
      "Prawy panel projektu to centrum sterowania: " +
      "Suma Netto (Robocizna + Materiały) → Narzuty (Kp/Z/Kz) → VAT → KWOTA KOŃCOWA. " +
      "Suwak \"Negocjacje ceny\" pozwala szybko dać rabat lub narzut procentowy. " +
      "Aktywuj plan PRO, aby zobaczyć kwotę końcową (w wersji FREE jest zamazana).",
    position: "center",
    emoji: "💰",
    color: "violet",
  },

  // ── KROK 8: Eksport PDF ───────────────────────────────────────────
  {
    id: "pdf-export",
    title: "Krok 7 — Eksport PDF dla klienta",
    description:
      "Zakładka \"Ustawienia PDF\" w projekcie → wybierz temat kolorystyczny, dodaj swoje logo i dane firmy. " +
      "Kliknij \"Pobierz PDF\" — otrzymasz profesjonalny dokument z kosztorysem. " +
      "Wersja FREE: PDF z \"DEMO\" watermarkiem. " +
      "PRO: czysty PDF + Portal Klienta (klient klika link i akceptuje ofertę online).",
    position: "center",
    emoji: "📄",
    color: "indigo",
  },

  // ── KROK 9: Stawka i ustawienia ───────────────────────────────────
  {
    id: "settings",
    title: "Krok 8 — Twoja stawka i ustawienia",
    description:
      "W Ustawieniach → Kalkulator KNR ustaw stawkę roboczogodziny (PLN/r-g) i wybierz województwo. " +
      "To wpływa na WSZYSTKIE kosztorysy. " +
      "Możesz też aktywować 1-dniowy trial PRO za darmo — odblokuje AI bez limitu, czysty PDF i Portal Klienta.",
    targetSelector: 'a[href="/dashboard/settings"]',
    position: "bottom",
    emoji: "⚙️",
    color: "violet",
    ctaLabel: "Ustaw stawkę r-g →",
    ctaHref: "/dashboard/settings/knr-calculator",
  },
];
