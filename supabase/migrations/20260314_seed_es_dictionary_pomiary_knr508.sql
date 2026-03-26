-- ES-Dictionary seed: KNR 5-08 Rozdział 09 — Pomiary i Badania
-- Category: pomiary_badania (nowa, dedykowana)
-- Units: szt (punkt pomiarowy), obwód, pomieszczenie, uziom, kpl
-- AI synonyms: zamery, protokoly, ispytania, petla zwarcia + warianty PL/RU

INSERT INTO es_dictionary (keyword, label, knr_ref, type, unit, labor_norm_rbh, category, confidence_weight)
VALUES

-- 0901: Oględziny
('ogledziny instalacji elektrycznej', 'Sprawdzenie instalacji przez oględziny', 'KNR 5-08 0901-01', 'robocizna', 'kpl', 1.50, 'pomiary_badania', 0.85),
('inspekcja wizualna instalacji', 'Sprawdzenie instalacji przez oględziny', 'KNR 5-08 0901-01', 'robocizna', 'kpl', 1.50, 'pomiary_badania', 0.80),
('kontrola instalacji elektrycznej', 'Sprawdzenie instalacji przez oględziny', 'KNR 5-08 0901-01', 'robocizna', 'kpl', 1.50, 'pomiary_badania', 0.80),

-- 0902: Próba napięciowa
('proba napieciowa izolacji 500V', 'Próba napięciowa izolacji 500V DC — obwód 1-faz', 'KNR 5-08 0902-01', 'robocizna', 'obwód', 0.20, 'pomiary_badania', 0.88),
('hipot test 500V', 'Próba napięciowa izolacji 500V DC — obwód 1-faz', 'KNR 5-08 0902-01', 'robocizna', 'obwód', 0.20, 'pomiary_badania', 0.82),
('ispytanie izolacji 500V', 'Próba napięciowa izolacji 500V DC — obwód 1-faz', 'KNR 5-08 0902-01', 'robocizna', 'obwód', 0.20, 'pomiary_badania', 0.82),
('proba napieciowa izolacji 1kV', 'Próba napięciowa izolacji 1000V DC — obwód 3-faz', 'KNR 5-08 0902-02', 'robocizna', 'obwód', 0.25, 'pomiary_badania', 0.88),
('probowanie izolacji 1000V', 'Próba napięciowa izolacji 1000V DC — obwód 3-faz', 'KNR 5-08 0902-02', 'robocizna', 'obwód', 0.25, 'pomiary_badania', 0.82),

-- 0903: Rezystancja izolacji (megaomomierz)
('pomiar rezystancji izolacji jednofazowy', 'Pomiar rezystancji izolacji megaomomierzem — obwód 1-faz', 'KNR 5-08 0903-01', 'robocizna', 'obwód', 0.20, 'pomiary_badania', 0.92),
('megaomierz obwod 230V', 'Pomiar rezystancji izolacji megaomomierzem — obwód 1-faz', 'KNR 5-08 0903-01', 'robocizna', 'obwód', 0.20, 'pomiary_badania', 0.88),
('zamery izolacji obwod', 'Pomiar rezystancji izolacji megaomomierzem — obwód 1-faz', 'KNR 5-08 0903-01', 'robocizna', 'obwód', 0.20, 'pomiary_badania', 0.85),
('zamiary elektryczne izolacja', 'Pomiar rezystancji izolacji megaomomierzem — obwód 1-faz', 'KNR 5-08 0903-01', 'robocizna', 'obwód', 0.20, 'pomiary_badania', 0.82),
('pomiar izolacji megaom', 'Pomiar rezystancji izolacji megaomomierzem — obwód 1-faz', 'KNR 5-08 0903-01', 'robocizna', 'obwód', 0.20, 'pomiary_badania', 0.90),
('pomiar rezystancji izolacji trojfazowy', 'Pomiar rezystancji izolacji megaomomierzem — obwód 3-faz', 'KNR 5-08 0903-02', 'robocizna', 'obwód', 0.25, 'pomiary_badania', 0.90),
('megaomierz obwod 400V', 'Pomiar rezystancji izolacji megaomomierzem — obwód 3-faz', 'KNR 5-08 0903-02', 'robocizna', 'obwód', 0.25, 'pomiary_badania', 0.85),

