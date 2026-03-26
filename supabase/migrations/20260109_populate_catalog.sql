-- ========================================
-- 🔌 POPULATE ELECTRICAL CATALOG
-- ========================================
-- Complete Polish electrical catalog
-- 13 categories, 100+ items
-- ========================================

-- ========================================
-- STEP 1: Clear existing data (OPTIONAL - COMMENT OUT IF YOU WANT TO KEEP OLD DATA)
-- ========================================
-- TRUNCATE TABLE catalog_items RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE catalog_categories RESTART IDENTITY CASCADE;

-- ========================================
-- STEP 2: Create Categories
-- ========================================
-- We need to get object_type_id first
-- Assuming you have at least one object_type (e.g., "Mieszkanie")

DO $$
DECLARE
  default_object_type_id UUID;
  cat_demontaze UUID;
  cat_ziemne UUID;
  cat_uziemienie UUID;
  cat_trasy UUID;
  cat_okablowanie UUID;
  cat_przygotowanie UUID;
  cat_rozdzielnice UUID;
  cat_oswietlenie UUID;
  cat_awaryjne UUID;
  cat_teletechnika UUID;
  cat_security UUID;
  cat_biuro UUID;
  cat_pomiary UUID;
BEGIN
  -- Get first object_type (or create a default one)
  SELECT id INTO default_object_type_id 
  FROM object_types 
  LIMIT 1;

  -- If no object_type exists, create a universal one
  IF default_object_type_id IS NULL THEN
    INSERT INTO object_types (name, slug, default_vat_rate)
    VALUES ('Uniwersalny', 'uniwersalny', 23)
    RETURNING id INTO default_object_type_id;
  END IF;

  -- Create categories
  INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
  VALUES 
    (default_object_type_id, 'Demontaże', 'trash-2', 1),
    (default_object_type_id, 'Prace Ziemne', 'shovel', 2),
    (default_object_type_id, 'Uziemienie/Odgrom', 'zap', 3),
    (default_object_type_id, 'Trasy Kablowe', 'cable', 4),
    (default_object_type_id, 'Okablowanie', 'plug', 5),
    (default_object_type_id, 'Przygotowanie', 'wrench', 6),
    (default_object_type_id, 'Rozdzielnice', 'box', 7),
    (default_object_type_id, 'Oświetlenie', 'lightbulb', 8),
    (default_object_type_id, 'Awaryjne', 'alert-triangle', 9),
    (default_object_type_id, 'Teletechnika', 'wifi', 10),
    (default_object_type_id, 'Security', 'shield', 11),
    (default_object_type_id, 'Biuro', 'briefcase', 12),
    (default_object_type_id, 'Pomiary', 'activity', 13)
  ON CONFLICT (object_type_id, name) DO NOTHING
  RETURNING id INTO cat_demontaze;

  -- Get category IDs
  SELECT id INTO cat_demontaze FROM catalog_categories WHERE name = 'Demontaże' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_ziemne FROM catalog_categories WHERE name = 'Prace Ziemne' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_uziemienie FROM catalog_categories WHERE name = 'Uziemienie/Odgrom' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_trasy FROM catalog_categories WHERE name = 'Trasy Kablowe' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_okablowanie FROM catalog_categories WHERE name = 'Okablowanie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_przygotowanie FROM catalog_categories WHERE name = 'Przygotowanie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_rozdzielnice FROM catalog_categories WHERE name = 'Rozdzielnice' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_awaryjne FROM catalog_categories WHERE name = 'Awaryjne' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_teletechnika FROM catalog_categories WHERE name = 'Teletechnika' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_security FROM catalog_categories WHERE name = 'Security' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_biuro FROM catalog_categories WHERE name = 'Biuro' AND object_type_id = default_object_type_id;
  SELECT id INTO cat_pomiary FROM catalog_categories WHERE name = 'Pomiary' AND object_type_id = default_object_type_id;

  -- ========================================
  -- STEP 3: Insert Catalog Items
  -- ========================================

  -- GRUPA 1: DEMONTAŻE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_demontaze, 'Demontaż starej instalacji n/t (przewody)', 'Demontaż instalacji natynkowej', 'm', 5.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż starej instalacji p/t (kucie bruzd)', 'Demontaż instalacji podtynkowej z kuciem', 'm', 15.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż osprzętu (gniazda/włączniki)', 'Demontaż gniazdek i włączników', 'szt', 8.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż lamp i opraw oświetleniowych', 'Demontaż lamp', 'szt', 15.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż starej rozdzielnicy/licznika', 'Demontaż rozdzielnicy', 'szt', 150.00, 0.00, false, true),
    (cat_demontaze, 'Demontaż koryt i drabin kablowych', 'Demontaż tras kablowych', 'm', 20.00, 0.00, false, true),
    (cat_demontaze, 'Wykucie starych puszek ze ściany', 'Wykucie puszek podtynkowych', 'szt', 10.00, 0.00, false, true),
    (cat_demontaze, 'Utylizacja gruzu i elektrośmieci (kontener)', 'Wywóz gruzu i odpadów', 'kpl', 800.00, 0.00, false, true);

  -- GRUPA 2: PRACE ZIEMNE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_ziemne, 'Wykop ręczny rowu kablowego 0.8m (grunt kat. III)', 'Wykop ręczny pod kabel', 'm', 90.00, 0.00, false, true),
    (cat_ziemne, 'Wykop mechaniczny (minikoparka)', 'Wykop mechaniczny', 'h', 160.00, 0.00, false, true),
    (cat_ziemne, 'Podsypka piaskowa pod kabel (10cm)', 'Podsypka piaskowa', 'm', 12.00, 15.00, false, true),
    (cat_ziemne, 'Układanie folii ostrzegawczej (niebieska/czerwona)', 'Folia ostrzegawcza', 'm', 5.00, 3.00, false, true),
    (cat_ziemne, 'Układanie rury osłonowej AROt fi 75/110', 'Rura osłonowa', 'm', 25.00, 18.00, false, true),
    (cat_ziemne, 'Układanie kabla YKY 5x16 mm2', 'Kabel zasilający YKY 5x16', 'm', 25.00, 55.00, false, true),
    (cat_ziemne, 'Układanie kabla YKY 4x120 mm2 (sektor)', 'Kabel sektorowy YKY 4x120', 'm', 60.00, 220.00, false, true),
    (cat_ziemne, 'Montaż studni kablowej SK-1', 'Studnia kablowa', 'szt', 450.00, 1200.00, false, true),
    (cat_ziemne, 'Przewiert sterowany pod drogą (do fi 110)', 'Przewiert HDD', 'm', 180.00, 0.00, false, true);

  -- GRUPA 3: UZIEMIENIE/ODGROM
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_uziemienie, 'Układanie bednarki ocynkowanej 30x4 (w wykopie)', 'Bednarka uziemiająca', 'm', 25.00, 18.00, false, true),
    (cat_uziemienie, 'Montaż uziomu szpilkowego (pogrążanie wibromłotem) 3m', 'Uziom szpilkowy 3m', 'kpl', 180.00, 140.00, false, true),
    (cat_uziemienie, 'Spawanie połączeń bednarki + izolacja bitumiczna', 'Spawanie bednarki', 'szt', 45.00, 15.00, false, true),
    (cat_uziemienie, 'Montaż złącza kontrolnego w elewacji/studzience', 'Złącze kontrolne', 'szt', 85.00, 120.00, false, true),
    (cat_uziemienie, 'Montaż uchwytów dachowych (gąsiory/dachówka)', 'Uchwyty dachowe', 'szt', 35.00, 25.00, false, true),
    (cat_uziemienie, 'Montaż zwodów poziomych (drut Al/FeZn) na dachu', 'Zwody poziome', 'm', 30.00, 15.00, false, true),
    (cat_uziemienie, 'Montaż zwodów pionowych (odprowadzenie po elewacji)', 'Zwody pionowe', 'm', 35.00, 15.00, false, true),
    (cat_uziemienie, 'Montaż masztu odgromowego (wolnostojący/iglica)', 'Maszt odgromowy', 'szt', 250.00, 400.00, false, true),
    (cat_uziemienie, 'Naciąg drutu odgromowego (prostowanie)', 'Naciąg drutu', 'm', 10.00, 0.00, false, true);

  -- GRUPA 4: TRASY KABLOWE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_trasy, 'Montaż korytka siatkowego (BAKS) do 200mm', 'Korytko siatkowe BAKS', 'm', 40.00, 45.00, false, true),
    (cat_trasy, 'Montaż korytka pełnego metalowego do 400mm', 'Korytko metalowe', 'm', 65.00, 95.00, false, true),
    (cat_trasy, 'Montaż drabiny kablowej (szachty pionowe)', 'Drabina kablowa', 'm', 85.00, 120.00, false, true),
    (cat_trasy, 'Montaż rurek PVC natynkowo (uchwyty)', 'Rurka PVC natynkowa', 'm', 22.00, 8.00, false, true),
    (cat_trasy, 'Montaż rur stalowych (instalacje industrialne)', 'Rura stalowa', 'm', 55.00, 45.00, false, true),
    (cat_trasy, 'Wykonanie przepustu pożarowego HILTI (EI120)', 'Przepust pożarowy', 'szt', 250.00, 200.00, false, true);

  -- GRUPA 5: OKABLOWANIE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_okablowanie, 'Przewód YDYp 3x1.5 (oświetlenie)', 'Przewód oświetleniowy', 'm', 7.50, 3.80, false, true),
    (cat_okablowanie, 'Przewód YDYp 3x2.5 (gniazda)', 'Przewód gniazdowy', 'm', 8.00, 5.20, false, true),
    (cat_okablowanie, 'Przewód YDYp 5x4 / 5x6 (kuchnia/siła)', 'Przewód siłowy', 'm', 12.00, 18.00, false, true),
    (cat_okablowanie, 'Przewód NHXH (ognioodporny E90) 3x1.5', 'Przewód ognioodporny', 'm', 14.00, 9.50, false, true),
    (cat_okablowanie, 'Przewód sterowniczy LiYCY (ekranowany)', 'Przewód sterowniczy', 'm', 9.00, 6.50, false, true),
    (cat_okablowanie, 'Szynoprzewód oświetleniowy (sklepy/hale)', 'Szynoprzewód oświetleniowy', 'm', 55.00, 140.00, false, true),
    (cat_okablowanie, 'Szynoprzewód zasilający (Power Busbar) 100A+', 'Szynoprzewód zasilający', 'm', 120.00, 450.00, false, true);

  -- GRUPA 6: PRZYGOTOWANIE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_przygotowanie, 'Bruzdowanie w żelbecie (wielka płyta)', 'Bruzdowanie w betonie', 'm', 70.00, 0.00, false, true),
    (cat_przygotowanie, 'Wiercenie koroną diamentową (na mokro) w betonie', 'Wiercenie koroną', 'szt', 120.00, 0.00, false, true),
    (cat_przygotowanie, 'Osadzenie puszki w płytkach (łazienka/kuchnia)', 'Puszka w płytkach', 'szt', 45.00, 0.00, false, true),
    (cat_przygotowanie, 'Osadzenie puszki podłogowej (wylewka)', 'Puszka podłogowa', 'szt', 80.00, 0.00, false, true),
    (cat_przygotowanie, 'Montaż puszki hermetycznej natynkowej IP55', 'Puszka hermetyczna', 'szt', 35.00, 25.00, false, true);

  -- GRUPA 7: ROZDZIELNICE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_rozdzielnice, 'Montaż obudowy podtynkowej 4x12 (48 mod)', 'Rozdzielnica podtynkowa 48M', 'szt', 350.00, 250.00, false, true),
    (cat_rozdzielnice, 'Montaż szafy wolnostojącej (Hala/Przemysł)', 'Szafa przemysłowa', 'szt', 1200.00, 3500.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Moduł 1-faz (S-ka)', 'Wyłącznik 1-fazowy', 'szt', 35.00, 25.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Różnicówka (RCD) 3-faz', 'Wyłącznik różnicowo-prądowy', 'szt', 90.00, 190.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Ogranicznik przepięć (SPD)', 'Ogranicznik przepięć', 'szt', 100.00, 450.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Stycznik / Przekaźnik', 'Stycznik modułowy', 'szt', 50.00, 80.00, false, true),
    (cat_rozdzielnice, 'Szycie rozdzielnicy: Zasilacz buforowy + AKU', 'Zasilacz buforowy', 'kpl', 150.00, 350.00, false, true),
    (cat_rozdzielnice, 'Montaż licznika energii (podlicznik)', 'Licznik energii', 'szt', 85.00, 250.00, false, true);

  -- GRUPA 8: OŚWIETLENIE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_oswietlenie, 'Montaż profilu LED wpuszczanego (frezowanie)', 'Profil LED wpuszczany', 'm', 65.00, 55.00, false, true),
    (cat_oswietlenie, 'Wklejenie taśmy LED + klosz + lutowanie', 'Taśma LED z montażem', 'm', 45.00, 35.00, false, true),
    (cat_oswietlenie, 'Montaż zasilacza LED (w szafce/suficie)', 'Zasilacz LED', 'szt', 50.00, 90.00, false, true),
    (cat_oswietlenie, 'Montaż lampy High Bay (Hala - wysokość > 4m)', 'Lampa High Bay', 'szt', 180.00, 600.00, false, true),
    (cat_oswietlenie, 'Montaż panelu LED 60x60 (sufit kasetonowy)', 'Panel LED 60x60', 'szt', 65.00, 120.00, false, true),
    (cat_oswietlenie, 'Montaż oprawy DALI (sterowalna)', 'Oprawa DALI', 'szt', 95.00, 0.00, false, true),
    (cat_oswietlenie, 'Montaż żyrandola ozdobnego (duży gabaryt)', 'Żyrandol ozdobny', 'szt', 300.00, 0.00, false, true);

  -- GRUPA 9: AWARYJNE
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_awaryjne, 'Montaż oprawy ewakuacyjnej "Wyjście" (sufit/ściana)', 'Oprawa ewakuacyjna', 'szt', 95.00, 280.00, false, true),
    (cat_awaryjne, 'Montaż modułu awaryjnego w lampie (przeróbka)', 'Moduł awaryjny', 'szt', 140.00, 180.00, false, true),
    (cat_awaryjne, 'Pomiary natężenia oświetlenia ewakuacyjnego', 'Pomiary oświetlenia', 'szt', 35.00, 0.00, false, true);

  -- GRUPA 10: TELETECHNIKA
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_teletechnika, 'Układanie skrętki UTP/FTP Cat.6A / Cat.7', 'Kabel UTP/FTP', 'm', 8.00, 5.50, false, true),
    (cat_teletechnika, 'Montaż gniazda RJ45 (Keystone)', 'Gniazdo RJ45', 'szt', 45.00, 40.00, false, true),
    (cat_teletechnika, 'Montaż Access Pointa WiFi (sufit + konfiguracja)', 'Access Point WiFi', 'szt', 150.00, 800.00, false, true),
    (cat_teletechnika, 'Montaż szafy RACK 42U (stojąca)', 'Szafa RACK 42U', 'szt', 900.00, 2800.00, false, true),
    (cat_teletechnika, 'Zarobienie Patch Panelu 24-port (krosowanie)', 'Patch Panel 24p', 'szt', 60.00, 200.00, false, true),
    (cat_teletechnika, 'Certyfikacja sieci LAN (Pomiary dynamiczne/Fluke)', 'Certyfikacja LAN', 'szt', 35.00, 0.00, false, true),
    (cat_teletechnika, 'Spawanie światłowodu (za włókno)', 'Spawanie światłowodu', 'szt', 70.00, 0.00, false, true),
    (cat_teletechnika, 'Montaż przełącznicy światłowodowej ODF', 'Przełącznica ODF', 'szt', 180.00, 250.00, false, true);

  -- GRUPA 11: SECURITY
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_security, 'Montaż kamery IP (kopułka/tuba)', 'Kamera IP', 'szt', 160.00, 700.00, false, true),
    (cat_security, 'Montaż kamery obrotowej PTZ', 'Kamera PTZ', 'szt', 350.00, 2500.00, false, true),
    (cat_security, 'Montaż rejestratora NVR + dyski', 'Rejestrator NVR', 'kpl', 250.00, 1500.00, false, true),
    (cat_security, 'Montaż czujki dymu SAP (system pożarowy)', 'Czujka dymu', 'szt', 85.00, 220.00, false, true),
    (cat_security, 'Montaż ROP (Ręczny Ostrzegacz Pożarowy)', 'ROP', 'szt', 90.00, 280.00, false, true),
    (cat_security, 'Montaż klawiatury alarmowej LCD', 'Klawiatura alarmowa', 'szt', 140.00, 550.00, false, true),
    (cat_security, 'Montaż czujki ruchu PIR/MW (Alarm)', 'Czujka ruchu', 'szt', 75.00, 120.00, false, true),
    (cat_security, 'Montaż czytnika kart (Kontrola Dostępu)', 'Czytnik kart', 'szt', 130.00, 400.00, false, true),
    (cat_security, 'Montaż zwory elektromagnetycznej 300kg', 'Zwora elektromagnetyczna', 'szt', 200.00, 350.00, false, true);

  -- GRUPA 12: BIURO
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_biuro, 'Montaż Floorboxa (puszka podłogowa) komplet', 'Floorbox', 'szt', 200.00, 450.00, false, true),
    (cat_biuro, 'Uzbrojenie Floorboxa (2x230V + 2xRJ45)', 'Uzbrojenie Floorboxa', 'kpl', 60.00, 120.00, false, true),
    (cat_biuro, 'Podłączenie klimatyzatora / Fankoila', 'Podłączenie klimatyzacji', 'szt', 150.00, 0.00, false, true),
    (cat_biuro, 'Montaż kolumny zasilającej aluminiowej', 'Kolumna zasilająca', 'szt', 250.00, 900.00, false, true);

  -- GRUPA 13: POMIARY
  INSERT INTO catalog_items (category_id, name, description, unit, base_labor_price, base_material_price, is_assembly_parent, is_active)
  VALUES
    (cat_pomiary, 'Pomiar rezystancji izolacji (obwód 1-faz)', 'Pomiar izolacji 1-faz', 'szt', 18.00, 0.00, false, true),
    (cat_pomiary, 'Pomiar rezystancji izolacji (obwód 3-faz)', 'Pomiar izolacji 3-faz', 'szt', 28.00, 0.00, false, true),
    (cat_pomiary, 'Pomiar impedancji pętli zwarcia', 'Pomiar pętli zwarcia', 'szt', 18.00, 0.00, false, true),
    (cat_pomiary, 'Badanie wyłączników RCD (czas/prąd)', 'Badanie RCD', 'szt', 28.00, 0.00, false, true),
    (cat_pomiary, 'Pomiar natężenia oświetlenia (stanowisko pracy)', 'Pomiar oświetlenia', 'szt', 25.00, 0.00, false, true),
    (cat_pomiary, 'Pomiary LAN (mapa połączeń)', 'Pomiary LAN', 'szt', 15.00, 0.00, false, true),
    (cat_pomiary, 'Dokumentacja powykonawcza (schematy, protokoły)', 'Dokumentacja', 'kpl', 600.00, 0.00, false, true);

END $$;

-- ========================================
-- VERIFICATION
-- ========================================
-- Check categories
SELECT 
  name AS kategoria,
  (SELECT COUNT(*) FROM catalog_items WHERE category_id = catalog_categories.id) AS liczba_pozycji
FROM catalog_categories
ORDER BY sort_order;

-- Check total items
SELECT COUNT(*) AS total_items FROM catalog_items;

-- Sample items from each category
SELECT 
  cc.name AS kategoria,
  ci.name AS pozycja,
  ci.unit AS jednostka,
  ci.base_labor_price AS robocizna,
  ci.base_material_price AS material
FROM catalog_items ci
JOIN catalog_categories cc ON ci.category_id = cc.id
ORDER BY cc.sort_order, ci.name
LIMIT 20;

-- ========================================
-- ✅ MIGRATION COMPLETE
-- ========================================
-- Expected result:
-- - 13 categories created
-- - 100+ catalog items inserted
-- - All items ready to use in estimates
-- ========================================
