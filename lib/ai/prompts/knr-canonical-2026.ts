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
 * Codes below are ElektroSmart norms. They are not ORGBUD table numbers.
 * The same code must describe one job. Do not invent a second number for it.
 *
 * Last calibration: Apr 2026 (scaca-project regression fix).
 */

/** Core labor norms for common residential/commercial electrical work. */
export const KNR_CANONICAL_2026_ELEKTRYKA = `KNR 5-08 (INSTALACJE ELEKTRYCZNE NISKONAPIĘCIOWE — 2026):

UKŁADANIE KABLI I PRZEWODÓW (p/t w bruździe lub rurce):
• Przewód YDYp 3×1,5 mm²         KNR 5-08 0201   0,130 rbh/m
• Przewód YDYp 3×2,5 mm²         KNR 5-08 0202   0,160 rbh/m
• Przewód YDYp 5×2,5 mm²         KNR 5-08 0203   0,200 rbh/m
• Przewód YDYp 5×4 mm²           KNR 5-08 0204   0,240 rbh/m
• Przewód YDYp 5×6 mm²           KNR 5-08 0205   0,280 rbh/m
• Kabel YKXs 5×10 mm²            KNR 5-08 0206   0,320 rbh/m
• Kabel YKXs 5×16 mm²            KNR 5-08 0207   0,380 rbh/m
• Kabel YKXs 5×25 mm²            KNR 5-08 0208   0,460 rbh/m
• Kabel NHXMH 3×1,5 mm² (bezhal) KNR 5-08 0301B  0,090 rbh/m  (biuro/szkoła/SSP)
• Kabel NHXMH 5×2,5 mm²          KNR 5-08 0303B  0,120 rbh/m
• Kabel HDGs 2×1,0 mm² (p.poż.)  KNR 5-08 0605   0,080 rbh/m
• Kabel YAKY alu 4×35 mm²        KNR AT-26 0501  0,200 rbh/m

BRUZDY I PRACE MUROWE (godziny już zawierają podłoże, nie mnożyć drugi raz):
• Bruzdowanie w cegle            KNR 5-08 0101   0,850 rbh/m
• Bruzdowanie w silikacie        KNR 5-08 0111   1,100 rbh/m
• Bruzdowanie w betonie          KNR 5-08 0103   2,000 rbh/m
• Bruzdowanie w żelbecie         KNR 5-08 0110   2,500 rbh/m
• Bruzdowanie w gazobetonie      KNR 5-08 0112   0,550 rbh/m
• Bruzdowanie w G-K             KNR 5-08 0104   0,180 rbh/m
• Zatynkowanie bruzdy            KNR 5-08 0107   0,120 rbh/m

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
• Gniazdo 230V z USB                        KNR 5-08 0404   0,720 rbh/szt
• Gniazdo 230V IP44                         KNR 5-08 0405   0,980 rbh/szt
• Gniazdo 230V natynkowe                    KNR 5-08 0406   0,540 rbh/szt
• Gniazdo CEE 16A 5P 400V                   KNR 5-08 0408   1,180 rbh/szt
• Gniazdo CEE 32A 5P 400V                   KNR 5-08 0409   1,450 rbh/szt
• Gniazdo CEE 63A 5P                        KNR 5-08 0419   1,800 rbh/szt
• Łącznik 1-klaw. p/t                       KNR 5-08 0501   0,450 rbh/szt
• Łącznik 2-klaw. p/t                       KNR 5-08 0502   0,540 rbh/szt
• Łącznik schodowy                          KNR 5-08 0503   0,540 rbh/szt
• Łącznik krzyżowy                          KNR 5-08 0504   0,600 rbh/szt
• Plafon / oprawa sufitowa                  KNR 5-08 1401   0,680 rbh/szt
• Downlight / oczko                         KNR 5-08 1402   0,310 rbh/szt
• Kinkiet                                   KNR 5-08 1405   0,650 rbh/szt
• Panel LED 60×60                           KNR 5-08 1404   0,720 rbh/szt
• Oprawa zewnętrzna IP65                    KNR 5-08 1431   0,600 rbh/szt
• Oprawa awaryjna                           KNR 5-08 1409   0,600 rbh/szt
• Wypust oświetleniowy                      KNR 5-08 0701   0,200 rbh/szt

APARATURA MODUŁOWA NA SZYNIE TH35 (rozdzielnica):
• MCB 1P nadprądowy B/C          KNR 5-08 1501   0,200 rbh/szt
• MCB 3P nadprądowy              KNR 5-08 1503   0,300 rbh/szt
• RCD 4P różnicowoprądowy        KNR 5-08 1502   0,300 rbh/szt
• RCBO 1P+N (MCB+RCD)            KNR 5-08 0221   0,200 rbh/szt
• SPD T1/T2 ogranicznik przepięć KNR 5-08 0231   0,400 rbh/szt
• SPD T1 klasa I                 KNR 5-11 0113   0,600 rbh/szt
• SPD T1+T2 kombinowany          KNR 5-11 0114   0,800 rbh/szt
• Wyłącznik główny / rozłącznik izolacyjny  KNR 5-08 1506   0,350 rbh/szt
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

/** Material shop prices are not stored here. The electrician types them. */
export const KNR_CANONICAL_2026_MATERIAL_PRICES = `Nie podawaj cen materiałów. Cena jest pusta, dopóki elektryk jej nie wpisze.`;

/** Region is applied on the estimate screen. Do not bake a złoty rate here. */
export const KNR_CANONICAL_2026_REGIONAL_RATES = `Nie mnoż stawki przez województwo i nie podstawiaj 75 ani 95 zł. Stawka należy do elektryka.`;

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
].join("\n");

/** Krótki reference dla mniejszych prompts (bez cennika i regionów). */
export const KNR_CANONICAL_2026_COMPACT = [
  KNR_CANONICAL_2026_IRON_RULES,
  "",
  KNR_CANONICAL_2026_ELEKTRYKA,
].join("\n");
