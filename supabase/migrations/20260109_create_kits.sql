-- ========================================
-- KITS SYSTEM (Zestawy) - Expert Point System
-- ========================================
-- One Kit = Multiple Items (Materials + Labor)
-- When user adds a Kit, it expands into individual project_items
-- ========================================

-- Step 1: Create kits table
CREATE TABLE IF NOT EXISTS public.kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 2: Create kit_items table (junction table)
-- Each kit contains multiple items with quantity multipliers
CREATE TABLE IF NOT EXISTS public.kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES public.kits(id) ON DELETE CASCADE NOT NULL,
  
  -- Item details (simplified for now, can be expanded to reference catalog)
  item_name TEXT NOT NULL,
  item_unit TEXT DEFAULT 'szt' NOT NULL,
  labor_price NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  material_price NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  
  -- Quantity multiplier: when user adds 1 kit with quantity 5, 
  -- this item will have quantity = quantity_multiplier * 5
  quantity_multiplier NUMERIC(10, 2) DEFAULT 1 NOT NULL,
  
  -- Optional: reference to future global catalog
  -- item_template_id UUID REFERENCES public.catalog_items(id), 
  
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 3: Enable RLS
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies for kits (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view kits"
  ON public.kits FOR SELECT
  TO authenticated
  USING (true);

-- Admin policy for managing kits (optional, for future admin panel)
CREATE POLICY "Admins can manage kits"
  ON public.kits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 5: RLS Policies for kit_items (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view kit items"
  ON public.kit_items FOR SELECT
  TO authenticated
  USING (true);

-- Admin policy for managing kit items
CREATE POLICY "Admins can manage kit items"
  ON public.kit_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 6: Create updated_at trigger for kits
CREATE TRIGGER handle_kits_updated_at
  BEFORE UPDATE ON public.kits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Step 7: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_kits_category_id ON public.kits(category_id);
CREATE INDEX IF NOT EXISTS idx_kits_is_active ON public.kits(is_active);
CREATE INDEX IF NOT EXISTS idx_kit_items_kit_id ON public.kit_items(kit_id);

-- Step 8: Add helpful comments
COMMENT ON TABLE public.kits IS 'Expert Kits (Zestawy) - Predefined sets of items that expand into multiple project_items';
COMMENT ON TABLE public.kit_items IS 'Items contained in each kit with quantity multipliers';
COMMENT ON COLUMN public.kit_items.quantity_multiplier IS 'Multiplier for kit quantity. If user adds kit with qty 5 and this is 2, resulting project_item qty = 10';

-- ========================================
-- SEED DATA: Sample Kits
-- ========================================

-- Get category IDs (assuming they exist from previous migrations)
DO $$
DECLARE
  cat_gniazda UUID;
  cat_oswietlenie UUID;
  cat_sila UUID;
  kit_gniazdo_podstawowe UUID;
  kit_punkt_oswietleniowy UUID;
BEGIN
  -- Try to get existing categories
  SELECT id INTO cat_gniazda FROM public.categories WHERE name LIKE '%Gniazda%' OR name LIKE '%gniazd%' LIMIT 1;
  SELECT id INTO cat_oswietlenie FROM public.categories WHERE name LIKE '%Oświetl%' OR name LIKE '%oswietl%' LIMIT 1;
  SELECT id INTO cat_sila FROM public.categories WHERE name LIKE '%Siła%' OR name LIKE '%sila%' LIMIT 1;

  -- Kit 1: Punkt Gniazda Podstawowego (Basic Socket Point)
  INSERT INTO public.kits (id, name, description, category_id, display_order)
  VALUES (
    gen_random_uuid(),
    'Punkt Gniazda Podstawowego',
    'Kompletny punkt gniazda wtykowego z montażem (puszka + gniazdo + przewód + robocizna)',
    cat_gniazda,
    1
  ) RETURNING id INTO kit_gniazdo_podstawowe;

  -- Kit 1 Items
  INSERT INTO public.kit_items (kit_id, item_name, item_unit, labor_price, material_price, quantity_multiplier, display_order)
  VALUES
    (kit_gniazdo_podstawowe, 'Puszka podtynkowa fi 60', 'szt', 5.00, 3.50, 1, 1),
    (kit_gniazdo_podstawowe, 'Gniazdo wtykowe 230V', 'szt', 8.00, 15.00, 1, 2),
    (kit_gniazdo_podstawowe, 'Przewód YDYp 3x2.5mm', 'm', 2.50, 4.50, 5, 3),
    (kit_gniazdo_podstawowe, 'Montaż i podłączenie', 'kpl', 25.00, 0.00, 1, 4);

  -- Kit 2: Punkt Oświetleniowy (Lighting Point)
  INSERT INTO public.kits (id, name, description, category_id, display_order)
  VALUES (
    gen_random_uuid(),
    'Punkt Oświetleniowy z Włącznikiem',
    'Kompletny punkt światła z włącznikiem (przewód + włącznik + puszka + montaż)',
    cat_oswietlenie,
    2
  ) RETURNING id INTO kit_punkt_oswietleniowy;

  -- Kit 2 Items
  INSERT INTO public.kit_items (kit_id, item_name, item_unit, labor_price, material_price, quantity_multiplier, display_order)
  VALUES
    (kit_punkt_oswietleniowy, 'Przewód YDYp 3x1.5mm', 'm', 2.00, 3.50, 8, 1),
    (kit_punkt_oswietleniowy, 'Włącznik pojedynczy', 'szt', 6.00, 12.00, 1, 2),
    (kit_punkt_oswietleniowy, 'Puszka podtynkowa fi 60', 'szt', 5.00, 3.50, 2, 3),
    (kit_punkt_oswietleniowy, 'Montaż punktu oświetleniowego', 'kpl', 30.00, 0.00, 1, 4);

  -- Kit 3: Punkt Gniazda Podwójnego (Double Socket Point)
  INSERT INTO public.kits (name, description, category_id, display_order)
  VALUES (
    'Punkt Gniazda Podwójnego',
    'Dwa gniazda w jednej ramce (puszka + 2x gniazdo + przewód + montaż)',
    cat_gniazda,
    3
  ) RETURNING id INTO kit_gniazdo_podstawowe;

  -- Kit 3 Items
  INSERT INTO public.kit_items (kit_id, item_name, item_unit, labor_price, material_price, quantity_multiplier, display_order)
  VALUES
    (kit_gniazdo_podstawowe, 'Puszka podwójna podtynkowa', 'szt', 7.00, 5.00, 1, 1),
    (kit_gniazdo_podstawowe, 'Gniazdo wtykowe 230V', 'szt', 8.00, 15.00, 2, 2),
    (kit_gniazdo_podstawowe, 'Ramka podwójna', 'szt', 2.00, 8.00, 1, 3),
    (kit_gniazdo_podstawowe, 'Przewód YDYp 3x2.5mm', 'm', 2.50, 4.50, 6, 4),
    (kit_gniazdo_podstawowe, 'Montaż gniazda podwójnego', 'kpl', 35.00, 0.00, 1, 5);

END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Check kits:
-- SELECT * FROM public.kits ORDER BY display_order;

-- Check kit items:
-- SELECT k.name as kit_name, ki.item_name, ki.quantity_multiplier, ki.labor_price, ki.material_price
-- FROM public.kit_items ki
-- JOIN public.kits k ON k.id = ki.kit_id
-- ORDER BY k.name, ki.display_order;
