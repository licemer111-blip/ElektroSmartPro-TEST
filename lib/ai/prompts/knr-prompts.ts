/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Prompts for KNR-based estimation: Generator, Assemblies, Importer,
 * Quick-Estimate.
 *
 * IMPORTANT: All KNR codes and labor norms MUST come from the single source
 * of truth: `knr-canonical-2026.ts`. Do NOT add KNR 5-04 codes here — they
 * are DEPRECATED. Use KNR 5-08 (2026) / 5-09 / 5-10 / 5-11 / 4-03.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import {
  KNR_CANONICAL_2026_COMPACT,
  KNR_CANONICAL_2026_IRON_RULES,
  KNR_CANONICAL_2026_ELEKTRYKA,
} from "./knr-canonical-2026";

export const GENERATOR_PROMPT = `<module_generator>
ZADANIE: Generowanie PROFESJONALNEGO kosztorysu z opisu projektu elektrycznego.

═══ ZASADY GENEROWANIA (KRYTYCZNE) ═══
1. KOMPLETNY kosztorys: materiały + robocizna jako OSOBNE pozycje (NIGDY łącznie).
2. POLSKIE NAZEWNICTWO TECHNICZNE: YDYp 3×2,5mm², nie "kabel 2.5".
3. Dopasuj do katalogu użytkownika jeśli dostępny.
4. Grupuj wg sekcji (Kuchnia, Łazienka, Salon, Garaż itp.) dla obiektów mieszkalnych.
5. Nie wymyślaj numeru tabeli. Jak nie znasz godziny normy ES, zostaw kod pusty.
6. Nie dopisuj pomiaru, bruzdy ani peszla, jeśli nie ma ich w opisie.
7. Nie podawaj cen. Robociznę liczy program: godziny normy ES × stawka elektryka. Materiał zostaje pusty.

═══ SPECYFIKA OBIEKTÓW ═══
MIESZKANIE (50-120m²): ~20-35 obwodów: 3-4 oświetlenie, 8-12 gniazd, 3-4 obwody siłowe (pralka, zmywarka, kuchenka), 1-2 łazienka IP44, 1-2 gniazda zewnętrzne.
DOM (120-300m²): ~40-70 obwodów + zasilanie 3-faz., rozdzielnica główna + lokalna, WLZ wewnętrzna, uziemienie, opcjonalnie EV/PV/pompa ciepła.
BIURO (100-500m²): Trasy kablowe, oświetlenie LED panel, gniazda biurowe + IT, UPS, LAN/IT, kontrola dostępu, CCTV, opcjonalnie DALI.
HALA PRZEMYSŁOWA: HighBay LED, gniazda CEE, trasy przemysłowe (drabinki/koryta), falowniki, CEE rozdzielnice, uziemienie przemysłowe.
PARKING: EV ładowarki, oświetlenie LED hermetyczne, detekcja CO, oświetlenie awaryjne, WLZ 3-faz., gniazda CEE serwisowe.
</module_generator>`;

export const ASSEMBLIES_PROMPT = `<module_assemblies>
ZADANIE: Lista prac, o które prosi elektryk. Jedna praca to jedna pozycja.
Nie dopisuj bruzdy, peszla, tulejek ani pomiaru, jeśli o nich nie napisał.
material_price = 0. labor_price = 0. Godzinę podaj tylko gdy znasz normę ES, inaczej zostaw pustą.
Nie podawaj cen hurtowych.

${KNR_CANONICAL_2026_COMPACT}
</module_assemblies>`;

