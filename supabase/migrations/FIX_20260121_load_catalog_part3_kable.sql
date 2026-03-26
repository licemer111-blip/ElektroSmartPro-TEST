-- =====================================================
-- CATALOG LOAD PART 3: Kable (Cables)
-- Hundreds of cable types with Polish specifications
-- =====================================================

DO $$
DECLARE
  cat_okablowanie UUID;
  inserted_count INTEGER := 0;
BEGIN

  -- Get category ID
  SELECT id INTO cat_okablowanie FROM catalog_categories WHERE name = 'Okablowanie' LIMIT 1;

  -- =====================================================
  -- KABLE MIESZKANIOWE (Residential Cables)
  -- =====================================================
  
  INSERT INTO catalog_items (user_id, category_id, name, unit, base_labor_price, base_material_price, sub_category, type)
  VALUES
    -- YDYp (mieszkaniowe)
    (NULL, cat_okablowanie, 'Kabel YDYp 3x1.5mm²', 'm', 2.20, 2.80, 'Kable mieszkaniowe YDYp', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YDYp 3x2.5mm²', 'm', 2.50, 4.20, 'Kable mieszkaniowe YDYp', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YDYp 3x4mm²', 'm', 2.80, 6.50, 'Kable mieszkaniowe YDYp', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YDYp 3x6mm²', 'm', 3.20, 9.80, 'Kable mieszkaniowe YDYp', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YDYp 5x1.5mm²', 'm', 2.80, 4.50, 'Kable mieszkaniowe YDYp', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YDYp 5x2.5mm²', 'm', 3.20, 6.80, 'Kable mieszkaniowe YDYp', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YDYp 5x4mm²', 'm', 3.80, 10.50, 'Kable mieszkaniowe YDYp', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YDYp 5x6mm²', 'm', 4.50, 15.80, 'Kable mieszkaniowe YDYp', 'mixed'),
    
    -- DY (przewody jednożyłowe)
    (NULL, cat_okablowanie, 'Przewód DY 1.5mm² (H07V-U)', 'm', 1.50, 0.85, 'Przewody jednożyłowe DY', 'mixed'),
    (NULL, cat_okablowanie, 'Przewód DY 2.5mm² (H07V-U)', 'm', 1.80, 1.35, 'Przewody jednożyłowe DY', 'mixed'),
    (NULL, cat_okablowanie, 'Przewód DY 4mm² (H07V-U)', 'm', 2.00, 2.10, 'Przewody jednożyłowe DY', 'mixed'),
    (NULL, cat_okablowanie, 'Przewód DY 6mm² (H07V-U)', 'm', 2.20, 3.20, 'Przewody jednożyłowe DY', 'mixed'),
    (NULL, cat_okablowanie, 'Przewód DY 10mm² (H07V-U)', 'm', 2.80, 5.50, 'Przewody jednożyłowe DY', 'mixed'),
    (NULL, cat_okablowanie, 'Przewód DY 16mm² (H07V-U)', 'm', 3.50, 8.80, 'Przewody jednożyłowe DY', 'mixed'),
    (NULL, cat_okablowanie, 'Przewód DY 25mm² (H07V-U)', 'm', 4.50, 14.50, 'Przewody jednożyłowe DY', 'mixed'),
    (NULL, cat_okablowanie, 'Przewód DY 35mm² (H07V-U)', 'm', 5.50, 21.00, 'Przewody jednożyłowe DY', 'mixed'),
    
    -- =====================================================
    -- KABLE ENERGETYCZNE (Power Cables)
    -- =====================================================
    
    -- YKY (energetyczne ziemne)
    (NULL, cat_okablowanie, 'Kabel YKY 4x16mm²', 'm', 8.50, 32.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x25mm²', 'm', 10.50, 48.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x35mm²', 'm', 12.50, 68.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x50mm²', 'm', 15.00, 95.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x70mm²', 'm', 18.00, 135.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x95mm²', 'm', 22.00, 185.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x120mm²', 'm', 28.00, 235.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x150mm²', 'm', 35.00, 295.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x185mm²', 'm', 42.00, 365.00, 'Kable energetyczne YKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YKY 4x240mm²', 'm', 55.00, 475.00, 'Kable energetyczne YKY', 'mixed'),
    
    -- YAKY (aluminiowe)
    (NULL, cat_okablowanie, 'Kabel YAKY 4x25mm²', 'm', 10.00, 35.00, 'Kable aluminiowe YAKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YAKY 4x35mm²', 'm', 12.00, 48.00, 'Kable aluminiowe YAKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YAKY 4x50mm²', 'm', 14.00, 65.00, 'Kable aluminiowe YAKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YAKY 4x70mm²', 'm', 17.00, 92.00, 'Kable aluminiowe YAKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YAKY 4x95mm²', 'm', 20.00, 125.00, 'Kable aluminiowe YAKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YAKY 4x120mm²', 'm', 25.00, 158.00, 'Kable aluminiowe YAKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YAKY 4x150mm²', 'm', 32.00, 198.00, 'Kable aluminiowe YAKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YAKY 4x185mm²', 'm', 38.00, 245.00, 'Kable aluminiowe YAKY', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YAKY 4x240mm²', 'm', 48.00, 318.00, 'Kable aluminiowe YAKY', 'mixed'),
    
    -- =====================================================
    -- KABLE TELEINFORMATYCZNE (Data Cables)
    -- =====================================================
    
    -- UTP (kategorie)
    (NULL, cat_okablowanie, 'Kabel UTP kat.5e (305m)', 'm', 1.80, 1.20, 'Kable UTP', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel UTP kat.6 (305m)', 'm', 2.00, 1.85, 'Kable UTP', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel UTP kat.6A (305m)', 'm', 2.20, 2.80, 'Kable UTP', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel S/FTP kat.6 ekranowany', 'm', 2.50, 3.50, 'Kable UTP', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel S/FTP kat.7 ekranowany', 'm', 3.00, 5.20, 'Kable UTP', 'mixed'),
    
    -- Światłowody
    (NULL, cat_okablowanie, 'Światłowód SM 9/125 2J', 'm', 8.50, 4.50, 'Światłowody', 'mixed'),
    (NULL, cat_okablowanie, 'Światłowód SM 9/125 4J', 'm', 10.00, 6.80, 'Światłowody', 'mixed'),
    (NULL, cat_okablowanie, 'Światłowód SM 9/125 8J', 'm', 12.00, 10.50, 'Światłowody', 'mixed'),
    (NULL, cat_okablowanie, 'Światłowód SM 9/125 12J', 'm', 14.00, 15.00, 'Światłowody', 'mixed'),
    (NULL, cat_okablowanie, 'Światłowód MM 50/125 4J', 'm', 10.00, 8.20, 'Światłowody', 'mixed'),
    (NULL, cat_okablowanie, 'Światłowód MM 62.5/125 4J', 'm', 10.00, 7.80, 'Światłowody', 'mixed'),
    
    -- Koncentryczne (TV/SAT)
    (NULL, cat_okablowanie, 'Kabel koncentryczny RG6 75Ω', 'm', 2.50, 1.80, 'Kable koncentryczne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel koncentryczny RG11 75Ω', 'm', 3.00, 3.20, 'Kable koncentryczne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel koncentryczny RG59 75Ω', 'm', 2.20, 1.50, 'Kable koncentryczne', 'mixed'),
    
    -- =====================================================
    -- KABLE SYGNALIZACYJNE (Signal Cables)
    -- =====================================================
    
    -- YnTKSY (alarmowe, pożarowe)
    (NULL, cat_okablowanie, 'Kabel YnTKSY 1x2x0.8mm', 'm', 2.50, 1.85, 'Kable sygnalizacyjne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YnTKSY 2x2x0.8mm', 'm', 3.00, 3.20, 'Kable sygnalizacyjne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YnTKSY 4x2x0.8mm', 'm', 3.80, 5.80, 'Kable sygnalizacyjne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YnTKSY 8x2x0.8mm', 'm', 5.00, 10.50, 'Kable sygnalizacyjne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel YnTKSY 16x2x0.8mm', 'm', 8.00, 19.80, 'Kable sygnalizacyjne', 'mixed'),
    
    -- HDGS (pożarowe)
    (NULL, cat_okablowanie, 'Kabel HDGS 1x2x1.5mm²', 'm', 3.50, 4.20, 'Kable pożarowe HDGS', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel HDGS 2x2x1.5mm²', 'm', 4.50, 7.80, 'Kable pożarowe HDGS', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel HDGS 4x2x1.5mm²', 'm', 6.50, 14.50, 'Kable pożarowe HDGS', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel HDGS 8x2x1.5mm²', 'm', 10.00, 27.00, 'Kable pożarowe HDGS', 'mixed'),
    
    -- Telefoniczne
    (NULL, cat_okablowanie, 'Kabel telefoniczny YTKSY 2x2x0.5mm', 'm', 2.20, 1.50, 'Kable telefoniczne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel telefoniczny YTKSY 4x2x0.5mm', 'm', 2.80, 2.80, 'Kable telefoniczne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel telefoniczny YTKSY 8x2x0.5mm', 'm', 3.80, 5.20, 'Kable telefoniczne', 'mixed'),
    
    -- =====================================================
    -- KABLE SPECJALNE (Special Purpose)
    -- =====================================================
    
    -- Głośnikowe
    (NULL, cat_okablowanie, 'Kabel głośnikowy 2x0.75mm²', 'm', 1.50, 1.20, 'Kable głośnikowe', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel głośnikowy 2x1.5mm²', 'm', 1.80, 1.85, 'Kable głośnikowe', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel głośnikowy 2x2.5mm²', 'm', 2.20, 2.80, 'Kable głośnikowe', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel głośnikowy 2x4mm²', 'm', 2.80, 4.20, 'Kable głośnikowe', 'mixed'),
    
    -- Sterownicze
    (NULL, cat_okablowanie, 'Kabel sterowniczy OLFLEX 4G1.5mm²', 'm', 3.50, 5.80, 'Kable sterownicze', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel sterowniczy OLFLEX 7G1.5mm²', 'm', 4.50, 8.50, 'Kable sterownicze', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel sterowniczy OLFLEX 12G1.5mm²', 'm', 6.50, 13.80, 'Kable sterownicze', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel sterowniczy OLFLEX 25G1.5mm²', 'm', 12.00, 27.00, 'Kable sterownicze', 'mixed'),
    
    -- Grzewcze
    (NULL, cat_okablowanie, 'Kabel grzejny samoregulujący 10W/m', 'm', 12.00, 28.00, 'Kable grzewcze', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel grzejny samoregulujący 15W/m', 'm', 14.00, 35.00, 'Kable grzewcze', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel grzejny samoregulujący 20W/m', 'm', 16.00, 42.00, 'Kable grzewcze', 'mixed'),
    
    -- Fotowoltaiczne
    (NULL, cat_okablowanie, 'Kabel fotowoltaiczny PV 1x4mm² (DC)', 'm', 3.80, 4.20, 'Kable fotowoltaiczne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel fotowoltaiczny PV 1x6mm² (DC)', 'm', 4.50, 5.80, 'Kable fotowoltaiczne', 'mixed'),
    (NULL, cat_okablowanie, 'Kabel fotowoltaiczny PV 1x10mm² (DC)', 'm', 5.50, 8.50, 'Kable fotowoltaiczne', 'mixed')
  ON CONFLICT (user_id, name) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RAISE NOTICE 'Kable: % items inserted', inserted_count;

  RAISE NOTICE '=== COMPLETED: Part 3 (Kable) loaded ===';

END $$;
