-- =====================================================
-- MASSIVE CATALOG SEED PART 5: ADVANCED LABOR
-- Description: Installation of complex equipment, programming, commissioning
-- =====================================================

DO $$
DECLARE
  default_object_type_id UUID;
  cat_rozdzielnice UUID;
  cat_oswietlenie UUID;
  cat_ppoz UUID;
  cat_security UUID;
  cat_smart_home UUID;
  cat_pomiary UUID;
  cat_przygotowanie UUID;
BEGIN

  SELECT id INTO default_object_type_id FROM object_types LIMIT 1;
  SELECT id INTO cat_rozdzielnice FROM catalog_categories WHERE name = 'Rozdzielnice' LIMIT 1;
  SELECT id INTO cat_oswietlenie FROM catalog_categories WHERE name = 'Oświetlenie' LIMIT 1;
  SELECT id INTO cat_ppoz FROM catalog_categories WHERE name = 'PPOŻ' LIMIT 1;
  SELECT id INTO cat_security FROM catalog_categories WHERE name = 'Security' LIMIT 1;
  SELECT id INTO cat_smart_home FROM catalog_categories WHERE name = 'Smart Home' LIMIT 1;
  SELECT id INTO cat_pomiary FROM catalog_categories WHERE name = 'Pomiary' LIMIT 1;
  SELECT id INTO cat_przygotowanie FROM catalog_categories WHERE name = 'Przygotowanie' LIMIT 1;

  -- =====================================================
  -- MONTAŻ ROZDZIELNIC (Distribution board installation)
  -- =====================================================

  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_rozdzielnice, 'Montaż rozdzielnic', 'Montaż rozdzielnicy 12M n/t', 'Z podłączeniem', 'szt', 180.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Montaż rozdzielnic', 'Montaż rozdzielnicy 12M p/t', 'Wbudowana', 'szt', 220.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Montaż rozdzielnic', 'Montaż rozdzielnicy 24M n/t', 'Standardowa', 'szt', 280.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Montaż rozdzielnic', 'Montaż rozdzielnicy 24M p/t', 'Wbudowana duża', 'szt', 350.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Montaż rozdzielnic', 'Montaż rozdzielnicy 36M', 'Dla domu', 'szt', 420.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Montaż rozdzielnic', 'Montaż rozdzielnicy 48M', 'Duża', 'szt', 550.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Montaż rozdzielnic', 'Montaż rozdzielnicy 72M', 'Dla biura', 'szt', 750.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Montaż rozdzielnic', 'Montaż rozdzielnicy 120M', 'Przemysłowa', 'szt', 1200.00, 0, 'labor', true);

  -- SUBCATEGORY: Kompletacja rozdzielnic
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_rozdzielnice, 'Kompletacja rozdzielnic', 'Montaż wyłącznika 1P w rozdzielnicy', 'Automat jednobiegunowy', 'szt', 25.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Kompletacja rozdzielnic', 'Montaż wyłącznika 3P w rozdzielnicy', 'Automat trójbiegunowy', 'szt', 40.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Kompletacja rozdzielnic', 'Montaż RCD 2P w rozdzielnicy', 'RCD 2-bieguny', 'szt', 35.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Kompletacja rozdzielnic', 'Montaż RCD 4P w rozdzielnicy', 'RCD 4-bieguny', 'szt', 50.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Kompletacja rozdzielnic', 'Montaż stycznika w rozdzielnicy', 'Stycznik', 'szt', 60.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Kompletacja rozdzielnic', 'Montaż przekaźnika kontroli napięcia', 'Przekaźnik kontroli', 'szt', 45.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Kompletacja rozdzielnic', 'Montaż wyłącznika zmierzchowego', 'Zmierzchowy wyłącznik', 'szt', 50.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Kompletacja rozdzielnic', 'Montaż zegara astronomicznego', 'Timer programowalny', 'szt', 65.00, 0, 'labor', true);

  -- SUBCATEGORY: Dokumentacja rozdzielnic
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_rozdzielnice, 'Dokumentacja rozdzielnic', 'Projekt rozdzielnicy do 24M', 'Schemat jednoliniowy', 'szt', 300.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Dokumentacja rozdzielnic', 'Projekt rozdzielnicy 24-72M', 'Schemat złożony', 'szt', 600.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Dokumentacja rozdzielnic', 'Projekt rozdzielnicy powyżej 72M', 'Schemat przemysłowy', 'szt', 1200.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Oznaczanie', 'Opisanie rozdzielnicy pełne', 'Opisy wszystkich obwodów', 'kpl', 120.00, 0, 'labor', true),
    (NULL, cat_rozdzielnice, 'Oznaczanie', 'Naklejki identyfikacyjne profesjonalne', 'Druk etykiet', 'kpl', 80.00, 0, 'labor', true);

  -- =====================================================
  -- MONTAŻ OŚWIETLENIA (Lighting installation)
  -- =====================================================

  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_oswietlenie, 'Montaż świetlówek', 'Montaż panelu LED 60x60cm', 'Na sufit', 'szt', 80.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż świetlówek', 'Montaż panelu LED 30x120cm', 'Prostokątny', 'szt', 90.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż downlightów', 'Montaż downlightu LED', 'Punktowy', 'szt', 50.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż downlightów', 'Montaż downlightu z wierceniem otworu', 'Z wierceniem', 'szt', 70.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż liniowych', 'Montaż oprawy liniowej 60cm', 'Liniowy', 'szt', 65.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż liniowych', 'Montaż oprawy liniowej 120cm', 'Długi', 'szt', 85.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż liniowych', 'Montaż oprawy liniowej 150cm', 'Najdłuższy', 'szt', 110.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż zewnętrznych', 'Montaż oprawy fasadowej', 'Fasadowy', 'szt', 120.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż zewnętrznych', 'Montaż reflektora LED', 'Reflektor', 'szt', 100.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż zewnętrznych', 'Montaż słupa oświetleniowego h=3m', 'Słup 3 metry', 'szt', 350.00, 0, 'labor', true),
    (NULL, cat_oswietlenie, 'Montaż zewnętrznych', 'Montaż słupa oświetleniowego h=5m', 'Słup 5 metrów', 'szt', 550.00, 0, 'labor', true);

  -- =====================================================
  -- SMART HOME PROGRAMMING
  -- =====================================================

  -- SUBCATEGORY: KNX Programming
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_smart_home, 'Programowanie KNX', 'Programowanie KNX - podstawowe', 'Do 20 adresów', 'kpl', 800.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Programowanie KNX', 'Programowanie KNX - średnie', '20-50 adresów', 'kpl', 1500.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Programowanie KNX', 'Programowanie KNX - złożone', '50-100 adresów', 'kpl', 2800.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Programowanie KNX', 'Programowanie KNX - bardzo złożone', 'Powyżej 100 adresów', 'kpl', 5000.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Montaż KNX', 'Montaż modułu KNX w rozdzielnicy', 'Aktuator', 'szt', 120.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Montaż KNX', 'Montaż przycisku dotykowego KNX', 'Panel dotykowy', 'szt', 150.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Montaż KNX', 'Montaż panelu LCD KNX 7"', 'Z ekranem', 'szt', 250.00, 0, 'labor', true);

  -- SUBCATEGORY: Loxone Programming
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_smart_home, 'Programowanie Loxone', 'Programowanie Loxone - dom do 100m²', 'Mały system', 'kpl', 1200.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Programowanie Loxone', 'Programowanie Loxone - dom 100-200m²', 'Średni dom', 'kpl', 2200.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Programowanie Loxone', 'Programowanie Loxone - dom powyżej 200m²', 'Duży dom', 'kpl', 3500.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Montaż Loxone', 'Montaż Loxone Miniserver', 'Główny kontroler', 'szt', 250.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Montaż Loxone', 'Montaż Loxone Extension', 'Rozszerzenie', 'szt', 150.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Montaż Loxone', 'Montaż Loxone Touch', 'Panel dotykowy', 'szt', 120.00, 0, 'labor', true);

  -- SUBCATEGORY: Fibaro Programming
  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_smart_home, 'Programowanie Fibaro', 'Konfiguracja Fibaro Home Center', 'Bazowa konfiguracja', 'kpl', 600.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Programowanie Fibaro', 'Programowanie scen Fibaro - proste', 'Do 10 scenariuszy', 'kpl', 400.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Programowanie Fibaro', 'Programowanie scen Fibaro - złożone', '10-30 scenariuszy', 'kpl', 900.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Montaż Fibaro', 'Montaż modułu Fibaro', 'Dowolny moduł', 'szt', 80.00, 0, 'labor', true),
    (NULL, cat_smart_home, 'Montaż Fibaro', 'Parowanie urządzenia Fibaro', 'Podłączenie urządzenia', 'szt', 30.00, 0, 'labor', true);

  -- =====================================================
  -- PPOŻ INSTALLATION
  -- =====================================================

  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_ppoz, 'Montaż czujek', 'Montaż czujki dymu', 'Czujka dymu', 'szt', 50.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Montaż czujek', 'Montaż czujki ciepła', 'Czujka temperatury', 'szt', 50.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Montaż czujek', 'Montaż czujki adresowalnej', 'Czujka adresowalna', 'szt', 80.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Montaż ROP', 'Montaż ręcznego ostrzegacza ROP', 'Przycisk wywołania', 'szt', 60.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Montaż sygnalizatorów', 'Montaż sygnalizatora SAP', 'Syrena', 'szt', 90.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Montaż sygnalizatorów', 'Montaż sygnalizatora optyczno-akustycznego', 'Ze światłem', 'szt', 110.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Montaż centrali', 'Montaż centrali ppoż 2-4 strefy', 'Mały system', 'szt', 400.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Montaż centrali', 'Montaż centrali ppoż 8 stref', 'Średni system', 'szt', 600.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Montaż centrali', 'Montaż centrali adresowalnej', 'System adresowalny', 'szt', 1000.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Programowanie', 'Programowanie centrali ppoż do 10 czujek', 'Podstawowe programowanie', 'kpl', 350.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Programowanie', 'Programowanie centrali ppoż 10-30 czujek', 'Średnie programowanie', 'kpl', 650.00, 0, 'labor', true),
    (NULL, cat_ppoz, 'Programowanie', 'Programowanie centrali ppoż powyżej 30 czujek', 'Złożone programowanie', 'kpl', 1200.00, 0, 'labor', true);

  -- =====================================================
  -- SECURITY INSTALLATION
  -- =====================================================

  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_security, 'Montaż domofonów', 'Montaż unifonu głośnomówiącego', 'Audio domofon', 'szt', 120.00, 0, 'labor', true),
    (NULL, cat_security, 'Montaż domofonów', 'Montaż wideodomofonu', 'Wideo domofon', 'szt', 180.00, 0, 'labor', true),
    (NULL, cat_security, 'Montaż domofonów', 'Montaż panelu domofonowego', 'Panel wywołania', 'szt', 150.00, 0, 'labor', true),
    (NULL, cat_security, 'Montaż domofonów', 'Konfiguracja domofonu IP', 'Konfiguracja sieci', 'kpl', 200.00, 0, 'labor', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Montaż czytnika kart RFID', 'Czytnik kart', 'szt', 100.00, 0, 'labor', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Montaż czytnika biometrycznego', 'Odciski palców', 'szt', 150.00, 0, 'labor', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Montaż zamka elektromagnetycznego', 'Zamek elektromagnetyczny', 'szt', 180.00, 0, 'labor', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Programowanie systemu kontroli dostępu', 'Do 10 drzwi', 'kpl', 500.00, 0, 'labor', true),
    (NULL, cat_security, 'Kontrola dostępu', 'Programowanie karty/breloka', 'Jedna karta', 'szt', 15.00, 0, 'labor', true);

  -- =====================================================
  -- POMIARY I DOKUMENTACJA (Measurements & Documentation)
  -- =====================================================

  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_pomiary, 'Pomiary elektryczne', 'Pomiar rezystancji izolacji', 'Megaomomierz', 'kpl', 250.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Pomiary elektryczne', 'Pomiar rezystancji pętli zwarcia', 'Test automatów', 'kpl', 300.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Pomiary elektryczne', 'Pomiar skuteczności ochrony przeciwporażeniowej', 'Test RCD', 'kpl', 200.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Pomiary elektryczne', 'Pomiar rezystancji uziemienia', 'Uziemienie', 'kpl', 180.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Pomiary elektryczne', 'Pomiar impedancji pętli', 'Impedancja', 'kpl', 150.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Termowizja', 'Przegląd termowizyjny rozdzielnicy', 'Termowizja', 'szt', 300.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Termowizja', 'Przegląd termowizyjny instalacji', 'Cały obiekt', 'kpl', 800.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Dokumentacja', 'Protokół pomiarowy instalacji mieszkanie', 'Do 100m2', 'kpl', 400.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Dokumentacja', 'Protokół pomiarowy instalacji dom', '100-300m²', 'kpl', 700.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Dokumentacja', 'Protokół pomiarowy instalacji przemysł', 'Powyżej 300m2', 'kpl', 1500.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Dokumentacja', 'Opracowanie dokumentacji powykonawczej', 'Schematy as-built', 'kpl', 600.00, 0, 'labor', true),
    (NULL, cat_pomiary, 'Dokumentacja', 'Odbiór przez nadzór budowlany', 'Obecność', 'godz', 180.00, 0, 'labor', true);

  -- =====================================================
  -- ROZŁĄCZANIE I KOŃCÓWKOWANIE (Termination & Connection)
  -- =====================================================

  INSERT INTO catalog_items (user_id, category_id, sub_category, name, description, unit, base_labor_price, base_material_price, type, is_active)
  VALUES
    (NULL, cat_przygotowanie, 'Rozłączanie', 'Rozłączenie przewodów skrętka w puszce', 'Skrętka w puszce', 'szt', 20.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Rozłączanie', 'Rozłączenie przewodów złączka Wago', 'Złączka Wago', 'szt', 25.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Rozłączanie', 'Rozłączenie przewodów lutowanie', 'Lutowanie', 'szt', 35.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Końcówkowanie', 'Założenie tulejki izolacyjnej', 'Końcówka', 'szt', 5.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Końcówkowanie', 'Założenie tulejki izolacyjnej powyżej 10mm²', 'Duża końcówka', 'szt', 8.00, 0, 'labor', true),
    (NULL, cat_przygotowanie, 'Końcówkowanie', 'Założenie końcówki kablowej oczkowej', 'Oczkowa', 'szt', 10.00, 0, 'labor', true);

END $$;
