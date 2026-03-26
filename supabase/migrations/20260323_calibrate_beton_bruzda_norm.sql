-- Calibration: concrete bruzdowanie norm 0.18 → 0.25 rbh/mb
-- Goal: establish clear ~25% price gap between concrete and soft materials (Ytong).
--
-- Before: bruzda w betonie = 0.18 rbh → 16.20 PLN/mb  (< Ytong 18.00 — inverted!)
-- After:  bruzda w betonie = 0.25 rbh → 22.50 PLN/mb  (> Ytong 18.00 — correct ✓)
--
-- Ytong stays at 0.20 rbh → 18.00 PLN/mb (KNR 5-04 0101-04, unchanged)
--
-- All keyword_encodes_surface=TRUE beton entries updated (12 rows):
--   bruzda beton, bruzda beton wielka płyta, bruzda w betonie,
--   bruzda w betonie zbrojonym, bruzdowanie beton, bruzdowanie betonie,
--   bruzdowanie w betonie, bruzdowanie w betonie instalacje,
--   wykucie bruzdy beton, zamurowanie bruzdy betonowej, ...

UPDATE es_dictionary
SET labor_norm_rbh = 0.25
WHERE keyword_encodes_surface = TRUE
  AND labor_norm_rbh = 0.18
  AND keyword ILIKE '%beton%';
