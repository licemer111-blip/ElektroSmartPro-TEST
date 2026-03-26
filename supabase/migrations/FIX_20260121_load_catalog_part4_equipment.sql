-- =====================================================
-- CATALOG LOAD PART 4: Equipment (Rozdzielnice + Materiały)
-- Final batch with switches, sockets, circuit breakers
-- =====================================================

DO $$
DECLARE
  cat_rozdzielnice UUID;
  cat_oswietlenie UUID;
  cat_okablowanie UUID;
  inserted_count INTEGER := 0;
BEGIN

  -- Get category IDs
  SELECT id INTO cat_rozdzielnice FROM catalog_categories WHERE name = 'Rozdzielnice' LIMIT 1;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_okablowanie FROM catalog_categories WHERE name = 'Okablowanie' LIMIT 1;

  -- =====================================================
  -- PUSZKI INSTALACYJNE (Junction Boxes)
  -- =====================================================
  
  INSERT INTO catalog_items (user_id, category_id, name, unit, base_labor_price, base_material_price, sub_category, type)
  VALUES
    -- Puszki podtynkowe
    (NULL, cat_okablowanie, 'Puszka podtynkowa fi60mm głęboka', 'szt', 8.00, 1.20, 'Puszki podtynkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka podtynkowa fi60mm płytka', 'szt', 7.50, 0.95, 'Puszki podtynkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka podtynkowa podwójna fi60mm', 'szt', 12.00, 2.20, 'Puszki podtynkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka podtynkowa potrójna fi60mm', 'szt', 15.00, 3.20, 'Puszki podtynkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka podtynkowa poczwórna fi60mm', 'szt', 18.00, 4.20, 'Puszki podtynkowe', 'mixed'),
    
    -- Puszki natynkowe
    (NULL, cat_okablowanie, 'Puszka natynkowa pojedyncza IP44', 'szt', 6.50, 3.80, 'Puszki natynkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka natynkowa podwójna IP44', 'szt', 9.00, 5.50, 'Puszki natynkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka natynkowa potrójna IP44', 'szt', 11.00, 7.20, 'Puszki natynkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka natynkowa IP65 hermetyczna', 'szt', 8.50, 6.80, 'Puszki natynkowe', 'mixed'),
    
    -- Puszki instalacyjne
    (NULL, cat_okablowanie, 'Puszka instalacyjna 100x100x50mm', 'szt', 10.00, 4.50, 'Puszki instalacyjne', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka instalacyjna 150x110x70mm', 'szt', 12.00, 6.80, 'Puszki instalacyjne', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka instalacyjna 190x150x100mm', 'szt', 15.00, 9.50, 'Puszki instalacyjne', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka instalacyjna 240x190x90mm', 'szt', 18.00, 12.80, 'Puszki instalacyjne', 'mixed'),
    (NULL, cat_okablowanie, 'Puszka instalacyjna 300x220x120mm', 'szt', 22.00, 18.50, 'Puszki instalacyjne', 'mixed'),
    
    -- =====================================================
    -- GNIAZDA I ŁĄCZNIKI (Sockets & Switches)
    -- =====================================================
    
    -- Gniazda pojedyncze
    (NULL, cat_okablowanie, 'Gniazdo wtyczkowe 230V z/u podtynk', 'szt', 12.00, 8.50, 'Gniazda wtyczkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo wtyczkowe 230V z/u natynk', 'szt', 10.00, 12.00, 'Gniazda wtyczkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo wtyczkowe 230V z/u IP44', 'szt', 13.00, 18.50, 'Gniazda wtyczkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo wtyczkowe 230V z/u IP65', 'szt', 15.00, 28.00, 'Gniazda wtyczkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo wtyczkowe podwójne z/u', 'szt', 15.00, 16.00, 'Gniazda wtyczkowe', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo wtyczkowe potrójne z/u', 'szt', 18.00, 24.00, 'Gniazda wtyczkowe', 'mixed'),
    
    -- Gniazda specjalne
    (NULL, cat_okablowanie, 'Gniazdo USB podwójne 5V 2.1A', 'szt', 18.00, 35.00, 'Gniazda specjalne', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo 230V + USB', 'szt', 20.00, 45.00, 'Gniazda specjalne', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo RJ45 kat.6 pojedyncze', 'szt', 15.00, 12.50, 'Gniazda teleinformatyczne', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo RJ45 kat.6 podwójne', 'szt', 22.00, 22.00, 'Gniazda teleinformatyczne', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo TV/SAT pojedyncze', 'szt', 18.00, 28.00, 'Gniazda antenowe', 'mixed'),
    (NULL, cat_okablowanie, 'Gniazdo TV/SAT końcowe', 'szt', 18.00, 32.00, 'Gniazda antenowe', 'mixed'),
    
    -- Łączniki
    (NULL, cat_okablowanie, 'Łącznik pojedynczy podtynkowy', 'szt', 10.00, 6.50, 'Łączniki', 'mixed'),
    (NULL, cat_okablowanie, 'Łącznik podwójny podtynkowy', 'szt', 12.00, 12.00, 'Łączniki', 'mixed'),
    (NULL, cat_okablowanie, 'Łącznik schodowy podtynkowy', 'szt', 11.00, 8.50, 'Łączniki', 'mixed'),
    (NULL, cat_okablowanie, 'Łącznik krzyżowy podtynkowy', 'szt', 13.00, 15.00, 'Łączniki', 'mixed'),
    (NULL, cat_okablowanie, 'Łącznik żaluzjowy podtynkowy', 'szt', 22.00, 45.00, 'Łączniki specjalne', 'mixed'),
    (NULL, cat_okablowanie, 'Ściemniacz obrotowy 60-400W', 'szt', 25.00, 68.00, 'Ściemniacze', 'mixed'),
    (NULL, cat_okablowanie, 'Ściemniacz dotykowy LED 10-250W', 'szt', 28.00, 95.00, 'Ściemniacze', 'mixed'),
    (NULL, cat_okablowanie, 'Termostat pomieszczeniowy podtynk', 'szt', 32.00, 85.00, 'Regulatory', 'mixed'),
    
    -- =====================================================
    -- ROZDZIELNICE (Distribution Boards)
    -- =====================================================
    
    -- Rozdzielnice mieszkaniowe
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x12 podtynkowa', 'szt', 55.00, 45.00, 'Rozdzielnice podtynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x18 podtynkowa', 'szt', 68.00, 65.00, 'Rozdzielnice podtynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x24 podtynkowa', 'szt', 85.00, 85.00, 'Rozdzielnice podtynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 2x12 podtynkowa', 'szt', 95.00, 95.00, 'Rozdzielnice podtynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 2x18 podtynkowa', 'szt', 120.00, 125.00, 'Rozdzielnice podtynkowe', 'mixed'),
    
    -- Rozdzielnice natynkowe
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x12 natynkowa IP40', 'szt', 45.00, 55.00, 'Rozdzielnice natynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x18 natynkowa IP40', 'szt', 58.00, 75.00, 'Rozdzielnice natynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x24 natynkowa IP40', 'szt', 75.00, 95.00, 'Rozdzielnice natynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 2x12 natynkowa IP40', 'szt', 85.00, 110.00, 'Rozdzielnice natynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 2x18 natynkowa IP40', 'szt', 105.00, 145.00, 'Rozdzielnice natynkowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 3x24 natynkowa IP40', 'szt', 165.00, 295.00, 'Rozdzielnice natynkowe', 'mixed'),
    
    -- Rozdzielnice hermetyczne
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x12 natynk IP65', 'szt', 55.00, 125.00, 'Rozdzielnice hermetyczne', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x18 natynk IP65', 'szt', 75.00, 165.00, 'Rozdzielnice hermetyczne', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozdzielnica 1x24 natynk IP65', 'szt', 95.00, 205.00, 'Rozdzielnice hermetyczne', 'mixed'),
    
    -- Aparatura modularna
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy B10 1P', 'szt', 12.00, 8.50, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy B16 1P', 'szt', 12.00, 8.50, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy B20 1P', 'szt', 12.00, 9.50, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy B25 1P', 'szt', 12.00, 10.50, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy B10 3P', 'szt', 18.00, 45.00, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy B16 3P', 'szt', 18.00, 45.00, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy B20 3P', 'szt', 18.00, 48.00, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy B25 3P', 'szt', 18.00, 52.00, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy C10 1P', 'szt', 12.00, 8.50, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy C16 1P', 'szt', 12.00, 8.50, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy C20 1P', 'szt', 12.00, 9.50, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy C25 1P', 'szt', 12.00, 10.50, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy C32 1P', 'szt', 15.00, 15.00, 'Wyłączniki nadprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik nadprądowy C40 1P', 'szt', 15.00, 18.50, 'Wyłączniki nadprądowe', 'mixed'),
    
    -- Wyłączniki różnicowoprądowe
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowoprądowy 25A/30mA 2P', 'szt', 22.00, 45.00, 'Wyłączniki różnicowoprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowoprądowy 40A/30mA 2P', 'szt', 22.00, 52.00, 'Wyłączniki różnicowoprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowoprądowy 63A/30mA 2P', 'szt', 25.00, 68.00, 'Wyłączniki różnicowoprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowoprądowy 25A/30mA 4P', 'szt', 28.00, 95.00, 'Wyłączniki różnicowoprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowoprądowy 40A/30mA 4P', 'szt', 28.00, 105.00, 'Wyłączniki różnicowoprądowe', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowoprądowy 63A/30mA 4P', 'szt', 32.00, 125.00, 'Wyłączniki różnicowoprądowe', 'mixed'),
    
    -- Różnicówki ochronne
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowo-nadprądowy B16/30mA 1P+N', 'szt', 22.00, 68.00, 'Wyłączniki RCD+nadprąd', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowo-nadprądowy C16/30mA 1P+N', 'szt', 22.00, 68.00, 'Wyłączniki RCD+nadprąd', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowo-nadprądowy C20/30mA 1P+N', 'szt', 22.00, 72.00, 'Wyłączniki RCD+nadprąd', 'mixed'),
    (NULL, cat_rozdzielnice, 'Wyłącznik różnicowo-nadprądowy C25/30mA 1P+N', 'szt', 22.00, 78.00, 'Wyłączniki RCD+nadprąd', 'mixed'),
    
    -- Pozostała aparatura
    (NULL, cat_rozdzielnice, 'Rozłącznik izolacyjny 2P 25A', 'szt', 18.00, 35.00, 'Rozłączniki', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozłącznik izolacyjny 4P 25A', 'szt', 25.00, 85.00, 'Rozłączniki', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozłącznik izolacyjny 4P 40A', 'szt', 28.00, 105.00, 'Rozłączniki', 'mixed'),
    (NULL, cat_rozdzielnice, 'Rozłącznik izolacyjny 4P 63A', 'szt', 32.00, 145.00, 'Rozłączniki', 'mixed'),
    (NULL, cat_rozdzielnice, 'Przekaźnik priorytetowy 16A', 'szt', 28.00, 125.00, 'Przekaźniki', 'mixed'),
    (NULL, cat_rozdzielnice, 'Przekaźnik zmierzchowy 16A', 'szt', 22.00, 65.00, 'Przekaźniki', 'mixed'),
    (NULL, cat_rozdzielnice, 'Zegar astronomiczny cyfrowy', 'szt', 35.00, 185.00, 'Regulatory', 'mixed'),
    (NULL, cat_rozdzielnice, 'Licznik energii 1-fazowy 80A MID', 'szt', 45.00, 125.00, 'Liczniki', 'mixed'),
    (NULL, cat_rozdzielnice, 'Licznik energii 3-fazowy 80A MID', 'szt', 65.00, 285.00, 'Liczniki', 'mixed'),
    
    -- =====================================================
    -- OŚWIETLENIE (Lighting)
    -- =====================================================
    
    -- Oprawy LED
    (NULL, cat_oswietlenie, 'Panel LED 60x60cm 40W 4000K', 'szt', 45.00, 95.00, 'Panele LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Panel LED 120x30cm 40W 4000K', 'szt', 48.00, 105.00, 'Panele LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Panel LED 120x60cm 60W 4000K', 'szt', 58.00, 165.00, 'Panele LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Downlight LED 18W 4000K fi225mm', 'szt', 28.00, 42.00, 'Downlighty LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Downlight LED 24W 4000K fi300mm', 'szt', 32.00, 58.00, 'Downlighty LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Oprawa LED 2x18W IP65 hermetyczna', 'szt', 45.00, 85.00, 'Oprawy przemysłowe LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Oprawa LED 2x36W IP65 hermetyczna', 'szt', 52.00, 125.00, 'Oprawy przemysłowe LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Halogen LED 50W 4000K IP65', 'szt', 38.00, 95.00, 'Halogeny LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Halogen LED 100W 4000K IP65', 'szt', 48.00, 155.00, 'Halogeny LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Halogen LED 200W 4000K IP65', 'szt', 68.00, 285.00, 'Halogeny LED', 'mixed'),
    
    -- Źródła światła
    (NULL, cat_oswietlenie, 'Żarówka LED E27 10W 4000K', 'szt', 3.00, 8.50, 'Żarówki LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Żarówka LED E27 15W 4000K', 'szt', 3.00, 12.50, 'Żarówki LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Żarówka LED GU10 5W 3000K', 'szt', 3.00, 6.50, 'Żarówki LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Żarówka LED GU10 7W 4000K', 'szt', 3.00, 8.50, 'Żarówki LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Świetlówka LED T8 18W 120cm 4000K', 'szt', 8.00, 18.50, 'Świetlówki LED', 'mixed'),
    (NULL, cat_oswietlenie, 'Świetlówka LED T8 24W 150cm 4000K', 'szt', 10.00, 24.00, 'Świetlówki LED', 'mixed')
  ON CONFLICT (user_id, name) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Equipment: % items inserted', inserted_count;

  RAISE NOTICE '=== COMPLETED: Part 4 (Equipment) loaded ===';
  RAISE NOTICE '=== ALL MIGRATIONS COMPLETE! Check your catalog! ===';

END $$;
