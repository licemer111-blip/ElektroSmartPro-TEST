/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CANONICAL KNR 2026 REFERENCE — Single Source of Truth for AI Prompts
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * All AI prompts (Generator, Assemblies, Estimator, Importer, Quick-Estimate,
 * Catalog, Automation, Creator) MUST reference this file for KNR codes and
 * labor norms. This prevents systematic pricing errors caused by prompts
 * containing outdated KNR 5-04 (2015) codes with wrong norms.
 *
 * Source: Real 2026 KNR norms from our DB (public.knr_norms) +
 * JSON seeds (data/knr/fixed_norms/*.json) — validated by L2 lookup engine.
 *
 * ⛔ DO NOT add KNR 5-04 codes here. Series 5-04 (2015) is DEPRECATED.
 * ✅ Use KNR 5-08 (2026) for elektryka, KNR 5-09 for teletechnika,
 *    KNR 5-10 for przemysł, KNR 5-11 for PV, KNR 4-03 for demontaż/pomiary.
 *
 * Last calibration: Apr 2026 (scaca-project regression fix).
 */

/** Core labor norms for common residential/commercial electrical work. */
export const KNR_CANONICAL_2026_ELEKTRYKA = `KNR 5-08 (INSTALACJE ELEKTRYCZNE NISKONAPIĘCIOWE — 2026):

UKŁADANIE KABLI I PRZEWODÓW (p/t w bruździe lub rurce):
• Przewód YDYp 3×1,5 mm²         KNR 5-08 0201   0,130 rbh/m
• Przewód YDYp 3×2,5 mm²         KNR 5-08 0202   0,160 rbh/m
• Przewód YDYp 5×2,5 mm²         KNR 5-08 0203   0,180 rbh/m
• Przewód YDYp 5×4 mm²           KNR 5-08 0204   0,200 rbh/m
• Przewód YDYp 5×6 mm²           KNR 5-08 0205c  0,240 rbh/m
• Kabel YKXs 5×10 mm²            KNR 5-08 0206   0,320 rbh/m
• Kabel YKXs 5×16 mm²            KNR 5-08 0207   0,380 rbh/m
• Kabel YKXs 5×25 mm²            KNR 5-08 0208   0,460 rbh/m
• Kabel NHXMH 3×1,5 mm² (bezhal) KNR 5-08 0301B  0,090 rbh/m  (biuro/szkoła/SSP)
• Kabel NHXMH 5×2,5 mm²          KNR 5-08 0303B  0,120 rbh/m
• Kabel HDGs 2×1,0 mm² (p.poż.)  KNR 5-08 0605   0,080 rbh/m
• Kabel YAKY alu 4×35 mm²        KNR AT-26 0501  0,200 rbh/m

BRUZDY I PRACE MUROWE:
• Bruzdowanie w cegle/silikat    KNR 5-08 0101   0,850 rbh/m
• Bruzdowanie w betonie          KNR 5-08 0101b  1,200 rbh/m  (z surface modifier 1.5×)
• Bruzdowanie w żelbet/monolit   KNR 5-08 0101z  1,900 rbh/m  (z surface modifier 2.25×)
• Bruzdowanie w gazobet/ytong    KNR 5-08 0101g  0,650 rbh/m
• Bruzdowanie w g-k/karton-gips  KNR 5-08 0101k  0,450 rbh/m
• Zamurowanie bruzdy             KNR 4-03 0105   0,250 rbh/m

RURY I TRASY (n/t lub w wylewce):
• Rura karbowana (peszla) fi 20  KNR 5-08 0801   0,080 rbh/m
• Rura karbowana fi 25-32        KNR 5-08 0802   0,100 rbh/m
• Rura karbowana fi 40-50        KNR 5-08 0803   0,130 rbh/m
• Rura PVC RS fi 25-32 p/t       KNR 5-08 0804   0,150 rbh/m
• Rura PVC RL fi 20 n/t          KNR 5-08 0805   0,090 rbh/m
• Koryto kablowe 40×25 mm n/t    KNR 5-08 0701c  0,100 rbh/m
• Koryto kablowe 100×60 mm       KNR 5-08 0703c  0,150 rbh/m

PUSZKI:
• Puszka p/t PVC fi 60/68 mm     KNR 5-08 0301   0,120 rbh/szt
• Puszka rozgałęźna p/t          KNR 5-08 0302   0,180 rbh/szt
• Puszka hermetyczna IP55 n/t    KNR 5-08 0303   0,200 rbh/szt

GNIAZDA / WYŁĄCZNIKI / OPRAWY:
• Gniazdo 230V/16A pojedyncze Schuko p/t    KNR 5-08 0401   0,680 rbh/szt
• Gniazdo 230V/16A podwójne Schuko p/t      KNR 5-08 0402   0,820 rbh/szt
• Gniazdo 230V/16A potrójne p/t             KNR 5-08 0403   0,950 rbh/szt
• Gniazdo 230V/16A n/t (natynkowe)          KNR 5-08 0404   0,550 rbh/szt
• Gniazdo 230V IP44 bryzgoszczelne          KNR 5-08 0405   0,980 rbh/szt
• Gniazdo 230V IP55/IP67 zewnętrzne         KNR 5-08 0406   1,100 rbh/szt
• Gniazdo z USB A+C               KNR 5-08 0408   0,780 rbh/szt
• Floorbox podłogowy              KNR 5-08 0409   1,800 rbh/szt
• Wyłącznik 1-klaw. p/t           KNR 5-08 0501   0,450 rbh/szt
• Wyłącznik 2-klaw. p/t           KNR 5-08 0503   0,600 rbh/szt
• Wyłącznik schodowy (1 z 2)      KNR 5-08 0504   0,500 rbh/szt
• Wyłącznik krzyżowy              KNR 5-08 0505   0,550 rbh/szt
• Wyłącznik z ramką rolet/żaluzji KNR 5-08 0506   0,700 rbh/szt
• Oprawa LED panel sufitowy 60×60 KNR 5-08 0501o  0,680 rbh/szt
• Oprawa LED downlight p/t        KNR 5-08 0502   0,310 rbh/szt  (+1.25× sufit wysoki)
• Oprawa LED natynkowa / kinkiet  KNR 5-08 0503o  0,500 rbh/szt
• Oprawa zewnętrzna IP65 LED      KNR 5-08 0701   0,600 rbh/szt
• Naświetlacz LED ≤100W           KNR 5-08 0702o  0,800 rbh/szt
• Naświetlacz LED >100W           KNR 5-08 0703o  1,200 rbh/szt
• Oprawa awaryjna LED 3h          KNR 5-08 0801o  0,550 rbh/szt
• Oprawa ewakuacyjna EXIT         KNR 5-08 0802o  0,450 rbh/szt
• Wypust oświetleniowy (puszka suf.) KNR 5-08 0701w 0,200 rbh/szt

APARATURA MODUŁOWA NA SZYNIE TH35 (rozdzielnica):
• MCB 1P nadprądowy B/C          KNR 5-08 0201a  0,150 rbh/szt
• MCB 2P nadprądowy              KNR 5-08 0202a  0,200 rbh/szt
• MCB 3P nadprądowy              KNR 5-08 0203a  0,250 rbh/szt
• RCD 2P różnicowoprądowy        KNR 5-08 0211   0,250 rbh/szt
• RCD 4P różnicowoprądowy        KNR 5-08 0212   0,300 rbh/szt
• RCBO 1P+N (MCB+RCD)            KNR 5-08 0221   0,200 rbh/szt
• SPD T1/T2 ogranicznik przepięć KNR 5-08 0231   0,400 rbh/szt
• SPD T1 klasa I                 KNR 5-11 0113   0,600 rbh/szt
• SPD T1+T2 kombinowany          KNR 5-11 0114   0,800 rbh/szt
• Wyłącznik główny / rozłącznik izolacyjny  KNR 5-08 0205   0,350 rbh/szt
• Rozłącznik sieć-agregat        KNR 5-08 0241   0,350 rbh/szt
• Złączka szynowa ZUG L/N        KNR 5-08 0301sz 0,100 rbh/szt
• Złączka szynowa PE żółto-ziel. KNR 5-08 0310   0,100 rbh/szt

ROZDZIELNICE (obudowa + pełny montaż aparatury + testy):
• Rozdzielnica mieszkaniowa 12-mod p/t   KNR 5-08 0111r  2,000 rbh/szt
• Rozdzielnica mieszkaniowa 24-mod p/t   KNR 5-08 0112r  3,000 rbh/szt
• Rozdzielnica mieszkaniowa 36-mod p/t   KNR 5-08 0113r  4,000 rbh/szt
• Rozdzielnica mieszkaniowa 48-mod p/t   KNR 5-08 0114r  5,500 rbh/szt
• Rozdzielnica biurowa/hotelowa 72-mod   KNR 5-08 0115r  7,500 rbh/szt
• Rozdzielnica biurowa 96-mod            KNR 5-08 0116r  10,000 rbh/szt
• Rozdzielnica przemysł. IP44 ≤32A       KNR 5-10 0201   4,000 rbh/szt
• Rozdzielnica budowlana RB ≤63A         KNR 5-10 0202   5,000 rbh/szt
• Uruchomienie + test rozdzielnicy mieszk.  KNR 5-08 0191  1,500 rbh/kpl

WLZ I PRZYŁĄCZA:
• WLZ YKXs 5×10-25mm² p/t w bruździe     KNR 5-08 0251w  0,400 rbh/m
• WLZ YKXs 5×35-50mm² w korycie          KNR 5-08 0252w  0,500 rbh/m
• WLZ YKXs 5×70-120mm² w korycie         KNR 5-08 0253w  0,700 rbh/m
• Przyłącze kablowe nN (ZK)              KNR 5-08 1301p  6,000 rbh/szt
• Złącze kablowe nN (ZK)                 KNR 5-08 1311p  2,500 rbh/szt

UZIEMIENIE I ODGROMOWA (KNR 5-11):
• Bednarka FeZn 30×4 na dachu            KNR 5-11 0101   0,250 rbh/m
• Uziom pionowy pręt 1,5-3m              KNR 5-11 0102   1,000 rbh/szt
• Uziom otokowy taśmowy (bednarka)       KNR 5-11 0103   0,040 rbh/m
• Uziom fundamentowy                     KNR 5-11 0104   0,030 rbh/m
• Szyna wyrównawcza Cu (GSW)             KNR 5-11 0105   1,500 rbh/szt

POMIARY I ODBIORY (KNR 5-08 Rozdz. 09 / KNR 4-03):
• Pomiar rezystancji izolacji obwodu     KNR 5-08 9101   0,250 rbh/szt
• Pomiar ciągłości przewodów PE          KNR 5-08 9102   0,150 rbh/szt
• Pomiar impedancji pętli zwarcia Zs     KNR 5-08 9103   0,200 rbh/szt
• Pomiar i test RCD (30/100/300 mA)      KNR 5-08 9104   0,200 rbh/szt
• Pomiar rezystancji uziomu              KNR 5-08 9105   1,500 rbh/szt
• Pomiar prądu upływu GFCI               KNR 5-08 9115   0,300 rbh/szt
• Pomiar instalacji odgromowej z protok. KNR 5-08 9305   3,000 rbh/kpl
• Sprawdzenie i próba SPD                KNR 5-08 9306   1,000 rbh/szt
• Protokół odbioru instalacji (komplet)  KNR 5-08 9999   2,000 rbh/kpl`;

/** Teletechnika / LAN / CCTV / SSWiN / SSP / domofon. */
export const KNR_CANONICAL_2026_TELETECHNIKA = `KNR 5-09 (INSTALACJE TELETECHNICZNE — 2026):

SIEĆ LAN / IT:
• Kabel UTP Cat5e 4×2×0,5 mm²          KNR 5-09 0101   0,080 rbh/m
• Kabel S/FTP Cat6A                    KNR 5-09 0102   0,100 rbh/m
• Gniazdo RJ45 pojedyncze p/t keystone KNR 5-09 0105   0,400 rbh/szt
• Gniazdo RJ45 podwójne p/t keystone   KNR 5-09 0106   0,500 rbh/szt
• Patch panel 24-port 19"              KNR 5-09 0108   1,500 rbh/szt
• Switch zarządzany PoE+ 24-port       KNR 5-09 0109   1,200 rbh/szt
• Szafa RACK 19" 24U                   KNR 5-09 0110   3,000 rbh/szt
• Access Point WiFi 6                  KNR 5-09 0111   0,800 rbh/szt

CCTV / MONITORING:
• Kamera IP dome wewn. 2-4Mpx          KNR 5-09 0201   0,800 rbh/szt
• Kamera IP tubowa zewn. 2-8Mpx IP66   KNR 5-09 0202   1,000 rbh/szt
• Kamera PTZ 4K                        KNR 5-09 0203   1,800 rbh/szt
• Rejestrator NVR 8-kan.               KNR 5-09 0205   2,000 rbh/szt
• Rejestrator NVR 16-kan.              KNR 5-09 0206   3,000 rbh/szt

SSWiN (ALARM) / KONTROLA DOSTĘPU:
• Centrala alarmowa do 8 stref         KNR 5-09 0301   4,000 rbh/szt
• Centrala alarmowa >8 stref           KNR 5-09 0302   6,000 rbh/szt
• Czujka PIR                           KNR 5-09 0303   0,300 rbh/szt
• Czujka dualna PIR+MW                 KNR 5-09 0304   0,400 rbh/szt
• Czujka magnetyczna                   KNR 5-09 0305   0,200 rbh/szt
• Sygnalizator optyczno-akust.         KNR 5-09 0306   0,600 rbh/szt
• Klawiatura alarmowa                  KNR 5-09 0307   0,500 rbh/szt
• Czytnik RFID EM/MIFARE               KNR 5-09 0401   0,600 rbh/szt
• Kontroler dostępu 1-drzwiowy         KNR 5-09 0403   1,200 rbh/szt
• Elektrozaczep/zamek elektromagn.     KNR 5-09 0404   0,800 rbh/szt

DOMOFON / WIDEODOMOFON:
• Panel zewn. wideodomofonu IP54       KNR 5-09 0501   1,000 rbh/szt
• Monitor wideodomofonu                KNR 5-09 0502   0,800 rbh/szt
• Unifon domofonowy                    KNR 5-09 0503   0,500 rbh/szt

KABLOWANIE SYGNAŁOWE:
• Kabel YTDY 2×0,5 mm² (sygnal.)       KNR 5-09 0701   0,060 rbh/m
• Kabel YNTKSY 2×0,8 (SSP konwenc.)    KNR 5-09 0702   0,080 rbh/m
• Kabel magistrali KNX TP              KNR 5-09 0703   0,070 rbh/m`;

/** SSP / P-POŻ system (oddzielny modul, specjalistyczne normy). */
export const KNR_CANONICAL_2026_SSP = `SSP / P-POŻ (KNR 5-06 / ES-KNR-SSP-ADDR):

• Centrala SSP konwencjonalna strefowa    KNR 5-06 0601   4,000 rbh/szt
• Centrala SSP adresowalna                KNR 5-06 0602   6,000 rbh/szt
• Czujka dymu adresowalna + podstawa      KNR 5-06 0612   0,400 rbh/szt
• Czujka dymu konwencjonalna              KNR 5-06 0613   0,300 rbh/szt
• Czujka ciepła adresowalna               KNR 5-06 0614   0,400 rbh/szt
• ROP (ręczny ostrzegacz pożaru)          KNR 5-06 0621   0,500 rbh/szt
• Sygnalizator optyczno-akust. SSP        KNR 5-06 0631   0,700 rbh/szt
• Zasilacz buforowy 24V SSP               KNR 5-06 0641   1,500 rbh/szt
• Kabel HDGs 2×1,0 mm² (p.poż. bezhal.)   KNR 5-06 0605   0,080 rbh/m
• Próba funkcjonalna SSP + protokół       KNR 5-06 0991   2,500 rbh/kpl

RBH MULTIPLIER: SSP adresowalny → ×1.35 (specjalista z uprawnieniami SEP D+E).`;

/** Hale / przemysł / tory oświetlenia / maszyny. */
export const KNR_CANONICAL_2026_PRZEMYSL = `KNR 5-10 (INSTALACJE PRZEMYSŁOWE — HALE/MAGAZYNY — 2026):

TRASY CIĘŻKIE:
• Drabinka kablowa 100 mm              KNR 5-10 1201   0,180 rbh/m
• Drabinka kablowa 200 mm              KNR 5-10 1202   0,200 rbh/m
• Drabinka kablowa 400 mm              KNR 5-10 1203   0,250 rbh/m
• Drabinka kablowa 600 mm              KNR 5-10 1204   0,300 rbh/m
• Rura stalowa BST fi 20-32            KNR 5-10 1205   0,180 rbh/m

GNIAZDA PRZEMYSŁOWE CEE:
• Gniazdo CEE 16A/3P                   KNR 5-10 0601   0,500 rbh/szt
• Gniazdo CEE 16A/5P (3-faz)           KNR 5-10 0602   0,500 rbh/szt
• Gniazdo CEE 32A/5P                   KNR 5-10 0603   0,600 rbh/szt
• Gniazdo CEE 63A/5P                   KNR 5-10 0604   0,800 rbh/szt
• Gniazdo CEE 125A/5P                  KNR 5-10 0605   1,200 rbh/szt

OŚWIETLENIE PRZEMYSŁOWE:
• HighBay LED ≤150W                    KNR 5-10 0801   1,000 rbh/szt
• HighBay LED >150W                    KNR 5-10 0802   1,500 rbh/szt
• LowBay LED                           KNR 5-10 0803   0,800 rbh/szt
• Naświetlacz przemysłowy LED          KNR 5-10 0804   1,200 rbh/szt

SIŁA / MASZYNY:
• Podłączenie silnika 3-faz. ≤1,5 kW   KNR 5-10 0101   1,500 rbh/szt
• Podłączenie silnika 3-faz. >5,5 kW   KNR 5-10 0102   2,500 rbh/szt
• Falownik VFD ≤11 kW                  KNR 5-10 1101   3,000 rbh/szt
• Falownik VFD 11-45 kW                KNR 5-10 1102   5,000 rbh/szt`;

/** Fotowoltaika + EV + Magazyny energii. */
export const KNR_CANONICAL_2026_OZE = `KNR 5-11 / ES-KNR-OZE / ES-KNR-EV:

FOTOWOLTAIKA:
• Panel PV mono dach skośny (hak+szyna+klema)   ES-KNR-OZE 0101   0,450 rbh/szt
• Panel PV dach płaski z balastem               ES-KNR-OZE 0102   0,600 rbh/szt
• Inwerter 1-faz ≤6 kW (string/micro)           ES-KNR-OZE 0201   1,500 rbh/szt
• Inwerter 3-faz hybryda 10-15 kW (z backup)    ES-KNR-OZE 0202   2,500 rbh/szt
• Kabel solarny DC 4-6 mm² (H1Z2Z2-K)           ES-KNR-OZE 0301   0,100 rbh/m
• Zabezpieczenie DC (bezpiecznik/SPD DC)        ES-KNR-OZE 0303   0,350 rbh/szt
• SPD DC T2 dla PV                              ES-KNR-OZE 0304   0,400 rbh/szt
• Magazyn energii LiFePO4 do 10 kWh             ES-KNR-OZE 0401   3,000 rbh/szt
• Licznik dwukierunkowy (net-metering)          ES-KNR-OZE 0501   2,000 rbh/kpl
• Pomiary PV (izolacja DC, pętla AC, protokół)  ES-KNR-OZE 0601   2,500 rbh/kpl

EV / ŁADOWANIE:
• Wallbox AC 7,4 kW 1-faz. + podłączenie        ES-KNR-OZE 0701   2,500 rbh/szt
• Wallbox AC 11-22 kW 3-faz.                    ES-KNR-EV  0101   4,000 rbh/szt
• Stacja ładowania DC 50 kW                     ES-KNR-EV  0102   12,000 rbh/szt
• RCD Typ B dedyk. EV                           ES-KNR-EV  0104   1,000 rbh/szt
• SPD T2 dla infrastruktury EV                  ES-KNR-EV  0105   1,000 rbh/szt
• Konfiguracja OCPP + test EVSE                 ES-KNR-EV  0106   2,000 rbh/kpl

OGRZEWANIE ELEKTRYCZNE (KNR AT-26 / ES-KNR-OGR):
• Mata grzewcza elektr. pod płytki (do 5 m²)    ES-KNR-OGR 0101   0,500 rbh/m²
• Kabel grzewczy dwużyłowy pod jastrychem       ES-KNR-OGR 0201   0,150 rbh/m
• Folia grzewcza pod panele (do 10 m²)          ES-KNR-OGR 0401   0,350 rbh/m²
• Termostat cyfrowy z czujnikiem podłogi 16A    ES-KNR-OGR 0301   0,500 rbh/szt
• Grzejnik elektr. panelowy 500-2000W           ES-KNR-OGR 0501   0,600 rbh/szt
• Antyzamarzanie rynien — kabel grzewczy        ES-KNR-OGR 0701   0,200 rbh/m

KLIMATYZACJA / POMPY CIEPŁA (KNR AT-26 / Przylacza HVAC):
• Podłączenie klimy split ≤5 kW 1-faz.          KNR AT-26 0503a  1,500 rbh/szt
• Podłączenie klimy split >5 kW 3-faz.          KNR AT-26 0503b  3,000 rbh/szt
• Podłączenie pompy ciepła 3-faz. + RCD Typ B   KNR AT-26 0503p  6,000 rbh/szt`;

/** Ceny materiałów 2026 (NETTO PLN) — SEKOCENBUD Q1/2026 / Elektroskandia / Grodno. */
export const KNR_CANONICAL_2026_MATERIAL_PRICES = `CENNIK MATERIAŁÓW 2026 (NETTO PLN — SEKOCENBUD Q1/2026):

KABLE (za m):
• YDYp 3×1,5: 5,20   • YDYp 3×2,5: 7,20   • YDYp 5×2,5: 10,50
• YDYp 5×4:  13,50   • YDYp 5×6:  19,00   • YKXs 5×10: 28,00
• YKXs 5×16: 42,00   • YKXs 5×25: 62,00   • YKXs 5×35: 85,00
• NHXMH 3×1,5 (bezhal): 7,50   • NHXMH 5×2,5: 14,50
• HDGs 2×1,0 (p.poż.): 4,50    • YAKY 4×35 alu: 42,00
• UTP Cat5e: 1,50    • UTP Cat6: 2,20    • S/FTP Cat6A: 4,80
• YTDY 2×0,5: 1,30   • Kabel solarny DC 6mm²: 4,50

OSPRZĘT (za szt):
• Gniazdo 230V p/t pojedyncze: 22,00   • Gniazdo podwójne p/t: 30,00
• Gniazdo IP44 bryzgoszcz.: 35,00      • Gniazdo IP55 zewn.: 45,00
• Gniazdo z USB A+C: 55,00             • Gniazdo RJ45 keystone: 18,00
• Wyłącznik 1-klaw.: 14,00             • Wyłącznik 2-klaw.: 22,00
• Wyłącznik schodowy: 18,00            • Wyłącznik krzyżowy: 25,00
• Ramka pojedyncza Legrand Niloe: 8,00 • Puszka p/t PVC fi60: 3,00
• Puszka rozgałęźna p/t: 6,00          • Puszka hermet. IP55 n/t: 18,00
• Gniazdo CEE 16A/5P: 65,00            • Gniazdo CEE 32A/5P: 110,00
• Gniazdo CEE 63A/5P: 220,00           • Floorbox podłogowy: 340,00

APARATURA MODUŁOWA (za szt):
• MCB B16/1P: 14,00   • MCB C16/1P: 16,00   • MCB B16/3P: 42,00
• MCB C25/3P: 55,00   • MCB C32/3P: 62,00   • MCB C40/3P: 75,00
• RCD 40A/30mA/2P typ A: 105,00          • RCD 40A/30mA/4P: 175,00
• RCD 63A/300mA/4P (p.poż.): 215,00      • RCBO C16/30mA/1P+N: 75,00
• SPD T1+T2 1-faz.: 200,00               • SPD T2 3-faz.: 280,00
• Rozłącznik izolacyjny 3P 63A: 95,00    • Wyłącznik główny 25A 2P: 60,00
• MCCB 3P 125A: 480,00                   • Złączka szynowa ZUG L/N: 2,50

ROZDZIELNICE — OBUDOWY (mieszkaniowe):
• Rozdzielnica 12-mod n/t: 85,00      • Rozdzielnica 12-mod p/t: 140,00
• Rozdzielnica 24-mod n/t: 140,00     • Rozdzielnica 24-mod p/t: 220,00
• Rozdzielnica 36-mod p/t: 280,00     • Rozdzielnica 48-mod p/t: 360,00
• Rozdzielnica 72-mod p/t: 540,00     • Szafa stalowa 60×60×20: 450,00

OŚWIETLENIE:
• Oprawa LED panel 60×60 40W: 120,00  • Oprawa LED downlight 12W: 45,00
• HighBay LED 150W IP65: 420,00       • HighBay LED 300W: 780,00
• Naświetlacz LED 50W: 110,00         • Naświetlacz LED 100W: 200,00
• Oprawa awaryjna LED 3h: 145,00      • Oprawa EXIT LED: 110,00
• Oprawa hermetyczna LED 36W: 80,00   • Taśma LED 14,4W/m: 22,00/m
• Oprawa zewnętrzna LED IP65 40W: 180,00

TELETECHNIKA / CCTV / LAN:
• Kamera IP 4MP dome: 220,00          • Kamera IP 4MP bullet: 240,00
• Kamera IP PTZ 4K: 780,00            • Rejestrator NVR 8-kan: 520,00
• Rejestrator NVR 16-kan: 850,00      • Czujka PIR: 55,00
• Czujka dualna PIR+MW: 90,00         • Czujka dymu SSP adr.: 110,00
• Centrala alarm 8-str: 420,00        • Centrala SSP adr. (base): 4200,00
• Panel wideodomofonu IP54: 850,00    • Monitor wideodomofonu: 650,00
• Patch panel 24-port: 220,00         • Switch PoE+ 24-port: 1200,00
• Access Point WiFi 6: 450,00         • Szafa RACK 24U: 1400,00

FOTOWOLTAIKA / EV:
• Panel PV 400W monokrystal.: 420,00  • Panel PV 500W Half-Cut: 520,00
• Inwerter 1-faz 5 kW: 2800,00        • Inwerter 3-faz 10 kW: 5200,00
• Inwerter hybryda 15 kW: 9500,00     • Magazyn energii 10 kWh: 18000,00
• Wallbox 7,4 kW: 2200,00             • Wallbox 22 kW: 5200,00

TRASY:
• Rura karbowana fi 20: 1,20/m        • Rura karbowana fi 32: 2,20/m
• Rura PVC RS fi 25 sztywna: 2,80/m   • Koryto PVC 40×25: 8,50/m
• Koryto PVC 100×60: 28,00/m          • Drabinka kablowa 200 mm: 95,00/m
• Drabinka kablowa 400 mm: 170,00/m`;

/** Regionalne stawki robocizny 2026 (SEKOCENBUD Q1). Wzorcowa baseRate ≈ 95 PLN/h. */
export const KNR_CANONICAL_2026_REGIONAL_RATES = `STAWKI ROBOCIZNY 2026 (PLN/rbh NETTO — SEKOCENBUD Q1/2026):

Województwo                    Mnożnik  Stawka
────────────────────────────   ───────  ──────
Mazowieckie (Warszawa)          ×1,20    114
Dolnośląskie (Wrocław)          ×1,12    106
Małopolskie (Kraków)            ×1,10    104
Pomorskie (Gdańsk)              ×1,10    104
Śląskie (Katowice)              ×1,08    103
Wielkopolskie (Poznań)          ×1,06    101
Zachodniopomorskie (Szczecin)   ×1,02     97
Łódzkie (Łódź)                  ×1,00     95
Kujawsko-Pomorskie (Bydgoszcz)  ×0,96     91
Lubuskie (Zielona Góra)         ×0,96     91
Opolskie (Opole)                ×0,94     89
Lubelskie (Lublin)              ×0,92     87
Warmińsko-Mazurskie (Olsztyn)   ×0,92     87
Świętokrzyskie (Kielce)         ×0,90     86
Podkarpackie (Rzeszów)          ×0,88     84
Podlaskie (Białystok)           ×0,88     84

UWAGA: regionModifier stosowany AUTOMATYCZNIE przez silnik.
Podawaj zawsze ceny w stawce BAZOWEJ (bez wsp. regionalnego) — system
przelicza przy wyświetlaniu. NIE multipliuj region do ceny w odpowiedzi AI.`;

/** Iron Rules that MUST be respected by every AI that generates pricing. */
export const KNR_CANONICAL_2026_IRON_RULES = `ŻELAZNE ZASADY WYCENY 2026 (absolutne):

1️⃣ SERIA KODÓW — WYŁĄCZNIE KNR 5-08 (2026):
   ⛔ ZAKAZ: seria KNR 5-04 (stara, 2015) — BŁĘDNE NORMY, nie istnieje w bazie.
   ⛔ ZAKAZ: wymyślanie sufiksów "-01/-02/-03" gdy nie jesteś pewien.
   ✅ Jeśli nie znasz dokładnego kodu — podaj null (silnik znajdzie po nazwie).

2️⃣ MATERIAŁ I ROBOCIZNA — ZAWSZE OSOBNO:
   • material_price (PLN/jm) — cena netto materiału 2026
   • labor_price (PLN/jm) — koszt robocizny 2026
   • NIGDY nie sumuj M+L w jedną pozycję.

3️⃣ SANITY NORMS (samokontrola przed wysłaniem):
   • Gniazdo podwójne ZAWSZE > pojedyncze (norma 0,82 > 0,68 rbh).
   • Gniazdo IP44 ZAWSZE > zwykłe p/t (0,98 > 0,68 rbh).
   • MCB/RCD/SPD: norma APARATU na szynie 0,15-0,40 rbh/szt (NIGDY 5 rbh).
   • Rozdzielnica 24-mod p/t z aparaturą ≈ 3,0 rbh/szt (NIE 1320 PLN).
   • Przewód YDYp 3×1,5 ≈ 0,13 rbh/m (NIE 0,025 rbh/m).
   • Bruzdowanie w cegle ≈ 0,85 rbh/m (NIE 0,15 rbh/m).
   • Implied rate labor/norma nie może przekraczać baseRate × 1,8.

4️⃣ VAT (tylko informacyjnie — system stosuje automatycznie):
   • 8% — budynek mieszkalny jednorodzinny/wielorodzinny (materiał + usługa).
   • 23% — biuro, handel, przemysł, B2B, infrastruktura publiczna.

5️⃣ KOMPLETNOŚĆ OBWODU (Doktryna 360° — Iron Rule 6 ElektroSmart):
   Dla każdego punktu podtynkowego ZAWSZE generuj 5 elementów:
   a) URZĄDZENIE (gniazdo/wyłącznik/oprawa) — material
   b) PUSZKA (p/t PVC fi60) — material (KNR 5-08 0301)
   c) PRZEWÓD (YDYp odpowiedni) — material + labor (KNR 5-08 02xx)
   d) BRUZDOWANIE (wg materiału ściany) — labor (KNR 5-08 0101)
   e) MONTAŻ osprzętu — labor (KNR 5-08 04xx lub 05xx)

6️⃣ KOŃCÓWKA: każdy kosztorys MUSI mieć sekcję "Pomiary i odbiory":
   • Pomiar rezystancji izolacji (KNR 5-08 9101) — 1 na obwód
   • Pomiar ciągłości PE (KNR 5-08 9102) — 1 na obwód
   • Pomiar impedancji pętli (KNR 5-08 9103) — 1 na obwód
   • Pomiar i test RCD (KNR 5-08 9104) — 1 na RCD
   • Protokół odbioru (KNR 5-08 9999) — 1 kpl całości`;

/** Zbiorczy canonical reference dla prompts, które potrzebują pełnego bloku. */
export const KNR_CANONICAL_2026_FULL = [
  KNR_CANONICAL_2026_IRON_RULES,
  "",
  KNR_CANONICAL_2026_ELEKTRYKA,
  "",
  KNR_CANONICAL_2026_TELETECHNIKA,
  "",
  KNR_CANONICAL_2026_SSP,
  "",
  KNR_CANONICAL_2026_PRZEMYSL,
  "",
  KNR_CANONICAL_2026_OZE,
  "",
  KNR_CANONICAL_2026_MATERIAL_PRICES,
  "",
  KNR_CANONICAL_2026_REGIONAL_RATES,
].join("\n");

/** Krótki reference dla mniejszych prompts (bez cennika i regionów). */
export const KNR_CANONICAL_2026_COMPACT = [
  KNR_CANONICAL_2026_IRON_RULES,
  "",
  KNR_CANONICAL_2026_ELEKTRYKA,
].join("\n");
