-- Add Market Intelligence example data to existing catalog items
-- This will update a few items with sample price ranges, trends, and comments

-- Example 1: Cable with rising prices (material cost increase)
UPDATE catalog_items
SET 
  price_min = 2.20,
  price_max = 2.80,
  price_trend = 'up',
  confidence_level = 'high',
  confidence_reason = 'Dane z 5 hurtowni elektrycznych (Grudzień 2025 - Styczeń 2026)',
  market_comment = 'Wzrost cen miedzi o 18% wpłynął na ceny kabli. Prognoza: stabilizacja w Q2 2026.',
  market_comment_type = 'material_cost',
  last_verified_at = NOW()
WHERE name = 'Kabel YDYp 3x1,5mm² - biały'
  AND user_id IS NULL;

-- Example 2: Labor with stable prices
UPDATE catalog_items
SET 
  price_min = 18.00,
  price_max = 25.00,
  price_trend = 'stable',
  confidence_level = 'medium',
  confidence_reason = 'Analiza 120 kosztorysów ze stycznia 2026',
  market_comment = 'Stawki montażu gniazd stabilne. Różnice wynikają z lokalizacji (beton vs gipsokartony).',
  market_comment_type = 'regional_factor',
  last_verified_at = NOW()
WHERE name = 'Montaż gniazda wtyczkowego pojedynczego'
  AND user_id IS NULL;

-- Example 3: Equipment with falling prices
UPDATE catalog_items
SET 
  price_min = 28.00,
  price_max = 35.00,
  price_trend = 'down',
  confidence_level = 'high',
  confidence_reason = 'Dane od dystrybutorów Hager, ABB, Schneider',
  market_comment = 'Nadwyżka magazynowa u dystrybutorów. Dobre ceny do końca Q1 2026.',
  market_comment_type = 'seasonal_demand',
  last_verified_at = NOW()
WHERE name = 'Rozłącznik izolacyjny 40A 3P'
  AND user_id IS NULL;

-- Example 4: Smart home with high confidence
UPDATE catalog_items
SET 
  price_min = 420.00,
  price_max = 580.00,
  price_trend = 'stable',
  confidence_level = 'high',
  confidence_reason = 'Ceny oficjalne KNX Polska + 3 autoryzowanych dystrybutorów',
  market_comment = 'Stabilne ceny urządzeń KNX. Lekki wzrost popytu na inteligentne systemy.',
  market_comment_type = 'material_cost',
  last_verified_at = NOW()
WHERE name LIKE '%KNX%'
  AND user_id IS NULL
LIMIT 1;

-- Example 5: Demolition with regional variation
UPDATE catalog_items
SET 
  price_min = 3.20,
  price_max = 4.50,
  price_trend = 'up',
  confidence_level = 'medium',
  confidence_reason = 'Średnie z 45 projektów z ostatnich 3 miesięcy',
  market_comment = 'Wzrost stawek za demontaż w woj. mazowieckim (+12%). Poza tym regionem stabilnie.',
  market_comment_type = 'regional_factor',
  last_verified_at = NOW()
WHERE name = 'Demontaż przewodów elektrycznych'
  AND user_id IS NULL;

-- Example 6: Installation with seasonal trends
UPDATE catalog_items
SET 
  price_min = 45.00,
  price_max = 65.00,
  price_trend = 'up',
  confidence_level = 'medium',
  confidence_reason = 'Analiza rynku pracy elektryków Q1 2026',
  market_comment = 'Sezon remontowy - wyższe stawki robocizny. Spadek cen spodziewany w Q3 2026.',
  market_comment_type = 'seasonal_demand',
  last_verified_at = NOW()
WHERE name LIKE 'Montaż tablicy rozdzielczej%'
  AND user_id IS NULL
LIMIT 1;

-- Add a few more examples for variety
UPDATE catalog_items
SET 
  price_min = base_labor_price * 0.85,
  price_max = base_labor_price * 1.25,
  price_trend = 'stable',
  confidence_level = 'low',
  confidence_reason = 'Szacunek na podstawie danych historycznych',
  market_comment = NULL,
  last_verified_at = NOW()
WHERE user_id IS NULL
  AND price_min IS NULL
  AND (
    name LIKE '%Montaż%' 
    OR name LIKE '%Instalacja%'
    OR name LIKE '%Układanie%'
  )
LIMIT 20;

-- Add ranges for materials (tighter range, more predictable)
UPDATE catalog_items
SET 
  price_min = base_material_price * 0.92,
  price_max = base_material_price * 1.15,
  price_trend = 'stable',
  confidence_level = 'medium',
  confidence_reason = 'Ceny katalogowe producentów + marża hurtowa',
  last_verified_at = NOW()
WHERE user_id IS NULL
  AND price_min IS NULL
  AND base_material_price > 0
  AND (
    name LIKE '%Kabel%' 
    OR name LIKE '%Przewód%'
    OR name LIKE '%Automatyczny%'
  )
LIMIT 30;
