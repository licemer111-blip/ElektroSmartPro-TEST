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
  KNR_CANONICAL_2026_FULL,
  KNR_CANONICAL_2026_COMPACT,
  KNR_CANONICAL_2026_IRON_RULES,
  KNR_CANONICAL_2026_ELEKTRYKA,
  KNR_CANONICAL_2026_MATERIAL_PRICES,
} from "./knr-canonical-2026";

export const GENERATOR_PROMPT = `<module_generator>
ZADANIE: Generowanie PROFESJONALNEGO kosztorysu z opisu projektu elektrycznego.

═══ ZASADY GENEROWANIA (KRYTYCZNE) ═══
1. KOMPLETNY kosztorys: materiały + robocizna jako OSOBNE pozycje (NIGDY łącznie).
2. POLSKIE NAZEWNICTWO TECHNICZNE: YDYp 3×2,5mm², nie "kabel 2.5".
3. Dopasuj do katalogu użytkownika jeśli dostępny.
4. Grupuj wg sekcji (Kuchnia, Łazienka, Salon, Garaż itp.) dla obiektów mieszkalnych.
5. KAŻDA robocizna → kod KNR obowiązkowy. Brak pewności → null + isEstimate=true (silnik znajdzie po nazwie).
6. ZAWSZE końcowa pozycja: "Pomiary i odbiory — protokół komplet" (KNR 5-08 9999).
7. Ceny NETTO PLN 2026 wg SEKOCENBUD Q1/2026 / Elektroskandia / TIM SA / Grodno.

${KNR_CANONICAL_2026_FULL}

═══ ZASADA KOMPLETNOŚCI KAŻDEGO OBWODU (Doktryna 360°) ═══
Dla każdego obwodu elektrycznego ZAWSZE generuj:
1. Materiał kablowy (typ + m) → cena materiału (PLN/m)
2. Osprzęt końcowy (gniazdo/wyłącznik/oprawa) → cena materiału (PLN/szt)
3. Robocizna układanie kabla (KNR 5-08 02xx) → cena robocizny
4. Robocizna montaż osprzętu (KNR 5-08 04xx lub 05xx) → cena robocizny
5. Kucie bruzdy (KNR 5-08 0101) → dla instalacji p/t (podtynkowych)
6. Puszka instalacyjna p/t (KNR 5-08 0301) → dla każdego punktu p/t
7. Pomiary i odbiory (KNR 5-08 9101-9104, 9999) → ZAWSZE na końcu

═══ SPECYFIKA OBIEKTÓW ═══
MIESZKANIE (50-120m²): ~20-35 obwodów: 3-4 oświetlenie, 8-12 gniazd, 3-4 obwody siłowe (pralka, zmywarka, kuchenka), 1-2 łazienka IP44, 1-2 gniazda zewnętrzne.
DOM (120-300m²): ~40-70 obwodów + zasilanie 3-faz., rozdzielnica główna + lokalna, WLZ wewnętrzna, uziemienie, opcjonalnie EV/PV/pompa ciepła.
BIURO (100-500m²): Trasy kablowe, oświetlenie LED panel, gniazda biurowe + IT, UPS, LAN/IT, kontrola dostępu, CCTV, opcjonalnie DALI.
HALA PRZEMYSŁOWA: HighBay LED, gniazda CEE, trasy przemysłowe (drabinki/koryta), falowniki, CEE rozdzielnice, uziemienie przemysłowe.
PARKING: EV ładowarki, oświetlenie LED hermetyczne, detekcja CO, oświetlenie awaryjne, WLZ 3-faz., gniazda CEE serwisowe.
</module_generator>`;

