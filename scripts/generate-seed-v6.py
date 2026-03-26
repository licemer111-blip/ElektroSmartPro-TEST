#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ES-Engine Dictionary Seed v6.0 — "Mega-Baza" Generator
========================================================
7 Critical Clusters:
  1. PPOZ/DSO  — NHXH/HTKSH, czujki, ROP, centrala, oddymianie
  2. OSWIETLENIE — pełne spektrum: mieszkanie/biuro/hala
  3. SMART HOME/KNX — Grenton/Fibaro/Loxone/KNX, rolety, ogrzewanie
  4. CCTV/LAN  — kamery IP, NVR, rack, patch-panel, Cat6/7
  5. UZIOMY/ODGROMOWKA — szpilki, bednarka, GSU, zwody, iglice
  6. NAGLASNIENIE/DSO — głośniki, wzmacniacze, DSO
  7. WYKOPY/ZIEMNE — ręczne/mechaniczne, rowy, przeloty

Each entry: keyword + 5+ synonyms added as separate rows (Phase 1 exact match)
RBH norms: KNR 5-04, 5-08, 5-09, AT-26, market PL 2026
Output: supabase/migrations/20260306_seed_es_dictionary_v6.sql
"""

import os, re

OUTPUT = os.path.join(
    os.path.dirname(__file__), "..", "supabase", "migrations",
    "20260306_seed_es_dictionary_v6.sql"
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
    r = re.sub(r'\b(mb|szt|kpl|m2|m3|rbh|zl|100mb|h|strefa|obwod|punkt|mb)\b', '', r).strip()
    return re.sub(r'\s+', ' ', r).strip()

def esc(s): return s.replace("'", "''")

seen = set()
rows = []

def add(kw, knr, label, rbh, unit, cat, conf, *synonyms):
    """Add main keyword + all synonyms as separate dictionary rows."""
    n = norm(kw)
    if n not in seen:
        seen.add(n)
        rows.append((kw, knr, label, rbh, unit, cat, conf))
    for syn in synonyms:
        ns = norm(syn)
        if ns and ns not in seen:
            seen.add(ns)
            rows.append((syn, knr, label + " [syn]", max(rbh, 0.01), unit, cat, round(conf * 0.9, 1)))


# =============================================================================
# 1. PPOŻ / DSO — Systemy pożarowe
# =============================================================================

# Kable ognioodporne
add("kabel nhxh e30",        "KNR 5-09 0605-01", "Kabel NHXH E30 ognioodporny", 2.20, "100mb", "kable_silnopradowe", 1.5,
    "NHXH E30", "kabel ppoz e30", "ognioodporny E30", "kabel 90 min", "NHXH bezhalogenowy E30")
add("kabel nhxh e90",        "KNR 5-09 0605-01", "Kabel NHXH E90 ognioodporny", 2.50, "100mb", "kable_silnopradowe", 1.5,
    "NHXH E90", "kabel ppoz e90", "ognioodporny 90 min", "E90 bezhalogenowy")
add("kabel htksh",           "KNR 5-09 0605-02", "Kabel HTKSH p.poz. montaz",   2.00, "100mb", "kable_silnopradowe", 1.4,
    "HTKSH", "HTKSH 2x2x0 5", "kabel alarmowy ppoz", "kabel do SSP")
add("kabel htksh 2x2",       "KNR 5-09 0605-02", "Kabel HTKSH 2x2x0.5 SSP",    2.00, "100mb", "kable_silnopradowe", 1.5,
    "HTKSH 2x2x0.5", "kabel SSP 2x2", "ekranowany ppoz 2x2")
add("kabel hdgs 2x1",        "KNR 5-09 0605-01", "Kabel HDGs 2x1.0 p.poz.",     2.00, "100mb", "kable_silnopradowe", 1.4,
    "HDGs 2x1", "HDGs ognioodporny", "kabel HDGs montaz")
add("kabel hdgs 3x1 5",      "KNR 5-09 0605-01", "Kabel HDGs 3x1.5 p.poz.",     2.20, "100mb", "kable_silnopradowe", 1.5,
    "HDGs 3x1.5", "przewod HDGs", "p.poz. 3x1.5")
add("kabel nhxmh 3x2 5",     "KNR 5-09 0605-01", "Kabel NHXMHom 3x2.5",         2.20, "100mb", "kable_silnopradowe", 1.4,
    "NHXMHom 3x2.5", "NHXMHom bezhalogenowy", "nhxmh ppoz")

# Czujki pożarowe
add("czujka dymu optyczna",  "KNR 5-09 0602-01", "Czujka dymu optyczna SSP",    0.50, "szt",   "bezpieczenstwo", 1.5,
    "detektor dymu", "czujka optyczna", "smoke detector", "czujnik dymu", "czujka adresowalna")
add("czujka dymu jonizacyjna","KNR 5-09 0602-01","Czujka dymu jonizacyjna",      0.50, "szt",   "bezpieczenstwo", 1.4,
    "jonizacyjna", "czujka jonizacyjna", "czujnik jonizacyjny")
add("czujka ciepla",         "KNR 5-09 0602-02", "Czujka ciepla termiczna SSP", 0.50, "szt",   "bezpieczenstwo", 1.4,
    "czujnik temperatury ppoz", "termiczny detektor", "czujka termiczna", "heat detector")
add("czujka multisensorowa", "KNR 5-09 0602-03", "Czujka multisensorowa SSP",   0.60, "szt",   "bezpieczenstwo", 1.4,
    "multisensor ppoz", "czujka optyczno-termiczna", "czujka kombinowana", "multi-detector")
add("czujka liniowa dymu",   "KNR 5-09 0602-04", "Czujka liniowa dymu beam",    1.50, "szt",   "bezpieczenstwo", 1.4,
    "beam detector", "czujka liniowa beam", "liniowa ppoz")
add("czujka plomienia",      "KNR 5-09 0602-05", "Czujka plomienia UV/IR",       1.00, "szt",   "bezpieczenstwo", 1.3,
    "flame detector", "UV IR detector", "detektor plomienia")
add("czujka zasysajaca",     "KNR 5-09 0602-06", "Czujka zasysajaca ASD montaz", 2.00, "szt",   "bezpieczenstwo", 1.3,
    "ASD Very Early Warning", "zasysajaca ppoz", "VESDA montaz")

# ROP — Ręczny Ostrzegacz Pożarowy
add("rop",                   "KNR 5-09 0603-01", "ROP montaz i podlaczenie",     0.40, "szt",   "bezpieczenstwo", 1.5,
    "reczny ostrzegacz pozaru", "przycisk ppoz", "break-glass ppoz", "call point", "przycisk alarmowy ppoz")
add("rop adresowalny",       "KNR 5-09 0603-01", "ROP adresowalny montaz",       0.50, "szt",   "bezpieczenstwo", 1.5,
    "ROP addressable", "adresowalny ostrzegacz", "intelligentny ROP")

# Sygnalizatory / Syreny
add("sygnalizator ppoz",     "KNR 5-09 0604-01", "Sygnalizator ppoz montaz",     0.50, "szt",   "bezpieczenstwo", 1.4,
    "syrena ppoz", "alarm ppoz", "sygnal dzwiekowy ppoz", "bell ppoz")
add("sygnalizator optyczno akustyczny ppoz", "KNR 5-09 0604-01", "Sygnalizator optyczno-akustyczny", 0.60, "szt", "bezpieczenstwo", 1.5,
    "sounder strobe", "syrena ze strobem", "sygnal swietlny ppoz", "optical acoustic alarm")
add("sygnalizator zewnetrzny ppoz", "KNR 5-09 0604-02", "Sygnalizator zewnetrzny ppoz", 0.80, "szt", "bezpieczenstwo", 1.4,
    "zewnetrzna syrena ppoz", "outdoor sounder ppoz")
add("lampa ppoz",            "KNR 5-09 0604-03", "Lampa sygnalizacyjna ppoz",    0.40, "szt",   "bezpieczenstwo", 1.3,
    "flash ppoz", "lampa ostrzegawcza ppoz")

# Centrale SSP
add("centrala ssp polon alfa","KNR 5-09 0601-01","Centrala SSP Polon-Alfa montaz+programowanie", 6.00, "szt", "bezpieczenstwo", 1.5,
    "Polon Alfa", "centrala pozarowa Polon", "CSP Polon", "CSP-208", "SAP Polon")
add("centrala satel ssp",    "KNR 5-09 0601-01", "Centrala SSP Satel montaz",    5.00, "szt",   "bezpieczenstwo", 1.4,
    "Satel SSP", "CSP Satel", "centrala pozarowa Satel")
add("centrala ssp adresowalna", "KNR 5-09 0601-02","Centrala SSP adresowalna montaz", 8.00, "szt","bezpieczenstwo", 1.5,
    "FCP adresowalna", "adresowalna centrala ppoz", "intelligent fire panel")
add("centrala ssp konwencjonalna", "KNR 5-09 0601-03","Centrala SSP konwencjonalna", 4.00, "szt","bezpieczenstwo", 1.4,
    "konwencjonalna centrala", "conventional fire panel")
add("programowanie ssp",     "KNR 5-09 0601-04", "Programowanie centrali SSP",   4.00, "kpl",  "bezpieczenstwo", 1.5,
    "konfiguracja SSP", "programowanie ppoz", "uruchomienie SSP")
add("zasilacz ppoz 24v",     "KNR 5-09 0606-01", "Zasilacz ppoz 24VDC montaz",   0.80, "szt",   "bezpieczenstwo", 1.3,
    "PSU ppoz", "zasilacz awaryjny ppoz", "24V fire power supply")

# Oddymianie
add("klapa oddymiajaca",     "KNR 5-09 0607-03", "Klapa oddymiajaca montaz",     2.50, "szt",   "bezpieczenstwo", 1.4,
    "wentyl oddymiajacy", "smoke vent", "oddymianie klapa")
add("centralka oddymiania",  "KNR 5-09 0607-04", "Centralka oddymiania montaz",  3.00, "szt",   "bezpieczenstwo", 1.4,
    "sterownik oddymiania", "central smoke control", "RZN montaz")
add("przycisk oddymiania",   "KNR 5-09 0607-05", "Przycisk oddymiania montaz",   0.40, "szt",   "bezpieczenstwo", 1.4,
    "przewietrzanie przycisk", "smoke vent button", "wyjscie ppoz przycisk")
add("czujka co",             "KNR 5-09 0607-06", "Czujka CO montaz",             0.50, "szt",   "bezpieczenstwo", 1.3,
    "detektor CO", "czujnik tlenku wegla", "CO detector", "czujnik czadu")
add("czujka gazu",           "KNR 5-09 0607-07", "Czujka gazu montaz",           0.60, "szt",   "bezpieczenstwo", 1.3,
    "detektor gazu", "czujnik gazu ziemnego", "gas detector", "czujka gazowa")

# Tryskacze / Hydranty
add("elektrozawor ppoz",     "KNR 5-09 0607-08", "Elektrozawor ppoz montaz",     1.00, "szt",   "bezpieczenstwo", 1.2,
    "zawor el. ppoz", "solenoid valve fire")
add("monitorowanie kurtyny",  "KNR 5-09 0607-09","Monitorowanie kurtyny ppoz",   1.00, "szt",   "bezpieczenstwo", 1.2,
    "kurtyna ppoz montaz", "fire curtain connection")

# =============================================================================
# 2. OŚWIETLENIE — pełne spektrum (uzupełnienie)
# =============================================================================

# Mieszkaniowe
add("montaz oprawy sufitowej",  "KNR 5-04 0401-01","Oprawa sufitowa montaz",     0.40, "szt", "oswietlenie", 1.2,
    "sufitowa oprawa", "montaz sufitowki", "plafon montaz")
add("montaz oczka sufitowego",  "KNR 5-04 0401-02","Oczko sufitowe GU10 montaz", 0.30, "szt", "oswietlenie", 1.3,
    "oczko GU10", "spot podtynkowy", "downlight GU10", "oczko halogenowe", "puszka oczka")
add("montaz oczek 10szt",       "KNR 5-04 0401-02","Oczka sufitowe 10szt komplet",2.50,"kpl", "oswietlenie", 1.3,
    "10x oczko", "seria oczek", "10 spotow montaz")
add("montaz oczek 5szt",        "KNR 5-04 0401-02","Oczka sufitowe 5szt",        1.30, "kpl", "oswietlenie", 1.2,
    "5x oczko", "seria 5 spotow")
add("montaz zyrardola",         "KNR 5-04 0401-01","Zyrandol montaz",            0.60, "szt", "oswietlenie", 1.2,
    "zyrandol", "lampa wisząca duza", "zwis sufitowy")
add("montaz kinkietu",          "KNR 5-04 0401-01","Kinkiet scienny montaz",     0.40, "szt", "oswietlenie", 1.2,
    "kinkiet", "lampa scienna", "wall lamp", "aplique")
add("taśma led montaz profilu aluminiowego", "KNR 5-04 0401-08","Tasma LED profil montaz", 0.25, "mb", "oswietlenie", 1.3,
    "LED strip profil", "montaz profilu LED", "listwa LED profil", "tasma w profilu")
add("profil aluminiowy led parabola",  "KNR 5-04 0401-08","Profil led paraboliczny montaz",0.22,"mb","oswietlenie",1.3,
    "profil paraboliczny LED", "profil do tasmy LED")
add("lutowanie tasmy led",      "KNR 5-04 0401-08","Lutowanie polaczenia tasmy LED",0.20,"szt","oswietlenie",1.3,
    "lut LED", "soldowanie tasmy", "zlacze lutowane LED", "lutowanie RGB", "lutowanie COB")
add("kontroler tasmy led wifi", "KNR 5-04 0401-10","Kontroler tasmy LED WiFi montaz",0.30,"szt","oswietlenie",1.2,
    "LED WiFi controller", "sterownik tasmy WiFi", "Tuya LED controller")

# Biurowe
add("oprawa rastrowa 60x60",    "KNR 5-04 0401-01","Oprawa rastrowa 600x600 montaz",0.50,"szt","oswietlenie",1.3,
    "panel LED 600x600", "rastrowa 60x60", "rastrowka", "troffer 60x60", "panel sufitowy LED")
add("oprawa rastrowa 120x30",   "KNR 5-04 0401-01","Oprawa rastrowa 1200x300 montaz",0.50,"szt","oswietlenie",1.3,
    "panel LED 120x30", "rastrowka 120x30", "troffer 120x30")
add("oprawa rastrowa 120x60",   "KNR 5-04 0401-01","Oprawa rastrowa 1200x600 montaz",0.55,"szt","oswietlenie",1.3,
    "panel LED 120x60", "rastrowka 120x60")
add("oprawa biurowa zawieszona","KNR 5-04 0401-01","Oprawa biurowa zawieszona montaz",0.60,"szt","oswietlenie",1.2,
    "pendant biurowy", "zwis biurowy", "office pendant")
add("czujnik oswietlenia lux",  "KNR 5-04 0401-04","Czujnik natezenia oswietlenia",0.40,"szt","oswietlenie",1.3,
    "luxometr czujnik", "sensor lux", "czujnik lux DALI", "sensor natezenia swiatla")
add("oprawa ewakuacyjna 1h",    "KNR 5-04 0401-03","Oprawa ewakuacyjna 1h montaz",0.50,"szt","oswietlenie",1.4,
    "ewakuacyjna 1h", "EXIT 1h", "AWEX 1h", "1 godzina autonomii")
add("oprawa ewakuacyjna 3h",    "KNR 5-04 0401-03","Oprawa ewakuacyjna 3h montaz",0.60,"szt","oswietlenie",1.5,
    "ewakuacyjna 3h", "EXIT 3h", "3 godziny autonomii", "droga ewakuacyjna 3h")
add("oprawa awaryjna antypanична","KNR 5-04 0401-03","Oprawa awaryjna anti-panic montaz",0.60,"szt","oswietlenie",1.4,
    "anti-panic", "oswietlenie strefy otwartej", "open area emergency")
add("montaz centralki bateryjnej ewakuacyjnej","KNR 5-04 0401-14","Centralka bateryjna ewakuacji montaz",3.00,"szt","oswietlenie",1.3,
    "centralka CPS", "zasilacz awaryjny ewakuacja", "EPS centralka")
add("test systemu ewakuacyjnego","KNR 5-04 0401-15","Test i regulacja systemu ewakuacyjnego",2.00,"kpl","oswietlenie",1.3,
    "uruchomienie ewakuacja", "test opraw awaryjnych", "pomiar autonomii opraw")

# Przemyslowe (uzupelnienie)
add("oprawa highbay 400w",      "KNR 5-04 0401-11","Oprawa High-Bay 400W montaz",1.20,"szt","oswietlenie",1.4,
    "High-Bay 400W", "UFO 400W", "400W hala")
add("oprawa highbay 500w",      "KNR 5-04 0401-11","Oprawa High-Bay 500W montaz",1.50,"szt","oswietlenie",1.4,
    "High-Bay 500W", "UFO 500W industrial")
add("oprawa helioslim",         "KNR 5-04 0401-05","Oprawa Helioslim IP65 montaz",0.65,"szt","oswietlenie",1.2,
    "slim IP65", "oprawa cienka IP65")
add("lampa uliczna led",        "KNR 5-04 0401-12","Lampa uliczna LED montaz na slupie",1.20,"szt","oswietlenie",1.3,
    "oprawa uliczna LED", "street light LED", "lampa drogowa LED")
add("montaz na slupie oswietleniowym","KNR 5-04 0401-16","Montaz oprawy na slupie oswietleniowym",1.50,"szt","oswietlenie",1.3,
    "slup oswietleniowy montaz", "latarnia montaz", "pole light montaz")

# =============================================================================
# 3. SMART HOME / KNX / LOXONE — uzupełnienie
# =============================================================================

add("loxone miniserver",     "KNR 5-04 1505-09","Loxone Miniserver montaz+konfiguracja",4.00,"szt","aparatura",1.3,
    "Loxone montaz", "miniserver Loxone", "server Loxone", "Loxone Smart Home")
add("loxone extension",      "KNR 5-04 1505-10","Loxone Extension montaz",       1.00,"szt","aparatura",1.3,
    "Loxone Tree Extension", "modul Loxone", "extension Loxone")
add("wylacznik knx touch",   "KNR 5-04 1501-03","Wylacznik KNX dotykowy montaz", 0.80,"szt","aparatura",1.4,
    "switch KNX touch", "panel KNX", "klawisz KNX dotykowy", "touch panel KNX")
add("termostat knx",         "KNR 5-04 1501-05","Termostat KNX montaz+adresowanie",1.00,"szt","aparatura",1.4,
    "RTR KNX", "room temperature KNX", "termostat bus KNX")
add("aktor kanalow knx",     "KNR 5-04 1501-06","Aktor kanalowy KNX montaz",     0.80,"szt","aparatura",1.3,
    "switching actuator KNX", "aktor przekaznikowy", "relay actuator KNX")
add("aktor rolet knx",       "KNR 5-04 1501-07","Aktor rolet KNX montaz",        0.80,"szt","aparatura",1.4,
    "Jalousie actuator KNX", "shutter actuator KNX", "aktor zaluzji KNX")
add("silownik termostatyczny","KNR 5-04 1505-11","Silownik termostatyczny montaz",0.30,"szt","aparatura",1.2,
    "actuator termostatyczny", "siłownik grzejnikowy", "zawor termostatyczny el.", "thermostatic actuator")
add("regulator ogrzewania podlogowego","KNR 5-04 1505-12","Regulator ogrzewania podlogowego",0.60,"szt","aparatura",1.3,
    "sterownik UFH", "rozdzielacz el.", "underfloor heating controller")
add("czujnik wilgotnosci smarthome","KNR 5-04 1505-13","Czujnik wilgotnosci montaz",0.30,"szt","aparatura",1.2,
    "sensor RH", "wilgotnosc czujnik", "humidity sensor", "czujnik T+RH")
add("czujnik otwarcia okna",  "KNR 5-04 1505-14","Czujnik otwarcia okna montaz", 0.25,"szt","aparatura",1.2,
    "kontaktron okienny", "window sensor", "czujnik okna smarthome")
add("integracja smarthome",   "KNR 5-04 1505-15","Integracja systemu Smart Home", 4.00,"kpl","aparatura",1.1,
    "wdrozenie smarthome", "uruchomienie automatyki", "commissioning smart home")
add("naped zaluzji elektryczny","KNR 5-04 0401-06","Naped zaluzji elektryczny montaz",0.80,"szt","aparatura",1.3,
    "silnik zaluzji", "roleta el.", "motor zaluzji", "shutter motor", "motor rolet")
add("naped rolet 45nm",       "KNR 5-04 0401-06","Naped rolet 45Nm montaz",       1.00,"szt","aparatura",1.3,
    "silnik rolet 45Nm", "motor rolet 45Nm")
add("przycisk sterowania roletami","KNR 5-04 0401-06","Przycisk sterowania roletami",0.25,"szt","aparatura",1.2,
    "klawisz roleta", "przycisk zaluzje", "monostabilny roleta")
add("video intercom ip",      "KNR 5-09 0501-05","Wideodomofon IP montaz+konfiguracja",2.00,"szt","bezpieczenstwo",1.3,
    "domofon IP", "wideodomofon IP", "SIP intercom", "IP video doorbell")
add("bramofon ip",            "KNR 5-09 0501-06","Bramofon IP montaz+programowanie",2.50,"szt","bezpieczenstwo",1.3,
    "IP gate panel", "panel bramowy IP", "domofon do bramy IP")

# =============================================================================
# 4. CCTV / LAN — uzupełnienie i szczegółowe warianty
# =============================================================================

# Kamery szczegolowe
add("kamera ip 2mp dome",     "KNR 5-09 0201-01","Kamera IP 2MP dome montaz",   1.20,"szt","bezpieczenstwo",1.4,
    "2MP dome", "kamera 2 megapixel dome", "IP cam dome 1080p")
add("kamera ip 4mp dome",     "KNR 5-09 0201-01","Kamera IP 4MP dome montaz",   1.20,"szt","bezpieczenstwo",1.4,
    "4MP dome", "kamera 4 megapixel")
add("kamera ip 8mp 4k",       "KNR 5-09 0201-04","Kamera IP 8MP 4K montaz",     1.50,"szt","bezpieczenstwo",1.5,
    "kamera 4K", "4K IP camera", "8MP kamera", "kamera UHD")
add("kamera ip tubowa zewnetrzna","KNR 5-09 0201-02","Kamera IP tubowa zewn. montaz",1.30,"szt","bezpieczenstwo",1.4,
    "bullet camera", "kamera tubowa zewnetrzna", "outdoor bullet IP")
add("kamera fisheye 180",     "KNR 5-09 0201-05","Kamera fisheye 180st. montaz", 1.50,"szt","bezpieczenstwo",1.3,
    "fisheye camera", "kamera rybiego oka", "panoramic camera 180")
add("kamera ptz outdoor",     "KNR 5-09 0201-03","Kamera PTZ zewnetrzna montaz", 2.50,"szt","bezpieczenstwo",1.4,
    "PTZ outdoor", "kamera obrotowa zewn.", "speed dome outdoor")
add("kamera termowizyjna",    "KNR 5-09 0201-06","Kamera termowizyjna montaz",   3.00,"szt","bezpieczenstwo",1.3,
    "thermal camera", "kamera IR termiczna", "kamera cieplna")
add("wspornik kamery scienny","KNR 5-09 0201-07","Wspornik kamery scienny montaz",0.30,"szt","bezpieczenstwo",1.2,
    "uchwyt kamera scienny", "bracket kamera", "wall mount camera")
add("wspornik kamery sufitowy","KNR 5-09 0201-07","Wspornik kamery sufitowy montaz",0.35,"szt","bezpieczenstwo",1.2,
    "uchwyt kamera sufit", "ceiling mount camera")
add("konfiguracja nvr 8ch",   "KNR 5-09 0203-03","Konfiguracja NVR 8-kanalowy",  2.00,"szt","bezpieczenstwo",1.4,
    "NVR 8ch setup", "rejestrator 8 kanalowy konfiguracja")
add("konfiguracja nvr 16ch",  "KNR 5-09 0203-04","Konfiguracja NVR 16-kanalowy", 3.00,"szt","bezpieczenstwo",1.4,
    "NVR 16ch setup", "rejestrator 16 kanalowy")
add("konfiguracja nvr 32ch",  "KNR 5-09 0203-05","Konfiguracja NVR 32-kanalowy", 5.00,"szt","bezpieczenstwo",1.4,
    "NVR 32ch", "rejestrator 32 kanalowy")

# LAN szczegolowe
add("zarobienie wtyczki rj45","KNR 5-09 0103-04","Zarobienie wtyczki RJ45 crimping",0.10,"szt","it_siec",1.4,
    "crimping RJ45", "obzim RJ45", "konfekcja RJ45", "obciskanie RJ45", "widelce RJ45")
add("pomiar klas lan",        "KNR 5-09 0109-01","Pomiar i certyfikacja toru LAN", 0.20,"para","it_siec",1.5,
    "certyfikacja Cat6", "fluke test LAN", "pomiar kabla LAN", "test toru kablowego", "BICSI test")
add("kabel lan cat5e",        "KNR 5-09 0104-00","Kabel UTP kat.5e montaz",       0.80,"100mb","it_siec",1.2,
    "UTP kat.5e", "Cat5e", "kabel sieciowy Cat5e")
add("kabel lan cat8",         "KNR 5-09 0104-04","Kabel SFTP kat.8 montaz",       1.50,"100mb","it_siec",1.3,
    "Cat8", "SFTP Cat8", "kabel datacenter Cat8")
add("zasilanie poe",          "KNR 5-09 0107-04","Zasilanie PoE konfiguracja",    0.20,"port","it_siec",1.2,
    "PoE configuration", "Power over Ethernet", "PoE setup")
add("montaz pdu rack",        "KNR 5-09 0107-05","PDU rack montaz",               0.40,"szt","it_siec",1.2,
    "listwa zasilajaca rack", "power distribution unit", "listwa rack PDU")
add("montaz ups rack",        "KNR 5-09 0107-06","UPS rack montaz+konfiguracja",  2.00,"szt","it_siec",1.3,
    "UPS rackowy", "rack UPS montaz")
add("montaz konwertera swiatlowodowego","KNR 5-09 0110-01","Konwerter swiatlowoд-ETH montaz",0.60,"szt","it_siec",1.2,
    "media converter", "fiber to ethernet", "konwerter swiatlowoду")
add("montaz sfp",             "KNR 5-09 0110-02","Modul SFP montaz w switchu",    0.20,"szt","it_siec",1.2,
    "SFP module", "wkladka SFP", "modul swiatlowoдowy SFP")

# =============================================================================
# 5. UZIOMY / ODGROMÓWKA — pełny spektrum
# =============================================================================

# Uziomy
add("uziom szpilkowy",        "KNR 5-04 0801-01","Uziom szpilkowy wbijany montaz",1.20,"szt","uziemienie",1.5,
    "szpilka uziemiajaca", "wbicie szpilki", "pogrązanie uziomu", "uziemienie pionowe", "uziom pionowy wbijany")
add("uziom tasmy poziomy",    "KNR 5-04 0801-02","Uziom tasmowy poziomy montaz",  0.15,"mb","uziemienie",1.4,
    "bednarka uziemiajaca", "uziom poziomy FeZn", "tasma uziemiajaca", "bednarka w ziemi")
add("szpilka uziemiajaca 1 5m","KNR 5-04 0801-01","Szpilka Cu 1.5m wbijanie",    1.00,"szt","uziemienie",1.4,
    "uziom 1.5m", "electrode 1.5m", "szpilka miedziana 1.5m")
add("szpilka uziemiajaca 3m", "KNR 5-04 0801-01","Szpilka Cu 3.0m wbijanie",     1.50,"szt","uziemienie",1.5,
    "uziom 3m", "szpilka 3 metry", "electrode 3m")
add("szyna gsu",              "KNR 5-04 0802-01","Szyna GSU (glowna szyna uziemiajaca)", 0.30,"szt","uziemienie",1.5,
    "GSU", "glowna szyna uziemiajaca", "main earthing bar", "szyna uziemiajaca glowna")
add("szyna gsw",              "KNR 5-04 0802-02","Szyna GSW (szyna wyrownania potencjalu)",0.30,"szt","uziemienie",1.5,
    "GSW", "szyna wyrownawcza", "equipotential bar", "PE bus bar")
add("zlacze kontrolne uziemienia","KNR 5-04 0802-03","Zlacze kontrolne uziomowe montaz",0.40,"szt","uziemienie",1.4,
    "studzienka uziomowa", "inspection pit earthing", "zlacze pomiarowe PE")
add("przewod uziemiajacy cu 16","KNR 5-04 0801-11","Przewod uziemiajacy Cu 16mm2",1.50,"100mb","uziemienie",1.3,
    "LY 16", "przewod PE 16", "green-yellow 16", "zielono-zolty 16mm2")
add("przewod uziemiajacy cu 25","KNR 5-04 0801-11","Przewod uziemiajacy Cu 25mm2",1.80,"100mb","uziemienie",1.3,
    "LY 25", "PE 25mm2", "zielono-zolty 25")
add("przewod uziemiajacy cu 50","KNR 5-04 0801-11","Przewod uziemiajacy Cu 50mm2",2.20,"100mb","uziemienie",1.3,
    "LY 50", "PE 50", "przewod PE gruby 50")
add("bednarka fezn 30x4",     "KNR 5-04 0801-03","Bednarka FeZn 30x4mm montaz",  0.10,"mb","uziemienie",1.4,
    "FeZn 30x4", "tasma stalowa 30x4", "flat bar 30x4 FeZn")
add("bednarka cu 30x3",       "KNR 5-04 0801-03","Bednarka Cu 30x3mm montaz",    0.12,"mb","uziemienie",1.4,
    "Cu 30x3", "tasma miedziana 30x3", "flat bar Cu 30x3")
add("pomiar uziomow",         "KNR 5-04 1001-03","Pomiar rezystancji uziemienia", 0.30,"punkt","uziemienie",1.5,
    "pomiar RE", "test uziomow", "rezystancja uziemienia pomiar", "PE resistance test", "pomiar rezystancji uziomow")
add("wyrownanie potencjalów lazienka","KNR 5-04 0802-04","Wyrownanie potencjalow lazienka montaz",1.00,"kpl","uziemienie",1.5,
    "PE lazienka", "wyrownanie lazienka", "bonding lazienka", "PE strefy 0/1/2 lazienka")

# Odgromówka
add("zwod poziomy dach",      "KNR 5-04 0801-10","Zwod poziomy odgromowy na dachu montaz",0.15,"mb","uziemienie",1.4,
    "drut odgromowy", "zwod dachowy", "roof conductor", "drut Fe 8mm dach")
add("uchwyt zwodu dachowego", "KNR 5-04 0801-12","Uchwyt zwodu dachowego montaz",0.12,"szt","uziemienie",1.2,
    "uchwyt do dachowki", "holder zwod", "roof clamp", "uchwyt dachowkowy")
add("iglica odgromowa",       "KNR 5-04 0801-09","Iglica odgromowa montaz",       2.00,"szt","uziemienie",1.4,
    "Franklin rod", "piorunochron iglica", "air termination rod", "iglica Franklin")
add("zwod pionowy maszt",     "KNR 5-04 0801-09","Maszt odgromowy montaz",        3.00,"szt","uziemienie",1.3,
    "maszt piorunochronny", "maszt odgromowy", "lightning mast")
add("przewod odprowadzajacy", "KNR 5-04 0801-13","Przewod odprowadzajacy odgromowy",0.12,"mb","uziemienie",1.4,
    "down conductor", "drut odprowadzajacy", "zejscie odgromowe", "LY 16 odprowadzajacy")
add("studzienka kontrolna odgrom","KNR 5-04 0801-14","Studzienka kontrolna odgromowa montaz",0.50,"szt","uziemienie",1.3,
    "zlacze inspekcyjne odgrom", "inspection well lightning", "studzienka inspekcyjna PE")
add("ogranicznik przepiec klasa b","KNR 5-08 0501-01","Ogranicznik przepiec klasa B montaz",0.80,"szt","aparatura",1.5,
    "SPD klasa B", "OC klasa B", "blyskawickochronnik B", "piorunochron SPD B")
add("ogranicznik przepiec klasa c","KNR 5-08 0501-02","Ogranicznik przepiec klasa C montaz",0.50,"szt","aparatura",1.5,
    "SPD klasa C", "OC klasa C", "overvoltage C")
add("ogranicznik przepiec klasa bc","KNR 5-08 0501-03","Ogranicznik przepiec klasa B+C montaz",0.80,"szt","aparatura",1.5,
    "SPD B+C", "kombinowany OC", "klasa BC przepiec")
add("pomiar odgromowki",      "KNR 5-04 1001-05","Pomiar instalacji odgromowej",  1.00,"kpl","uziemienie",1.4,
    "test odgromowki", "pomiar LPS", "certyfikat odgromowy", "pomiar rezystancji PE odgromowki")

# =============================================================================
# 6. NAGŁOŚNIENIE / DSO — systemy audio
# =============================================================================

add("glosnik sufitowy",       "KNR 5-09 0801-01","Glosnik sufitowy montaz",       0.60,"szt","it_siec",1.3,
    "speaker sufitowy", "głośnik podtynkowy", "ceiling speaker", "głośnik 100V sufitowy")
add("glosnik scienny 100v",   "KNR 5-09 0801-02","Glosnik scienny 100V montaz",   0.60,"szt","it_siec",1.3,
    "speaker ścienny 100V", "głośnik 100V scienny", "wall speaker", "kolumna 100V")
add("glosnik outdoor ip65",   "KNR 5-09 0801-03","Glosnik zewnetrzny IP65 montaz",0.80,"szt","it_siec",1.3,
    "speaker outdoor", "głośnik zewnętrzny IP65", "outdoor speaker")
add("wzmacniacz audio 100v",  "KNR 5-09 0802-01","Wzmacniacz 100V montaz+konfiguracja",1.50,"szt","it_siec",1.3,
    "amplifier 100V", "wzmacniacz trafowy", "PA amplifier", "wzmacniacz naglosnienia")
add("wzmacniacz dso",         "KNR 5-09 0802-02","Wzmacniacz DSO montaz+programowanie",3.00,"szt","it_siec",1.4,
    "DSO amplifier", "wzmacniacz systemow ostrzegania", "EN 54-16 amplifier")
add("centrala dso",           "KNR 5-09 0802-03","Centrala DSO montaz+konfiguracja",5.00,"szt","it_siec",1.4,
    "DSO controller", "system DSO centrala", "EN 54-16 controller", "DSO panel")
add("mikrofon dso",           "KNR 5-09 0802-04","Mikrofon DSO montaz",            0.40,"szt","it_siec",1.3,
    "microphone DSO", "mikrofon alarmowy", "fire alarm mic")
add("panel sterowania dso",   "KNR 5-09 0802-05","Panel sterowania DSO montaz",    0.80,"szt","it_siec",1.3,
    "DSO control panel", "panel DSO", "remote DSO panel")
add("kabel 100v naglosnienie","KNR 5-09 0803-01","Kabel do naglosnienia 100V montaz",1.00,"100mb","it_siec",1.2,
    "kabel audio 100V", "przewod głosnikowy 100V", "loudspeaker cable 100V")
add("kabel do glosnikow",     "KNR 5-09 0803-01","Kabel głosnikowy montaz",        0.80,"100mb","it_siec",1.2,
    "kabel audio", "speaker cable", "przewod do głosnikow")
add("programowanie dso",      "KNR 5-09 0802-06","Programowanie systemu DSO",      4.00,"kpl","it_siec",1.4,
    "konfiguracja DSO", "uruchomienie DSO", "DSO commissioning", "DSO programowanie stref")
add("radiowezel",             "KNR 5-09 0804-01","System radiowezel montaz",       3.00,"kpl","it_siec",1.2,
    "radiowęzeł", "system radiowy", "radio network system")
add("mikser audio",           "KNR 5-09 0804-02","Mikser audio montaz+konfiguracja",1.50,"szt","it_siec",1.2,
    "mixer audio", "mikrofon pult", "audio mixer")

# =============================================================================
# 7. WYKOPY / ROBOTY ZIEMNE — pełny spektrum
# =============================================================================

add("wykop reczny w piasku",  "KNR 5-04 0801-04","Wykop reczny w piasku",        1.50,"100mb","prowadzenie",1.4,
    "kopanie rowu w piasku", "reczny wykop piasek", "row kablowy piasek", "sandy trench")
add("wykop reczny w glinie",  "KNR 5-04 0801-04","Wykop reczny w glinie",         2.00,"100mb","prowadzenie",1.5,
    "kopanie rowu glina", "ciezki grunt wykop", "clay trench", "row w glinie")
add("wykop reczny w zwirze",  "KNR 5-04 0801-04","Wykop reczny w zwirze",         1.80,"100mb","prowadzenie",1.4,
    "zwir wykop", "gravel trench", "row w zwirze")
add("wykop reczny w ziemi twardej","KNR 5-04 0801-04","Wykop reczny ziemia twarda",2.50,"100mb","prowadzenie",1.5,
    "twarda ziemia wykop", "hard soil trench", "ubita ziemia wykop")
add("wykop mechaniczny koparką","KNR 5-04 0801-15","Wykop mechaniczny koparka",    0.80,"100mb","prowadzenie",1.4,
    "koparka wykop", "mechaniczny rów kablowy", "excavator trench", "kopanie koparka")
add("wykop mini koparką",     "KNR 5-04 0801-16","Wykop mini-koparka",            1.00,"100mb","prowadzenie",1.4,
    "mini koparka", "micro excavator trench", "koparka 1.5t wykop")
add("zasypanie rowu piaskiem","KNR 5-04 0801-05","Zasypanie rowu piaskiem",       0.80,"100mb","prowadzenie",1.3,
    "podsypka piasek", "sand backfill", "zasypka piasek", "podsypka kablowa")
add("zasypanie rowu z zaglebieniem","KNR 5-04 0801-05","Zasypanie z zaglebieniem i zaglad",1.00,"100mb","prowadzenie",1.3,
    "zasypanie i ubicie", "backfill compaction", "zasypanie z ubijaniem")
add("ukladanie kabla w rowie", "KNR 5-04 0801-17","Ukladanie kabla w rowie kablowym",1.20,"100mb","prowadzenie",1.4,
    "kabel w ziemi ukladanie", "laying cable in trench", "prowadzenie kabla w rowie")
add("folia ostrzegawcza ukladanie","KNR 5-04 0801-06","Folia ostrzegawcza ukladanie",0.20,"100mb","prowadzenie",1.4,
    "tasma ostrzegawcza", "warning tape", "zolta folia kablowa", "folia niebieska kablowa")
add("piasek podsypka 10cm",   "KNR 5-04 0801-18","Podsypka piaskowa 10cm montaz", 0.30,"100mb","prowadzenie",1.3,
    "piasek pod kabel", "10cm sand bedding", "podsypka ochronna kabel")
add("rura ochronna dvr w rowie","KNR 5-04 0703-04","Rura ochronna DVR w rowie",   0.35,"mb","rury_trasy",1.3,
    "rura osłonowa w ziemi", "protective pipe trench", "DVR w rowie")
add("przecisk reczny pod droga","KNR 5-04 0703-05","Przecisk reczny pod droga",   3.00,"mb","prowadzenie",1.5,
    "przebicie pod drogą", "horizontal boring", "przejscie pod chodnikiem", "reczny przecisk")
add("przecisk hydrauliczny",  "KNR 5-04 0703-06","Przecisk hydrauliczny HDD",     2.00,"mb","prowadzenie",1.5,
    "horizontal directional drilling", "HDD przebicie", "wiertnica horyzontalna")
add("odtworzenie nawierzchni asfaltu","KNR 5-04 0801-19","Odtworzenie nawierzchni asfaltowej",5.00,"100mb","prowadzenie",1.4,
    "naprawa asfaltu po wykobie", "odtworzenie drogi asfalt", "asfalt po robotach kablowych")
add("odtworzenie nawierzchni kostki","KNR 5-04 0801-20","Odtworzenie nawierzchni z kostki",4.00,"100mb","prowadzenie",1.3,
    "kostka brukowa odtworzenie", "bruk po robotach", "kostka po wykobie")
add("przekroczenie torów kolejowych","KNR 5-04 0703-07","Przekroczenie torow kolejowych (projekt)",8.00,"kpl","prowadzenie",1.3,
    "przejscie pod torami", "crossing railway", "tory kablowe przekroczenie")

# =============================================================================
# GENERATE SQL
# =============================================================================

def build_sql(rows_list):
    header = """-- ============================================================
-- ES-Engine Dictionary Seed v6.0 — "Mega-Baza" 7 Critical Clusters
-- AUTO-GENERATED by scripts/generate-seed-v6.py
-- 1. PPOZ/DSO  2. OSWIETLENIE  3. SMART HOME/KNX
-- 4. CCTV/LAN  5. UZIOMY/ODGROMOWKA  6. NAGLASNIENIE  7. WYKOPY
-- Synonyms embedded as separate rows for Phase 1 exact match
-- RBH norms: KNR 5-04/5-09, market PL 2026
-- ============================================================

INSERT INTO es_dictionary
  (keyword, knr_ref, label, type, is_composite, composite_refs,
   labor_norm_rbh, unit, category, confidence_weight)
VALUES
"""
    vals = []
    for (kw, knr, label, rbh, unit, cat, conf) in rows_list:
        vals.append(
            f"('{kw.replace(chr(39), chr(39)*2)}', '{knr}', "
            f"'{label.replace(chr(39), chr(39)*2)}', "
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
