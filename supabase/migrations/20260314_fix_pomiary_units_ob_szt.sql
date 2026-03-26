-- Fix invalid units in pomiary categories:
-- obwód → ob (short form, in allowed list)
-- uziom → szt (per earth electrode = piece)
-- pomieszczenie → szt (per room = piece)

UPDATE es_dictionary SET unit = 'ob'  WHERE category = 'pomiary_badania'    AND unit = 'obwód'         AND user_id IS NULL;
UPDATE es_dictionary SET unit = 'szt' WHERE category = 'pomiary_badania'    AND unit = 'uziom'         AND user_id IS NULL;
UPDATE es_dictionary SET unit = 'szt' WHERE category = 'pomiary_badania'    AND unit = 'pomieszczenie' AND user_id IS NULL;
UPDATE es_dictionary SET unit = 'ob'  WHERE category = 'remonty_pomiary'    AND unit = 'obwód'         AND user_id IS NULL;
UPDATE es_dictionary SET unit = 'szt' WHERE category = 'remonty_pomiary'    AND unit = 'uziom'         AND user_id IS NULL;
UPDATE es_dictionary SET unit = 'ob'  WHERE category = 'pomiary_dokumentacja' AND unit = 'obwód'       AND user_id IS NULL;
UPDATE es_dictionary SET unit = 'szt' WHERE category = 'pomiary_dokumentacja' AND unit = 'uziom'       AND user_id IS NULL;
UPDATE es_dictionary SET unit = 'szt' WHERE category = 'pomiary_dokumentacja' AND unit = 'pomieszczenie' AND user_id IS NULL;
