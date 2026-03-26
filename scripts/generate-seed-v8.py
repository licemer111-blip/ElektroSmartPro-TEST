#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ES-Engine Dictionary Seed v8.0 — "Finalny Rywal" Generator
============================================================
5 Clusters:
  1. PV/FOTOWOLTAIKA + EV/WALLBOX — panele, falowniki, DC, AC, Wallbox, stacje
  2. POMIARY / PROTOKOLY — izolacja, petla zwarcia, RCD, protokoly, 5-letnie
  3. PLAC BUDOWY — RB-tki, tymczasowe zasilanie, prowizorka
  4. ATEX / STREFA EX — osprzet wybuchoszczelny, dławnice, przepusty
  5. HVAC SUPPORT — pompy ciepla, klimatyzacja, rekuperatory, falowniki HVAC

Output: supabase/migrations/20260308_seed_es_dictionary_v8.sql
"""

import os, re

OUTPUT = os.path.join(
    os.path.dirname(__file__), "..", "supabase", "migrations",
    "20260308_seed_es_dictionary_v8.sql"
)

DIACRITICS = {
    'a':'a','c':'c','e':'e','l':'l','n':'n','o':'o','s':'s','z':'z',
    'A':'a','C':'c','E':'e','L':'l','N':'n','O':'o','S':'s','Z':'z',
}
DIACRITICS_FULL = {
    'ą':'a','ć':'c','ę':'e','ł':'l','ń':'n','ó':'o','ś':'s','ź':'z','ż':'z',
    'Ą':'a','Ć':'c','Ę':'e','Ł':'l','Ń':'n','Ó':'o','Ś':'s','Ź':'z','Ż':'z',
}

def norm(s):
    r = s.lower()
    for k, v in DIACRITICS_FULL.items():
        r = r.replace(k, v)
    r = re.sub(r'[×xX]', 'x', r)
    r = re.sub(r'[,]', ' ', r)
    r = re.sub(r'\s+', ' ', r).strip()
    r = re.sub(r'\b(mb|szt|kpl|m2|m3|rbh|zl|100mb|h|punkt|port|para|kw|kwp|wp)\b', '', r).strip()
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
# 1. PV / FOTOWOLTAIKA + EV / WALLBOX
# =============================================================================

# --- Panele fotowoltaiczne ---
add("montaz panelu pv na dachu skosnym",  "KNR 5-04 1601-01", "Panel PV na dachu skosnym montaz",     0.60, "szt", "pv_ev", 1.5,
    "panel solarny skos", "panel fotowoltaiczny dach skosny", "PV dachowka", "PV ceramika")
add("montaz panelu pv na blachodachowce", "KNR 5-04 1601-02", "Panel PV blachodachowka montaz",       0.50, "szt", "pv_ev", 1.5,
    "PV blacha trapezowa", "panel solarny blacha", "PV metal roof", "blachodachowka PV")
add("montaz panelu pv dach plaski",       "KNR 5-04 1601-03", "Panel PV dach plaski konstrukcja",     0.65, "szt", "pv_ev", 1.5,
    "PV flat roof", "panel solarny dach plaski", "PV balastowy", "konstrukcja balastowa PV")
add("montaz panelu pv elewacja",          "KNR 5-04 1601-04", "Panel PV elewacja BIPV montaz",        0.80, "szt", "pv_ev", 1.4,
    "BIPV", "building integrated PV", "panel elewacyjny PV", "fasada fotowoltaiczna")
add("montaz panelu pv grunt",             "KNR 5-04 1601-05", "Panel PV na konstrukcji gruntowej",    0.55, "szt", "pv_ev", 1.4,
    "PV grunt", "farma fotowoltaiczna panel", "ground mount PV", "PV ground mounted")
add("konstrukcja dachowa pv aluminium",   "KNR 5-04 1602-01", "Konstrukcja aluminiowa PV dachowa",    0.25, "mb",  "pv_ev", 1.4,
    "profil aluminiowy PV", "szyna PV Al", "montaz szyny PV", "racking PV aluminium")
add("konstrukcja gruntowa pv ocynkowana", "KNR 5-04 1602-02", "Konstrukcja gruntowa PV ocynkowana",   0.50, "mb",  "pv_ev", 1.4,
    "stelaż PV grunt", "ground mount structure PV", "konstrukcja PV FeZn")
add("wkret dachowy z uszczelka pv",       "KNR 5-04 1602-03", "Wkret dachowy z uszczelka PV",         0.05, "szt", "pv_ev", 1.2,
    "hak dachowy PV", "uchwyt dachowy PV", "roof hook PV", "montaz haka PV")

# --- Falowniki (inwertery) ---
add("falownik jednofazowy 3kw",   "KNR 5-04 1603-01", "Falownik PV 1F 3kW montaz+konfiguracja",  2.00, "szt", "pv_ev", 1.5,
    "inwerter 3kW 1F", "string inverter 3kW", "falownik solarny 3kW")
add("falownik jednofazowy 5kw",   "KNR 5-04 1603-01", "Falownik PV 1F 5kW montaz",              2.00, "szt", "pv_ev", 1.5,
    "inwerter 5kW 1F", "string inverter 5kW", "falownik PV 5kW")
add("falownik jednofazowy 8kw",   "KNR 5-04 1603-01", "Falownik PV 1F 8kW montaz",              2.20, "szt", "pv_ev", 1.5,
    "inwerter 8kW", "falownik 8kW 1F")
add("falownik trojfazowy 10kw",   "KNR 5-04 1603-02", "Falownik PV 3F 10kW montaz",             2.50, "szt", "pv_ev", 1.5,
    "inwerter 10kW 3F", "string inverter 10kW 3-phase", "falownik solarny 10kW 3F")
add("falownik trojfazowy 15kw",   "KNR 5-04 1603-02", "Falownik PV 3F 15kW montaz",             2.50, "szt", "pv_ev", 1.5,
    "inwerter 15kW 3F", "falownik 15kW trojfazowy")
add("falownik trojfazowy 20kw",   "KNR 5-04 1603-02", "Falownik PV 3F 20kW montaz",             3.00, "szt", "pv_ev", 1.5,
    "inwerter 20kW", "falownik 20kW PV 3F")
add("falownik trojfazowy 30kw",   "KNR 5-04 1603-02", "Falownik PV 3F 30kW montaz",             3.50, "szt", "pv_ev", 1.5,
    "inwerter 30kW", "falownik 30kW PV")
add("falownik trojfazowy 50kw",   "KNR 5-04 1603-02", "Falownik PV 3F 50kW montaz",             4.00, "szt", "pv_ev", 1.5,
    "inwerter 50kW", "falownik 50kW PV")
add("mikroinwerter panel",        "KNR 5-04 1603-03", "Mikroinwerter per-panel montaz",           0.50, "szt", "pv_ev", 1.4,
    "micro inverter", "mikrofalownik", "Enphase microinverter", "APsystems")
add("optymalizator mocy pv",      "KNR 5-04 1603-04", "Optymalizator mocy DC PV montaz",          0.30, "szt", "pv_ev", 1.3,
    "power optimizer", "SolarEdge optimizer", "optymalizator DC", "DC optimizer PV")
add("falownik hybrydowy z magazynem", "KNR 5-04 1603-05", "Falownik hybrydowy + magazyn energii montaz", 4.00, "szt", "pv_ev", 1.5,
    "hybrid inverter", "falownik off-grid", "falownik z akumulatorem", "storage inverter")
add("magazyn energii bateryjny 5kwh", "KNR 5-04 1604-01", "Magazyn energii 5kWh montaz",           2.00, "szt", "pv_ev", 1.4,
    "battery storage 5kWh", "akumulator PV 5kWh", "home battery 5kWh")
add("magazyn energii bateryjny 10kwh","KNR 5-04 1604-01", "Magazyn energii 10kWh montaz",          2.50, "szt", "pv_ev", 1.4,
    "battery storage 10kWh", "akumulator PV 10kWh", "home battery 10kWh")

# --- Kable DC ---
add("kabel solarny dc 4mm2",     "KNR 5-04 1605-01", "Kabel solarny DC 4mm2 montaz",             1.50, "100mb", "pv_ev", 1.5,
    "kabel DC 4mm2", "kabel PV 4mm2", "H1Z2Z2-K 4mm2", "solar cable 4mm2")
add("kabel solarny dc 6mm2",     "KNR 5-04 1605-01", "Kabel solarny DC 6mm2 montaz",             1.60, "100mb", "pv_ev", 1.5,
    "kabel DC 6mm2", "kabel PV 6mm2", "H1Z2Z2-K 6mm2", "solar cable 6mm2")
add("kabel solarny dc 10mm2",    "KNR 5-04 1605-01", "Kabel solarny DC 10mm2 montaz",            1.80, "100mb", "pv_ev", 1.4,
    "kabel DC 10mm2", "solar cable 10mm2 PV")
add("zlacze mc4",                "KNR 5-04 1605-02", "Zlacze MC4 montaz (para)",                 0.20, "para",  "pv_ev", 1.5,
    "MC4 connector", "wtyk solarny MC4", "MC4 plug", "konektor PV MC4")
add("puszka dc combiner 2string","KNR 5-04 1605-03", "Puszka DC combiner 2-string montaz",       1.00, "szt",   "pv_ev", 1.4,
    "string combiner box 2", "combiner box PV 2", "DC junction box 2string")
add("puszka dc combiner 4string","KNR 5-04 1605-03", "Puszka DC combiner 4-string montaz",       1.50, "szt",   "pv_ev", 1.4,
    "string combiner box 4", "combiner box PV 4", "DC junction 4string")

# --- Ochrona AC/DC ---
add("ochronnik przepiec dc pv",  "KNR 5-04 1606-01", "Ochronnik przepiec DC PV montaz",          0.60, "szt",   "pv_ev", 1.5,
    "SPD DC PV", "OC DC fotowoltaika", "surge protection DC", "przepieciochronnik DC")
add("bezpiecznik strunowy dc",   "KNR 5-04 1606-02", "Bezpiecznik strunowy DC montaz",           0.30, "szt",   "pv_ev", 1.3,
    "string fuse DC", "bezpiecznik DC 10A", "bezpiecznik PV string", "fuse holder DC")
add("wylacznik dc pv",           "KNR 5-04 1606-03", "Wylacznik napiecia DC PV montaz",          0.60, "szt",   "pv_ev", 1.5,
    "DC disconnect switch", "wylacznik izolujacy DC", "DC switch PV", "load break switch DC")
add("zabezpieczenie ac pv",      "KNR 5-04 1606-04", "Zabezpieczenie AC strona falownika",        0.80, "szt",   "pv_ev", 1.4,
    "AC protection PV", "MCB AC PV", "zabezpieczenie po stronie AC")

# --- Liczniki i monitoring ---
add("licznik energii dwukierunkowy","KNR 5-04 1607-01","Licznik energii 2-kierunkowy montaz",    1.00, "szt", "pv_ev", 1.5,
    "smart meter PV", "licznik bidirectional", "licznik prosumenta", "net metering licznik")
add("czujnik prod energii pv",   "KNR 5-04 1607-02", "Czujnik produkcji energii PV montaz",      0.50, "szt", "pv_ev", 1.3,
    "CT clamp PV", "przekladnik pradowy PV", "energy monitor PV", "Shelly EM PV")
add("monitoring pv konfiguracja","KNR 5-04 1607-03", "Monitoring systemu PV konfiguracja",       1.00, "kpl", "pv_ev", 1.3,
    "portal PV konfiguracja", "SolarEdge monitoring", "Fronius Solar.web", "monitoring solarny")

# Kompleksowe rozliczenie per kWp
add("instalacja pv 1kwp dach skosny","KNR 5-04 1608-01","Instalacja PV 1kWp dach skosny (komplet)", 3.00,"kWp","pv_ev",1.5,
    "PV 1kWp skos", "mikroinstalacja 1kWp skos", "fotowoltaika 1kWp dach")
add("instalacja pv 1kwp dach plaski","KNR 5-04 1608-02","Instalacja PV 1kWp dach plaski (komplet)",3.20,"kWp","pv_ev",1.5,
    "PV 1kWp flat roof", "mikroinstalacja plaski dach", "fotowoltaika dach plaski")
add("instalacja pv 1kwp grunt",       "KNR 5-04 1608-03","Instalacja PV 1kWp grunt (komplet)",   2.80,"kWp","pv_ev",1.4,
    "PV 1kWp ground", "fotowoltaika naziemna 1kWp", "farma PV ground")

# --- EV / Wallbox ---
add("wallbox 7kw 1f montaz",     "KNR 5-04 1610-01", "Wallbox 7kW 1F montaz+konfiguracja",      2.50, "szt", "pv_ev", 1.5,
    "stacja ladowania 7kW", "ladowarka do auta 7kW", "EVSE 7kW", "EV charger 7kW 1F")
add("wallbox 11kw 3f montaz",    "KNR 5-04 1610-02", "Wallbox 11kW 3F montaz+konfiguracja",     3.00, "szt", "pv_ev", 1.5,
    "stacja ladowania 11kW 3F", "ladowarka 11kW", "EVSE 11kW 3-phase", "EV charger 11kW")
add("wallbox 22kw 3f montaz",    "KNR 5-04 1610-02", "Wallbox 22kW 3F montaz+konfiguracja",     3.50, "szt", "pv_ev", 1.5,
    "stacja ladowania 22kW", "ladowarka 22kW 3F", "EVSE 22kW", "AC charger 22kW")
add("stacja ladowania dc 50kw",  "KNR 5-04 1610-03", "Stacja ladowania DC 50kW montaz",          6.00, "szt", "pv_ev", 1.5,
    "DC fast charger 50kW", "szybka ladowarka DC 50kW", "CHAdeMO CCS 50kW")
add("stacja ladowania dc 150kw", "KNR 5-04 1610-03", "Stacja ladowania DC 150kW montaz",         8.00, "szt", "pv_ev", 1.5,
    "DC fast charger 150kW", "ultraszybka ladowarka DC", "HPC 150kW")
add("kabel zasilajacy ev 5x6mm2","KNR 5-04 1611-01", "Kabel zasilajacy EVSE 5x6mm2 montaz",     1.80, "100mb","pv_ev", 1.4,
    "kabel do wallbox 5x6", "YKY 5x6 EV", "przewod zasilajacy ladowarka")
add("kabel zasilajacy ev 5x10mm2","KNR 5-04 1611-01","Kabel zasilajacy EVSE 5x10mm2 montaz",    2.00, "100mb","pv_ev", 1.4,
    "kabel do wallbox 5x10", "YKY 5x10 EV")
add("ochronnik przepiec ev",     "KNR 5-04 1611-02", "Ochronnik przepiec AC do EVSE montaz",     0.50, "szt", "pv_ev", 1.3,
    "SPD wallbox", "ochronnik EV AC", "surge protection EV")
add("dynamiczne zarzadzanie moca","KNR 5-04 1611-03","Dynamiczne zarzadzanie moca EVSE konfiguracja",1.50,"kpl","pv_ev",1.4,
    "DLM konfiguracja", "dynamic load management", "smart charging konfiguracja", "load balancing EV")
add("konfiguracja wallbox wifi", "KNR 5-04 1611-04", "Konfiguracja Wallbox WiFi+aplikacja",      1.00, "szt", "pv_ev", 1.3,
    "wallbox app setup", "OCPP konfiguracja", "smart wallbox setup")

# =============================================================================
# 2. POMIARY / PROTOKOLY
# =============================================================================

# Pomiary podstawowe
add("pomiar rezystancji izolacji","KNR 5-04 1001-01","Pomiar rezystancji izolacji obwodu",        0.20, "obwod","pomiary",1.5,
    "megger izolacja", "izolacja pomiar", "proba napiecia", "1kV test izolacji", "pomiar Riso")
add("pomiar izolacji 1 punkt",   "KNR 5-04 1001-01", "Pomiar izolacji 1 punkt pomiarowy",         0.15, "punkt","pomiary",1.5,
    "izolacja 1 punkt", "megger test punkt", "rezystancja izolacji punkt")
add("pomiar petli zwarcia",      "KNR 5-04 1001-02", "Pomiar impedancji petli zwarcia",           0.15, "obwod","pomiary",1.5,
    "petla zwarcia", "impedancja petli", "loop impedance test", "Zs pomiar", "pomiar petli")
add("pomiar petli 1 punkt",      "KNR 5-04 1001-02", "Pomiar petli zwarcia 1 punkt",              0.12, "punkt","pomiary",1.5,
    "petla 1 punkt", "Zs 1 punkt", "loop test punkt")
add("pomiar skutecznosci ochrony rcd","KNR 5-04 1001-04","Pomiar skutecznosci ochrony RCD",       0.15, "szt", "pomiary",1.5,
    "test RCD", "proba RCD", "wybijalnosc RCD", "RCD test 30mA", "test roznicowki")
add("pomiar napiecia i pradu",   "KNR 5-04 1001-05", "Pomiar napiecia i pradu (multimetrem)",     0.10, "punkt","pomiary",1.3,
    "pomiar V A", "voltmetr pomiar", "ampermierz pomiar")
add("pomiar ciaglosci pe",       "KNR 5-04 1001-06", "Pomiar ciaglosci przewodu PE/N",            0.10, "obwod","pomiary",1.4,
    "ciaglosc PE", "PE continuity test", "sprawdzenie PE", "test N PE")
add("pomiar rezystancji uziomow","KNR 5-04 1001-03", "Pomiar rezystancji uziemienia (tera)",      0.25, "punkt","pomiary",1.5,
    "pomiar RE tera", "uziomy test", "ground resistance test", "rezystancja uziomow")
add("pomiar THD harmoniczne",    "KNR 5-04 1001-07", "Pomiar jakosci energii THD harmoniczne",    0.50, "punkt","pomiary",1.4,
    "analizator jakosci energii", "THD miernik", "harmonics measurement", "power quality")
add("pomiar nat oswietlenia",    "KNR 5-04 1001-08", "Pomiar natezenia oswietlenia luxomierzem",  0.15, "punkt","pomiary",1.3,
    "luxometr pomiar", "miernik Lux", "illuminance measurement", "pomiar lux")
add("pomiar termowizyjny",       "KNR 5-04 1001-09", "Badanie termowizyjne instalacji el.",       0.30, "punkt","pomiary",1.4,
    "termowizja", "kamera termalna", "thermal imaging el.", "badanie IR")

# Protokoly i odbiory
add("protokol odbioru instalacji","KNR 5-04 1002-01","Protokol odbioru instalacji elektrycznej",  2.00, "kpl", "pomiary",1.5,
    "protokol odbioru", "odbiory elektryczne", "protokol sprawdzen", "komisja odbioru")
add("protokol pomiarow ochrony",  "KNR 5-04 1002-02","Protokol pomiarow ochrony (kompleksowy)",   3.00, "kpl", "pomiary",1.5,
    "protokol z pomiarow", "pomiary ochronne protokol", "dokumentacja pomiarowa")
add("protokol 5 letni",          "KNR 5-04 1002-03", "Przeglad 5-letni instalacji elektrycznej", 4.00, "kpl", "pomiary",1.5,
    "przeglad piecioletni", "5-letni przeglad", "rewizja 5 lat", "przeglad art.62 el.")
add("protokol przegladu rocznego","KNR 5-04 1002-04","Przeglad roczny instalacji el.",            2.00, "kpl", "pomiary",1.4,
    "przeglad roczny el.", "kontrola roczna el.", "inspekcja roczna el.")
add("inwentaryzacja tablicy",    "KNR 5-04 1002-05", "Inwentaryzacja i opis tablicy (rozdzielnicy)", 2.00,"kpl","pomiary",1.4,
    "inwentaryzacja rozdzielnicy", "opis tablicy", "dokumentacja tablicy", "schemat tablicy as-built")
add("schemat as-built",          "KNR 5-04 1002-06", "Schemat powykonawczy as-built instalacji",  3.00, "kpl", "pomiary",1.4,
    "as-built schemat", "dokumentacja powykonawcza", "rysunki powykonawcze", "projekt powykonawczy")
add("sprawdzenie instalacji PV protokol","KNR 5-04 1002-07","Sprawdzenie odbiorcze instalacji PV",2.00,"kpl","pomiary",1.5,
    "odbior PV", "protokol PV", "IEC 62446 test PV", "odbiory fotowoltaika")
add("sprawdzenie ev protokol",   "KNR 5-04 1002-08", "Sprawdzenie instalacji EV (protokol)",      1.00, "kpl", "pomiary",1.4,
    "protokol wallbox", "odbior EV charger", "protokol ladowarki")

# Pomiary rozliczane za punkt (dla kreatora)
add("pomiar izolacji 1 obwod",   "KNR 5-04 1001-01", "Pomiar izolacji 1 obwod 230V",              0.20, "obwod","pomiary",1.5,
    "obwod megger", "pomiar Riso obwod", "insulation test circuit")
add("pomiar rcd 1 wyroznik",     "KNR 5-04 1001-04", "Pomiar RCD 1 wyroznik (wybijalnosc)",       0.15, "szt", "pomiary",1.5,
    "test 1 RCD", "RCD 30mA test 1szt", "1 roznicowka test")

# =============================================================================
# 3. PLAC BUDOWY / TYMCZASOWE ZASILANIE
# =============================================================================

add("montaz rb tki budowlanej",  "KNR 5-04 1201-01","RB-tka budowlana montaz komplet",           4.00, "szt", "rozdzielnice",1.4,
    "RB-tka", "erbetka budowlana", "rozdzielnica budowlana", "tablica budowlana", "prowizoryczna rozdzielnica")
add("rb tka mala 63a",           "KNR 5-04 1201-02","RB-tka mala 63A montaz",                    3.00, "szt", "rozdzielnice",1.3,
    "RB-tka 63A", "mala erbetka 63A", "tabliczka budowlana 63A")
add("rb tka duza 125a",          "KNR 5-04 1201-03","RB-tka duza 125A montaz",                   5.00, "szt", "rozdzielnice",1.4,
    "RB-tka 125A", "duza erbetka 125A", "rozdzielnica budowlana 125A")
add("rb tka z agregatem",        "KNR 5-04 1201-04","RB-tka z podlaczeniem agregatu montaz",      6.00, "szt", "rozdzielnice",1.4,
    "erbetka z agregatem", "RB-tka agregat", "tymczasowe zasilanie agregat")
add("tymczasowe oswietlenie budowy","KNR 5-04 1202-01","Tymczasowe oswietlenie placu budowy montaz",2.00,"100mb","prowadzenie",1.3,
    "swiatla budowlane", "linia oswietleniowa prowizorka", "oswietlenie placu budowy")
add("linia tymczasowa 3x2 5",   "KNR 5-04 1202-02", "Linia tymczasowa 3x2.5mm2 (prowizorka)",    1.50, "100mb","prowadzenie",1.3,
    "prowizorka 3x2.5", "linia prowizoryczna", "tymczasowy kabel 3x2.5", "przewod prowizoryczny")
add("linia tymczasowa 5x10",     "KNR 5-04 1202-03", "Linia tymczasowa 5x10mm2 (zasilanie dz.)", 2.00, "100mb","prowadzenie",1.4,
    "prowizorka 5x10", "tymczasowe zasilanie 5x10", "kabel budowlany 5x10")
add("zlacze tymczasowe licznikowe","KNR 5-04 1203-01","Zlacze tymczasowe licznikowe montaz",      3.00, "szt", "rozdzielnice",1.4,
    "ZK tymczasowe", "licznik budowlany", "tymczasowe zlacze kablowe", "prowizorka licznik")
add("zasilanie borowek budowlanych","KNR 5-04 1202-04","Zasilanie borowek budowlanych montaz",    2.00, "kpl", "prowadzenie",1.3,
    "zasilanie kranow", "zasilanie dzwignic", "kran zasilanie el.", "borowka przelacznik")
add("linia do bialych miasteczek","KNR 5-04 1202-05","Linia zasilajaca biale miasteczka (kontenery)",2.50,"100mb","prowadzenie",1.3,
    "zasilanie kontenerow biurowych", "zaplecze budowy zasilanie", "socjalne kontenery zasilanie")
add("demontaz prowizorki",       "KNR 5-04 1204-01", "Demontaz instalacji tymczasowej (prowizorki)",1.00,"kpl","prowadzenie",1.2,
    "rozbiora prowizorki", "demontaz budowlanej instalacji", "likwidacja erbetki")

# =============================================================================
# 4. ATEX / STREFA EX (WYBUCHOSZCZELNE)
# =============================================================================

add("oprawa ex strefa 1",        "KNR 5-04 1401-01","Oprawa Ex strefa 1 montaz",                 1.50, "szt", "oswietlenie",1.5,
    "oswietlenie Ex", "oprawa wybuchoszczelna", "Ex Zone 1 lighting", "lamp Ex II 2G", "oprawa ATEX")
add("oprawa ex strefa 2",        "KNR 5-04 1401-02","Oprawa Ex strefa 2 montaz",                 1.20, "szt", "oswietlenie",1.4,
    "oprawa Ex zone 2", "lamp ATEX zone 2", "oswietlenie strefa 2 Ex")
add("oprawa ex strefa 21 pyl",   "KNR 5-04 1401-03","Oprawa Ex strefa 21 (pyl) montaz",          1.50, "szt", "oswietlenie",1.5,
    "Ex zone 21 dust", "strefa 21 ATEX", "Ex pyl zone 21")
add("gniazdo ex 230v",           "KNR 5-04 1402-01","Gniazdo Ex 230V montaz",                    0.80, "szt", "gniazda_wylaczniki",1.5,
    "gniazdo wybuchoszczelne", "gniazdo ATEX 230V", "socket Ex ATEX", "gniazdo Ex strefa 1")
add("gniazdo ex 400v 16a cee",   "KNR 5-04 1402-02","Gniazdo CEE 16A Ex montaz",                 1.20, "szt", "gniazda_wylaczniki",1.5,
    "CEE Ex 16A", "gniazdo przemyslowe Ex", "industrial socket Ex ATEX")
add("wylacznik ex",              "KNR 5-04 1402-03","Wylacznik Ex montaz",                       0.80, "szt", "gniazda_wylaczniki",1.5,
    "wylacznik wybuchoszczelny", "switch Ex ATEX", "klawisz Ex zona")
add("dlawnica ex m20",           "KNR 5-04 1403-01","Dlawnica kablowa Ex M20 montaz",            0.30, "szt", "rury_trasy",1.5,
    "dlawnica Ex", "dławica ATEX M20", "cable gland Ex M20", "dlawnica wybuchoszczelna")
add("dlawnica ex m25",           "KNR 5-04 1403-01","Dlawnica kablowa Ex M25 montaz",            0.35, "szt", "rury_trasy",1.5,
    "dlawnica Ex M25", "cable gland Ex M25", "dławica ATEX M25")
add("dlawnica ex m32",           "KNR 5-04 1403-01","Dlawnica kablowa Ex M32 montaz",            0.40, "szt", "rury_trasy",1.5,
    "dlawnica Ex M32", "cable gland Ex M32")
add("przepust przeciwwybuchowy", "KNR 5-04 1403-02","Przepust przeciwwybuchowy EX montaz",       0.60, "szt", "rury_trasy",1.5,
    "przepust Ex", "blast proof penetration", "przepust kablowy ATEX", "seal Ex Roxtec")
add("oprawa Ex przenasna",       "KNR 5-04 1401-04","Oprawa Ex przenosna z kluczem montaz",      1.00, "szt", "oswietlenie",1.3,
    "portable Ex lamp", "latarka Ex", "lampa przenasna Ex")
add("kabel ex w przepuście",     "KNR 5-04 1403-03","Kabel w przepuście Ex (uszczelnianie)",     0.40, "szt", "rury_trasy",1.4,
    "uszczelnianie przepustu Ex", "sealing cable Ex", "Roxtec EX uszczelnienie")
add("skrzynka rozdzielcza ex",   "KNR 5-04 1404-01","Skrzynka rozdzielcza Ex montaz",            3.00, "szt", "rozdzielnice",1.5,
    "skrzynka Ex", "rozdzielnia wybuchoszczelna", "junction box Ex ATEX", "szafka ATEX")
add("kontroler atmosfery ex",    "KNR 5-04 1404-02","Kontroler atmosfery Ex montaz+konfiguracja",2.00,"szt", "bezpieczenstwo",1.4,
    "detektor gazu Ex strefa", "czujka ATEX gaz", "gas monitor Ex zone")

# =============================================================================
# 5. HVAC SUPPORT — Pompy ciepla, klimatyzacja, rekuperatory
# =============================================================================

# Pompy ciepla
add("podlaczenie pompy ciepla 3f","KNR 5-04 1501-01","Podlaczenie pompy ciepla trojfazowej",     3.00, "szt", "aparatura",1.5,
    "zasilanie pompy ciepla 3F", "PC elektryczne podlaczenie 3F", "heat pump 3-phase connection")
add("podlaczenie pompy ciepla 1f","KNR 5-04 1501-02","Podlaczenie pompy ciepla jednofazowej",    2.00, "szt", "aparatura",1.4,
    "zasilanie PC 1F", "pompa ciepla 1F podlaczenie", "heat pump 1-phase connection")
add("sterownik pompy ciepla",    "KNR 5-04 1501-03","Sterownik pompy ciepla montaz+konfiguracja",2.00,"szt","aparatura",1.4,
    "regulator PC", "control unit heat pump", "PC sterownik montaz", "sterownik HP")
add("kabel pompy ciepla 5x6",    "KNR 5-04 1501-04","Kabel zasilajacy PC 5x6mm2 montaz",        1.80, "100mb","aparatura",1.3,
    "kabel do pompy ciepla 5x6", "YKY 5x6 PC", "heat pump cable 5x6")
add("kabel pompy ciepla 5x10",   "KNR 5-04 1501-04","Kabel zasilajacy PC 5x10mm2 montaz",       2.00, "100mb","aparatura",1.3,
    "kabel do pompy ciepla 5x10", "YKY 5x10 HP")
add("ochrona pc rcbo",           "KNR 5-04 1501-05","RCBO dla pompy ciepla montaz",              0.50, "szt", "aparatura",1.4,
    "wymagana ochrona PC", "RCBO pompa ciepla", "zabezpieczenie PC rcbo")
add("klimatyzacja zasilanie 1f", "KNR 5-04 1502-01","Zasilanie klimatyzatora 1F montaz",         1.50, "szt", "aparatura",1.3,
    "klimatyzacja elektryczna 1F", "AC unit power 1F", "klima zasilanie jednofazowe")
add("klimatyzacja zasilanie 3f", "KNR 5-04 1502-01","Zasilanie klimatyzatora 3F montaz",         2.00, "szt", "aparatura",1.4,
    "klimatyzacja elektryczna 3F", "AC unit power 3F", "klima zasilanie trojfazowe")
add("klimatyzacja kaseta sufitowa zasilanie","KNR 5-04 1502-02","Kaseta sufitowa klimatyzacji zasilanie",1.50,"szt","aparatura",1.3,
    "kasetonowa klima zasilanie", "cassette AC power", "kaseton klimatyzacji")
add("nasos skroplin",            "KNR 5-04 1502-03","Nasosek skroplin klimatyzacji montaz",      0.30, "szt", "aparatura",1.3,
    "pompa skroplin klima", "condensate pump AC", "pompa kondensatu", "mini pompa skroplin")
add("rekuperator zasilanie",     "KNR 5-04 1503-01","Rekuperator HRV zasilanie+podlaczenie",     1.50, "szt", "aparatura",1.4,
    "HRV zasilanie", "ERV elektryczne", "wentylacja z odzyskiem ciepla zasilanie", "rekuperacja el.")
add("sterownik rekuperatora",    "KNR 5-04 1503-02","Sterownik rekuperatora montaz+konfiguracja",1.00,"szt","aparatura",1.3,
    "panel rekuperator", "kontroler HRV", "regulator wentylacji el.")
add("nagrzewnica kanalowa el",   "KNR 5-04 1503-03","Nagrzewnica kanalowa el. podlaczenie",      1.00, "szt", "aparatura",1.3,
    "nagrzewnica el. kanal", "duct heater electric", "grzejnik kanalowy el.")
add("falownik wentylator hvac",  "KNR 5-04 1503-04","Falownik do wentylatora HVAC montaz",       2.00, "szt", "aparatura",1.4,
    "VFD wentylator", "inverter HVAC fan", "falownik silnik wentylacyjny", "przemiennik czestotliwosci HVAC")
add("zawor regulacyjny hvac el", "KNR 5-04 1503-05","Zawor regulacyjny HVAC elektryczny montaz", 0.60, "szt", "aparatura",1.2,
    "zawor el. hvac", "electric valve HVAC", "zawor sterowany el.")
add("czujnik temperatury kanal", "KNR 5-04 1503-06","Czujnik temperatury kanalowy montaz",       0.30, "szt", "aparatura",1.2,
    "temp sensor duct", "czujnik T kanalu", "kanal czujnik temperatury")
add("czujnik co2 kanal",         "KNR 5-04 1503-07","Czujnik CO2 kanalowy montaz",               0.50, "szt", "aparatura",1.3,
    "CO2 sensor duct", "czujnik CO2 kanalu HVAC", "CO2 duct mounted")
add("szafarnia hvac",            "KNR 5-04 1504-01","Szafarnia sterownicza HVAC montaz",          8.00, "kpl", "rozdzielnice",1.3,
    "szafa HVAC", "sterownia HVAC", "szafa automatyki HVAC", "MCC HVAC")
add("uruchomienie systemu hvac", "KNR 5-04 1504-02","Uruchomienie i regulacja systemu HVAC",     4.00, "kpl", "aparatura",1.3,
    "commissioning HVAC", "rozruch HVAC", "uruchomienie wentylacji el.")

# =============================================================================
# SQL GENERATION
# =============================================================================

def build_sql(r_list):
    header = """-- ============================================================
-- ES-Engine Dictionary Seed v8.0 — "Finalny Rywal" Generator
-- AUTO-GENERATED by scripts/generate-seed-v8.py
-- 1. PV/FOTOWOLTAIKA + EV/WALLBOX (boom rynkowy PL 2026)
-- 2. POMIARY / PROTOKOLY (odbiory, 5-letnie, as-built)
-- 3. PLAC BUDOWY / TYMCZASOWE ZASILANIE (RB-tki, prowizorka)
-- 4. ATEX / STREFA EX (wybuchoszczelne, Ex zone 1/2/21)
-- 5. HVAC SUPPORT (pompy ciepla, klimatyzacja, rekuperatory)
-- RBH norms: KNR 5-04/5-08, rynek PL 2026
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
