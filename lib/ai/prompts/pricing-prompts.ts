export const PRICING_PROMPT = `<module_pricing>
ZADANIE: Wycena rozdzielnicy elektrycznej wg ES-KNR 2026.

REGUŁY:
- unitMaterial = cena 1 szt. materiału (PLN netto bez montażu)
- unitLabor = koszt montażu 1 szt. wg KNR (rbh × stawka_regionalna)
- grandTotal = grandTotalMaterial + grandTotalLabor (ZAWSZE sprawdzaj!)
- Kod KNR dla każdej pozycji: KNR 5-08 0401-xx lub "szacunek"
- Zastosuj współczynnik regionalny TYLKO do robocizny

CENNIK APARATURY ROZDZIELNIC (NETTO PLN 2026):
ZABEZPIECZENIA:
• MCB B06/1P:  14,00 PLN  | montaż: 0,20 rbh (KNR 5-08 0401-01)
• MCB B10/1P:  15,00 PLN  | montaż: 0,20 rbh
• MCB B16/1P:  18,00 PLN  | montaż: 0,20 rbh
• MCB B20/1P:  20,00 PLN  | montaż: 0,20 rbh
• MCB B25/1P:  22,00 PLN  | montaż: 0,20 rbh
• MCB B32/1P:  25,00 PLN  | montaż: 0,20 rbh
• MCB C10/1P:  18,00 PLN  | montaż: 0,20 rbh
• MCB C16/1P:  20,00 PLN  | montaż: 0,20 rbh
• MCB C20/1P:  22,00 PLN  | montaż: 0,20 rbh
• MCB C25/1P:  24,00 PLN  | montaż: 0,20 rbh
• MCB C32/1P:  27,00 PLN  | montaż: 0,20 rbh
• MCB C40/1P:  32,00 PLN  | montaż: 0,20 rbh
• MCB B16/3P:  52,00 PLN  | montaż: 0,30 rbh (KNR 5-08 0401-02)
• MCB C16/3P:  55,00 PLN  | montaż: 0,30 rbh
• MCB C20/3P:  58,00 PLN  | montaż: 0,30 rbh
• MCB C25/3P:  62,00 PLN  | montaż: 0,30 rbh
• MCB C32/3P:  70,00 PLN  | montaż: 0,30 rbh
• MCB C40/3P:  78,00 PLN  | montaż: 0,30 rbh
• MCB C63/3P:  95,00 PLN  | montaż: 0,35 rbh
• MCCB 3P 100A: 320,00 PLN | montaż: 1,50 rbh
• MCCB 3P 160A: 520,00 PLN | montaż: 1,80 rbh
• MCCB 3P 250A: 850,00 PLN | montaż: 2,00 rbh
• MCCB 3P 400A: 2800,00 PLN | montaż: 2,50 rbh
• MCCB 3P 630A: 5500,00 PLN | montaż: 3,00 rbh
• ACB 3P 800A: 12000,00 PLN | montaż: 4,00 rbh
• ACB 3P 1600A: 22000,00 PLN | montaż: 5,50 rbh
• MCB D 1P: 24,00 PLN | montaż: 0,15 rbh (charakterystyka D — silniki/transformatory)
• MCB D 3P: 65,00 PLN | montaż: 0,25 rbh
• RCBO C 100mA 1P: 92,00 PLN | montaż: 0,20 rbh (ochrona ppoż.)
• RCBO C 30mA typ F: 145,00 PLN | montaż: 0,20 rbh (do obwodów VFD)
OCHRONA RÓŻNICOWA:
• RCD 40A/30mA/2P typ A:   95,00 PLN | montaż: 0,25 rbh (KNR 5-08 0401-09)
• RCD 63A/30mA/2P typ A:  110,00 PLN | montaż: 0,25 rbh
• RCD 40A/30mA/4P typ A:  165,00 PLN | montaż: 0,35 rbh (KNR 5-08 0401-10)
• RCD 63A/30mA/4P typ A:  180,00 PLN | montaż: 0,35 rbh
• RCD 63A/300mA/4P (p.poż.): 185,00 PLN | montaż: 0,35 rbh
• RCBO C16/30mA/1P:       65,00 PLN  | montaż: 0,30 rbh (KNR 5-08 0401-15)
• RCBO C20/30mA/1P:       70,00 PLN  | montaż: 0,30 rbh
• RCBO C25/30mA/1P:       75,00 PLN  | montaż: 0,30 rbh
OCHRONA PRZEPIĘCIOWA:
• SPD T1+T2 1-faz.:       180,00 PLN | montaż: 0,50 rbh (KNR 5-08 0402-01)
• SPD T2 3-faz. 4P:       250,00 PLN | montaż: 0,60 rbh (KNR 5-08 0402-02)
• SPD T3 1-faz.:          120,00 PLN | montaż: 0,40 rbh
ROZŁĄCZNIKI I WYŁĄCZNIKI:
• Rozłącznik główny 3P 63A:  90,00 PLN | montaż: 0,60 rbh (KNR 5-08 0403-01)
• Rozłącznik główny 3P 100A: 150,00 PLN | montaż: 0,80 rbh
• Rozłącznik główny 3P 125A: 190,00 PLN | montaż: 1,00 rbh
• Przetwornik ATS 3P 63A:    350,00 PLN | montaż: 1,50 rbh
STEROWANIE I POMIAR:
• Licznik energii 1-faz.:   120,00 PLN | montaż: 1,00 rbh (KNR 5-08 0501-01)
• Licznik energii 3-faz.:   180,00 PLN | montaż: 1,20 rbh (KNR 5-08 0501-02)
• Przekaźnik faz 3P:         85,00 PLN | montaż: 0,50 rbh
• Lampka sygnalizacyjna:      8,00 PLN | montaż: 0,15 rbh
• Przekaźnik bistabilny:     45,00 PLN | montaż: 0,30 rbh
• Programator astronomiczny: 125,00 PLN | montaż: 0,50 rbh
• Automat schodowy:          55,00 PLN | montaż: 0,30 rbh
• Kontaktron magistralny KNX: 180,00 PLN | montaż: 1,00 rbh
OBUDOWY (materiał + montaż):
• Obudowa 12-mod. n/t:      65,00 PLN  | montaż: 1,5 rbh
• Obudowa 24-mod. n/t:     120,00 PLN  | montaż: 2,0 rbh (KNR 5-08 0101-01)
• Obudowa 36-mod. n/t:     160,00 PLN  | montaż: 2,5 rbh
• Obudowa 48-mod. p/t:     200,00 PLN  | montaż: 3,0 rbh (KNR 5-08 0101-02)
• Obudowa 72-mod. p/t:     320,00 PLN  | montaż: 4,0 rbh (KNR 5-08 0101-03)
• Obudowa 96-mod.:         420,00 PLN  | montaż: 5,0 rbh
• Obudowa 144-mod. metall.: 680,00 PLN  | montaż: 7,0 rbh
MATERIAŁY POMOCNICZE:
• Szyna TH35 DIN 1mb:       8,00 PLN  | montaż: 0,05 rbh/mb
• Listwa ZUG 2,5mm² szt:    3,50 PLN  | montaż: 0,10 rbh/szt
• Koryto kablowe w sza. mb:  8,00 PLN  | montaż: 0,15 rbh/mb
• Końcówka tulejkowa 100szt: 25,00 PLN | montaż: 0,30 rbh/kpl
• Oznacznik przewodów kpl:   15,00 PLN | montaż: 0,20 rbh/kpl
</module_pricing>`;

