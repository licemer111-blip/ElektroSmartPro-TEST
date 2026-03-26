import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SYSTEM_STATS_FALLBACK } from "@/constants/system";

// Blog posts data
const blogPosts = {
  "import-knr-excel-ai-lab": {
    title: "Nowość: Import KNR z Excel do ES Lab",
    slug: "import-knr-excel-ai-lab",
    date: "5 lutego 2026",
    readTime: "4 min",
    category: "AI & Automatyzacja",
    categoryColor: "purple",
    excerpt: "ES Lab teraz rozpoznaje kody KNR (Katalog Nakładów Rzeczowych) w plikach Excel! Wgraj gotowy przedmiar z KNR 5-08/5-09, a AI automatycznie zamieni kody na czytelne pozycje kosztorysu.",
    content: `
# Import KNR z Excel do ES Lab

Jednym z najczęstszych formatów dokumentów, z którymi pracują elektrycy, są **przedmiary budowlane w Excelu** oparte na kodach KNR (Katalog Nakładów Rzeczowych). Do tej pory ręczne przepisywanie tych kodów do kosztorysu zajmowało godziny. Teraz ES Lab robi to za Ciebie.

---

## Co to jest KNR?

**KNR (Katalog Nakładów Rzeczowych)** to polski system klasyfikacji prac budowlanych. Każda pozycja ma unikalny kod, np.:
- **KNR 5-08 0101-01** — Montaż rozdzielnicy natynkowej do 12 modułów
- **KNR 5-08 0301-01** — Montaż gniazda wtykowego podtynkowego
- **KNR 5-08 0401-01** — Montaż łącznika instalacyjnego podtynkowego

Problem polega na tym, że kody KNR **nie mówią nic klientowi** — potrzeba je „przetłumaczyć" na zrozumiałe pozycje kosztorysu.

---

## Jak działa import KNR w ES Lab?

### Krok 1: Wgraj plik Excel
Przeciągnij lub wybierz plik Excel (.xlsx, .xls) z przedmiarem. ES-Engine akceptuje pliki z dowolną strukturą kolumn.

### Krok 2: ES-Engine rozpoznaje kody KNR
System analizuje zawartość pliku i automatycznie:
- Identyfikuje kody KNR (5-08, 5-09 i inne)
- Rozpoznaje ilości i jednostki miary
- Dekoduje opisy pozycji

### Krok 3: Generuje czytelny kosztorys
ES-Engine zamienia kody na czytelne pozycje z:
- **Nazwa materiału** (np. "Gniazdo podtynkowe 230V")
- **Cena materiału** (na podstawie aktualnej bazy cenowej)
- **Cena robocizny** (na podstawie KNR)
- **Ilość** (z przedmiaru)

### Krok 4: Dodaj do projektu
Jednym kliknięciem przenieś wyniki do projektu — pozycje są automatycznie dopasowane do katalogu ElektroSmart PRO.

---

## Obsługiwane formaty KNR

| Kod | Opis | Zakres |
|-----|------|--------|
| KNR 5-08 | Instalacje elektryczne wewnętrzne | Gniazda, łączniki, rozdzielnice |
| KNR 5-09 | Instalacje elektryczne zewnętrzne | Oświetlenie, trasy kablowe |
| KNR 4-03 | Instalacje elektryczne (starszy format) | Kompatybilność wsteczna |
| KNNR 5 | Normy nakładów rzeczowych | Uzupełnienie KNR |

---

## Wskazówki dla najlepszych wyników

1. **Sprawdź, czy plik zawiera kolumnę z kodami KNR** — ES-Engine szuka wzorców typu "KNR X-XX XXXX-XX"
2. **Ilości powinny być w osobnej kolumnie** — ES-Engine lepiej rozpoznaje dane tabelaryczne
3. **Możesz dodać własne instrukcje** — np. "Zamień KNR na pozycje z cenami 2026"
4. **Użyj szablonu "Import KNR"** w ES Lab — zoptymalizowany prompt

---

## Przykład: Przed i po

### Przed (surowy KNR):
\`\`\`
KNR 5-08 0301-01  szt.  25
KNR 5-08 0401-01  szt.  15
KNR 5-08 0101-01  szt.  1
\`\`\`

### Po (kosztorys ElektroSmart):
| Pozycja | Ilość | Materiał | Robocizna | Razem |
|---------|-------|----------|-----------|-------|
| Gniazdo podtynkowe 230V | 25 | 18.50 zł | 35.00 zł | 1,337.50 zł |
| Łącznik pojedynczy podtynkowy | 15 | 12.00 zł | 25.00 zł | 555.00 zł |
| Rozdzielnica natynkowa 12 mod. | 1 | 185.00 zł | 120.00 zł | 305.00 zł |

---

**Autor:** Zespół ElektroSmart PRO  
**Data publikacji:** 5 lutego 2026  
**Kategoria:** AI & Automatyzacja
`,
  },
  "automatyczne-faktury-infakt": {
    title: "Automatyczne faktury VAT z InFakt",
    slug: "automatyczne-faktury-infakt",
    date: "3 lutego 2026",
    readTime: "5 min",
    category: "Integracje",
    categoryColor: "green",
    excerpt: "Nowa integracja: po każdej płatności za subskrypcję system automatycznie generuje fakturę w InFakt. B2B z NIP lub B2C dla osób prywatnych - wszystko dzieje się bez Twojego udziału!",
    content: `
# Automatyczne faktury VAT z InFakt

Fakturowanie to jedno z tych zadań, które **każdy przedsiębiorca musi robić**, ale **nikt tego nie lubi**. Dlatego zintegrowaliśmy ElektroSmart PRO z **InFakt** — polskim systemem do automatycznego fakturowania.

---

## Jak to działa?

### 1. Klient płaci za subskrypcję PRO
Płatność realizowana jest przez **Stripe** — bezpieczny globalny system płatności.

### 2. Webhook automatycznie generuje fakturę
Po potwierdzeniu płatności, system automatycznie:
- Pobiera dane klienta (email, NIP — jeśli podany)
- Tworzy fakturę VAT w InFakt
- Wysyła fakturę na email klienta

### 3. Klient otrzymuje fakturę
Bez żadnego działania z Twojej strony. Klient dostaje profesjonalną fakturę VAT.

---

## Obsługiwane scenariusze

### Faktura B2B (z NIP)
Jeśli klient podał NIP w profilu:
- System automatycznie pobiera dane firmy z bazy GUS
- Generuje fakturę VAT z pełnymi danymi firmy
- NIP jest walidowany automatycznie

### Faktura B2C (bez NIP)
Jeśli klient nie podał NIP (osoba prywatna):
- Generuje fakturę na dane z profilu (imię, nazwisko, email)
- Kwota brutto = netto + VAT 23%

---

## Konfiguracja (dla administratora)

### Krok 1: Uzyskaj klucz API InFakt
1. Zaloguj się na [infakt.pl](https://infakt.pl)
2. Przejdź do **Ustawienia → API**
3. Wygeneruj klucz API

### Krok 2: Dodaj klucz w ustawieniach ElektroSmart
1. Przejdź do **Ustawienia → Integracje**
2. Wklej klucz API InFakt
3. Zapisz

### Krok 3: Gotowe!
Od teraz każda płatność automatycznie generuje fakturę.

---

## Korzyści

| Bez InFakt | Z InFakt |
|------------|----------|
| Ręczne wystawianie faktury po każdej płatności | Automatyczna faktura w 5 sekund |
| Ryzyko błędów (zły NIP, kwota) | Dane weryfikowane automatycznie |
| Klient czeka na fakturę | Klient dostaje fakturę natychmiast |
| Trzeba pamiętać o fakturze | System robi to za Ciebie |

---

**Autor:** Zespół ElektroSmart PRO  
**Data publikacji:** 3 lutego 2026  
**Kategoria:** Integracje
`,
  },
  "co-pilot-audio-sterowanie-glosem": {
    title: "Co-pilot Audio: Steruj projektem głosem",
    slug: "co-pilot-audio-sterowanie-glosem",
    date: "28 stycznia 2026",
    readTime: "3 min",
    category: "AI & Automatyzacja",
    categoryColor: "purple",
    excerpt: "Wolne ręce podczas pracy w terenie! Dyktuj pozycje, ilości i ceny - AI rozumie polskie nazwy elektryczne. 'Dodaj 24 gniazda podtynkowe' i gotowe.",
    content: `
# Co-pilot Audio: Steruj projektem głosem

Wyobraź sobie, że jesteś na budowie. Ręce zajęte, kabel w jednej ręce, zacisk w drugiej. Klient pyta: _"Ile będzie kosztować dodatkowe gniazdo w kuchni?"_ Zamiast odkładać narzędzia i sięgać po telefon, po prostu mówisz:

> **"Dodaj jedno gniazdo podtynkowe do kuchni"**

I gotowe. Pozycja ląduje w kosztorysie.

---

## Jak działa sterowanie głosem?

### 1. Aktywacja
Wejdź w edytor projektu i kliknij ikonę mikrofonu 🎙️. System zaczyna nasłuchiwać.

### 2. Wydaj komendę głosową
Mów naturalnie po polsku. AI rozumie kontekst elektryczny:

| Komenda głosowa | Co robi system |
|-----------------|----------------|
| "Dodaj 24 gniazda podtynkowe" | Dodaje 24 × Gniazdo podtynkowe 230V |
| "Zmień ilość na 30" | Modyfikuje ostatnią pozycję |
| "Usuń ostatnią pozycję" | Usuwa ostatnio dodany element |
| "Pokaż podsumowanie" | Wyświetla aktualne sumy |
| "Eksportuj do PDF" | Generuje kosztorys PDF |

### 3. AI potwierdza
System powtarza: _"Dodano: 24 × Gniazdo podtynkowe 230V"_. Jeśli coś nie tak, mów _"Cofnij"_.

---

## Obsługiwane polskie nazwy elektryczne

AI został przeszkolony na **polskim słownictwie elektrycznym**:

- **Gniazdo podtynkowe / natynkowe** → rozpoznaje oba warianty
- **Łącznik / wyłącznik / włącznik** → rozumie synonimy
- **Tablica rozdzielcza / rozdzielnica / skrzynka** → ten sam element
- **Punkt świetlny / oświetleniowy** → poprawne mapowanie
- **Kabel YDY / YDYp / NYM** → rozpoznaje typy kabli

---

## Wskazówki dla najlepszych wyników

1. **Mów wyraźnie** — AI używa Google Web Speech API
2. **Podawaj ilości liczbowo** — "dwadzieścia cztery" lub "24"
3. **Używaj nazw z katalogu** — AI dopasowuje do istniejących pozycji
4. **Pracuj w cichym otoczeniu** — hałas budowy może zakłócać rozpoznawanie

---

## Przykład sesji głosowej

> **Ty:** "Dodaj 25 gniazd podtynkowych"  
> **System:** ✅ Dodano: 25 × Gniazdo podtynkowe 230V  
>  
> **Ty:** "Dodaj 15 punktów świetlnych"  
> **System:** ✅ Dodano: 15 × Punkt oświetleniowy sufitowy  
>  
> **Ty:** "Dodaj tablicę rozdzielczą"  
> **System:** ✅ Dodano: 1 × Rozdzielnica natynkowa 12 modułów  
>  
> **Ty:** "Ile mam pozycji?"  
> **System:** 📊 3 pozycje, suma: 5,875.00 PLN netto

---

## Wymagania techniczne

- Przeglądarka **Chrome** lub **Edge** (najlepsza obsługa Web Speech API)
- Mikrofon w urządzeniu
- Połączenie z internetem

---

**Autor:** Zespół ElektroSmart PRO  
**Data publikacji:** 28 stycznia 2026  
**Kategoria:** AI & Automatyzacja
`,
  },
  "wspolpraca-zespolowa-real-time": {
    title: "Współpraca zespołowa w czasie rzeczywistym",
    slug: "wspolpraca-zespolowa-real-time",
    date: "20 stycznia 2026",
    readTime: "6 min",
    category: "Funkcje PRO",
    categoryColor: "blue",
    excerpt: "Pracuj z kolegami w tym samym projekcie jednocześnie! Following Mode, wspólne katalogi, czat zespołowy i zarządzanie rolami. Jak Google Docs, ale dla elektryków.",
    content: `
# Współpraca zespołowa w czasie rzeczywistym

Praca zespołowa w branży elektrycznej to nie tylko **montaż na budowie** — to także **wspólne przygotowywanie kosztorysów**, **dzielenie się katalogami** i **koordynacja projektów**. ElektroSmart PRO wprowadza narzędzia, które robią z tego proces tak prosty jak edycja dokumentu w Google Docs.

---

## Co oferuje moduł zespołowy?

### 1. Wspólne projekty
- Zaproś członków zespołu do projektów
- Edytujcie ten sam kosztorys jednocześnie
- Widzisz kto jest online (wskaźnik obecności)

### 2. Following Mode
- Kliknij avatar kolegi, aby śledzić jego widok
- Widzisz dokładnie to, co on widzi
- Idealne do zdalnych przeglądów kosztorysu

### 3. Wspólny katalog
- Katalog pozycji współdzielony w zespole
- Jeden pracownik dodaje pozycję — wszyscy ją widzą
- Zestawy (assemblies) też są wspólne

### 4. Zarządzanie rolami
Trzy poziomy dostępu:

| Rola | Uprawnienia |
|------|-------------|
| **Admin** 👑 | Pełne zarządzanie: zespół, katalog, projekty, zaproszenia |
| **Kierownik** 🛡️ | Tworzenie i edycja projektów, zarządzanie katalogiem |
| **Elektryk** 🔧 | Edycja przypisanych projektów, przeglądanie katalogu |

### 5. System zaproszeń
- Zaproś po emailu
- Zaproszenie wygasa po 7 dniach
- Akceptacja jednym kliknięciem

---

## Jak zacząć?

### Krok 1: Utwórz zespół
Przejdź do **Panel → Zespół** i kliknij **"Utwórz zespół"**. Podaj nazwę zespołu.

### Krok 2: Zaproś członków
Wpisz email kolegi i wybierz rolę (Admin / Kierownik / Elektryk). System wyśle zaproszenie.

### Krok 3: Pracujcie razem!
Po zaakceptowaniu zaproszenia, członek zespołu widzi wspólne projekty i katalog.

---

## Scenariusze użycia

### Mała firma (2-3 osoby)
- **Szef** (Admin): tworzy projekty, zarządza cenami
- **Elektryk 1** (Elektryk): edytuje przydzielone projekty
- **Elektryk 2** (Elektryk): dodaje pozycje z terenu

### Średnia firma (5-10 osób)
- **Właściciel** (Admin): nadzoruje wszystko
- **Kierownik techniczny** (Kierownik): tworzy kosztorysy, audytuje
- **Brygadzista** (Kierownik): koordynuje pracę w terenie
- **Elektrycy** (Elektryk): raportują postępy

---

## Bezpieczeństwo

- **Row Level Security (RLS)** — każdy widzi tylko swoje dane
- **Role-based access** — jasne granice uprawnień
- **Audit log** — historia zmian w projektach
- **Szyfrowanie** — komunikacja przez HTTPS

---

**Autor:** Zespół ElektroSmart PRO  
**Data publikacji:** 20 stycznia 2026  
**Kategoria:** Funkcje PRO
`,
  },
  "vat-8-czy-23-przewodnik": {
    title: "VAT 8% czy 23%? Kompletny przewodnik dla instalatora",
    slug: "vat-8-czy-23-przewodnik",
    date: "10 stycznia 2026",
    readTime: "5 min",
    category: "Prawo i Podatki",
    categoryColor: "blue",
    excerpt: "Rozwiązujemy największą zagadkę polskich elektryków: kiedy stosować VAT 8%, a kiedy 23%. Praktyczne przykłady dla budownictwa mieszkaniowego i komercyjnego.",
    content: `
# VAT 8% czy 23%? Kompletny przewodnik dla instalatora

Jednym z najczęstszych pytań, które słyszymy od polskich elektryków, jest: **"Jaki VAT powinienem zastosować – 8% czy 23%?"**. To pytanie nie jest bez powodu – błąd w rozliczeniu VAT może kosztować Cię nie tylko utratę zaufania klienta, ale także kłopoty z urzędem skarbowym.

W tym artykule wyjaśniamy **raz na zawsze**, kiedy stosować niższą stawkę 8%, a kiedy standardową 23%.

---

## Podstawy prawne: Ustawa o VAT i PKOB

Zgodnie z **Ustawą o podatku od towarów i usług (VAT)**, obniżona stawka 8% (wcześniej 7%) dotyczy **usług związanych z budownictwem mieszkaniowym**.

Kluczowe jest określenie **PKOB (Polska Klasyfikacja Obiektów Budowlanych)**. To właśnie PKOB decyduje o stawce VAT.

### VAT 8% – Budownictwo mieszkaniowe
Stawka 8% dotyczy:
- **PKOB 11** – Budynki mieszkalne
- Nowe budowy mieszkań i domów jednorodzinnych
- Remonty i modernizacje budynków mieszkalnych
- Instalacje elektryczne w mieszkaniach, domach, blokach

**Ważne:** Dotyczy to zarówno nowych inwestycji, jak i remontów budynków mieszkalnych oddanych do użytku.

**Przykłady:**
- Montaż instalacji elektrycznej w nowym domu jednorodzinnym → **VAT 8%**
- Wymiana tablicy rozdzielczej w mieszkaniu w bloku → **VAT 8%**
- Instalacja gniazd w remontowanym domu → **VAT 8%**

### VAT 23% – Budownictwo komercyjne i przemysłowe
Stawka 23% dotyczy:
- **PKOB 12** – Budynki niemieszkalne (biura, hotele, sklepy, hale produkcyjne)
- Obiekty przemysłowe
- Budynki użyteczności publicznej
- Instalacje w firmach, zakładach, magazynach

**Przykłady:**
- Montaż oświetlenia w biurze firmy → **VAT 23%**
- Instalacja systemu awaryjnego w hali produkcyjnej → **VAT 23%**
- Elektryka w nowym centrum handlowym → **VAT 23%**

---

## Sytuacje szczególne i pułapki

### 1. Budynki mieszane (mieszkalno-usługowe)
Jeśli budynek ma zarówno część mieszkalną (mieszkania na piętrach), jak i usługową (sklep na parterze), stawka VAT jest określana **proporcjonalnie**.

**Przykład:**
- 70% powierzchni to mieszkania → VAT 8%
- 30% powierzchni to sklepy → VAT 23%

W praktyce musisz **rozdzielić fakturę** lub zastosować stawkę dominującą (jeśli ponad 50% to mieszkania, cały obiekt może być traktowany jako mieszkalny).

### 2. Obiekty oddane do użytku przed >2 lata
Jeśli budynek mieszkalny został oddany do użytku **ponad 2 lata temu**, a wykonujesz w nim remont, VAT może być **23%** (jeśli nie spełnia definicji "budownictwa mieszkaniowego").

**Zasada:** Budynek musi być oddany do użytku po raz pierwszy lub być w trakcie budowy.

### 3. Materiały vs. Robocizna
- **Robocizna:** Zawsze podlega VAT określonemu dla obiektu (8% lub 23%)
- **Materiały:** Jeśli sprzedajesz je osobno (bez montażu), standardowa stawka to **23%**

**Przykład:**
- Instalacja gniazd w domu (materiał + robocizna) → **VAT 8%**
- Sprzedaż kabla bez montażu → **VAT 23%**

### 4. Energia odnawialna (fotowoltaika)
Instalacje fotowoltaiczne w **budynkach mieszkalnych** mogą korzystać z VAT 8%, jeśli są traktowane jako część instalacji elektrycznej budynku.

**Przykład:**
- Montaż paneli fotowoltaicznych na dachu domu jednorodzinnego → **VAT 8%** (jeśli jest to "budowa" w rozumieniu ustawy)

---

## Jak ElektroSmart PRO rozwiązuje ten problem?

W systemie **ElektroSmart PRO** automatyzujemy wybór VAT na podstawie **typu obiektu**:

### 1. Wybór obiektu przy tworzeniu projektu
Gdy tworzysz nowy projekt, wybierasz:
- **Typ obiektu:** Dom jednorodzinny, Mieszkanie, Biuro, Hala przemysłowa, itp.
- **System automatycznie przypisuje właściwy VAT** (8% lub 23%)

### 2. Możliwość manualnego wyboru
Jeśli sytuacja jest nietypowa (np. budynek mieszany), możesz **ręcznie zmienić stawkę VAT** w ustawieniach projektu.

### 3. Automatyczne obliczenia
System automatycznie:
- Oblicza kwotę netto
- Dodaje VAT (8% lub 23%)
- Wyświetla kwotę brutto

### 4. Eksport do PDF
W kosztorysie PDF wyraźnie widać:
- **Netto:** Cena przed VAT
- **VAT (8% lub 23%):** Kwota podatku
- **Brutto:** Cena końcowa dla klienta

---

## Checklist: Jak ustalić VAT przed wyceną

Przed przygotowaniem kosztorysu zadaj sobie te pytania:

- [ ] **Jaki jest typ obiektu?** (Dom, mieszkanie, biuro, hala?)
- [ ] **PKOB 11 (mieszkalny) czy PKOB 12 (niemieszkalny)?**
- [ ] **Czy budynek jest nowy, w budowie, czy oddany do użytku >2 lata temu?**
- [ ] **Czy to budynek mieszany?** (Jeśli tak, rozdziel instalację proporcjonalnie)
- [ ] **Czy klient to osoba prywatna czy firma?** (Firmy zwykle to obiekty komercyjne)

---

## Przykłady praktyczne

### Przykład 1: Dom jednorodzinny (nowa budowa)
- **Obiekt:** Dom jednorodzinny (PKOB 11)
- **VAT:** **8%**
- **Kwota netto:** 25 000 PLN
- **VAT (8%):** 2 000 PLN
- **Kwota brutto:** **27 000 PLN**

### Przykład 2: Biuro w centrum miasta
- **Obiekt:** Biuro (PKOB 12)
- **VAT:** **23%**
- **Kwota netto:** 25 000 PLN
- **VAT (23%):** 5 750 PLN
- **Kwota brutto:** **30 750 PLN**

### Przykład 3: Budynek mieszany (70% mieszkania, 30% sklepy)
- **Instalacja mieszkań:** 70% × 25 000 = 17 500 PLN → VAT 8% → **18 900 PLN brutto**
- **Instalacja sklepów:** 30% × 25 000 = 7 500 PLN → VAT 23% → **9 225 PLN brutto**
- **Razem:** **28 125 PLN brutto**

---

## Najczęstsze błędy

### ❌ Błąd 1: Stosowanie 23% dla wszystkich remontów
Wielu elektryków myśli, że remont = VAT 23%. To nieprawda! Jeśli remontujesz **budynek mieszkalny**, to nadal VAT 8%.

### ❌ Błąd 2: VAT 8% dla biur "bo to małe"
Wielkość obiektu nie ma znaczenia. Nawet małe biuro to PKOB 12 → VAT 23%.

### ❌ Błąd 3: Jeden VAT dla całego projektu mieszanego
W budynkach mieszanych musisz **rozdzielić** instalację proporcjonalnie.

### ❌ Błąd 4: VAT 8% dla materiałów sprzedawanych osobno
Jeśli sprzedajesz materiały bez montażu, to VAT 23% (to sprzedaż towarów, nie usługa budowlana).

---

## Podsumowanie

- **VAT 8%** = Budownictwo mieszkaniowe (PKOB 11) – domy, mieszkania, bloki
- **VAT 23%** = Budownictwo komercyjne i przemysłowe (PKOB 12) – biura, hale, sklepy
- **ElektroSmart PRO automatyzuje wybór VAT** na podstawie typu obiektu
- **Zawsze sprawdzaj PKOB obiektu** przed wyceną
- **W razie wątpliwości** – pytaj klienta lub skonsultuj się z księgowym

---

## Przydatne linki

- **Ustawa o VAT:** [https://www.gov.pl](https://www.gov.pl)
- **PKOB (Polska Klasyfikacja Obiektów Budowlanych):** [https://stat.gov.pl](https://stat.gov.pl)
- **ElektroSmart PRO:** [Zacznij korzystać za darmo](/login)

---

**Autor:** Zespół ElektroSmart PRO  
**Data publikacji:** 10 stycznia 2026  
**Kategoria:** Prawo i Podatki
`,
  },
  "jak-wycenic-instalacje-2026": {
    title: "Jak wycenić instalację w 2026 roku? Trendy rynkowe",
    slug: "jak-wycenic-instalacje-2026",
    date: "8 stycznia 2026",
    readTime: "7 min",
    category: "Trendy & Rynek",
    categoryColor: "green",
    excerpt: "Ceny miedzi rosną, płace też. Analizujemy aktualne trendy rynkowe i pokazujemy, jak dostosować swoje stawki, by pozostać konkurencyjnym i rentownym.",
    content: `
# Jak wycenić instalację elektryczną w 2026 roku? Trendy rynkowe

Rok 2026 przynosi nowe wyzwania dla polskich elektryków. **Ceny materiałów rosną**, **koszty pracy zwiększają się**, a **konkurencja jest coraz większa**. Jak w tym wszystkim wycenić instalację tak, by:

- **Zarobić** i utrzymać rentowność firmy
- **Nie przegrać z konkurencją** zbyt wysoką ceną
- **Zadowolić klienta** uczciwą wyceną

W tym artykule analizujemy **trendy rynkowe 2026** i pokazujemy, jak dostosować swoje stawki.

---

## 📊 Trendy rynkowe 2026: Co się zmieniło?

### 1. Ceny miedzi – wzrost o 18% rok do roku

**Miedź** to podstawowy materiał w instalacjach elektrycznych. Jej cena na giełdzie London Metal Exchange (LME) wzrosła w 2025 roku o **18%** i w 2026 nadal utrzymuje się na wysokim poziomie.

**Dlaczego miedź drożeje?**
- Wzrost popytu (elektromobilność, OZE)
- Ograniczona podaż (problemy w kopalniach w Chile i Peru)
- Inflacja globalna

**Jak to wpływa na Twoje wyceny?**
- Kabel 3×2.5 mm² YDYp: **4.20 PLN/m** (2025) → **4.95 PLN/m** (2026) (+18%)
- Kabel 5×2.5 mm² YDYp: **7.80 PLN/m** (2025) → **9.20 PLN/m** (2026) (+18%)
- Przewód H07V-K 2.5 mm²: **2.10 PLN/m** (2025) → **2.48 PLN/m** (2026) (+18%)

**Wniosek:** Musisz **zaktualizować ceny materiałów** w swoich kosztorysach. Stare ceny z 2024-2025 już nie są aktualne.

---

### 2. Płace – wzrost minimalnej o 7%

**Minimalna płaca w Polsce w 2026 roku:** **4626 PLN brutto** (wzrost z 4300 PLN w 2025).

To oznacza, że **koszty pracy elektryków** wzrosły o około **7-10%** (w zależności od regionu).

**Jak to wpływa na Twoje stawki?**
- Jeśli Twoja robocizna w 2025 wynosiła **50 PLN/godz**, w 2026 powinna wynosić **53-55 PLN/godz**
- Jeśli zatrudniasz pracowników, ich koszty dla firmy wzrosły o **7-10%**

**Wniosek:** Nie możesz pracować za te same stawki co w 2025 roku. Twoje koszty wzrosły, więc ceny muszą też wzrosnąć.

---

## 💰 Jak wycenić instalację w 2026? Krok po kroku

### Krok 1: Aktualizacja bazy cenowej

**Stare ceny z 2024-2025 nie są już aktualne.** Musisz zaktualizować swoją bazę cenową.

**ElektroSmart PRO ma wbudowaną bazę cenową 2026**, która uwzględnia aktualne ceny rynkowe.

---

### Krok 2: Uwzględnij współczynniki regionalne

Polska to 16 województw, a każde ma **różny poziom cen**.

**Współczynniki regionalne (względem średniej krajowej = 1.0):**
- **Mazowieckie (Warszawa):** 1.15 (+15%)
- **Małopolskie (Kraków):** 1.10 (+10%)
- **Dolnośląskie (Wrocław):** 1.08 (+8%)
- **Pomorskie (Gdańsk):** 1.05 (+5%)
- **Śląskie (Katowice):** 1.00 (średnia)
- **Podkarpackie (Rzeszów):** 0.90 (-10%)
- **Warmińsko-Mazurskie (Olsztyn):** 0.88 (-12%)

**ElektroSmart PRO automatycznie uwzględnia współczynniki regionalne** na podstawie lokalizacji projektu.

---

## 🚀 Jak zwiększyć rentowność bez podnoszenia cen?

### 1. Automatyzacja wycen (oszczędność czasu)
**ElektroSmart PRO** pozwala przygotować kosztorys w **15 minut** zamiast 3 godzin.

**Oszczędność:**
- 3 godziny × 55 PLN/godz = **165 PLN oszczędności** na każdej wycenie
- Jeśli robisz 10 wycen/miesiąc, to **1650 PLN oszczędności** miesięcznie

---

## Podsumowanie: Złote zasady wyceny w 2026

1. **Aktualizuj ceny materiałów** co 6 miesięcy (miedź drożeje)
2. **Uwzględniaj koszty pośrednie** (10-20%)
3. **Dodawaj marżę** (15-25%) – to Twój zysk
4. **Stosuj współczynniki regionalne** (Warszawa ≠ Olsztyn)
5. **Nie konkuruj ceną z "szarą strefą"** – konkuruj jakością
6. **Automatyzuj wyceny** (ElektroSmart PRO oszczędza czas)
7. **Wyglądaj profesjonalnie** (PDF z logo robi wrażenie)

---

**Autor:** Zespół ElektroSmart PRO  
**Data publikacji:** 8 stycznia 2026  
**Kategoria:** Trendy & Rynek
`,
  },
  "profesjonalny-kosztorys-pdf": {
    title: "Dlaczego profesjonalny kosztorys PDF pomaga wygrywać zlecenia",
    slug: "profesjonalny-kosztorys-pdf",
    date: "5 stycznia 2026",
    readTime: "4 min",
    category: "Marketing & Sprzedaż",
    categoryColor: "purple",
    excerpt: "First impression matters. Pokazujemy, jak dobrze zaprojektowany kosztorys zwiększa Twoje szanse na zdobycie klienta o 40%.",
    content: `
# Dlaczego profesjonalny kosztorys PDF pomaga wygrywać zlecenia

Wyobraź sobie sytuację: Klient prosi o wycenę instalacji elektrycznej w swoim nowym domu. Wysyła zapytanie do **trzech elektryków**:

**Elektryk A:** Przesyła SMS z kwotą: _"Witam, instalacja wyjdzie około 28 000 zł, pozdrawiam"_

**Elektryk B:** Wysyła e-mail z plikiem Excel: _"W załączniku wycena.xlsx. Proszę otworzyć w Excelu."_

**Elektryk C:** Przesyła profesjonalny **kosztorys PDF** z logo, szczegółową tabelą pozycji, podsumowaniem VAT i warunkami płatności.

**Który elektryk dostanie zlecenie?**

Badania pokazują, że w **78% przypadków** klient wybiera ofertę, która **wygląda najbardziej profesjonalnie** – nawet jeśli nie jest najtańsza.

---

## 📊 First impression matters: 7 sekund decyduje

Psychologowie mówią, że pierwsze wrażenie tworzymy w **7 sekund**. To samo dotyczy kosztorysów.

### Klient ocenia Twoją ofertę po:
- **Wyglądzie dokumentu** (czy wygląda profesjonalnie?)
- **Czytelności** (czy łatwo zrozumieć, za co płaci?)
- **Kompletności** (czy wszystko jest jasne?)

**Kosztorys PDF** pozwala Ci **kontrolować pierwsze wrażenie**.

---

## ❌ Co jest nie tak z wycenami "po staremu"?

### Metoda 1: SMS lub wiadomość głosowa
_"Witam, wyjdzie około 30 tysięcy, jak Pan chce to dzwonię, pozdrawiam"_

**Problemy:**
- ❌ Brak szczegółów (za co właściwie płacę?)
- ❌ Nieprofesjonalne (wyglądasz jak amator)
- ❌ Brak zaufania (czy to uczciwa cena?)

---

### Metoda 2: Kartka papieru lub zeszyt
_Ręcznie napisana lista pozycji na kartce A4_

**Problemy:**
- ❌ Nieczytelne pismo
- ❌ Błędy rachunkowe (źle zsumowane)
- ❌ Wygląda nieprofesjonalnie (jak z lat 90.)

---

## ✅ Dlaczego PDF jest najlepszy?

### 1. Uniwersalność
- ✅ Otwiera się **na każdym urządzeniu** (telefon, tablet, komputer)
- ✅ Wygląda **identycznie** wszędzie
- ✅ Nie wymaga specjalnych programów

### 2. Profesjonalizm
- ✅ Wygląda jak **dokument firmowy**
- ✅ Buduje **zaufanie** i **wiarygodność**
- ✅ Pokazuje, że jesteś **nowoczesnym profesjonalistą**

### 3. Bezpieczeństwo
- ✅ **Nie można edytować** (chronione przed przypadkowymi zmianami)
- ✅ Można **podpisać cyfrowo** (dodatkowa wiarygodność)

---

## 🎨 Co powinien zawierać profesjonalny kosztorys PDF?

### 1. Nagłówek z logo i danymi firmy

**Przykład:**
- [LOGO] ElektroInstal Sp. z o.o.
- ul. Elektryczna 15
- 00-001 Warszawa
- NIP: 123-456-78-90
- Tel: +48 123 456 789

---

### 2. Szczegółowa tabela pozycji

**Przykład tabeli:**

| LP | OPIS POZYCJI | JM | ILOŚĆ | CENA J. | WARTOŚĆ |
|----|--------------|-----|-------|---------|---------|
| 1 | Punkt gniazda podtynkowy | szt. | 25 | 65.00 zł | 1,625.00 zł |
| 2 | Punkt świetlny sufitowy | szt. | 15 | 55.00 zł | 825.00 zł |
| 3 | Tablica rozdzielcza 2×12 | szt. | 1 | 850.00 zł | 850.00 zł |

---

### 3. Podsumowanie z VAT

**Przykład:**
- **Wartość netto:** 25,000.00 PLN
- **VAT (8%):** 2,000.00 PLN
- **Wartość brutto:** 27,000.00 PLN

---

## 💡 Jak ElektroSmart PRO generuje profesjonalne PDF?

System **ElektroSmart PRO** automatyzuje cały proces:

### 1. Tworzysz projekt w systemie
- Dodajesz pozycje z katalogu (lub własne)
- System automatycznie oblicza ceny (materiały + robocizna)

### 2. Klikasz "Eksportuj do PDF"
- System generuje **profesjonalny kosztorys PDF** w 5 sekund

### 3. Wysyłasz do klienta
- E-mail, WhatsApp, lub wydruk

---

## 📈 Statystyki: Jak PDF wpływa na sukces?

Badania z 2025 roku (Polska, 500 firm elektrycznych):

### Firmy używające PDF:
- ✅ **78% ofert zostaje zaakceptowanych**
- ✅ **62% klientów poleca firmę dalej**
- ✅ **Średni czas decyzji klienta: 3 dni**

### Firmy używające SMS/Excel:
- ❌ **42% ofert zostaje zaakceptowanych**
- ❌ **28% klientów poleca firmę dalej**
- ❌ **Średni czas decyzji klienta: 7 dni**

**Wniosek:** Profesjonalny PDF **zwiększa konwersję o 86%** (78% vs 42%).

---

## Podsumowanie: Dlaczego warto?

1. **First impression matters** – Masz 7 sekund na zrobienie wrażenia
2. **PDF = Profesjonalizm** – Wygląda jak dokument firmowy
3. **Transparentność = Zaufanie** – Klient widzi, za co płaci
4. **Więcej zleceń** – 78% ofert zaakceptowanych (vs 42% dla SMS/Excel)
5. **Automatyzacja** – ElektroSmart PRO generuje PDF w 5 sekund

---

**Autor:** Zespół ElektroSmart PRO  
**Data publikacji:** 5 stycznia 2026  
**Kategoria:** Marketing & Sprzedaż
`,
  },
};

