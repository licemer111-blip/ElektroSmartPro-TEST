-- Full fuzzy match tests for ES-Engine quality verification

SELECT 'T1_gniazdko' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('gniazdko') LIMIT 2

UNION ALL

SELECT 'T2_wylacznik' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('wylacznik swiatla') LIMIT 2

UNION ALL

SELECT 'T3_bruzda' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('kucie bruzdy w betonie') LIMIT 2

UNION ALL

SELECT 'T4_kabel_ydy' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('kabel YDYp 3x2.5') LIMIT 2

UNION ALL

SELECT 'T5_rozdzielnica' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('montaz tablicy rozdzielczej') LIMIT 2

UNION ALL

SELECT 'T6_oprawa_led' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('oprawa led panel 60x60') LIMIT 2

UNION ALL

SELECT 'T7_solar_pv' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('montaz paneli fotowoltaicznych') LIMIT 2

UNION ALL

SELECT 'T8_klimatyzacja' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('instalacja klimatyzacji split') LIMIT 2

UNION ALL

SELECT 'T9_uziemienie' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('uziom pionowy bednarka') LIMIT 2

UNION ALL

SELECT 'T10_mcb_bezpiecznik' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('bezpiecznik nadpradowy B16') LIMIT 2

ORDER BY test;
