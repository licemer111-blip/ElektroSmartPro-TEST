export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  category: string;
  keywords: string[];
  content: BlogSection[];
}

export interface BlogSection {
  type: "heading" | "paragraph" | "list" | "callout" | "tip";
  text?: string;
  items?: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "jak-wycenic-instalacje-2026",
    title: "Jak wycenić instalację elektryczną w 2026 roku — kompletny przewodnik",
    description:
      "Krok po kroku: jak przygotować rzetelną wycenę instalacji elektrycznej w 2026 roku. Normy KNR, stawki robocizny w 16 województwach, VAT 8%/23% i eksport PDF.",
    date: "2026-01-08",
    readTime: 8,
    category: "Kosztorysowanie",
    keywords: ["wycena instalacji elektrycznej", "kosztorys elektryczny 2026", "jak wycenić elektrykę", "stawki elektryka 2026"],
    content: [
      { type: "paragraph", text: "Przygotowanie rzetelnej wyceny instalacji elektrycznej to jeden z kluczowych etapów każdego projektu. Zaniżona wycena prowadzi do strat, zawyżona — do utraty zlecenia. W tym przewodniku pokazujemy, jak krok po kroku stworzyć profesjonalny kosztorys elektryczny w 2026 roku." },
      { type: "heading", text: "1. Zacznij od inwentaryzacji zakresu prac" },
      { type: "paragraph", text: "Podstawą dobrej wyceny jest precyzyjny przedmiar robót. Przed sporządzeniem kosztorysu przeanalizuj dokumentację techniczną i sporządź listę wszystkich prac: montaż instalacji podtynkowej, układanie tras kablowych, montaż rozdzielnic, podłączenie urządzeń." },
      { type: "list", items: [
        "Oblicz metraż tras kablowych (m.b.)",
        "Policz liczbę punktów elektrycznych (gniazda, włączniki, oprawy)",
        "Zinwentaryzuj urządzenia do podłączenia (piec, klimatyzacja, wentylacja)",
        "Uwzględnij prace w betonie (bruzdowanie, przepusty)",
        "Oszacuj czas na prace demontażowe przy modernizacji",
      ]},
      { type: "heading", text: "2. Normy KNR — fundament wyceny robocizny" },
      { type: "paragraph", text: "Katalogi Norm i Robocizny (KNR) to oficjalne dokumenty określające nakłady pracy (rbh — roboczogodziny) dla poszczególnych czynności. Kluczowe dla elektryki to KNR 5-04 (instalacje elektryczne), KNR 5-08 (instalacje teletechniczne) oraz KNR 5-09 (rozdzielnice i aparatura)." },
      { type: "callout", text: "💡 ElektroSmart PRO zawiera ponad 2 000 norm KNR dla 63 kategorii robót elektrycznych. System automatycznie dobiera normę do nazwy pozycji — wystarczy wpisać np. \"Punkt gniazdka 230V\" a system przypisze właściwy KNR i obliczy rbh." },
      { type: "heading", text: "3. Stawka robocizny — różnice regionalne w 2026" },
      { type: "paragraph", text: "Stawka robocizny elektrycznej różni się istotnie w zależności od województwa. W 2026 roku rozpiętość między regionami sięga 40%. Mazowieckie i śląskie to najdroższe rynki, podkarpackie i świętokrzyskie — najtańsze." },
      { type: "list", items: [
        "Mazowieckie: 68–85 PLN/rbh",
        "Śląskie: 62–80 PLN/rbh",
        "Małopolskie: 58–72 PLN/rbh",
        "Wielkopolskie: 60–75 PLN/rbh",
        "Podkarpackie: 48–60 PLN/rbh",
      ]},
      { type: "heading", text: "4. VAT — 8% czy 23%?" },
      { type: "paragraph", text: "Stawka VAT na roboty elektryczne zależy od charakteru obiektu. Dla budownictwa mieszkaniowego (lokale do 300 m², domy do 300 m²) robocizna i materiały są opodatkowane stawką 8%. Dla obiektów komercyjnych, biurowych i przemysłowych obowiązuje stawka podstawowa 23%." },
      { type: "tip", text: "🔑 Złota zasada: zawsze zapytaj inwestora o przeznaczenie obiektu i sprawdź powierzchnię — to decyduje o stawce VAT i może zmienić kwotę netto o kilkanaście procent." },
      { type: "heading", text: "5. Narzuty — Kp, Z, Kz" },
      { type: "paragraph", text: "Kosztorys inwestorski sporządzony metodą KNR wymaga doliczenia narzutów: Kp (koszty pośrednie, typowo 50–70%), Z (zysk, typowo 8–15%), Kz (koszty zakupu materiałów, typowo 5–10%). W kosztorysach rynkowych narzuty wliczone są zazwyczaj już w stawkę robocizny." },
      { type: "heading", text: "Podsumowanie" },
      { type: "paragraph", text: "Profesjonalna wycena elektryczna to połączenie norm KNR, aktualnych stawek regionalnych i właściwego opodatkowania. Narzędzia takie jak ElektroSmart PRO automatyzują ten proces — od rozpoznania pozycji, przez wycenę, aż do eksportu gotowego PDF dla klienta." },
    ],
  },
  {
    slug: "vat-8-czy-23-przewodnik",
    title: "VAT 8% czy 23% na roboty elektryczne — praktyczny przewodnik dla elektryka",
    description:
      "Kiedy stosować VAT 8%, a kiedy 23% na usługi elektryczne? Kompletny przewodnik z przykładami: budownictwo mieszkaniowe, remonty, obiekty komercyjne.",
    date: "2026-01-10",
    readTime: 6,
    category: "Podatki i finanse",
    keywords: ["VAT elektryka", "VAT 8 procent instalacja elektryczna", "stawka VAT roboty budowlane", "kosztorys elektryczny VAT"],
    content: [
      { type: "paragraph", text: "Wybór właściwej stawki VAT to jedno z ważniejszych zagadnień dla elektryka prowadzącego działalność. Pomyłka może kosztować zarówno niedopłatę (ryzyko karno-skarbowe) jak i nadpłatę (utrata konkurencyjności). Oto kompletny przewodnik." },
      { type: "heading", text: "Kiedy VAT 8%?" },
      { type: "paragraph", text: "Obniżona stawka 8% dotyczy robót budowlano-montażowych w ramach budownictwa objętego społecznym programem mieszkaniowym (art. 41 ust. 12 ustawy o VAT). Obejmuje to:" },
      { type: "list", items: [
        "Lokale mieszkalne o powierzchni użytkowej do 300 m²",
        "Budynki mieszkalne jednorodzinne o powierzchni do 300 m²",
        "Remonty i modernizacje powyższych obiektów",
        "Instalacje elektryczne jako element robót budowlanych w w/w obiektach",
      ]},
      { type: "callout", text: "⚠️ Ważne: stawka 8% obejmuje CAŁOŚĆ usługi — zarówno robociznę, jak i wbudowane materiały, pod warunkiem że materiały stanowią element kompleksowej usługi budowlanej. Jeśli elektryki sprzedasz materiały osobno (bez montażu) — obowiązuje 23%." },
      { type: "heading", text: "Kiedy VAT 23%?" },
      { type: "list", items: [
        "Obiekty komercyjne, biurowe, przemysłowe",
        "Lokale usługowe",
        "Obiekty użyteczności publicznej (szkoły, szpitale)",
        "Budynki mieszkalne powyżej 300 m² (część ponad limit)",
        "Sprzedaż samych materiałów (bez usługi montażu)",
        "Dostawy kabli, rozdzielnic, osprzętu bez montażu",
      ]},
      { type: "heading", text: "Jak prawidłowo rozliczyć fakturę mieszaną?" },
      { type: "paragraph", text: "Jeśli realizujesz projekt łączący powierzchnię mieszkalną i użytkową (np. dom z garażem, parter usługowy), możesz proporcjonalnie podzielić wartość usługi. Dokumentuj to w kosztorysie — wyodrębniając część mieszkalną (8%) od komercyjnej (23%)." },
      { type: "tip", text: "💼 ElektroSmart PRO automatycznie obsługuje obie stawki VAT. Wystarczy ustawić typ obiektu w projekcie — system przeliczy kwoty brutto i netto dla obu stawek, co pojawi się czytelnie w PDF dla klienta." },
      { type: "heading", text: "Interpretacja indywidualna — kiedy warto?" },
      { type: "paragraph", text: "W przypadku wątpliwości (np. duże apartamenty, obiekty hotelowe, akademiki) warto wystąpić o interpretację indywidualną do Krajowej Informacji Skarbowej (KIS). Wniosek kosztuje 40 zł, a uzyskana interpretacja chroni przed odpowiedzialnością podatkową." },
    ],
  },
  {
    slug: "wspolpraca-zespolowa-real-time",
    title: "Współpraca zespołowa w czasie rzeczywistym — jak elektryczna firma działa efektywniej",
    description:
      "Jak wdrożyć współpracę zespołową w firmie elektrycznej: wspólne kosztorysy, podział ról, synchronizacja danych. Praktyczne wskazówki dla brygadzistów i właścicieli.",
    date: "2026-01-20",
    readTime: 5,
    category: "Zarządzanie firmą",
    keywords: ["współpraca zespołowa elektryka", "zarządzanie firmą elektryczną", "kosztorys online współpraca", "program dla firmy elektrycznej"],
    content: [
      { type: "paragraph", text: "Firmy elektryczne, które rosną powyżej 3–5 pracowników, szybko napotykają problem koordynacji. Kosztorysy w Excelu przesyłane mailem, brak jednego miejsca z aktualnymi cenami, różne wersje dokumentów u różnych osób — to klasyczne wąskie gardła. Jak je wyeliminować?" },
      { type: "heading", text: "Problem: silosy danych i duplikacja pracy" },
      { type: "paragraph", text: "Typowy scenariusz w firmie elektrycznej bez systemu: właściciel wycenia projekt w Excelu, majster wyjeżdża na budowę z wydrukowaną wersją sprzed tygodnia, a w tym czasie ceny materiałów wzrosły o 8%. Klient pyta o aktualną ofertę, właściciel tworzy trzecią wersję dokumentu..." },
      { type: "heading", text: "Rozwiązanie: jedno źródło prawdy w chmurze" },
      { type: "list", items: [
        "Wszystkie projekty dostępne z każdego urządzenia (laptop, tablet, telefon na budowie)",
        "Kosztorys aktualizuje się w czasie rzeczywistym — każda zmiana widoczna od razu",
        "Jeden link do portalu klienta — bez przesyłania plików emailem",
        "Historia zmian — wiadomo kto i kiedy zmienił cenę lub zakres",
        "Podział ról: właściciel widzi wszystkie projekty, majster — tylko swoje budowy",
      ]},
      { type: "callout", text: "📊 Według badań, firmy korzystające z systemów CRM/ERP oszczędzają średnio 4–6 godzin tygodniowo na koordynacji. Dla firmy elektrycznej z 5 pracownikami to ponad 100 godzin rocznie — czas na kilka dodatkowych wycen." },
      { type: "heading", text: "Jak wdrożyć współpracę krok po kroku" },
      { type: "list", items: [
        "Krok 1: Wybierz jedno narzędzie do kosztorysowania (nie Excel — za dużo ręcznej pracy)",
        "Krok 2: Zdefiniuj role — kto tworzy wyceny, kto je zatwierdza, kto wysyła do klienta",
        "Krok 3: Ustal szablon cennika (stawka r-g, narzut na materiały, narzut zysku)",
        "Krok 4: Przenieś historyczne projekty — nawet skrócone wersje, by mieć punkt odniesienia",
        "Krok 5: Zintegruj z fakturami — żeby nie przeklejać danych z kosztorysu do faktury",
      ]},
      { type: "tip", text: "🚀 ElektroSmart PRO obsługuje pracę zespołową — członkowie zespołu mają dostęp do wspólnego katalogu cen i projektów. Zmiany stawki regionalnej aktualizują wszystkie otwarte kosztorysy natychmiast." },
    ],
  },
  {
    slug: "co-pilot-audio-sterowanie-glosem",
    title: "AI Co-pilot w kosztorysowaniu — dyktowanie pozycji głosem na budowie",
    description:
      "Jak używać sterowania głosem do tworzenia kosztorysu elektrycznego bezpośrednio na budowie? AI Co-pilot w ElektroSmart PRO rozpoznaje pozycje z dyktowania i automatycznie wycenia.",
    date: "2026-01-28",
    readTime: 4,
    category: "Technologia AI",
    keywords: ["sterowanie głosem kosztorys", "AI elektryka", "dyktowanie kosztorysu", "program dla elektryka AI"],
    content: [
      { type: "paragraph", text: "Wyobraź sobie: stoisz na budowie, masz brudne ręce i nie możesz korzystać z klawiatury. Ale musisz zanotować zakres robót zanim zapomnisz. Teraz możesz po prostu powiedzieć co widzisz — AI zrobi resztę." },
      { type: "heading", text: "Jak działa dyktowanie pozycji kosztorysowych?" },
      { type: "paragraph", text: "Funkcja sterowania głosem w ElektroSmart PRO korzysta z silnika rozpoznawania mowy i modelu AI GPT-4o. Mówisz naturalnie, tak jak opisujesz pracę kolegom — system rozumie kontekst elektryczny i konwertuje wypowiedź na pozycje kosztorysowe." },
      { type: "list", items: [
        "Powiedz: \"Dwadzieścia punktów gniazdkowych na podtynku\" → system doda 20 szt. punktu gniazdkowego z normą KNR",
        "Powiedz: \"Sto metrów bieżących YDYp 3x2,5 w bruzdach\" → kabel + bruzdowanie automatycznie",
        "Powiedz: \"Rozdzielnica podtynkowa 24 moduły\" → pełny zestaw rozdzielnicy z komponentami",
        "Powiedz: \"Demontaż starej instalacji około 80 metrów\" → pozycja demontażu z właściwą normą",
      ]},
      { type: "callout", text: "🎙️ Tryb głosowy działa najlepiej przy użyciu słuchawek z mikrofonem. Na hałaśliwej budowie zalecamy dyktowanie z odległości 15–20 cm lub w chwili ciszy." },
      { type: "heading", text: "ES-Engine — kontekst elektryczny" },
      { type: "paragraph", text: "W odróżnieniu od ogólnych asystentów AI, ES-Engine zna specyfikę polskich norm KNR, katalog robót elektrycznych i regionalne stawki robocizny. Nie musisz mówić \"pozycja kosztorysowa numer\" — wystarczy naturalny opis pracy." },
      { type: "heading", text: "Kiedy to się opłaca?" },
      { type: "list", items: [
        "Inspekcja przed wyceną: notuj uwagi głosowo chodząc po mieszkaniu",
        "Aktualizacja zakresu na budowie: dodaj pozycje które wyszły w trakcie robót",
        "Szybkie wyceny telefoniczne: klient dzwoni i opisuje co potrzebuje — tworzysz kosztorys w czasie rozmowy",
        "Montaż odbiorczy: dyktuj listę wykonanych prac bezpośrednio do protokołu",
      ]},
      { type: "tip", text: "⚡ Połącz tryb głosowy z Quick Estimate — powiedz rodzaj i metraż obiektu, a AI wygeneruje kompletny szacunkowy kosztorys w 30 sekund." },
    ],
  },
  {
    slug: "automatyczne-faktury-infakt",
    title: "Automatyczne faktury z inFakt na podstawie kosztorysu elektrycznego",
    description:
      "Jak zintegrować kosztorys elektryczny z fakturą? Przepływ danych z ElektroSmart PRO do inFakt, Fakturowni lub iFirmy — bez przepisywania pozycji.",
    date: "2026-02-03",
    readTime: 5,
    category: "Finanse i fakturowanie",
    keywords: ["faktury elektryka", "kosztorys a faktura elektryczna", "inFakt elektryka", "fakturowanie usług elektrycznych"],
    content: [
      { type: "paragraph", text: "Jednym z największych marnotrawstw czasu w firmie elektrycznej jest przepisywanie pozycji z kosztorysu do faktury. Elektryk spędza 20–40 minut na każdej fakturze, ryzykując błędy przepisania. Automatyzacja tego procesu to łatwy zysk kilku godzin miesięcznie." },
      { type: "heading", text: "Problem: kosztorys ≠ faktura — jak to połączyć?" },
      { type: "paragraph", text: "Kosztorys elektryczny jest szczegółowy: zawiera dziesiątki pozycji z normami KNR, jednostkowym podziałem na robociznę i materiały. Faktura dla klienta powinna być prosta: kilka pozycji zbiorczych lub jedna \"usługa elektryczna\" z kwotą netto/brutto." },
      { type: "heading", text: "Dwa modele fakturowania usług elektrycznych" },
      { type: "list", items: [
        "Faktura zbiorcza: jedna pozycja \"Wykonanie instalacji elektrycznej\" z sumą z kosztorysu — prosto, transparentnie",
        "Faktura szczegółowa: osobno robocizna, osobno materiały — przydatne gdy klient chce kontrolować składowe",
        "Faktura etapowa: fakturowanie po zakończeniu każdego etapu robót (fundament, stan surowy, wykończenie)",
        "Faktura zaliczkowa + końcowa: typowe przy dużych kontraktach",
      ]},
      { type: "callout", text: "📋 ElektroSmart PRO eksportuje kosztorys w formacie PDF z podziałem na Robociznę i Materiał. Suma netto z kosztorysu to gotowa kwota do przepisania na fakturę — lub możesz użyć eksportu CSV do importu w programie fakturowym." },
      { type: "heading", text: "Integracja z popularnym oprogramowaniem fakturowym" },
      { type: "paragraph", text: "Większość polskich programów do fakturowania (inFakt, Fakturownia, iFirma, wFirma, Subiekt) obsługuje import pozycji z pliku CSV lub XLS. Workflow:" },
      { type: "list", items: [
        "Krok 1: Eksportuj kosztorys z ElektroSmart PRO do CSV/XLSX",
        "Krok 2: W programie fakturowym utwórz nową fakturę i zaimportuj pozycje",
        "Krok 3: Sprawdź kwoty (netto, VAT, brutto) — powinny się zgadzać z kosztorysem",
        "Krok 4: Wyślij do klienta lub zachowaj jako szkic do zatwierdzenia",
      ]},
      { type: "tip", text: "💡 Wskazówka dla profesjonalistów: w kosztorysie zaznacz \"Tylko robocizna\" jeśli klient dostarcza materiały — zafakturujesz wtedy wyłącznie usługę, bez komplikacji z magazynowaniem VAT na materiałach." },
    ],
  },
  {
    slug: "import-knr-excel-ai-lab",
    title: "Import KNR z Excela do kosztorysu — AI Lab w praktyce",
    description:
      "Jak zaimportować przedmiar robót z pliku Excel lub PDF do ElektroSmart PRO? AI Lab rozpoznaje pozycje i automatycznie przypisuje normy KNR i ceny regionalne.",
    date: "2026-02-05",
    readTime: 6,
    category: "Poradniki techniczne",
    keywords: ["import kosztorysu Excel", "KNR Excel import", "przedmiar robót Excel", "AI import kosztorysu elektrycznego"],
    content: [
      { type: "paragraph", text: "Jeśli otrzymujesz przedmiary robót od inwestorów lub projektantów w formacie Excel lub PDF, wiesz że ręczne przepisywanie do systemu kosztorysowego zajmuje godziny. AI Lab w ElektroSmart PRO eliminuje ten problem — wgraj plik, AI rozpoznaje pozycje i automatycznie przypisuje wyceny." },
      { type: "heading", text: "Jakie formaty obsługuje AI Lab?" },
      { type: "list", items: [
        "Excel (.xlsx, .xls) — klasyczne tabele przedmiarowe",
        "CSV — eksport z innych programów kosztorysowych (np. Norma PRO, Zuzia)",
        "PDF — skany lub PDFy z opisem zakresu robót",
        "Zdjęcia (JPG, PNG) — fotografowany formularz lub schemat jednokreskowy (tryb Vision)",
        "Tekst naturalny — skopiuj i wklej opis z maila od klienta",
      ]},
      { type: "heading", text: "Jak działa rozpoznawanie pozycji KNR?" },
      { type: "paragraph", text: "ES-Engine to silnik semantyczny przeszkolony na tysiącach polskich norm KNR i opisów robót elektrycznych. Gdy wgrasz Excel z kolumną \"Opis\" i kolumną \"Ilość\", AI:" },
      { type: "list", items: [
        "Rozpoznaje kategorię roboty (np. \"gniazdo podtynkowe\" → kategoria gniazda_wylaczniki)",
        "Dobiera właściwy KNR i normę rbh (np. KNR 5-04 0305)",
        "Pobiera aktualną cenę z Twojego regionu",
        "Tworzy gotową pozycję kosztorysową z podziałem Robocizna/Materiał",
        "Flaguje pozycje których nie rozpoznał — do ręcznej weryfikacji",
      ]},
      { type: "callout", text: "🧠 AI Lab osiąga ~85% trafności rozpoznawania typowych pozycji elektrycznych. Resztę (14 tysięcy i demontaże niestandardowe) oznacza do weryfikacji — co jest bezpieczniejsze niż bezkrytyczny automat." },
      { type: "heading", text: "Krok po kroku: import z Excela" },
      { type: "list", items: [
        "1. W projekcie kliknij przycisk \"Import AI\" (ikona Import w prawym górnym rogu)",
        "2. Wybierz plik Excel z przedmiarem robót",
        "3. Wskaż które kolumny to Nazwa, Ilość i Jednostka",
        "4. Kliknij \"Importuj\" — AI analizuje plik (10–30 sekund)",
        "5. Sprawdź wynik: zielone = rozpoznane, żółte = do weryfikacji",
        "6. Zatwierdź lub skoryguj pozycje z flagą",
      ]},
      { type: "tip", text: "⚡ Najlepsze wyniki dają pliki Excel z prostą strukturą: kolumna A = nazwa pozycji, kolumna B = ilość, kolumna C = jednostka. Unikaj scalonych komórek i kolorowania — AI preferuje czyste dane." },
    ],
  },
  {
    slug: "profesjonalny-kosztorys-pdf",
    title: "Profesjonalny kosztorys elektryczny w PDF — co powinien zawierać?",
    description:
      "Jak wygenerować profesjonalny kosztorys elektryczny w PDF dla klienta? Jakie elementy są obowiązkowe, jakie dodają wartość? Praktyczny checklist dla elektryka.",
    date: "2026-01-05",
    readTime: 5,
    category: "Dokumentacja",
    keywords: ["kosztorys elektryczny PDF", "profesjonalny kosztorys elektryczny", "szablon kosztorysu elektrycznego", "PDF kosztorys instalacji"],
    content: [
      { type: "paragraph", text: "Kosztorys to nie tylko lista robót z cenami — to wizytówka Twojej firmy. Profesjonalnie przygotowany dokument PDF przekonuje klienta do wyboru właśnie Ciebie, nawet jeśli cena jest nieco wyższa niż u konkurencji." },
      { type: "heading", text: "Obowiązkowe elementy kosztorysu elektrycznego" },
      { type: "list", items: [
        "Dane firmy: nazwa, NIP, adres, telefon, email — budują wiarygodność",
        "Dane klienta / inwestycji: adres budowy, imię i nazwisko zamawiającego",
        "Data sporządzenia i termin ważności oferty (zazwyczaj 30 dni)",
        "Wykaz robót z ilościami i jednostkami (szt., m.b., kpl.)",
        "Podział na Robociznę i Materiał — klient widzi za co płaci",
        "Kwota netto, VAT (8% lub 23%), kwota brutto",
        "Podpis lub pieczęć firmowa",
      ]},
      { type: "heading", text: "Elementy które wyróżniają Twoją ofertę" },
      { type: "list", items: [
        "Logo firmy na każdej stronie — profesjonalny branding",
        "Notatki do kosztorysu: warunki gwarancji, wyłączenia z zakresu, uwagi techniczne",
        "Podział na sekcje (np. Parter, Piętro, Garaż) — czytelność przy dużych projektach",
        "Portal klienta z linkiem — klient może zaakceptować ofertę online bez drukowania",
        "Kody KNR przy pozycjach — dla klientów znających branżę to dowód rzetelności",
      ]},
      { type: "callout", text: "📄 ElektroSmart PRO generuje kosztorys PDF z 5 szablonami graficznymi (Klasyczny, Elegancki, Nowoczesny, Korporacyjny, Premium). Każdy szablon zawiera logo firmy, colory marki i automatyczne numerowanie stron. Czas generowania: 10–15 sekund." },
      { type: "heading", text: "Kosztorys a umowa — co powinno się zgadzać?" },
      { type: "paragraph", text: "Kosztorys stanowi załącznik do umowy o roboty budowlane. Wartości w kosztorysie powinny być spójne z kwotą w umowie. Jeśli zakres prac się zmienia w trakcie realizacji — wystawiaj kosztorys uzupełniający (aneks) zamiast zmieniać oryginalny dokument." },
      { type: "heading", text: "Format cyfrowy vs. papierowy" },
      { type: "paragraph", text: "Coraz więcej inwestorów preferuje otrzymanie kosztorysu jako link do portalu online zamiast maila z PDF. Korzyści: klient może zaakceptować ofertę jednym kliknięciem, a elektryka otrzymuje powiadomienie w czasie rzeczywistym." },
      { type: "tip", text: "🔗 Portal Klienta w ElektroSmart PRO to unikalny link gdzie klient widzi kosztorys, może go zaakceptować lub odrzucić, a historia decyzji jest zapisywana. Bezpieczne i transparentne dla obu stron." },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
