-- Old size-split chases were lump zł next to the one norma ES row
-- (Bruzdowanie w cegle 0.85, w betonie 2.00). Hide the duplicates and glued typos.
-- Already saved project rows keep the price they were given.

UPDATE catalog_items
SET is_active = false
WHERE user_id IS NULL
  AND is_active = true
  AND (
    name ~* 'bruzdzieutr|bruździeutr'
    OR name ~* '^Bruzda w (betonie|cegle|cegle silikatowej|płycie|plycie|tynku)'
    OR name ~* '^Wykucie bruzdy w .+1x1cm'
  );
