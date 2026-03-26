-- Fix es_dictionary entries with NULL category — assign correct categories
-- 90 entries were uncategorized, now properly assigned

UPDATE es_dictionary SET category = 'aparatura'
WHERE user_id IS NULL AND category IS NULL AND keyword LIKE '%aparat elektryczny%';

UPDATE es_dictionary SET category = 'pomiary'
WHERE user_id IS NULL AND category IS NULL
  AND (keyword LIKE '%badanie kabla%' OR keyword LIKE '%badanie linii kablowej%');

UPDATE es_dictionary SET category = 'roboty_ziemne'
WHERE user_id IS NULL AND category IS NULL
  AND (keyword LIKE '%glebokosc wykopu%' OR keyword LIKE '%grunt kategorii%'
    OR keyword LIKE '%nasypanie piasku%' OR keyword LIKE '%nasypanie warstwy%'
    OR keyword LIKE '%nawierzchnia%' OR keyword LIKE '%odtworzenie nawierzchni%'
    OR keyword LIKE '%podsypka%' OR keyword LIKE '%roboty ziemne%'
    OR keyword LIKE '%uslugi ziemne%' OR keyword LIKE '%wykop%');

UPDATE es_dictionary SET category = 'gniazda_wylaczniki'
WHERE user_id IS NULL AND category IS NULL
  AND (keyword LIKE '%gniazdo nieruchome%' OR keyword LIKE '%gniazdo przemyslowe%');

UPDATE es_dictionary SET category = 'kablowanie'
WHERE user_id IS NULL AND category IS NULL
  AND (keyword LIKE '%kabel ydy%' OR keyword LIKE '%kabel ydyp%'
    OR keyword LIKE '%kabel ydyzo%' OR keyword LIKE '%kabel yndy%'
    OR keyword LIKE '%kabel yndyp%' OR keyword LIKE '%przewod ydy%'
    OR keyword LIKE '%przewody ydy%' OR keyword LIKE '%ukladanie kabla%'
    OR keyword LIKE '%ukladanie przewodow%' OR keyword LIKE '%ulozenie przewodow%'
    OR keyword LIKE '%uslugi powierzchniowe poziome%');

UPDATE es_dictionary SET category = 'osprzet'
WHERE user_id IS NULL AND category IS NULL AND keyword LIKE '%koncowka kablowa%';

UPDATE es_dictionary SET category = 'rury_trasy'
WHERE user_id IS NULL AND category IS NULL
  AND (keyword LIKE '%konstrukcje wsporcze%' OR keyword LIKE '%koryta kablowe%');

UPDATE es_dictionary SET category = 'oswietlenie'
WHERE user_id IS NULL AND category IS NULL
  AND (keyword LIKE '%mocowanie osprzetu oswietleniowego%'
    OR keyword LIKE '%przygotowanie podloze oswietlenie%'
    OR keyword LIKE '%przygotowanie podloze osprzet%');

UPDATE es_dictionary SET category = 'rury_instalacyjne'
WHERE user_id IS NULL AND category IS NULL
  AND (keyword LIKE '%montaz przepustow%' OR keyword LIKE '%przebicie otworu%'
    OR keyword LIKE '%przebijanie otworow%' OR keyword LIKE '%przepust hermetyczny%');

UPDATE es_dictionary SET category = 'kable_energetyczne'
WHERE user_id IS NULL AND category IS NULL AND keyword LIKE '%zarobienie%';
