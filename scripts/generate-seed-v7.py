#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ES-Engine Dictionary Seed v7.0 — "Totalna Baza" Generator
===========================================================
5 Clusters (700+ entries):
  1. SKD/KD — Kontrola dostepu: czytniki, kontrolery, zwory, bramki
  2. SERWEROWNIA — RACK 6U-42U, patch-panel, organizery, aktywny sprzet
  3. AGREGATY/SZR/UPS — diesle, AVR/SZR, UPS przemyslowy, akumulatory
  4. FLOORBOXY — wszystkie typy, nakladki multimedialne, podlogi techniczna
  5. BMS/PLC/AUTOMATYKA — sterowniki, Modbus/BACnet/KNX, wizualizacja

All synonyms added as separate rows (Phase 1 exact match).
RBH norms: KNR 5-04/5-08/5-09/AT-26, rynek PL 2026.
Output: supabase/migrations/20260307_seed_es_dictionary_v7.sql
"""

import os, re

OUTPUT = os.path.join(
    os.path.dirname(__file__), "..", "supabase", "migrations",
    "20260307_seed_es_dictionary_v7.sql"
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
    r = re.sub(r'\b(mb|szt|kpl|m2|m3|rbh|zl|100mb|h|strefa|obwod|punkt|port|para|rack|u)\b', '', r).strip()
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
# 1. SKD / KONTROLA DOSTĘPU (Access Control)
# =============================================================================

# Czytniki
add("czytnik rfid em",          "KNR 5-09 0401-01", "Czytnik RFID EM 125kHz montaz",   0.50, "szt", "bezpieczenstwo", 1.4,
    "czytnik EM4100", "EM 125kHz", "karta zbliżeniowa czytnik", "proximity reader EM")
add("czytnik rfid mifare",      "KNR 5-09 0401-01", "Czytnik RFID Mifare 13.56MHz montaz",0.50,"szt","bezpieczenstwo",1.5,
    "Mifare czytnik", "13.56MHz reader", "NFC czytnik", "czytnik ISO14443")
add("czytnik rfid desfire",     "KNR 5-09 0401-01", "Czytnik DESFire EV2 montaz",       0.60,"szt","bezpieczenstwo",1.5,
    "DESFire EV2", "czytnik szyfrowany", "high security reader")
add("czytnik biometryczny odcisk","KNR 5-09 0401-02","Czytnik biometryczny odcisk palca", 1.20,"szt","bezpieczenstwo",1.5,
    "fingerprint reader", "czytnik linii papilarnych", "biometric fingerprint", "odcisk palca KD")
add("czytnik biometryczny twarz","KNR 5-09 0401-02","Czytnik rozpoznawania twarzy montaz",1.80,"szt","bezpieczenstwo",1.5,
    "face recognition", "rozpoznawanie twarzy", "FR reader", "kamera face ID")
add("czytnik pin",              "KNR 5-09 0401-03", "Czytnik klawiatura PIN montaz",    0.40,"szt","bezpieczenstwo",1.3,
    "keypad KD", "klawiatura kodowa", "PIN pad KD", "klawiatura PIN KD")
add("czytnik rfid+pin",         "KNR 5-09 0401-04", "Czytnik RFID + PIN combo montaz",  0.70,"szt","bezpieczenstwo",1.5,
    "combo reader", "czytnik karta+PIN", "RFID PIN combo")
add("czytnik wielomodowy",      "KNR 5-09 0401-04", "Czytnik wielomodowy RFID+Bio montaz",1.50,"szt","bezpieczenstwo",1.4,
    "multi-modal reader", "czytnik RFID+odcisk", "dual-tech reader KD")
add("klawiatura dotykowa kd",   "KNR 5-09 0401-03", "Klawiatura dotykowa KD montaz",   0.50,"szt","bezpieczenstwo",1.3,
    "touch keypad KD", "panel dotykowy KD", "klawiatura PIN dotykowa")

# Kontrolery
add("kontroler kd 1 drzwi",     "KNR 5-09 0402-01", "Kontroler KD 1-drzwiowy montaz",  1.50,"szt","bezpieczenstwo",1.5,
    "single door controller", "kontroler 1D", "1-door access controller", "centralka KD 1D")
add("kontroler kd 2 drzwi",     "KNR 5-09 0402-02", "Kontroler KD 2-drzwiowy montaz",  2.00,"szt","bezpieczenstwo",1.5,
    "2-door controller", "kontroler 2D", "dual door access")
add("kontroler kd 4 drzwi",     "KNR 5-09 0402-03", "Kontroler KD 4-drzwiowy montaz",  3.00,"szt","bezpieczenstwo",1.5,
    "4-door controller", "kontroler 4D", "quad door controller")
add("kontroler kd ip",          "KNR 5-09 0402-04", "Kontroler KD IP-Based montaz",     2.00,"szt","bezpieczenstwo",1.4,
    "IP access controller", "kontroler sieciowy KD", "PoE controller KD")
add("serwer kd",                "KNR 5-09 0402-05", "Serwer systemu KD montaz+konfiguracja",4.00,"szt","bezpieczenstwo",1.3,
    "access control server", "serwer kontroli dostepu", "centrala KD software")
add("programowanie kd",         "KNR 5-09 0402-06", "Programowanie systemu KD",          4.00,"kpl","bezpieczenstwo",1.5,
    "konfiguracja KD", "wdrozenie KD", "commissioning access control", "uruchomienie SKD")
add("karta rfid mifare",        "KNR 5-09 0402-07", "Programowanie kart uzytkownikow",   0.05,"szt","bezpieczenstwo",1.2,
    "programowanie karty", "kodowanie karty", "enrollment karta")

# Zamki / Zwory
add("elektrozaczep 12v",        "KNR 5-09 0403-01", "Elektrozaczep 12V montaz",          0.60,"szt","bezpieczenstwo",1.4,
    "zaczep elektryczny 12V", "electric strike 12V", "elektrozaczep NC", "elektrozaczep NO")
add("elektrozaczep 24v",        "KNR 5-09 0403-01", "Elektrozaczep 24V montaz",          0.60,"szt","bezpieczenstwo",1.4,
    "electric strike 24V", "elektrozaczep 24V", "zaczep 24V")
add("zwora elektromagnetyczna 300n","KNR 5-09 0403-02","Zwora elektromagnetyczna 300N montaz",0.80,"szt","bezpieczenstwo",1.5,
    "magnet door 300N", "EM lock 300N", "zwora magnetyczna", "zamek magnetyczny 300N")
add("zwora elektromagnetyczna 600n","KNR 5-09 0403-02","Zwora elektromagnetyczna 600N montaz",0.90,"szt","bezpieczenstwo",1.5,
    "EM lock 600N", "zwora 600N", "zamek EM 600N")
add("zwora elektromagnetyczna 1200n","KNR 5-09 0403-02","Zwora elektromagnetyczna 1200N montaz",1.00,"szt","bezpieczenstwo",1.5,
    "EM lock 1200N", "zwora 1200N")
add("zamek elektryczny kd",     "KNR 5-09 0403-03", "Zamek elektryczny KD montaz",       0.80,"szt","bezpieczenstwo",1.4,
    "electric lock", "zamek el. KD", "motorized lock")
add("zamek samozatrzaskowy el", "KNR 5-09 0403-03", "Zamek samozatrzaskowy elektryczny",  0.70,"szt","bezpieczenstwo",1.3,
    "latch lock electric", "zamek el. NC/NO")
add("przycisk wyjscia",         "KNR 5-09 0403-04", "Przycisk wyjscia (REX) montaz",     0.25,"szt","bezpieczenstwo",1.4,
    "REX button", "przycisk REX", "exit button", "przycisk ewakuacyjny KD", "request to exit")
add("przycisk wyjscia szklo",   "KNR 5-09 0403-04", "Przycisk wyjscia szklany montaz",   0.30,"szt","bezpieczenstwo",1.3,
    "szklany REX", "glass REX button", "przycisk szklo wyjscie")
add("zasilacz kd 12v 5a",       "KNR 5-09 0403-05", "Zasilacz KD 12V 5A montaz",         0.50,"szt","bezpieczenstwo",1.3,
    "PSU KD 12V", "zasilacz KD", "power supply 12V KD")
add("zasilacz kd 24v 5a",       "KNR 5-09 0403-05", "Zasilacz KD 24V 5A montaz",         0.50,"szt","bezpieczenstwo",1.3,
    "PSU KD 24V", "zasilacz 24V KD")
add("akumulator kd 7ah",        "KNR 5-09 0403-06", "Akumulator KD 7Ah montaz",          0.20,"szt","bezpieczenstwo",1.2,
    "bateria KD 7Ah", "akumulator 12V 7Ah KD", "backup battery KD")

# Turnikety / Bramki
add("tripod kolumnowy",         "KNR 5-09 0405-01", "Tripod kolumnowy montaz+podlaczenie",3.00,"szt","bezpieczenstwo",1.4,
    "turnikiет tripod", "tripod KD", "kołowrotek tripod", "torniquete")
add("bramka optyczna full",     "KNR 5-09 0405-02", "Bramka optyczna fullheight montaz", 4.00,"szt","bezpieczenstwo",1.4,
    "full-height gate", "bramka pelna KD", "full height turnstile")
add("bramka optyczna wahadlowa","KNR 5-09 0405-03", "Bramka wahadlowa KD montaz",        4.00,"szt","bezpieczenstwo",1.4,
    "swing gate KD", "wahadlo KD", "bramka biurowa KD")
add("szlaban wjazdowy",         "KNR 5-09 0405-04", "Szlaban wjazdowy montaz+konfiguracja",4.00,"szt","bezpieczenstwo",1.4,
    "barrier gate", "szlaban parking", "szlaban elektr.", "boom barrier")
add("kolowrotek pelnorostowy",  "KNR 5-09 0405-05", "Kolowrotek pelnorostowy montaz",    5.00,"szt","bezpieczenstwo",1.4,
    "full height turnstile", "rotor pelnorostowy", "pelnorostowy kolowrot")
add("brama przesuwna el",       "KNR 5-09 0405-06", "Brama przesuwna elektryczna montaz",6.00,"szt","bezpieczenstwo",1.3,
    "sliding gate el.", "brama el. przesuwna", "automatic sliding gate")

# Integracja RCP
add("terminal rcp",             "KNR 5-09 0406-01", "Terminal RCP montaz+konfiguracja",  1.50,"szt","bezpieczenstwo",1.3,
    "rejestracja czasu pracy", "time attendance terminal", "czytnik RCP", "terminal RKP")
add("serwer rcp",               "KNR 5-09 0406-02", "Serwer RCP montaz+konfiguracja",    3.00,"szt","bezpieczenstwo",1.2,
    "time attendance server", "system rejestracji czasu", "oprogramowanie RCP")

# Kabel KD
add("kabel unshielded kd",      "KNR 5-09 0407-01", "Kabel UTP KD montaz",               0.80,"100mb","bezpieczenstwo",1.2,
    "kabel do czytnika", "LAN KD kabel", "UTP do KD")
add("kabel ytksy 4x2",          "KNR 5-09 0407-02", "Kabel YTKSY 4x2x0.5 KD montaz",    0.80,"100mb","bezpieczenstwo",1.3,
    "YTKSY 4x2", "kabel ekranowany KD", "alarm cable 4x2")

# =============================================================================
# 2. SERWEROWNIA / IT INFRASTRUCTURE
# =============================================================================

# Szafy RACK — rozszerzone
for u_size, label, rbh, syns in [
    (6,  "Szafa rack 6U naścienna",   1.50, ["rack 6U wall", "wallmount 6U", "szafka IT 6U"]),
    (9,  "Szafa rack 9U naścienna",   2.00, ["rack 9U wall", "wallmount 9U"]),
    (12, "Szafa rack 12U naścienna",  2.50, ["rack 12U wall", "wallmount 12U", "szafka 12U"]),
    (15, "Szafa rack 15U",            3.00, ["rack 15U", "szafa 15U"]),
    (18, "Szafa rack 18U",            3.00, ["rack 18U"]),
    (22, "Szafa rack 22U podlogowa",  3.50, ["rack 22U floor", "podlogowa 22U"]),
    (27, "Szafa rack 27U podlogowa",  4.00, ["rack 27U"]),
    (32, "Szafa rack 32U podlogowa",  4.50, ["rack 32U"]),
    (37, "Szafa rack 37U podlogowa",  5.00, ["rack 37U"]),
    (42, "Szafa rack 42U data center",5.00, ["rack 42U DC", "rack serwerowy 42U", "full rack 42U", "szafa serwer 42U"]),
    (47, "Szafa rack 47U data center",5.50, ["rack 47U", "full rack 47U"]),
]:
    kw = f"szafa rack {u_size}u"
    add(kw, "KNR 5-09 0101-01", label + " montaz", rbh, "szt", "it_siec", 1.3, *syns)

# Patch panele
add("patch panel 12p cat6",     "KNR 5-09 0102-00","Patch panel 12-portowy kat.6 montaz",0.60,"szt","it_siec",1.4,
    "patch 12p", "patch panel 12")
add("patch panel 24p cat6",     "KNR 5-09 0102-01","Patch panel 24p kat.6 montaz+zakonczenia",1.00,"szt","it_siec",1.5,
    "patch 24p", "patchpanel 24", "patch panel 24 portow")
add("patch panel 48p cat6",     "KNR 5-09 0102-02","Patch panel 48p kat.6 montaz+zakonczenia",1.80,"szt","it_siec",1.5,
    "patch 48p", "patchpanel 48", "patch panel 48 portow")
add("patch panel 24p cat6a",    "KNR 5-09 0102-03","Patch panel 24p kat.6A ekranowany montaz",1.20,"szt","it_siec",1.5,
    "patch 24p kat6A", "shielded patch 24p", "STP patch panel 24")
add("patch panel optyczny lc 24","KNR 5-09 0102-04","Patch panel optyczny LC 24-portowy montaz",2.00,"szt","it_siec",1.5,
    "fiber patch panel LC", "patch optyczny 24p LC", "LIU LC 24")
add("patch panel optyczny sc 24","KNR 5-09 0102-05","Patch panel optyczny SC 24-portowy montaz",2.00,"szt","it_siec",1.5,
    "fiber patch panel SC", "patch optyczny SC", "LIU SC 24")
add("panel keystone 12p",       "KNR 5-09 0102-06","Panel keystone 12-portowy montaz",   0.80,"szt","it_siec",1.3,
    "keystone panel 12", "modul panel 12p")
add("panel keystone 24p",       "KNR 5-09 0102-07","Panel keystone 24-portowy montaz",   1.20,"szt","it_siec",1.3,
    "keystone panel 24", "modul panel 24p")

# Organizery i akcesoria
add("organizer kablowy 1u",     "KNR 5-09 0111-01","Organizer kablowy 1U montaz",         0.10,"szt","it_siec",1.2,
    "cable manager 1U", "organizator kabli 1U", "prowadnica 1U")
add("organizer kablowy 2u",     "KNR 5-09 0111-01","Organizer kablowy 2U montaz",         0.12,"szt","it_siec",1.2,
    "cable manager 2U", "organizator 2U")
add("panele slepe 1u",          "KNR 5-09 0111-02","Panele slepe 1U montaz",              0.05,"szt","it_siec",1.0,
    "blank panel 1U", "panel zaślepka 1U")
add("listwa napiecia rack",     "KNR 5-09 0111-03","Listwa napiecia 230V rack montaz",    0.30,"szt","it_siec",1.2,
    "power strip rack", "listwa PDU 230V", "power rail rack")
add("szyna montazowa 19",       "KNR 5-09 0111-04","Szyna montazowa 19\" rack montaz",    0.15,"szt","it_siec",1.1,
    "rack rail", "szyna 19 cali", "rail kit rack")

# Aktywny sprzet
add("montaz serwera rack 1u",   "KNR 5-09 0112-01","Serwer 1U rack montaz+okablowanie",  1.50,"szt","it_siec",1.3,
    "server 1U montaz", "rack serwer 1U", "1U server install")
add("montaz serwera rack 2u",   "KNR 5-09 0112-02","Serwer 2U rack montaz+okablowanie",  1.80,"szt","it_siec",1.3,
    "server 2U montaz", "rack serwer 2U")
add("montaz serwera tower",     "KNR 5-09 0112-03","Serwer tower montaz+podlaczenie",     1.00,"szt","it_siec",1.2,
    "tower server montaz", "serwer wolnostojacy")
add("montaz macierzy nas",      "KNR 5-09 0112-04","Macierz NAS montaz+konfiguracja",     2.00,"szt","it_siec",1.3,
    "NAS montaz", "storage NAS", "RAID NAS konfiguracja")
add("montaz routera rack",      "KNR 5-09 0112-05","Router rack montaz+konfiguracja",     1.00,"szt","it_siec",1.2,
    "router rack", "router 1U rack")
add("montaz firewalla",         "KNR 5-09 0112-06","Firewall montaz+konfiguracja",        2.00,"szt","it_siec",1.3,
    "firewall rack", "FortiGate montaz", "Cisco ASA montaz", "UTM montaz")
add("montaz switcha core",      "KNR 5-09 0112-07","Switch core L3 montaz+konfiguracja",  3.00,"szt","it_siec",1.4,
    "core switch L3", "switch L3 rack", "Cisco Catalyst core", "HP core switch")
add("montaz ap wlan kontroler", "KNR 5-09 0112-08","Kontroler WLAN montaz+konfiguracja",  2.00,"szt","it_siec",1.3,
    "WLAN controller", "WiFi kontroler", "wireless controller")

# Chłodzenie rack / serwerownia
add("klimatyzacja serwerowni",  "KNR 5-09 0113-01","Klimatyzacja serwerowni montaz+podlaczenie",4.00,"szt","it_siec",1.3,
    "server room AC", "klimatyzacja IT", "precision cooling datacenter")
add("klimatyzacja rack",        "KNR 5-09 0113-02","Klimatyzacja rack-mounted montaz",    2.00,"szt","it_siec",1.3,
    "rack AC unit", "in-rack cooling")
add("czujnik temperatury rack", "KNR 5-09 0113-03","Czujnik temperatury rack montaz",     0.30,"szt","it_siec",1.2,
    "temp sensor rack", "temperature sensor server", "czujnik T serwerownia")
add("podloga techniczna",       "KNR 5-09 0114-01","Podloga techniczna podniesiona montaz",1.00,"m2","it_siec",1.3,
    "raised floor", "fałsz podloga IT", "podloga serwerowni", "technical floor", "antystatic floor")
add("organizacja tras kablowych rack","KNR 5-09 0114-02","Organizacja tras kablowych w rack", 1.50,"kpl","it_siec",1.2,
    "cable management rack", "zarzadzanie kablami rack", "opisanie portow rack")
add("oznakowanie portow",       "KNR 5-09 0114-03","Oznakowanie portow i tras kablowych", 1.00,"kpl","it_siec",1.2,
    "port labeling", "oznaczenie kabli", "kablogram", "etykietowanie portow")

# Swiatlowoд w serwerowni
add("spawanie zakonczenia swiatlowoду",   "KNR 5-09 0106-01","Spawanie zakonczenia OTC montaz",0.50,"szt","it_siec",1.5,
    "OTC spawanie", "fiber splice", "zarobienie wlokna", "fusion splice")
add("zakonczenie pigtailem lc","KNR 5-09 0106-02","Zakonczenie pigtailem LC montaz",      0.30,"szt","it_siec",1.4,
    "pigtail LC", "LC connector termination", "zakonczenie LC")
add("zakonczenie pigtailem sc","KNR 5-09 0106-02","Zakonczenie pigtailem SC montaz",      0.30,"szt","it_siec",1.4,
    "pigtail SC", "SC connector termination", "zakonczenie SC")
add("pomiar reflektometrem otdr","KNR 5-09 0106-03","Pomiar reflektometrem OTDR",          0.50,"odcinek","it_siec",1.5,
    "OTDR test", "pomiar trasy swiatlowoдowej", "test ODC", "reflektometr swiatlowoд")
add("certyfikacja lan klasa e", "KNR 5-09 0109-01","Certyfikacja toru LAN klasa E/kat.6", 0.20,"para","it_siec",1.5,
    "Fluke Cat6 test", "klasa E certyfikat", "test toru Cat6 Fluke", "certyfikat sieci")
add("certyfikacja lan klasa fa","KNR 5-09 0109-02","Certyfikacja toru LAN klasa FA/kat.6A",0.25,"para","it_siec",1.5,
    "Fluke Cat6A test", "klasa FA certyfikat", "Cat6A certification")

# =============================================================================
# 3. AGREGATY / SZR / UPS — Zasilanie awaryjne
# =============================================================================

# Agregaty
add("agregat diesel 10kva",     "KNR 5-08 1001-01","Agregat diesel 10kVA montaz",         6.00,"szt","aparatura",1.4,
    "diesel 10kVA", "generator 10kVA", "pradownica 10kVA", "agregat pradotworcza 10kVA")
add("agregat diesel 20kva",     "KNR 5-08 1001-01","Agregat diesel 20kVA montaz",         8.00,"szt","aparatura",1.4,
    "diesel 20kVA", "generator 20kVA", "agregat 20kVA")
add("agregat diesel 40kva",     "KNR 5-08 1001-02","Agregat diesel 40kVA montaz",        10.00,"szt","aparatura",1.4,
    "diesel 40kVA", "generator 40kVA")
add("agregat diesel 60kva",     "KNR 5-08 1001-02","Agregat diesel 60kVA montaz",        12.00,"szt","aparatura",1.4,
    "diesel 60kVA", "generator 60kVA")
add("agregat diesel 100kva",    "KNR 5-08 1001-03","Agregat diesel 100kVA montaz",       16.00,"szt","aparatura",1.5,
    "diesel 100kVA", "generator 100kVA", "aggregat 100kVA")
add("agregat diesel 200kva",    "KNR 5-08 1001-03","Agregat diesel 200kVA montaz",       20.00,"szt","aparatura",1.5,
    "diesel 200kVA", "generator 200kVA")
add("agregat diesel 400kva",    "KNR 5-08 1001-04","Agregat diesel 400kVA montaz",       28.00,"szt","aparatura",1.5,
    "diesel 400kVA", "generator 400kVA")
add("agregat diesel 500kva",    "KNR 5-08 1001-04","Agregat diesel 500kVA montaz",       32.00,"szt","aparatura",1.5,
    "diesel 500kVA", "generator 500kVA")
add("montaz tlumika wydechu",   "KNR 5-08 1001-05","Tlumik wydechu agregatu montaz",      2.00,"szt","aparatura",1.3,
    "exhaust muffler", "tlumik agregat", "wydelot agregatu")
add("instalacja wydechu agregatu","KNR 5-08 1001-06","Instalacja wydechu ze stali nierdzewnej montaz",4.00,"kpl","aparatura",1.3,
    "rura wydechu agregat", "exhaust pipe diesel", "rura wydechowa SS")
add("montaz zbiornika paliwa",  "KNR 5-08 1001-07","Zbiornik paliwa dobowego montaz",    3.00,"szt","aparatura",1.3,
    "zbiornik diesel", "tank paliwo agregat", "bak agregatu", "day tank")
add("rozruch agregatu",         "KNR 5-08 1001-08","Rozruch i uruchomienie agregatu",     4.00,"szt","aparatura",1.4,
    "uruchomienie agregatu", "commissioning agregat", "load test agregat", "test obciazeniowy")
add("wentylacja pomieszczenia agregatu","KNR 5-08 1001-09","Wentylacja pomieszczenia agregatowni",3.00,"kpl","aparatura",1.3,
    "ventilation generator room", "wentylacja agregatownia", "nawiew agregat")

# SZR / ATS (Samoczynny Załącznik Rezerwy)
add("szr",                      "KNR 5-08 1002-01","SZR montaz+programowanie",            6.00,"kpl","aparatura",1.5,
    "samoczynny zalacznik rezerwy", "ATS", "automatyczny przelacznik", "automatic transfer switch", "SZR szafy")
add("szr do 63a",               "KNR 5-08 1002-01","SZR do 63A montaz",                   4.00,"szt","aparatura",1.5,
    "ATS 63A", "przelacznik sieciowy 63A SZR", "transfer switch 63A")
add("szr do 125a",              "KNR 5-08 1002-02","SZR do 125A montaz",                  5.00,"szt","aparatura",1.5,
    "ATS 125A", "przelacznik 125A SZR", "transfer switch 125A")
add("szr do 250a",              "KNR 5-08 1002-03","SZR do 250A montaz",                  6.00,"szt","aparatura",1.5,
    "ATS 250A", "przelacznik 250A SZR")
add("szr do 400a",              "KNR 5-08 1002-04","SZR do 400A montaz",                  8.00,"szt","aparatura",1.5,
    "ATS 400A", "przelacznik 400A SZR")
add("szr do 630a",              "KNR 5-08 1002-05","SZR do 630A montaz",                 10.00,"szt","aparatura",1.5,
    "ATS 630A", "SZR 630A", "transfer switch 630A")
add("szr do 1000a",             "KNR 5-08 1002-06","SZR do 1000A montaz",                14.00,"szt","aparatura",1.5,
    "ATS 1000A", "SZR 1000A")
add("bypass serwisowy szr",     "KNR 5-08 1002-07","Bypass serwisowy SZR montaz",         3.00,"szt","aparatura",1.4,
    "maintenance bypass", "bypass ATS", "obejscie serwisowe SZR")
add("szafarnia agregatu",       "KNR 5-08 1002-08","Szafarnia agregatu kompletna montaz", 12.00,"kpl","aparatura",1.4,
    "agregat szafarnia", "szafa agregat+SZR", "power house montaz")

# UPS przemysłowy
add("ups 1kva rack",            "KNR 5-08 1003-01","UPS 1kVA rack montaz+konfiguracja",   1.00,"szt","aparatura",1.3,
    "UPS 1kVA 1U", "rack UPS 1000VA", "zasilacz awaryjny 1kVA")
add("ups 2kva rack",            "KNR 5-08 1003-01","UPS 2kVA rack montaz+konfiguracja",   1.20,"szt","aparatura",1.3,
    "UPS 2kVA rack", "2kVA UPS 2U")
add("ups 3kva rack",            "KNR 5-08 1003-01","UPS 3kVA rack montaz+konfiguracja",   1.50,"szt","aparatura",1.3,
    "UPS 3kVA", "3kVA rack UPS")
add("ups 6kva rack",            "KNR 5-08 1003-02","UPS 6kVA rack montaz+konfiguracja",   2.00,"szt","aparatura",1.4,
    "UPS 6kVA", "6kVA rack")
add("ups 10kva tower",          "KNR 5-08 1003-03","UPS 10kVA tower montaz+konfiguracja", 2.50,"szt","aparatura",1.4,
    "UPS 10kVA tower", "10kVA UPS wolnostojacy", "10kVA zasilacz awaryjny")
add("ups 20kva 3f",             "KNR 5-08 1003-04","UPS 20kVA trojfazowy montaz",         4.00,"szt","aparatura",1.4,
    "UPS 20kVA 3-phase", "20kVA trojfazowy UPS")
add("ups 40kva 3f",             "KNR 5-08 1003-04","UPS 40kVA trojfazowy montaz",         5.00,"szt","aparatura",1.4,
    "UPS 40kVA 3-phase", "40kVA UPS")
add("ups 80kva 3f",             "KNR 5-08 1003-05","UPS 80kVA trojfazowy montaz",         6.00,"szt","aparatura",1.5,
    "UPS 80kVA", "80kVA UPS")
add("ups 120kva 3f",            "KNR 5-08 1003-05","UPS 120kVA trojfazowy montaz",        8.00,"szt","aparatura",1.5,
    "UPS 120kVA", "120kVA UPS")
add("ups 200kva 3f",            "KNR 5-08 1003-06","UPS 200kVA trojfazowy montaz",       10.00,"szt","aparatura",1.5,
    "UPS 200kVA", "200kVA UPS datacenter")
add("stojak akumulatorowy ups", "KNR 5-08 1003-07","Stojak akumulatorowy UPS montaz",     3.00,"szt","aparatura",1.4,
    "battery rack UPS", "stojak baterii", "battery cabinet UPS", "akumulatory UPS stojak")
add("akumulator agm 100ah",     "KNR 5-08 1003-08","Akumulator AGM 100Ah montaz",         0.40,"szt","aparatura",1.3,
    "AGM 100Ah", "bateria 100Ah AGM", "akumulator UPS 100Ah")
add("akumulator agm 200ah",     "KNR 5-08 1003-08","Akumulator AGM 200Ah montaz",         0.60,"szt","aparatura",1.3,
    "AGM 200Ah", "bateria 200Ah")
add("test obciazeniowy ups",    "KNR 5-08 1003-09","Test obciazeniowy UPS z protokolem",  2.00,"kpl","aparatura",1.4,
    "load test UPS", "test akumulatorow", "test autonomii UPS", "UPS discharge test")
add("serwis ups",               "KNR 5-08 1003-10","Serwis UPS wymiana akumulatorow",     1.00,"kpl","aparatura",1.2,
    "wymiana baterii UPS", "UPS battery replacement", "serwisowanie UPS")

# =============================================================================
# 4. FLOORBOXY — wszystkie typy (rozszerzenie i szczegoly)
# =============================================================================

# Montaz w betonie vs fałszpodłodze
add("floorbox w betonie 4x230v","KNR 5-04 0301-04","Floorbox betonowy 4x230V montaz",    1.50,"szt","gniazda_wylaczniki",1.5,
    "puszka w betonie 4xGP", "kaseta betonowa 4x230V", "podlogowe gniazdo w betonie")
add("floorbox w betonie 2x230v 2xrj45","KNR 5-04 0301-04","Floorbox betonowy 2x230V+2xRJ45",1.80,"szt","gniazda_wylaczniki",1.5,
    "puszka beton data+power", "kaseta beton LAN+gniazdo")
add("floorbox w betonie 6x230v","KNR 5-04 0301-04","Floorbox betonowy 6x230V montaz",    2.00,"szt","gniazda_wylaczniki",1.5,
    "kaseta 6-gniazd beton", "puszka 6GP beton")
add("floorbox falszpodloga",    "KNR 5-04 0301-03","Floorbox w fałszpodłodze montaz",     0.80,"szt","gniazda_wylaczniki",1.4,
    "puszka falszpodloga", "floorbox raised floor", "kaseta falsz podloga")
add("pustak podlogowy",         "KNR 5-04 0301-05","Pustak podlogowy do gniazd montaz",   0.60,"szt","gniazda_wylaczniki",1.2,
    "floorbox pustak", "puszka w pustaku", "gniazdo w pustaku podlogowym")
add("gniazdo posadzkowe",       "KNR 5-04 0301-06","Gniazdo posadzkowe montaz",           0.70,"szt","gniazda_wylaczniki",1.3,
    "gniazdo w podlodze", "posadzkowe socket", "floor outlet", "gniazdo podłogowe hermetyczne")
add("media port hdmi",          "KNR 5-04 0301-07","Media port HDMI w kasecie podlogowej",0.25,"szt","gniazda_wylaczniki",1.3,
    "HDMI floorbox", "HDMI kaseta", "HDMI podloga", "port HDMI podlogowy")
add("media port usb",           "KNR 5-04 0301-07","Media port USB-A w kasecie podlogowej",0.20,"szt","gniazda_wylaczniki",1.2,
    "USB floorbox", "USB kaseta podloga", "USB outlet floor")
add("media port usbc",          "KNR 5-04 0301-07","Media port USB-C w kasecie montaz",  0.20,"szt","gniazda_wylaczniki",1.2,
    "USB-C floorbox", "USB Type-C kaseta")
add("media port jack audio",    "KNR 5-04 0301-07","Media port jack 3.5mm audio montaz", 0.20,"szt","gniazda_wylaczniki",1.1,
    "audio jack floorbox", "jack kaseta podloga", "3.5mm jack podloga")
add("media port dp",            "KNR 5-04 0301-07","Media port DisplayPort montaz",       0.25,"szt","gniazda_wylaczniki",1.2,
    "DisplayPort kaseta", "DP floorbox", "DisplayPort podloga")
add("nakladka floorbox stalowa","KNR 5-04 0301-08","Nakladka floorbox stalowa montaz",    0.15,"szt","gniazda_wylaczniki",1.1,
    "steel cover floorbox", "nakladka ze stali", "klapka floorbox")
add("nakladka floorbox aluminiowa","KNR 5-04 0301-08","Nakladka floorbox aluminiowa montaz",0.15,"szt","gniazda_wylaczniki",1.1,
    "aluminium cover floorbox", "nakladka Al floorbox")
add("okablowanie floorbox 5m",  "KNR 5-04 0301-09","Okablowanie floorboxa kompletne 5mb", 0.80,"kpl","gniazda_wylaczniki",1.3,
    "zasilanie floorbox", "kabel do floorbox", "WLZ floorbox 5m")
add("kompletna kaseta polagowa media","KNR 5-04 0301-10","Kompletna kaseta podlogowa media montaz",2.00,"kpl","gniazda_wylaczniki",1.4,
    "media port set", "kaseta multimedialna", "multimedia floor box komplet")
add("puszka konduktu podlogowa","KNR 5-04 0301-11","Puszka konduktu podlogowego montaz",  0.40,"szt","gniazda_wylaczniki",1.1,
    "konduit puszka podloga", "kanal podlogowy puszka")

# =============================================================================
# 5. BMS / PLC / AUTOMATYKA BUDYNKOWA
# =============================================================================

# Sterowniki PLC
add("sterownik plc",            "KNR 5-08 1101-01","Sterownik PLC montaz+programowanie",  4.00,"szt","aparatura",1.3,
    "PLC controller", "programowalny sterownik", "automat PLC", "programmable logic controller")
add("sterownik plc siemens s7", "KNR 5-08 1101-01","Sterownik PLC Siemens S7 montaz",     6.00,"szt","aparatura",1.4,
    "S7-1200", "S7-1500", "Siemens SIMATIC", "sterownik SIMATIC")
add("sterownik plc allen bradley","KNR 5-08 1101-02","Sterownik PLC Allen-Bradley montaz", 6.00,"szt","aparatura",1.4,
    "Rockwell PLC", "CompactLogix", "MicroLogix AB")
add("modul wejsc cyfrowych di", "KNR 5-08 1101-03","Modul DI wejscia cyfrowe montaz",     0.50,"szt","aparatura",1.2,
    "DI module", "digital input PLC", "modul wejsc binarnych")
add("modul wyjsc cyfrowych do", "KNR 5-08 1101-03","Modul DO wyjscia cyfrowe montaz",     0.50,"szt","aparatura",1.2,
    "DO module", "digital output PLC", "modul wyjsc")
add("modul wejsc analogowych ai","KNR 5-08 1101-04","Modul AI wejscia analogowe montaz",  0.60,"szt","aparatura",1.2,
    "AI module", "analog input PLC", "0-10V modul", "4-20mA modul")
add("modul wyjsc analogowych ao","KNR 5-08 1101-04","Modul AO wyjscia analogowe montaz",  0.60,"szt","aparatura",1.2,
    "AO module", "analog output PLC")
add("hmi panel operatorski 7",  "KNR 5-08 1101-05","Panel HMI 7 cali montaz",             1.50,"szt","aparatura",1.3,
    "HMI 7\"", "panel operatorski 7 cali", "wyswietlacz PLC 7\"")
add("hmi panel operatorski 10", "KNR 5-08 1101-05","Panel HMI 10 cali montaz",            2.00,"szt","aparatura",1.3,
    "HMI 10\"", "panel dotykowy 10\"", "touchscreen PLC 10\"")
add("hmi panel operatorski 15", "KNR 5-08 1101-06","Panel HMI 15 cali montaz",            2.50,"szt","aparatura",1.3,
    "HMI 15\"", "panel SCADA 15\"")

# BMS — Building Management System
add("centrala bms bacnet",      "KNR 5-08 1102-01","Centrala BMS BACnet montaz+konfiguracja",6.00,"szt","aparatura",1.3,
    "BACnet controller", "BMS BACnet IP", "centrala BMS automatyka")
add("centrala bms modbus",      "KNR 5-08 1102-01","Centrala BMS Modbus montaz",           5.00,"szt","aparatura",1.3,
    "Modbus controller", "BMS Modbus RTU", "sterownik Modbus")
add("modul io bms",             "KNR 5-08 1102-02","Modul I/O BMS montaz+adresowanie",     1.00,"szt","aparatura",1.2,
    "BMS I/O module", "modul rozszerzenia BMS", "I/O board BMS")
add("gateway bacnet modbus",    "KNR 5-08 1102-03","Gateway BACnet/Modbus montaz",         1.50,"szt","aparatura",1.3,
    "Modbus to BACnet gateway", "konwerter Modbus BACnet", "bridge Modbus BACnet")
add("gateway lonworks",         "KNR 5-08 1102-03","Gateway LONworks montaz",              1.50,"szt","aparatura",1.2,
    "LON gateway", "LONworks interface", "FTT-10 gateway")
add("czujnik temperatury bms",  "KNR 5-08 1102-04","Czujnik temperatury BMS montaz",       0.30,"szt","aparatura",1.3,
    "PT1000 BMS", "NTC czujnik BMS", "temp sensor BMS", "PT100 montaz")
add("czujnik co2 bms",          "KNR 5-08 1102-04","Czujnik CO2 BMS montaz",               0.50,"szt","aparatura",1.3,
    "CO2 sensor BMS", "czujnik jakosci powietrza", "IAQ sensor", "VOC CO2")
add("czujnik wilgotnosci bms",  "KNR 5-08 1102-04","Czujnik wilgotnosci BMS montaz",       0.40,"szt","aparatura",1.3,
    "humidity sensor BMS", "RH sensor BMS", "czujnik RH BMS")
add("czujnik cisnienia bms",    "KNR 5-08 1102-05","Czujnik cisnienia BMS montaz",         0.50,"szt","aparatura",1.2,
    "pressure sensor BMS", "czujnik cisnienia HVAC", "DP sensor")
add("zawor regulacyjny bms",    "KNR 5-08 1102-06","Zawor regulacyjny 2-drogowy BMS montaz",1.00,"szt","aparatura",1.2,
    "2-way valve BMS", "zawor 2D BMS", "zawor elektryczny HVAC")
add("zawor regulacyjny 3d bms", "KNR 5-08 1102-06","Zawor regulacyjny 3-drogowy BMS montaz",1.20,"szt","aparatura",1.2,
    "3-way valve BMS", "zawor 3D BMS", "zawor mieszajacy el.")
add("silownik zaworu bms",      "KNR 5-08 1102-07","Silownik zaworu BMS montaz",           0.40,"szt","aparatura",1.2,
    "valve actuator BMS", "napęd zaworu BMS", "actuator HVAC zawor")
add("sterownik vav bms",        "KNR 5-08 1102-08","Sterownik VAV montaz+kalibracja",      1.00,"szt","aparatura",1.3,
    "VAV controller", "sterowanie nawiewem VAV", "variable air volume controller")
add("programowanie bms",        "KNR 5-08 1102-09","Programowanie systemu BMS",            6.00,"kpl","aparatura",1.4,
    "konfiguracja BMS", "uruchomienie BMS", "BMS commissioning", "wdrozenie BMS")
add("wizualizacja scada",       "KNR 5-08 1103-01","Wizualizacja SCADA montaz+konfiguracja",8.00,"kpl","aparatura",1.3,
    "SCADA system", "HMI SCADA", "system wizualizacji", "supervisory control SCADA")
add("videowall kontroler",      "KNR 5-08 1103-02","VideoWall kontroler montaz+konfiguracja",4.00,"szt","aparatura",1.2,
    "video wall controller", "kontroler sciany video", "display wall montaz")
add("monitor scada",            "KNR 5-08 1103-03","Monitor SCADA montaz",                 0.80,"szt","aparatura",1.2,
    "ekran SCADA", "monitor BMS", "wyswietlacz dyspozytorni")

# Protokoly / komunikacja
add("kabel modbus rs485",       "KNR 5-08 1104-01","Kabel Modbus RS485 montaz",            0.80,"100mb","aparatura",1.2,
    "RS485 kabel", "Modbus kabel", "kabel RTU Modbus", "skretka RS485")
add("kabel bacnet ms tp",       "KNR 5-08 1104-01","Kabel BACnet MS/TP montaz",            0.80,"100mb","aparatura",1.2,
    "BACnet kabel", "MS/TP kabel", "ARCNET kabel BMS")
add("konwerter rs485 ethernet", "KNR 5-08 1104-02","Konwerter RS485/Ethernet montaz",      0.60,"szt","aparatura",1.2,
    "serial to ethernet", "RS485 IP converter", "Modbus TCP gateway")
add("ups bms 24v",              "KNR 5-08 1104-03","Zasilacz buforowy BMS 24V montaz",     0.50,"szt","aparatura",1.2,
    "buffer PSU BMS", "zasilacz 24V BMS bufor", "24VDC BMS backup")

# =============================================================================
# SQL GENERATION
# =============================================================================

def build_sql(r_list):
    header = """-- ============================================================
-- ES-Engine Dictionary Seed v7.0 — "Totalna Baza" 5 Clusters
-- AUTO-GENERATED by scripts/generate-seed-v7.py
-- 1. SKD/KD (kontrola dostepu)
-- 2. SERWEROWNIA / IT infrastructure
-- 3. AGREGATY / SZR / UPS (zasilanie awaryjne)
-- 4. FLOORBOXY (wszystkie typy)
-- 5. BMS / PLC / AUTOMATYKA budynkowa
-- Synonyms = separate rows (Phase 1 exact match)
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
