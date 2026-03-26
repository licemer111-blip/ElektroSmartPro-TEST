-- ============================================================
-- ES-Engine Dictionary Seed v11.0 — Gniazda, Wyłączniki, Punkty
-- KNR 5-04 rozdział 05: Osprzęt instalacyjny
-- Pokrywa braki: gniazda 230V (standardowe, IP44, IP20, podwójne),
-- wyłączniki, przyciski, punkty elektryczne p/t i n/t
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES

-- ═══════════════════════════════════════════════════════════════
-- GNIAZDA 230V — PODTYNKOWE (p/t)
-- ═══════════════════════════════════════════════════════════════

('gniazdo 230v',              'KNR 5-04 0501-01', 'Gniazdo 230V p/t montaż',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.0),
('gniazdo elektryczne',       'KNR 5-04 0501-01', 'Gniazdo 230V p/t montaż',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 0.9),
('gniazdo pt',                'KNR 5-04 0501-01', 'Gniazdo 230V p/t montaż',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.0),
('gniazdo p/t',               'KNR 5-04 0501-01', 'Gniazdo 230V p/t montaż',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.2),
('gniazdko',                  'KNR 5-04 0501-01', 'Gniazdo 230V p/t montaż',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 0.9),
('gniazdko 230v',             'KNR 5-04 0501-01', 'Gniazdo 230V p/t montaż',          'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.1),
('gniazdo 1x230v',            'KNR 5-04 0501-01', 'Gniazdo 1×230V p/t montaż',       'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.3),
('gniazdo 1x230',             'KNR 5-04 0501-01', 'Gniazdo 1×230V p/t montaż',       'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.3),
('gniazdo pojedyncze',        'KNR 5-04 0501-01', 'Gniazdo 230V pojedyncze p/t',     'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.1),
('punkt elektryczny',         'KNR 5-04 0501-01', 'Punkt elektryczny 230V p/t',       'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 0.9),
('punkt 230v',                'KNR 5-04 0501-01', 'Punkt 230V p/t',                   'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.1),

-- Gniazdo z ramką (z ramką p/t)
('gniazdo z ramka',           'KNR 5-04 0501-01', 'Gniazdo 230V z ramką p/t',        'robocizna', false, NULL, 0.35, 'szt', 'osprzet', 1.2),
('gniazdo 1x230v z ramka',    'KNR 5-04 0501-01', 'Gniazdo 1×230V z ramką p/t',      'robocizna', false, NULL, 0.35, 'szt', 'osprzet', 1.4),
('gniazdo 1x230 z ramka pt',  'KNR 5-04 0501-01', 'Gniazdo 1×230V z ramką p/t',      'robocizna', false, NULL, 0.35, 'szt', 'osprzet', 1.4),

-- Gniazda podwójne
('gniazdo podwojne',          'KNR 5-04 0501-02', 'Gniazdo 2×230V p/t montaż',       'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.1),
('gniazdo 2x230v',            'KNR 5-04 0501-02', 'Gniazdo 2×230V p/t montaż',       'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.3),
('gniazdo 2x230',             'KNR 5-04 0501-02', 'Gniazdo 2×230V p/t montaż',       'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.3),
('gniazdo dublowane',         'KNR 5-04 0501-02', 'Gniazdo podwójne 230V p/t',       'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.0),
('gniazdo duo',               'KNR 5-04 0501-02', 'Gniazdo 2×230V p/t montaż',       'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.0),
('gniazdo 2-krotne',          'KNR 5-04 0501-02', 'Gniazdo 2×230V p/t montaż',       'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.2),
('zestaw gniazdek 2x230v',    'KNR 5-04 0501-02', 'Gniazdo 2×230V p/t montaż',       'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.3),
('zestaw gniazd 2x230v',      'KNR 5-04 0501-02', 'Zestaw gniazd 2×230V p/t',        'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.4),
('zestaw gniazd 2x230',       'KNR 5-04 0501-02', 'Zestaw gniazd 2×230V p/t',        'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.4),

-- ═══════════════════════════════════════════════════════════════
-- GNIAZDA IP44 / IP54 — BRYZGOSZCZELNE (łazienka, garaż)
-- ═══════════════════════════════════════════════════════════════

('gniazdo ip44',              'KNR 5-04 0502-01', 'Gniazdo 230V IP44 p/t montaż',    'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.3),
('gniazdo ip 44',             'KNR 5-04 0502-01', 'Gniazdo 230V IP44 p/t montaż',    'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.3),
('gniazdo bryzgoszczelne',    'KNR 5-04 0502-01', 'Gniazdo 230V bryzgoszczelne',     'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.2),
('gniazdo lazienka',          'KNR 5-04 0502-01', 'Gniazdo 230V IP44 łazienka',      'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.0),
('gniazdo 1x230 ip44',        'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 p/t',         'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.5),
('gniazdo 1x230v ip44',       'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 p/t',         'robocizna', false, NULL, 0.40, 'szt', 'osprzet', 1.5),
('gniazdo ip44 z ramka',      'KNR 5-04 0502-01', 'Gniazdo IP44 z ramką p/t',        'robocizna', false, NULL, 0.42, 'szt', 'osprzet', 1.5),
('gniazdo 1x230 ip44 z ramka pt', 'KNR 5-04 0502-01', 'Gniazdo 1×230V IP44 z ramką p/t', 'robocizna', false, NULL, 0.42, 'szt', 'osprzet', 1.6),
('gniazdo ip54',              'KNR 5-04 0502-02', 'Gniazdo 230V IP54 p/t montaż',    'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.3),
('gniazdo hermetyczne',       'KNR 5-04 0502-02', 'Gniazdo 230V hermetyczne IP54',   'robocizna', false, NULL, 0.45, 'szt', 'osprzet', 1.2),

-- IP20 (standardowe, oficjalny opis projektu)
('gniazdo ip20',              'KNR 5-04 0501-01', 'Gniazdo 230V IP20 p/t montaż',    'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.3),
('gniazdo 1x230 ip20',        'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 p/t',         'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.5),
('gniazdo 1x230v ip20',       'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 p/t',         'robocizna', false, NULL, 0.33, 'szt', 'osprzet', 1.5),
('gniazdo ip20 z ramka',      'KNR 5-04 0501-01', 'Gniazdo IP20 z ramką p/t',        'robocizna', false, NULL, 0.35, 'szt', 'osprzet', 1.5),
('gniazdo 1x230 ip20 z ramka pt', 'KNR 5-04 0501-01', 'Gniazdo 1×230V IP20 z ramką p/t', 'robocizna', false, NULL, 0.35, 'szt', 'osprzet', 1.6),

-- ═══════════════════════════════════════════════════════════════
-- GNIAZDA NATYNKOWE (n/t)
-- ═══════════════════════════════════════════════════════════════

('gniazdo natynkowe',         'KNR 5-04 0503-01', 'Gniazdo 230V n/t montaż',         'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.1),
('gniazdo nt',                'KNR 5-04 0503-01', 'Gniazdo 230V n/t montaż',         'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.0),
('gniazdo n/t',               'KNR 5-04 0503-01', 'Gniazdo 230V n/t montaż',         'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.2),
('gniazdo 1x230v nt',         'KNR 5-04 0503-01', 'Gniazdo 1×230V n/t montaż',      'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- WYŁĄCZNIKI / ŁĄCZNIKI
-- ═══════════════════════════════════════════════════════════════

('wylacznik',                 'KNR 5-04 0504-01', 'Wyłącznik instalacyjny p/t montaż','robocizna', false, NULL, 0.25, 'szt', 'osprzet', 0.9),
('wylacznik swiatla',         'KNR 5-04 0504-01', 'Wyłącznik oświetlenia p/t',       'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.1),
('lacnik',                    'KNR 5-04 0504-01', 'Łącznik instalacyjny p/t',         'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.0),
('lacze jednobiegunowe',      'KNR 5-04 0504-01', 'Łącznik 1-biegunowy p/t',         'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.2),
('wylacznik jednobiegunowy',  'KNR 5-04 0504-01', 'Wyłącznik 1-biegunowy p/t',       'robocizna', false, NULL, 0.25, 'szt', 'osprzet', 1.2),
('wylacznik schodowy',        'KNR 5-04 0504-02', 'Łącznik schodowy p/t montaż',     'robocizna', false, NULL, 0.28, 'szt', 'osprzet', 1.3),
('lacnik schodowy',           'KNR 5-04 0504-02', 'Łącznik schodowy p/t montaż',     'robocizna', false, NULL, 0.28, 'szt', 'osprzet', 1.3),
('wylacznik krzyżowy',        'KNR 5-04 0504-03', 'Łącznik krzyżowy p/t montaż',    'robocizna', false, NULL, 0.30, 'szt', 'osprzet', 1.3),
('lacnik krzyzowy',           'KNR 5-04 0504-03', 'Łącznik krzyżowy p/t montaż',    'robocizna', false, NULL, 0.30, 'szt', 'osprzet', 1.3),
('przycisk dzwonkowy',        'KNR 5-04 0504-04', 'Przycisk dzwonkowy p/t montaż',  'robocizna', false, NULL, 0.22, 'szt', 'osprzet', 1.2),
('przycisk',                  'KNR 5-04 0504-04', 'Przycisk instalacyjny p/t',       'robocizna', false, NULL, 0.22, 'szt', 'osprzet', 0.8),
('wylacznik z ramka',         'KNR 5-04 0504-01', 'Wyłącznik z ramką p/t montaż',   'robocizna', false, NULL, 0.27, 'szt', 'osprzet', 1.2),
('wylacznik pt z ramka',      'KNR 5-04 0504-01', 'Wyłącznik p/t z ramką montaż',   'robocizna', false, NULL, 0.27, 'szt', 'osprzet', 1.3),

-- ═══════════════════════════════════════════════════════════════
-- GNIAZDA SPECJALNE: USB, 3-fazowe, przemysłowe
-- ═══════════════════════════════════════════════════════════════

('gniazdo usb',               'KNR 5-04 0505-01', 'Gniazdo USB p/t montaż',          'robocizna', false, NULL, 0.35, 'szt', 'osprzet', 1.2),
('gniazdo z usb',             'KNR 5-04 0505-01', 'Gniazdo 230V+USB p/t montaż',    'robocizna', false, NULL, 0.35, 'szt', 'osprzet', 1.3),
('gniazdo 230v usb',          'KNR 5-04 0505-01', 'Gniazdo 230V+USB p/t montaż',    'robocizna', false, NULL, 0.35, 'szt', 'osprzet', 1.3),
('gniazdo 3-fazowe',          'KNR 5-04 0506-01', 'Gniazdo 3-fazowe 16A montaż',    'robocizna', false, NULL, 0.60, 'szt', 'osprzet', 1.3),
('gniazdo trojfazowe',        'KNR 5-04 0506-01', 'Gniazdo 3-fazowe 16A montaż',    'robocizna', false, NULL, 0.60, 'szt', 'osprzet', 1.2),
('gniazdo 3x230v',            'KNR 5-04 0506-01', 'Gniazdo 3-fazowe montaż',        'robocizna', false, NULL, 0.60, 'szt', 'osprzet', 1.2),
('gniazdo 400v',              'KNR 5-04 0506-01', 'Gniazdo 400V 3-faz montaż',      'robocizna', false, NULL, 0.60, 'szt', 'osprzet', 1.2),
('gniazdo cee 16a',           'KNR 5-04 0506-01', 'Gniazdo CEE 16A 5-pin montaż',   'robocizna', false, NULL, 0.60, 'szt', 'osprzet', 1.4),
('gniazdo cee 32a',           'KNR 5-04 0506-02', 'Gniazdo CEE 32A 5-pin montaż',   'robocizna', false, NULL, 0.80, 'szt', 'osprzet', 1.4),
('gniazdo przemyslowe',       'KNR 5-04 0506-01', 'Gniazdo przemysłowe CEE montaż', 'robocizna', false, NULL, 0.60, 'szt', 'osprzet', 1.1),

-- ═══════════════════════════════════════════════════════════════
-- PUSZKI INSTALACYJNE
-- ═══════════════════════════════════════════════════════════════

('puszka instalacyjna',       'KNR 5-04 0201-01', 'Puszka instalacyjna p/t montaż',  'robocizna', false, NULL, 0.10, 'szt', 'osprzet', 1.1),
('puszka pt',                 'KNR 5-04 0201-01', 'Puszka p/t montaż',               'robocizna', false, NULL, 0.10, 'szt', 'osprzet', 1.0),
('puszka p/t',                'KNR 5-04 0201-01', 'Puszka p/t montaż',               'robocizna', false, NULL, 0.10, 'szt', 'osprzet', 1.2),
('podrozdetnik',              'KNR 5-04 0201-01', 'Podrozdetnik p/t montaż',         'robocizna', false, NULL, 0.10, 'szt', 'osprzet', 0.9),
('podrozdetnik pt',           'KNR 5-04 0201-01', 'Podrozdetnik p/t montaż',         'robocizna', false, NULL, 0.10, 'szt', 'osprzet', 1.0),
('puszka rozgalezna',         'KNR 5-04 0202-01', 'Puszka rozgałęźna p/t montaż',   'robocizna', false, NULL, 0.18, 'szt', 'osprzet', 1.2),
('puszka odgalezna',          'KNR 5-04 0202-01', 'Puszka odgałęźna montaż',        'robocizna', false, NULL, 0.18, 'szt', 'osprzet', 1.2),
('puszka hermetyczna',        'KNR 5-04 0203-01', 'Puszka hermetyczna IP44 montaż',  'robocizna', false, NULL, 0.20, 'szt', 'osprzet', 1.2)

ON CONFLICT (keyword_normalized) DO NOTHING;
