interface LandingStructuredDataProps {
  catalogCount: number;
  dinCount?: number;
}

export function LandingStructuredData({ catalogCount }: LandingStructuredDataProps) {
  const baseUrl = "https://elektrosmart.pro";

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
      `Profesjonalny program dla elektryków: kosztorys z podziałem materiał/robocizna, normy ES w rbh, zestawy. Ceny regionalne 16 województw (współczynnik robocizny), VAT 8%/23%, eksport PDF/Excel.`,
    featureList: [
      "Kosztorys: materiał i robocizna osobno",
      `Katalog ${catalogCount > 0 ? catalogCount : "pozycji"} z godzinami normy ES`,
      "Robocizna = rbh × stawka × województwo",
      "Zestaw punktu: gniazdo, puszka, kabel, bruzda",
      "12 kalkulatorów jako szacunek, nie projekt instalacji",
      "VAT 8% dla mieszkania i 23% dla obiektu komercyjnego",
      "PDF z logo. W DEMO jest znak wodny",
      "DEMO: jeden własny projekt. PRO: 159 zł netto miesięcznie",
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
      "Profesjonalny program dla elektryków w Polsce: kosztorys elektryczny online, wycena instalacji z podziałem materiał/robocizna, ceny regionalne 16 województw. Zgodność z PN-HD 60364.",
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
          text: "Trzy kroki: województwo i typ obiektu (VAT 8% albo 23%), pozycje z katalogu lub szybka wycena z metrażu, PDF z logo. Robocizna to godziny normy ES razy stawka razy województwo. Materiał bez tej korekty. W DEMO na PDF jest znak wodny.",
        },
      },
      {
        "@type": "Question",
        name: "Ile kosztuje punkt elektryczny w 2026 roku?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Program nie podaje jednej ceny punktu z ulicy. Punkt gniazda to gniazdo, puszka, kabel i bruzda. Robocizna = godziny normy ES × stawka × województwo. Mazowieckie +20% tylko na robociznę, Podkarpackie −12%. Materiał zostaje w cenie katalogu.",
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
        name: "Czy program sam policzy gniazdka z rzutu budowlanego?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Nie. Rysunku nie czyta. Gniazdka liczysz sam albo podajesz metraż i liczbę pomieszczeń w szybkiej wycenie.",
        },
      },
      {
        "@type": "Question",
        name: "Ile kosztuje program do wycen i kosztorysów dla elektryków?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "PRO kosztuje 159 zł netto miesięcznie: więcej niż jeden projekt i PDF bez znaku wodnego. DEMO jest bezpłatne: ceny widać, własny projekt jest jeden, na PDF jest znak DEMO.",
        },
      },
    ],
  };

  return (
    <>
      <script
        id="ld-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        id="ld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
      />
      <script
        id="ld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  );
}