export const ESTIMATOR_PROMPT = `<module_estimator>
ZADANIE: Wyszukanie nakładu robocizny wg KNR dla podanego zadania elektrycznego.

⛔ ŻELAZNA ZASADA — ZAKAZ STAWEK DOMYŚLNYCH:
NIGDY nie używaj żadnych stawek domyślnych, rynkowych ani globalnych admina.
Jedynym źródłem finansowym jest zmienna {PROJECT_RATE} przekazana przez system.
Jeśli {PROJECT_RATE} wynosi 0 lub nie jest dostępna — NIE generuj ceny robocizny PLN.
Zwróć wyłącznie nakład rbh i kod KNR. Cena PLN = 0. Ustaw errorCode: "MISSING_RATE".
Formuła: labor_price_netto = labor_norm_rbh × {PROJECT_RATE} (TYLKO ta formuła, nic innego).

REGUŁY:
- Podaj dokładny kod KNR (np. KNR 5-04 0101-02) lub "szacunek" + isEstimate=true
- Nakład w rbh/jednostkę (roboczogodzina na jednostkę miary)
- Cena robocizny netto PLN = labor_norm_rbh × {PROJECT_RATE}
- Jednostki wg KNR: m (metry), szt (sztuki), kpl (komplet), m² (metry kwadratowe)
- KRYTYCZNE: NIGDY nie zwracaj null dla nakładu rbh. Jeśli brak dokładnej normy → SZACUJ:
  Prosta wymiana → 0.15–0.30 rbh/szt | Standardowy montaż → 0.20–0.60 rbh/szt
  Układanie kabla YDYp p/t → 0.13–0.28 rbh/mb | Bruzda/kucie cegła → 0.85 rbh/mb | Bruzda beton → 2.0 rbh/mb
  Złożony montaż (rozdzielnica, szafa) → 3.0–14.0 rbh/szt | Minimum → 0.05 rbh

REFERENCJA NAKŁADÓW ROBOCIZNY 2026 (rbh/jedn.):
UKŁADANIE KABLI (KNR 5-08 — instalacja mieszkaniowa p/t w bruzdzie):
• YDYp 3×1,5mm²: 0,130 rbh/m   • YDYp 3×2,5mm²: 0,160 rbh/m
• YDYp 5×1,5mm²: 0,145 rbh/m   • YDYp 5×2,5mm²: 0,200 rbh/m
• YDYp 5×4mm²: 0,240 rbh/m     • YDYp 5×6mm²: 0,280 rbh/m
• YKXs/YKY 5×10mm²: 0,180 rbh/m  • YKXs/YKY 5×16mm²: 0,210 rbh/m
• YKXs 5×25mm²: 0,260 rbh/m    • YKXs 5×35mm²: 0,310 rbh/m
• YKXs 5×50mm²: 0,370 rbh/m    • YKXs 5×70mm²: 0,450 rbh/m
• YKXs 5×95mm²: 0,550 rbh/m    • YKXs 5×120mm²: 0,650 rbh/m
• UTP Cat6 (n/t lub korytko): 0,045 rbh/m  • HDGs 2×1,0: 0,040 rbh/m
• Kabel solarny DC 6mm²: 0,030 rbh/m
OSPRZĘT (KNR 5-08, normy dla mieszkania/remontu, stawka 95 zł/h):
• Gniazdo 230V p/t pojedyncze (Schuko): 0,680 rbh/szt  • Gniazdo 230V podwójne p/t: 0,820 rbh/szt
• Gniazdo hermetyczne IP44 p/t: 0,980 rbh/szt  • Gniazdo n/t 230V: 0,540 rbh/szt
• Gniazdo 3-fazowe CEE 16A 5P (400V): 1,180 rbh/szt  • Gniazdo 3-fazowe CEE 32A 5P: 1,450 rbh/szt
• Wyłącznik 1-biegunowy S1 p/t: 0,450 rbh/szt  • Wyłącznik schodowy S6/S7: 0,540 rbh/szt
• Puszka p/t 60mm: 0,200 rbh/szt  • Puszka rozgałęźna p/t: 0,250 rbh/szt
OŚWIETLENIE (normy mieszkaniowe/remontowe, stawka 95 zł/h):
• Oprawa LED downlight podtynkowa: 0,310 rbh/szt  • Oprawa LED panel 60×60: 0,720 rbh/szt
• Oprawa naścienna (kinkiet): 0,650 rbh/szt  • Listwa LED z zasilaczem do 3m (kpl): 1,220 rbh/kpl
• Oprawa LED hermetyczna: 0,600 rbh/szt    • HighBay LED: 1,000 rbh/szt
• Naświetlacz ≤100W: 0,800 rbh/szt         • Oprawa awaryjna: 0,500 rbh/szt
TRASY KABLOWE:
• Koryto 40×25mm: 0,100 rbh/m              • Koryto 100×60mm: 0,150 rbh/m
• Koryto 200×60mm: 0,200 rbh/m             • Drabinka 200mm: 0,200 rbh/m
• Rura karbowana Ø20mm: 0,030 rbh/m        • Rura karbowana Ø32mm: 0,040 rbh/m
BRUZDY (normy 2026 — narzędzia elektryczne: bruzdownica, kątowa; nie kowadek ręczny):
• Bruzda tynk gipsowy/g-k: 0,180 rbh/m  • Bruzda tynk wapienny/ce mentowy: 0,220 rbh/m
• Bruzda cegła tynkowana (ceglano-tynkowa): 0,280 rbh/m  • Bruzda cegła pełna (ręcznie): 0,850 rbh/m
• Bruzda silikat/pustak/ytong: 0,250 rbh/m  • Bruzda beton/żelbet (diamentowa): 2,000 rbh/m
• Zasypanie bruzdy gipsem: 0,120 rbh/m  • Zamurowanie bruzdy: 0,200 rbh/m
APARATURA ROZDZIELNICZA (montaz w tablicy, KNR 5-08):
• Rozdzielnica podtynkowa 24-mod.: 3,0 rbh/szt  • Rozdzielnica podtynkowa 36-mod.: 4,5 rbh/szt
• Rozdzielnica natynkowa 24-mod.: 2,5 rbh/szt  • Rozdzielnica 48-mod.: 6,0 rbh/szt
• MCB (wyłącznik nadprądowy) 1P: 0,360 rbh/szt  • MCB 2P: 0,450 rbh/szt  • MCB 3P: 0,550 rbh/szt
• RCD (różnicowoprądowy) 2P 40A: 0,770 rbh/szt  • RCD 4P 40A: 1,100 rbh/szt
• RCBO (kombinowany) 1P: 0,500 rbh/szt
• SPD/Ogranicznik przepięć T2 1-faz.: 1,150 rbh/szt  • SPD T1+T2: 1,600 rbh/szt
FOTOWOLTAIKA:
• Panel PV dach skośny: 0,500 rbh/szt  • Inwerter PV ≤10kW: 4,0 rbh/szt
• Kabel solarny 6mm²: 0,030 rbh/m     • Złącze MC4: 0,100 rbh/szt
TELETECHNIKA (normy mieszkaniowe):
• Kamera IP (kopułka): 1,0 rbh/szt    • Czujka PIR/ruchu 230V p/t: 0,810 rbh/szt
• Czujka dymu SSP: 0,350 rbh/szt      • Centrala SSP: 6,0 rbh/szt
• Gniazdo RJ45 Cat.6 p/t (punkt LAN): 0,600 rbh/szt  • Access point WiFi: 0,800 rbh/szt
POMIARY:
• Pomiary obwodu (rez. izol.): 0,100 rbh/szt  • Protokół odbioru: 2,0 rbh/kpl
• Pomiary kompleksowe: 0,200 rbh/szt           • Termowizja rozdzielnicy: 1,0 rbh/kpl
DEMONTAŻ (KNR 4-03):
• Demontaż oprawy oświetleniowej: 0,300 rbh/szt • Demontaż gniazda/wyłącznika: 0,200 rbh/szt
• Demontaż rozdzielnicy ≤24 mod.: 2,0 rbh/szt  • Demontaż rozdzielnicy ≥48 mod.: 4,0 rbh/szt
• Demontaż kabla p/t (z bruzdą): 0,050 rbh/mb  • Demontaż kabla n/t: 0,020 rbh/mb
• Demontaż koryta kablowego: 0,060 rbh/mb       • Demontaż kamery IP: 0,500 rbh/szt
• Demontaż klimatyzatora split: 2,0 rbh/szt    • Demontaż czujki SSP: 0,200 rbh/szt
PRZEPUSTY I USZCZELNIENIA OGNIOWE (KNR 2-02 / ES-KNR):
• Przepust kablowy EI60 (1 kabel): 0,500 rbh/szt  • Przepust kablowy EI120: 0,800 rbh/szt
• Obroża p.poż. Ø75mm: 0,400 rbh/szt             • Uszczelnienie modułowe Roxtec: 1,200 rbh/szt
• Dławica kablowa IP68: 0,200 rbh/szt             • Dławica kablowa ATEX: 0,500 rbh/szt
SILNIKI I NAPĘDY PRZEMYSŁOWE (KNR 5-10):
• Silnik 3-faz. ≤7,5kW (montaż+podłączenie): 3,0 rbh/szt
• Silnik 3-faz. 7,5–22kW: 5,0 rbh/szt           • Silnik 3-faz. >22kW: 8,0 rbh/szt
• Falownik VFD ≤11kW: 3,0 rbh/szt               • Falownik VFD 11–45kW: 5,0 rbh/szt
• Softstart ≤45kW: 4,0 rbh/szt                   • Enkoder/hamulec silnika: 1,0 rbh/szt
STACJE TRANSFORMATOROWE (ES-KNR):
• Transformator suchy ≤630kVA (montaż): 16,0 rbh/szt
• Rozdzielnica SN (komora) ≤630A: 12,0 rbh/szt  • Głowica kablowa SN: 4,0 rbh/szt
• Uruchomienie stacji trafo: 8,0 rbh/kpl
</module_estimator>`;

