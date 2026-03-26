#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ES-Engine Dictionary Seed v10.0 — Finalny Audyt Bazy
=====================================================
3 Clusters (500+ entries):
  1. RTV/SAT — anteny DVB-T2, multiswitch, LNB, wzmacniacze, telewizja kablowa
  2. OSWIETLENIE ZEWNETRZNE — uliczne/parkowe/elewacyjne, iluminacja, ogrodowe
  3. KOMPENSACJA MOCY — kondensatory, baterie kondensatorow, liczniki, pomiary cos fi

All synonyms as separate rows (Phase 1 exact match).
RBH norms: KNR 5-04/AT-26/ZRUG, rynek PL 2026.
Output: supabase/migrations/20260310_seed_es_dictionary_v10.sql
"""

import os, re

OUTPUT = os.path.join(
    os.path.dirname(__file__), "..", "supabase", "migrations",
    "20260310_seed_es_dictionary_v10.sql"
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
    r = re.sub(r'\b(mb|szt|kpl|m2|m3|rbh|zl|100mb|h|punkt|port|para|kw|kwp|wp|strefa|obwod|db|ghz|mhz)\b', '', r).strip()
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
# 1. RTV / SAT — Systemy antenowe
# =============================================================================

# --- Anteny DVB-T2 naziemna ---
add("antena dvb-t2 dachowa",      "KNR 5-09 0901-01","Antena DVB-T2 dachowa montaz",              1.00,"szt","it_siec",1.5,
    "antena naziemna DVB-T2", "DVB-T2 antena", "antenna DVB-T2 roof", "antena TV cyfrowa")
add("antena dvb-t2 kierunkowa",   "KNR 5-09 0901-02","Antena DVB-T2 kierunkowa yagi montaz",      1.20,"szt","it_siec",1.5,
    "Yagi DVB-T2", "kierunkowa antena TV", "Yagi antenna DVB-T2", "antena yagi naziemna")
add("antena dvb-t2 wieloelementowa","KNR 5-09 0901-03","Antena DVB-T2 wieloelementowa montaz",    1.50,"szt","it_siec",1.5,
    "wieloelementowa DVB-T2", "log-periodic antenna", "antena logarytmiczna", "LPDA DVB-T2")
add("antena dvb-t2 natynkowa",    "KNR 5-09 0901-04","Antena DVB-T2 wewnetrzna natynkowa",        0.40,"szt","it_siec",1.2,
    "wewnetrzna antena DVB-T2", "indoor antenna DVB-T2", "antena pokojowa DVB-T2")
add("maszt antenowy 3m",          "KNR 5-09 0901-05","Maszt antenowy 3m montaz",                  1.50,"szt","it_siec",1.4,
    "maszt TV 3m", "slup antenowy 3m", "antenna mast 3m")
add("maszt antenowy 6m",          "KNR 5-09 0901-05","Maszt antenowy 6m montaz",                  2.00,"szt","it_siec",1.4,
    "maszt TV 6m", "slup antenowy 6m", "antenna mast 6m")
add("maszt antenowy 10m",         "KNR 5-09 0901-06","Maszt antenowy 10m montaz",                 3.00,"szt","it_siec",1.4,
    "maszt TV 10m", "antenna mast 10m", "maszt wysoki 10m")
add("uchwyt scienny masztu",      "KNR 5-09 0901-07","Uchwyt scienny masztu antenowego montaz",   0.40,"szt","it_siec",1.3,
    "bracket masztu", "uchwyt mast antenna", "wall bracket antena")
add("uchwyt dachowy masztu",      "KNR 5-09 0901-07","Uchwyt dachowy masztu montaz",              0.50,"szt","it_siec",1.3,
    "roof bracket maszt", "uchwyt maszt dach")

# --- Anteny SAT ---
add("talerz satelitarny 80cm",    "KNR 5-09 0902-01","Antena SAT 80cm montaz+ustawienie",         1.50,"szt","it_siec",1.5,
    "dish 80cm", "antena paraboliczna 80cm", "SAT dish 80cm", "talerz 80")
add("talerz satelitarny 90cm",    "KNR 5-09 0902-01","Antena SAT 90cm montaz+ustawienie",         1.80,"szt","it_siec",1.5,
    "dish 90cm", "antena SAT 90cm", "talerz 90")
add("talerz satelitarny 100cm",   "KNR 5-09 0902-02","Antena SAT 100cm montaz+ustawienie",        2.00,"szt","it_siec",1.5,
    "dish 100cm", "antena SAT 1m", "talerz 100cm")
add("talerz satelitarny 120cm",   "KNR 5-09 0902-03","Antena SAT 120cm montaz+ustawienie",        2.50,"szt","it_siec",1.5,
    "dish 120cm", "antena paraboliczna 120cm", "duza antena SAT")
add("lnb single",                 "KNR 5-09 0902-04","LNB Single montaz+regulacja",               0.30,"szt","it_siec",1.4,
    "LNB 1 wyjscie", "single LNB", "LNB monoblok")
add("lnb quad",                   "KNR 5-09 0902-04","LNB Quad 4-wyjsciowy montaz",               0.40,"szt","it_siec",1.5,
    "LNB Quad 4wyj", "Quad LNB", "LNB 4 wyjscia")
add("lnb quattro",                "KNR 5-09 0902-04","LNB Quattro do multiswitcha montaz",         0.40,"szt","it_siec",1.5,
    "Quattro LNB", "LNB Quattro multiswitch")
add("lnb octo",                   "KNR 5-09 0902-05","LNB Octo 8-wyjsciowy montaz",               0.50,"szt","it_siec",1.4,
    "LNB 8 wyjsc", "Octo LNB")
add("ustawienie anteny sat",      "KNR 5-09 0902-06","Ustawienie i strojenie anteny SAT",          0.80,"szt","it_siec",1.5,
    "strojenie SAT", "pointing antenna SAT", "ustawianie talerza SAT", "alignment SAT dish")

# --- Multiswitch ---
add("multiswitch 5x4",            "KNR 5-09 0903-01","Multiswitch 5x4 montaz",                    0.60,"szt","it_siec",1.5,
    "multiswitch 4 wyjscia", "MS 5/4", "multiswitch 4-portowy")
add("multiswitch 5x8",            "KNR 5-09 0903-02","Multiswitch 5x8 montaz",                    0.80,"szt","it_siec",1.5,
    "multiswitch 8 wyjsc", "MS 5/8", "multiswitch 8-portowy")
add("multiswitch 5x12",           "KNR 5-09 0903-03","Multiswitch 5x12 montaz",                   1.00,"szt","it_siec",1.5,
    "MS 5/12", "multiswitch 12 portow")
add("multiswitch 5x16",           "KNR 5-09 0903-04","Multiswitch 5x16 montaz",                   1.20,"szt","it_siec",1.5,
    "MS 5/16", "multiswitch 16 portow")
add("multiswitch 5x24",           "KNR 5-09 0903-05","Multiswitch 5x24 montaz",                   1.50,"szt","it_siec",1.4,
    "MS 5/24", "multiswitch 24 portow")
add("multiswitch 5x32",           "KNR 5-09 0903-06","Multiswitch 5x32 montaz",                   2.00,"szt","it_siec",1.4,
    "MS 5/32", "multiswitch 32 portow")
add("multiswitch kaskadowy",      "KNR 5-09 0903-07","Multiswitch kaskadowy montaz",               1.50,"szt","it_siec",1.4,
    "cascading multiswitch", "multiswitch kaskada", "MS kaskada")

# --- Wzmacniacze sygnalu ---
add("wzmacniacz antenowy 1-wyjscie","KNR 5-09 0904-01","Wzmacniacz antenowy 1-wyjsciowy montaz",  0.40,"szt","it_siec",1.4,
    "antena booster 1", "wzmacniacz sygnalu TV 1wyj", "single amplifier antenna")
add("wzmacniacz antenowy 2-wyjscia","KNR 5-09 0904-01","Wzmacniacz antenowy 2-wyjsciowy montaz",  0.50,"szt","it_siec",1.4,
    "antena booster 2", "wzmacniacz 2 wyjscia")
add("wzmacniacz antenowy 4-wyjscia","KNR 5-09 0904-02","Wzmacniacz antenowy 4-wyjsciowy montaz",  0.60,"szt","it_siec",1.4,
    "antena booster 4", "wzmacniacz 4 wyjscia", "4-port booster")
add("wzmacniacz szerokopasmowy",  "KNR 5-09 0904-03","Wzmacniacz szerokopasmowy RTV montaz",      0.60,"szt","it_siec",1.4,
    "broadband amplifier RTV", "wzmacniacz maszt", "antenna amplifier broadband")
add("wzmacniacz kanałowy",        "KNR 5-09 0904-04","Wzmacniacz kanalowy DVB-T2 montaz",         0.80,"szt","it_siec",1.4,
    "kanalowy wzmacniacz", "channel amplifier DVB-T2", "selektywny wzmacniacz")
add("przedwzmacniacz antenowy",   "KNR 5-09 0904-05","Przedwzmacniacz antenowy montaz",            0.40,"szt","it_siec",1.3,
    "pre-amplifier antena", "przedwzmacniacz DVB-T2", "preamplifier antenna")

# --- Rozgalezniki i miksery ---
add("rozgaleznik 2-drogi",        "KNR 5-09 0905-01","Rozgaleznik sygnalu RTV 2-drogi montaz",   0.15,"szt","it_siec",1.3,
    "splitter 2-way RTV", "rozdzielacz 2-drogi", "2-way splitter antenna")
add("rozgaleznik 4-drogi",        "KNR 5-09 0905-01","Rozgaleznik sygnalu RTV 4-drogi montaz",   0.20,"szt","it_siec",1.3,
    "splitter 4-way RTV", "rozdzielacz 4-drogi")
add("rozgaleznik 8-drogi",        "KNR 5-09 0905-02","Rozgaleznik sygnalu RTV 8-drogi montaz",   0.25,"szt","it_siec",1.3,
    "splitter 8-way RTV", "rozdzielacz 8-drogi")
add("sumator dvbt sat",           "KNR 5-09 0905-03","Sumator DVB-T2/SAT montaz",                 0.25,"szt","it_siec",1.4,
    "mixer DVB-T SAT", "sumator antenowy", "diplexer DVB-T SAT", "sumator TV/SAT")
add("sumator uhf vhf",            "KNR 5-09 0905-03","Sumator UHF/VHF montaz",                    0.20,"szt","it_siec",1.3,
    "diplexer UHF VHF", "sumator UHF/VHF")

# --- Kabel i gniazda antenowe ---
add("kabel rg6 koaksjalny",       "KNR 5-09 0906-01","Kabel koaksjalny RG6 montaz",               0.80,"100mb","it_siec",1.4,
    "koaksjal RG6", "RG6 coax cable", "kabel TV RG6", "kabel antenowy RG6")
add("kabel rg11 koaksjalny",      "KNR 5-09 0906-01","Kabel koaksjalny RG11 montaz",              1.00,"100mb","it_siec",1.3,
    "RG11 coax", "kabel SAT RG11", "gruby koaksjal")
add("kabel sat 7mm ekranowany",   "KNR 5-09 0906-02","Kabel SAT 7mm czterokrotnie ekranowany",    1.00,"100mb","it_siec",1.4,
    "kabel SAT 4-shield", "przewod SAT 7mm", "CU4 SAT cable")
add("gniazdo antenowe rtv end",   "KNR 5-09 0906-03","Gniazdo antenowe RTV koncowe montaz",       0.25,"szt","it_siec",1.4,
    "gniazdo TV end", "RTV socket end", "koncowka antenowa")
add("gniazdo antenowe rtv przelot","KNR 5-09 0906-04","Gniazdo antenowe RTV przelotowe montaz",   0.25,"szt","it_siec",1.4,
    "gniazdo TV przelot", "TV outlet przelotowe", "przelotowe gniazdo TV")
add("gniazdo rtv sat",            "KNR 5-09 0906-05","Gniazdo RTV+SAT kombo montaz",              0.30,"szt","it_siec",1.4,
    "gniazdo TV+SAT", "kombo RTV SAT outlet", "dual outlet TV SAT")
add("gniazdo rtv sat lan kombo",  "KNR 5-09 0906-06","Gniazdo RTV+SAT+LAN triple montaz",         0.45,"szt","it_siec",1.4,
    "triple outlet RTV SAT LAN", "gniazdo multimedialne TV SAT LAN")
add("wtyk f-type",                "KNR 5-09 0906-07","Zarobienie wtyku F-type montaz",             0.10,"szt","it_siec",1.4,
    "F-connector", "wtyk SAT F", "konfekcja F-type", "crimping F-type")
add("wtyk rg6 bncf",              "KNR 5-09 0906-07","Zarobienie wtyku BNC/F RG6 montaz",          0.10,"szt","it_siec",1.3,
    "BNC connector RG6", "wtyk BNC", "konfekcja BNC")

# --- TV kablowa / IPTV ---
add("punkt tv kablowa",           "KNR 5-09 0907-01","Punkt TV kablowej montaz",                  0.60,"szt","it_siec",1.3,
    "cable TV outlet", "gniazdo TV kablowej", "punkt CATV", "CATV point")
add("splitter docmesis",          "KNR 5-09 0907-02","Rozgaleznik CATV 2-drogi montaz",           0.20,"szt","it_siec",1.2,
    "CATV splitter 2-way", "docmesis splitter", "kabel TV splitter 2")
add("wzmacniacz catv",            "KNR 5-09 0907-03","Wzmacniacz CATV montaz",                    0.60,"szt","it_siec",1.3,
    "cable TV amplifier", "wzmacniacz telewizji kablowej", "CATV booster")
add("filtr lte 4g antenowy",      "KNR 5-09 0907-04","Filtr LTE/4G do anteny TV montaz",          0.25,"szt","it_siec",1.4,
    "LTE filter antenna", "4G filter TV", "filtr 4G RTV", "filtr LTE TV")
add("filtr 5g antenowy",          "KNR 5-09 0907-04","Filtr 5G do anteny TV montaz",              0.25,"szt","it_siec",1.4,
    "5G filter antenna", "filtr 5G RTV")

# --- Pomiar i odbiory RTV ---
add("pomiar poziomu sygnalu rtv", "KNR 5-09 0908-01","Pomiar poziomu sygnalu RTV (miernikiem)",   0.20,"punkt","it_siec",1.4,
    "poziom sygnalu TV miernik", "signal level measurement RTV", "miernik antenowy TV")
add("protokol instalacji rtv",    "KNR 5-09 0908-02","Protokol instalacji antenowej RTV",          1.00,"kpl","it_siec",1.3,
    "protokol antena RTV", "odbiory anteny", "dokument antena RTV")


# =============================================================================
# 2. OŚWIETLENIE ZEWNĘTRZNE
# =============================================================================

# --- Słupy oświetleniowe ---
add("slup oswietleniowy stalowy 4m","KNR 5-04 1801-01","Slup oswietleniowy stalowy 4m posadowienie",2.50,"szt","oswietlenie",1.4,
    "latarnia 4m", "slup 4m stalowy", "steel pole 4m lighting")
add("slup oswietleniowy stalowy 6m","KNR 5-04 1801-01","Slup oswietleniowy stalowy 6m posadowienie",3.00,"szt","oswietlenie",1.5,
    "latarnia 6m", "slup 6m stalowy", "pole 6m lighting", "slup latarni 6m")
add("slup oswietleniowy stalowy 8m","KNR 5-04 1801-02","Slup oswietleniowy stalowy 8m posadowienie",3.50,"szt","oswietlenie",1.5,
    "latarnia 8m", "slup 8m", "pole 8m lighting")
add("slup oswietleniowy stalowy 10m","KNR 5-04 1801-02","Slup oswietleniowy stalowy 10m posadowienie",4.00,"szt","oswietlenie",1.5,
    "latarnia 10m", "slup 10m", "pole 10m")
add("slup aluminiowy 4m",         "KNR 5-04 1801-03","Slup aluminiowy 4m posadowienie",           2.20,"szt","oswietlenie",1.4,
    "aluminium pole 4m", "slup Al 4m")
add("slup aluminiowy 6m",         "KNR 5-04 1801-03","Slup aluminiowy 6m posadowienie",           2.80,"szt","oswietlenie",1.4,
    "aluminium pole 6m", "slup Al 6m")
add("fundament slupa betonowy",   "KNR 5-04 1801-04","Fundament betonowy slupa montaz",           1.00,"szt","oswietlenie",1.4,
    "betonowanie fundamentu latarni", "foundation pole concrete", "fundament latarni")
add("slup betonowy wirowany 8m",  "KNR 5-04 1801-05","Slup betonowy wirowany 8m posadowienie",    4.00,"szt","oswietlenie",1.5,
    "slup betonowy 8m", "wirowany slup 8m", "concrete pole 8m")
add("ramie dwupunktowe",          "KNR 5-04 1801-06","Ramie oswietleniowe dwupunktowe montaz",    0.60,"szt","oswietlenie",1.3,
    "ramie 2-punky", "double arm pole", "wysiegnik dwupunktowy")
add("wysiegnik 1 5m",             "KNR 5-04 1801-07","Wysiegnik 1.5m montaz na slupie",           0.30,"szt","oswietlenie",1.3,
    "wysiegnik 1.5m", "arm 1.5m pole", "ramie slupa 1.5m")

# --- Oprawy uliczne i parkowe ---
add("oprawa uliczna led 50w",     "KNR 5-04 1802-01","Oprawa uliczna LED 50W montaz",             0.80,"szt","oswietlenie",1.5,
    "latarnia LED 50W", "LED road light 50W", "street LED 50W")
add("oprawa uliczna led 80w",     "KNR 5-04 1802-01","Oprawa uliczna LED 80W montaz",             0.90,"szt","oswietlenie",1.5,
    "latarnia LED 80W", "LED road light 80W", "street LED 80W")
add("oprawa uliczna led 100w",    "KNR 5-04 1802-01","Oprawa uliczna LED 100W montaz",            1.00,"szt","oswietlenie",1.5,
    "latarnia LED 100W", "street LED 100W")
add("oprawa uliczna led 150w",    "KNR 5-04 1802-02","Oprawa uliczna LED 150W montaz",            1.20,"szt","oswietlenie",1.5,
    "latarnia LED 150W", "street LED 150W")
add("oprawa uliczna led 200w",    "KNR 5-04 1802-02","Oprawa uliczna LED 200W montaz",            1.40,"szt","oswietlenie",1.5,
    "latarnia LED 200W", "street LED 200W")
add("oprawa parkowa led 30w",     "KNR 5-04 1802-03","Oprawa parkowa LED 30W montaz",             0.70,"szt","oswietlenie",1.4,
    "latarnia parkowa 30W", "park light 30W LED", "LED park lamp 30W")
add("oprawa parkowa led 50w",     "KNR 5-04 1802-03","Oprawa parkowa LED 50W montaz",             0.80,"szt","oswietlenie",1.4,
    "latarnia parkowa 50W", "park light 50W LED")
add("oprawa ozdobna parkowa",     "KNR 5-04 1802-04","Oprawa ozdobna parkowa LED montaz",         1.00,"szt","oswietlenie",1.3,
    "dekoracyjna parkowa", "heritage lamp LED", "ozdobna latarnia park")
add("reflektor zewnetrzny led 50w","KNR 5-04 1802-05","Reflektor zewnetrzny LED 50W montaz",      0.60,"szt","oswietlenie",1.4,
    "floodlight LED 50W", "reflektor zewn 50W LED", "naswietlacz 50W LED")
add("reflektor zewnetrzny led 100w","KNR 5-04 1802-05","Reflektor zewnetrzny LED 100W montaz",    0.70,"szt","oswietlenie",1.4,
    "floodlight LED 100W", "reflektor zewn 100W", "naswietlacz 100W")
add("reflektor zewnetrzny led 200w","KNR 5-04 1802-06","Reflektor zewnetrzny LED 200W montaz",    0.90,"szt","oswietlenie",1.4,
    "floodlight LED 200W", "naswietlacz 200W LED")
add("kula ogrodowa led",          "KNR 5-04 1802-07","Kula ogrodowa LED montaz",                  0.60,"szt","oswietlenie",1.2,
    "ball light LED garden", "kula swietlna LED", "garden ball light")

# --- Oświetlenie elewacyjne ---
add("oprawa elewacyjna led wall",  "KNR 5-04 1803-01","Oprawa elewacyjna LED wall washer montaz", 0.60,"szt","oswietlenie",1.3,
    "wall washer LED", "elewacyjna LED", "facade light LED", "oprawy elewacji LED")
add("spot naziemny led",          "KNR 5-04 1803-02","Spot naziemny LED montaz",                  0.70,"szt","oswietlenie",1.3,
    "inground LED", "naziemny LED spot", "podswietlenie drzew LED", "uplighter LED")
add("oprawa glebinowa led",       "KNR 5-04 1803-02","Oprawa glebinowa LED montaz",               0.80,"szt","oswietlenie",1.3,
    "recessed ground LED", "LED glebinowy spot", "glebinowy LED")
add("listwa led zewnetrzna ip65", "KNR 5-04 1803-03","Listwa LED zewnetrzna IP65 montaz",         0.25,"mb","oswietlenie",1.3,
    "LED strip outdoor IP65", "tasma LED zewn IP65", "listwa swietlna zewn")
add("neon led zewnetrzny",        "KNR 5-04 1803-04","Neon LED zewnetrzny montaz",                0.35,"mb","oswietlenie",1.2,
    "LED neon flex", "neon LED", "neon zewn", "flex LED neon")
add("oswietlenie schodow zewn",   "KNR 5-04 1803-05","Oswietlenie schodow zewnetrznych montaz",   0.50,"szt","oswietlenie",1.3,
    "step light LED", "oswietlenie stopni zewn", "schody LED zewn")
add("kinkiet zewnetrzny ip44",    "KNR 5-04 1803-06","Kinkiet zewnetrzny IP44 montaz",             0.50,"szt","oswietlenie",1.4,
    "wall light IP44", "kinkiet zewnetrzny", "outdoor wall lamp IP44", "zewn kinkiet IP44")
add("kinkiet zewnetrzny ip65",    "KNR 5-04 1803-07","Kinkiet zewnetrzny IP65 montaz",             0.55,"szt","oswietlenie",1.4,
    "wall light IP65", "kinkiet IP65 zewnetrzny", "outdoor kinkiet IP65")

# --- Systemy sterowania oświetleniem zewnętrznym ---
add("fotokomórka uliczna",        "KNR 5-04 1804-01","Fotokomórka uliczna montaz",                0.30,"szt","oswietlenie",1.4,
    "photocell street", "fotokomórka latarnia", "twilight sensor outdoor", "zapalacz fotokomórka")
add("zegar astronomiczny sterownik","KNR 5-04 1804-02","Zegar astronomiczny sterownik oswietlenia",0.50,"szt","oswietlenie",1.4,
    "astronomical timer outdoor", "zegar astronomiczny latarnie", "sterownik zegar latarnia")
add("sterownik smart lighting gps","KNR 5-04 1804-03","Sterownik smart lighting GPS montaz",       1.50,"szt","oswietlenie",1.4,
    "smart outdoor lighting controller", "GPS lighting timer", "sterownik GPS latarnia")
add("licznik energii slupa",      "KNR 5-04 1804-04","Licznik energii w slupie montaz",            0.60,"szt","oswietlenie",1.3,
    "energy meter pole", "licznik latarnia", "smart meter slup")

# --- Infrastruktura zewnętrzna ---
add("kabel ykay 4x16 zewn",       "KNR 5-04 1805-01","Kabel YKAYy 4x16mm2 zewnetrzny montaz",    2.50,"100mb","kable_silnopradowe",1.4,
    "YKAYy 4x16 kabel uliczny", "kabel linia oswietleniowa 4x16", "outdoor cable 4x16")
add("kabel ykay 4x25 zewn",       "KNR 5-04 1805-01","Kabel YKAYy 4x25mm2 zewnetrzny montaz",    2.80,"100mb","kable_silnopradowe",1.4,
    "YKAYy 4x25 uliczny", "kabel oswietlenie zewn 4x25")
add("szafka oswietlenia ulicznego","KNR 5-04 1806-01","Szafka sterownicza oswietlenia ulicznego",  4.00,"szt","rozdzielnice",1.4,
    "szafa uliczna SO", "SO szafka", "sterownia oswietlenia zewn", "szafarnia latarni")
add("uziemienie slupa",           "KNR 5-04 1806-02","Uziemienie slupa oswietleniowego montaz",    0.50,"szt","uziemienie",1.4,
    "PE slup latarni", "earthing pole", "uziemienie latarni")
add("wysoka skrzynka slupowa",    "KNR 5-04 1806-03","Skrzynka slupowa montaz",                   0.60,"szt","rozdzielnice",1.3,
    "slupowa skrzynka", "pole junction box", "skrzynka na slupie")


# =============================================================================
# 3. KOMPENSACJA MOCY
# =============================================================================

# --- Baterie kondensatorów automatyczne ---
add("bateria kondensatorow 10kvar","KNR 5-08 0901-01","Bateria kondensatorow 10kvar montaz",       3.00,"szt","aparatura",1.5,
    "kondensatory 10kvar", "PFC 10kvar", "power factor correction 10kvar", "bateria 10kVAr")
add("bateria kondensatorow 20kvar","KNR 5-08 0901-01","Bateria kondensatorow 20kvar montaz",       4.00,"szt","aparatura",1.5,
    "kondensatory 20kvar", "PFC 20kvar", "bateria 20kVAr")
add("bateria kondensatorow 30kvar","KNR 5-08 0901-02","Bateria kondensatorow 30kvar montaz",       5.00,"szt","aparatura",1.5,
    "kondensatory 30kvar", "PFC 30kvar", "bateria 30kVAr")
add("bateria kondensatorow 50kvar","KNR 5-08 0901-02","Bateria kondensatorow 50kvar montaz",       6.00,"szt","aparatura",1.5,
    "kondensatory 50kvar", "PFC 50kvar", "bateria 50kVAr")
add("bateria kondensatorow 100kvar","KNR 5-08 0901-03","Bateria kondensatorow 100kvar montaz",     8.00,"szt","aparatura",1.5,
    "kondensatory 100kvar", "PFC 100kvar", "bateria 100kVAr")
add("bateria kondensatorow 150kvar","KNR 5-08 0901-04","Bateria kondensatorow 150kvar montaz",    10.00,"szt","aparatura",1.5,
    "kondensatory 150kvar", "PFC 150kvar")
add("bateria kondensatorow 200kvar","KNR 5-08 0901-04","Bateria kondensatorow 200kvar montaz",    12.00,"szt","aparatura",1.5,
    "kondensatory 200kvar", "PFC 200kvar")
add("bateria kondensatorow 300kvar","KNR 5-08 0901-05","Bateria kondensatorow 300kvar montaz",    16.00,"szt","aparatura",1.5,
    "kondensatory 300kvar", "PFC 300kvar", "duza bateria kondensatorow")

# --- Szafy kompensacji (gotowe zestawy) ---
add("szafa kompensacji 3f automatyczna","KNR 5-08 0902-01","Szafa kompensacji 3F automatyczna montaz",6.00,"szt","rozdzielnice",1.5,
    "szafa PFC 3F", "szafa kondensatorow automatyczna", "power factor cabinet 3F", "szafarnia kompensacji")
add("szafa kompensacji 1f",       "KNR 5-08 0902-02","Szafa kompensacji 1F montaz",               3.00,"szt","rozdzielnice",1.4,
    "szafa PFC 1F", "szafa kondensatorow 1F")
add("szafa kompensacji z filtrem","KNR 5-08 0902-03","Szafa kompensacji z filtrem harmonicznych",  8.00,"szt","rozdzielnice",1.5,
    "PFC + filtr harmoniczny", "szafa kondensatorow z filtrem", "power factor cabinet with filter")
add("szafa kompensacji detuned",  "KNR 5-08 0902-04","Szafa kompensacji detuned (z dławikami)",    8.00,"szt","rozdzielnice",1.5,
    "detuned PFC", "szafa PFC detuned", "kondensatory z dlawikami", "detuned capacitor bank")

# --- Elementy kompensacji ---
add("kondensator 1-fazowy 5kvar", "KNR 5-08 0903-01","Kondensator 1F 5kvar montaz",               0.80,"szt","aparatura",1.4,
    "capacitor 1F 5kvar", "kondensator 5kVAr", "power cap 5kvar")
add("kondensator 3-fazowy 5kvar", "KNR 5-08 0903-01","Kondensator 3F 5kvar montaz",               0.90,"szt","aparatura",1.4,
    "capacitor 3F 5kvar", "kondensator trojfazowy 5kvar")
add("kondensator 3-fazowy 10kvar","KNR 5-08 0903-02","Kondensator 3F 10kvar montaz",              1.00,"szt","aparatura",1.4,
    "capacitor 3F 10kvar", "kondensator 10kVAr 3F")
add("kondensator 3-fazowy 15kvar","KNR 5-08 0903-02","Kondensator 3F 15kvar montaz",              1.20,"szt","aparatura",1.4,
    "capacitor 3F 15kvar", "kondensator 15kVAr")
add("dlawik kompensacyjny",       "KNR 5-08 0903-03","Dlawik kompensacyjny (detuning reactor) montaz",1.00,"szt","aparatura",1.4,
    "detuning reactor", "dlawik PFC", "reactor kompensacja", "induktor detuning")
add("regulator cos fi",           "KNR 5-08 0903-04","Regulator cos fi (kontroler PFC) montaz",   1.50,"szt","aparatura",1.5,
    "power factor controller", "kontroler PFC", "regulator wspólczynnika mocy", "cos fi regulator")
add("przekaznik tyrystorowy pfc", "KNR 5-08 0903-05","Przekaznik tyrystorowy do PFC montaz",       0.80,"szt","aparatura",1.4,
    "thyristor switch PFC", "TSS tyrystor PFC", "static switch PFC")
add("bezpiecznik topikowy pfc",   "KNR 5-08 0903-06","Bezpiecznik topikowy NH do baterii kondensatorow",0.30,"szt","aparatura",1.3,
    "bezpiecznik NH PFC", "fuse PFC NH", "bezpiecznik bateria kondensatorow")
add("odlacznik zwarciowy pfc",    "KNR 5-08 0903-07","Odlacznik zwarciowy baterii kondensatorow", 0.60,"szt","aparatura",1.4,
    "contactor PFC", "wylacznik bateria kondensatorow", "capacitor switch contactors")

# --- Pomiary i analiza kompensacji ---
add("pomiar cos fi",              "KNR 5-08 0904-01","Pomiar wspólczynnika mocy cos fi",           0.50,"pomiar","pomiary",1.5,
    "cos phi measurement", "pomiar tg fi", "power factor measurement", "pomiar wspolczynnik mocy")
add("analiza jakosci energii",    "KNR 5-08 0904-02","Analiza jakosci energii elektrycznej",       2.00,"kpl","pomiary",1.5,
    "power quality analysis", "analiza harmonicznych", "THD analiza", "EN 50160 analiza")
add("dobor baterii kondensatorow","KNR 5-08 0904-03","Dobor i obliczenia baterii kondensatorow",   1.50,"kpl","pomiary",1.4,
    "PFC sizing", "obliczenia kvar", "dobor mocy kompensacyjnej", "kvar calculation")
add("uruchomienie pfc",           "KNR 5-08 0904-04","Uruchomienie i regulacja systemu PFC",       2.00,"kpl","aparatura",1.5,
    "commissioning PFC", "rozruch kompensacji", "uruchomienie kompensacji mocy", "PFC startup")
add("pomiar reaktywny energia",   "KNR 5-08 0904-05","Pomiar energii reaktywnej (licznikiem)",     0.30,"pomiar","pomiary",1.4,
    "energia reaktywna pomiar", "reactive energy measurement", "pomiar kvarh", "kVARh pomiar")

# --- Filtry harmonicznych ---
add("filtr pasywny harmonicznych","KNR 5-08 0905-01","Filtr pasywny harmonicznych montaz",         6.00,"szt","aparatura",1.4,
    "passive harmonic filter", "filtr harmoniczny pasywny", "THD filter passive")
add("filtr aktywny harmonicznych","KNR 5-08 0905-02","Filtr aktywny harmonicznych APF montaz",     8.00,"szt","aparatura",1.5,
    "APF active power filter", "aktywny filtr harmoniczny", "active harmonic filter APF", "filtr APF")
add("filtr aktywny 50a",          "KNR 5-08 0905-02","Filtr aktywny APF 50A montaz",               8.00,"szt","aparatura",1.5,
    "APF 50A", "filtr aktywny 50A", "active filter 50A")
add("filtr aktywny 100a",         "KNR 5-08 0905-03","Filtr aktywny APF 100A montaz",             10.00,"szt","aparatura",1.5,
    "APF 100A", "filtr aktywny 100A", "active filter 100A")
add("filtr aktywny 200a",         "KNR 5-08 0905-04","Filtr aktywny APF 200A montaz",             14.00,"szt","aparatura",1.5,
    "APF 200A", "filtr aktywny 200A")
add("kompensator statvar",        "KNR 5-08 0905-05","Kompensator statyczny STATVAR montaz",       8.00,"szt","aparatura",1.3,
    "STATCOM montaz", "static var compensator", "STATVAR", "SVG montaz")

# =============================================================================
# SQL GENERATION
# =============================================================================

def build_sql(r_list):
    header = """-- ============================================================
-- ES-Engine Dictionary Seed v10.0 — Finalny Audyt Bazy
-- AUTO-GENERATED by scripts/generate-seed-v10.py
-- 1. RTV/SAT (DVB-T2, anteny, multiswitch, LNB, wzmacniacze, CATV)
-- 2. OSWIETLENIE ZEWNETRZNE (uliczne/parkowe/elewacyjne/ogrodowe)
-- 3. KOMPENSACJA MOCY (baterie kondensatorow, PFC, filtry APF)
-- RBH: KNR 5-04/5-08/5-09/AT-26, rynek PL 2026
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
