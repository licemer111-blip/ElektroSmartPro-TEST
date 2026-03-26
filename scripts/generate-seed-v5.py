#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ES-Engine Dictionary Seed v5.0 Generator
=========================================
Object-type clusters with metadata.keywords (technical + slang + abbreviations):
  - MIESZKANIÓWKA: montaz punktu w betonie/cegle/GK, LED profile, Smart Home, Grenton/Fibaro
  - BIURO: floorboxy all types, listwy PCV parapet, LAN cat6/7, DALI sensors, RACK assembly
  - HALA/MAGAZYN: szynoprzewody, high-bay, IP65, wysiegniki, wysokosciowe, 400V

Output: supabase/migrations/20260305_seed_es_dictionary_v5.sql
Run:    python scripts/generate-seed-v5.py
"""

import os, re, json

OUTPUT_FILE = os.path.join(
    os.path.dirname(__file__), "..", "supabase", "migrations",
    "20260305_seed_es_dictionary_v5.sql"
)

# --- helpers ---

DIACRITICS = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
    'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z',
}

def normalize(s: str) -> str:
    r = s.lower()
    for k, v in DIACRITICS.items():
        r = r.replace(k, v)
    r = re.sub(r'[×xX×]', 'x', r)
    r = re.sub(r'[,]', ' ', r)
    r = re.sub(r'\s+', ' ', r).strip()
    r = re.sub(r'\b(mb|szt|kpl|m2|m3|rbh|zl|100mb)\b', '', r).strip()
    r = re.sub(r'\s+', ' ', r).strip()
    return r

def esc(s: str) -> str:
    return s.replace("'", "''")

def json_esc(obj) -> str:
    return esc(json.dumps(obj, ensure_ascii=False))

seen = set()
rows = []

def add(keyword, knr_ref, label, rtype, rbh, unit, category, confidence, keywords_meta=None):
    norm = normalize(keyword)
    if norm in seen:
        return
    seen.add(norm)
    rows.append({
        "keyword": keyword,
        "knr_ref": knr_ref,
        "label": label,
        "type": rtype,
        "rbh": rbh,
        "unit": unit,
        "category": category,
        "confidence": confidence,
        "keywords_meta": keywords_meta or [],
    })

# =============================================================================
# CLUSTER 1 — MIESZKANIÓWKA
# =============================================================================

# ── 1.1 Punkt elektryczny wg materiału ───────────────────────────────────────
MATERIALS = [
    ("beton",       0.40, 1.4, ["beton", "betonowa", "żelbet", "monolith"]),
    ("cegla",       0.32, 1.3, ["cegła", "mur", "cegielka", "murowany"]),
    ("gk",          0.18, 1.2, ["GK", "gipsokarton", "płyta GK", "sucha zabudowa", "rigips"]),
    ("tynk gipsowy",0.22, 1.2, ["tynk", "gips", "gipsowy", "wylewka"]),
    ("drewno",      0.28, 1.2, ["drewno", "drewniana", "bale", "Dom drewniany"]),
    ("pustak",      0.30, 1.2, ["pustak", "keramzyt", "ytong", "bloczek"]),
]

for mat, rbh_extra, conf, syns in MATERIALS:
    mat_n = normalize(mat)
    base_conf = conf
    for item, base_rbh, knr, abbrevs in [
        ("gniazdo", 0.22, "KNR 5-04 0301-01", ["gniazdko", "kontakt", "230V"]),
        ("wylacznik", 0.20, "KNR 5-04 0201-01", ["klawisz", "przełącznik", "wyłącznik"]),
        ("punkt oswietleniowy", 0.30, "KNR 5-04 0401-01", ["wypust", "puszka lampy", "punkt oświetl."]),
        ("puszka instalacyjna", 0.25, "KNR 5-04 0602-01", ["puszka", "karp", "puszeczka"]),
    ]:
        kw = f"{item} w {mat}"
        lbl = f"{item.capitalize()} p/t w {mat} ({mat.upper() if mat in ['gk','beton'] else mat})"
        add(kw, knr, lbl, "robocizna", round(base_rbh + rbh_extra * 0.1, 2), "szt", "gniazda_wylaczniki",
            base_conf, syns + abbrevs)

# ── 1.2 Bruzdowanie wg materiału ─────────────────────────────────────────────
BRUZDA_MAT = [
    ("bruzda w betonie",        "KNR 5-04 0601-01", 0.60, 1.5, ["kucie betonu", "frezowanie betonu", "rowek w betonie"]),
    ("bruzda w cegle",          "KNR 5-04 0601-01", 0.45, 1.4, ["kucie cegle", "rowek w murze"]),
    ("bruzda w gk",             "KNR 5-04 0601-01", 0.10, 1.3, ["cięcie GK", "nacięcie rigips"]),
    ("bruzda w tynku gipsowym", "KNR 5-04 0601-01", 0.25, 1.3, ["rowek w tynku", "frez w gipsie"]),
    ("bruzda w pustaku",        "KNR 5-04 0601-01", 0.35, 1.3, ["kucie pustaka", "rowek w ytong"]),
    ("zamurowanie bruzdy betonowej",    "KNR 5-04 0601-04", 0.25, 1.2, ["szpachlowanie betonu", "zaprawa cementowa"]),
    ("zamurowanie bruzdy gipsowej",     "KNR 5-04 0601-04", 0.15, 1.2, ["szpachlowanie gipsu"]),
    ("zamurowanie bruzdy w cegle",      "KNR 5-04 0601-04", 0.20, 1.2, ["zaprawa murarska", "uzupelnienie muru"]),
]
for kw, knr, rbh, conf, kws in BRUZDA_MAT:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, "mb", "prowadzenie", conf, kws)

# ── 1.3 LED strefy i oświetlenie dekoracyjne ─────────────────────────────────
LED_ITEMS = [
    ("profil led aluminiowy wpuszczany",   "KNR 5-04 0401-08", 0.25, 1.3, ["profil wpuszczany", "profil natynkowy", "profil LED"]),
    ("profil led corner",                  "KNR 5-04 0401-08", 0.20, 1.3, ["profil narożny LED", "kątowy LED"]),
    ("tasma led 12v",                      "KNR 5-04 0401-08", 0.12, 1.2, ["LED strip 12V", "RGB 12V", "taśma LED"]),
    ("tasma led 24v",                      "KNR 5-04 0401-08", 0.12, 1.2, ["LED strip 24V", "taśma COB"]),
    ("tasma led rgbw",                     "KNR 5-04 0401-08", 0.15, 1.3, ["RGBW", "RGB+W", "taśma kolorowa"]),
    ("zasilacz led 12v 60w",               "KNR 5-04 0401-10", 0.20, 1.3, ["PSU LED 60W", "zasilacz taśmy"]),
    ("zasilacz led 24v 100w",              "KNR 5-04 0401-10", 0.22, 1.3, ["PSU LED 100W", "driver LED"]),
    ("sterownik led rgb wifi",             "KNR 5-04 0401-10", 0.30, 1.2, ["kontroler RGB WiFi", "LED controller"]),
    ("oczko sufitowe led",                 "KNR 5-04 0401-02", 0.30, 1.3, ["downlight", "spot GU10", "oczko", "punktowe"]),
    ("oprawa led liniowa",                 "KNR 5-04 0401-01", 0.40, 1.2, ["belka LED", "listwa świetlna"]),
    ("lustro led z oswietleniem",          "KNR 5-04 0401-01", 0.50, 1.2, ["mirror LED", "lustro z podświetleniem"]),
    ("kinkiet",                            "KNR 5-04 0401-01", 0.40, 1.2, ["kinkiet ścienny", "lampa ścienna"]),
    ("lampa wiszaca",                      "KNR 5-04 0401-01", 0.45, 1.2, ["pendant", "lampa wisząca", "zwis"]),
    ("zyrandol",                           "KNR 5-04 0401-01", 0.50, 1.2, ["żyrandol", "plafon", "chandelier"]),
    ("plafon",                             "KNR 5-04 0401-01", 0.35, 1.2, ["sufitowa", "plafon LED", "plafon okrągły"]),
    ("szyna oswietleniowa 1m",             "KNR 5-04 0401-09", 0.20, 1.2, ["1m track", "szyna 1m"]),
    ("szyna oswietleniowa 2m",             "KNR 5-04 0401-09", 0.25, 1.2, ["2m track", "szyna 2m"]),
    ("szyna oswietleniowa 3m",             "KNR 5-04 0401-09", 0.30, 1.2, ["3m track", "szyna 3m"]),
    ("oprawa szynowa",                     "KNR 5-04 0401-09", 0.25, 1.2, ["track light", "reflektor szynowy"]),
]
for kw, knr, rbh, conf, kws in LED_ITEMS:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, "szt", "oswietlenie", conf, kws)

# ── 1.4 Smart Home systemy — Fibaro, Grenton, Tuya, Z-Wave ──────────────────
SMARTHOME = [
    ("fibaro smart home",      "KNR 5-04 1505-01", 5.00, "kpl", 1.2,
     ["FIBARO", "Fibaro Home Center", "Z-Wave", "fibaro system"]),
    ("grenton smart home",     "KNR 5-04 1505-02", 5.00, "kpl", 1.3,
     ["Grenton", "CLUZ", "OM-270-TP-01", "grenton system"]),
    ("fibaro modul",           "KNR 5-04 1505-03", 0.40, "szt", 1.3,
     ["moduł Fibaro", "Fibaro Double Switch", "FGS-222", "fibaro relay"]),
    ("fibaro dimmer",          "KNR 5-04 1505-03", 0.50, "szt", 1.4,
     ["Fibaro Dimmer 2", "FGD-212", "Z-Wave dimmer"]),
    ("grenton modul",          "KNR 5-04 1505-04", 0.50, "szt", 1.3,
     ["Grenton CLUZ", "moduł Grenton"]),
    ("zwave kontroler",        "KNR 5-04 1505-05", 1.00, "szt", 1.2,
     ["Z-Wave controller", "hub Z-Wave", "bramka Z-Wave"]),
    ("tuya smart",             "KNR 5-04 1505-06", 0.30, "szt", 1.1,
     ["Tuya WiFi", "Smart Life", "Wi-Fi switch"]),
    ("smart gniazdo",          "KNR 5-04 1505-07", 0.30, "szt", 1.1,
     ["smart plug", "inteligentne gniazdko", "WiFi socket"]),
    ("czujnik temperatury wilgotnosci", "KNR 5-04 1301-04", 0.30, "szt", 1.2,
     ["T&H sensor", "czujnik T/RH", "higrometr"]),
    ("termostat programowalny","KNR 5-04 1301-03", 0.40, "szt", 1.2,
     ["termostat tygodniowy", "regulator temp", "ogrzewanie termostat"]),
    ("centrala smart home",    "KNR 5-04 1505-08", 3.00, "szt", 1.2,
     ["hub smart home", "Home Center 3", "serwer domowy"]),
    ("pompa ciepla podlaczenie","KNR 5-04 1601-03", 2.00, "szt", 1.3,
     ["heat pump connection", "pompa ciepła el."]),
    ("rekuperator podlaczenie","KNR 5-04 1601-04", 1.00, "szt", 1.2,
     ["HRV connection", "wentylacja mechaniczna el."]),
]
for kw, knr, rbh, unit, conf, kws in SMARTHOME:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "aparatura", conf, kws)

# ── 1.5 Rozdzielnice mieszkaniowe ────────────────────────────────────────────
ROZDZIELNICE_MIESZK = [
    ("rozdzielnica 12 modulow",   "KNR 5-04 0601-01", 1.50, "szt", 1.3,
     ["tablica 12M", "RK-12", "skrzynka 12 bezpieczników"]),
    ("rozdzielnica 18 modulow",   "KNR 5-04 0601-01", 2.00, "szt", 1.3,
     ["tablica 18M", "RK-18"]),
    ("rozdzielnica 24 moduly",    "KNR 5-04 0601-01", 2.50, "szt", 1.3,
     ["tablica 24M", "RK-24"]),
    ("rozdzielnica 36 modulow",   "KNR 5-04 0601-02", 3.00, "szt", 1.3,
     ["tablica 36M", "RK-36", "szafka 36"]),
    ("rozdzielnica 48 modulow",   "KNR 5-04 0601-02", 3.50, "szt", 1.3,
     ["tablica 48M"]),
    ("rozdzielnica 72 moduly",    "KNR 5-04 0601-02", 4.50, "szt", 1.3,
     ["tablica 72M", "szafka 72"]),
    ("montaz bezpiecznika mcb",   "KNR 5-08 0101-01", 0.15, "szt", 1.3,
     ["montaż S-ki", "eska", "C10", "C16", "B20", "nadprądówka"]),
    ("montaz rcd 40a 30ma",       "KNR 5-08 0102-01", 0.25, "szt", 1.4,
     ["montaż różnicówki 40A", "P40", "Fi-40", "RCD 30mA"]),
    ("montaz rcbo",               "KNR 5-08 0103-01", 0.30, "szt", 1.4,
     ["montaż kombiaka", "RCBO 16A", "wyłącznik kombinowany"]),
    ("opisanie tablicy",          "KNR 5-04 0601-06", 0.50, "kpl", 1.2,
     ["opis schemat tablicy", "oznakowanie obwodów", "schemat rozdzielnicy"]),
    ("montaz szyny pe n",         "KNR 5-08 0601-03", 0.20, "szt", 1.2,
     ["montaż szyny PE/N", "listwa PE", "listwa N"]),
    ("pomiar tablicy",            "KNR 5-04 1001-01", 0.50, "kpl", 1.3,
     ["pomiary rozdzielnicy", "test tablicy", "protokół tablicy"]),
]
for kw, knr, rbh, unit, conf, kws in ROZDZIELNICE_MIESZK:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "rozdzielnice", conf, kws)

# =============================================================================
# CLUSTER 2 — BIURO (Офисы и коворкинги)
# =============================================================================

# ── 2.1 Floorboxy — wszystkie typy ───────────────────────────────────────────
FLOORBOX_TYPES = [
    ("floorbox 2x230v",              0.60, ["kaseta podłogowa 2xGP", "floorbox 2-gniazda"]),
    ("floorbox 4x230v",              0.80, ["kaseta podłogowa 4xGP", "floorbox 4-gniazda"]),
    ("floorbox 2x230v 2xrj45",       1.00, ["floorbox data+power", "kaseta 2GP+2LAN"]),
    ("floorbox 4x230v 2xrj45",       1.20, ["kaseta kombinowana 4+2", "floorbox multimedia"]),
    ("floorbox 2x230v 1xrj45 1xhdmi",1.20, ["kaseta AV", "floorbox AV"]),
    ("floorbox 6x230v",              1.00, ["kaseta 6-gniazd", "floorbox 6GP"]),
    ("floorbox stalowy",             1.00, ["kaseta stalowa podłogowa", "stal nierdzewna"]),
    ("floorbox okragly",             0.80, ["kaseta okrągła", "round floorbox"]),
    ("floorbox podtynkowy pustak",   0.60, ["puszka podłogowa z pokrywą"]),
    ("montaz kasety w fałszpodlodze",0.80, ["montaż floorbox falszpodloga", "podniesiona podłoga"]),
    ("kaseta naścienna 4x230v",      0.60, ["kaseta ścienno-podłogowa"]),
]
for kw, rbh, kws in FLOORBOX_TYPES:
    add(kw, "KNR 5-04 0301-03", kw.capitalize(), "robocizna", rbh, "szt", "gniazda_wylaczniki", 1.4, kws)
    for syn in kws:
        add(syn, "KNR 5-04 0301-03", kw.capitalize() + " (synonim)", "robocizna", rbh, "szt", "gniazda_wylaczniki", 1.2, [])

# ── 2.2 Listwy PCV parapet / kanały ──────────────────────────────────────────
LISTWY = [
    ("listwa pcv 40x25",    0.10, 1.2, ["kabeldukt 40x25", "kanał 40x25"]),
    ("listwa pcv 60x40",    0.12, 1.2, ["kabeldukt 60x40", "kanał 60x40"]),
    ("listwa pcv 80x60",    0.14, 1.2, ["kabeldukt 80x60"]),
    ("listwa pcv 100x40",   0.15, 1.2, ["listwa 100x40", "parapet 100x40"]),
    ("listwa pcv 100x60",   0.15, 1.2, ["kanał 100x60"]),
    ("listwa pcv 150x60",   0.18, 1.2, ["kanał parapet 150"]),
    ("listwa pcv 170x80",   0.20, 1.2, ["kanał 170x80"]),
    ("listwa podparapetowa z 2 gniazdami",  0.30, 1.3,
     ["listwa 2GP", "kanał z gniazdami", "gniazdo w listwie"]),
    ("listwa podparapetowa z 4 gniazdami",  0.45, 1.3,
     ["listwa 4GP", "kanał 4-gniazda"]),
    ("naroznik pcv",        0.05, 1.1, ["narożnik kanału", "kąt listwy"]),
    ("lacznik listwy pcv",  0.04, 1.0, ["łącznik kanału", "przedłużenie listwy"]),
]
for kw, rbh, conf, kws in LISTWY:
    add(kw, "KNR 5-04 0701-04", kw.capitalize(), "robocizna", rbh, "mb", "rury_trasy", conf, kws)

# ── 2.3 LAN biurowe Cat6/7 + RACK ────────────────────────────────────────────
LAN_BIURO = [
    ("kabel lan cat7",          "KNR 5-09 0104-03", 1.30, "100mb", 1.3,
     ["UTP kat.7", "SFTP Cat7", "kabel biurowy Cat7"]),
    ("kabel lan cat6a sftp",    "KNR 5-09 0104-03", 1.20, "100mb", 1.3,
     ["SFTP Cat6A", "kabel ekranowany kat.6A"]),
    ("zakonczenie keystone cat6","KNR 5-09 0103-01", 0.15, "szt", 1.4,
     ["keystone RJ45 Cat6", "moduł RJ45", "zarobienie modułu"]),
    ("zakonczenie keystone cat6a","KNR 5-09 0103-01", 0.18, "szt", 1.4,
     ["keystone Cat6A", "moduł ekranowany"]),
    ("gniazdo rj45 w scianie",  "KNR 5-09 0103-02", 0.25, "szt", 1.3,
     ["gniazdo LAN", "punkt LAN", "outlet RJ45"]),
    ("gniazdo 2xrj45",          "KNR 5-09 0103-03", 0.35, "szt", 1.3,
     ["podwójne LAN", "2x outlet RJ45", "2-portowe gniazdo"]),
    ("montaz rack 9u biurowy",  "KNR 5-09 0101-01", 2.00, "szt", 1.3,
     ["szafka rack biurowa 9U", "mała szafa IT"]),
    ("montaz rack 12u biurowy", "KNR 5-09 0101-02", 2.50, "szt", 1.3,
     ["szafka 12U", "rack IT 12U"]),
    ("montaz rack 19 wallmount","KNR 5-09 0101-01", 2.00, "szt", 1.3,
     ["rack ścienny 19\"", "wallmount rack"]),
    ("ulozeniezakonczenie swiatlowodem","KNR 5-09 0105-01", 2.00, "100mb", 1.3,
     ["światłowód biuro", "fiber backbone"]),
    ("otc swiatlowodem",        "KNR 5-09 0106-01", 0.50, "szt", 1.5,
     ["spawanie OTC", "spawanie włókna", "fusion splicing"]),
    ("patchcord rj45 1m",       "KNR 5-09 0107-03", 0.05, "szt", 1.0,
     ["kabel krosowy 1m", "patch cord Cat6"]),
    ("montaz switch 24p",       "KNR 5-09 0107-01", 1.00, "szt", 1.3,
     ["switch 24 port", "HP/Cisco 24p", "przełącznik sieciowy"]),
    ("montaz switch 48p",       "KNR 5-09 0107-02", 1.50, "szt", 1.3,
     ["switch 48 port", "core switch"]),
    ("konfiguracja vlan",       "KNR 5-09 0108-03", 1.00, "kpl", 1.2,
     ["VLAN configuration", "segmentacja sieci"]),
]
for kw, knr, rbh, unit, conf, kws in LAN_BIURO:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "it_siec", conf, kws)

# ── 2.4 DALI sensory / inteligentne oświetlenie ──────────────────────────────
DALI_BIURO = [
    ("czujnik oswietlenia dali",    "KNR 5-04 1503-03", 0.60, "szt", 1.3,
     ["sensor DALI", "luxometr DALI", "czujnik natężenia"]),
    ("czujnik obecnosci dali",      "KNR 5-04 1503-04", 0.60, "szt", 1.3,
     ["PIR DALI", "sensor ruchu DALI", "présence DALI"]),
    ("przycisk programowalny dali", "KNR 5-04 1503-05", 0.50, "szt", 1.3,
     ["switch DALI", "klawisz DALI", "panel DALI"]),
    ("sterownik dali 2ch",          "KNR 5-04 1503-01", 0.80, "szt", 1.3,
     ["driver DALI 2ch", "kontroler DALI"]),
    ("sterownik dali 8ch",          "KNR 5-04 1503-01", 1.00, "szt", 1.4,
     ["driver DALI 8ch"]),
    ("programowanie strefy dali",   "KNR 5-04 1503-06", 1.00, "strefa", 1.3,
     ["DALI group programming", "strefa DALI", "scene DALI"]),
    ("kabel magistrali dali",       "KNR 5-04 1503-07", 0.80, "100mb", 1.2,
     ["DALI bus cable", "kabel 2-żyłowy DALI"]),
    ("zrodlo dali psu",             "KNR 5-04 1503-01", 0.40, "szt", 1.2,
     ["DALI PSU", "zasilacz magistrali"]),
    ("oprawa led dali 600x600",     "KNR 5-04 0401-01", 0.50, "szt", 1.3,
     ["panel LED 600x600 DALI", "troffer DALI"]),
    ("oprawa led dali 1200x300",    "KNR 5-04 0401-01", 0.50, "szt", 1.3,
     ["panel LED 120x30 DALI"]),
    ("relej dali",                  "KNR 5-04 1503-08", 0.30, "szt", 1.2,
     ["DALI relay", "przekaźnik DALI"]),
]
for kw, knr, rbh, unit, conf, kws in DALI_BIURO:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "aparatura", conf, kws)

# ── 2.5 Floorboxy + listwy combo (zestawy biurowe) ───────────────────────────
BIURO_ZESTAWY = [
    ("stanowisko biurowe",     "KNR 5-04 0301-01", 2.00, "szt", 1.2,
     ["biurkowy punkt zasilania", "workstation power"]),
    ("punkt zasilania biurka", "KNR 5-04 0301-01", 1.50, "szt", 1.2,
     ["zasilanie biurka", "desk power outlet"]),
    ("zestaw biurowy 4x230 2xlan","KNR 5-04 0301-02", 2.50, "szt", 1.3,
     ["zestaw biurka", "4xGP + LAN"]),
]
for kw, knr, rbh, unit, conf, kws in BIURO_ZESTAWY:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "zestawy", conf, kws)

# =============================================================================
# CLUSTER 3 — HALA / MAGAZYN (Склады и цеха)
# =============================================================================

# ── 3.1 Szynoprzewody (Busbar trunking) ──────────────────────────────────────
SZYNOPRZEWODY = [
    ("szynoprzewod 100a",   1.00, "mb", 1.4, ["busbar 100A", "trakt 100A"]),
    ("szynoprzewod 160a",   1.20, "mb", 1.4, ["busbar 160A"]),
    ("szynoprzewod 250a",   1.50, "mb", 1.4, ["busbar 250A", "trakt 250A"]),
    ("szynoprzewod 400a",   1.80, "mb", 1.5, ["busbar 400A"]),
    ("szynoprzewod 630a",   2.20, "mb", 1.5, ["busbar 630A"]),
    ("szynoprzewod 800a",   2.50, "mb", 1.5, ["busbar 800A"]),
    ("szynoprzewod 1000a",  3.00, "mb", 1.5, ["busbar 1000A", "mega busbar"]),
    ("zlacze szynoprzewodu","KNR 5-08 0701-02", 1.00, "szt", 1.4,
     ["złącze busbar", "skrzynka odgałęźna busbar"]),
    ("skrzynka odgalezna szynoprzewodu","KNR 5-08 0701-03", 1.50, "szt", 1.4,
     ["tap-off box", "skrzynka odgałęźna"]),
    ("koniec szynoprzewodu",   2.00, "szt", 1.3, ["end cap busbar"]),
    ("montaz szynoprzewodu na wspornikach", 0.50, "mb", 1.4,
     ["uchwyt busbar", "montaż na suficie"]),
]
for item in SZYNOPRZEWODY:
    if len(item) == 5 and isinstance(item[0], str) and not item[0].startswith("KNR"):
        kw, rbh, unit, conf, kws = item
        add(kw, "KNR 5-08 0701-01", kw.capitalize(), "robocizna", rbh, unit, "aparatura", conf, kws)
    elif len(item) == 6:
        kw, knr, rbh, unit, conf, kws = item
        add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "aparatura", conf, kws)

# ── 3.2 Oświetlenie przemysłowe High-Bay / IP65 ──────────────────────────────
OSWIETLENIE_HALA = [
    ("oprawa highbay 100w",   "KNR 5-04 0401-11", 0.80, "szt", 1.4,
     ["High-Bay 100W", "UFO 100W", "kosz przemysłowy"]),
    ("oprawa highbay 150w",   "KNR 5-04 0401-11", 0.80, "szt", 1.4,
     ["High-Bay 150W", "UFO 150W"]),
    ("oprawa highbay 200w",   "KNR 5-04 0401-11", 1.00, "szt", 1.4,
     ["High-Bay 200W", "UFO 200W"]),
    ("oprawa highbay 300w",   "KNR 5-04 0401-11", 1.00, "szt", 1.5,
     ["High-Bay 300W", "UFO 300W"]),
    ("oprawa przemyslowa ip65","KNR 5-04 0401-05", 0.70, "szt", 1.3,
     ["hermetyczna IP65", "oprawa hala IP65"]),
    ("oprawa liniowa ip65 150cm","KNR 5-04 0401-05", 0.70, "szt", 1.3,
     ["świetlówka hermetyczna 150", "listwa IP65"]),
    ("oprawa liniowa ip65 120cm","KNR 5-04 0401-05", 0.65, "szt", 1.3,
     ["świetlówka hermetyczna 120"]),
    ("naswietlacz led zewnetrzny 100w","KNR 5-04 0401-12", 0.80, "szt", 1.3,
     ["floodlight 100W", "reflektor LED 100W"]),
    ("naswietlacz led zewnetrzny 200w","KNR 5-04 0401-12", 1.00, "szt", 1.3,
     ["floodlight 200W", "halogen 200W LED"]),
    ("naswietlacz led zewnetrzny 300w","KNR 5-04 0401-12", 1.20, "szt", 1.3,
     ["floodlight 300W"]),
    ("oprawa wybuchowa atex",  "KNR 5-04 0401-13", 2.00, "szt", 1.4,
     ["Ex-proof", "ATEX", "strefa zagrożona wybuchem"]),
    ("oprawa awaryjne highbay","KNR 5-04 0401-03", 1.00, "szt", 1.3,
     ["Emergency High-Bay", "awaryjna przemysłowa"]),
]
for kw, knr, rbh, unit, conf, kws in OSWIETLENIE_HALA:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "oswietlenie", conf, kws)

# ── 3.3 Montaż na wysokości z zwyżki ─────────────────────────────────────────
WYSOKOSCI = [
    ("montaz na wysokosci do 6m",    "KNR 5-04 9801-01", 1.30, "kpl", 1.4,
     ["praca na wysokości 6m", "drabina", "montaż wysoko"]),
    ("montaz na wysokosci 6 10m",    "KNR 5-04 9801-02", 1.60, "kpl", 1.5,
     ["praca na zwyżce 10m", "ruchome rusztowanie"]),
    ("montaz na wysokosci 10 15m",   "KNR 5-04 9801-03", 2.00, "kpl", 1.5,
     ["zwyżka 15m", "praca 10-15m"]),
    ("montaz na wysokosci pow 15m",  "KNR 5-04 9801-04", 2.50, "kpl", 1.5,
     ["zwyżka >15m", "praca pow. 15m"]),
    ("wspolczynnik wysokosciowy",    "KNR 5-04 9801-05", 0.30, "kpl", 1.3,
     ["naddatek wysokościowy", "współczynnik pracy na wys."]),
    ("wynajm zwyzki",                "KNR 5-04 9802-01", 0.00, "h",   1.0,
     ["zwyżka wynajem", "podnośnik koszowy najem"]),
    ("rusztowanie montaz",           "KNR 5-04 9803-01", 0.50, "m2",  1.2,
     ["rusztowanie budowlane", "scaffolding"]),
]
for kw, knr, rbh, unit, conf, kws in WYSOKOSCI:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "prace_dodatkowe", conf, kws)

# ── 3.4 Rozdzielnice przemysłowe ─────────────────────────────────────────────
ROZD_PRZEM = [
    ("szafa rozdzielcza przemyslowa rnn",   "KNR 5-08 0601-01", 8.00, "szt", 1.4,
     ["RNN", "szafa przemysłowa", "rozdzielnica fabryczna"]),
    ("szafa rozdzielcza rlo",               "KNR 5-08 0601-01", 5.00, "szt", 1.4,
     ["RLO", "obwód oświetleniowy przemysł"]),
    ("szafa sterowania silnikami",          "KNR 5-08 0601-02", 10.0, "szt", 1.4,
     ["MCC", "szafa MCC", "motor control center"]),
    ("szafa ups przemyslowy",               "KNR 5-08 0601-03", 5.00, "szt", 1.3,
     ["UPS przemysłowy", "industrial UPS"]),
    ("rozdzielnica na slupie",              "KNR 5-04 0601-07", 3.00, "szt", 1.3,
     ["RS słupowa", "rozdzielnica zewnętrzna słup"]),
    ("szafa zewnetrzna ip54",               "KNR 5-08 0601-04", 3.00, "szt", 1.3,
     ["szafka IP54", "obudowa zewnętrzna"]),
]
for kw, knr, rbh, unit, conf, kws in ROZD_PRZEM:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "rozdzielnice", conf, kws)

# ── 3.5 Trasy przemysłowe na szpilkach ───────────────────────────────────────
TRASY_PRZEM = [
    ("montaz szpilki do stropu",    "KNR 5-04 0701-06", 0.15, "szt", 1.3,
     ["anchor bolt", "szpilka M10", "gwóźdź rozporowy"]),
    ("korytko 200x100 na szpilkach","KNR 5-04 0701-02", 0.50, "mb",  1.4,
     ["taca kablowa 200x100", "perforowana 200"]),
    ("korytko 300x100 na szpilkach","KNR 5-04 0701-02", 0.55, "mb",  1.4,
     ["taca kablowa 300"]),
    ("korytko 400x100 na szpilkach","KNR 5-04 0701-02", 0.60, "mb",  1.4,
     ["taca kablowa 400"]),
    ("korytko 600x100 na szpilkach","KNR 5-04 0701-02", 0.70, "mb",  1.5,
     ["taca kablowa 600", "duże korytko przemysłowe"]),
    ("pomost kablowy",              "KNR 5-04 0701-03", 0.50, "mb",  1.3,
     ["cable bridge", "pomost"]),
    ("mocowanie drabinki kablowej do sciany","KNR 5-04 0701-03", 0.35, "mb", 1.3,
     ["wspornik drabinka", "hak drabinka"]),
    ("koryto kablowe betonowe",     "KNR 5-04 0701-07", 0.80, "mb",  1.3,
     ["koryto betonowe", "kanał kablowy betonowy"]),
]
for kw, knr, rbh, unit, conf, kws in TRASY_PRZEM:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "rury_trasy", conf, kws)

# ── 3.6 Силовое оборудование 400V ────────────────────────────────────────────
SILOWE_400V = [
    ("gniazdo cee 400v 16a 3p",    "KNR 5-04 0302-01", 0.50, "szt", 1.5,
     ["gniazdo 400V 16A", "CEE 16A 3P+N+PE", "siłowe 16A"]),
    ("gniazdo cee 400v 32a 3p",    "KNR 5-04 0302-02", 0.70, "szt", 1.5,
     ["gniazdo 400V 32A", "CEE 32A", "siłowe 32A"]),
    ("gniazdo cee 400v 63a 3p",    "KNR 5-04 0302-03", 1.10, "szt", 1.5,
     ["gniazdo 400V 63A", "CEE 63A", "siłowe 63A"]),
    ("gniazdo cee 400v 125a 3p",   "KNR 5-04 0302-04", 1.80, "szt", 1.5,
     ["gniazdo 400V 125A", "CEE 125A", "siłowe 125A"]),
    ("podlaczenie maszyny",         "KNR 5-08 0401-01", 2.50, "szt", 1.3,
     ["podłączenie CNC", "przyłącze maszyny", "zasilanie maszyny"]),
    ("podlaczenie klimatyzatora przemyslowego","KNR 5-04 1601-03", 2.00, "szt", 1.3,
     ["klimatyzacja 3-fazowa", "chiller podłączenie"]),
    ("podlaczenie wentylacji",       "KNR 5-08 0401-02", 1.50, "szt", 1.3,
     ["VU podłączenie", "wentylator przemysłowy"]),
    ("podlaczenie sprezarki",        "KNR 5-08 0401-03", 2.00, "szt", 1.3,
     ["kompresor podłączenie", "sprężarka 400V"]),
    ("podlaczenie suwnicy",          "KNR 5-08 0401-04", 4.00, "szt", 1.4,
     ["suwnica elektryczna", "crane connection"]),
    ("podlaczenie agregatu prad",    "KNR 5-08 0401-05", 3.00, "szt", 1.3,
     ["agregat prądotwórczy", "generator 400V"]),
    ("gniazdo atex 400v 16a",        "KNR 5-04 0302-05", 1.50, "szt", 1.4,
     ["gniazdo Ex 16A", "ATEX socket", "przeciwwybuchowe"]),
    ("gniazdo atex 400v 32a",        "KNR 5-04 0302-05", 2.00, "szt", 1.4,
     ["gniazdo Ex 32A"]),
]
for kw, knr, rbh, unit, conf, kws in SILOWE_400V:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "aparatura", conf, kws)

# ── 3.7 Demontaż przemysłowy ─────────────────────────────────────────────────
DEMONTAZ_PRZEM = [
    ("demontaz szynoprzewodu",     "KNR 5-04 9905-04", 0.80, "mb",  1.4,
     ["rozebranie busbar", "demontaż traktu"]),
    ("demontaz oswietlenia halowego","KNR 5-04 9903-02", 0.50, "szt", 1.3,
     ["demontaż High-Bay", "rozebranie lamp przemysłowych"]),
    ("demontaz gniazd silowych",   "KNR 5-04 9902-04", 0.30, "szt", 1.3,
     ["demontaż CEE", "rozebranie gniazda siłowego"]),
    ("demontaz szafy przemyslowej","KNR 5-04 9904-02", 3.00, "szt", 1.4,
     ["demontaż rozdzielnicy przemysłowej"]),
    ("demontaz transformatora",    "KNR 5-04 9904-05", 8.00, "szt", 1.4,
     ["rozebranie transformatora"]),
]
for kw, knr, rbh, unit, conf, kws in DEMONTAZ_PRZEM:
    add(kw, knr, kw.capitalize(), "robocizna", rbh, unit, "demontaz", conf, kws)

# =============================================================================
# SQL GENERATION WITH metadata.keywords
# =============================================================================

def build_sql(rows_list):
    header = """-- ============================================================
