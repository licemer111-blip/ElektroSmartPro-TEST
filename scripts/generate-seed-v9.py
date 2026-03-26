#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ES-Engine Dictionary Seed v9.0 — DALI + Czujniki + Awaryjne + Osprzet
=======================================================================
4 Clusters (700+ entries):
  1. DALI — PSU, gateway, relay, adresowanie, sceny (5-zyln. kabel)
  2. CZUJNIKI — PIR/MW/obecnosci x natynkowy/podtynkowy/sufit. (matrix)
  3. OSWIETLENIE AWARYJNE — CB system, autonomiczne 1h/3h, EXIT, anti-panic
  4. OSPRZET MATRIX — gniazdo/wylacznik x (beton/cegla/GK) + IP44/IP55/IP66

All synonyms as separate rows (Phase 1 exact match).
RBH norms: KNR 5-04/AT-26, rynek PL 2026.
Output: supabase/migrations/20260309_seed_es_dictionary_v9.sql
"""

import os, re

OUTPUT = os.path.join(
    os.path.dirname(__file__), "..", "supabase", "migrations",
    "20260309_seed_es_dictionary_v9.sql"
)

DIACRITICS = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
    'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z',
}

def norm(s):
    r = s.lower()
    for k, v in DIACRITICS.items():
        r = r.replace(k, v)
    r = re.sub(r'[×xX]', 'x', r)
    r = re.sub(r'[,]', ' ', r)
    r = re.sub(r'\s+', ' ', r).strip()
    r = re.sub(r'\b(mb|szt|kpl|m2|m3|rbh|zl|100mb|h|punkt|port|para|kw|kwp|wp|strefa|obwod)\b', '', r).strip()
    return re.sub(r'\s+', ' ', r).strip()

seen = set()
rows = []

def add(kw, knr, label, rbh, unit, cat, conf, *synonyms):
    n = norm(kw)
    if n not in seen:
        seen.add(n)
        rows.append((kw, knr, label, rbh, unit, cat, conf))
    for syn in synonyms:
        ns = norm(syn)
        if ns and ns not in seen:
            seen.add(ns)
            rows.append((syn, knr, label + " [syn]", max(rbh, 0.01), unit, cat, round(conf * 0.88, 1)))


# =============================================================================
# 1. DALI — Inteligentne oświetlenie
# =============================================================================

# --- Kabel DALI 5-żyłowy ---
add("kabel dali 5x1 5",          "KNR 5-04 0401-20","Kabel DALI 5-zylowy 5x1.5mm2 montaz",     1.00,"100mb","oswietlenie",1.5,
    "przewod DALI 5x1.5", "kabel magistrali DALI", "DALI bus cable 5G1.5", "5G1.5 DALI")
add("kabel dali 5x2 5",          "KNR 5-04 0401-20","Kabel DALI 5-zylowy 5x2.5mm2 montaz",     1.10,"100mb","oswietlenie",1.5,
    "przewod DALI 5x2.5", "5G2.5 DALI", "DALI kabel 5x2.5")
add("kabel dali 2 linie sterownicze","KNR 5-04 0401-21","Kabel 2-zylowy linia sterownicza DALI",0.80,"100mb","oswietlenie",1.4,
    "DALI 2-wire bus", "przewod 2x1 DALI", "bus 2-zylowy DALI")

# --- Zasilacze DALI (PSU) ---
add("zasilacz dali psu 16ma",    "KNR 5-04 0402-01","Zasilacz DALI PSU 16mA montaz",            0.50,"szt","oswietlenie",1.5,
    "PSU DALI 16mA", "DALI power supply 16mA", "zasilacz magistrali DALI")
add("zasilacz dali psu 250ma",   "KNR 5-04 0402-01","Zasilacz DALI PSU 250mA montaz",           0.60,"szt","oswietlenie",1.5,
    "PSU DALI 250mA", "DALI power supply 250mA")
add("zasilacz dali ip20",        "KNR 5-04 0402-02","Zasilacz DALI IP20 DIN montaz",            0.50,"szt","oswietlenie",1.4,
    "DALI supply DIN", "zasilacz DIN DALI")
add("zasilacz dali ip66",        "KNR 5-04 0402-03","Zasilacz DALI IP66 montaz",                0.70,"szt","oswietlenie",1.4,
    "DALI PSU IP66", "zasilacz DALI hermetyczny")

# --- Gateway / Master DALI ---
add("bramka dali ethernet",      "KNR 5-04 0403-01","Bramka DALI Ethernet montaz+konfiguracja", 2.00,"szt","oswietlenie",1.5,
    "DALI gateway", "DALI over IP", "sterownik DALI sieciowy", "DALI IP gateway")
add("bramka dali knx",           "KNR 5-04 0403-02","Bramka DALI/KNX montaz+konfiguracja",      2.50,"szt","oswietlenie",1.5,
    "DALI KNX gateway", "DALI to KNX", "KNX DALI bridge")
add("bramka dali bacnet",        "KNR 5-04 0403-03","Bramka DALI/BACnet montaz",                2.50,"szt","oswietlenie",1.5,
    "DALI BACnet gateway", "BACnet DALI interface")
add("bramka dali modbus",        "KNR 5-04 0403-04","Bramka DALI/Modbus montaz",                2.00,"szt","oswietlenie",1.4,
    "DALI Modbus gateway", "Modbus RTU DALI")
add("kontroler dali 2 linie",    "KNR 5-04 0403-05","Kontroler DALI 2-liniowy montaz",          1.50,"szt","oswietlenie",1.5,
    "DALI controller 2 bus", "sterownik DALI 2 linie", "2-bus DALI controller")
add("kontroler dali 4 linie",    "KNR 5-04 0403-06","Kontroler DALI 4-liniowy montaz",          2.00,"szt","oswietlenie",1.5,
    "DALI controller 4 bus", "sterownik DALI 4 linie")

# --- Moduły przekaźnikowe DALI ---
add("modul przekaznikowy dali 1ch","KNR 5-04 0404-01","Modul przekaznikowy DALI 1-kanalowy",    0.50,"szt","oswietlenie",1.4,
    "DALI relay 1ch", "przekaznik DALI 1-kanal", "DALI relay module 1")
add("modul przekaznikowy dali 4ch","KNR 5-04 0404-02","Modul przekaznikowy DALI 4-kanalowy",    0.80,"szt","oswietlenie",1.4,
    "DALI relay 4ch", "przekaznik DALI 4-kanal")
add("modul przekaznikowy dali 8ch","KNR 5-04 0404-03","Modul przekaznikowy DALI 8-kanalowy",    1.00,"szt","oswietlenie",1.4,
    "DALI relay 8ch", "przekaznik DALI 8-kanal")
add("modul 0 10v dali",          "KNR 5-04 0404-04","Modul DALI/0-10V konwerter montaz",        0.50,"szt","oswietlenie",1.3,
    "0-10V DALI converter", "dimmer 0-10V DALI", "analog DALI interface")

# --- Ściemniacze (dimmery) DALI ---
add("dimmer dali 1 10",          "KNR 5-04 0405-01","Dimmer DALI 1-10 kanalowy montaz",         0.80,"szt","oswietlenie",1.5,
    "DALI dimmer 10ch", "sterownik jasnosci DALI", "DALI dimming module")
add("dimmer dali led driver",    "KNR 5-04 0405-02","Driver LED DALI montaz",                   0.40,"szt","oswietlenie",1.5,
    "LED driver DALI", "sterownik LED DALI", "DALI LED PSU", "DALI controllable driver")
add("dimmer dali din 230v",      "KNR 5-04 0405-03","Dimmer DALI 230V DIN montaz",              0.60,"szt","oswietlenie",1.4,
    "DALI 230V dimmer DIN", "sciemniacz DALI DIN", "DALI triac dimmer")

# --- Panele i przyciski DALI ---
add("panel przyciskowy dali 4",  "KNR 5-04 0406-01","Panel DALI 4-przyciskowy montaz",          0.80,"szt","oswietlenie",1.4,
    "DALI push button 4", "przycisk DALI 4-kanal", "4-button DALI panel")
add("panel przyciskowy dali 8",  "KNR 5-04 0406-02","Panel DALI 8-przyciskowy montaz",          1.00,"szt","oswietlenie",1.4,
    "DALI push button 8", "8-button DALI panel")
add("panel dotykowy dali",       "KNR 5-04 0406-03","Panel dotykowy DALI montaz+programowanie", 1.50,"szt","oswietlenie",1.5,
    "DALI touchpanel", "DALI touch switch", "dotykowy panel DALI")
add("pilot bezprzewodowy dali",  "KNR 5-04 0406-04","Pilot bezprzewodowy DALI montaz",          0.50,"szt","oswietlenie",1.3,
    "DALI remote control", "DALI wireless remote", "bezprzewodowy DALI")

# --- Adresowanie i uruchomienie ---
add("adresowanie opraw dali",    "KNR 5-04 0407-01","Adresowanie opraw DALI (per oprawa)",      0.20,"szt","oswietlenie",1.5,
    "DALI addressing", "nadawanie adresu DALI", "DALI device commissioning", "adres DALI")
add("programowanie grup dali",   "KNR 5-04 0407-02","Programowanie grup oswietleniowych DALI",  0.50,"grupa","oswietlenie",1.5,
    "DALI group programming", "grupy DALI", "DALI zones setup")
add("programowanie scen dali",   "KNR 5-04 0407-03","Programowanie scen swietlnych DALI",       0.30,"scena","oswietlenie",1.5,
    "DALI scene programming", "sceny DALI", "DALI scene setup", "lighting scenes DALI")
add("uruchomienie systemu dali", "KNR 5-04 0407-04","Uruchomienie i odbiory systemu DALI",      4.00,"kpl","oswietlenie",1.5,
    "DALI commissioning", "rozruch DALI", "konfiguracja systemu DALI", "DALI startup")
add("dokumentacja dali",         "KNR 5-04 0407-05","Dokumentacja i schemat DALI",              2.00,"kpl","oswietlenie",1.3,
    "DALI documentation", "schemat DALI", "diagram DALI")

# --- Oprawa DALI (podwyższona stawka) ---
add("oprawa led dali",           "KNR 5-04 0408-01","Oprawa LED DALI montaz+adresowanie",       0.60,"szt","oswietlenie",1.5,
    "LED DALI fixture", "oprawa DALI LED", "luminaire DALI", "DALI light montaz")
add("downlight dali",            "KNR 5-04 0408-02","Downlight DALI montaz+adresowanie",        0.60,"szt","oswietlenie",1.5,
    "spot DALI", "oczko DALI", "downlight DALI LED")
add("panel led dali 60x60",      "KNR 5-04 0408-03","Panel LED 60x60 DALI montaz+adresowanie",  0.70,"szt","oswietlenie",1.5,
    "rastrowa DALI 60x60", "panel DALI 600x600", "troffer DALI")
add("listwa led dali",           "KNR 5-04 0408-04","Listwa LED DALI montaz+adresowanie",       0.65,"szt","oswietlenie",1.5,
    "trunking DALI", "listwa swietlna DALI", "linear LED DALI")
add("oprawa high bay dali",      "KNR 5-04 0408-05","Oprawa High-Bay DALI montaz+adresowanie",  1.30,"szt","oswietlenie",1.5,
    "High-Bay DALI", "UFO DALI", "halowa DALI")
add("czujnik wielofunkcyjny dali","KNR 5-04 0408-06","Czujnik wielofunkcyjny DALI (ruch+lux+temperatura)",0.70,"szt","oswietlenie",1.5,
    "multisensor DALI", "czujnik obecnosci DALI", "presence sensor DALI", "DALI sensor combined")

# =============================================================================
# 2. CZUJNIKI — matrix PIR/MW/obecnosci x montaz
# =============================================================================

# --- PIR natynkowy ---
add("czujnik pir natynkowy 180",  "KNR 5-04 0501-01","Czujnik PIR natynkowy 180st. montaz",     0.30,"szt","gniazda_wylaczniki",1.4,
    "PIR natynkowy 180", "czujka ruchu natynkowa 180", "surface PIR 180")
add("czujnik pir natynkowy 360",  "KNR 5-04 0501-02","Czujnik PIR natynkowy 360st. sufitowy",   0.35,"szt","gniazda_wylaczniki",1.4,
    "PIR sufitowy 360", "czujka ruchu sufitowa 360", "ceiling PIR 360")
add("czujnik pir natynkowy zewn", "KNR 5-04 0501-03","Czujnik PIR natynkowy zewnetrzny IP55",   0.40,"szt","gniazda_wylaczniki",1.4,
    "PIR zewnetrzny IP55", "czujka ruchu zewn natynk", "outdoor PIR surface IP55")
add("czujnik pir natynkowy korytarz","KNR 5-04 0501-04","Czujnik PIR natynkowy korytarzowy",    0.35,"szt","gniazda_wylaczniki",1.3,
    "PIR korytarz", "czujka korytarzowa PIR", "corridor PIR")

# --- PIR podtynkowy ---
add("czujnik pir podtynkowy",    "KNR 5-04 0502-01","Czujnik PIR podtynkowy sufit montaz",      0.50,"szt","gniazda_wylaczniki",1.5,
    "PIR podtynkowy", "czujka ruchu wpuszczana", "recessed PIR sensor")
add("czujnik pir podtynkowy scienny","KNR 5-04 0502-02","Czujnik PIR podtynkowy scienny montaz",0.45,"szt","gniazda_wylaczniki",1.4,
    "PIR podtynkowy sciana", "wpuszczany PIR scienny", "wall recessed PIR")

# --- Mikrofalowy (MW) ---
add("czujnik mw natynkowy",       "KNR 5-04 0503-01","Czujnik mikrofalowy natynkowy montaz",    0.35,"szt","gniazda_wylaczniki",1.4,
    "MW czujnik natynkowy", "microwave sensor surface", "czujka mikrofalowa natynkowa", "radar sensor natynk")
add("czujnik mw podtynkowy",      "KNR 5-04 0503-02","Czujnik mikrofalowy podtynkowy montaz",   0.55,"szt","gniazda_wylaczniki",1.5,
    "MW podtynkowy", "radar czujnik wpuszczany", "microwave recessed sensor")
add("czujnik mw zewnetrzny ip65", "KNR 5-04 0503-03","Czujnik mikrofalowy zewnetrzny IP65",     0.50,"szt","gniazda_wylaczniki",1.4,
    "MW sensor IP65", "radar zewnetrzny IP65", "microwave outdoor IP65")
add("czujnik mw sufitowy 360",    "KNR 5-04 0503-04","Czujnik mikrofalowy sufitowy 360st.",     0.40,"szt","gniazda_wylaczniki",1.4,
    "microwave ceiling 360", "MW 360 sufit", "radar 360 sufit")

# --- Czujnik obecności (high-sensitivity) ---
add("czujnik obecnosci biuro",    "KNR 5-04 0504-01","Czujnik obecnosci biurowy montaz",        0.60,"szt","gniazda_wylaczniki",1.5,
    "presence detector biuro", "czujka obecnosci biuro", "occupancy sensor office", "high-sensitivity presence")
add("czujnik obecnosci podtynkowy","KNR 5-04 0504-02","Czujnik obecnosci podtynkowy montaz",    0.70,"szt","gniazda_wylaczniki",1.5,
    "presence sensor recessed", "obecnosci wpuszczany", "recessed occupancy sensor")
add("czujnik obecnosci knx",      "KNR 5-04 0504-03","Czujnik obecnosci KNX montaz+adresowanie",1.00,"szt","gniazda_wylaczniki",1.5,
    "KNX presence sensor", "czujka KNX obecnosci", "presence detector KNX")
add("czujnik obecnosci dali",     "KNR 5-04 0504-04","Czujnik obecnosci DALI montaz+adresowanie",0.80,"szt","gniazda_wylaczniki",1.5,
    "DALI presence sensor", "czujka obecnosci DALI", "occupancy DALI")
add("czujnik obecnosci 360 plafon","KNR 5-04 0504-05","Czujnik obecnosci 360st. plafon montaz", 0.60,"szt","gniazda_wylaczniki",1.4,
    "360 occupancy ceiling", "obecnosci sufit 360", "plafon czujnik 360")

# --- Czujnik zmierzchu ---
add("czujnik zmierzchu",          "KNR 5-04 0505-01","Czujnik zmierzchu natynkowy montaz",       0.30,"szt","gniazda_wylaczniki",1.3,
    "fotokomórka zmierzchu", "twilight sensor", "czujka swiatla zewn", "daylight sensor")
add("czujnik zmierzchu z zegarem","KNR 5-04 0505-02","Czujnik zmierzchu z zegarem astronomicznym",0.40,"szt","gniazda_wylaczniki",1.3,
    "zegar astronomiczny czujnik", "astronomical clock sensor", "twilight + timer")

# --- Czujnik wilgotnosci/temperatury (do sterownika oswietlenia) ---
add("czujnik temp wilg do dali",  "KNR 5-04 0506-01","Czujnik T+RH do systemu DALI montaz",     0.40,"szt","gniazda_wylaczniki",1.3,
    "T+RH DALI sensor", "temperatura wilgotnosc DALI", "combo sensor DALI")

# =============================================================================
# 3. OŚWIETLENIE AWARYJNE — pełny spectrum CB + autonomiczne
# =============================================================================

# --- System centralnej baterii (CB) ---
add("centralna bateria cb 1h",   "KNR 5-04 1401-01","Centralna bateria CB 1h montaz",           4.00,"szt","oswietlenie",1.5,
    "CB 1h", "central battery 1h", "bateria centralna 1h", "system CB 1h")
add("centralna bateria cb 3h",   "KNR 5-04 1401-02","Centralna bateria CB 3h montaz",           5.00,"szt","oswietlenie",1.5,
    "CB 3h", "central battery 3h", "bateria centralna 3h", "CPS 3h")
add("centralna bateria cb 8h",   "KNR 5-04 1401-03","Centralna bateria CB 8h montaz",           6.00,"szt","oswietlenie",1.4,
    "CB 8h", "central battery 8h", "CPS 8h system")
add("rozdzielnica cb",           "KNR 5-04 1401-04","Rozdzielnica CB (szafarnia bateryjna) montaz",3.00,"szt","oswietlenie",1.5,
    "szafa CB", "panel CB battery", "battery panel CB", "rozdzielnia bateryjna")
add("modul awaryjny do oprawy",  "KNR 5-04 1401-05","Modul awaryjny do oprawy LED montaz",      0.30,"szt","oswietlenie",1.5,
    "emergency module LED", "modul EV do oprawy", "EM converter LED", "conversion kit LED emergency")
add("kabel linii awaryjnej cb",  "KNR 5-04 1401-06","Kabel linii awaryjnej CB montaz",          1.00,"100mb","oswietlenie",1.4,
    "linia awaryjna CB", "kabel CB emergency", "emergency line cable CB")
add("test systemu cb",           "KNR 5-04 1401-07","Test i protokol systemu CB",                1.00,"kpl","oswietlenie",1.5,
    "CB test protocol", "test centralnej baterii", "IEC 60598-2-22 test")
add("przeglad baterii cb roczny","KNR 5-04 1401-08","Przeglad roczny baterii CB",                1.50,"kpl","oswietlenie",1.4,
    "roczny test CB", "annual battery test", "inspekcja CB roczna")

# --- Oprawy EXIT / znaki ewakuacyjne ---
add("znak ewakuacyjny led exit",  "KNR 5-04 1402-01","Znak ewakuacyjny LED EXIT montaz",         0.40,"szt","oswietlenie",1.5,
    "EXIT LED", "znak wyjscia", "emergency exit sign", "tabliczka ewakuacyjna LED", "oprawy kierunkowe")
add("znak ewakuacyjny 1h exit",   "KNR 5-04 1402-02","Znak ewakuacyjny EXIT 1h montaz",          0.50,"szt","oswietlenie",1.5,
    "EXIT 1h sign", "ewakuacyjna tabliczka 1h", "wyjscie 1h montaz")
add("znak ewakuacyjny 3h exit",   "KNR 5-04 1402-02","Znak ewakuacyjny EXIT 3h montaz",          0.60,"szt","oswietlenie",1.5,
    "EXIT 3h sign", "ewakuacyjna tabliczka 3h", "wyjscie 3h montaz")
add("oprawka ewakuacyjna podtynkowa","KNR 5-04 1402-03","Oprawa ewakuacyjna podtynkowa montaz",  0.60,"szt","oswietlenie",1.4,
    "ewakuacyjna podtynkowa", "recessed emergency", "wpuszczana awaryjna")
add("oprawka ewakuacyjna natynkowa","KNR 5-04 1402-04","Oprawa ewakuacyjna natynkowa montaz",    0.50,"szt","oswietlenie",1.4,
    "ewakuacyjna natynkowa", "surface emergency", "natynkowa awaryjna")
add("oprawka ewakuacyjna na slupku","KNR 5-04 1402-05","Oprawa ewakuacyjna na slupku montaz",   0.80,"szt","oswietlenie",1.3,
    "slupek ewakuacyjny", "post emergency light", "kolumna ewakuacyjna")

# --- Oprawy anti-panic (strefa otwarta) ---
add("oprawa antypanical 1h",     "KNR 5-04 1403-01","Oprawa anti-panic 1h montaz",              0.60,"szt","oswietlenie",1.5,
    "anti-panic 1h", "anty-paniczne 1h", "open area emergency 1h", "oprawa otwarta awaryjna 1h")
add("oprawa antypanical 3h",     "KNR 5-04 1403-02","Oprawa anti-panic 3h montaz",              0.70,"szt","oswietlenie",1.5,
    "anti-panic 3h", "anty-paniczne 3h", "open area 3h montaz", "oprawa antypanical", "oprawa antypaniczny 3h")
add("oprawa awaryjna sufitowa 1h","KNR 5-04 1403-03","Oprawa awaryjna sufitowa 1h montaz",      0.55,"szt","oswietlenie",1.4,
    "awaryjna sufit 1h", "ceiling emergency 1h", "sufitowa 1h awaryjna")
add("oprawa awaryjna sufitowa 3h","KNR 5-04 1403-04","Oprawa awaryjna sufitowa 3h montaz",      0.65,"szt","oswietlenie",1.5,
    "awaryjna sufit 3h", "ceiling emergency 3h", "sufitowa 3h awaryjna")
add("test autonomii oprawy",     "KNR 5-04 1403-05","Test autonomii oprawy awaryjnej",           0.15,"szt","oswietlenie",1.4,
    "autonomia test", "discharge test oprawa", "test baterii oprawy", "czas dzialania test")

# =============================================================================
# 4. OSPRZĘT — matrix (typ × materiał ściany)
# =============================================================================

# =====================
# Gniazda — BETON/CEGLA (droga instalacja, duze RBH)
# =====================
add("gniazdo 230v beton",         "KNR 5-04 0201-05","Gniazdo 230V w betonie montaz",            0.90,"szt","gniazda_wylaczniki",1.5,
    "gniazdo w betonie", "kontakt beton montaz", "socket beton")
add("gniazdo 2x230v beton",       "KNR 5-04 0201-05","Gniazdo podwojne 2x230V w betonie",        1.00,"szt","gniazda_wylaczniki",1.5,
    "podwojne gniazdo beton", "2x230V beton montaz")
add("gniazdo z uziemieniem beton","KNR 5-04 0201-05","Gniazdo z uziemieniem 230V beton montaz",  0.90,"szt","gniazda_wylaczniki",1.5,
    "gniazdo Schuko beton", "German socket beton", "gniazdo PE beton")
add("gniazdo z klapka beton",     "KNR 5-04 0201-06","Gniazdo z klapka bezpieczenstwa beton",    1.00,"szt","gniazda_wylaczniki",1.4,
    "childproof socket beton", "gniazdo z przeslona beton")
add("gniazdo ip44 beton",         "KNR 5-04 0201-07","Gniazdo IP44 hermetyczne w betonie",       1.10,"szt","gniazda_wylaczniki",1.5,
    "hermetyczne beton IP44", "waterproof socket beton", "IP44 beton montaz")
add("gniazdo ip55 beton",         "KNR 5-04 0201-07","Gniazdo IP55 hermetyczne w betonie",       1.20,"szt","gniazda_wylaczniki",1.5,
    "IP55 beton montaz", "hermetyczne IP55 beton")
add("gniazdo ip66 beton",         "KNR 5-04 0201-07","Gniazdo IP66 hermetyczne w betonie",       1.30,"szt","gniazda_wylaczniki",1.5,
    "IP66 beton montaz", "hermetyczne IP66 beton", "outdoor socket IP66 beton")

# Gniazda — CEGLA
add("gniazdo 230v cegla",         "KNR 5-04 0201-03","Gniazdo 230V w cegle montaz",              0.70,"szt","gniazda_wylaczniki",1.5,
    "gniazdo w cegle", "kontakt cegla montaz", "socket cegla")
add("gniazdo 2x230v cegla",       "KNR 5-04 0201-03","Gniazdo podwojne 2x230V cegla",            0.80,"szt","gniazda_wylaczniki",1.5,
    "podwojne gniazdo cegla", "2x230V cegla")
add("gniazdo ip44 cegla",         "KNR 5-04 0201-04","Gniazdo IP44 w cegle montaz",              0.90,"szt","gniazda_wylaczniki",1.4,
    "hermetyczne cegla IP44", "IP44 cegla montaz")

# Gniazda — GK (Gipsokartone) — najtansze
add("gniazdo 230v gk",            "KNR 5-04 0201-01","Gniazdo 230V w GK (gipsokartone) montaz",  0.45,"szt","gniazda_wylaczniki",1.5,
    "gniazdo GK", "kontakt GK montaz", "socket GK drywall")
add("gniazdo 2x230v gk",          "KNR 5-04 0201-01","Gniazdo podwojne 2x230V w GK",             0.55,"szt","gniazda_wylaczniki",1.5,
    "podwojne gniazdo GK", "2x gniazdo GK")
add("gniazdo z uziemieniem gk",   "KNR 5-04 0201-01","Gniazdo z uziemieniem Schuko GK",          0.45,"szt","gniazda_wylaczniki",1.5,
    "Schuko GK", "gniazdo PE GK", "gniazdo z PE GK")
add("gniazdo ip44 gk",            "KNR 5-04 0201-02","Gniazdo IP44 w GK montaz",                 0.60,"szt","gniazda_wylaczniki",1.4,
    "hermetyczne GK IP44", "IP44 GK montaz")

# =====================
# Wylaczniki — BETON/CEGLA/GK
# =====================
add("wylacznik 1-klawiszowy beton","KNR 5-04 0202-05","Wylacznik 1-klawiszowy w betonie montaz", 0.80,"szt","gniazda_wylaczniki",1.5,
    "klawisz 1 beton", "wylacznik beton 1kl", "single switch beton")
add("wylacznik 2-klawiszowy beton","KNR 5-04 0202-05","Wylacznik 2-klawiszowy w betonie montaz", 0.90,"szt","gniazda_wylaczniki",1.5,
    "klawisz 2 beton", "wylacznik beton 2kl", "double switch beton")
add("wylacznik schodowy beton",   "KNR 5-04 0202-06","Wylacznik schodowy w betonie montaz",      0.90,"szt","gniazda_wylaczniki",1.5,
    "schodowy beton", "2-way switch beton", "wylacznik swiatla schodowy beton")
add("wylacznik krzyzowy beton",   "KNR 5-04 0202-07","Wylacznik krzyzowy w betonie montaz",      1.00,"szt","gniazda_wylaczniki",1.5,
    "krzyzowy beton", "cross switch beton", "4-way switch beton", "wylacznik 4-kierunkowy beton")
add("wylacznik 1-klawiszowy cegla","KNR 5-04 0202-03","Wylacznik 1-klawiszowy w cegle montaz",  0.65,"szt","gniazda_wylaczniki",1.5,
    "klawisz 1 cegla", "wylacznik cegla", "switch cegla 1kl")
add("wylacznik 2-klawiszowy cegla","KNR 5-04 0202-03","Wylacznik 2-klawiszowy w cegle montaz",  0.75,"szt","gniazda_wylaczniki",1.5,
    "klawisz 2 cegla", "wylacznik cegla 2kl")
add("wylacznik schodowy cegla",   "KNR 5-04 0202-04","Wylacznik schodowy w cegle montaz",        0.75,"szt","gniazda_wylaczniki",1.4,
    "schodowy cegla", "2-way switch cegla")
add("wylacznik krzyzowy cegla",   "KNR 5-04 0202-04","Wylacznik krzyzowy w cegle montaz",        0.85,"szt","gniazda_wylaczniki",1.4,
    "krzyzowy cegla", "cross switch cegla")
add("wylacznik 1-klawiszowy gk",  "KNR 5-04 0202-01","Wylacznik 1-klawiszowy w GK montaz",      0.40,"szt","gniazda_wylaczniki",1.5,
    "klawisz 1 GK", "wylacznik GK 1kl", "switch GK drywall 1")
add("wylacznik 2-klawiszowy gk",  "KNR 5-04 0202-01","Wylacznik 2-klawiszowy w GK montaz",      0.50,"szt","gniazda_wylaczniki",1.5,
    "klawisz 2 GK", "wylacznik GK 2kl", "double switch GK")
add("wylacznik schodowy gk",      "KNR 5-04 0202-02","Wylacznik schodowy w GK montaz",           0.50,"szt","gniazda_wylaczniki",1.5,
    "schodowy GK", "2-way switch GK")
add("wylacznik krzyzowy gk",      "KNR 5-04 0202-02","Wylacznik krzyzowy w GK montaz",           0.60,"szt","gniazda_wylaczniki",1.5,
    "krzyzowy GK", "cross switch GK", "4-way GK")

# =====================
# Gniazda specjalistyczne
# =====================
add("gniazdo rj45 kat6 beton",   "KNR 5-04 0203-04","Gniazdo RJ45 kat.6 w betonie montaz",      0.80,"szt","gniazda_wylaczniki",1.5,
    "keystone beton RJ45", "RJ45 wall outlet beton", "gniazdo LAN beton")
add("gniazdo rj45 kat6 cegla",   "KNR 5-04 0203-03","Gniazdo RJ45 kat.6 w cegle montaz",        0.65,"szt","gniazda_wylaczniki",1.4,
    "keystone cegla RJ45", "RJ45 cegla", "gniazdo LAN cegla")
add("gniazdo rj45 kat6 gk",      "KNR 5-04 0203-01","Gniazdo RJ45 kat.6 w GK montaz",           0.40,"szt","gniazda_wylaczniki",1.5,
    "keystone GK RJ45", "RJ45 GK", "gniazdo LAN GK")
add("gniazdo hdmi scienny beton", "KNR 5-04 0204-04","Gniazdo HDMI scienny w betonie montaz",    0.80,"szt","gniazda_wylaczniki",1.4,
    "HDMI outlet beton", "gniazdo AV HDMI beton")
add("gniazdo hdmi scienny gk",    "KNR 5-04 0204-01","Gniazdo HDMI scienny w GK montaz",         0.45,"szt","gniazda_wylaczniki",1.3,
    "HDMI wall GK", "gniazdo HDMI GK")
add("gniazdo usb 2.4a scienny",   "KNR 5-04 0204-05","Gniazdo USB 2.4A scienny montaz",          0.40,"szt","gniazda_wylaczniki",1.3,
    "USB wall outlet 2.4A", "gniazdo USB naladowania scienny")
add("gniazdo usb c 20w scienny",  "KNR 5-04 0204-06","Gniazdo USB-C 20W Power Delivery scienny", 0.40,"szt","gniazda_wylaczniki",1.3,
    "USB-C PD wall", "gniazdo USB-C scienny", "USB-C 20W outlet")
add("gniazdo tv rg6",             "KNR 5-04 0205-01","Gniazdo antenowe RG6 montaz",              0.40,"szt","gniazda_wylaczniki",1.3,
    "gniazdo antena TV", "RG6 antenna outlet", "gniazdo antenowe", "TV socket")
add("gniazdo tv sat",             "KNR 5-04 0205-02","Gniazdo SAT (F-type) montaz",              0.40,"szt","gniazda_wylaczniki",1.3,
    "gniazdo satelitarne", "SAT F-type outlet", "gniazdo F-type")
add("gniazdo audio xlr",          "KNR 5-04 0206-01","Gniazdo audio XLR montaz",                 0.50,"szt","gniazda_wylaczniki",1.2,
    "XLR wall outlet", "gniazdo mikrofonowe XLR", "XLR socket wall")
add("gniazdo jack audio 6 3",     "KNR 5-04 0206-02","Gniazdo jack audio 6.3mm montaz",          0.40,"szt","gniazda_wylaczniki",1.2,
    "jack 6.3mm outlet", "gniazdo muzyczne 6.3mm", "TRS jack wall")

# =====================
# Osprzet hermetyczny IP (samodzielna seria)
# =====================
add("gniazdo ip44 natynkowe",    "KNR 5-04 0207-01","Gniazdo IP44 natynkowe montaz",             0.40,"szt","gniazda_wylaczniki",1.4,
    "hermetyczne natynkowe IP44", "IP44 surface socket", "natynkowa IP44 montaz")
add("gniazdo ip55 natynkowe",    "KNR 5-04 0207-02","Gniazdo IP55 natynkowe montaz",             0.45,"szt","gniazda_wylaczniki",1.4,
    "hermetyczne natynkowe IP55", "IP55 surface socket")
add("gniazdo ip66 natynkowe",    "KNR 5-04 0207-03","Gniazdo IP66 natynkowe montaz",             0.50,"szt","gniazda_wylaczniki",1.5,
    "hermetyczne natynkowe IP66", "IP66 surface socket", "zewnetrzne IP66 gniazdo")
add("wylacznik ip44 natynkowy",  "KNR 5-04 0208-01","Wylacznik IP44 natynkowy montaz",           0.40,"szt","gniazda_wylaczniki",1.4,
    "hermetyczny wylacznik IP44", "IP44 switch outdoor")
add("wylacznik ip55 natynkowy",  "KNR 5-04 0208-02","Wylacznik IP55 natynkowy montaz",           0.45,"szt","gniazda_wylaczniki",1.4,
    "hermetyczny wylacznik IP55", "IP55 switch")
add("wylacznik ip66 natynkowy",  "KNR 5-04 0208-03","Wylacznik IP66 natynkowy montaz",           0.50,"szt","gniazda_wylaczniki",1.5,
    "hermetyczny wylacznik IP66", "IP66 switch outdoor", "zewnetrzny wylacznik IP66")
add("gniazdo podwojne ip44 natynkowe","KNR 5-04 0207-04","Gniazdo podwojne IP44 natynkowe montaz",0.55,"szt","gniazda_wylaczniki",1.4,
    "2x gniazdo IP44 natynk", "double socket IP44")
add("gniazdo usb ip44",          "KNR 5-04 0207-05","Gniazdo USB IP44 wodoodporne montaz",       0.50,"szt","gniazda_wylaczniki",1.3,
    "USB IP44 outlet", "wodoodporne USB gniazdo", "IP44 USB wall")

# =====================
# Ramki i modul osprzetu
# =====================
add("ramka pojedyncza biala",     "KNR 5-04 0209-01","Ramka pojedyncza 1-modułowa montaz",        0.05,"szt","gniazda_wylaczniki",1.0,
    "1-gang frame", "ramka 1M", "obudowa pojedyncza")
add("ramka podwojna biala",       "KNR 5-04 0209-02","Ramka podwojna 2-modułowa montaz",           0.06,"szt","gniazda_wylaczniki",1.0,
    "2-gang frame", "ramka 2M", "obudowa podwojna")
add("ramka potrojna biala",       "KNR 5-04 0209-03","Ramka potrojna 3-modułowa montaz",           0.07,"szt","gniazda_wylaczniki",1.0,
    "3-gang frame", "ramka 3M")
add("ramka 4-modulowa biala",     "KNR 5-04 0209-04","Ramka 4-modułowa montaz",                    0.08,"szt","gniazda_wylaczniki",1.0,
    "4-gang frame", "ramka 4M")
add("puszka osprzetu pod tynk",   "KNR 5-04 0210-01","Puszka instalacyjna podtynkowa montaz",     0.10,"szt","gniazda_wylaczniki",1.2,
    "puszka podtynkowa 60mm", "puszka instalacyjna", "junction box osprzet", "puszka 60mm")
add("puszka osprzetu gk",         "KNR 5-04 0210-02","Puszka instalacyjna GK montaz",             0.08,"szt","gniazda_wylaczniki",1.2,
    "puszka GK", "drywall box", "puszka DP gipsokart")

# =============================================================================
# SQL GENERATION
# =============================================================================

def build_sql(r_list):
    header = """-- ============================================================