-- 0904: Pętla zwarcia
('petla zwarcia punkt pomiarowy', 'Pomiar impedancji pętli zwarcia Zs — punkt (sieć TN)', 'KNR 5-08 0904-01', 'robocizna', 'szt', 0.15, 'pomiary_badania', 0.95),
('impedancja petli zwarcia Zs', 'Pomiar impedancji pętli zwarcia Zs — punkt (sieć TN)', 'KNR 5-08 0904-01', 'robocizna', 'szt', 0.15, 'pomiary_badania', 0.95),
('pomiar petli zwarcia MPI', 'Pomiar impedancji pętli zwarcia Zs — punkt (sieć TN)', 'KNR 5-08 0904-01', 'robocizna', 'szt', 0.15, 'pomiary_badania', 0.92),
('petla zwarcia siec TN', 'Pomiar impedancji pętli zwarcia Zs — punkt (sieć TN)', 'KNR 5-08 0904-01', 'robocizna', 'szt', 0.15, 'pomiary_badania', 0.90),
('pomiar Zs miernik zwarciowy', 'Pomiar impedancji pętli zwarcia Zs — punkt (sieć TN)', 'KNR 5-08 0904-01', 'robocizna', 'szt', 0.15, 'pomiary_badania', 0.88),
('petla zwarcia TT siec izolowana', 'Pomiar impedancji pętli zwarcia Zs — punkt (sieć TT/IT)', 'KNR 5-08 0904-02', 'robocizna', 'szt', 0.20, 'pomiary_badania', 0.88),

-- 0905: Rezystancja uziemienia
('pomiar rezystancji uziemienia 3-biegunowy', 'Pomiar rezystancji uziemienia metodą 3-biegunową', 'KNR 5-08 0905-01', 'robocizna', 'uziom', 0.80, 'pomiary_badania', 0.92),
('uziom pomiar wenner', 'Pomiar rezystancji uziemienia metodą 3-biegunową', 'KNR 5-08 0905-01', 'robocizna', 'uziom', 0.80, 'pomiary_badania', 0.88),
('pomiar uziomu 3 bieguny', 'Pomiar rezystancji uziemienia metodą 3-biegunową', 'KNR 5-08 0905-01', 'robocizna', 'uziom', 0.80, 'pomiary_badania', 0.88),
('pomiar rezystancji uziemienia cegami', 'Pomiar rezystancji uziemienia metodą cęgową', 'KNR 5-08 0905-02', 'robocizna', 'uziom', 0.40, 'pomiary_badania', 0.88),
('cegi amperometryczne uziom', 'Pomiar rezystancji uziemienia metodą cęgową', 'KNR 5-08 0905-02', 'robocizna', 'uziom', 0.40, 'pomiary_badania', 0.85),

-- 0906: Ciągłość PE
('ciaglosc przewodu PE punkt', 'Sprawdzenie ciągłości przewodu ochronnego PE — punkt', 'KNR 5-08 0906-01', 'robocizna', 'szt', 0.15, 'pomiary_badania', 0.90),
('sprawdzenie PE ciaglosc', 'Sprawdzenie ciągłości przewodu ochronnego PE — punkt', 'KNR 5-08 0906-01', 'robocizna', 'szt', 0.15, 'pomiary_badania', 0.88),
('pomiar ciaglosci ochronnej PE', 'Sprawdzenie ciągłości przewodu ochronnego PE — punkt', 'KNR 5-08 0906-01', 'robocizna', 'szt', 0.15, 'pomiary_badania', 0.88),
('ciaglosc szyny wyrownawczej GES', 'Sprawdzenie ciągłości głównej szyny wyrównawczej', 'KNR 5-08 0906-02', 'robocizna', 'kpl', 0.30, 'pomiary_badania', 0.88),
('GES LES wyrownanie potencjalow', 'Sprawdzenie ciągłości głównej szyny wyrównawczej', 'KNR 5-08 0906-02', 'robocizna', 'kpl', 0.30, 'pomiary_badania', 0.85),

-- 0907: Badanie RCD
('badanie RCD 30mA wyzwolenie', 'Badanie wyłącznika RCD 30 mA — czas i prąd wyzwolenia', 'KNR 5-08 0907-01', 'robocizna', 'szt', 0.25, 'pomiary_badania', 0.92),
('test RCD fi 30 czas reakcji', 'Badanie wyłącznika RCD 30 mA — czas i prąd wyzwolenia', 'KNR 5-08 0907-01', 'robocizna', 'szt', 0.25, 'pomiary_badania', 0.90),
('RCCB test pomiar', 'Badanie wyłącznika RCD 30 mA — czas i prąd wyzwolenia', 'KNR 5-08 0907-01', 'robocizna', 'szt', 0.25, 'pomiary_badania', 0.85),
('wylacznik roznicowy pomiar badanie', 'Badanie wyłącznika RCD 30 mA — czas i prąd wyzwolenia', 'KNR 5-08 0907-01', 'robocizna', 'szt', 0.25, 'pomiary_badania', 0.88),
('badanie RCD selektywny 300mA', 'Badanie wyłącznika RCD 100/300 mA (S-type)', 'KNR 5-08 0907-02', 'robocizna', 'szt', 0.30, 'pomiary_badania', 0.88),