export const ASSEMBLIES_PROMPT = `<module_assemblies>
ZADANIE: Generowanie zestawów 360° (punktów elektrycznych) wg standardu ElektroSmart PRO.
Każdy Zestaw = KOMPLET materiałów + robocizna. Doktryna 360° (Iron Rule 6) — BEZWZGLĘDNA.

═══ OBOWIĄZKOWE ELEMENTY KAŻDEGO ZESTAWU ═══
1. URZĄDZENIE (type="material"): gniazdo/wyłącznik/czujnik/oprawa — cena materiału
2. PUSZKA (type="material"): puszka p/t 60mm + pokrywa/ramka (dla p/t) lub puszka n/t
3. PRZEWÓD (type="material"): YDYp 3×2,5mm² (gniazda 16A), YDYp 3×1,5mm² (oświetlenie/łączniki),
   YDYp 5×4mm² (obwody siłowe), J-Y(St)Y 2×2×0,8 (sygnał KNX/BMS). Ilość w m od tablicy (min. 5m).
4. BRUZDOWANIE (type="labor"): użyj kodu wg materiału ściany — cegła KNR 5-08 0101, beton KNR 5-08 0101b, żelbet KNR 5-08 0101z, ytong KNR 5-08 0101g, GK KNR 5-08 0101k.
5. UKŁADANIE KABLA (type="labor"): KNR 5-08 0201 (3×1,5) lub 0202 (3×2,5) — norma 0,13-0,16 rbh/m.
6. MONTAŻ PUSZKI (type="labor"): KNR 5-08 0301 — norma 0,12 rbh/szt.
7. MONTAŻ OSPRZĘTU (type="labor"): KNR 5-08 0401 (gniazdo pojedyncze), 0402 (podwójne), 0405 (IP44), 0501 (łącznik) — normy 0,45-0,98 rbh/szt.
8. POMIARY ODBIORCZE (type="labor"): KNR 5-08 9101 (izolacja) + 9102 (PE) + 9103 (pętla zw.) — łącznie ≈0,60 rbh/obwód.

${KNR_CANONICAL_2026_COMPACT}

═══ TYPY ZESTAWÓW I CENY 2026 (netto, stawka bazowa 95 PLN/rbh) ═══

ZESTAW: GNIAZDKO 230V PODTYNKOWE (standard):
- Gniazdo 230V p/t Schuko (Legrand/Ospel): 22,00 PLN
- Ramka pojedyncza: 8,00 PLN + Puszka p/t 60mm: 3,00 PLN
- Kabel YDYp 3×2,5 mm² (8m od tablicy): 7,20 PLN/m = 57,60 PLN
- Bruzda 8m × 0,85 rbh/m (cegła): 6,80 rbh (KNR 5-08 0101)
- Układanie kabla 8m × 0,16 rbh/m: 1,28 rbh (KNR 5-08 0202)
- Montaż puszki: 0,12 rbh (KNR 5-08 0301)
- Montaż gniazda: 0,68 rbh (KNR 5-08 0401)
- Pomiary: 0,60 rbh/obwód (KNR 5-08 9101-9104)
→ RAZEM LABOR: ≈9,48 rbh × stawka regionalna

ZESTAW: GNIAZDKO PODWÓJNE:
- Gniazdo podwójne p/t (2×230V): 30,00 PLN + ramka 10,00 PLN + puszka 3,00 PLN
- Kabel YDYp 3×2,5 mm² (10m): 72,00 PLN
- Labor: bruzda 8,50 rbh (KNR 5-08 0101) + układanie 1,60 rbh (KNR 5-08 0202) + puszka 0,12 rbh + gniazdo 0,82 rbh (KNR 5-08 0402) + pomiary 0,60 rbh

ZESTAW: WYŁĄCZNIK / ŁĄCZNIK:
- Wyłącznik 1-klaw. p/t: 14,00 PLN + ramka 8,00 PLN + puszka 3,00 PLN
- Kabel YDYp 3×1,5 mm² (6m): 31,20 PLN
- Labor: bruzda 5,10 rbh (KNR 5-08 0101) + układanie 0,78 rbh (KNR 5-08 0201) + puszka 0,12 rbh + łącznik 0,45 rbh (KNR 5-08 0501) + pomiary 0,60 rbh

ZESTAW: WYŁĄCZNIK SCHODOWY (trójnik):
- Wyłącznik schodowy × 2 szt: 36,00 PLN + 2 puszki + 2 ramki
- Kabel YDYp 3×1,5 mm² (10m) + 3-żyłowy dodatkowy (10m)
- Labor: bruzda + układanie + 2× montaż łącznika (2×0,50 rbh KNR 5-08 0504) + pomiary

ZESTAW: GNIAZDO HERMETYCZNE IP44 (łazienka/pralnia/zewnętrzne):
- Gniazdo IP44 n/t lub p/t: 35,00 PLN (puszka wbudowana w n/t)
- Kabel YDYp 3×2,5 mm² (8m): 57,60 PLN
- Labor: bruzda 6,80 rbh + układanie 1,28 rbh + gniazdo 0,98 rbh (KNR 5-08 0405) + pomiary 0,60 rbh

ZESTAW: PUNKT RJ45 CAT6 (sieć LAN):
- Gniazdo RJ45 keystone Cat6 podwójne: 36,00 PLN + puszka/ramka: 11,00 PLN
- Kabel UTP Cat6 (15m od patch panelu): 2,20 PLN/m = 33,00 PLN
- Labor: kucie/trasa (wg surface) + układanie 1,20 rbh (KNR 5-09 0101) + gniazdo 0,50 rbh (KNR 5-09 0106) + konfiguracja 0,20 rbh

ZESTAW: PUNKT TV/SAT (RG6 koaks.):
- Gniazdo TV-SAT keystone: 28,00 PLN + puszka + ramka
- Kabel RG6 (15m): 2,80 PLN/m = 42,00 PLN
- Labor: ułożenie kabla + montaż gniazda + konfiguracja

ZESTAW: PUNKT KNX / BUS:
- Gniazdo BUS / przycisk KNX 4-klaw.: 110,00 PLN + puszka KNX + ramka
- Kabel magistrali KNX TP (10m): 35,00 PLN + zasilający YDYp 3×1,5 (8m): 41,60 PLN
- Labor: ułożenie 0,70 rbh (KNR 5-09 0703) + montaż 0,80 rbh + programowanie 0,50 rbh + pomiary 0,60 rbh

ZESTAW: GNIAZDO PRZEMYSŁOWE CEE 16A/5P:
- Gniazdo CEE 16A/5P: 65,00 PLN
- Kabel YDYp 5×2,5 mm² (10m): 105,00 PLN
- Labor: trasa 1,80 rbh + układanie 1,80 rbh + gniazdo 0,50 rbh (KNR 5-10 0602) + pomiary 0,60 rbh

ZESTAW: OPRAWA LED DOWNLIGHT (punkt oświetleniowy sufit):
- Oprawa LED downlight 12W p/t: 45,00 PLN
- Kabel YDYp 3×1,5 mm² (5m): 26,00 PLN
- Puszka łączeniowa p/t: 3,00 PLN
- Labor: bruzda 4,25 rbh + układanie 0,65 rbh (KNR 5-08 0201) + puszka 0,12 rbh + oprawa 0,31 rbh (KNR 5-08 0502, × 1,25 gdy sufit wysoki) + pomiary 0,60 rbh

ZESTAW: OPRAWA AWARYJNA EXIT:
- Oprawa EXIT LED 3h: 110,00 PLN
- Kabel NHXMH 3×1,5 mm² bezhalogenowy (8m): 7,50 PLN/m = 60,00 PLN
- Labor: ułożenie NHXMH 0,72 rbh (KNR 5-08 0301B) + montaż oprawy 0,45 rbh (KNR 5-08 0802o) + test 0,20 rbh

ZESTAW: CZUJKA DYMU SSP ADRESOWALNA:
- Czujka dymu adresowalna + podstawa: 110,00 PLN
- Kabel HDGs 2×1,0 mm² (15m): 4,50 PLN/m = 67,50 PLN
- Labor: ułożenie HDGs 1,20 rbh (KNR 5-06 0605) + montaż czujki 0,40 rbh (KNR 5-06 0612) + adresowanie 0,20 rbh
- Mnożnik RBH ×1,35 (specjalista SEP z uprawnieniami SSP)

ZESTAW: PUNKT DALI (oprawa sterowalna):
- Oprawa LED DALI dimmable: 220,00 PLN
- Kabel zasilający YDYp 3×2,5 (8m) + magistrala DALI J-Y(St)Y (8m)
- Labor: ułożenie kabli + montaż oprawy + adresowanie DALI

Ceny NETTO PLN 2026. SPLIT: unit_material_price i unit_labor_price ZAWSZE OSOBNO.
</module_assemblies>`;

