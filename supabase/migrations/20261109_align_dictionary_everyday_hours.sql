-- Everyday dictionary words were still on the old short hours.
-- The norm files and the name list already use the ES hours below.
-- Filling a chase (zamurowanie) is a different job and stays as stored.

UPDATE es_dictionary
SET labor_norm_rbh = 0.85, unit = 'mb', knr_ref = 'KNR 5-08 0101'
WHERE user_id IS NULL
  AND keyword IN (
    'bruzdowanie w cegle',
    'bruzda cegła',
    'wykucie bruzdy cegła',
    'bruzdowanie cegła',
    'bruzda w cegle'
  );

UPDATE es_dictionary
SET labor_norm_rbh = 2.00, unit = 'mb', knr_ref = 'KNR 5-08 0103'
WHERE user_id IS NULL
  AND keyword IN (
    'bruzdowanie betonie',
    'bruzdowanie w betonie instalacje',
    'bruzdowanie w betonie',
    'wykucie bruzdy beton',
    'bruzdowanie beton',
    'bruzda beton wielka płyta',
    'bruzda w betonie',
    'bruzda beton'
  );

UPDATE es_dictionary
SET labor_norm_rbh = 2.50, unit = 'mb', knr_ref = 'KNR 5-08 0110'
WHERE user_id IS NULL
  AND keyword = 'bruzda w betonie zbrojonym';

UPDATE es_dictionary
SET labor_norm_rbh = 0.55, unit = 'mb', knr_ref = 'KNR 5-08 0112'
WHERE user_id IS NULL
  AND keyword IN ('bruzda w ytong gazobetonowe', 'bruzda w gazobetonie');

UPDATE es_dictionary
SET labor_norm_rbh = 0.68, unit = 'szt', knr_ref = 'KNR 5-08 0401'
WHERE user_id IS NULL AND keyword = 'gniazdo pojedyncze';

UPDATE es_dictionary
SET labor_norm_rbh = 0.82, unit = 'szt', knr_ref = 'KNR 5-08 0402'
WHERE user_id IS NULL AND keyword = 'gniazdo podwojne';

UPDATE es_dictionary
SET labor_norm_rbh = 0.13, unit = 'mb', knr_ref = 'KNR 5-08 0201 5101-08'
WHERE user_id IS NULL
  AND keyword IN ('ydyp 3x1,5', 'przewod ydyp 3x1,5');

UPDATE es_dictionary
SET labor_norm_rbh = 0.16, unit = 'mb', knr_ref = 'KNR 5-08 0202'
WHERE user_id IS NULL
  AND keyword IN (
    'przewod ydyp 3x2.5',
    'okablowanie ydyp 3x2.5',
    'kabel ydyp 3x2.5',
    'ydyp 3x2.5',
    'ydyp 3x2,5',
    'przewod ydyp 3x2,5'
  );

UPDATE es_dictionary
SET labor_norm_rbh = 0.45, unit = 'szt', knr_ref = 'KNR 5-08 0501'
WHERE user_id IS NULL
  AND keyword IN ('lacznik', 'wlacznik', 'wylacznik swiatla', 'wylacznik w betonie', 'wylacznik w cegle');

UPDATE es_dictionary
SET labor_norm_rbh = 0.54, unit = 'szt', knr_ref = 'KNR 5-08 0503'
WHERE user_id IS NULL AND keyword = 'wylacznik schodowy';

UPDATE es_dictionary
SET labor_norm_rbh = 0.15, unit = 'szt', knr_ref = 'KNR 5-08 0201 9008-01'
WHERE user_id IS NULL
  AND keyword IN ('wylacznik 1p', 'wylacznik nadpradowy 1p');

UPDATE es_dictionary
SET labor_norm_rbh = 0.25, unit = 'szt', knr_ref = 'KNR 5-08 0203'
WHERE user_id IS NULL
  AND keyword IN ('wylacznik 3p', 'wylacznik nadpradowy 3p');
