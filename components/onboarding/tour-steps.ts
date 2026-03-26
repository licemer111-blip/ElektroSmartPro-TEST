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
      "Profesjonalny system wycen dla elektryków. Pokażemy Ci 5 kluczowych funkcji — zajmie to mniej niż minutę.",
    position: "center",
    emoji: "⚡",
    color: "indigo",
  },
  {
    id: "new-project",
    title: "Twórz projekty kosztorysowe",
    description:
      'Kliknij + Nowy projekt → podaj nazwę, wybierz województwo i typ obiektu. System sam dobierze stawki VAT i regionalne ceny robocizny.',
    targetSelector: '[data-tour="new-project"]',
    position: "bottom",
    emoji: "📁",
    color: "orange",
  },
  {
    id: "catalog",
    title: "Katalog 5000+ norm KNR",
    description:
      'Dodaj pozycje z bazy norm KNR. Gotowe Zestawy (np. "Punkt gniazdkowy") = puszka + kabel + bruzda + robocizna — jednym kliknięciem.',
    targetSelector: 'a[href="/dashboard/catalog"]',
    position: "bottom",
    emoji: "📦",
    color: "blue",
  },
  {
    id: "es-wycena",
    title: "ES-Engine uzupełni ceny",
    description:
      "Brakuje cen? W otwartym projekcie kliknij pomarańczowy przycisk ES Wycena. ES-Engine wyceni normy KNR 2026 dostosowane do Twojego regionu automatycznie.",
    position: "center",
    emoji: "🤖",
    color: "amber",
  },
  {
    id: "export",
    title: "PDF z logo + Portal Klienta",
    description:
      "Pobierz profesjonalny kosztorys PDF z Twoim logo i NIP. Wyślij klientowi link — może przejrzeć ofertę, zaakceptować i podpisać online.",
    position: "center",
    emoji: "📄",
    color: "green",
  },
  {
    id: "knr-setup",
    title: "Ustaw tryb wyceny i stawkę R-G",
    description:
      "W Ustawienia → KNR wybierz tryb: 🟠 ES-Engine (normy KNR), 🔵 Hybrydowy (Twój katalog + KNR) lub 🟣 Własna Baza (tylko Twoje ceny). Ustaw stawkę R-G (PLN/rbh) — ES-Engine będzie używać jej do wycen.",
    targetSelector: 'a[href="/dashboard/settings"]',
    position: "bottom",
    emoji: "⚙️",
    color: "violet",
    ctaLabel: "Ustaw stawkę w KNR",
    ctaHref: "/dashboard/settings/knr-calculator",
  },
];
