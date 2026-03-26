export const GENERATOR_PROMPT = `<module_generator>
ZADANIE: Generowanie PROFESJONALNEGO kosztorysu z opisu projektu elektrycznego.

═══ ZASADY GENEROWANIA (KRYTYCZNE) ═══
1. KOMPLETNY kosztorys: materiały + robocizna jako OSOBNE pozycje (NIGDY łącznie).
2. POLSKIE NAZEWNICTWO TECHNICZNE: YDYp 3×2,5mm², nie "kabel 2.5".
3. Dopasuj do katalogu użytkownika jeśli dostępny.
4. Grupuj wg sekcji (Kuchnia, Łazienka, Salon, Garaż itp.) dla obiektów mieszkalnych.
5. KAŻDA robocizna → kod KNR obowiązkowy. Brak kodu → "szacunek" + isEstimate=true.
6. ZAWSZE końcowa pozycja: "Badania i pomiary odbiorcze" (KNR 5-04 0901-01).
7. Ceny NETTO PLN 2026 wg SEKOCENBUD Q1/2026 / Elektroskandia / TIM SA / Grodno.

═══ KATALOG KNR — KODY I NORMY ROBOCIZNY 2026 ═══

KNR 5-04 (INSTALACJE ELEKTRYCZNE NISKONAPIĘCIOWE — BUDOWNICTWO OGÓLNE):
UKŁADANIE KABLI I PRZEWODÓW:
• Kabel YDYp 3×1,5mm² p/t         0101-01  0,025 rbh/mb
• Kabel YDYp 3×2,5mm² p/t         0101-02  0,028 rbh/mb
• Kabel YDYp 5×2,5mm² p/t         0101-03  0,032 rbh/mb
• Kabel YDYp 5×4mm² p/t           0101-04  0,038 rbh/mb
• Kabel YDYp 5×6mm² p/t           0101-05  0,045 rbh/mb
• Kabel YKXs 5×10mm² p/t          0101-06  0,060 rbh/mb
• Kabel YKXs 5×16mm² p/t          0101-07  0,070 rbh/mb
• Kabel YKXs 5×25mm² p/t          0101-08  0,090 rbh/mb
• Kabel YKXs 5×35mm² p/t          0101-09  0,110 rbh/mb
• Kabel YKXs 5×50mm² p/t          0101-10  0,130 rbh/mb
• Kabel YKXs 5×70mm² p/t          0101-11  0,160 rbh/mb
• Kabel YKXs 5×95mm² p/t          0101-12  0,190 rbh/mb
• Kabel YKXs 5×120mm² p/t         0101-13  0,220 rbh/mb
• Kabel YKXs 5×150mm²             0101-14  0,260 rbh/mb
• Kabel YKXs 5×185mm²             0101-15  0,300 rbh/mb
• Kabel YKXs 5×240mm²             0101-16  0,380 rbh/mb
• Kabel NHXMH 3×2,5mm² (p.poż.)   0101-17  0,040 rbh/mb
• Kabel HDGs 2×1,0mm² (SSP)        0101-18  0,030 rbh/mb
• Kabel YAKY alu 4×35mm²           0101-19  0,055 rbh/mb
• Kabel YAKY alu 4×70mm²           0101-20  0,080 rbh/mb
• Kabel YAKY alu 4×120mm²          0101-21  0,110 rbh/mb
• Kabel YAKY alu 4×150mm²          0101-22  0,140 rbh/mb
• Kabel YAKY alu 4×240mm²          0101-23  0,200 rbh/mb
OSPRZĘT (MONTAŻ):
• Gniazdo 230V podtynkowe 1-kr.    0201-01  0,300 rbh/szt
• Gniazdo 230V natynkowe           0201-02  0,250 rbh/szt
• Gniazdo 230V podwójne p/t        0201-03  0,400 rbh/szt
• Gniazdo hermetyczne IP44         0201-04  0,450 rbh/szt
• Gniazdo hermetyczne IP55/IP67    0201-05  0,500 rbh/szt
• Wyłącznik 1-klaw. p/t            0201-06  0,250 rbh/szt
• Wyłącznik 2-klaw. p/t            0201-07  0,350 rbh/szt
• Wyłącznik schodowy               0201-08  0,350 rbh/szt
• Wyłącznik świecznikowy           0201-09  0,300 rbh/szt
• Wyłącznik krzyżowy               0201-10  0,350 rbh/szt
• Gniazdo z USB A+C                0201-11  0,350 rbh/szt
• Floorbox podłogowy               0201-12  1,500 rbh/szt
• Puszka instalacyjna p/t 60mm     0401-01  0,150 rbh/szt
• Puszka rozgałęźna p/t            0401-02  0,200 rbh/szt
• Puszka n/t                       0401-03  0,120 rbh/szt
OŚWIETLENIE (MONTAŻ):
• Oprawa LED panel 60×60cm         0301-01  0,500 rbh/szt
• Oprawa LED downlight p/t         0301-02  0,450 rbh/szt
• Oprawa LED natynkowa             0301-03  0,500 rbh/szt
• Oprawa LED hermetyczna IP65      0301-04  0,600 rbh/szt
• Oprawa LED kinkiet               0301-05  0,500 rbh/szt
• Oprawa LED zewnętrzna            0301-06  0,700 rbh/szt
• Naświetlacz LED ≤100W            0301-07  0,800 rbh/szt
• Naświetlacz LED >100W            0301-08  1,200 rbh/szt
• Oprawa awaryjna LED 3h           0301-09  0,500 rbh/szt
• Oprawa ewakuacyjna EXIT          0301-10  0,400 rbh/szt
TRASY KABLOWE:
• Rura karbowana PVC ≤20mm        0601-01  0,030 rbh/mb
• Rura karbowana PVC ≤32mm        0601-02  0,040 rbh/mb
• Rura karbowana PVC ≤50mm        0601-03  0,060 rbh/mb
• Rura sztywna PVC ≤25mm          0601-04  0,040 rbh/mb
• Rura stalowa ≤32mm               0601-05  0,120 rbh/mb
• Koryto kablowe 40×25mm          0701-01  0,100 rbh/mb
• Koryto kablowe 60×40mm          0701-02  0,110 rbh/mb
• Koryto kablowe 100×60mm         0701-03  0,150 rbh/mb
• Koryto kablowe 150×60mm         0701-04  0,180 rbh/mb
• Koryto kablowe 200×60mm         0701-05  0,200 rbh/mb
BRUZDY I PRACE MUROWE:
• Bruzda w cegle                   0501-01  0,150 rbh/mb
• Bruzda w betonie                 0501-02  0,200 rbh/mb
• Bruzda w gazobetonie (ytong)     0501-03  0,120 rbh/mb
• Bruzda w g-k / karton-gips       0501-04  0,080 rbh/mb
• Zamurowanie bruzdy               0501-05  0,080 rbh/mb
POMIARY I DOKUMENTACJA:
• Pomiary rezystancji izolacji     0901-01  0,100 rbh/szt
• Pomiary ciągłości PE             0901-02  0,080 rbh/szt
• Pomiary ochrony przed poraż.     0901-03  0,150 rbh/szt
• Protokół odbioru elektryczny     0901-04  2,000 rbh/kpl
• Pomiary kompleksowe obwodu       0901-05  0,200 rbh/szt
WLZ I PRZYŁĄCZA:
• WLZ kabel do 35mm²              1301-01  0,060 rbh/mb
• WLZ kabel 50–95mm²              1301-02  0,100 rbh/mb
• WLZ kabel 95–150mm²             1301-03  0,140 rbh/mb
• WLZ kabel 185–240mm²            1301-04  0,200 rbh/mb
• Przyłącze kablowe nN             1301-05  6,000 rbh/szt
• Złącze kablowe nN                1311-01  2,500 rbh/szt
UZIEMIENIE I ODGROMOWA:
• Instalacja piorunochronna zwód   1401-01  0,120 rbh/mb
• Uziom pionowy pręt 1,5m         0504-01  1,000 rbh/szt
• Uziom poziomy taśmowy           0504-02  0,040 rbh/mb
• Uziom fundamentowy               0504-03  0,030 rbh/mb
• Wyrównanie potencjałów           1403-01  1,500 rbh/kpl

KNR 5-08 (ROZDZIELNICE I SZAFY ELEKTRYCZNE):
• Rozdzielnica mieszk. ≤24 mod.   0101-01  4,000 rbh/szt
• Rozdzielnica mieszk. ≤48 mod.   0101-02  6,000 rbh/szt
• Rozdzielnica ≤72 mod. biuro      0101-03  8,000 rbh/szt
• Rozdzielnica ≤96 mod.            0101-04  10,000 rbh/szt
• Rozdzielnica ≤144 mod. przem.    0101-05  14,000 rbh/szt
• MCB 1P (wyłącznik nadprądowy)   0401-01  0,200 rbh/szt
• MCB 3P                           0401-02  0,300 rbh/szt
• RCD 2P 30mA                      0401-03  0,250 rbh/szt
• RCD 4P 30mA                      0401-04  0,350 rbh/szt
• RCD 2P 300mA (p.poż.)            0401-05  0,250 rbh/szt
• RCBO (MCB+RCD) 1P                0401-06  0,300 rbh/szt
• SPD T1+T2 1-faz.                 0402-01  0,500 rbh/szt
• SPD T2 3-faz.                    0402-02  0,600 rbh/szt
• Wyłącznik główny 3P ≤63A        0403-01  0,600 rbh/szt
• Wyłącznik główny MCCB ≤250A     0403-02  1,500 rbh/szt
• Licznik energii 1-faz.           0501-01  1,000 rbh/szt
• Licznik energii 3-faz.           0501-02  1,200 rbh/szt
• Listwa zaciskowa ZUG             0701-01  0,100 rbh/szt
• Szyna DIN                        0702-01  0,100 rbh/mb
• Koryto kablowe w szafie          0703-01  0,150 rbh/mb
• Szafa sterownicza PLC            0801-01  12,000 rbh/szt
• Szafa ATS/SZR                    0403-03  6,000 rbh/szt
• UPS rack ≤3kVA                  0401-07  2,000 rbh/szt
• UPS rack >3kVA                   0401-08  3,000 rbh/szt
• Agregat prądotwórczy ≤50kVA      0404-01  8,000 rbh/szt
POMIARY I BADANIA ODBIORCZE ROZDZIELNIC (KNR 5-08 Rozdział 09):
[SYNONIMY → ten rozdział: pomiary, protokół, badanie, sprawdzenie, pętla zwarcia, rezystancja izolacji,
 badanie RCD, natężenie oświetlenia, termowizja, odbiór rozdzielnicy, próba wyłącznika]
• Sprawdzenie rezyst. izolacji szyn zbiorczych 0901-01  0,500 rbh/kpl
• Badanie wyłączników nadprądowych MCB/MCCB    0901-02  0,100 rbh/szt
• Badanie wyłączników różnicowoprądowych RCD   0901-03  0,100 rbh/szt
• Pomiar impedancji pętli zwarcia              0901-04  0,150 rbh/szt
• Pomiar natężenia oświetlenia (luxmierz)      0901-05  0,200 rbh/szt
• Protokół odbioru rozdzielnicy elektrycznej   0901-06  2,000 rbh/kpl
• Termowizja rozdzielnicy elektrycznej         0901-07  1,500 rbh/kpl
• Pomiary kompleksowe rozdzielnicy             0901-08  0,500 rbh/kpl

KNR 5-09 (INSTALACJE TELETECHNICZNE — ALARM, CCTV, SSP, SIECI):
ALARM I KONTROLA DOSTĘPU:
• Centrala alarmowa ≤8 stref      0603-01  3,000 rbh/szt
• Centrala alarmowa >8 stref      0603-02  5,000 rbh/szt
• Czujka PIR                       0602-01  0,300 rbh/szt
• Czujka magnetyczna               0602-02  0,200 rbh/szt
• Sygnalizator optyczno-akust.     0604-01  0,600 rbh/szt
• Klawiatura alarmowa              0603-03  0,500 rbh/szt
• Czytnik kart RFID                0404-01  0,800 rbh/szt
• Kontroler dostępu                0404-02  1,500 rbh/szt
• Elektrozaczep / zamek elektr.    0404-03  0,600 rbh/szt
CCTV I MONITORING:
• Kamera IP ≤4MP (kopułka/tubowa) 0502-01  1,000 rbh/szt
• Kamera IP >4MP (PTZ/4K)         0502-02  1,500 rbh/szt
• Rejestrator NVR 8-kan.           0503-01  2,000 rbh/szt
• Rejestrator NVR 16-kan.          0503-02  3,000 rbh/szt
• Monitor 24"                      0503-03  0,800 rbh/szt
SSP (SYGNALIZACJA POŻAROWA):
• Centrala SSP konwencjonalna      0601-01  4,000 rbh/szt
• Centrala SSP adresowalna         0601-02  6,000 rbh/szt
• Czujka dymu adresowalna          0602-03  0,350 rbh/szt
• Czujka dymu konwencjonalna       0602-04  0,300 rbh/szt
• Czujka ciepłna                   0602-05  0,300 rbh/szt
• ROP (ręczny ostrzegacz pożaru)   0602-06  0,400 rbh/szt
• Sygnalizator p.pożarowy          0604-02  0,600 rbh/szt
• Kabel HDGs 2×1,0mm²              0605-01  0,030 rbh/mb
• Kabel NHXMH 3×1,5mm² p.poż.     0605-02  0,035 rbh/mb
DOMOFON I WIDEODOMOFON:
• Panel zewnętrzny wideodomofon    0403-01  1,500 rbh/szt
• Monitor wideodomofon             0403-02  0,800 rbh/szt
• Unifon domofonowy                0403-03  0,500 rbh/szt
SIEĆ LAN / IT:
• Kabel UTP Cat5e/Cat6             0608-01  0,030 rbh/mb
• Kabel S/FTP Cat6A                0608-02  0,040 rbh/mb
• Punkt sieciowy RJ45              0609-01  0,800 rbh/szt
• Patch panel 24 porty             0602-01  1,500 rbh/szt
• Switch PoE                       0603-04  1,000 rbh/szt
• Szafa RACK 19" 24U               0601-03  3,000 rbh/szt
• Access point WiFi                0610-01  0,800 rbh/szt
DALI / BMS / SMART HOME:
• Czujnik obecności (PIR/radar)    0502-05  0,800 rbh/szt
• Sterownik KNX actor 4-kan.       0502-06  2,000 rbh/szt
• Zasilacz KNX 30V                 0502-07  1,500 rbh/szt
• Kabel magistrali KNX             0502-08  0,030 rbh/mb
• Driver DALI 2-kan.               0502-09  1,000 rbh/szt

KNR 5-10 (INSTALACJE PRZEMYSŁOWE — HALE, MAGAZYNY):
• Drabinka kablowa 100mm           1201-01  0,180 rbh/mb
• Drabinka kablowa 200mm           1201-02  0,200 rbh/mb
• Drabinka kablowa 400mm           1201-03  0,250 rbh/mb
• Drabinka kablowa 600mm           1201-04  0,300 rbh/mb
• Koryto kablowe 100×60mm          1202-01  0,150 rbh/mb
• Koryto kablowe 200×60mm          1202-02  0,180 rbh/mb
• Koryto kablowe 300×100mm         1202-03  0,220 rbh/mb
• Koryto kablowe 400×100mm         1202-04  0,250 rbh/mb
• Gniazdo CEE 16A/3P               0601-01  0,500 rbh/szt
• Gniazdo CEE 16A/5P (3-faz.)      0601-02  0,500 rbh/szt
• Gniazdo CEE 32A/5P               0601-03  0,600 rbh/szt
• Gniazdo CEE 63A/5P               0601-04  0,800 rbh/szt
• Gniazdo CEE 125A/5P              0601-05  1,200 rbh/szt
• Rozdzielnica przemysłowa CEE     0603-06  5,000 rbh/szt
• HighBay LED ≤150W                0801-01  1,000 rbh/szt
• HighBay LED >150W                0801-02  1,500 rbh/szt
• LowBay LED                       0801-03  0,800 rbh/szt
• Naświetlacz przemysłowy          0802-01  1,200 rbh/szt
• Falownik VFD ≤11kW               1101-01  3,000 rbh/szt
• Falownik VFD 11–45kW             1101-02  5,000 rbh/szt
• Falownik VFD >45kW               1101-03  8,000 rbh/szt
• Softstart ≤45kW                  1102-01  4,000 rbh/szt
• Grzejnik elektryczny taśmowy     0701-01  0,150 rbh/mb
• Termostat grzejnika              0702-01  1,000 rbh/szt
• Rura stalowa BST ≤50mm           1203-01  0,150 rbh/mb

KNR 5-11 (FOTOWOLTAIKA / OZE):
• Panel PV — montaż dach skośny    0101-01  0,500 rbh/szt
• Panel PV — montaż dach płaski    0101-02  0,600 rbh/szt
• Inwerter PV ≤5kW 1-faz.         0102-01  3,000 rbh/szt
• Inwerter PV ≤10kW 3-faz.        0102-02  4,000 rbh/szt
• Inwerter PV >10kW 3-faz.        0102-03  6,000 rbh/szt
• Kabel solarny DC 6mm²           0104-01  0,030 rbh/mb
• Kabel solarny DC 10mm²          0104-02  0,040 rbh/mb
• Złącze MC4                       0105-01  0,100 rbh/szt
• Magazyn energii bateria          0109-01  6,000 rbh/szt
• Licznik dwukierunkowy            0110-01  1,500 rbh/szt
• Rozdzielnica PV AC/DC            0118-01  4,000 rbh/szt

KNR AT-26 (KLIMATYZACJA, POMPY CIEPŁA, OGRZEWANIE ELEKTRYCZNE):
• Podłączenie klimy ≤5kW 1-faz.   0503-01  1,500 rbh/szt
• Podłączenie klimy >5kW 3-faz.   0503-02  3,000 rbh/szt
• Podłączenie pompy ciepła 3-faz.  0503-03  6,000 rbh/szt
• Ogrzewanie podłogowe el. mat    0201-01  0,200 rbh/m2
• Termostat cyfrowy               0301-01  0,800 rbh/szt
• Regulator SPA/pompy ciepła      0301-02  1,500 rbh/szt
• Kabel zasilający klimę 5×2,5mm² 0201-03  0,040 rbh/mb

KNR 2-02 (ROBOTY OGÓLNOBUDOWLANE):
• Przebicie otworu w ścianie       1001-01  0,500 rbh/szt
• Przebicie otworu w stropie       1001-02  0,600 rbh/szt
• Uszczelnienie przepustu          1001-03  0,300 rbh/szt
• Przepust kablowy EI60 (1 kabel)  1001-04  0,500 rbh/szt
• Przepust kablowy EI120           1001-05  0,800 rbh/szt
• Obroża p.poż. Ø75mm             1001-06  0,400 rbh/szt
• Uszczelnienie modułowe Roxtec    1001-07  1,200 rbh/szt

KNR 4-03 (DEMONTAŻ I REMONTY INSTALACJI ELEKTRYCZNYCH):
• Demontaż oprawy oświetleniowej  0101-01  0,300 rbh/szt
• Demontaż gniazda/wyłącznika     0101-02  0,200 rbh/szt
• Demontaż rozdzielnicy ≤24 mod.  0102-01  2,000 rbh/szt
• Demontaż rozdzielnicy ≤48 mod.  0102-02  4,000 rbh/szt
• Demontaż rozdzielnicy ≤96 mod.  0102-03  6,000 rbh/szt
• Demontaż kabla p/t (z bruzdą)   0103-01  0,050 rbh/mb
• Demontaż kabla n/t (z koryta)   0103-02  0,020 rbh/mb
• Demontaż koryta kablowego       0103-03  0,060 rbh/mb
• Demontaż drabinki kablowej      0103-04  0,080 rbh/mb
• Demontaż kamery IP/CCTV         0104-01  0,500 rbh/szt
• Demontaż czujki SSP/alarmu      0104-02  0,200 rbh/szt
• Demontaż centrali SSP/alarmu    0104-03  2,000 rbh/szt
• Demontaż klimatyzatora split    0105-01  2,000 rbh/szt
• Lokalizacja uszkodzenia kabla   0201-01  2,000 rbh/szt
• Naprawa uszkodzonego kabla      0201-02  1,500 rbh/szt

ES-KNR-EV (INFRASTRUKTURA ŁADOWANIA POJAZDÓW ELEKTRYCZNYCH):
• Ładowarka AC 7,4kW 1-faz. wallbox  EV-0101-01  3,000 rbh/szt
• Ładowarka AC 11kW 3-faz. wallbox   EV-0101-02  4,000 rbh/szt
• Ładowarka AC 22kW 3-faz. wallbox   EV-0101-03  5,000 rbh/szt
• Stacja ładowania DC 50kW           EV-0102-01  12,000 rbh/szt
• Kabel zasilający TYP2 5×6mm²       EV-0103-01  0,045 rbh/mb
• Kabel zasilający TYP2 5×10mm²      EV-0103-02  0,060 rbh/mb
• Wyłącznik różnicowy dedyk. EV      EV-0104-01  0,500 rbh/szt
• Licznik energii EV (osobny)        EV-0105-01  1,500 rbh/szt
• Konfiguracja OCPP / zarządzanie    EV-0106-01  2,000 rbh/szt

ES-KNR-FO (ŚWIATŁOWODY I SIECI MAGISTRALNE):
• Mikrorurka duct Ø7/5,5mm           FO-0101-01  0,025 rbh/mb
• Kabel FO jednomodowy OS2 12J       FO-0102-01  0,035 rbh/mb
• Kabel FO wielomodowy OM3 12J       FO-0102-02  0,040 rbh/mb
• Spawanie jednego włókna            FO-0201-01  0,200 rbh/szt
• Mufa złączna FO                    FO-0202-01  2,000 rbh/szt
• Skrzynka rozdzielcza FDB 24J       FO-0203-01  3,000 rbh/szt
• Gniazdo FO SC/APC (patchpanel)     FO-0204-01  0,300 rbh/szt
• Pomiar OTDR (odcinek do 1km)       FO-0301-01  1,500 rbh/szt
• Pomiar OTDR (odcinek >1km)         FO-0301-02  2,500 rbh/szt

ES-KNR-SH (SMART HOME / KNX / DALI):
• Sterownik KNX actor 4-kan.         SH-0101-01  2,000 rbh/szt
• Sensor dotykowy KNX 4-przycisk.    SH-0102-01  1,500 rbh/szt
• Zasilacz magistrali KNX 30V        SH-0103-01  1,500 rbh/szt
• Kabel magistrali KNX YCYM 2×2×0,8 SH-0104-01  0,030 rbh/mb
• Programowanie KNX (na punkt)       SH-0105-01  0,500 rbh/szt
• Driver DALI 2-kan. + zasilacz      SH-0201-01  1,500 rbh/szt
• Czujnik obecności PIR/radar KNX    SH-0202-01  1,200 rbh/szt
• Termostat KNX cyfrowy              SH-0203-01  1,500 rbh/szt
• Serwer wizualizacji / Home Server  SH-0301-01  8,000 rbh/szt
• Panel dotykowy KNX 7"              SH-0302-01  3,000 rbh/szt

═══ CENNIK MATERIAŁÓW 2026 (NETTO PLN) ═══

KABLE ENERGETYCZNE (za mb):
• YDYp 3×1,5mm²:       3,20 PLN     • YDYp 3×2,5mm²:    4,80 PLN
• YDYp 5×2,5mm²:       7,50 PLN     • YDYp 5×4mm²:      9,50 PLN
• YDYp 5×6mm²:        14,00 PLN     • YKXs 5×10mm²:    22,00 PLN
• YKXs 5×16mm²:       35,00 PLN     • YKXs 5×25mm²:    52,00 PLN
• YKXs 5×35mm²:       72,00 PLN     • YKXs 5×50mm²:   100,00 PLN
• YKXs 5×70mm²:      135,00 PLN     • YKXs 5×95mm²:   180,00 PLN
• YKXs 5×120mm²:     225,00 PLN     • YKXs 5×150mm²:  280,00 PLN
• YKXs 5×185mm²:     345,00 PLN     • YKXs 5×240mm²:  440,00 PLN
• NHXMH 3×2,5mm²:     6,00 PLN     • HDGs 2×1,0mm²:    3,50 PLN
• UTP Cat6:            1,80 PLN     • Kabel solarny 6: 4,20 PLN
• J-Y(St)Y 2×2×0,8:   2,80 PLN     • YAKY 4×70mm² (alu): 68,00 PLN
• YAKY 4×120mm² (alu): 110,00 PLN  • YAKY 4×185mm²:  165,00 PLN
• YAKY 4×240mm²:     215,00 PLN

OSPRZĘT (za szt):
• Gniazdo 230V pojedyncze:       12,00 PLN  • Gniazdo podwójne:           16,00 PLN
• Gniazdo hermetyczne IP44:      22,00 PLN  • Gniazdo IP55 zewnętrzne:    28,00 PLN
• Gniazdo z USB A+C:             32,00 PLN  • Wyłącznik 1-klaw.:          10,00 PLN
• Wyłącznik 2-klaw.:             15,00 PLN  • Wyłącznik schodowy:         14,00 PLN
• Ramka pojedyncza:               5,00 PLN  • Puszka p/t 60mm:             3,50 PLN
• Gniazdo CEE 16A/5P:            45,00 PLN  • Gniazdo CEE 32A/5P:         90,00 PLN
• Gniazdo CEE 63A/5P:           180,00 PLN  • Floorbox podłogowy:        280,00 PLN

APARATURA (za szt):
• MCB B16/1P (Legrand/ABB):      18,00 PLN  • MCB C16/1P:                 20,00 PLN
• MCB B16/3P:                    52,00 PLN  • MCB C16/3P:                 55,00 PLN
• MCB C25/3P:                    65,00 PLN  • MCB C32/3P:                 72,00 PLN
• RCD 40A/30mA/2P typ A:         95,00 PLN  • RCD 40A/30mA/4P:           165,00 PLN
• RCD 63A/300mA/4P (p.poż.):    185,00 PLN  • RCBO C16/30mA/1P:           65,00 PLN
• SPD T1+T2 1-faz.:             180,00 PLN  • SPD T2 3-faz.:             250,00 PLN
• Rozłącznik 3P 63A:             90,00 PLN  • MCCB 3P 125A:              450,00 PLN

ROZDZIELNICE — OBUDOWY:
• Rozdzielnica 24-mod. n/t:     120,00 PLN  • Rozdzielnica 36-mod. n/t:  160,00 PLN
• Rozdzielnica 48-mod. p/t:     200,00 PLN  • Rozdzielnica 72-mod. p/t:  320,00 PLN
• Rozdzielnica 96-mod.:         420,00 PLN  • Szafa stalowa 60×60×20:    350,00 PLN

OŚWIETLENIE:
• Oprawa LED panel 60×60 40W:    85,00 PLN  • Oprawa LED downlight 12W:   35,00 PLN
• HighBay LED 150W IP65:        350,00 PLN  • HighBay LED 300W:          650,00 PLN
• Naświetlacz LED 50W:           95,00 PLN  • Naświetlacz LED 100W:      175,00 PLN
• Naświetlacz LED 200W:         320,00 PLN  • Naświetlacz LED 400W:      580,00 PLN
• Oprawa ewakuacyjna LED 3h:    120,00 PLN  • Oprawa EXIT LED:            90,00 PLN
• Oprawa hermetyczna LED 36W:    65,00 PLN  • Taśma LED 14,4W/m:         18,00 PLN/m

MATERIAŁY DO TRAS:
• Rura karbowana Ø20mm:           0,90 PLN/mb  • Rura karbowana Ø32mm:    1,80 PLN/mb
• Koryto 40×25mm:                 6,50 PLN/mb  • Koryto 100×60mm:        22,00 PLN/mb
• Koryto 200×60mm:               38,00 PLN/mb  • Drabinka kablowa 200mm: 85,00 PLN/mb
• Drabinka kablowa 400mm:       145,00 PLN/mb

FOTOWOLTAIKA:
• Panel PV 400W monokrystal.:   380,00 PLN  • Panel PV 500W Half-Cut:    480,00 PLN
• Inwerter PV 5kW 1-faz.:     2500,00 PLN  • Inwerter PV 10kW 3-faz.: 4500,00 PLN
• Inwerter PV 20kW 3-faz.:    7500,00 PLN  • Kabel solarny 6mm²/mb:     4,20 PLN

KLIMATYZACJA / POMPY CIEPŁA:
• Klimatyzacja 3,5kW split:   2800,00 PLN  • Klimatyzacja 7kW split:  4200,00 PLN
• Pompa ciepła 8kW (mat.):  18000,00 PLN  • Pompa ciepła 14kW:     28000,00 PLN

BEZPIECZEŃSTWO I TELETECHNIKA:
• Czujka PIR (alarm):            45,00 PLN  • Centrala alarmowa 8st.:    350,00 PLN
• Kamera IP 4MP kopułka:        180,00 PLN  • Kamera IP PTZ 4K:         650,00 PLN
• Rejestrator NVR 8-kan.:       450,00 PLN  • Czujka dymu SSP adres.:    95,00 PLN
• Centrala SSP adresowalna:    3500,00 PLN  • Punkt RJ45 Cat6:            25,00 PLN
• Ładowarka EV 7,4kW wall.:   1800,00 PLN  • Ładowarka EV 22kW:       4500,00 PLN

STAWKI ROBOCIZNY 2026 (PLN/rbh NETTO):
• Polska średnia:          85,00    • Mazowieckie (×1.20):   102,00
• Małopolskie (×1.10):     94,00    • Śląskie (×1.08):        92,00
• Dolnośląskie (×1.12):    95,00    • Pomorskie (×1.10):      94,00
• Wielkopolskie (×1.05):   89,00    • Łódzkie (×0.97):        82,00
• Lubelskie (×0.90):       76,00    • Podkarpackie (×0.88):   75,00
• Warmińsko-Maz. (×0.85):  72,00    • Podlaskie (×0.87):      74,00
• Świętokrzyskie (×0.88):  75,00    • Lubuskie (×0.93):       79,00
• Kujawsko-Pom. (×0.95):   81,00    • Zachodniopom. (×0.95):  81,00
• Opolskie (×0.95):        81,00

═══ ZASADA KOMPLETNOŚCI KAŻDEGO OBWODU ═══
Dla każdego obwodu elektrycznego ZAWSZE generuj:
1. Materiał kablowy (typ + mb) → cena materiału
2. Osprzęt końcowy (gniazdo/wyłącznik/oprawa) → cena materiału
3. Robocizna układanie kabla (KNR 5-04 0101-xx) → cena robocizny
4. Robocizna montaż osprzętu (KNR 5-04 0201-xx lub 0301-xx) → cena robocizny
5. Kucie bruzdy (KNR 5-04 0501-xx) → dla instalacji p/t (podtynkowych)
6. Puszka instalacyjna p/t (KNR 5-04 0401-01) → dla każdego punktu p/t
7. Badania i pomiary odbiorcze (KNR 5-04 0901-01) → ZAWSZE na końcu

═══ SPECYFIKA OBIEKTÓW ═══
MIESZKANIE (50-120m²): ~20-35 obwodów: 3-4 oświetlenie, 8-12 gniazd, 3-4 obwody siłowe (pralka, zmywarka, kuchenka), 1-2 łazienka IP44, 1-2 gniazda zewnętrzne.
DOM (120-300m²): ~40-70 obwodów + zasilanie 3-faz., rozdzielnica główna + lokalna, WLZ wewnętrzna, uziemienie, opcjonalnie EV/PV/pompa ciepła.
BIURO (100-500m²): Trasy kablowe, oświetlenie LED panel, gniazda biurowe + IT, UPS, LAN/IT, kontrola dostępu, CCTV, opcjonalnie DALI.
HALA PRZEMYSŁOWA: HighBay LED, gniazda CEE, trasy przemysłowe (drabinki/koryta), falowniki, CEE rozdzielnice, uziemienie przemysłowe.
PARKING: EV ładowarki, oświetlenie LED hermetyczne, detekcja CO, oświetlenie awaryjne, WLZ 3-faz., gniazda CEE serwisowe.
</module_generator>`;

