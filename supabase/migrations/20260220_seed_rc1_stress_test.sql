-- ============================================================
-- STRESS TEST SEED: Resydencja 400m2 - RC1
-- Run in: Supabase SQL Editor (Table Editor → SQL)
-- Purpose: Release 1.0 validation — 40+ circuits, 3 meters,
--          15 KNX controllers, ZUG terminals for every circuit
-- ============================================================
-- IMPORTANT: auth.uid() = NULL in SQL Editor (runs as postgres).
-- This script selects the FIRST user from auth.users automatically.
-- If you have multiple users, replace the subquery with your UUID:
--   (SELECT id FROM auth.users WHERE email = 'your@email.com')
-- ============================================================

DO $OUTER$
DECLARE
  v_uid uuid;
BEGIN
  -- Get first registered user (change WHERE clause if needed)
  SELECT id INTO v_uid FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No users found in auth.users — log in to the app first';
  END IF;

  -- Remove any previous RC1 test data for this user
  DELETE FROM panel_configurations
    WHERE name = 'Resydencja 400m2 - RC1' AND user_id = v_uid;

  INSERT INTO panel_configurations (user_id, name, config_json)
  VALUES (
    v_uid,
    'Resydencja 400m2 - RC1',
    $CONFIG$
  {
    "panelName": "Resydencja 400m2 - RC1",
    "manufacturerId": "hager",
    "customCoefficient": 1.0,
    "sections": [
      {
        "id": "rc1-rg-main",
        "name": "RG — Rozdzielnica Główna",
        "feed": "3ph",
        "type": "main",
        "enclosureModules": 144,
        "modules": [

          {"moduleId": "main-switch-4p",    "rating": 100, "label": "Rozłącznik Główny"},
          {"moduleId": "spd-t2-3p",         "rating": null, "label": "SPD T2 3P+N"},
          {"moduleId": "energy-meter-3p",   "rating": null, "label": "Licznik Energii Główny", "cableType": null, "circuitNumber": null},

          {"moduleId": "rcd-30-ac", "rating": 25, "label": "RCD Oświetlenie"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Salon",        "circuitNumber": "1",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Kuchnia",      "circuitNumber": "2",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Sypialnia 1",  "circuitNumber": "3",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Sypialnia 2",  "circuitNumber": "4",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Sypialnia 3",  "circuitNumber": "5",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Sypialnia 4",  "circuitNumber": "6",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Ogród",        "circuitNumber": "7",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Korytarz",     "circuitNumber": "8",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Łazienka",     "circuitNumber": "9",  "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Garaż",        "circuitNumber": "10", "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Taras",        "circuitNumber": "11", "cableType": "YDYp 3×1.5"},
          {"moduleId": "mcb-b-1p",  "rating": 10, "label": "Piwnica",      "circuitNumber": "12", "cableType": "YDYp 3×1.5"},

          {"moduleId": "rcd-30-a", "rating": 40, "label": "RCD Gniazda"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda AGD",       "circuitNumber": "13", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Kuchnia",   "circuitNumber": "14", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Salon 1",   "circuitNumber": "15", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Salon 2",   "circuitNumber": "16", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Sypialnia 1","circuitNumber": "17", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Sypialnia 2","circuitNumber": "18", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Sypialnia 3","circuitNumber": "19", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Sypialnia 4","circuitNumber": "20", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Garaż",     "circuitNumber": "21", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Zewnętrzne","circuitNumber": "22", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Łazienka 1","circuitNumber": "23", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Łazienka 2","circuitNumber": "24", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Biuro",     "circuitNumber": "25", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Piwnica",   "circuitNumber": "26", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Korytarz",  "circuitNumber": "27", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Taras",     "circuitNumber": "28", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Ogród 1",   "circuitNumber": "29", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Gniazda Ogród 2",   "circuitNumber": "30", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Zmywarka",           "circuitNumber": "31", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Pralka",             "circuitNumber": "32", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Suszarka",           "circuitNumber": "33", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Piekarnik",          "circuitNumber": "34", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "Lodówka",            "circuitNumber": "35", "cableType": "YDYp 3×2.5"},
          {"moduleId": "mcb-b-1p", "rating": 16, "label": "TV+Komputery",       "circuitNumber": "36", "cableType": "YDYp 3×2.5"},

          {"moduleId": "mcb-c-3p", "rating": 32, "label": "Płyta Indukcyjna", "circuitNumber": "37", "cableType": "YDYp 5×6"},
          {"moduleId": "mcb-c-3p", "rating": 32, "label": "Ładowarka EV",     "circuitNumber": "38", "cableType": "YDYp 5×10"},
          {"moduleId": "mcb-c-3p", "rating": 25, "label": "Pompa Ciepła",     "circuitNumber": "39", "cableType": "YDYp 5×4"},

          {"moduleId": "knx-actuator",    "label": "KNX Oświetlenie 1"},
          {"moduleId": "knx-actuator",    "label": "KNX Oświetlenie 2"},
          {"moduleId": "knx-actuator",    "label": "KNX Oświetlenie 3"},
          {"moduleId": "knx-actuator",    "label": "KNX Oświetlenie 4"},
          {"moduleId": "knx-dimmer",      "label": "KNX Ściemniacz 1"},
          {"moduleId": "knx-dimmer",      "label": "KNX Ściemniacz 2"},
          {"moduleId": "knx-dimmer",      "label": "KNX Ściemniacz 3"},
          {"moduleId": "knx-blind",       "label": "KNX Rolety 1"},
          {"moduleId": "knx-blind",       "label": "KNX Rolety 2"},
          {"moduleId": "knx-blind",       "label": "KNX Rolety 3"},
          {"moduleId": "knx-power-supply","label": "KNX Zasilacz 1"},
          {"moduleId": "knx-power-supply","label": "KNX Zasilacz 2"},
          {"moduleId": "knx-ip-router",   "label": "KNX Router IP"},
          {"moduleId": "psu-24v",         "label": "Zasilacz 24V BMS"},
          {"moduleId": "smart-relay-4ch", "label": "Smart Relay KNX"},

          {"moduleId": "energy-meter-1p", "label": "Licznik PV"},
          {"moduleId": "energy-meter-1p", "label": "Podlicznik Pompy Ciepła"}
        ],
        "accessories": [
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.1"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.2"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.3"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.4"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.5"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.6"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.7"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.8"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.9"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.10"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.11"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.12"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.13"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.14"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.15"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.16"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.17"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.18"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.19"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.20"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.21"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.22"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.23"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.24"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.25"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.26"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.27"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.28"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.29"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.30"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.31"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.32"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.33"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.34"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.35"},
          {"moduleId": "terminal-zug-1p", "quantity": 1, "label": "ZUG Obw.36"},
          {"moduleId": "terminal-zug-3p", "quantity": 1, "label": "ZUG Płyta Indukcyjna"},
          {"moduleId": "terminal-zug-3p", "quantity": 1, "label": "ZUG Ładowarka EV"},
          {"moduleId": "terminal-zug-3p", "quantity": 1, "label": "ZUG Pompa Ciepła"},
          {"moduleId": "marking-strip",   "quantity": 1, "label": "Oznaczniki obwodów RC1"}
        ]
      }
    ]
  }
  $CONFIG$::jsonb
  );

  RAISE NOTICE 'RC1 inserted for user: %', v_uid;
END;
$OUTER$;

-- ============================================================
-- VERIFICATION QUERIES (run separately after the block above)
-- ============================================================

-- 1. Confirm the config was inserted
SELECT id, name, created_at,
  jsonb_array_length(config_json->'sections'->0->'modules')     AS total_modules,
  jsonb_array_length(config_json->'sections'->0->'accessories') AS total_accessories
FROM panel_configurations
WHERE name = 'Resydencja 400m2 - RC1';

-- 2. Check circuit count (breakers only)
SELECT COUNT(*) AS circuit_count
FROM panel_configurations pc,
  jsonb_array_elements(pc.config_json->'sections'->0->'modules') AS m
WHERE pc.name = 'Resydencja 400m2 - RC1'
  AND m->>'moduleId' IN ('mcb-b-1p','mcb-c-1p','mcb-c-3p','mcb-b-3p','rcbo-b30','rcbo-c30');

-- 3. Check meter labels (verify Licznik Główny / PV / Podlicznik)
SELECT m->>'moduleId' AS module_id,
       m->>'label'     AS label
FROM panel_configurations pc,
  jsonb_array_elements(pc.config_json->'sections'->0->'modules') AS m
WHERE pc.name = 'Resydencja 400m2 - RC1'
  AND m->>'moduleId' LIKE 'energy-meter%';

-- 4. Count ZUG accessories (expect 39: 36×1P + 3×3P)
SELECT COUNT(*) AS zug_count
FROM panel_configurations pc,
  jsonb_array_elements(pc.config_json->'sections'->0->'accessories') AS a
WHERE pc.name = 'Resydencja 400m2 - RC1'
  AND a->>'moduleId' IN ('terminal-zug-1p','terminal-zug-3p');
