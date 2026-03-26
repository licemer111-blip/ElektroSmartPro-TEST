-- ============================================================
-- SYNC regions.price_modifier to lib/config/regions.ts values
-- Single Source of Truth: lib/config/regions.ts multipliers
-- All three sources (regions.ts / ai-master-brain / DB) aligned.
-- ============================================================

UPDATE public.regions SET price_modifier = 1.20 WHERE slug = 'mazowieckie';
UPDATE public.regions SET price_modifier = 1.12 WHERE slug = 'dolnoslaskie';
UPDATE public.regions SET price_modifier = 1.10 WHERE slug = 'malopolskie';
UPDATE public.regions SET price_modifier = 1.10 WHERE slug = 'pomorskie';
UPDATE public.regions SET price_modifier = 1.08 WHERE slug = 'slaskie';
UPDATE public.regions SET price_modifier = 1.06 WHERE slug = 'wielkopolskie';
UPDATE public.regions SET price_modifier = 1.02 WHERE slug = 'zachodniopomorskie';
UPDATE public.regions SET price_modifier = 1.00 WHERE slug = 'lodzkie';
UPDATE public.regions SET price_modifier = 0.96 WHERE slug = 'lubuskie';
UPDATE public.regions SET price_modifier = 0.96 WHERE slug = 'kujawsko-pomorskie';
UPDATE public.regions SET price_modifier = 0.94 WHERE slug = 'opolskie';
UPDATE public.regions SET price_modifier = 0.92 WHERE slug = 'warminsko-mazurskie';
UPDATE public.regions SET price_modifier = 0.92 WHERE slug = 'lubelskie';
UPDATE public.regions SET price_modifier = 0.90 WHERE slug = 'swietokrzyskie';
UPDATE public.regions SET price_modifier = 0.88 WHERE slug = 'podkarpackie';
UPDATE public.regions SET price_modifier = 0.88 WHERE slug = 'podlaskie';