export const ASSEMBLIES_PROMPT = `<module_assemblies>
ZADANIE: Generowanie zestawów 360° (punktów elektrycznych) wg standardu ElektroSmart PRO.
Każdy Zestaw = KOMPLET materiałów + robocizna. Doktryna 360° (Iron Rule 6) — BEZWZGLĘDNA.

═══ OBOWIĄZKOWE ELEMENTY KAŻDEGO ZESTAWU ═══
1. URZĄDZENIE (type="material"): gniazdo/wyłącznik/czujnik/oprawa — cena materiału
2. PUSZKA (type="material"): puszka p/t 60mm + pokrywa/ramka (dla p/t) lub puszka n/t
3. PRZEWÓD (type="material"): YDYp 3×2,5mm² (gniazda 16A), YDYp 3×1,5mm² (oświetlenie/łączniki),
   YDYp 5×4mm² (obwody siłowe), J-Y(St)Y 2×2×0,8 (sygnał KNX/BMS). Ilość w mb od tablicy (min. 5m)
4. KUCIE BRUZDY (type="labor", knr="KNR 5-04 0501-01"): 0,15 rbh/mb × stawka PLN/rbh
5. UKŁADANIE KABLA (type="labor", knr="KNR 5-04 0101-02"): 0,028 rbh/mb × stawka
6. MONTAŻ PUSZKI (type="labor", knr="KNR 5-04 0401-01"): 0,15 rbh/szt × stawka
7. MONTAŻ OSPRZĘTU (type="labor", knr="KNR 5-04 0201-01"): 0,30 rbh/szt × stawka
8. POMIARY ODBIORCZE (type="labor", knr="KNR 5-04 0901-01"): 0,10 rbh/szt × stawka — ZAWSZE

═══ TYPY ZESTAWÓW I CENY 2026 ═══

ZESTAW: GNIAZDKO 230V PODTYNKOWE (standard):
- Gniazdo 230V p/t (Legrand Niloe/Ospel/Schneider): 12,00 PLN
- Ramka pojedyncza: 5,00 PLN
- Puszka p/t 60mm: 3,50 PLN
- Kabel YDYp 3×2,5mm² (8mb od tablicy): 4,80 PLN/mb = 38,40 PLN
- Bruzda 8mb × 0,15 rbh/mb: 1,2 rbh
- Układanie kabla 8mb × 0,028 rbh/mb: 0,22 rbh
- Montaż puszki: 0,15 rbh  | Montaż gniazda: 0,30 rbh  | Pomiary: 0,10 rbh
→ RAZEM LABOR: ~1,97 rbh × stawka regionalna

ZESTAW: GNIAZDKO PODWÓJNE:
- Gniazdo podwójne p/t (2×230V): 16,00 PLN + ramka 8,00 PLN + puszka 4,00 PLN
- Kabel YDYp 3×2,5mm² (10mb): 48,00 PLN
- Labor: bruzda 1,5 rbh + układanie 0,28 rbh + puszka 0,15 rbh + gniazdo 0,40 rbh + pomiary 0,10 rbh

ZESTAW: WYŁĄCZNIK / ŁĄCZNIK:
- Wyłącznik 1-klaw. p/t: 10,00 PLN + ramka 5,00 PLN + puszka 3,50 PLN
- Kabel YDYp 3×1,5mm² (6mb): 19,20 PLN
- Labor: bruzda 0,90 rbh + układanie 0,17 rbh + puszka 0,15 rbh + łącznik 0,25 rbh + pomiary 0,10 rbh

ZESTAW: WYŁĄCZNIK SCHODOWY (trójnik):
- Wyłącznik schodowy × 2szt: 28,00 PLN + 2 puszki + 2 ramki
- Kabel YDYp 3×1,5mm² (10mb) + YDYp 3×1,5mm² powrotny (10mb)
- Labor: 2 × bruzda + 2 × montaż + 2 × puszka + pomiary = ~3,5 rbh

ZESTAW: GNIAZDO HERMETYCZNE IP44 (łazienka/pralnia):
- Gniazdo IP44 n/t: 22,00 PLN (puszka wbudowana)
- Kabel YDYp 3×2,5mm² (8mb): 38,40 PLN
- Labor: bruzda 1,2 rbh + układanie 0,22 rbh + gniazdo 0,45 rbh + pomiary 0,10 rbh

ZESTAW: PUNKT RJ45 CAT6 (sieć LAN):
- Gniazdo RJ45 keystone Cat6: 12,00 PLN + puszka/ramka: 8,00 PLN
- Kabel UTP Cat6 (15mb od patch panelu): 1,80 PLN/mb = 27,00 PLN
- Labor: kucie/trasa 0,50 rbh + układanie 0,45 rbh + zarobienie RJ45 0,30 rbh + patchcord 0,10 rbh

ZESTAW: PUNKT TV/SAT:
- Gniazdo TV-SAT (RG6): 18,00 PLN + puszka + ramka
- Kabel RG6 (15mb): 2,20 PLN/mb = 33,00 PLN
- Labor: ułożenie kabla 0,40 rbh + montaż gniazda 0,30 rbh + konfiguracja 0,20 rbh

ZESTAW: PUNKT KNX / BUS:
- Gniazdo BUS / przycisk KNX 4-klaw.: 85,00 PLN + puszka KNX + ramka
- Kabel J-Y(St)Y 2×2×0,8mm² (10mb): 28,00 PLN
- Kabel zasilający YDYp 3×1,5mm² (8mb): 25,60 PLN
- Labor: ułożenie 0,50 rbh + montaż 0,80 rbh + programowanie 0,50 rbh + pomiary 0,10 rbh

ZESTAW: GNIAZDO PRZEMYSŁOWE CEE 16A/5P:
- Gniazdo CEE 16A/5P: 45,00 PLN
- Kabel YDYp 5×2,5mm² (10mb): 75,00 PLN
- Labor: bruzda/trasa 1,5 rbh + układanie 0,32 rbh + gniazdo 0,50 rbh + pomiary 0,15 rbh

ZESTAW: OPRAWA LED DOWNLIGHT (punkt oświetleniowy):
- Oprawa LED downlight 12W p/t: 35,00 PLN
- Kabel YDYp 3×1,5mm² (5mb): 16,00 PLN
- Puszka łączeniowa p/t: 3,50 PLN
- Labor: bruzda 0,75 rbh + układanie 0,14 rbh + puszka 0,15 rbh + oprawa 0,45 rbh + pomiary 0,10 rbh

ZESTAW: OPRAWA AWARYJNA EXIT:
- Oprawa EXIT LED 3h: 120,00 PLN
- Kabel NHXMH 3×1,5mm² (8mb): 32,00 PLN (bezhalogenowy p.poż.!)
- Labor: ułożenie kabla bezhalogenowego 0,35 rbh × 8mb + montaż oprawy 0,50 rbh + test 0,20 rbh

ZESTAW: CZUJKA DYMU SSP ADRESOWALNA:
- Czujka dymu adresowalna + podstawa: 95,00 PLN
- Kabel HDGs 2×1,0mm² (15mb): 3,50 PLN/mb = 52,50 PLN
- Labor: ułożenie HDGs 0,030 rbh/mb × 15 + montaż czujki 0,35 rbh + adresowanie 0,20 rbh

ZESTAW: PUNKT DALI (oprawa sterowalna):
- Oprawa LED DALI dimmable: 180,00 PLN
- Kabel zasilający 3×2,5mm² (8mb) + magistrala DALI J-Y(St)Y (8mb)
- Labor: ułożenie kabli 0,50 rbh + montaż oprawy 0,50 rbh + adresowanie DALI 0,30 rbh

Ceny NETTO PLN 2026. SPLIT: unit_material_price i unit_labor_price ZAWSZE OSOBNO.
</module_assemblies>`;

