-- =====================================================
-- UPDATE REGIONAL MULTIPLIERS (Voivodeships)
-- =====================================================
-- Date: 2026-01-21
-- Task: Update price multipliers for all 16 Polish voivodeships
-- Based on: Market analysis 2024-2025
-- =====================================================

-- STEP 1: Add coefficient column if it doesn't exist
ALTER TABLE public.regions 
ADD COLUMN IF NOT EXISTS coefficient NUMERIC(10, 2) DEFAULT 1.00;

-- Add comment
COMMENT ON COLUMN public.regions.coefficient IS 'Regional price multiplier (0.90-1.15). Base prices are multiplied by this coefficient.';

-- STEP 2: Update all 16 voivodeships with new realistic multipliers

-- Tier 1: Mazowieckie (Warsaw region) - Highest prices
UPDATE public.regions SET coefficient = 1.15 WHERE name = 'Mazowieckie';

-- Tier 2: Major cities (Kraków, Wrocław, Gdańsk)
UPDATE public.regions SET coefficient = 1.10 WHERE name = 'Małopolskie';
UPDATE public.regions SET coefficient = 1.10 WHERE name = 'Dolnośląskie';
UPDATE public.regions SET coefficient = 1.10 WHERE name = 'Pomorskie';

-- Tier 3: Large regional centers
UPDATE public.regions SET coefficient = 1.05 WHERE name = 'Wielkopolskie';
UPDATE public.regions SET coefficient = 1.05 WHERE name = 'Zachodniopomorskie';
UPDATE public.regions SET coefficient = 1.05 WHERE name = 'Śląskie';

-- Tier 4: Medium regions - National average
UPDATE public.regions SET coefficient = 1.00 WHERE name = 'Łódzkie';
UPDATE public.regions SET coefficient = 1.00 WHERE name = 'Lubuskie';
UPDATE public.regions SET coefficient = 1.00 WHERE name = 'Kujawsko-Pomorskie';
UPDATE public.regions SET coefficient = 1.00 WHERE name = 'Opolskie';

-- Tier 5: Eastern regions - Below average
UPDATE public.regions SET coefficient = 0.95 WHERE name = 'Warmińsko-Mazurskie';
UPDATE public.regions SET coefficient = 0.95 WHERE name = 'Świętokrzyskie';
UPDATE public.regions SET coefficient = 0.95 WHERE name = 'Podlaskie';

-- Tier 6: South-Eastern regions - Lowest prices
UPDATE public.regions SET coefficient = 0.90 WHERE name = 'Lubelskie';
UPDATE public.regions SET coefficient = 0.90 WHERE name = 'Podkarpackie';

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the update:
-- SELECT name, coefficient 
-- FROM public.regions 
-- ORDER BY coefficient DESC, name ASC;

-- Expected output:
-- Mazowieckie         | 1.15
-- Dolnośląskie        | 1.10
-- Małopolskie         | 1.10
-- Pomorskie           | 1.10
-- Śląskie             | 1.05
-- Wielkopolskie       | 1.05
-- Zachodniopomorskie  | 1.05
-- Kujawsko-Pomorskie  | 1.00
-- Lubuskie            | 1.00
-- Łódzkie             | 1.00
-- Opolskie            | 1.00
-- Podlaskie           | 0.95
-- Świętokrzyskie      | 0.95
-- Warmińsko-Mazurskie | 0.95
-- Lubelskie           | 0.90
-- Podkarpackie        | 0.90

-- =====================================================
-- CONNECTION WITH PROJECTS TABLE
-- =====================================================
-- The projects table already has region_id column that references regions(id)
-- Users select voivodeship when creating a project
-- Prices are then multiplied by region.coefficient during calculation
