-- =====================================================
-- MASSIVE CATALOG SEED PART 2: MATERIALS
-- Description: Polish electrical materials - realistic 2024-2025 prices
-- =====================================================

DO $$
DECLARE
  default_object_type_id UUID;
  cat_okablowanie UUID;
  cat_trasy UUID;
  cat_przygotowanie UUID;
  cat_rozdzielnice UUID;
  cat_oswietlenie UUID;
BEGIN

  SELECT id INTO default_object_type_id FROM object_types LIMIT 1;
  SELECT id INTO cat_okablowanie FROM catalog_categories WHERE name = 'Okablowanie' LIMIT 1;
  SELECT id INTO cat_trasy FROM catalog_categories WHERE name = 'Trasy Kablowe' LIMIT 1;
  SELECT id INTO cat_przygotowanie FROM catalog_categories WHERE name = 'Przygotowanie' LIMIT 1;
  SELECT id INTO cat_rozdzielnice FROM catalog_categories WHERE name = 'Rozdzielnice' LIMIT 1;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;

  -- =====================================================
  -- MATERIAŁY (MATERIALS)
  -- =====================================================

  -- SUBCATEGORY: Kable YDYp (Residential cables)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 3x1.5mm²', 'Przewód oświetleniowy', 'm', 0, 2.50, 'material', true),
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 3x2.5mm²', 'Przewód gniazdkowy', 'm', 0, 3.80, 'material', true),
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 5x1.5mm²', '3-fazowy oświetlenie', 'm', 0, 4.20, 'material', true),
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 5x2.5mm²', '3-fazowy gniazda', 'm', 0, 6.50, 'material', true),
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 5x4mm²', '3-fazowy zasilanie', 'm', 0, 10.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 5x6mm²', 'Zasilanie obiegu', 'm', 0, 14.50, 'material', true),
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 5x10mm²', 'Zasilanie główne', 'm', 0, 23.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 5x16mm²', 'Zasilanie budynku', 'm', 0, 36.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YDYp', 'Kabel YDYp 5x25mm²', 'Główne zasilanie', 'm', 0, 55.00, 'material', true);

  -- SUBCATEGORY: Kable YKY (Industrial/outdoor cables)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 3x1.5mm²', 'Niskiego napięcia', 'm', 0, 3.20, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 3x2.5mm²', 'Standardowy obwód', 'm', 0, 4.80, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x2.5mm²', '3-fazowy standard', 'm', 0, 7.80, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x4mm²', '3-fazowy wzmocniony', 'm', 0, 12.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x6mm²', 'Zasilanie maszyn', 'm', 0, 17.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x10mm²', 'Przemysłowy standard', 'm', 0, 27.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x16mm²', 'Zasilanie rozdzielnicy', 'm', 0, 42.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x25mm²', 'Główny zasilający', 'm', 0, 65.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x35mm²', 'Zasilanie budynku', 'm', 0, 90.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x50mm²', 'Główne zasilanie obiektu', 'm', 0, 130.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable YKY', 'Kabel YKY 5x70mm²', 'Przemysłowe zasilanie', 'm', 0, 180.00, 'material', true);

  -- SUBCATEGORY: Kable OWY (Fire-resistant cables)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_okablowanie, 'Kable OWY', 'Kabel OWY 3x1.5mm²', 'Ognioodporny', 'm', 0, 5.50, 'material', true),
    (NULL, cat_okablowanie, 'Kable OWY', 'Kabel OWY 3x2.5mm²', 'Ognioodporny wzmocniony', 'm', 0, 8.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable OWY', 'Kabel OWY 5x2.5mm²', 'Ognioodporny 3-fazowy', 'm', 0, 13.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable OWY', 'Kabel OWY 5x4mm²', 'Dla systemów bezpieczeństwa', 'm', 0, 19.00, 'material', true);

  -- SUBCATEGORY: Kable HDGS (Halogen-free cables)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_okablowanie, 'Kable HDGS', 'Kabel HDGS 3x1.5mm²', 'Bezhalogenowy', 'm', 0, 6.20, 'material', true),
    (NULL, cat_okablowanie, 'Kable HDGS', 'Kabel HDGS 3x2.5mm²', 'Bezhalogenowy standard', 'm', 0, 9.00, 'material', true),
    (NULL, cat_okablowanie, 'Kable HDGS', 'Kabel HDGS 5x2.5mm²', 'Bezhalogenowy 3-fazowy', 'm', 0, 14.50, 'material', true),
    (NULL, cat_okablowanie, 'Kable HDGS', 'Kabel HDGS 5x4mm²', 'Dla budynków publicznych', 'm', 0, 21.00, 'material', true);

  -- SUBCATEGORY: Puszki (Junction boxes)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_przygotowanie, 'Puszki podtynkowe', 'Puszka p/t fi60 płytka', 'Standardowa głębokość 40mm', 'szt', 0, 2.50, 'material', true),
    (NULL, cat_przygotowanie, 'Puszki podtynkowe', 'Puszka p/t fi60 głęboka', 'Głęboka 60mm', 'szt', 0, 4.00, 'material', true),
    (NULL, cat_przygotowanie, 'Puszki podtynkowe', 'Puszka p/t fi60 z komorą', 'Z dodatkową komorą', 'szt', 0, 5.50, 'material', true),
    (NULL, cat_przygotowanie, 'Puszki podtynkowe', 'Puszka p/t podwójna pozioma', 'Dla 2 gniazd', 'szt', 0, 6.00, 'material', true),
    (NULL, cat_przygotowanie, 'Puszki podtynkowe', 'Puszka p/t potrójna pozioma', 'Dla 3 gniazd', 'szt', 0, 8.50, 'material', true),
    (NULL, cat_przygotowanie, 'Puszki podtynkowe', 'Puszka p/t do pustych ścian', 'Dla gipsokarton', 'szt', 0, 3.50, 'material', true),
    (NULL, cat_przygotowanie, 'Puszki rozgałęźne', 'Puszka rozgałęźna p/t fi80', 'Rozgałęźna okrągła', 'szt', 0, 4.50, 'material', true),
    (NULL, cat_przygotowanie, 'Puszki rozgałęźne', 'Puszka rozgałęźna p/t 100x100mm', 'Duża rozgałęźna', 'szt', 0, 7.00, 'material', true),
    (NULL, cat_przygotowanie, 'Puszki rozgałęźne', 'Puszka rozgałęźna n/t IP55', 'Hermetyczna', 'szt', 0, 12.00, 'material', true);

  -- SUBCATEGORY: Rury karbowane (Corrugated pipes)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi16 lekka', 'Dla oświetlenia', 'm', 0, 0.80, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi16 ciężka (750N)', 'Wzmocniona', 'm', 0, 1.20, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi20 lekka', 'Standardowa', 'm', 0, 1.00, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi20 ciężka (750N)', 'Wzmocniona', 'm', 0, 1.50, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi25 lekka', 'Dla większych kabli', 'm', 0, 1.30, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi25 ciężka (750N)', 'Wzmocniona', 'm', 0, 1.90, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi32 lekka', 'Dla mocnych linii', 'm', 0, 1.80, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi32 ciężka (750N)', 'Maksymalna ochrona', 'm', 0, 2.60, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi40 ciężka (750N)', 'Dla przemysłowych kabli', 'm', 0, 3.50, 'material', true),
    (NULL, cat_trasy, 'Rury karbowane', 'Rura gofr. PCV fi50 ciężka (750N)', 'Największa', 'm', 0, 4.80, 'material', true);

  -- SUBCATEGORY: Koryta kablowe (Cable trays)
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_trasy, 'Koryta kablowe', 'Koryto kablowe 50x50mm', 'Mała trasa', 'm', 0, 18.00, 'material', true),
    (NULL, cat_trasy, 'Koryta kablowe', 'Koryto kablowe 100x50mm', 'Standardowa trasa', 'm', 0, 25.00, 'material', true),
    (NULL, cat_trasy, 'Koryta kablowe', 'Koryto kablowe 150x50mm', 'Średnia trasa', 'm', 0, 32.00, 'material', true),
    (NULL, cat_trasy, 'Koryta kablowe', 'Koryto kablowe 200x50mm', 'Duża trasa', 'm', 0, 40.00, 'material', true),
    (NULL, cat_trasy, 'Koryta kablowe', 'Koryto kablowe 300x50mm', 'Przemysłowa trasa', 'm', 0, 55.00, 'material', true),
    (NULL, cat_trasy, 'Drabinki kablowe', 'Drabinka kablowa 100x50mm', 'Lekka konstrukcja', 'm', 0, 30.00, 'material', true),
    (NULL, cat_trasy, 'Drabinki kablowe', 'Drabinka kablowa 200x50mm', 'Dla ciężkich kabli', 'm', 0, 45.00, 'material', true),
    (NULL, cat_trasy, 'Drabinki kablowe', 'Drabinka kablowa 300x50mm', 'Maksymalna', 'm', 0, 65.00, 'material', true);

END $$;
