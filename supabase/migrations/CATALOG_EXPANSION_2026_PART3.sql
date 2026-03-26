-- ============================================================================
-- CATALOG EXPANSION 2026 - PART 3: MATERIAŁY (Kable, Rozdzielnice, LED, Smart Home)
-- ============================================================================
-- Kable, rozdzielnice, oświetlenie LED, smart home, floorbox'y
-- ============================================================================

DO $$
DECLARE
  cat_rozdzielnice_id UUID;
  cat_oswietlenie_id UUID;
  cat_smart_home_id UUID;
  cat_led_przemyslowe_id UUID;
  cat_kable_id UUID;
  cat_osprzet_id UUID;
  cat_instalacje_id UUID;
BEGIN
  SELECT id INTO cat_rozdzielnice_id FROM catalog_categories WHERE name = 'Rozdzielnice i tablice' LIMIT 1;
  SELECT id INTO cat_oswietlenie_id FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_smart_home_id FROM catalog_categories WHERE name = 'Smart Home & KNX' LIMIT 1;
  SELECT id INTO cat_led_przemyslowe_id FROM catalog_categories WHERE name = 'Oświetlenie przemysłowe LED' LIMIT 1;
  SELECT id INTO cat_kable_id FROM catalog_categories WHERE name = 'Kable i przewody' LIMIT 1;
  SELECT id INTO cat_osprzet_id FROM catalog_categories WHERE name = 'Osprzęt elektryczny' LIMIT 1;
  SELECT id INTO cat_instalacje_id FROM catalog_categories WHERE name = 'Instalacje elektryczne' LIMIT 1;

  -- ============================================================================
  -- 1. MATERIAŁY - KABLE I PRZEWODY
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description, sub_category) VALUES
  
  -- Przewody YDY (mieszkaniowe)
  ('Przewód YDY 3x1,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 3.50, 'Przewód mieszkaniowy dla gniazdek', 'Przewody YDY'),
  ('Przewód YDY 3x2,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 5.20, 'Przewód wzmocniony dla obwodów', 'Przewody YDY'),
  ('Przewód YDY 3x4mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 8.50, 'Przewód dla większych obciążeń', 'Przewody YDY'),
  ('Przewód YDY 3x6mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 12.80, 'Przewód dla dużych mocy', 'Przewody YDY'),
  ('Przewód YDY 5x1,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 5.80, 'Przewód 5-żyłowy', 'Przewody YDY'),
  ('Przewód YDY 5x2,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 8.60, 'Przewód 5-żyłowy wzmocniony', 'Przewody YDY'),
  
  -- Kable YKY (energetyczne)
  ('Kabel YKY 3x1,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 4.20, 'Kabel energetyczny miedziany', 'Kable YKY'),
  ('Kabel YKY 3x2,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 6.80, 'Kabel energetyczny standard', 'Kable YKY'),
  ('Kabel YKY 3x4mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 10.50, 'Kabel energetyczny mocny', 'Kable YKY'),
  ('Kabel YKY 3x6mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 15.20, 'Kabel energetyczny silny', 'Kable YKY'),
  ('Kabel YKY 3x10mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 24.00, 'Kabel dla dużych obciążeń', 'Kable YKY'),
  ('Kabel YKY 3x16mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 38.00, 'Kabel dla bardzo dużych mocy', 'Kable YKY'),
  ('Kabel YKY 5x4mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 16.80, 'Kabel 5-żyłowy energetyczny', 'Kable YKY'),
  ('Kabel YKY 5x6mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 24.50, 'Kabel 5-żyłowy mocny', 'Kable YKY'),
  ('Kabel YKY 5x10mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 39.00, 'Kabel 5-żyłowy duże obciążenia', 'Kable YKY'),
  
  -- Kable aluminiowe YAKY
  ('Kabel YAKY 4x25mm² Al (za mb)', 'material', cat_kable_id, 'mb', 0, 28.00, 'Kabel aluminiowy zasilający', 'Kable aluminiowe'),
  ('Kabel YAKY 4x35mm² Al (za mb)', 'material', cat_kable_id, 'mb', 0, 38.00, 'Kabel aluminiowy mocny', 'Kable aluminiowe'),
  ('Kabel YAKY 4x50mm² Al (za mb)', 'material', cat_kable_id, 'mb', 0, 52.00, 'Kabel aluminiowy bardzo mocny', 'Kable aluminiowe'),
  
  -- Przewody instalacyjne
  ('Przewód LgY 1,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 0.95, 'Przewód jednożyłowy', 'Przewody instalacyjne'),
  ('Przewód LgY 2,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 1.50, 'Przewód jednożyłowy mocny', 'Przewody instalacyjne'),
  ('Przewód LgY 4mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 2.40, 'Przewód jednożyłowy duży', 'Przewody instalacyjne'),
  ('Przewód LgY 6mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 3.50, 'Przewód jednożyłowy bardzo duży', 'Przewody instalacyjne'),
  
  -- Kable specjalne
  ('Przewód ochronny OW 16mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 4.80, 'Przewód uziemiający', 'Przewody ochronne'),
  ('Przewód ochronny OW 25mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 7.50, 'Przewód uziemiający mocny', 'Przewody ochronne'),
  ('Kabel UTP Cat.6 (za mb)', 'material', cat_kable_id, 'mb', 0, 2.20, 'Kabel sieciowy komputerowy', 'Kable teletechniczne'),
  ('Kabel FTP Cat.6A ekranowany (za mb)', 'material', cat_kable_id, 'mb', 0, 3.80, 'Kabel sieciowy ekranowany', 'Kable teletechniczne'),
  ('Kabel KNX Bus 2x2x0,8 (za mb)', 'material', cat_kable_id, 'mb', 0, 4.50, 'Kabel magistrali KNX', 'Kable Smart Home'),
  ('Kabel domofonowy YTKSY 2x2x0,8 (za mb)', 'material', cat_kable_id, 'mb', 0, 3.20, 'Kabel do domofonu', 'Kable teletechniczne'),
  ('Przewód głośnikowy 2x1,5mm² (za mb)', 'material', cat_kable_id, 'mb', 0, 1.80, 'Przewód audio', 'Kable audio'),
  
  -- Rury i koryta
  ('Rura karbowana fi16 (za mb)', 'material', cat_kable_id, 'mb', 0, 1.20, 'Rura instalacyjna 16mm', 'Rury i koryta'),
  ('Rura karbowana fi20 (za mb)', 'material', cat_kable_id, 'mb', 0, 1.60, 'Rura instalacyjna 20mm', 'Rury i koryta'),
  ('Rura karbowana fi25 (za mb)', 'material', cat_kable_id, 'mb', 0, 2.10, 'Rura instalacyjna 25mm', 'Rury i koryta'),
  ('Rura sztywna PCV fi16 (za mb)', 'material', cat_kable_id, 'mb', 0, 2.50, 'Rura sztywna 16mm', 'Rury i koryta'),
  ('Korytko kablowe PCV 25x16 (za mb)', 'material', cat_kable_id, 'mb', 0, 8.50, 'Korytko instalacyjne małe', 'Rury i koryta'),
  ('Korytko kablowe PCV 40x25 (za mb)', 'material', cat_kable_id, 'mb', 0, 12.00, 'Korytko instalacyjne średnie', 'Rury i koryta'),
  ('Korytko kablowe PCV 60x40 (za mb)', 'material', cat_kable_id, 'mb', 0, 18.00, 'Korytko instalacyjne duże', 'Rury i koryta'),
  ('Korytko stalowe perforowane 100mm (za mb)', 'material', cat_kable_id, 'mb', 0, 28.00, 'Korytko stalowe hala', 'Rury i koryta'),
  ('Drabinka kablowa 200mm (za mb)', 'material', cat_kable_id, 'mb', 0, 45.00, 'Drabinka kablowa przemysłowa', 'Rury i koryta')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano kable i przewody - część 3a';

  -- ============================================================================
  -- 2. MATERIAŁY - ROZDZIELNICE I ELEMENTY
  -- ============================================================================

  INSERT INTO catalog_items (name, type, category_id, unit, base_labor_price, base_material_price, description, sub_category) VALUES
  
  -- Rozdzielnice podtynkowe
  ('Rozdzielnica podtynkowa 8 modułów (1-rzędowa)', 'material', cat_rozdzielnice_id, 'szt', 0, 45.00, 'Rozdzielnica mała podtynkowa', 'Rozdzielnice podtynkowe'),
  ('Rozdzielnica podtynkowa 12 modułów (1-rzędowa)', 'material', cat_rozdzielnice_id, 'szt', 0, 55.00, 'Rozdzielnica średnia podtynkowa', 'Rozdzielnice podtynkowe'),
  ('Rozdzielnica podtynkowa 24 moduły (2-rzędowa)', 'material', cat_rozdzielnice_id, 'szt', 0, 85.00, 'Rozdzielnica duża podtynkowa', 'Rozdzielnice podtynkowe'),
  ('Rozdzielnica podtynkowa 36 modułów (3-rzędowa)', 'material', cat_rozdzielnice_id, 'szt', 0, 120.00, 'Rozdzielnica bardzo duża podtynkowa', 'Rozdzielnice podtynkowe'),
  
  -- Rozdzielnice natynkowe
  ('Rozdzielnica natynkowa 12 modułów IP40', 'material', cat_rozdzielnice_id, 'szt', 0, 75.00, 'Rozdzielnica natynkowa mała', 'Rozdzielnice natynkowe'),
  ('Rozdzielnica natynkowa 24 moduły IP40', 'material', cat_rozdzielnice_id, 'szt', 0, 120.00, 'Rozdzielnica natynkowa średnia', 'Rozdzielnice natynkowe'),
  ('Rozdzielnica natynkowa 36 modułów IP40', 'material', cat_rozdzielnice_id, 'szt', 0, 165.00, 'Rozdzielnica natynkowa duża', 'Rozdzielnice natynkowe'),
  ('Rozdzielnica natynkowa 48 modułów IP40', 'material', cat_rozdzielnice_id, 'szt', 0, 210.00, 'Rozdzielnica natynkowa bardzo duża', 'Rozdzielnice natynkowe'),
  ('Rozdzielnica natynkowa 72 moduły IP40', 'material', cat_rozdzielnice_id, 'szt', 0, 310.00, 'Rozdzielnica natynkowa ogromna', 'Rozdzielnice natynkowe'),
  
  -- Rozdzielnice hermetyczne
  ('Rozdzielnica hermetyczna 12 modułów IP65', 'material', cat_rozdzielnice_id, 'szt', 0, 150.00, 'Rozdzielnica wodoodporna', 'Rozdzielnice hermetyczne'),
  ('Rozdzielnica hermetyczna 24 moduły IP65', 'material', cat_rozdzielnice_id, 'szt', 0, 220.00, 'Rozdzielnica wodoodporna duża', 'Rozdzielnice hermetyczne'),
  
  -- Skrzynki i obudowy
  ('Skrzynka licznikowa 1-fazowa', 'material', cat_rozdzielnice_id, 'szt', 0, 95.00, 'Skrzynka dla licznika 1F', 'Skrzynki licznikowe'),
  ('Skrzynka licznikowa 3-fazowa', 'material', cat_rozdzielnice_id, 'szt', 0, 140.00, 'Skrzynka dla licznika 3F', 'Skrzynki licznikowe'),
  ('Skrzynka przyłączeniowa z bezpiecznikami', 'material', cat_rozdzielnice_id, 'szt', 0, 180.00, 'Skrzynka zasilająca z NH', 'Skrzynki licznikowe'),
  
  -- Wyłączniki nadprądowe (MCB)
  ('Wyłącznik nadprądowy 1P B10 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 18.00, 'Automat 1P 10A B', 'Wyłączniki nadprądowe'),
  ('Wyłącznik nadprądowy 1P B16 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 18.00, 'Automat 1P 16A B', 'Wyłączniki nadprądowe'),
  ('Wyłącznik nadprądowy 1P C10 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 19.00, 'Automat 1P 10A C', 'Wyłączniki nadprądowe'),
  ('Wyłącznik nadprądowy 1P C16 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 19.00, 'Automat 1P 16A C', 'Wyłączniki nadprądowe'),
  ('Wyłącznik nadprądowy 1P C20 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 19.00, 'Automat 1P 20A C', 'Wyłączniki nadprądowe'),
  ('Wyłącznik nadprądowy 3P C16 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 55.00, 'Automat 3P 16A C', 'Wyłączniki nadprądowe'),
  ('Wyłącznik nadprądowy 3P C25 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 55.00, 'Automat 3P 25A C', 'Wyłączniki nadprądowe'),
  ('Wyłącznik nadprądowy 3P C32 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 60.00, 'Automat 3P 32A C', 'Wyłączniki nadprądowe'),
  ('Wyłącznik nadprądowy 3P C40 6kA', 'material', cat_rozdzielnice_id, 'szt', 0, 65.00, 'Automat 3P 40A C', 'Wyłączniki nadprądowe'),
  
  -- Wyłączniki różnicowoprądowe (RCD)
  ('Wyłącznik różnicowoprądowy 2P 25A 30mA AC', 'material', cat_rozdzielnice_id, 'szt', 0, 85.00, 'RCD 2P 30mA', 'Wyłączniki różnicowoprądowe'),
  ('Wyłącznik różnicowoprądowy 2P 40A 30mA AC', 'material', cat_rozdzielnice_id, 'szt', 0, 90.00, 'RCD 2P 40A 30mA', 'Wyłączniki różnicowoprądowe'),
  ('Wyłącznik różnicowoprądowy 4P 25A 30mA AC', 'material', cat_rozdzielnice_id, 'szt', 0, 150.00, 'RCD 4P 30mA', 'Wyłączniki różnicowoprądowe'),
  ('Wyłącznik różnicowoprądowy 4P 40A 30mA AC', 'material', cat_rozdzielnice_id, 'szt', 0, 160.00, 'RCD 4P 40A 30mA', 'Wyłączniki różnicowoprądowe'),
  ('Wyłącznik różnicowoprądowy 4P 63A 30mA AC', 'material', cat_rozdzielnice_id, 'szt', 0, 210.00, 'RCD 4P 63A 30mA', 'Wyłączniki różnicowoprądowe'),
  
  -- Wyłączniki RCBO (różnicowo-nadprądowe)
  ('Wyłącznik RCBO 1P+N C16 30mA', 'material', cat_rozdzielnice_id, 'szt', 0, 110.00, 'RCBO 16A 30mA', 'Wyłączniki RCBO'),
  ('Wyłącznik RCBO 1P+N C20 30mA', 'material', cat_rozdzielnice_id, 'szt', 0, 110.00, 'RCBO 20A 30mA', 'Wyłączniki RCBO'),
  ('Wyłącznik RCBO 1P+N C25 30mA', 'material', cat_rozdzielnice_id, 'szt', 0, 115.00, 'RCBO 25A 30mA', 'Wyłączniki RCBO'),
  
  -- Elementy dodatkowe
  ('Rozłącznik izolacyjny 2P 63A', 'material', cat_rozdzielnice_id, 'szt', 0, 65.00, 'Główny wyłącznik 2P', 'Rozłączniki'),
  ('Rozłącznik izolacyjny 4P 63A', 'material', cat_rozdzielnice_id, 'szt', 0, 120.00, 'Główny wyłącznik 4P', 'Rozłączniki'),
  ('Ogranicznik przepięć SPD Typ 2 (1P+N)', 'material', cat_rozdzielnice_id, 'szt', 0, 140.00, 'Ochrona przeciwprzepięciowa', 'Ochrona przepięciowa'),
  ('Ogranicznik przepięć SPD Typ 2 (3P+N)', 'material', cat_rozdzielnice_id, 'szt', 0, 280.00, 'Ochrona przeciwprzepięciowa 3F', 'Ochrona przepięciowa'),
  ('Przekaźnik zmierzchowy 16A', 'material', cat_rozdzielnice_id, 'szt', 0, 85.00, 'Przekaźnik światło-zmrok', 'Przekaźniki'),
  ('Przekaźnik czasowy 16A', 'material', cat_rozdzielnice_id, 'szt', 0, 95.00, 'Timer elektroniczny 16A', 'Przekaźniki'),
  ('Licznik energii 1-fazowy', 'material', cat_rozdzielnice_id, 'szt', 0, 120.00, 'Licznik 230V', 'Liczniki energii'),
  ('Licznik energii 3-fazowy', 'material', cat_rozdzielnice_id, 'szt', 0, 180.00, 'Licznik 400V', 'Liczniki energii'),
  ('Szyna zerowa N na szynę TH35', 'material', cat_rozdzielnice_id, 'szt', 0, 25.00, 'Listwa zaciskowa N', 'Akcesoria rozdzielnic'),
  ('Szyna ochronna PE na szynę TH35', 'material', cat_rozdzielnice_id, 'szt', 0, 25.00, 'Listwa zaciskowa PE', 'Akcesoria rozdzielnic')
  ON CONFLICT (name, COALESCE(category_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO NOTHING;

  RAISE NOTICE 'Dodano rozdzielnice i elementy - część 3b';

END $$;