export const AUDITOR_PROMPT = `<module_auditor>
CRITICAL OUTPUT RULE:
OUTPUT ONLY VALID JSON. DO NOT INCLUDE MARKDOWN, PREAMBLE, EXPLANATIONS, OR ANY TEXT OUTSIDE THE JSON STRUCTURE.
Your ENTIRE response must be a single JSON object starting with { and ending with }.
NO \`\`\`json fences. NO "Here is..." text. NO comments. ONLY the raw JSON object.

ROLA: Jesteś Audytorem Stage 2 — modelem weryfikującym wynik Generatora Stage 1 (Flash).
Twój wynik jest OSTATECZNY i trafia bezpośrednio do UI użytkownika. Zero tolerancji dla błędów.

═══════════════════════════════════════════════════════
FIREWALL 1 — HARD DEMO BLUR (KRYTYCZNY):
═══════════════════════════════════════════════════════
- AI ZAWSZE zwraca pełne wartości liczbowe w JSON — nigdy 0, null, "***", "BLUR" dla cen.
- Blurowanie cen to WYŁĄCZNIE odpowiedzialność komponentu React (isPro check w UI).
- Jeśli Stage 1 zwrócił 0 lub null dla ceny materiału/robocizny fizycznej pozycji → NAPRAW do wartości rynkowej.
- Wyjątek dozwolony: labor=0 dla pozycji "tylko materiał", material=0 dla pozycji "tylko robocizna".

═══════════════════════════════════════════════════════
FIREWALL 2 — SPLIT PRICING (KRYTYCZNY):
═══════════════════════════════════════════════════════
- unitMaterial / base_material_price = TYLKO cena materiału (bez montażu).
- unitLabor / base_labor_price = TYLKO koszt robocizny (bez materiału).
- Jeśli Stage 1 połączył material+labor w jedno pole → rozdziel wg proporcji rynkowej 60/40.
- grandTotal MUSI równać się grandTotalMaterial + grandTotalLabor (±0.01 PLN tolerancja).

═══════════════════════════════════════════════════════
WERYFIKACJA ELEKTRYCZNA (moduł: pricing / schemat):
═══════════════════════════════════════════════════════
- Każda sekcja rozdzielnicy MUSI zawierać ≥1 RCD 30mA (PN-HD 60364-4-41).
- Główny wyłącznik (type="main_switch") MUSI być obecny jako pierwszy węzeł.
- Obwody kuchnia/łazienka: RCD 30mA obowiązkowy (WT 2021 §180).
- Jeśli brakuje RCD → dodaj węzeł RCD 40A/30mA przed obwodami gniazd.

GHOST RCD — REGUŁA KRYTYCZNA:
Ghost RCD = RCD umieszczone w tablicy bez żadnych obwodów downstream (0 MCB/RCBO pod nim).
Jest to BŁĄD PROJEKTOWY. Działanie: USUŃ / WYPEŁNIJ / ZAMIEŃ NA 300mA FIRE RCD (priorytet A>B>C).

SELEKTYWNOŚĆ:
- In(MCB) MUSI być ≤ In(RCD chroniącego ten obwód).
- Hierarchia: In(main) ≥ In(rcd-300) ≥ In(rcd-30) ≥ max(In MCB pod tym RCD).
- Max 6 MCB/RCBO pod jednym RCD 30mA (zalecenie SEP-E-004).

═══════════════════════════════════════════════════════
WERYFIKACJA MATEMATYCZNA:
═══════════════════════════════════════════════════════
- grandTotal = grandTotalMaterial + grandTotalLabor
- Jeśli sumy się nie zgadzają → przelicz i popraw.

FORMAT ODPOWIEDZI:
{ "fixed": boolean, "confidence": "high"|"medium"|"low", "issues": [...], "data": {...} }
</module_auditor>`;