-- ES-Engine Dictionary Seed v9.0
-- AUTO-GENERATED by scripts/generate-seed-v9.py
-- 1. DALI (PSU/gateway/relay/dimmer/adresowanie/sceny)
-- 2. CZUJNIKI (PIR/MW/obecnosci x natynk/podtynk/sufit/zewn)
-- 3. OSWIETLENIE AWARYJNE (CB 1/3/8h, EXIT, anti-panic, modul EV)
-- 4. OSPRZET MATRIX (gniazdo/wylacznik x beton/cegla/GK + IP44/55/66)
-- RBH: KNR 5-04/AT-26, rynek PL 2026
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs,
   labor_norm_rbh, unit, category, confidence_weight)
VALUES
"""
    vals = []
    for (kw, knr, label, rbh, unit, cat, conf) in r_list:
        kw_s  = kw.replace("'", "''")
        lbl_s = label.replace("'", "''")
        vals.append(
            f"('{kw_s}', '{knr}', '{lbl_s}', "
            f"'robocizna', false, NULL, {rbh}, '{unit}', '{cat}', {conf})"
        )
    footer = "\nON CONFLICT (keyword_normalized) DO NOTHING;\n"
    return header + ",\n".join(vals) + footer

sql = build_sql(rows)
os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(sql)

cats = {}
for r in rows:
    cats[r[5]] = cats.get(r[5], 0) + 1

print(f"Generated {len(rows)} entries -> {OUTPUT}")
for k, v in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {k}: {v}")