-- 0908: Biegunowość
('sprawdzenie biegunowosci obwod', 'Sprawdzenie biegunowości obwodów elektrycznych', 'KNR 5-08 0908-01', 'robocizna', 'obwód', 0.10, 'pomiary_badania', 0.85),
('biegunowos L N PE obwod', 'Sprawdzenie biegunowości obwodów elektrycznych', 'KNR 5-08 0908-01', 'robocizna', 'obwód', 0.10, 'pomiary_badania', 0.82),

-- 0909: Kolejność faz
('kolejnosc faz pomiar', 'Sprawdzenie kolejności faz L1/L2/L3', 'KNR 5-08 0909-01', 'robocizna', 'szt', 0.10, 'pomiary_badania', 0.88),
('sekwencja faz wskaznik', 'Sprawdzenie kolejności faz L1/L2/L3', 'KNR 5-08 0909-01', 'robocizna', 'szt', 0.10, 'pomiary_badania', 0.85),

-- 0910: Natężenie oświetlenia
('pomiar natezenia oswietlenia ogolnego', 'Pomiar natężenia oświetlenia ogólnego — pomieszczenie', 'KNR 5-08 0910-01', 'robocizna', 'pomieszczenie', 0.50, 'pomiary_badania', 0.92),
('luksomierz pomiar pomieszczenie', 'Pomiar natężenia oświetlenia ogólnego — pomieszczenie', 'KNR 5-08 0910-01', 'robocizna', 'pomieszczenie', 0.50, 'pomiary_badania', 0.88),
('pomiar lux EN 12464', 'Pomiar natężenia oświetlenia ogólnego — pomieszczenie', 'KNR 5-08 0910-01', 'robocizna', 'pomieszczenie', 0.50, 'pomiary_badania', 0.85),
('pomiar oswietlenia awaryjnego pomieszczenie', 'Pomiar natężenia oświetlenia awaryjnego/ewakuacyjnego — pomieszczenie', 'KNR 5-08 0910-02', 'robocizna', 'pomieszczenie', 0.40, 'pomiary_badania', 0.90),
('oswietlenie ewakuacyjne test pomiar', 'Pomiar natężenia oświetlenia awaryjnego/ewakuacyjnego — pomieszczenie', 'KNR 5-08 0910-02', 'robocizna', 'pomieszczenie', 0.40, 'pomiary_badania', 0.88),

-- 0911: Napięcie dotyku
('napiecie dotyku pomiar', 'Pomiar napięcia dotyku w strefach ochronnych', 'KNR 5-08 0911-01', 'robocizna', 'szt', 0.30, 'pomiary_badania', 0.85),
('touch voltage ochrona porazenie', 'Pomiar napięcia dotyku w strefach ochronnych', 'KNR 5-08 0911-01', 'robocizna', 'szt', 0.30, 'pomiary_badania', 0.80),

-- 0912: Zabezpieczenia nadprądowe
('sprawdzenie zabezpieczen nadpradowych MCB', 'Sprawdzenie nastawień zabezpieczeń nadprądowych', 'KNR 5-08 0912-01', 'robocizna', 'szt', 0.20, 'pomiary_badania', 0.85),
('nastawa MCB MCCB sprawdzenie', 'Sprawdzenie nastawień zabezpieczeń nadprądowych', 'KNR 5-08 0912-01', 'robocizna', 'szt', 0.20, 'pomiary_badania', 0.82),

