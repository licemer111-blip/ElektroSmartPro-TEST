/**
 * Email Templates for Project Estimates
 * Professional Polish templates for sending offers to clients
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  icon: string;
  color: string; // tailwind color key for UI
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "professional",
    name: "Oferta profesjonalna",
    icon: "💼",
    color: "blue",
    subject: "Oferta na realizację — {{projectName}}",
    description: "Kompletna oferta z pełnym opisem zakresu i warunków",
    body: `Szanowny/a {{clientName}},

Dziękuję za zainteresowanie naszymi usługami. Z przyjemnością przedstawiam ofertę na realizację projektu **{{projectName}}**.

W załączeniu przesyłam kompletną dokumentację:
- Szczegółowy kosztorys z podziałem na materiały i robociznę (PDF)
- Kosztorys w formacie Excel do Państwa dyspozycji
- Obliczenia inżynierskie potwierdzające dobór rozwiązań

**Wartość oferty netto:** {{totalAmount}} PLN

**Warunki oferty:**
- Termin ważności: 30 dni od daty {{sentDate}}
- Gwarancja na wykonane prace: 24 miesiące
- Możliwość etapowania płatności

Kosztorys zawiera szczegółowy wykaz wszystkich pozycji — zarówno materiałowych, jak i robocizny — co zapewnia pełną transparentność wyceny.

Pozostaję do dyspozycji w przypadku pytań lub potrzeby omówienia szczegółów.

Z poważaniem,
{{userName}}
{{companyName}}
{{userEmail}} | {{userPhone}}`,
  },
  {
    id: "brief",
    name: "Szybka wycena",
    icon: "⚡",
    color: "amber",
    subject: "Wycena — {{projectName}}",
    description: "Krótka, konkretna wycena bez zbędnych formalności",
    body: `Dzień dobry {{clientName}},

Przesyłam wycenę projektu **{{projectName}}**.

**Kwota: {{totalAmount}} PLN**

Szczegółowy kosztorys oraz obliczenia inżynierskie znajdzie Pan/i w załącznikach do tego emaila. Plik Excel umożliwia dowolną edycję i analizę poszczególnych pozycji.

Oferta ważna do {{expiryDate}}.

W razie pytań — proszę śmiało pisać lub dzwonić.

Pozdrawiam,
{{userName}}
{{companyName}}
{{userEmail}} | {{userPhone}}`,
  },
  {
    id: "reminder",
    name: "Przypomnienie",
    icon: "🔔",
    color: "orange",
    subject: "Przypomnienie — oferta {{projectName}}",
    description: "Uprzejme przypomnienie o wcześniej wysłanej ofercie",
    body: `Dzień dobry {{clientName}},

Nawiązuję do przesłanej {{sentDate}} oferty dotyczącej projektu **{{projectName}}**.

Chciałem uprzejmie zapytać, czy miał/a Pan/i okazję zapoznać się z przesłanym kosztorysem i załączonymi obliczeniami?

**Wartość oferty:** {{totalAmount}} PLN

Ponownie załączam pełną dokumentację — kosztorys w formacie PDF i Excel oraz obliczenia inżynierskie.

Jeśli oferta wymaga korekt lub dodatkowych wyjaśnień, chętnie dostosuję wycenę do Państwa potrzeb.

Przypominam, że oferta ważna jest do **{{expiryDate}}**.

Z poważaniem,
{{userName}}
{{companyName}}
{{userEmail}} | {{userPhone}}`,
  },
  {
    id: "start",
    name: "Start realizacji",
    icon: "🚀",
    color: "emerald",
    subject: "Potwierdzenie rozpoczęcia prac — {{projectName}}",
    description: "Potwierdzenie akceptacji oferty i rozpoczęcia realizacji",
    body: `Szanowny/a {{clientName}},

Dziękuję za akceptację oferty. Potwierdzam przyjęcie do realizacji projektu **{{projectName}}**.

**Szczegóły realizacji:**
- Zakres: zgodny z załączonym kosztorysem
- Wartość: **{{totalAmount}} PLN**
- Planowane rozpoczęcie: {{startDate}}
- Szacowany czas realizacji: {{duration}}

W załączniku przesyłam kompletną dokumentację projektową — kosztorys oraz obliczenia inżynierskie, które będą stanowić podstawę realizacji.

Przed rozpoczęciem prac skontaktuję się w celu ustalenia harmonogramu i szczegółów logistycznych.

Pozdrawiam,
{{userName}}
{{companyName}}
{{userEmail}} | {{userPhone}}`,
  },
  {
    id: "completion",
    name: "Zakończenie prac",
    icon: "✅",
    color: "violet",
    subject: "Zakończenie realizacji — {{projectName}}",
    description: "Informacja o zakończeniu prac i przekazanie dokumentacji",
    body: `Szanowny/a {{clientName}},

Z przyjemnością informuję, że prace związane z projektem **{{projectName}}** zostały pomyślnie zakończone.

**Podsumowanie:**
- Wszystkie prace wykonane zgodnie z kosztorysem
- Testy i pomiary elektryczne zakończone pozytywnie
- Dokumentacja powykonawcza przygotowana

**Wartość zrealizowanych prac:** {{totalAmount}} PLN

W załączniku przesyłam końcowy kosztorys, obliczenia inżynierskie oraz dokumentację powykonawczą. Faktura VAT zostanie wystawiona w ciągu 3 dni roboczych.

Dziękuję za zaufanie i owocną współpracę. W razie jakichkolwiek pytań lub potrzeby serwisowej — zapraszam do kontaktu.

Z poważaniem,
{{userName}}
{{companyName}}
{{userEmail}} | {{userPhone}}`,
  },
];

/**
 * Replace template variables with actual values
 */
export function fillTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  });
  
  return result;
}

/**
 * Get available template variables
 */
export function getTemplateVariables(): Array<{ key: string; description: string }> {
  return [
    { key: 'clientName', description: 'Nazwa klienta' },
    { key: 'projectName', description: 'Nazwa projektu' },
    { key: 'totalAmount', description: 'Wartość brutto (automatycznie)' },
    { key: 'userName', description: 'Twoje imię i nazwisko' },
    { key: 'companyName', description: 'Nazwa firmy' },
    { key: 'userEmail', description: 'Twój email' },
    { key: 'userPhone', description: 'Twój telefon' },
    { key: 'sentDate', description: 'Data wysłania (automatycznie)' },
    { key: 'expiryDate', description: 'Data ważności oferty' },
    { key: 'startDate', description: 'Data rozpoczęcia prac' },
    { key: 'duration', description: 'Czas realizacji' },
  ];
}
