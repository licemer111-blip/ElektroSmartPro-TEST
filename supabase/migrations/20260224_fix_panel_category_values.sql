-- ============================================================
-- ElektroSmart PRO — Fix panel_category values
-- Dopasowanie panel_category do originTypesToCheck w actions.ts
-- ============================================================
-- originTypesToCheck = [
--   "panel_material", "panel_labor", "panel_consumable",
--   "panel_busbar", "panel_assembly",
--   ...KNR_REFERENCE keys (breaker,rcd,rcbo,spd,contactor,
--      timer,monitoring,automation,compensation,terminal,
--      switch,enclosure,wiring)
-- ]
--
-- Poprzednie migracje wstawiały:
--   'consumable' zamiast 'panel_consumable'
--   'system'     zamiast 'panel_assembly'
--   (panel_busbar i panel_material w ogóle nie było)
-- ============================================================

-- 1. consumable → panel_consumable (tulejki, oznakowanie, szyna TH35, szyna łącząca)
UPDATE public.catalog_items
SET panel_category = 'panel_consumable'
WHERE panel_category = 'consumable'
  AND catalog_confidence = 'verified'
  AND name IN (
    'Tulejki i materiały pomocnicze (kpl.)',
    'Oznakowanie pola w rozdzielnicy',
    'Szyna łączeniowa 12-mod. (udział)',
    'Szyna TH35 aluminiowa 1m'
  );

-- 2. system → panel_assembly (montaż bazowy rozdzielnicy)
UPDATE public.catalog_items
SET panel_category = 'panel_assembly'
WHERE panel_category = 'system'
  AND catalog_confidence = 'verified'
  AND name LIKE 'Montaż i podłączenie rozdzielnicy%';

-- 3. wiring → zostaje 'wiring' (jest w KNR_REFERENCE) — OK, nie zmieniamy

-- 4. panel_labor — aktualizacja rekordu z nowej migracji
UPDATE public.catalog_items
SET panel_category = 'panel_labor'
WHERE panel_category = 'panel_labor'; -- już OK z 20260224_health_monitor_full_coverage.sql

-- 5. panel_material — aktualizacja rekordu z nowej migracji
UPDATE public.catalog_items
SET panel_category = 'panel_material'
WHERE panel_category = 'panel_material'; -- już OK

-- 6. panel_busbar — wstaw jeśli nie ma
DO $$
DECLARE
  v_cat_zestaw UUID;
BEGIN
  SELECT id INTO v_cat_zestaw FROM public.catalog_categories
  WHERE name = 'Akcesoria Rozdzielnicy (Zestaw)' LIMIT 1;

  IF v_cat_zestaw IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.catalog_items WHERE panel_category = 'panel_busbar'
  ) THEN
    INSERT INTO public.catalog_items
      (category_id, name, description, unit,
       base_material_price, base_labor_price,
       knr_code, labor_norm_rbh, panel_category, catalog_confidence,
       is_active, user_id)
    VALUES
      (v_cat_zestaw,
       'Szyna fazowa łączeniowa 12-mod. (panel_busbar)',
       'Szyna grzebieniowa TH35 — udział w szynie dla modułów DIN',
       'szt', 3.75, 0.00, 'KNR 5-04 0902-01', 0.00,
       'panel_busbar', 'verified', true, NULL);
  END IF;
END $$;

-- ─── Weryfikacja ───────────────────────────────────────────
-- SELECT panel_category, COUNT(*), ROUND(AVG(base_material_price),0) AS avg_mat
-- FROM catalog_items
-- WHERE catalog_confidence = 'verified' AND panel_category IS NOT NULL
-- GROUP BY panel_category ORDER BY panel_category;
--
-- Oczekiwane panel_category = originTypesToCheck:
--   panel_material, panel_labor, panel_consumable, panel_busbar, panel_assembly
--   breaker, rcd, rcbo, spd, contactor, timer, monitoring,
--   automation, compensation, terminal, switch, enclosure, wiring