-- 0913: Protokoły — AI MAPPING dla "протоколы / protokoly / zamery"
('protokol pomiarow elektrycznych do 10 obwodow', 'Protokół z pomiarów elektrycznych — do 10 obwodów', 'KNR 5-08 0913-01', 'robocizna', 'kpl', 1.00, 'pomiary_badania', 0.95),
('protokoly pomiarowe elektryczne', 'Protokół z pomiarów elektrycznych — do 10 obwodów', 'KNR 5-08 0913-01', 'robocizna', 'kpl', 1.00, 'pomiary_badania', 0.92),
('protokol odbioru instalacji', 'Protokół z pomiarów elektrycznych — do 10 obwodów', 'KNR 5-08 0913-01', 'robocizna', 'kpl', 1.00, 'pomiary_badania', 0.92),
('protokol z badan elektrycznych', 'Protokół z pomiarów elektrycznych — do 10 obwodów', 'KNR 5-08 0913-01', 'robocizna', 'kpl', 1.00, 'pomiary_badania', 0.90),
('dokumentacja pomiarowa protokol', 'Protokół z pomiarów elektrycznych — do 10 obwodów', 'KNR 5-08 0913-01', 'robocizna', 'kpl', 1.00, 'pomiary_badania', 0.88),
('protokol pomiarow do 30 obwodow', 'Protokół z pomiarów elektrycznych — 11–30 obwodów', 'KNR 5-08 0913-02', 'robocizna', 'kpl', 1.50, 'pomiary_badania', 0.92),
('protokoly sredni obiekt', 'Protokół z pomiarów elektrycznych — 11–30 obwodów', 'KNR 5-08 0913-02', 'robocizna', 'kpl', 1.50, 'pomiary_badania', 0.85),
('protokol pomiarow duzy budynek', 'Protokół z pomiarów elektrycznych — powyżej 30 obwodów', 'KNR 5-08 0913-03', 'robocizna', 'kpl', 2.50, 'pomiary_badania', 0.92),

-- 0914: Kompleksowy odbiór — AI MAPPING dla "замеры / ispytania / badania odbiorcze"
('badania odbiorcze instalacji mieszkanie', 'Kompleksowy odbiór instalacji — lokal/mieszkanie', 'KNR 5-08 0914-01', 'robocizna', 'kpl', 4.00, 'pomiary_badania', 0.95),
('zamery elektryczne mieszkanie', 'Kompleksowy odbiór instalacji — lokal/mieszkanie', 'KNR 5-08 0914-01', 'robocizna', 'kpl', 4.00, 'pomiary_badania', 0.90),
('ispytania instalacji mieszkanie', 'Kompleksowy odbiór instalacji — lokal/mieszkanie', 'KNR 5-08 0914-01', 'robocizna', 'kpl', 4.00, 'pomiary_badania', 0.88),
('odbiorcze pomiary kompleksowe lokal', 'Kompleksowy odbiór instalacji — lokal/mieszkanie', 'KNR 5-08 0914-01', 'robocizna', 'kpl', 4.00, 'pomiary_badania', 0.90),
('badania odbiorcze instalacji biuro sklep', 'Kompleksowy odbiór instalacji — biuro/sklep', 'KNR 5-08 0914-02', 'robocizna', 'kpl', 6.00, 'pomiary_badania', 0.92),
('zamery elektryczne biuro', 'Kompleksowy odbiór instalacji — biuro/sklep', 'KNR 5-08 0914-02', 'robocizna', 'kpl', 6.00, 'pomiary_badania', 0.88),
('ispytania instalacji biuro', 'Kompleksowy odbiór instalacji — biuro/sklep', 'KNR 5-08 0914-02', 'robocizna', 'kpl', 6.00, 'pomiary_badania', 0.85),
('badania odbiorcze budynek wielorodzinny', 'Kompleksowy odbiór instalacji — budynek wielorodzinny', 'KNR 5-08 0914-03', 'robocizna', 'kpl', 16.00, 'pomiary_badania', 0.92),
('zamery komplet budynku wielorodzinnego', 'Kompleksowy odbiór instalacji — budynek wielorodzinny', 'KNR 5-08 0914-03', 'robocizna', 'kpl', 16.00, 'pomiary_badania', 0.88),
('PN-IEC 60364 badania odbiorcze', 'Kompleksowy odbiór instalacji — budynek wielorodzinny', 'KNR 5-08 0914-03', 'robocizna', 'kpl', 16.00, 'pomiary_badania', 0.90)

ON CONFLICT (keyword_normalized) WHERE user_id IS NULL DO UPDATE
  SET label = EXCLUDED.label,
      knr_ref = EXCLUDED.knr_ref,
      unit = EXCLUDED.unit,
      labor_norm_rbh = EXCLUDED.labor_norm_rbh,
      category = EXCLUDED.category,
      confidence_weight = EXCLUDED.confidence_weight;
