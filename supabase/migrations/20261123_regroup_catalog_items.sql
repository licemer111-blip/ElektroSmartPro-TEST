-- Shared catalog rows follow the job. Rows an electrician filed himself stay put.

UPDATE public.catalog_items AS item
SET category_id = (
  SELECT id FROM public.catalog_categories
  WHERE name ILIKE '%osprzęt%'
  ORDER BY length(name)
  LIMIT 1
)
WHERE item.user_id IS NULL
  AND item.category_id IN (
    SELECT id FROM public.catalog_categories
    WHERE name ILIKE '%okablow%' AND name NOT ILIKE '%osprzęt%'
  )
  AND item.name ~* '(gniazd|łącznik|lacznik|włącznik|wlacznik|puszk|ramk|ściemniacz|sciemniacz)'
  AND item.name !~* 'gniazdkow';

UPDATE public.catalog_items AS item
SET category_id = (
  SELECT id FROM public.catalog_categories
  WHERE name ILIKE '%oświetlen%'
  ORDER BY length(name)
  LIMIT 1
)
WHERE item.user_id IS NULL
  AND item.category_id IN (
    SELECT id FROM public.catalog_categories
    WHERE name ILIKE '%okablow%'
  )
  AND item.name ~* '(opraw|downlight|plafon|kinkiet|naświetlacz|naswietlacz)';

UPDATE public.catalog_items AS item
SET category_id = (
  SELECT id FROM public.catalog_categories
  WHERE (name = 'Okablowanie' OR name ILIKE 'Kable%' OR name ILIKE 'Przewody%')
    AND name NOT ILIKE '%struktural%'
  ORDER BY CASE WHEN name = 'Okablowanie' THEN 0 ELSE 1 END, length(name)
  LIMIT 1
)
WHERE item.user_id IS NULL
  AND item.category_id IN (
    SELECT id FROM public.catalog_categories
    WHERE name ILIKE '%osprzęt%'
  )
  AND item.name ~* '(ydy|yky|nhxh|przewód|przewod|kabel)'
  AND item.name !~* '(gniazdo |łącznik|włącznik|puszka|ramka)';
