#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ES-Engine Dictionary Seed v4.0 Generator
=========================================
Generates SQL INSERT statements for es_dictionary covering:
- Cable matrix: YDY/YDYp/YKY/LGY/NHXH/NHXMH/HDGs — all cross-sections 1.5-240mm²
- Industrial: Siłowe 16A/32A/63A, korytka siatkowe/perforowane, rury stalowe
- Residential Smart Home: maty grzejne, termostaty, rolety, KNX, DALI
- Teletechnika: LAN/RACK, CCTV, SSWiN/Satel, PPOŻ NHXH
- PPOŻ: czujki dymu/temp, ROP, DSO, sygnalizatory
- Automation KNX/DALI/BMS
- Full dismantling spectrum (demontaż miedzi/aluminium)
- Synonym keywords (slangs: S-ka, bezpiecznik, gniazdko, etc.)

Output: supabase/migrations/20260304_seed_es_dictionary_v4.sql
Run:    python scripts/generate-industrial-seed.py
"""

import os
import re

OUTPUT_FILE = os.path.join(
    os.path.dirname(__file__), "..", "supabase", "migrations",
    "20260304_seed_es_dictionary_v4.sql"
)

# ─── RBH norms (roboczogodziny) per category / cable weight ─────────────────
# Source: KNR 5-04, KNR 5-09, KNR AT-26, rynek PL 2026
# Unit: rbh/100mb unless noted

def cable_rbh(cross_section: float, conductor_count: int, cable_type: str) -> float:
    """Calculate labor norm rbh/100mb based on cable weight/diameter."""
    weight_factor = (cross_section ** 0.5) * conductor_count * 0.15
    if cable_type in ("nhxh", "nhxmh", "hdgs"):
        weight_factor *= 1.3
    if cable_type in ("lgy", "lgyzo", "yky"):
        weight_factor *= 1.1
    base = 2.5 + weight_factor
    return round(min(base, 12.0), 2)

def knr_cable(cross_section: float, cable_type: str) -> str:
    """Map cross-section to KNR code."""
    if cross_section <= 2.5:   return "KNR 5-04 0101-01"
    if cross_section <= 6:     return "KNR 5-04 0101-02"
    if cross_section <= 16:    return "KNR 5-04 0102-01"
    if cross_section <= 35:    return "KNR 5-04 0102-02"
    if cross_section <= 70:    return "KNR 5-04 0102-03"
    if cross_section <= 120:   return "KNR 5-04 0102-04"
    if cross_section <= 185:   return "KNR 5-04 0102-05"
    return "KNR 5-04 0102-06"

def escape_sql(s: str) -> str:
    return s.replace("'", "''")

def normalize(s: str) -> str:
    """Simplified normalization matching the DB trigger logic."""
    diacritics = {
        'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
        'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z',
    }
    result = s.lower()
    for k, v in diacritics.items():
        result = result.replace(k, v)
    result = re.sub(r'[×x×]', 'x', result)
    result = re.sub(r'[,]', ' ', result)
    result = re.sub(r'\s+', ' ', result).strip()
    # remove units noise
    result = re.sub(r'\b(mb|szt|kpl|m2|m3|rbh|zl)\b', '', result).strip()
    result = re.sub(r'\s+', ' ', result).strip()
    return result

rows = []
seen_normalized = set()

def add_row(keyword, knr_ref, label, rtype, is_composite, labor_rbh, unit, category, confidence):
    norm = normalize(keyword)
    if norm in seen_normalized:
        return
    seen_normalized.add(norm)
    rows.append({
        "keyword": keyword,
        "knr_ref": knr_ref,
        "label": label,
        "type": rtype,
        "is_composite": "false",
        "labor_norm_rbh": labor_rbh,
        "unit": unit,
        "category": category,
        "confidence_weight": confidence,
    })

# ═══════════════════════════════════════════════════════════════════════════════
# 1. CABLE MATRIX — YDY, YDYp, YKY, LGY, NHXH, NHXMH, HDGs
# ═══════════════════════════════════════════════════════════════════════════════

CABLE_TYPES = {
    "ydy":   {"label_prefix": "Przewód YDY",   "cat": "kable_silnopradowe", "conf": 1.5},
    "ydyp":  {"label_prefix": "Przewód YDYp",  "cat": "kable_silnopradowe", "conf": 1.5},
    "ydyzo": {"label_prefix": "Przewód YDYżo", "cat": "kable_silnopradowe", "conf": 1.5},
    "yky":   {"label_prefix": "Kabel YKY",     "cat": "kable_silnopradowe", "conf": 1.5},
    "ykyzo": {"label_prefix": "Kabel YKYżo",   "cat": "kable_silnopradowe", "conf": 1.5},
    "lgy":   {"label_prefix": "Kabel LGY",     "cat": "kable_silnopradowe", "conf": 1.4},
    "lgyzo": {"label_prefix": "Kabel LGYżo",   "cat": "kable_silnopradowe", "conf": 1.4},
    "nhxh":  {"label_prefix": "Kabel NHXH",    "cat": "kable_silnopradowe", "conf": 1.4},
    "nhxmh": {"label_prefix": "Kabel NHXMHom", "cat": "kable_silnopradowe", "conf": 1.4},
    "hdgs":  {"label_prefix": "Kabel HDGs",    "cat": "kable_silnopradowe", "conf": 1.4},
    "nym":   {"label_prefix": "Przewód NYM",   "cat": "kable_silnopradowe", "conf": 1.3},
}

# Conductor combinations: (count, cross_section)
COMBOS = [
    (2, 1.5), (2, 2.5), (2, 4.0), (2, 6.0),
    (3, 1.5), (3, 2.5), (3, 4.0), (3, 6.0), (3, 10.0), (3, 16.0), (3, 25.0), (3, 35.0), (3, 50.0), (3, 70.0), (3, 95.0), (3, 120.0), (3, 150.0), (3, 185.0), (3, 240.0),
    (4, 1.5), (4, 2.5), (4, 4.0), (4, 6.0), (4, 10.0), (4, 16.0),
    (5, 1.5), (5, 2.5), (5, 4.0), (5, 6.0), (5, 10.0), (5, 16.0), (5, 25.0), (5, 35.0), (5, 50.0), (5, 70.0), (5, 95.0), (5, 120.0), (5, 150.0), (5, 185.0), (5, 240.0),
    (1, 6.0), (1, 10.0), (1, 16.0), (1, 25.0), (1, 35.0), (1, 50.0), (1, 70.0), (1, 95.0), (1, 120.0), (1, 150.0), (1, 185.0), (1, 240.0),
]

for ctype, cinfo in CABLE_TYPES.items():
    for n, cs in COMBOS:
        cs_str = str(int(cs)) if cs == int(cs) else str(cs)
        kw_norm = f"{ctype} {n}x{cs_str}"
        # "okablowanie" prefix variant
        kw_okab = f"okablowanie {ctype} {n}x{cs_str}"
        # "przewod"/"kabel" prefix variant
        prefix = "przewod" if ctype in ("ydy", "ydyp", "ydyzo", "nym") else "kabel"
        kw_full = f"{prefix} {ctype} {n}x{cs_str}"

        rbh = cable_rbh(cs, n, ctype)
        knr = knr_cable(cs, ctype)
        label = f"{cinfo['label_prefix']} {n}x{cs_str}"

        for kw in [kw_norm, kw_okab, kw_full]:
            add_row(kw, knr, label, "robocizna", False, rbh, "100mb", cinfo["cat"], cinfo["conf"])

# Single conductor variants: LGY/LGYzo (1x sections)
for cs in [6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240]:
    cs_str = str(cs)
    rbh = cable_rbh(cs, 1, "lgy")
    knr = knr_cable(cs, "lgy")
    for prefix in [f"lgy {cs_str}", f"lgyzo {cs_str}", f"przewod lgy {cs_str}", f"przewod lgyzo {cs_str}"]:
        add_row(prefix, knr, f"Kabel LGYżo 1x{cs_str}", "robocizna", False, rbh, "100mb", "kable_silnopradowe", 1.5)

# ═══════════════════════════════════════════════════════════════════════════════
# 2. TRASY KABLOWE PRZEMYSŁOWE — korytka siatkowe/perforowane, drabinki, rury
# ═══════════════════════════════════════════════════════════════════════════════

KORYTKO_WIDTHS = [50, 75, 100, 150, 200, 300, 400, 500, 600]
for w in KORYTKO_WIDTHS:
    # RBH grows with width
    rbh = round(0.10 + w * 0.0006, 2)
    for suffix, suf_label in [("siatkowe", "siatkowe"), ("perforowane", "perforowane"), ("", "kablowe")]:
        suf = f" {suffix}" if suffix else ""
        kw = f"korytko{suf} {w}"
        add_row(kw, "KNR 5-04 0701-01", f"Korytko kablowe{suf} {w}mm", "robocizna", False, rbh, "mb", "rury_trasy", 1.3)
    # "trasa kablowa Wmm"
    add_row(f"trasa kablowa {w}", "KNR 5-04 0701-01", f"Trasa kablowa {w}mm", "robocizna", False, rbh, "mb", "rury_trasy", 1.2)

# Drabinki kablowe
for w in [100, 150, 200, 300, 400, 500, 600]:
    rbh = round(0.25 + w * 0.0008, 2)
    add_row(f"drabinka kablowa {w}", "KNR 5-04 0701-03", f"Drabinka kablowa {w}mm", "robocizna", False, rbh, "mb", "rury_trasy", 1.3)

# Rury stalowe
RURY_STALOWE = [(20, 0.12), (25, 0.14), (32, 0.16), (40, 0.18), (50, 0.22), (63, 0.28), (75, 0.35)]
for d, rbh in RURY_STALOWE:
    for kw in [f"rura stalowa {d}", f"rura stalowa m{d}"]:
        add_row(kw, "KNR 5-04 0703-03", f"Rura stalowa M{d} montaz", "robocizna", False, rbh, "mb", "rury_trasy", 1.3)

# Rury PVC/Vinidur
RURY_PVC = [(16, 0.06), (20, 0.07), (25, 0.08), (32, 0.10), (40, 0.12), (50, 0.14), (63, 0.18)]
for d, rbh in RURY_PVC:
    for kw in [f"rura pvc {d}", f"rura vini {d}", f"rura m{d}", f"peszel m{d}"]:
        add_row(kw, "KNR 5-04 0703-01", f"Rura PVC/peszel M{d}", "robocizna", False, rbh, "mb", "rury_trasy", 1.2)

# Wysięgniki (cable brackets)
for kw, label, rbh in [
    ("wysiegnik", "Wysiegnik pod korytko montaz", 0.20),
    ("wspornik kablowy", "Wspornik kablowy montaz", 0.18),
    ("uchwyt kablowy", "Uchwyt kablowy montaz", 0.10),
    ("obejma kablowa", "Obejma kablowa montaz", 0.08),
]:
    add_row(kw, "KNR 5-04 0701-05", label, "robocizna", False, rbh, "szt", "rury_trasy", 1.1)

# ═══════════════════════════════════════════════════════════════════════════════
# 3. PRZEMYSŁ — Gniazda siłowe CEE, rozłączniki, szafy wolnostojące
# ═══════════════════════════════════════════════════════════════════════════════

SILOWE = [
    ("gniazdo silowe 16a", "KNR 5-04 0302-01", "Gniazdo siłowe CEE 16A 3P+N+PE", 0.40, "szt", 1.5),
    ("gniazdo silowe 32a", "KNR 5-04 0302-02", "Gniazdo siłowe CEE 32A 3P+N+PE", 0.60, "szt", 1.5),
    ("gniazdo silowe 63a", "KNR 5-04 0302-03", "Gniazdo siłowe CEE 63A 3P+N+PE", 1.00, "szt", 1.5),
    ("gniazdo silowe 125a", "KNR 5-04 0302-04", "Gniazdo siłowe CEE 125A 3P+N+PE", 1.50, "szt", 1.5),
    ("wtyczka silowa 16a", "KNR 5-04 0302-01", "Wtyczka siłowa CEE 16A", 0.30, "szt", 1.3),
    ("wtyczka silowa 32a", "KNR 5-04 0302-02", "Wtyczka siłowa CEE 32A", 0.45, "szt", 1.3),
    ("rozlacznik izolacyjny", "KNR 5-08 0101-01", "Rozłącznik izolacyjny montaz", 0.40, "szt", 1.3),
    ("rozlacznik 16a", "KNR 5-08 0101-01", "Rozłącznik 16A montaz", 0.40, "szt", 1.3),
    ("rozlacznik 32a", "KNR 5-08 0101-02", "Rozłącznik 32A montaz", 0.50, "szt", 1.3),
    ("rozlacznik 63a", "KNR 5-08 0101-03", "Rozłącznik 63A montaz", 0.70, "szt", 1.3),
    ("rozlacznik 100a", "KNR 5-08 0101-04", "Rozłącznik 100A montaz", 1.00, "szt", 1.3),
    ("rozlacznik 160a", "KNR 5-08 0101-05", "Rozłącznik 160A montaz", 1.20, "szt", 1.3),
    ("rozlacznik 250a", "KNR 5-08 0101-05", "Rozłącznik 250A montaz", 1.50, "szt", 1.3),
    ("wyłacznik silnikowy", "KNR 5-08 0201-01", "Wyłącznik silnikowy montaz", 0.40, "szt", 1.2),
    ("wyłacznik silnikowy ms", "KNR 5-08 0201-01", "Wyłącznik silnikowy MS montaz", 0.40, "szt", 1.3),
    ("szafa wolnostojaca", "KNR 5-08 0601-01", "Szafa wolnostojaca elektryczna montaz", 4.00, "szt", 1.3),
    ("szafa przemyslowa", "KNR 5-08 0601-01", "Szafa przemysłowa montaz", 4.00, "szt", 1.2),
    ("obudowa elektryczna", "KNR 5-08 0601-02", "Obudowa elektryczna montaz", 2.00, "szt", 1.1),
    ("szyna szybkoszynowa", "KNR 5-08 0701-01", "Szyna szybkoszynowa (busbar) montaz", 1.00, "mb", 1.2),
    ("szyna miedziowa", "KNR 5-08 0701-01", "Szyna miedziana Cu montaz", 0.80, "mb", 1.2),
    ("szyna aluminiowa", "KNR 5-08 0701-02", "Szyna aluminiowa montaz", 0.60, "mb", 1.1),
    ("falownik", "KNR 5-08 0301-01", "Falownik VFD montaz i uruchomienie", 3.00, "szt", 1.3),
    ("softstart", "KNR 5-08 0301-02", "Softstart montaz i uruchomienie", 2.50, "szt", 1.3),
    ("przetwornica czestotliwosci", "KNR 5-08 0301-01", "Przetwornica czestotliwosci montaz", 3.00, "szt", 1.2),
    ("silnik elektryczny montaz", "KNR 5-08 0401-01", "Silnik elektryczny montaz", 3.00, "szt", 1.2),
    ("podlaczenie silnika", "KNR 5-08 0401-01", "Podłączenie silnika elektrycznego", 1.50, "szt", 1.3),
    ("przekaznik", "KNR 5-08 0201-02", "Przekaźnik montaz", 0.20, "szt", 1.1),
    ("cewka", "KNR 5-08 0201-02", "Cewka/przekaźnik montaz", 0.20, "szt", 1.0),
    ("stycznik", "KNR 5-08 0201-03", "Stycznik montaz", 0.30, "szt", 1.3),
    ("przekaznik nadmiarowotemperaturowy", "KNR 5-08 0201-04", "Przekaźnik termiczny (bimetalowy)", 0.25, "szt", 1.2),
    ("wylacznik kompaktowy", "KNR 5-08 0101-06", "Wyłącznik kompaktowy MCCB montaz", 1.00, "szt", 1.3),
    ("mccb 160a", "KNR 5-08 0101-06", "MCCB 160A montaz", 1.20, "szt", 1.5),
    ("mccb 250a", "KNR 5-08 0101-07", "MCCB 250A montaz", 1.50, "szt", 1.5),
    ("mccb 400a", "KNR 5-08 0101-08", "MCCB 400A montaz", 2.00, "szt", 1.5),
    ("mccb 630a", "KNR 5-08 0101-09", "MCCB 630A montaz", 3.00, "szt", 1.5),
    ("wyłacznik acb", "KNR 5-08 0101-10", "Wyłącznik ACB 1000A+ montaz", 5.00, "szt", 1.3),
    ("szyna th35", "KNR 5-08 0601-03", "Szyna montazowa TH35 montaz", 0.10, "mb", 1.0),
    ("szyna ns35", "KNR 5-08 0601-03", "Szyna montazowa NS35 montaz", 0.10, "mb", 1.0),
    ("ochronnik przepieciowy spd typ 1", "KNR 5-08 0501-01", "Ochronnik przepieciowy SPD typ 1", 0.60, "szt", 1.5),
    ("ochronnik przepieciowy spd typ 2", "KNR 5-08 0501-02", "Ochronnik przepieciowy SPD typ 2", 0.40, "szt", 1.5),
    ("zasilacz dc 24v", "KNR 5-08 0801-01", "Zasilacz SMPS 24VDC montaz", 0.40, "szt", 1.2),
    ("zasilacz ups 24v", "KNR 5-08 0801-02", "Zasilacz awaryjny UPS 24V montaz", 0.60, "szt", 1.2),
]

for kw, knr, label, rbh, unit, conf in SILOWE:
    add_row(kw, knr, label, "robocizna", False, rbh, unit, "aparatura", conf)

# ═══════════════════════════════════════════════════════════════════════════════
# 4. MIESZKANIÓWKA + SMART HOME
# ═══════════════════════════════════════════════════════════════════════════════

MIESZKANIOWKA = [
    # Gniazda w różnych materiałach
    ("gniazdo w betonie", "KNR 5-04 0301-01", "Gniazdo 230V w betonie p/t", 0.35, "szt", 1.5),
    ("gniazdo w cegle", "KNR 5-04 0301-01", "Gniazdo 230V w cegle p/t", 0.30, "szt", 1.5),
    ("gniazdo w gk", "KNR 5-04 0301-01", "Gniazdo 230V w płycie GK", 0.20, "szt", 1.5),
    ("gniazdo w gipsie", "KNR 5-04 0301-01", "Gniazdo 230V w tynku gipsowym", 0.22, "szt", 1.4),
    ("gniazdo w gipsokartonie", "KNR 5-04 0301-01", "Gniazdo 230V w gipsokartonie", 0.20, "szt", 1.5),
    ("gniazdko", "KNR 5-04 0301-01", "Gniazdo 230V montaz", 0.22, "szt", 1.2),
    # Wyłączniki w różnych materiałach
    ("wylacznik w betonie", "KNR 5-04 0201-01", "Wyłącznik w betonie p/t", 0.32, "szt", 1.4),
    ("wylacznik w cegle", "KNR 5-04 0201-01", "Wyłącznik w cegle p/t", 0.28, "szt", 1.4),
    ("wylacznik w gk", "KNR 5-04 0201-01", "Wyłącznik w płycie GK", 0.18, "szt", 1.4),
    ("klawisz", "KNR 5-04 0201-01", "Łącznik/klawisz oświetleniowy", 0.20, "szt", 1.1),
    # Bruzdowanie w różnych materiałach
    ("bruzdowanie w betonie", "KNR 5-04 0601-01", "Bruzdowanie w betonie", 0.60, "mb", 1.5),
    ("bruzdowanie w cegle", "KNR 5-04 0601-01", "Bruzdowanie w cegle", 0.45, "mb", 1.5),
    ("bruzdowanie w tynku", "KNR 5-04 0601-01", "Bruzdowanie w tynku", 0.25, "mb", 1.4),
    ("bruzdowanie w gk", "KNR 5-04 0601-01", "Cięcie w płycie GK", 0.10, "mb", 1.3),
    ("rozbieranie tynku", "KNR 5-04 0601-03", "Rozbieranie tynku pod instalacje", 0.30, "mb", 1.2),
    ("zamurowanie bruzdy", "KNR 5-04 0601-04", "Zamurowanie bruzdy gipsem/tynkiem", 0.20, "mb", 1.2),
    # Maty grzejne / ogrzewanie podłogowe
    ("mata grzejna", "KNR 5-04 1301-01", "Mata grzejna elektryczna montaz", 0.80, "m2", 1.5),
    ("ogrzewanie podlogowe elektryczne", "KNR 5-04 1301-01", "Ogrzewanie podłogowe el. montaz", 0.80, "m2", 1.5),
    ("kabel grzejny", "KNR 5-04 1301-02", "Kabel grzejny montaz w podłodze", 1.00, "m2", 1.4),
    ("termostat podlogowy", "KNR 5-04 1301-03", "Termostat podłogowy montaz", 0.40, "szt", 1.3),
    ("termostat", "KNR 5-04 1301-03", "Termostat montaz", 0.35, "szt", 1.1),
    ("czujnik temperatury", "KNR 5-04 1301-04", "Czujnik temperatury montaz", 0.30, "szt", 1.1),
    # Rolety / napędy
    ("naped rolety", "KNR 5-04 0401-06", "Napęd rolety elektrycznej montaz", 0.80, "szt", 1.3),
    ("silnik rolety", "KNR 5-04 0401-06", "Silnik rolety montaz+programowanie", 1.00, "szt", 1.3),
    ("zasilanie rolety", "KNR 5-04 0401-06", "Zasilanie napędu rolety", 0.40, "szt", 1.2),
    ("kurtyna powietrzna", "KNR 5-04 0401-07", "Kurtyna powietrzna montaz+podlaczenie", 1.20, "szt", 1.2),
    # Czujniki protekcji
    ("czujnik przecieku", "KNR 5-04 1401-01", "Czujnik przecieku wody montaz", 0.40, "szt", 1.2),
    ("czujnik zalania", "KNR 5-04 1401-01", "Czujnik zalania montaz", 0.40, "szt", 1.2),
    ("zawor odcinajacy", "KNR 5-04 1401-02", "Zawór odcinający elektr. montaz", 1.00, "szt", 1.2),
    # LED strips / tracki
    ("tasma led montaz profilu", "KNR 5-04 0401-08", "Taśma LED montaz profilu aluminiowego", 0.20, "mb", 1.3),
    ("tasma led", "KNR 5-04 0401-08", "Taśma LED montaz", 0.15, "mb", 1.2),
    ("profil led aluminiowy", "KNR 5-04 0401-08", "Profil aluminiowy pod taśmę LED", 0.20, "mb", 1.2),
    ("system szynowy", "KNR 5-04 0401-09", "System szynowy (track) montaz", 0.30, "mb", 1.3),
    ("szyna oswietleniowa", "KNR 5-04 0401-09", "Szyna oświetleniowa montaz", 0.25, "mb", 1.3),
    ("oprawa trackowa", "KNR 5-04 0401-09", "Oprawa szynowa trackowa montaz", 0.30, "szt", 1.3),
    ("zasilacz led", "KNR 5-04 0401-10", "Zasilacz LED montaz", 0.25, "szt", 1.2),
    ("sterownik led rgb", "KNR 5-04 0401-10", "Sterownik LED RGB montaz", 0.35, "szt", 1.2),
    ("dimmer", "KNR 5-04 0401-10", "Ściemniacz/dimmer montaz", 0.30, "szt", 1.2),
    ("sciemniacz", "KNR 5-04 0401-10", "Ściemniacz montaz", 0.30, "szt", 1.1),
]

for kw, knr, label, rbh, unit, conf in MIESZKANIOWKA:
    add_row(kw, knr, label, "robocizna", False, rbh, unit, "oswietlenie" if "led" in kw.lower() or "oprawa" in kw.lower() else "gniazda_wylaczniki", conf)

# ═══════════════════════════════════════════════════════════════════════════════
# 5. KNX / DALI / BMS — Automatyka budynkowa
# ═══════════════════════════════════════════════════════════════════════════════

KNX_DALI = [
    ("kontroler knx", "KNR 5-04 1501-01", "Kontroler KNX montaz+programowanie", 2.00, "szt", 1.3),
    ("sterownik knx", "KNR 5-04 1501-01", "Sterownik KNX montaz", 1.50, "szt", 1.3),
    ("modul knx", "KNR 5-04 1501-02", "Moduł KNX rozszerzen montaz", 0.80, "szt", 1.3),
    ("wlacznik knx", "KNR 5-04 1501-03", "Łącznik KNX montaz", 0.50, "szt", 1.3),
    ("przycisk knx", "KNR 5-04 1501-03", "Przycisk KNX montaz", 0.40, "szt", 1.3),
    ("kabel knx", "KNR 5-04 1501-04", "Kabel KNX TP montaz", 1.50, "100mb", 1.3),
    ("programowanie knx", "KNR 5-04 1502-01", "Programowanie systemu KNX (1h)", 1.00, "h", 1.3),
    ("dali", "KNR 5-04 1503-01", "Sterownik DALI montaz", 1.00, "szt", 1.3),
    ("zasilacz dali", "KNR 5-04 1503-01", "Zasilacz magistrali DALI montaz", 0.60, "szt", 1.3),
    ("kontroler dali", "KNR 5-04 1503-02", "Kontroler DALI montaz+adresowanie", 1.50, "szt", 1.3),
    ("bms", "KNR 5-04 1504-01", "System BMS montaz i konfiguracja", 4.00, "kpl", 1.2),
    ("centrala bms", "KNR 5-04 1504-01", "Centrala BMS montaz", 3.00, "szt", 1.3),
    ("modul io", "KNR 5-04 1504-02", "Moduł I/O BMS montaz", 1.00, "szt", 1.2),
    ("smart home", "KNR 5-04 1505-01", "System Smart Home montaz+konfiguracja", 4.00, "kpl", 1.0),
    ("inteligentna instalacja", "KNR 5-04 1501-01", "Inteligentna instalacja elektryczna", 2.00, "kpl", 1.1),
]

for kw, knr, label, rbh, unit, conf in KNX_DALI:
    add_row(kw, knr, label, "robocizna", False, rbh, unit, "aparatura", conf)

# ═══════════════════════════════════════════════════════════════════════════════
# 6. TELETECHNIKA — LAN/RACK, CCTV, SSWiN, DSO, Domofon
# ═══════════════════════════════════════════════════════════════════════════════

TELTECH = [
    # LAN/RACK
    ("szafa rack 6u", "KNR 5-09 0101-01", "Szafa rack 6U montaz", 1.50, "szt", 1.3),
    ("szafa rack 9u", "KNR 5-09 0101-01", "Szafa rack 9U montaz", 2.00, "szt", 1.3),
    ("szafa rack 12u", "KNR 5-09 0101-02", "Szafa rack 12U montaz", 2.50, "szt", 1.3),
    ("szafa rack 22u", "KNR 5-09 0101-03", "Szafa rack 22U montaz", 3.50, "szt", 1.3),
    ("szafa rack 42u", "KNR 5-09 0101-04", "Szafa rack 42U montaz", 5.00, "szt", 1.3),
    ("patch panel 24", "KNR 5-09 0102-01", "Patch panel 24-portowy montaz+zakonczenie", 1.00, "szt", 1.5),
    ("patch panel 48", "KNR 5-09 0102-02", "Patch panel 48-portowy montaz+zakonczenie", 1.80, "szt", 1.5),
    ("zakonczenie modulu rj45", "KNR 5-09 0103-01", "Zakonczenie modułu keystone RJ45", 0.15, "szt", 1.5),
    ("zakonczenie kabla utp", "KNR 5-09 0103-02", "Zakończenie kabla UTP wtykiem RJ45", 0.10, "szt", 1.4),
    ("kabel utp cat6", "KNR 5-09 0104-01", "Kabel UTP kat.6 montaz", 1.00, "100mb", 1.3),
    ("kabel utp cat6a", "KNR 5-09 0104-02", "Kabel UTP kat.6A montaz", 1.20, "100mb", 1.3),
    ("kabel ftp cat6", "KNR 5-09 0104-03", "Kabel FTP kat.6 montaz", 1.10, "100mb", 1.3),
    ("swiatlowoд", "KNR 5-09 0105-01", "Kabel światłowodowy montaz", 1.80, "100mb", 1.2),
    ("swiatlowoд om3", "KNR 5-09 0105-02", "Światłowód wielomodowy OM3 montaz", 2.00, "100mb", 1.4),
    ("swiatlowoд os2", "KNR 5-09 0105-03", "Światłowód jednomodowy OS2 montaz", 2.00, "100mb", 1.4),
    ("spawanie swiatlowodem", "KNR 5-09 0106-01", "Spawanie złącza światłowodowego", 0.50, "szt", 1.5),
    ("switch sieciowy", "KNR 5-09 0107-01", "Switch sieciowy montaz+konfiguracja", 1.00, "szt", 1.2),
    ("switch poe", "KNR 5-09 0107-02", "Switch PoE montaz+konfiguracja", 1.20, "szt", 1.3),
    ("access point wifi", "KNR 5-09 0108-01", "Access Point WiFi montaz+konfiguracja", 0.80, "szt", 1.3),
    ("router", "KNR 5-09 0108-02", "Router montaz+konfiguracja", 1.00, "szt", 1.2),
    # CCTV
    ("kamera ip dome", "KNR 5-09 0201-01", "Kamera IP DOME montaz+konfiguracja", 1.20, "szt", 1.4),
    ("kamera ip tubowa", "KNR 5-09 0201-02", "Kamera IP tubowa montaz+konfiguracja", 1.20, "szt", 1.4),
    ("kamera ip ptz", "KNR 5-09 0201-03", "Kamera IP PTZ montaz+konfiguracja", 2.00, "szt", 1.4),
    ("kamera ip 4k", "KNR 5-09 0201-04", "Kamera IP 4K montaz+konfiguracja", 1.50, "szt", 1.4),
    ("kamera analogowa", "KNR 5-09 0202-01", "Kamera AHD/HDCVI montaz", 1.00, "szt", 1.2),
    ("nvr", "KNR 5-09 0203-01", "Rejestrator NVR montaz+konfiguracja", 2.00, "szt", 1.3),
    ("dvr", "KNR 5-09 0203-02", "Rejestrator DVR montaz+konfiguracja", 2.00, "szt", 1.3),
    ("monitor cctv", "KNR 5-09 0204-01", "Monitor CCTV montaz", 0.80, "szt", 1.2),
    # SSWiN (Alarm)
    ("centrala alarmowa", "KNR 5-09 0301-01", "Centrala alarmowa SSWiN montaz+programowanie", 3.00, "szt", 1.4),
    ("centrala satel", "KNR 5-09 0301-01", "Centrala Satel montaz+programowanie", 3.00, "szt", 1.5),
    ("czujka pir", "KNR 5-09 0302-01", "Czujka PIR montaz+konfiguracja", 0.40, "szt", 1.3),
    ("czujka magnetyczna", "KNR 5-09 0302-02", "Czujka magnetyczna montaz", 0.25, "szt", 1.3),
    ("czujka wibracyjna", "KNR 5-09 0302-03", "Czujka wibracyjna montaz", 0.40, "szt", 1.3),
    ("sygnalizator wewnetrzny", "KNR 5-09 0303-01", "Sygnalizator wewnętrzny alarm montaz", 0.40, "szt", 1.3),
    ("sygnalizator zewnetrzny", "KNR 5-09 0303-02", "Sygnalizator zewnętrzny alarm montaz", 0.60, "szt", 1.3),
    ("klawiatura alarmowa", "KNR 5-09 0304-01", "Klawiatura alarmowa montaz", 0.50, "szt", 1.3),
    ("kabel ytksy", "KNR 5-09 0305-01", "Kabel YTKSY alarmowy montaz", 0.80, "100mb", 1.2),
    # Kontrola dostępu (KD)
    ("czytnik rfid", "KNR 5-09 0401-01", "Czytnik RFID montaz+konfiguracja", 0.80, "szt", 1.3),
    ("czytnik biometryczny", "KNR 5-09 0401-02", "Czytnik biometryczny montaz+konfiguracja", 1.20, "szt", 1.3),
    ("kontroler kd", "KNR 5-09 0402-01", "Kontroler KD montaz+programowanie", 1.50, "szt", 1.3),
    ("elektrozaczep", "KNR 5-09 0403-01", "Elektrozaczep montaz+konfiguracja", 0.60, "szt", 1.3),
    ("magnes drzwiowy", "KNR 5-09 0403-02", "Magnes drzwiowy EM montaz", 0.80, "szt", 1.3),
    ("zamek elektryczny", "KNR 5-09 0403-03", "Zamek elektryczny montaz", 0.80, "szt", 1.3),
    # Domofon
    ("panel wejsciowy", "KNR 5-09 0501-01", "Panel wejściowy domofonu montaz", 1.00, "szt", 1.3),
    ("unifon", "KNR 5-09 0501-02", "Unifon montaz", 0.40, "szt", 1.2),
    ("monitor domofon", "KNR 5-09 0501-03", "Monitor wideodomofonu montaz", 0.80, "szt", 1.3),
    ("stacja bramkowa", "KNR 5-09 0501-04", "Stacja bramkowa montaz", 1.50, "szt", 1.3),
]

for kw, knr, label, rbh, unit, conf in TELTECH:
    cat = "it_siec" if any(x in kw for x in ["lan", "rack", "patch", "rj45", "utp", "ftp", "swiatlow", "switch", "router", "access point", "wifi", "kabel utp", "kabel ftp"]) else "bezpieczenstwo"
    add_row(kw, knr, label, "robocizna", False, rbh, unit, cat, conf)

# ═══════════════════════════════════════════════════════════════════════════════
# 7. PPOŻ — Fire protection systems (SSP)
# ═══════════════════════════════════════════════════════════════════════════════

PPOZ = [
    ("centrala sygnalizacji pozaru", "KNR 5-09 0601-01", "Centrala SSP montaz+programowanie", 5.00, "szt", 1.5),
    ("centrala ssp", "KNR 5-09 0601-01", "Centrala SSP adresowalna montaz", 5.00, "szt", 1.5),
    ("czujka dymu", "KNR 5-09 0602-01", "Czujka dymu optyczna montaz", 0.50, "szt", 1.4),
    ("czujka temperatury ppoz", "KNR 5-09 0602-02", "Czujka temperatury PPOŻ montaz", 0.50, "szt", 1.4),
    ("czujka multisensorowa", "KNR 5-09 0602-03", "Czujka multisensorowa montaz", 0.60, "szt", 1.4),
    ("rop", "KNR 5-09 0603-01", "Ręczny Ostrzegacz Pożarowy (ROP) montaz", 0.40, "szt", 1.5),
    ("reczny ostrzegacz pozaru", "KNR 5-09 0603-01", "Ręczny Ostrzegacz Pożarowy montaz", 0.40, "szt", 1.5),
    ("sygnalizator dso", "KNR 5-09 0604-01", "Sygnalizator DSO montaz", 0.60, "szt", 1.4),
    ("dso", "KNR 5-09 0604-01", "System DSO montaz", 1.00, "kpl", 1.2),
    ("centrala dso", "KNR 5-09 0604-02", "Centrala DSO montaz+konfiguracja", 4.00, "szt", 1.4),
    ("kabel hdgs 3x1 5", "KNR 5-09 0605-01", "Kabel HDGs 3x1.5 p.poz. montaz", 2.00, "100mb", 1.5),
    ("kabel nhxh 3x1 5", "KNR 5-09 0605-01", "Kabel NHXH 3x1.5 p.poz. montaz", 2.00, "100mb", 1.5),
    ("kabel ppoz nhxh", "KNR 5-09 0605-01", "Kabel PPOŻ NHXH/HDGs montaz", 2.00, "100mb", 1.4),
    ("zasilacz ppoz", "KNR 5-09 0606-01", "Zasilacz ppoż 24V montaz", 0.80, "szt", 1.3),
    ("klamka ppoz", "KNR 5-09 0607-01", "Klamka/zamek p.poz. montaz", 1.00, "szt", 1.2),
    ("drzwi ppoz montaz", "KNR 5-09 0607-02", "Drzwi p.poz. montaz elektrozaczepu", 1.00, "szt", 1.3),
    ("klapa ppoz", "KNR 5-09 0607-03", "Klapa p.poz. montaz+konfiguracja", 2.00, "szt", 1.3),
    ("gaśnica co2 montaz", "KNR 5-09 0608-01", "Gaśnica CO2 montaz i oznakowanie", 0.50, "szt", 1.0),
]

for kw, knr, label, rbh, unit, conf in PPOZ:
    add_row(kw, knr, label, "robocizna", False, rbh, unit, "bezpieczenstwo", conf)

# ═══════════════════════════════════════════════════════════════════════════════
# 8. DEMONTAŻ PEŁNY SPEKTRUM — miedź/aluminium, stare instalacje
# ═══════════════════════════════════════════════════════════════════════════════

DEMONTAZ = [
    ("demontaz miedzi", "KNR 5-04 9901-03", "Demontaż instalacji miedzianych", 0.30, "kpl", 1.3),
    ("demontaz aluminium", "KNR 5-04 9901-04", "Demontaż instalacji aluminiowych", 0.35, "kpl", 1.3),
    ("demontaz starej instalacji", "KNR 5-04 9901-01", "Demontaż starej instalacji el.", 0.25, "kpl", 1.3),
    ("demontaz instalacji trójfazowej", "KNR 5-04 9901-05", "Demontaż instalacji trójfazowej", 0.40, "kpl", 1.3),
    ("demontaz kabla silowego", "KNR 5-04 9901-02", "Demontaż kabla siłowego", 1.20, "100mb", 1.3),
    ("demontaz kabla yky", "KNR 5-04 9901-02", "Demontaż kabla YKY", 1.20, "100mb", 1.3),
    ("demontaz kabla ydy", "KNR 5-04 9901-02", "Demontaż kabla YDY", 1.00, "100mb", 1.3),
    ("demontaz szafy elektrycznej", "KNR 5-04 9904-02", "Demontaż szafy elektrycznej", 2.00, "szt", 1.3),
    ("demontaz falownika", "KNR 5-04 9904-03", "Demontaż falownika/softstarta", 1.50, "szt", 1.3),
    ("demontaz silnika elektrycznego", "KNR 5-04 9904-04", "Demontaż silnika elektrycznego", 2.50, "szt", 1.2),
    ("demontaz aparatow", "KNR 5-04 9902-03", "Demontaż aparatów elektrycznych", 0.15, "szt", 1.2),
    ("demontaz bezpiecznikow", "KNR 5-04 9902-01", "Demontaż bezpieczników/wyłączników", 0.10, "szt", 1.2),
    ("demontaz korytka", "KNR 5-04 9905-01", "Demontaż korytka kablowego", 0.05, "mb", 1.2),
    ("demontaz drabinki kablowej", "KNR 5-04 9905-02", "Demontaż drabinki kablowej", 0.08, "mb", 1.2),
    ("demontaz rury stalowej", "KNR 5-04 9905-03", "Demontaż rury stalowej", 0.10, "mb", 1.2),
    ("demontaz opraw przemyslowych", "KNR 5-04 9903-02", "Demontaż opraw przemysłowych", 0.40, "szt", 1.3),
    ("demontaz swietlowek", "KNR 5-04 9903-01", "Demontaż świetlówek", 0.20, "szt", 1.1),
    ("demontaz grzejnikow elektrycznych", "KNR 5-04 9903-03", "Demontaż grzejników elektrycznych", 0.50, "szt", 1.2),
    ("wywóz gruzu elektrycznego", "KNR 5-04 9999-01", "Wywóz i utylizacja gruzu/materiałów", 0.50, "kpl", 0.9),
    ("utylizacja kabli", "KNR 5-04 9999-02", "Utylizacja starych kabli i aparatów", 0.50, "kpl", 0.9),
]

for kw, knr, label, rbh, unit, conf in DEMONTAZ:
    add_row(kw, knr, label, "robocizna", False, rbh, unit, "demontaz", conf)

# ═══════════════════════════════════════════════════════════════════════════════
# 9. SYNONIMY / SLANG (Polish electrician slang)
# ═══════════════════════════════════════════════════════════════════════════════

SLANG = [
    # Aparatura
    ("s-ka", "KNR 5-08 0101-01", "Wyłącznik nadmiarowoprądowy MCB", 0.15, "szt", 1.0),
    ("bezpiecznik", "KNR 5-08 0101-01", "Wyłącznik nadmiarowoprądowy", 0.15, "szt", 1.0),
    ("nadpradowka", "KNR 5-08 0101-01", "Wyłącznik nadmiarowoprądowy", 0.15, "szt", 1.1),
    ("eska", "KNR 5-08 0101-01", "Wyłącznik nadmiarowoprądowy S (eska)", 0.15, "szt", 1.1),
    ("roznicowka", "KNR 5-08 0102-01", "Wyłącznik różnicowoprądowy RCD", 0.25, "szt", 1.1),
    ("rcbo", "KNR 5-08 0103-01", "Wyłącznik różnicowo-nadmiarowoprądowy RCBO", 0.30, "szt", 1.1),
    ("kombiak", "KNR 5-08 0103-01", "Wyłącznik RCBO (kombiak)", 0.30, "szt", 1.0),
    ("przelacznik", "KNR 5-04 0201-02", "Przełącznik oświetleniowy montaz", 0.22, "szt", 1.0),
    ("podwojny", "KNR 5-04 0301-01", "Gniazdo podwójne 2x230V montaz", 0.30, "szt", 1.0),
    ("potrójny", "KNR 5-04 0301-01", "Gniazdo potrójne 3x230V montaz", 0.40, "szt", 1.0),
    # Trasy
    ("kabeduct", "KNR 5-04 0701-01", "Kabeldukt/listwa kablowa montaz", 0.12, "mb", 1.0),
    ("kabeldukt", "KNR 5-04 0701-01", "Kabeldukt montaz", 0.12, "mb", 1.1),
    ("listwa", "KNR 5-04 0701-04", "Listwa elektroinstalacyjna montaz", 0.12, "mb", 0.9),
    ("rurka", "KNR 5-04 0703-01", "Rurka karbowana montaz", 0.07, "mb", 0.9),
    ("peszl", "KNR 5-04 0703-01", "Peszel/rura karbowana montaz", 0.07, "mb", 1.0),
    # Kable
    ("miedziak", "KNR 5-04 0101-01", "Przewód miedziany YDY montaz", 2.50, "100mb", 0.8),
    ("aluminiowy", "KNR 5-04 0102-01", "Kabel aluminiowy montaz", 1.80, "100mb", 0.8),
    ("ziemny", "KNR 5-04 0102-01", "Kabel ziemny YKY montaz", 2.50, "100mb", 0.9),
    ("koncentryk", "KNR 5-09 0104-01", "Kabel koncentryczny RG-6 montaz", 0.80, "100mb", 1.0),
    ("rg6", "KNR 5-09 0104-01", "Kabel koncentryczny RG-6 montaz", 0.80, "100mb", 1.2),
    # Świetlówki slang
    ("swietlowka", "KNR 5-04 0401-01", "Świetlówka LED montaz", 0.30, "szt", 1.0),
    ("jarzeniowka", "KNR 5-04 0401-01", "Oprawa jarzeniowa montaz", 0.35, "szt", 1.0),
    ("tuba led", "KNR 5-04 0401-01", "Tuba LED T8 montaz", 0.30, "szt", 1.1),
    ("halogen", "KNR 5-04 0401-02", "Halogeny/spot podtynkowy montaz", 0.30, "szt", 1.0),
    ("żyrandol", "KNR 5-04 0401-01", "Żyrandol/plafon montaz", 0.40, "szt", 1.0),
    # Rozdzielnice
    ("deska rozdzielcza", "KNR 5-04 0601-01", "Tablica rozdzielcza montaz", 2.00, "kpl", 0.9),
    ("skrzynka elektryczna", "KNR 5-04 0601-01", "Skrzynka elektryczna montaz", 1.50, "kpl", 1.0),
    ("licznik", "KNR 5-04 0601-05", "Licznik energii elektrycznej montaz", 0.50, "szt", 1.1),
    ("podlicznik", "KNR 5-04 0601-05", "Podlicznik montaz", 0.50, "szt", 1.2),
]

for kw, knr, label, rbh, unit, conf in SLANG:
    cat = "aparatura" if any(x in kw for x in ["s-ka", "bezpiecznik", "eska", "roznicowka", "rcbo", "kombiak", "przelacznik", "nadpradowka"]) else \
          "rury_trasy" if any(x in kw for x in ["kabeduct", "kabeldukt", "listwa", "rurka", "peszl"]) else \
          "kable_silnopradowe" if any(x in kw for x in ["miedziak", "aluminiowy", "ziemny"]) else \
          "kable_slabopradowe" if any(x in kw for x in ["koncentryk", "rg6"]) else \
          "oswietlenie" if any(x in kw for x in ["swietlowka", "jarzeniowka", "tuba", "halogen", "żyrandol"]) else \
          "rozdzielnice"
    add_row(kw, knr, label, "robocizna", False, rbh, unit, cat, conf)

# ═══════════════════════════════════════════════════════════════════════════════
# 10. KABLE W ZIEMI / TRAНШЕЕ
# ═══════════════════════════════════════════════════════════════════════════════

ZIEMNE = [
    ("ukladanie kabla w ziemi", "KNR 5-04 0102-01", "Układanie kabla w ziemi", 3.50, "100mb", 1.4),
    ("kabel ziemny", "KNR 5-04 0102-01", "Kabel ziemny YKY montaz", 2.50, "100mb", 1.3),
    ("kopanie rowu", "KNR 5-04 0801-04", "Kopanie rowu kablowego", 2.00, "100mb", 1.4),
    ("zakladanie rury ochronnej", "KNR 5-04 0703-04", "Zakładanie rury ochronnej DVR", 0.40, "mb", 1.3),
    ("rura dvr", "KNR 5-04 0703-04", "Rura DVR ochronna montaz", 0.40, "mb", 1.3),
    ("rura rhdpe", "KNR 5-04 0703-04", "Rura RHDPE w ziemi montaz", 0.35, "mb", 1.3),
    ("zasypanie rowu", "KNR 5-04 0801-05", "Zasypanie rowu kablowego", 1.50, "100mb", 1.2),
    ("folia ostrzegawcza", "KNR 5-04 0801-06", "Folia ostrzegawcza układanie", 0.20, "100mb", 1.2),
    ("taśma kablowa ostrzegawcza", "KNR 5-04 0801-06", "Taśma ostrzegawcza żółta", 0.20, "100mb", 1.2),
    ("mufa kablowa", "KNR 5-04 0801-07", "Mufa kablowa montaz+zalewanie", 2.00, "szt", 1.4),
    ("glowica kablowa", "KNR 5-04 0801-08", "Główica kablowa montaz", 1.50, "szt", 1.4),
    ("przecisk poziomy", "KNR 5-04 0703-05", "Przecisk poziomy pod drogą", 4.00, "mb", 1.5),
    ("przewiert sterowany", "KNR 5-04 0703-05", "Przewiert sterowany HDD montaz", 3.00, "mb", 1.5),
]

for kw, knr, label, rbh, unit, conf in ZIEMNE:
    add_row(kw, knr, label, "robocizna", False, rbh, unit, "kable_silnopradowe", conf)

# ═══════════════════════════════════════════════════════════════════════════════
# 11. DODATKOWE PRACE (Misc standard works)
# ═══════════════════════════════════════════════════════════════════════════════

MISC = [
    ("pomiar ciaglosci", "KNR 5-04 1001-01", "Pomiar ciągłości obwodu", 0.10, "obwod", 1.3),
    ("pomiar impedancji petli", "KNR 5-04 1001-02", "Pomiar impedancji pętli zwarcia", 0.15, "obwod", 1.4),
    ("pomiar uziemienia", "KNR 5-04 1001-03", "Pomiar rezystancji uziemienia", 0.20, "punkt", 1.3),
    ("sprawdzenie rcd", "KNR 5-04 1001-04", "Sprawdzenie wyłącznika różnicowego", 0.10, "szt", 1.3),
    ("inwentaryzacja instalacji", "KNR 5-04 1003-02", "Inwentaryzacja instalacji elektrycznej", 2.00, "kpl", 1.2),
    ("dokumentacja powykonawcza", "KNR 5-04 1003-03", "Dokumentacja powykonawcza instalacji", 3.00, "kpl", 1.1),
    ("przegląd elektryczny", "KNR 5-04 1003-01", "Przegląd elektryczny 5-letni", 1.50, "kpl", 1.3),
    ("sprawdzenie stanu izolacji", "KNR 5-04 1001-01", "Sprawdzenie stanu izolacji przewodów", 0.15, "obwod", 1.3),
    ("montaz bednarski", "KNR 5-04 0801-03", "Montaż bednarki FeZn", 0.10, "mb", 1.2),
    ("montaz iglicy", "KNR 5-04 0801-09", "Montaż iglicy odgromowej montaz", 1.50, "szt", 1.3),
    ("zwod poziomy", "KNR 5-04 0801-10", "Zwód poziomy odgromowy montaz", 0.12, "mb", 1.3),
    ("uziom tasmy", "KNR 5-04 0801-01", "Uziom taśmowy FeZn montaz", 0.15, "mb", 1.3),
    ("uziom pionowy", "KNR 5-04 0801-01", "Uziom pionowy wbijany montaz", 1.20, "szt", 1.3),
    ("instalacja odgromowa", "KNR 5-04 0801-01", "Instalacja odgromowa kompleks", 2.00, "kpl", 1.2),
    ("przepust muru", "KNR 5-04 0702-01", "Przepust przez mur/ścianę", 0.30, "szt", 1.2),
    ("przepust stropu", "KNR 5-04 0702-01", "Przepust przez strop", 0.40, "szt", 1.3),
    ("konserwacja instalacji", "KNR 5-04 1003-04", "Konserwacja instalacji elektrycznej", 1.50, "kpl", 1.0),
    ("naprawa awarii", "KNR 5-04 9901-01", "Naprawa awarii elektrycznej", 1.00, "kpl", 0.9),
    ("usunięcie awarii", "KNR 5-04 9901-01", "Usunięcie awarii elektrycznej", 1.00, "kpl", 1.0),
    ("lokalizacja uszkodzenia", "KNR 5-04 9901-01", "Lokalizacja uszkodzenia kabla", 2.00, "kpl", 1.1),
    ("fotowoltaika montaz", "KNR 5-09 0901-01", "Moduły PV montaz na dachu", 0.50, "szt", 1.3),
    ("falownik pv", "KNR 5-09 0902-01", "Falownik PV montaz+konfiguracja", 3.00, "szt", 1.4),
    ("kabel solarny", "KNR 5-09 0903-01", "Kabel solarny PV montaz", 1.00, "100mb", 1.3),
    ("ladowarka ev", "KNR 5-09 1001-01", "Ładowarka EV montaz+konfiguracja", 3.00, "szt", 1.4),
    ("wallbox", "KNR 5-09 1001-01", "Wallbox EV montaz+konfiguracja", 3.00, "szt", 1.4),
    ("montaz klimatyzatora", "KNR 5-04 1601-01", "Montaż jednostki klimatyzatora", 2.00, "szt", 1.2),
    ("podlaczenie klimatyzatora", "KNR 5-04 1601-02", "Podłączenie el. klimatyzatora", 1.00, "szt", 1.3),
]

for kw, knr, label, rbh, unit, conf in MISC:
    cat = "pomiary" if "pomiar" in kw or "sprawdzenie" in kw or "inwentaryzacja" in kw or "dokumentacja" in kw or "przeglad" in kw else \
          "uziemienie" if any(x in kw for x in ["uziom", "bednarski", "iglicy", "zwod", "odgromowa", "uziemienie"]) else \
          "prowadzenie" if "przepust" in kw else \
          "kable_silnopradowe" if any(x in kw for x in ["fotowoltaika", "falownik pv", "kabel solarny", "ladowarka", "wallbox"]) else \
          "prace_dodatkowe"
    add_row(kw, knr, label, "robocizna", False, rbh, unit, cat, conf)

# ═══════════════════════════════════════════════════════════════════════════════
# GENERATE SQL FILE
# ═══════════════════════════════════════════════════════════════════════════════

def build_sql(rows_list):
    header = """-- ============================================================
