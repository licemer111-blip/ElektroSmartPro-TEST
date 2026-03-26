export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  tag: "new" | "improvement" | "fix";
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.1.1",
    date: "2026-03-23",
    title: "Material Expert Panel",
    tag: "new",
    highlights: [
      "Sugestie materiałów z katalogu 2026 — dodaj jednym kliknięciem",
      "Bezpieczniki i puszki zawsze w całych sztukach",
      "Wskaźnik ilości buhty dla kabli",
      "Pełna formuła ceny widoczna dla każdej pozycji",
      "Przełącznik Klient + Materiały / Tylko Robocizna",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-23",
    title: "Expert Engine v9.0 — Mózg Materiałowy",
    tag: "new",
    highlights: [
      "Security Audit Layer — minimalne progi cenowe dla każdej kategorii prac",
      "Material Brain — automatyczne sugestie materiałów na podstawie pozycji robocizny",
      "Marża materiałów — nowe pole w Ustawieniach → Centrum Kalkulacji",
      "Wskaźniki pewności L1/L2A/L2B/L3 przy każdej wycenie",
      "Zestawy z cenami KNR × stawka RBH",
    ],
  },
  {
    version: "1.0.0",
    date: "2026-02-24",
    title: "Wersja 1.0 — Single Source of Truth, VAT Guard, Pełne KNR",
    tag: "new",
    highlights: [
      "Pełny kontekst AI: dostęp do 100% bazy wiedzy (23/23 kategorie) opartej na 15 oficjalnych plikach KNR w systemie RAG",
      "Dynamiczne dyrektywy: aktualna stawka bazowa i mnożnik inflacyjny wstrzykiwane do każdego zapytania AI — koniec przestarzałych wycen",
      "Bridge dla plików KNR użytkownika: normy czasu z własnych plików automatycznie przeliczane na aktualne stawki z panelu admina",
      "VAT Guard: bezwzględna blokada stawki 8% dla projektów B2B/biuro/hotel/przemysł — system wymusza 23% VAT",
      "Precyzja regionalna: współczynniki geograficzne zsynchronizowane we wszystkich 60+ stronach aplikacji",
      "Architektura Single Source of Truth: usunięto wszystkie hardcody — każda liczba pochodzi z admin_settings",
      "Pełna widoczność katalogu: limit zapytań zwiększony do 5000 pozycji (pełna baza 1557 produktów i usług)",
      "Polonizacja: naprawiono 14 fraz w języku angielskim + pełne meta-tagi SEO dla każdej podstrony",
    ],
  },
  {
    version: "4.0.0",
    date: "2026-02-19",
    title: "Moja Baza KNR, Negocjacje z klientem, Portfolio w Profilu Firmy",
    tag: "new",
    highlights: [
      "Moja Baza KNR — wgraj własne normy KNR, cenniki i stawki r-g (PDF/Excel/TXT). AI korzysta z nich w pierwszej kolejności!",
      "6-poziomowa baza ES-KNR 2026: Twoja Baza KNR → normy KNR 5-08/5-09 → katalog rynkowy → ES-Engine",
      "Negocjacje dwukierunkowe w Portalu Klienta — klient proponuje zmiany, Ty akceptujesz lub kontr-oferta",
      "Portfolio przeniesione do Profilu Firmy — dwie zakładki: Informacje o firmie + Portfolio",
      "Schemat wieloliniowy L1/L2/L3/N/PE w Konfiguratorze Rozdzielnic",
      "Konfigurator Rozdzielnic: 295+ modułów DIN, złączki WAGO, szyny Cu, materiały montażowe",
    ],
  },
  {
    version: "3.7.0",
    date: "2026-02-13",
    title: "Konfigurator rozdzielnic, Portal klienta 2.0, Powiadomienia",
    tag: "new",
    highlights: [
      "Konfigurator rozdzielnic — 295+ modułów DIN w 15 kategoriach + tryb Własne (niestandardowe moduły)",
      "Portal klienta 2.0 — premium galeria portfolio z lightbox + sekcja dokumentów do pobrania",
      "Powiadomienia w czasie rzeczywistym — dzwonek informuje o akceptacji/odrzuceniu oferty przez klienta",
      "Sekcje kosztorysu — grupowanie pozycji wg pomieszczeń (Kuchnia, Łazienka, Salon...) z subtotalami",
      "Polski date picker — kustomy kalendarz zamiast natywnego (polskie miesiące, ręczny wpis DD.MM.RRRR)",
      "Import/Export konfiguracji rozdzielnicy (JSON) + zapis SVG/PDF",
    ],
  },
  {
    version: "3.6.0",
    date: "2026-02-09",
    title: "Szablony emaila i ulepszenia UX",
    tag: "new",
    highlights: [
      "5 wizualnych szablonów emaila (Klasyczny, Nowoczesny, Elegancki, Korporacyjny, Premium)",
      "5 szablonów treści wiadomości (Oferta profesjonalna, Szybka wycena, Przypomnienie, Start, Zakończenie)",
      "Cofnij usunięcie pozycji — 5 sekund na przywrócenie",
      "Automatyczny snapshot kosztorysu przy finalizacji projektu",
      "Nowe loading skeletony dla wszystkich kluczowych stron",
      "Error boundaries — graceful error handling w całym dashboardzie",
    ],
  },
  {
    version: "3.5.5",
    date: "2026-02-08",
    title: "Zestawy i edycja pozycji",
    tag: "improvement",
    highlights: [
      "Edycja pozycji w zestawach — pełna kontrola nad cenami dzieci",
      "Dodawanie pozycji do zestawu inline (bez opuszczania tabeli)",
      "Zestaw-parent: tylko ilość edytowalna, ceny auto-kalkulowane",
      "5 nowych szablonów PDF z unikalnymi paletami kolorów",
      "Ulepszony dialog wyboru szablonu PDF (A4-preview)",
    ],
  },
  {
    version: "3.5.0",
    date: "2026-01-25",
    title: "ES Lab i współpraca",
    tag: "new",
    highlights: [
      "ES Vision Mode — analiza zdjęć instalacji",
      "Współpraca w czasie rzeczywistym (LiveKit)",
      "Kursory współpracowników na żywo",
      "System komentarzy do pozycji kosztorysu",
      "Push notifications (Web Push API)",
    ],
  },
  {
    version: "3.4.0",
    date: "2026-01-10",
    title: "Kalkulatory i CRM",
    tag: "new",
    highlights: [
      "11 kalkulatorów inżynierskich (kabel, oświetlenie, PV, silnik...)",
      "CRM — baza klientów z historią projektów",
      "Wysyłanie ofert emailem z PDF i Excel",
      "Śledzenie wysłanych ofert",
      "System tagów projektów",
    ],
  },
  {
    version: "3.3.0",
    date: "2025-12-20",
    title: "Zestawy i szablony",
    tag: "improvement",
    highlights: [
      "Zestawy użytkownika (własne assemblies)",
      "Szablony projektów — zapisz i użyj ponownie",
      "Drag & drop pozycji w kosztorysie",
      "Bulk actions — zaznacz i edytuj wiele pozycji",
      "Eksport kosztorysu do Excel (.xlsx)",
    ],
  },
];
