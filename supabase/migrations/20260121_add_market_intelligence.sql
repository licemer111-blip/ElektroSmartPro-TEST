-- =====================================================
-- MIGRATION: Market Intelligence (Analityka Rynkowa)
-- Date: 2026-01-21
-- Description: Adds price ranges, trends, confidence levels, and history tracking
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENUMS
-- =====================================================

-- Confidence level for price data
CREATE TYPE confidence_level_enum AS ENUM ('low', 'medium', 'high');

-- Market trend/sentiment
CREATE TYPE market_sentiment_enum AS ENUM ('stable', 'up', 'down');

-- Type of market comment
CREATE TYPE market_comment_type_enum AS ENUM (
  'material_cost',      -- Zmiana ceny materiałów
  'seasonal_demand',    -- Sezonowy popyt
  'regulatory_change',  -- Zmiany regulacyjne
  'regional_factor'     -- Czynniki regionalne
);

-- Pricing mode for projects
CREATE TYPE pricing_mode_enum AS ENUM ('economy', 'standard', 'premium');

-- Data source type
CREATE TYPE data_source_enum AS ENUM (
  'manual',           -- Ręczne wprowadzenie
  'ai_analysis',      -- Analiza AI
  'market_index',     -- Indeks rynkowy
  'admin_override'    -- Nadpisanie przez admina
);

-- =====================================================
-- STEP 2: UPDATE catalog_items TABLE
-- =====================================================

