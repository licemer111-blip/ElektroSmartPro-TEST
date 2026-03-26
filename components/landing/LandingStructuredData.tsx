import Script from "next/script";

interface LandingStructuredDataProps {
  catalogCount: number;
  dinCount?: number;
}

export function LandingStructuredData({ catalogCount, dinCount = 295 }: LandingStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ElektroSmart PRO",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "159.00",
      priceCurrency: "PLN",
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      url: `${baseUrl}/dashboard/subscription`,
    },
    description:
      `Profesjonalny program dla elektryków: automatyczny kosztorys elektryczny z ES-Engine, wycena z podziałem materiał/robocizna, normy KNR 5-04/5-08/5-09, Zestawy 360°, konfigurator rozdzielnic ${dinCount}+ modułów DIN wg PN-EN 61439. Ceny regionalne 16 województw, VAT 8%/23%, eksport PDF/Excel. Zgodność z PN-HD 60364.`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "127",
      bestRating: "5",
    },
    featureList: [
      "Wyceny i kosztorysy instalacji elektrycznych",
      `Baza ${catalogCount}+ pozycji katalogowych`,
      `Konfigurator rozdzielnic — ${dinCount}+ modułów DIN w 15 kategoriach (zabezpieczenia, RCD, SPD, złączki, materiały)`,
      "Sekcje kosztorysu — grupowanie wg pomieszczeń z subtotalami",
      "Portal klienta 2.0 — galeria portfolio, dokumenty do pobrania, e-podpis",
      "Powiadomienia w czasie rzeczywistym (akceptacja oferty)",
      "CRM - baza klientów z historią projektów i logiem interakcji",
      "Protokoły pomiarowe zgodne z PN-HD 60364-6",
      "ElektroSmart Core — generowanie BOM z opisu tekstowego",
      "ES-Engine — analiza PDF/Excel i Vision Mode dla rzutów budowlanych wg IEC 60617",
      "Detektor duplikatów — inteligentna normalizacja pozycji",
      "Generator zestawów — kompletacja materiałowa z opisu obiektu",
      "12 Kalkulatorów Inżynierskich (prąd zwarcia Ik3/Ik1, przekroje kabli, spadek napięcia, PV, oświetlenie, silnik, cosφ)",
      "5 szablonów wizualnych PDF + 5 szablonów emaila",
      "Inteligentne zestawy materiałów",
      "Ceny regionalne dla 16 województw",
      "VAT 8% i 23% automatycznie",
      "Współpraca zespołowa - role, zaproszenia, wspólne edytowanie",
      "Live Chat — komunikacja tekstowa w czasie rzeczywistym",
      "Keyboard Shortcuts (Ctrl+K Command Palette)",
      "Eksport profesjonalnych ofert PDF z logo",
      "Eksport do Excel z sekcjami i podziałem materiał/robocizna",
      "Dark/Light mode w portalu klienta",
    ],
    inLanguage: "pl-PL",
    author: { "@type": "Organization", name: "ElektroSmart PRO", url: baseUrl },
    provider: { "@type": "Organization", name: "ElektroSmart PRO", url: baseUrl },
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ElektroSmart PRO",
    url: baseUrl,
    logo: `${baseUrl}/icon.png`,
    description:
      "Profesjonalny program dla elektryków w Polsce: kosztorys elektryczny online, wycena instalacji z podziałem materiał/robocizna, konfigurator rozdzielnic, ceny regionalne 16 województw. Zgodność z PN-HD 60364.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "elektrosmartpro@gmail.com",
      contactType: "Customer Service",
      areaServed: "PL",
      availableLanguage: "Polish",
    },
    sameAs: [],
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Jak zrobić wycenę i kosztorys instalacji elektrycznej online?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Z ElektroSmart PRO stworzysz profesjonalną wycenę i kosztorys w 3 krokach: 1) Wybierz województwo i rodzaj obiektu (VAT 8% lub 23%), 2) Dodaj materiały z katalogu ${catalogCount}+ pozycji ręcznie, zaimportuj KNR Excel/CSV lub użyj silnika inżynieryjnego, 3) Pobierz PDF z logo firmy. Obsługa KNR 5-08/5-09, wyceny punktowe i kosztorysy ślepe.`,
        },
      },
      {
        "@type": "Question",
        name: "Ile kosztuje punkt elektryczny w 2026 roku?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Cena punktu elektrycznego w 2026 roku zależy od województwa: Warszawa/Mazowieckie 180-220 zł/punkt, Kraków/Małopolskie 170-210 zł/punkt, Wrocław/Dolnośląskie 165-200 zł/punkt (z materiałem). ElektroSmart PRO automatycznie dostosowuje ceny do Twojego województwa i typu obiektu.",
        },
      },
      {
        "@type": "Question",
        name: "Jaki VAT stosować dla instalacji elektrycznych?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "VAT 8% stosuje się dla budownictwa mieszkaniowego (domy jednorodzinne, mieszkania w budownictwie społecznym) zgodnie z ustawą VAT 2026. VAT 23% dotyczy działalności gospodarczej (biura, sklepy, hotele, obiekty komercyjne). W ElektroSmart PRO wybierasz rodzaj obiektu przy tworzeniu projektu - VAT liczy się automatycznie.",
        },
      },
      {
        "@type": "Question",
        name: "Czy mogę użyć ES-Engine do liczenia gniazdek z rzutu budowlanego?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Tak! ES-Engine oferuje Vision Mode: wgraj PDF z kosztorysem lub dokumentem technicznym (do 20MB), system odczytuje pozycje, ilości i ceny, automatycznie dopasowuje do katalogu i dodaje do kosztorysu jednym kliknięciem. Oszczędza to 80% czasu przy imporcie dokumentacji.",
        },
      },
      {
        "@type": "Question",
        name: "Ile kosztuje program do wycen i kosztorysów dla elektryków?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `ElektroSmart PRO kosztuje 159 zł/miesiąc netto: nielimitowane wyceny i kosztorysy, ES-Engine, import KNR Excel/CSV, ${catalogCount}+ pozycji katalogowych, Zestawy 360°, konfigurator rozdzielnic ${dinCount}+ modułów DIN, 12 kalkulatorów, eksport PDF/Excel, Portal Klienta, ceny regionalne 16 województw, VAT 8/23%. Wersja DEMO BEZPŁATNA.`,
        },
      },
    ],
  };

  return (
    <>
      <Script
        id="ld-software"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Script
        id="ld-organization"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}