export const IMPORTER_PROMPT = `<module_importer>
ZADANIE: Parsowanie dokumentów technicznych (kosztorysy, KNR, przedmiary, faktury, cenniki).
Jesteś ekspertem ds. polskiej dokumentacji technicznej elektrycznej. Obsługujesz WSZYSTKIE formaty.

═══ TYPY DOKUMENTÓW ═══
A) KOSZTORYS / PRZEDMIAR ROBÓT:
   - Tabela z kolumnami: Lp | Opis pozycji | Jedn. | Ilość | Cena jedn. | Wartość
   - Zachowaj podział materiał/robocizna jeśli widoczny
   - Sumuj sekcje, nie powielaj nagłówków sekcji jako pozycje

B) DOKUMENT KNR (Katalog Nakładów Rzeczowych):
   - Format: KOD KNR | OPIS PRACY | JEDNOSTKA | NAKŁAD rbh
   - TRANSLACJA kodów starych → nowych (JEŚLI w dokumencie widzisz serię 5-04, MUSISZ przepisać na serię 5-08 2026 w polu knr_code, a w polu description zachować oryginalny opis):
     KNR 5-04 0101-01 (YDYp 3×1,5) → KNR 5-08 0201
     KNR 5-04 0101-02 (YDYp 3×2,5) → KNR 5-08 0202
     KNR 5-04 0201-01 (gniazdo pojedyncze) → KNR 5-08 0401
     KNR 5-04 0201-03 (gniazdo podwójne) → KNR 5-08 0402
     KNR 5-04 0201-04 (gniazdo IP44) → KNR 5-08 0405
     KNR 5-04 0201-06 (wyłącznik 1-klaw.) → KNR 5-08 0501
     KNR 5-04 0301-02 (downlight LED) → KNR 5-08 0502
     KNR 5-04 0401-01 (puszka p/t) → KNR 5-08 0301
     KNR 5-04 0501-01 (bruzda cegła) → KNR 5-08 0101
     KNR 5-04 0901-01 (pomiary) → KNR 5-08 9101
     KNR 5-04 0901-04 (protokół) → KNR 5-08 9999
   - Nowa seria 5-08 i KNR 5-09/5-10/5-11/4-03 — zachowaj BEZ ZMIAN.

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

${KNR_CANONICAL_2026_MATERIAL_PRICES}
</module_importer>`;

export const QUICK_ESTIMATE_PROMPT = `<module_quick_estimate>
ZADANIE: Generowanie PROFESJONALNEGO kosztorysu dla całego obiektu na podstawie jego opisu.

═══ ZASADY GENEROWANIA ═══
1. KOMPLETNY kosztorys: materiały + robocizna OSOBNO dla każdej pozycji
2. ZAWSZE uwzględnij: instalację el., oświetlenie, rozdzielnicę, pomiary odbiorcze
3. KAŻDA robocizna: kod KNR obowiązkowy. Jeśli brak pewności → null (silnik znajdzie po nazwie)
4. OSTATNIA POZYCJA: "Pomiary i odbiory — protokół komplet" (KNR 5-08 9999)
5. Ceny NETTO PLN 2026: ekonomiczny=tańsze materiały, standard=+30%mat/+15%rob, premium=+80%mat/+35%rob
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
