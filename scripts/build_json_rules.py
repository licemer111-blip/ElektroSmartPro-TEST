"""Build quick-estimate-rules.json from rule data."""
import json, os

teletechnical_rules = {
  "mieszkanie": [
    {"name": "Gniazdo RJ45 kat.6 (LAN)", "unit": "szt", "base_material": 30, "base_labor": 45, "calc": "per_room", "factor": 1.0, "zakres": "teletechnical"},
    {"name": "Kabel UTP kat.6", "unit": "mb", "base_material": 3.5, "base_labor": 12, "calc": "per_area", "factor": 1.5, "zakres": "teletechnical"},
    {"name": "Gniazdo TV/SAT", "unit": "szt", "base_material": 22, "base_labor": 35, "calc": "per_room", "factor": 0.5, "zakres": "teletechnical"},
    {"name": "Patch panel 24-portowy", "unit": "szt", "base_material": 180, "base_labor": 90, "calc": "fixed", "factor": 1, "zakres": "teletechnical"}
  ],
  "dom": [
    {"name": "Gniazdo RJ45 kat.6 (LAN)", "unit": "szt", "base_material": 30, "base_labor": 45, "calc": "per_room", "factor": 1.5, "zakres": "teletechnical"},
    {"name": "Kabel UTP kat.6", "unit": "mb", "base_material": 3.5, "base_labor": 12, "calc": "per_area", "factor": 2.0, "zakres": "teletechnical"},
    {"name": "Gniazdo TV/SAT", "unit": "szt", "base_material": 22, "base_labor": 35, "calc": "per_room", "factor": 0.8, "zakres": "teletechnical"},
    {"name": "Patch panel + switch", "unit": "szt", "base_material": 350, "base_labor": 120, "calc": "fixed", "factor": 1, "zakres": "teletechnical"}
  ],
  "biuro": [
    {"name": "Gniazdo RJ45 kat.6A (LAN)", "unit": "szt", "base_material": 45, "base_labor": 50, "calc": "per_area", "factor": 0.2, "zakres": "teletechnical"},
    {"name": "Kabel UTP kat.6A", "unit": "mb", "base_material": 5.0, "base_labor": 14, "calc": "per_area", "factor": 3.0, "zakres": "teletechnical"},
    {"name": "Switch PoE 24-portowy", "unit": "szt", "base_material": 900, "base_labor": 150, "calc": "per_area", "factor": 0.005, "zakres": "teletechnical"},
    {"name": "Access Point WiFi 6 (sufitowy)", "unit": "szt", "base_material": 450, "base_labor": 80, "calc": "per_area", "factor": 0.02, "zakres": "teletechnical"},
    {"name": "Szafa rack 12U", "unit": "szt", "base_material": 650, "base_labor": 200, "calc": "fixed", "factor": 1, "zakres": "teletechnical"}
  ],
  "przemysl": [
    {"name": "Kabel UTP kat.6 (siec przemyslowa)", "unit": "mb", "base_material": 4.0, "base_labor": 14, "calc": "per_area", "factor": 0.5, "zakres": "teletechnical"},
    {"name": "Switch przemyslowy DIN", "unit": "szt", "base_material": 1200, "base_labor": 180, "calc": "fixed", "factor": 1, "zakres": "teletechnical"},
    {"name": "Kamera IP tubowa IP66", "unit": "szt", "base_material": 380, "base_labor": 120, "calc": "per_area", "factor": 0.005, "zakres": "teletechnical"}
  ],
  "hotel": [
    {"name": "Gniazdo RJ45 kat.6 (TV/Internet)", "unit": "szt", "base_material": 30, "base_labor": 45, "calc": "per_room", "factor": 2.0, "zakres": "teletechnical"},
    {"name": "Kabel UTP kat.6", "unit": "mb", "base_material": 3.5, "base_labor": 12, "calc": "per_area", "factor": 2.5, "zakres": "teletechnical"},
    {"name": "Access Point WiFi (per pietro)", "unit": "szt", "base_material": 380, "base_labor": 80, "calc": "per_area", "factor": 0.008, "zakres": "teletechnical"},
    {"name": "Szafa rack 12U (serwerownia)", "unit": "szt", "base_material": 800, "base_labor": 250, "calc": "fixed", "factor": 1, "zakres": "teletechnical"}
  ],
  "szkola": [
    {"name": "Kabel UTP kat.6 (LAN)", "unit": "mb", "base_material": 3.5, "base_labor": 12, "calc": "per_area", "factor": 2.5, "zakres": "teletechnical"},
    {"name": "Access Point WiFi 6", "unit": "szt", "base_material": 450, "base_labor": 80, "calc": "per_room", "factor": 0.3, "zakres": "teletechnical"},
    {"name": "Switch PoE 24-portowy", "unit": "szt", "base_material": 900, "base_labor": 150, "calc": "per_area", "factor": 0.004, "zakres": "teletechnical"}
  ],
  "sklep": [
    {"name": "Kamera IP dome sufitowa", "unit": "szt", "base_material": 320, "base_labor": 100, "calc": "per_area", "factor": 0.015, "zakres": "teletechnical"},
    {"name": "Kabel UTP kat.6 (kasy/POS)", "unit": "mb", "base_material": 3.5, "base_labor": 12, "calc": "per_area", "factor": 1.0, "zakres": "teletechnical"}
  ],
  "parking": [
    {"name": "Kamera IP tubowa IP66", "unit": "szt", "base_material": 380, "base_labor": 120, "calc": "per_area", "factor": 0.006, "zakres": "teletechnical"},
    {"name": "Kabel UTP kat.6", "unit": "mb", "base_material": 3.5, "base_labor": 12, "calc": "per_area", "factor": 0.4, "zakres": "teletechnical"}
  ]
}

