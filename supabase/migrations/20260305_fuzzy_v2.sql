(SELECT 'T1_gniazdko' AS test, label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim FROM es_dictionary_fuzzy_match('gniazdko') LIMIT 2)
UNION ALL
(SELECT 'T2_wylacznik', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('wylacznik swiatla') LIMIT 2)
UNION ALL
(SELECT 'T3_bruzda', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('kucie bruzdy w betonie') LIMIT 2)
UNION ALL
(SELECT 'T4_kabel_ydy', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('kabel YDYp 3x2.5') LIMIT 2)
UNION ALL
(SELECT 'T5_rozdzielnica', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('montaz tablicy rozdzielczej') LIMIT 2)
UNION ALL
(SELECT 'T6_oprawa_led', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('oprawa led panel 60x60') LIMIT 2)
UNION ALL
(SELECT 'T7_solar_pv', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('montaz paneli fotowoltaicznych') LIMIT 2)
UNION ALL
(SELECT 'T8_klimatyzacja', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('instalacja klimatyzacji split') LIMIT 2)
UNION ALL
(SELECT 'T9_uziemienie', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('uziom pionowy bednarka') LIMIT 2)
UNION ALL
(SELECT 'T10_mcb', label, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) FROM es_dictionary_fuzzy_match('bezpiecznik nadpradowy B16') LIMIT 2)
ORDER BY test;