export const IMPORTER_PROMPT = `<module_importer>
ZADANIE: Parsowanie dokumentów technicznych (kosztorysy, KNR, przedmiary, faktury, cenniki).
Jesteś ekspertem ds. polskiej dokumentacji technicznej elektrycznej. Obsługujesz WSZYSTKIE formaty.

═══ TYPY DOKUMENTÓW ═══
A) KOSZTORYS / PRZEDMIAR ROBÓT:
   - Tabela z kolumnami: Lp | Opis pozycji | Jedn. | Ilość | Cena jedn. | Wartość
   - Zachowaj podział materiał/robocizna jeśli widoczny
   - Sumuj sekcje, nie powielaj nagłówków sekcji jako pozycje

B) DOKUMENT Z KODAMI:
   - Zostaw kod tak, jak jest napisany w pliku. Nie przepisuj serii 5-04 na inną.

C) FAKTURA VAT / PARAGON:
   - Odczytaj: Nazwa towaru/usługi | Ilość | JM | Cena netto | Wartość netto
   - Jeśli to materiał elektryczny → material_price
   - Jeśli to usługa/montaż → labor_price
   - Rozróżnij materiał od robocizny po nazwie

D) CENNIK / KATALOG MATERIAŁÓW:
   - Pozycja | JM | Cena netto
   - Każda pozycja = osobna linia wynikowa
   - material_price = cena z cennika, labor_price = 0 (materiał bez montażu)

E) EXCEL/CSV:
   - Auto-detect kolumn: Nazwa/Opis/Pozycja = name
   - Ilość/Qty/Ilosc = quantity | JM/Unit = unit
   - Cena mat./Material = material_price | Cena rob./Labor = labor_price
   - Wartość/Kwota = jeśli brak rozdziału M/L → przypisz do material_price

F) FORMULARZ / SPECYFIKACJA TECHNICZNA:
   - Lista materiałów z ilościami
   - Dopasuj do standardowego nazewnictwa polskiej elektrotechniki

═══ REGUŁY WYODRĘBNIANIA ═══
1. DOPASOWANIE DO KATALOGU: Sprawdź czy pozycja pasuje do katalogu — użyj DOKŁADNIE tej samej nazwy
2. POLSKIE NAZWY TECHNICZNE: YDYp 3×2,5mm² (nie "kabel 2.5"), MCB B16 1P (nie "bezpiecznik")
3. JEDNOSTKI POLSKIE: szt, m, kpl, m², rbh (nie "pcs", "mb→m", "set")
4. ILOŚCI: Z dokumentu. Jeśli brak → 1
5. GRUPOWANIE: Łącz identyczne pozycje, sumuj ilości
6. NIE wymyślaj pozycji których nie ma w dokumencie
7. WSZYSTKIE WIERSZE: Przetwórz do 300+ pozycji bez skracania
8. Cenę z pliku zachowaj. Jak w pliku ceny nie ma, zostaw 0. Nie dopisuj cennika hurtowego.
</module_importer>`;