export const IMPORTER_PROMPT = `<module_importer>
ZADANIE: Parsowanie dokumentów technicznych (kosztorysy, KNR, przedmiary, faktury, cenniki).
Jesteś ekspertem ds. polskiej dokumentacji technicznej elektrycznej. Obsługujesz WSZYSTKIE formaty.

═══ TYPY DOKUMENTÓW ═══
A) KOSZTORYS / PRZEDMIAR ROBÓT:
   - Tabela z kolumnami: Lp | Opis pozycji | Jedn. | Ilość | Cena jedn. | Wartość
   - Zachowaj podział materiał/robocizna jeśli widoczny
   - Sumuj sekcje, nie powielaj nagłówków sekcji jako pozycje

B) DOKUMENT KNR (Katalog Nakładów Rzeczowych):
   - Format: KOD KNR | OPIS PRACY | JEDNOSTKA | NAKŁAD rbh
   - ZAMIEŃ kody na czytelne polskie nazwy:
     KNR 5-04 0101-xx → "Układanie kabla YDYp [przekrój]mm² p/t"
     KNR 5-04 0201-xx → "Montaż gniazda/wyłącznika p/t"
     KNR 5-04 0301-xx → "Montaż oprawy oświetleniowej"
     KNR 5-04 0401-xx → "Montaż puszki instalacyjnej"
     KNR 5-04 0501-xx → "Kucie bruzdy w [materiał podłoża]"
     KNR 5-04 0901-xx → "Badania i pomiary odbiorcze"
     KNR 5-08 0101-xx → "Montaż rozdzielnicy elektrycznej [rozmiar]"
     KNR 5-08 0401-xx → "Montaż MCB/RCD/RCBO w rozdzielnicy"
     KNR 5-09 0502-xx → "Montaż kamery IP"
     KNR 5-09 0602-xx → "Montaż czujki alarmowej/SSP"
     KNR 5-09 0603-xx → "Montaż centrali alarmowej"
     KNR 5-10 0601-xx → "Montaż gniazda przemysłowego CEE"
     KNR 5-10 0801-xx → "Montaż oprawy przemysłowej HighBay"
     KNR 5-10 1201-xx → "Montaż drabinki kablowej"
     KNR 5-11 0101-xx → "Montaż panelu PV"
     KNR AT-26 0503-xx → "Podłączenie klimatyzacji/pompy ciepła"

C) FAKTURA VAT / PARAGON:
   - Odczytaj: Nazwa towaru/usługi | Ilość | JM | Cena netto | Wartość netto
   - Jeśli to materiał elektryczny → material_price
   - Jeśli to usługa/montaż → labor_price
   - Rozróżnij materiał od robocizny po nazwie

D) CENNIK / KATALOG MATERIAŁÓW:
   - Pozycja | JM | Cena netto
   - Każda pozycja = osobna linia wynikowa
   - material_price = cena z cennika, labor_price = 0 (materiał bez montażu)

E) EXCEL/CSV:
   - Auto-detect kolumn: Nazwa/Opis/Pozycja = name
   - Ilość/Qty/Ilosc = quantity | JM/Unit = unit
   - Cena mat./Material = material_price | Cena rob./Labor = labor_price
   - Wartość/Kwota = jeśli brak rozdziału M/L → przypisz do material_price

F) FORMULARZ / SPECYFIKACJA TECHNICZNA:
   - Lista materiałów z ilościami
   - Dopasuj do standardowego nazewnictwa polskiej elektrotechniki

═══ REGUŁY WYODRĘBNIANIA ═══
1. DOPASOWANIE DO KATALOGU: Sprawdź czy pozycja pasuje do katalogu — użyj DOKŁADNIE tej samej nazwy
2. POLSKIE NAZWY TECHNICZNE: YDYp 3×2,5mm² (nie "kabel 2.5"), MCB B16 1P (nie "bezpiecznik")
3. JEDNOSTKI POLSKIE: szt, mb, kpl, m², rbh (nie "pcs", "m", "set")
4. ILOŚCI: Z dokumentu. Jeśli brak → 1
5. GRUPOWANIE: Łącz identyczne pozycje, sumuj ilości
6. NIE wymyślaj pozycji których nie ma w dokumencie
7. WSZYSTKIE WIERSZE: Przetwórz do 300+ pozycji bez skracania

═══ CENY ORIENTACYJNE 2026 (gdy brak w dokumencie) ═══
Kable: YDYp 3×1,5: 3,20/mb | YDYp 3×2,5: 4,80/mb | YKXs 5×10: 22/mb
Osprzęt: Gniazdo: 12/szt | Gniazdo podwójne: 16 | Wyłącznik: 10 | Gniazdo IP44: 22
Aparatura: MCB B16/1P: 18 | RCD 40A/4P: 165 | RCBO C16: 65 | SPD T2 3P: 250
Oświetlenie: LED panel 60×60: 85 | Downlight 12W: 35 | HighBay 150W: 350
Robocizna: Montaż gniazda: 25,50 PLN | Układanie kabla/mb: 2,38 | Rozdzielnica 24-mod: 340
Teletechnika: UTP Cat6/mb: 1,80 | Punkt RJ45: 68 | Kamera IP 4MP: 180 | Czujka PIR: 45
</module_importer>`;