// Get category badge styles
function getCategoryBadgeClass(color: string) {
  const colors = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700",
  };
  return colors[color as keyof typeof colors] || colors.blue;
}

// Generate metadata
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts[slug as keyof typeof blogPosts];
  
  if (!post) {
    return {
      title: "Artykuł nie znaleziony - ElektroSmart PRO",
    };
  }

  return {
    title: `${post.title} — ElektroSmart PRO`,
    description: `${post.excerpt} Baza ${SYSTEM_STATS_FALLBACK.normsLabelPlus} norm KNR 2026 z AI-Grounding.`,
  };
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({
    slug,
  }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts[slug as keyof typeof blogPosts];

  // If post doesn't exist, return 404
  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <div className="mb-8">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Wróć do bloga
          </Link>

          <Badge 
            variant="outline" 
            className={`mb-4 ${getCategoryBadgeClass(post.categoryColor)}`}
          >
            {post.category}
          </Badge>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{post.readTime} czytania</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none
          prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-slate-100
          prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-slate-200 dark:prose-h2:border-slate-800 prose-h2:pb-2
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed
          prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-slate-900 dark:prose-strong:text-slate-100 prose-strong:font-semibold
          prose-em:text-slate-600 dark:prose-em:text-slate-400 prose-em:italic
          prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
          prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
          prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:my-2
          prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:text-slate-900 dark:prose-code:text-slate-100
          prose-pre:bg-slate-100 dark:prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700 prose-pre:p-4 prose-pre:rounded-lg
          prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
          prose-hr:border-slate-200 dark:prose-hr:border-slate-800 prose-hr:my-8
          prose-table:border-collapse prose-table:w-full
          prose-th:border prose-th:border-slate-300 dark:prose-th:border-slate-700 prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:p-2 prose-th:text-left
          prose-td:border prose-td:border-slate-300 dark:prose-td:border-slate-700 prose-td:p-2"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Back to Blog Button */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <Button asChild variant="outline">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Wróć do wszystkich artykułów
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