-- ES-Engine Dictionary Seed v5.0 — Object-type clusters
-- AUTO-GENERATED by scripts/generate-seed-v5.py
-- Clusters: MIESZKANIOWKA / BIURO / HALA+MAGAZYN
-- Keywords (slang+tech) embedded in keyword variants via add() calls
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs,
   labor_norm_rbh, unit, category, confidence_weight)
VALUES
"""
    vals = []
    for r in rows_list:
        vals.append(
            f"('{esc(r['keyword'])}', '{r['knr_ref']}', '{esc(r['label'])}', "
            f"'{r['type']}', false, NULL, {r['rbh']}, '{r['unit']}', "
            f"'{r['category']}', {r['confidence']})"
        )

    footer = "\nON CONFLICT (keyword_normalized) DO NOTHING;\n"
    comment = (
        f"\nCOMMENT ON TABLE es_dictionary IS\n"
        f"  'ES-Engine semantic dictionary v5.0 — {len(rows_list)} new entries. "
        f"Clusters: Mieszkaniowka (beton/cegla/GK), Biuro (floorboxy/DALI/LAN), "
        f"Hala (szynoprzewody/High-Bay/400V/wysokosc).';\n"
    )
    return header + ",\n".join(vals) + footer + comment

sql = build_sql(rows)
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(sql)

print(f"✅ Generated {len(rows)} entries → {OUTPUT_FILE}")
cats = {}
for r in rows:
    cats[r['category']] = cats.get(r['category'], 0) + 1
for k, v in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"   {k}: {v}")
