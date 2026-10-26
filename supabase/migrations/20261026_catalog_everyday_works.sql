-- Everyday electrical works for the shared catalog.
-- Hours are the same norma ES the estimate already uses.
-- Material stays 0: each electrician writes his own price.

-- Stamp hours onto the old lump-sum rows that are the same job.
UPDATE catalog_items SET
  labor_norm_rbh = 0.85,
  knr_code = 'KNR 5-08 0101',
  base_labor_price = 0,
  base_material_price = 0
WHERE user_id IS NULL AND name = 'Kucie bruzd w ścianie (cegła/bloczki)';

UPDATE catalog_items SET
  labor_norm_rbh = 2.00,
  knr_code = 'KNR 5-08 0103',
  base_labor_price = 0,
  base_material_price = 0
WHERE user_id IS NULL AND name = 'Kucie bruzd w ścianie (beton)';

UPDATE catalog_items SET
  labor_norm_rbh = 0.20,
  knr_code = 'KNR 5-04 0401-03',
  base_labor_price = 0,
  base_material_price = 0
WHERE user_id IS NULL AND name = 'Wiercenie otworu koronkowego Ø68 (cegła)';

UPDATE catalog_items SET
  labor_norm_rbh = 0.40,
  knr_code = 'KNR 5-04 0401-04',
  base_labor_price = 0,
  base_material_price = 0
WHERE user_id IS NULL AND name = 'Wiercenie otworu koronkowego Ø68 (beton)';

UPDATE catalog_items SET
  labor_norm_rbh = 0.12,
  knr_code = 'KNR 5-08 0107',
  base_labor_price = 0,
  base_material_price = 0
WHERE user_id IS NULL AND name = 'Tynkowanie bruzd (zaprawą)';

DO $$
DECLARE
  cat_id UUID;
  object_type_id UUID;
BEGIN
  SELECT id INTO cat_id FROM catalog_categories WHERE name = 'Robocizna' LIMIT 1;

  IF cat_id IS NULL THEN
    SELECT id INTO object_type_id FROM object_types LIMIT 1;
    IF object_type_id IS NULL THEN
      RETURN;
    END IF;
    INSERT INTO catalog_categories (object_type_id, name, icon_name, sort_order)
    VALUES (object_type_id, 'Robocizna', 'hard-hat', 0)
    ON CONFLICT (object_type_id, name) DO NOTHING;
    SELECT id INTO cat_id FROM catalog_categories WHERE name = 'Robocizna' LIMIT 1;
  END IF;

  IF cat_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO catalog_items (
    user_id, category_id, name, description, unit,
    base_labor_price, base_material_price, type, is_active,
    labor_norm_rbh, knr_code
  )
  SELECT
    NULL,
    cat_id,
    v.name,
    'Norma ES. Materiał dopiszesz w kosztorysie.',
    v.unit,
    0,
    0,
    'labor',
    true,
    v.hours,
    v.code
  FROM (VALUES
    ('Gniazdo 230V p/t pojedyncze', 'szt', 0.68::numeric, 'KNR 5-08 0401'),
    ('Gniazdo 230V p/t podwójne', 'szt', 0.82, 'KNR 5-08 0402'),
    ('Gniazdo 230V IP44', 'szt', 0.98, 'KNR 5-08 0405'),
    ('Gniazdo natynkowe', 'szt', 0.54, 'KNR 5-08 0406'),
    ('Gniazdo siłowe CEE 16A 5P', 'szt', 1.18, 'KNR 5-08 0408'),
    ('Gniazdo CEE 32A 5P', 'szt', 1.45, 'KNR 5-08 0409'),
    ('Gniazdo RJ45 cat 6 p/t', 'szt', 0.50, 'KNR 5-09 0106'),
    ('Gniazdo antenowe TV p/t', 'szt', 0.40, 'KNR 5-09 0201'),
    ('Łącznik pojedynczy p/t', 'szt', 0.45, 'KNR 5-08 0501'),
    ('Łącznik schodowy p/t', 'szt', 0.54, 'KNR 5-08 0503'),
    ('Łącznik krzyżowy p/t', 'szt', 0.60, 'KNR 5-08 0504'),
    ('Łącznik świecznikowy p/t', 'szt', 0.54, 'KNR 5-08 0502'),
    ('Puszka p/t Ø60', 'szt', 0.15, 'KNR 5-04 0601-01'),
    ('Puszka rozgałęźna p/t', 'szt', 0.25, 'KNR 5-04 0601-02'),
    ('Punkt świetlny p/t', 'szt', 0.35, 'KNR 5-04 0301-01'),
    ('Oprawa LED downlight', 'szt', 0.31, 'KNR 5-08 1402'),
    ('Oprawa awaryjna', 'szt', 0.60, 'KNR 5-08 1409'),
    ('Plafon LED', 'szt', 0.68, 'KNR 5-08 1401'),
    ('Wyłącznik nadprądowy 1P', 'szt', 0.20, 'KNR 5-08 1501'),
    ('Wyłącznik różnicowoprądowy', 'szt', 0.30, 'KNR 5-08 1502'),
    ('Ogranicznik SPD T2', 'szt', 0.45, 'KNR 5-08 1505'),
    ('Bruzdowanie w cegle', 'mb', 0.85, 'KNR 5-08 0101'),
    ('Bruzdowanie w betonie', 'mb', 2.00, 'KNR 5-08 0103'),
    ('Bruzdowanie w gazobetonie', 'mb', 0.55, 'KNR 5-08 0112'),
    ('Bruzdowanie w żelbecie', 'mb', 2.50, 'KNR 5-08 0110'),
    ('Wykucie otworu pod puszkę', 'szt', 0.20, 'KNR 5-04 0401-03'),
    ('Wykucie otworu pod puszkę w betonie', 'szt', 0.40, 'KNR 5-04 0401-04'),
    ('Zaprawianie bruzd', 'mb', 0.12, 'KNR 5-08 0107'),
    ('Układanie przewodu YDYp 3×1.5', 'mb', 0.13, 'KNR 5-08 0201'),
    ('Układanie przewodu YDYp 3×2.5', 'mb', 0.16, 'KNR 5-08 0202'),
    ('Układanie przewodu YDYp 5×2.5', 'mb', 0.20, 'KNR 5-08 0203'),
    ('Układanie kabla YKY 5×16', 'mb', 0.22, 'KNR 5-10 0301'),
    ('Układanie skrętki UTP kat. 6', 'mb', 0.10, 'KNR 5-12 0201'),
    ('Pomiar rezystancji izolacji obwodu', 'szt', 0.30, 'ES-POM-001'),
    ('Pomiar impedancji pętli zwarcia', 'szt', 0.40, 'ES-POM-002')
  ) AS v(name, unit, hours, code)
  WHERE NOT EXISTS (
    SELECT 1 FROM catalog_items c
    WHERE c.user_id IS NULL AND c.name = v.name
  );
END $$;