alarm_rules = {
  "mieszkanie": [
    {"name": "Centrala alarmowa (8 stref)", "unit": "szt", "base_material": 450, "base_labor": 180, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Czujka PIR (ruchu)", "unit": "szt", "base_material": 85, "base_labor": 40, "calc": "per_room", "factor": 0.8, "zakres": "alarm"},
    {"name": "Czujka magnetyczna (drzwi/okno)", "unit": "szt", "base_material": 45, "base_labor": 30, "calc": "per_room", "factor": 1.5, "zakres": "alarm"},
    {"name": "Sygnalizator wewnetrzny", "unit": "szt", "base_material": 120, "base_labor": 50, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Klawiatura LCD", "unit": "szt", "base_material": 280, "base_labor": 80, "calc": "fixed", "factor": 1, "zakres": "alarm"}
  ],
  "dom": [
    {"name": "Centrala alarmowa (16 stref)", "unit": "szt", "base_material": 750, "base_labor": 220, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Czujka PIR (ruchu)", "unit": "szt", "base_material": 85, "base_labor": 40, "calc": "per_room", "factor": 1.0, "zakres": "alarm"},
    {"name": "Czujka magnetyczna (drzwi/okno)", "unit": "szt", "base_material": 45, "base_labor": 30, "calc": "per_room", "factor": 2.0, "zakres": "alarm"},
    {"name": "Sygnalizator zewnetrzny (syrena)", "unit": "szt", "base_material": 350, "base_labor": 90, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Kamera IP zewnetrzna", "unit": "szt", "base_material": 420, "base_labor": 130, "calc": "fixed", "factor": 4, "zakres": "alarm"}
  ],
  "biuro": [
    {"name": "Centrala alarmowa adresowalna", "unit": "szt", "base_material": 1200, "base_labor": 300, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Czujka PIR (ruchu)", "unit": "szt", "base_material": 95, "base_labor": 45, "calc": "per_area", "factor": 0.05, "zakres": "alarm"},
    {"name": "Czytnik RFID (kontrola dostepu)", "unit": "szt", "base_material": 380, "base_labor": 120, "calc": "per_room", "factor": 0.3, "zakres": "alarm"},
    {"name": "Kamera IP dome sufitowa", "unit": "szt", "base_material": 320, "base_labor": 100, "calc": "per_area", "factor": 0.03, "zakres": "alarm"}
  ],
  "sklep": [
    {"name": "Centrala alarmowa", "unit": "szt", "base_material": 850, "base_labor": 250, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Czujka PIR (ruchu)", "unit": "szt", "base_material": 95, "base_labor": 45, "calc": "per_area", "factor": 0.04, "zakres": "alarm"},
    {"name": "Kamera IP dome 4K", "unit": "szt", "base_material": 480, "base_labor": 120, "calc": "per_area", "factor": 0.02, "zakres": "alarm"}
  ],
  "przemysl": [
    {"name": "Centrala alarmowa (32 strefy)", "unit": "szt", "base_material": 2200, "base_labor": 450, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Czujka PIR przemyslowa", "unit": "szt", "base_material": 150, "base_labor": 55, "calc": "per_area", "factor": 0.02, "zakres": "alarm"},
    {"name": "Kamera IP tubowa IP66", "unit": "szt", "base_material": 380, "base_labor": 120, "calc": "per_area", "factor": 0.008, "zakres": "alarm"},
    {"name": "Kontrola dostepu (czytnik + kontroler)", "unit": "szt", "base_material": 650, "base_labor": 200, "calc": "fixed", "factor": 4, "zakres": "alarm"}
  ],
  "hotel": [
    {"name": "Centrala alarmowa hotelowa", "unit": "szt", "base_material": 1800, "base_labor": 400, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Kamera IP dome sufitowa", "unit": "szt", "base_material": 320, "base_labor": 100, "calc": "per_area", "factor": 0.015, "zakres": "alarm"},
    {"name": "Zamek hotelowy RFID (pokoj)", "unit": "szt", "base_material": 580, "base_labor": 120, "calc": "per_room", "factor": 1.0, "zakres": "alarm"}
  ],
  "szkola": [
    {"name": "Centrala alarmowa szkolna", "unit": "szt", "base_material": 1500, "base_labor": 350, "calc": "fixed", "factor": 1, "zakres": "alarm"},
    {"name": "Czujka PIR", "unit": "szt", "base_material": 95, "base_labor": 45, "calc": "per_room", "factor": 0.5, "zakres": "alarm"},
    {"name": "Kamera IP dome sufitowa", "unit": "szt", "base_material": 320, "base_labor": 100, "calc": "per_area", "factor": 0.01, "zakres": "alarm"},
    {"name": "Kontrola dostepu (wejscie glowne)", "unit": "szt", "base_material": 650, "base_labor": 200, "calc": "fixed", "factor": 2, "zakres": "alarm"}
  ],
  "parking": [
    {"name": "Kamera IP tubowa IP66", "unit": "szt", "base_material": 380, "base_labor": 120, "calc": "per_area", "factor": 0.008, "zakres": "alarm"},
    {"name": "Szlaban z kontrola dostepu", "unit": "szt", "base_material": 3500, "base_labor": 600, "calc": "fixed", "factor": 2, "zakres": "alarm"}
  ]
}

smarthome_rules = {
  "mieszkanie": [
    {"name": "Sterownik oswietlenia (Zigbee/KNX)", "unit": "szt", "base_material": 380, "base_labor": 90, "calc": "per_room", "factor": 0.8, "zakres": "smarthome"},
    {"name": "Czujnik temperatury/wilgotnosci", "unit": "szt", "base_material": 180, "base_labor": 40, "calc": "per_room", "factor": 0.5, "zakres": "smarthome"},
    {"name": "Termostat inteligentny", "unit": "szt", "base_material": 450, "base_labor": 80, "calc": "fixed", "factor": 2, "zakres": "smarthome"},
    {"name": "Bramka smart home (hub)", "unit": "szt", "base_material": 650, "base_labor": 150, "calc": "fixed", "factor": 1, "zakres": "smarthome"}
  ],
  "dom": [
    {"name": "Sterownik oswietlenia KNX", "unit": "szt", "base_material": 480, "base_labor": 100, "calc": "per_room", "factor": 1.0, "zakres": "smarthome"},
    {"name": "Czujnik temperatury/wilgotnosci", "unit": "szt", "base_material": 180, "base_labor": 40, "calc": "per_room", "factor": 0.8, "zakres": "smarthome"},
    {"name": "Termostat inteligentny (strefa)", "unit": "szt", "base_material": 550, "base_labor": 90, "calc": "per_room", "factor": 0.4, "zakres": "smarthome"},
    {"name": "Panel dotykowy KNX 7cali", "unit": "szt", "base_material": 1200, "base_labor": 150, "calc": "per_room", "factor": 0.2, "zakres": "smarthome"},
    {"name": "Sterownik rolet/zaluzji KNX", "unit": "szt", "base_material": 380, "base_labor": 80, "calc": "per_room", "factor": 0.6, "zakres": "smarthome"},
    {"name": "Bramka KNX/IP", "unit": "szt", "base_material": 1800, "base_labor": 300, "calc": "fixed", "factor": 1, "zakres": "smarthome"}
  ],
  "biuro": [
    {"name": "Sterownik oswietlenia DALI", "unit": "szt", "base_material": 650, "base_labor": 120, "calc": "per_area", "factor": 0.02, "zakres": "smarthome"},
    {"name": "Czujnik obecnosci DALI", "unit": "szt", "base_material": 280, "base_labor": 60, "calc": "per_area", "factor": 0.04, "zakres": "smarthome"},
    {"name": "System BMS (serwer + licencja)", "unit": "szt", "base_material": 8500, "base_labor": 1200, "calc": "fixed", "factor": 1, "zakres": "smarthome"}
  ],
  "hotel": [
    {"name": "Sterownik pokojowy KNX (RCU)", "unit": "szt", "base_material": 1200, "base_labor": 180, "calc": "per_room", "factor": 1.0, "zakres": "smarthome"},
    {"name": "Panel dotykowy pokojowy 5cali", "unit": "szt", "base_material": 850, "base_labor": 120, "calc": "per_room", "factor": 1.0, "zakres": "smarthome"},
    {"name": "System zarzadzania hotelem (PMS)", "unit": "szt", "base_material": 12000, "base_labor": 2000, "calc": "fixed", "factor": 1, "zakres": "smarthome"}
  ]
}

ppoz_rules = {
  "mieszkanie": [
    {"name": "Czujka dymu (autonomiczna)", "unit": "szt", "base_material": 65, "base_labor": 25, "calc": "per_room", "factor": 0.4, "zakres": "ppoz"},
    {"name": "Czujka czadu CO", "unit": "szt", "base_material": 85, "base_labor": 25, "calc": "fixed", "factor": 1, "zakres": "ppoz"}
  ],
  "dom": [
    {"name": "Czujka dymu (autonomiczna)", "unit": "szt", "base_material": 65, "base_labor": 25, "calc": "per_room", "factor": 0.5, "zakres": "ppoz"},
    {"name": "Czujka czadu CO", "unit": "szt", "base_material": 85, "base_labor": 25, "calc": "fixed", "factor": 2, "zakres": "ppoz"}
  ],
  "biuro": [
    {"name": "Centrala SSP adresowalna", "unit": "szt", "base_material": 3500, "base_labor": 600, "calc": "fixed", "factor": 1, "zakres": "ppoz"},
    {"name": "Czujka dymu adresowalna", "unit": "szt", "base_material": 180, "base_labor": 55, "calc": "per_area", "factor": 0.05, "zakres": "ppoz"},
    {"name": "Reczny ostrzegacz pozarowy (ROP)", "unit": "szt", "base_material": 120, "base_labor": 45, "calc": "per_room", "factor": 0.3, "zakres": "ppoz"},
    {"name": "Kabel HDGs 2x1mm2 (p.poz.)", "unit": "mb", "base_material": 6.5, "base_labor": 15, "calc": "per_area", "factor": 2.0, "zakres": "ppoz"}
  ],
  "przemysl": [
    {"name": "Centrala SSP adresowalna (duza)", "unit": "szt", "base_material": 6500, "base_labor": 900, "calc": "fixed", "factor": 1, "zakres": "ppoz"},
    {"name": "Czujka dymu adresowalna", "unit": "szt", "base_material": 180, "base_labor": 55, "calc": "per_area", "factor": 0.03, "zakres": "ppoz"},
    {"name": "Czujka termiczna (hala)", "unit": "szt", "base_material": 160, "base_labor": 55, "calc": "per_area", "factor": 0.02, "zakres": "ppoz"},
    {"name": "Kabel HDGs 2x1mm2", "unit": "mb", "base_material": 6.5, "base_labor": 15, "calc": "per_area", "factor": 1.0, "zakres": "ppoz"}
  ],
  "hotel": [
    {"name": "Centrala SSP adresowalna", "unit": "szt", "base_material": 4500, "base_labor": 700, "calc": "fixed", "factor": 1, "zakres": "ppoz"},
    {"name": "Czujka dymu adresowalna (pokoj)", "unit": "szt", "base_material": 180, "base_labor": 55, "calc": "per_room", "factor": 1.2, "zakres": "ppoz"},
    {"name": "Sygnalizator akustyczno-optyczny", "unit": "szt", "base_material": 220, "base_labor": 60, "calc": "per_area", "factor": 0.015, "zakres": "ppoz"},
    {"name": "Kabel HDGs 2x1mm2", "unit": "mb", "base_material": 6.5, "base_labor": 15, "calc": "per_area", "factor": 2.5, "zakres": "ppoz"}
  ],
  "szkola": [
    {"name": "Centrala SSP adresowalna", "unit": "szt", "base_material": 4000, "base_labor": 650, "calc": "fixed", "factor": 1, "zakres": "ppoz"},
    {"name": "Czujka dymu adresowalna", "unit": "szt", "base_material": 180, "base_labor": 55, "calc": "per_area", "factor": 0.04, "zakres": "ppoz"},
    {"name": "Reczny ostrzegacz pozarowy (ROP)", "unit": "szt", "base_material": 120, "base_labor": 45, "calc": "per_room", "factor": 0.2, "zakres": "ppoz"},
    {"name": "Kabel HDGs 2x1mm2", "unit": "mb", "base_material": 6.5, "base_labor": 15, "calc": "per_area", "factor": 2.0, "zakres": "ppoz"}
  ],
  "sklep": [
    {"name": "Centrala SSP", "unit": "szt", "base_material": 3200, "base_labor": 550, "calc": "fixed", "factor": 1, "zakres": "ppoz"},
    {"name": "Czujka dymu adresowalna", "unit": "szt", "base_material": 180, "base_labor": 55, "calc": "per_area", "factor": 0.04, "zakres": "ppoz"},
    {"name": "Kabel HDGs 2x1mm2", "unit": "mb", "base_material": 6.5, "base_labor": 15, "calc": "per_area", "factor": 1.5, "zakres": "ppoz"}
  ],
  "parking": [
    {"name": "Centrala SSP (garaz)", "unit": "szt", "base_material": 3800, "base_labor": 600, "calc": "fixed", "factor": 1, "zakres": "ppoz"},
    {"name": "Czujka liniowa dymu (wiazka)", "unit": "szt", "base_material": 1200, "base_labor": 250, "calc": "per_area", "factor": 0.003, "zakres": "ppoz"},
    {"name": "Kabel HDGs 2x1mm2", "unit": "mb", "base_material": 6.5, "base_labor": 15, "calc": "per_area", "factor": 0.8, "zakres": "ppoz"}
  ]
}

target = os.path.join("lib", "data", "json", "quick-estimate-rules.json")
with open(target, "r", encoding="utf-8") as f:
    data = json.load(f)

data["teletechnical_rules"] = teletechnical_rules
data["alarm_rules"] = alarm_rules
data["smarthome_rules"] = smarthome_rules
data["ppoz_rules"] = ppoz_rules

with open(target, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

size = os.path.getsize(target)
print(f"OK — all rules written. File: {target}, size: {size} bytes")