-- Add price range columns
ALTER TABLE public.catalog_items
ADD COLUMN IF NOT EXISTS price_min NUMERIC(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_max NUMERIC(10, 2) DEFAULT NULL;

-- Add market intelligence columns
ALTER TABLE public.catalog_items
ADD COLUMN IF NOT EXISTS price_trend market_sentiment_enum DEFAULT 'stable',
ADD COLUMN IF NOT EXISTS confidence_level confidence_level_enum DEFAULT 'low',
ADD COLUMN IF NOT EXISTS confidence_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS market_comment TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS market_comment_type market_comment_type_enum DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN public.catalog_items.price_min IS 
'Minimalna cena rynkowa (economy mode) - dla oszczędnych projektów';

COMMENT ON COLUMN public.catalog_items.price_max IS 
'Maksymalna cena rynkowa (premium mode) - dla luksusowych projektów';

COMMENT ON COLUMN public.catalog_items.price_trend IS 
'Trend cenowy: stable (➡️), up (↗️), down (↘️)';

COMMENT ON COLUMN public.catalog_items.confidence_level IS 
'Poziom zaufania do danych cenowych: low/medium/high';

COMMENT ON COLUMN public.catalog_items.confidence_reason IS 
'Powód poziomu zaufania (np. "Dane z 3 hurtowni Warszawa")';

COMMENT ON COLUMN public.catalog_items.market_comment IS 
'Komentarz rynkowy widoczny dla użytkownika (np. "Wzrost cen miedzi o 15%")';

COMMENT ON COLUMN public.catalog_items.market_comment_type IS 
'Typ komentarza rynkowego dla kategoryzacji';

COMMENT ON COLUMN public.catalog_items.last_verified_at IS 
'Data ostatniej weryfikacji cen rynkowych';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_catalog_items_price_trend 
ON public.catalog_items(price_trend);

CREATE INDEX IF NOT EXISTS idx_catalog_items_confidence_level 
ON public.catalog_items(confidence_level);

CREATE INDEX IF NOT EXISTS idx_catalog_items_last_verified 
ON public.catalog_items(last_verified_at DESC);

-- =====================================================
-- STEP 3: CREATE price_history_log TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.price_history_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Price snapshot (labor + material separate tracking)
  price_labor_min NUMERIC(10, 2) DEFAULT NULL,
  price_labor_avg NUMERIC(10, 2) NOT NULL,  -- base_labor_price
  price_labor_max NUMERIC(10, 2) DEFAULT NULL,
  
  price_material_min NUMERIC(10, 2) DEFAULT NULL,
  price_material_avg NUMERIC(10, 2) NOT NULL,  -- base_material_price
  price_material_max NUMERIC(10, 2) DEFAULT NULL,
  
  -- Metadata
  source_type data_source_enum NOT NULL DEFAULT 'manual',
  note TEXT DEFAULT NULL,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_price_history_item_id 
ON public.price_history_log(item_id);

CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at 
ON public.price_history_log(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_history_item_time 
ON public.price_history_log(item_id, recorded_at DESC);

-- Add comments
COMMENT ON TABLE public.price_history_log IS 
'Historia zmian cen katalogowych - używana do wykresów i analizy trendów';

COMMENT ON COLUMN public.price_history_log.recorded_at IS 
'Data i czas rejestracji zmiany ceny';

COMMENT ON COLUMN public.price_history_log.source_type IS 
'Źródło danych: manual (ręczne), ai_analysis (AI), market_index (indeks), admin_override';

COMMENT ON COLUMN public.price_history_log.note IS 
'Opcjonalna notatka o przyczynie zmiany (np. "Wzrost cen miedzi")';

-- =====================================================
-- STEP 4: UPDATE projects TABLE
-- =====================================================

-- Add pricing mode column
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS pricing_mode pricing_mode_enum DEFAULT 'standard';

-- Add comment
COMMENT ON COLUMN public.projects.pricing_mode IS 
'Tryb cenowy projektu: economy (price_min), standard (base_price), premium (price_max)';

-- Add index
CREATE INDEX IF NOT EXISTS idx_projects_pricing_mode 
ON public.projects(pricing_mode);

-- =====================================================
-- STEP 5: AUTOMATION - Price Change Trigger
-- =====================================================

-- Function to log price changes
CREATE OR REPLACE FUNCTION log_price_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if prices actually changed
  IF (OLD.base_labor_price IS DISTINCT FROM NEW.base_labor_price) OR
     (OLD.base_material_price IS DISTINCT FROM NEW.base_material_price) OR
     (OLD.price_min IS DISTINCT FROM NEW.price_min) OR
     (OLD.price_max IS DISTINCT FROM NEW.price_max) THEN
    
    INSERT INTO public.price_history_log (
      item_id,
      recorded_at,
      price_labor_min,
      price_labor_avg,
      price_labor_max,
      price_material_min,
      price_material_avg,
      price_material_max,
      source_type,
      note
    ) VALUES (
      NEW.id,
      NOW(),
      NULL,  -- We don't have separate min/max for labor yet
      NEW.base_labor_price,
      NULL,
      NEW.price_min,
      NEW.base_material_price,
      NEW.price_max,
      'manual',  -- Default to manual, can be overridden
      'Automatyczna zmiana ceny'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS catalog_items_price_change_trigger ON public.catalog_items;

CREATE TRIGGER catalog_items_price_change_trigger
  AFTER UPDATE ON public.catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION log_price_change();

-- =====================================================
-- STEP 6: RLS POLICIES for price_history_log
-- =====================================================

-- Enable RLS
ALTER TABLE public.price_history_log ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view price history
CREATE POLICY "Authenticated users can view price history"
  ON public.price_history_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert price history
-- (Mainly used by trigger with SECURITY DEFINER, or manual admin edits)
CREATE POLICY "Authenticated users can insert price history"
  ON public.price_history_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- STEP 7: INITIAL DATA POPULATION (Optional)
-- =====================================================

-- Create initial price history snapshot for all existing items
INSERT INTO public.price_history_log (
  item_id,
  recorded_at,
  price_labor_avg,
  price_material_avg,
  source_type,
  note
)
SELECT 
  id,
  NOW(),
  base_labor_price,
  base_material_price,
  'manual',
  'Migarcja: Początkowy snapshot cen'
FROM public.catalog_items
WHERE base_labor_price IS NOT NULL OR base_material_price IS NOT NULL;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Market Intelligence Migration Complete!';
  RAISE NOTICE '📊 Added price ranges, trends, and confidence levels to catalog_items';
  RAISE NOTICE '📈 Created price_history_log table for tracking changes';
  RAISE NOTICE '🎯 Added pricing_mode to projects table';
  RAISE NOTICE '⚡ Installed automatic price change logging trigger';
  RAISE NOTICE '🔒 RLS policies configured for secure access';
END $$;
