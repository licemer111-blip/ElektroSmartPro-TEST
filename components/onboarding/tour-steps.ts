export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position: "top" | "bottom" | "left" | "right" | "center";
  emoji: string;
  color: "orange" | "blue" | "amber" | "green" | "violet" | "indigo";
  ctaLabel?: string;
  ctaHref?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Witaj w ElektroSmart PRO!",
    description:
      "Profesjonalny system kosztorysowy dla elektryków oparty na normach KNR. Przygotowaliśmy dla Ciebie projekt demonstracyjny — pokażemy 6 kluczowych funkcji w mniej niż minutę.",
    position: "center",
    emoji: "⚡",
    color: "indigo",
  },
  {
    id: "demo-project",
    title: "Projekt demonstracyjny",
    description:
      "Na dashboardzie znajdziesz gotowy kosztorys mieszkania 65m² z 24 pozycjami. Ceny są widoczne — możesz sprawdzić jak wygląda kompletny kosztorys i wyeksportować go do PDF za darmo.",
    position: "center",
    emoji: "🏠",
    color: "orange",
  },
  {
    id: "new-project",
    title: "Twórz własne projekty",
    description:
      "Kliknij + Nowy projekt → podaj nazwę, wybierz województwo i typ obiektu. System dobierze stawki VAT i regionalne ceny robocizny automatycznie.",
    targetSelector: '[data-tour="new-project"]',
    position: "bottom",
    emoji: "📁",
    color: "blue",
  },
  {
    id: "catalog",
    title: "Katalog 5000+ norm KNR",
    description:
      "Dodaj pozycje z bazy norm KNR. Gotowe Zestawy (np. \"Punkt gniazdkowy\") = puszka + kabel + bruzda + robocizna — jednym kliknięciem.",
    targetSelector: 'a[href="/dashboard/catalog"]',
    position: "bottom",
    emoji: "📦",
    color: "amber",
  },
  {
    id: "es-wycena",
    title: "ES-Engine uzupełni ceny",
    description:
      "Brakuje cen? W otwartym projekcie kliknij pomarańczowy przycisk ES Wycena. System wyceni pozycje wg norm KNR 2026 z uwzględnieniem stawki regionalnej.",
    position: "center",
    emoji: "🤖",
    color: "green",
  },
  {
    id: "export",
    title: "PDF z logo + Portal Klienta",
    description:
      "Eksportuj profesjonalny kosztorys PDF z Twoim logo i danymi firmy. Wyślij klientowi link — może przejrzeć ofertę, zaakceptować i zaproponować zmiany online.",
    position: "center",
    emoji: "📄",
    color: "indigo",
  },
  {
    id: "knr-setup",
    title: "Ustaw stawkę R-G i tryb wyceny",
    description:
      "W Ustawienia → KNR ustaw stawkę roboczogodziny (PLN/rbh) i tryb: ES-Engine (normy KNR), Hybrydowy (Twój katalog + KNR) lub Własna Baza. To klucz do precyzyjnych wycen.",
    targetSelector: 'a[href="/dashboard/settings"]',
    position: "bottom",
    emoji: "⚙️",
    color: "violet",
    ctaLabel: "Ustaw stawkę w KNR",
    ctaHref: "/dashboard/settings/knr-calculator",
  },
];
