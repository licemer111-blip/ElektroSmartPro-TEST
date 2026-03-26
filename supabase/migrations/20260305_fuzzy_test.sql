-- Fuzzy match verification tests
SELECT 'gniazdko' AS input, label, type, knr_ref, labor_norm_rbh, category, ROUND(sim::numeric,3) AS sim
FROM es_dictionary_fuzzy_match('gniazdko') LIMIT 3;