-- ES-Engine Dictionary Seed v4.0 — Industrial + Residential + Telco
-- AUTO-GENERATED by scripts/generate-industrial-seed.py
-- Covers: cable matrix YDY/YDYp/YKY/LGY/NHXH all cross-sections,
-- industrial (CEE 16/32/63A, korytka, rury stalowe, falowniki),
-- smart home (maty grzejne, KNX/DALI, rolety, LED strip),
-- teletechnika (LAN/RACK, CCTV, SSWiN Satel, PPOŻ SSP),
-- full demontaz spectrum, electrician slang synonyms
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs, labor_norm_rbh, unit, category, confidence_weight)
VALUES
"""
    vals = []
    for r in rows_list:
        vals.append(
            f"('{escape_sql(r['keyword'])}', '{r['knr_ref']}', '{escape_sql(r['label'])}', "
            f"'{r['type']}', {r['is_composite']}, NULL, {r['labor_norm_rbh']}, "
            f"'{r['unit']}', '{r['category']}', {r['confidence_weight']})"
        )

    footer = "\nON CONFLICT (keyword_normalized) DO NOTHING;\n"
    comment = f"\nCOMMENT ON TABLE es_dictionary IS\n  'ES-Engine semantic dictionary v4.0 — {len(rows_list)}+ entries. Auto-generated cable matrix + industrial + smart home + telco + PPOZ + slang.';\n"
    return header + ",\n".join(vals) + footer + comment

sql_content = build_sql(rows)

os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(sql_content)

print(f"✅ Generated {len(rows)} entries → {OUTPUT_FILE}")
print(f"   Cable matrix: {sum(1 for r in rows if r['category'] == 'kable_silnopradowe')} entries")
print(f"   Industrial:   {sum(1 for r in rows if r['category'] == 'aparatura')} entries")
print(f"   Trasy:        {sum(1 for r in rows if r['category'] == 'rury_trasy')} entries")
print(f"   Teletechnika: {sum(1 for r in rows if r['category'] in ('it_siec', 'bezpieczenstwo'))} entries")
print(f"   Smart Home:   {sum(1 for r in rows if r['category'] in ('oswietlenie', 'gniazda_wylaczniki'))} entries")
print(f"   Demontaż:     {sum(1 for r in rows if r['category'] == 'demontaz')} entries")
print(f"   Pomiary:      {sum(1 for r in rows if r['category'] == 'pomiary')} entries")
print(f"   Uziemienie:   {sum(1 for r in rows if r['category'] == 'uziemienie')} entries")