export const QUICK_ESTIMATE_PROMPT = `<module_quick_estimate>
ZADANIE: Generowanie PROFESJONALNEGO kosztorysu dla całego obiektu na podstawie jego opisu.

═══ ZASADY GENEROWANIA ═══
1. KOMPLETNY kosztorys: materiały + robocizna OSOBNO dla każdej pozycji
2. Tylko prace, które wynikają z opisu. Nie dopisuj protokołu odbioru.
3. Nie wymyślaj numeru tabeli. Jak nie znasz godziny, zostaw kod pusty.
4. Nie podawaj cen. Materiał 0, robocizna 0. Program policzy godziny stawką elektryka.
5. Nie mnoż cen przez „ekonomiczny / premium”.
6. VAT (informacyjnie, nie w cenach): 8% dla mieszkalnych, 23% dla komercyjnych/B2B
7. Ilości REALISTYCZNE wyliczone z pow. m² i liczby pomieszczeń

${KNR_CANONICAL_2026_IRON_RULES}

${KNR_CANONICAL_2026_ELEKTRYKA}

═══ PORADNIK ILOŚCI WG TYPÓW OBIEKTÓW ═══

MIESZKANIE W BLOKU (na 10m²):
- Kabel YDYp 3×1,5mm² (oświetlenie): 15m/10m²
- Kabel YDYp 3×2,5mm² (gniazda): 25m/10m²
- Gniazda 230V: 2-3 szt/pomieszczenie (kuchnia: 6-8, łazienka: 1 IP44)
- Wyłączniki: 1-2 szt/pomieszczenie
- Obwody razem: 1 obwód oświetleniowy/pokój + 2 gniazdkowe/pokój + siłowe
- Rozdzielnica: 24-36 mod. dla mieszkania ≤80m², 36-48 mod. dla ≤120m²
- Bruzdy: 0,8 m/m² (instalacja podtynkowa)

DOM JEDNORODZINNY (na 100m²):
- Rozdzielnica główna 3-faz. 72-96 mod. + rozdzielnica lokalna 24 mod.
- WLZ YKXs 5×10mm² (dom ≤100m²) lub 5×16mm² (≤200m²)
- Kabel ogółem: 8-12 m/m² całości kabli (wszystkie typy)
- Obwody: 40-60 dla domu 150m²
- Gniazda: ok. 2,5 szt/m² rzutu × ilość pomieszczeń
- Oświetlenie: 1 oprawa na 4-6m²
- Uziemienie: uziom poziomy + instalacja odgromowa (120-180m taśmy FeZn)
- Zewnętrzne: 2-4 gniazda IP44 zewn., 2-4 naświetlacze LED

BIURO (na 100m²):
- Oświetlenie: 1 panel LED 60×60 na 6m² = ~17 opraw/100m²
- Gniazda biurowe: 4-6 szt na stanowisko (3 stanowiska/10m²)
- Floorboxy: 1 na 15m² (open space)
- Punkty RJ45: 2 na stanowisko + sieć szkieletowa
- Access point WiFi: 1 na 100m²
- Rozdzielnica główna + UPS (1-3kVA)
- Kontrola dostępu: 1 czytnik na wejście
- Oświetlenie awaryjne: 1 oprawa na 15m trasy ewakuacyjnej

HALA PRZEMYSŁOWA / MAGAZYN (na 1000m²):
- HighBay LED 150W: 1 na 30-40m² (wys. 6-8m)
- HighBay LED 300W: 1 na 50-60m² (wys. >8m)
- Gniazda CEE 32A/5P: 1 na 50-60m²
- Gniazda CEE 63A/5P: wg potrzeb maszyn
- Drabinki kablowe 200mm: 0,3 m/m² hali
- Kable YKXs 5×10-35mm² (zasilanie maszyn)
- Rozdzielnica główna RGnn (MCCB 250-630A) + tablice oddział.
- Uziemienie przemysłowe: szyny Cu 30×5mm + uziom otokowy

PARKING PODZIEMNY (na 500m²):
- Oświetlenie hermetyczne LED 36W: 1 na 20m²
- Oświetlenie awaryjne IP65: 1 na 20m trasy ewakuac.
- Ładowarki EV 22kW/3P: wg projektu (1 na 4 miejsca parkingowe)
- Detekcja CO/LPG: 1 czujnik na 300m²
- Gniazda CEE 16A (serwisowe): 1 na 200m²
- Zasilanie 3-faz. główne: WLZ YAKY 4×95-185mm² (alu)
- Kamera CCTV: 1 na wjazd + narożniki

SKLEP / LOKAL HANDLOWY (na 100m²):
- Oświetlenie LED track/szynoprzewód: 1 oprawa 30W na 4m²
- Gniazda 230V (kasa, urządzenia): 2-3 na stanowisko
- Sieć LAN Cat6: 1 punkt na kasę + zaplecze
- Alarm SSWiN: czujki PIR + centrala + kamera CCTV wjazd
- Gniazdo CEE 32A (neonówki/reklamy zewn.): 1-2 szt
- Oświetlenie witryny: LED 3000K warmwhite

HOTEL / PENSJONAT (za pokój):
- 1 pokój standard: gniazda × 4 (2+2USB), oświetlenie × 3 punkty, TV+LAN, klimatyzacja 3-5kW
- Korytarz: 1 oprawa LED na 5m, oświetlenie awaryjne 1 na 20m
- RCU/KNX (option): sterownik pokojowy, termostaty, magistrala KNX
- SSP: 1 czujka dymu adresowalna na pokój + ROP przy wyjściach
- Rozdzielnica piętrowa: 36-48 mod. na piętro (10-12 pokoi)

SZKOŁA / PLACÓWKA EDUKACYJNA (za salę lekcyjną ~60m²):
- Oświetlenie LED: 8-10 opraw LED panel + sterowanie (DALI lub łącznikowe)
- Tablice interaktywne: dedykowany obwód 230V C16 + UPS (jeśli wymagany)
- Gniazda nauczycielskie: 4 szt (2 biurkowe + 2 ścienne) + 1 floorbox
- Gniazda uczniowskie: 2 na rząd ławek (8-12 szt/sala)
- Sieć LAN Cat6: 1 punkt na 2 uczniów + 2 nauczycielskie + AP WiFi
- Oświetlenie awaryjne: 1 EXIT + 2 antypaniczne na salę

SERWEROWNIA / POMIESZCZENIE IT (na 20m²):
- Oświetlenie LED hermetyczne IP65: 4-6 opraw
- Zasilanie rack szafy: 2× UPS 3-10kVA + PDU (listwy zasilające)
- Klimatyzacja precyzyjna 5-10kW (kabel 5×4mm², dedykowany obwód)
- Szafa RACK 19" 42U: 1-2 szt + patch panele
- Kable UTP Cat6A: 2 m/port (100-200 portów dla 20m²)
- Monitoring: temp/wilg, wykrywacz zalania, UPS monitoring
- Kontrola dostępu: 2-factor (czytnik + PIN lub biometryczny)
- Uziemienie IT: szyna uziemiająca Cu + wyrównanie potencjałów

═══ SPECYFIKA WYCENY WG STANDARDU ═══
EKONOMICZNY: Osprzęt Ospel/Schneider Acti9, kable polskie (KWP/TeleFonika), brak opcji
STANDARD: Osprzęt Legrand Niloe/Valena, kable Nexans/Helukabel, podstawowe LAN + alarm
PREMIUM: Osprzęt Legrand Mosaic/Vimar, kable OBO/Legrand, KNX/DALI, PV + EV + smart home
</module_quick_estimate>`;