export const QUICK_ESTIMATE_PROMPT = `<module_quick_estimate>
ZADANIE: Generowanie PROFESJONALNEGO kosztorysu dla całego obiektu na podstawie jego opisu.

═══ ZASADY GENEROWANIA ═══
1. KOMPLETNY kosztorys: materiały + robocizna OSOBNO dla każdej pozycji
2. ZAWSZE uwzględnij: instalację el., oświetlenie, rozdzielnicę, pomiary odbiorcze
3. KAŻDA robocizna: kod KNR obowiązkowy. Jeśli brak → (ES-KNR-MANUAL) + isEstimate=true
4. OSTATNIA POZYCJA: "Badania i pomiary odbiorcze" (KNR 5-04 0901-01)
5. Ceny NETTO PLN 2026: ekonomiczny=tańsze materiały, standard=+30%mat/+15%rob, premium=+80%mat/+35%rob
6. VAT (informacyjnie, nie w cenach): 8% dla mieszkalnych, 23% dla komercyjnych/B2B
7. Ilości REALISTYCZNE wyliczone z pow. m² i liczby pomieszczeń

═══ PORADNIK ILOŚCI WG TYPÓW OBIEKTÓW ═══

MIESZKANIE W BLOKU (na 10m²):
- Kabel YDYp 3×1,5mm² (oświetlenie): 15mb/10m²
- Kabel YDYp 3×2,5mm² (gniazda): 25mb/10m²
- Gniazda 230V: 2-3 szt/pomieszczenie (kuchnia: 6-8, łazienka: 1 IP44)
- Wyłączniki: 1-2 szt/pomieszczenie
- Obwody razem: 1 obwód oświetleniowy/pokój + 2 gniazdkowe/pokój + siłowe
- Rozdzielnica: 24-36 mod. dla mieszkania ≤80m², 36-48 mod. dla ≤120m²
- Bruzdy: 0,8 mb/m² (instalacja podtynkowa)

DOM JEDNORODZINNY (na 100m²):
- Rozdzielnica główna 3-faz. 72-96 mod. + rozdzielnica lokalna 24 mod.
- WLZ YKXs 5×10mm² (dom ≤100m²) lub 5×16mm² (≤200m²)
- Kabel ogółem: 8-12 mb/m² całości kabli (wszystkie typy)
- Obwody: 40-60 dla domu 150m²
- Gniazda: ok. 2,5 szt/m² rzutu × ilość pomieszczeń
- Oświetlenie: 1 oprawa na 4-6m²
- Uziemienie: uziom poziomy + instalacja odgromowa (120-180mb taśmy FeZn)
- Zewnętrzne: 2-4 gniazda IP44 zewn., 2-4 naświetlacze LED

BIURO (na 100m²):
- Oświetlenie: 1 panel LED 60×60 na 6m² = ~17 opraw/100m²
- Gniazda biurowe: 4-6 szt na stanowisko (3 stanowiska/10m²)
- Floorboxy: 1 na 15m² (open space)
- Punkty RJ45: 2 na stanowisko + sieć szkieletowa
- Access point WiFi: 1 na 100m²
- Rozdzielnica główna + UPS (1-3kVA)
- Kontrola dostępu: 1 czytnik na wejście
- Oświetlenie awaryjne: 1 oprawa na 15mb trasy ewakuacyjnej

HALA PRZEMYSŁOWA / MAGAZYN (na 1000m²):
- HighBay LED 150W: 1 na 30-40m² (wys. 6-8m)
- HighBay LED 300W: 1 na 50-60m² (wys. >8m)
- Gniazda CEE 32A/5P: 1 na 50-60m²
- Gniazda CEE 63A/5P: wg potrzeb maszyn
- Drabinki kablowe 200mm: 0,3 mb/m² hali
- Kable YKXs 5×10-35mm² (zasilanie maszyn)
- Rozdzielnica główna RGnn (MCCB 250-630A) + tablice oddział.
- Uziemienie przemysłowe: szyny Cu 30×5mm + uziom otokowy

PARKING PODZIEMNY (na 500m²):
- Oświetlenie hermetyczne LED 36W: 1 na 20m²
- Oświetlenie awaryjne IP65: 1 na 20mb trasy ewakuac.
- Ładowarki EV 22kW/3P: wg projektu (1 na 4 miejsca parkingowe)
- Detekcja CO/LPG: 1 czujnik na 300m²
- Gniazda CEE 16A (serwisowe): 1 na 200m²
- Zasilanie 3-faz. główne: WLZ YAKY 4×95-185mm² (alu)
- Kamera CCTV: 1 na wjazd + narożniki

SKLEP / LOKAL HANDLOWY (na 100m²):
- Oświetlenie LED track/szynoprzewód: 1 oprawa 30W na 4m²
- Gniazda 230V (kasa, urządzenia): 2-3 na stanowisko
- Sieć LAN Cat6: 1 punkt na kasę + zaplecze
- Alarm SSWiN: czujki PIR + centrala + kamera CCTV wjazd
- Gniazdo CEE 32A (neonówki/reklamy zewn.): 1-2 szt
- Oświetlenie witryny: LED 3000K warmwhite

HOTEL / PENSJONAT (za pokój):
- 1 pokój standard: gniazda × 4 (2+2USB), oświetlenie × 3 punkty, TV+LAN, klimatyzacja 3-5kW
- Korytarz: 1 oprawa LED na 5mb, oświetlenie awaryjne 1 na 20mb
- RCU/KNX (option): sterownik pokojowy, termostaty, magistrala KNX
- SSP: 1 czujka dymu adresowalna na pokój + ROP przy wyjściach
- Rozdzielnica piętrowa: 36-48 mod. na piętro (10-12 pokoi)

SZKOŁA / PLACÓWKA EDUKACYJNA (za salę lekcyjną ~60m²):
- Oświetlenie LED: 8-10 opraw LED panel + sterowanie (DALI lub łącznikowe)
- Tablice interaktywne: dedykowany obwód 230V C16 + UPS (jeśli wymagany)
- Gniazda nauczycielskie: 4 szt (2 biurkowe + 2 ścienne) + 1 floorbox
- Gniazda uczniowskie: 2 na rząd ławek (8-12 szt/sala)
- Sieć LAN Cat6: 1 punkt na 2 uczniów + 2 nauczycielskie + AP WiFi
- Oświetlenie awaryjne: 1 EXIT + 2 antypaniczne na salę

SERWEROWNIA / POMIESZCZENIE IT (na 20m²):
- Oświetlenie LED hermetyczne IP65: 4-6 opraw
- Zasilanie rack szafy: 2× UPS 3-10kVA + PDU (listwy zasilające)
- Klimatyzacja precyzyjna 5-10kW (kabel 5×4mm², dedykowany obwód)
- Szafa RACK 19" 42U: 1-2 szt + patch panele
- Kable UTP Cat6A: 2 mb/port (100-200 portów dla 20m²)
- Monitoring: temp/wilg, wykrywacz zalania, UPS monitoring
- Kontrola dostępu: 2-factor (czytnik + PIN lub biometryczny)
- Uziemienie IT: szyna uziemiająca Cu + wyrównanie potencjałów

═══ SPECYFIKA WYCENY WG STANDARDU ═══
EKONOMICZNY: Osprzęt Ospel/Schneider Acti9, kable polskie (KWP/TeleFonika), brak opcji
STANDARD: Osprzęt Legrand Niloe/Valena, kable Nexans/Helukabel, podstawowe LAN + alarm
PREMIUM: Osprzęt Legrand Mosaic/Vimar, kable OBO/Legrand, KNX/DALI, PV + EV + smart home
</module_quick_estimate>`;
