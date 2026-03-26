# ElektroSmart PRO — Architektura Systemu Wyceny v1.1

> **Data audytu:** 2026-03-16 | **Commit:** 99c9d14d  
> **Poprzedni audyt:** v1.0 @ 48724526  
> **Zakres:** `app/dashboard/projects/[id]/_ai_actions/pricing.ts` · `lib/pricing-calculations.ts` · `lib/knr-local-context.ts` · `lib/global-benchmarks.ts` · `lib/services/matching-engine.ts` · `app/api/ai/vision/route.ts`

---

## 1. Kartowanie Matematyki (The Math Map)

### 1.1 Łańcuch stawek robocizny

```
admin_settings.market_rbh_rate  →  fallback dynamiczny (domyślnie: 85 PLN/rbh)
                                    ✅ v1.1: BASE_HOURLY_RATE=84 i DEFAULT_LABOR_RATE=120 USUNIĘTE

getEffectiveRate(voivodeship, useCustom, customRate, userRate):
  P1 (use_custom_rates=true)  →  laborRate = custom_labor_rate × regionModifier
  P2 (hourly_rate > 0)        →  laborRate = profiles.hourly_rate × regionModifier
  Fallback                    →  laborRate = admin_settings.market_rbh_rate × regionModifier
                                             (NIE 120 PLN — dynamiczna wartość z bazy)

baseRateForCalc = laborRate / regionModifier  ← BASE bez regionu
                  (fallback gdy regionModifier=0: baseRateForCalc = laborRate)
```

> ✅ **v1.1 NAPRAWIONO [C3]**: Oba hardcoded constants (`BASE_HOURLY_RATE=84`, `DEFAULT_LABOR_RATE=120`)  
> usunięte z kodu. Wszystkie kalkulacje używają wyłącznie `user_profile.hourly_rate`  
> lub `admin_settings.market_rbh_rate` jako fallback (dynamiczny, bez stałej).

### 1.2 Pełna formuła robocizny (L0/L2/L3)

```
Final_Labor_Unit = KNR_norm × unit_factor × cable_mod × surface_mod × baseRateForCalc

Gdzie:
  KNR_norm     — robocizna z tabeli knr_norms lub es_dictionary (rbh/jm)
  unit_factor  — 0.01 jeśli unit zawiera "100" (per-100m KNR), else 1.0  [L0 only]
                 lub unit_factor z KnrEntry.unit_factor dla JSON norms     [knr-local-context]
  cable_mod    — getCableComplexityModifier(name): 1.0 / 1.3 / 1.8 / 2.5 × Al:×1.1
  surface_mod  — getSurfaceModifier(name, globalCtx): 0.5 – 2.5
  baseRateForCalc — stawka bazowa PLN/rbh (bez regionu)

L3 (AI post-process — ✅ v1.1 NOWE [C2]):
  adjLab = round(raw_labor_ai × cable_mod × surface_mod)
  globalCtx: pobierany z l3CtxMap (item.section + item.description)
```

### 1.3 Formuła wyświetlania (calcRowPrices)

```
laborUnit   = rawLab × adjustmentMult × regionModifier   [isManual → regionModifier=1.0]
materialUnit = rawMat × adjustmentMult                    [materiał NIGDY nie dostaje regionModifier]
rowTotal     = materialTotal + laborTotal

totalNet     = Σ materialTotal + Σ laborTotal
vatMaterial  = totalMaterialNet × vatRateMaterial         [domyślnie 23% B2B]
vatLabor     = totalLaborNet   × vatRateLabor             [domyślnie 8% mieszkaniowy]
totalGross   = totalNet + vatMaterial + vatLabor
```

> **Iron Rule**: `materialUnit` NIGDY nie mnoży przez `regionModifier`. Materiały są suwerenne.

### 1.4 Narzuty KNR (Polish surcharges)

```
Kp = R × (kpPercent / 100)          ← Koszty Pośrednie
Z  = (R + Kp) × (zPercent / 100)    ← Zysk
Kz = M × (kzPercent / 100)          ← Koszty Zakupu
totalNarzuty = Kp + Z + Kz
```

### 1.5 Logika VAT

| Typ projektu | Materiał VAT | Robocizna VAT | Ustawa |
|---|---|---|---|
| Mieszkaniowy (budownictwo) | 8% | 8% | art. 41 ust. 12 uVAT |
| Komercyjny / B2B | 23% | 23% | stawka podstawowa |
| **Domyślnie w systemie** | **23%** | **8%** | mix: patrz `VAT_RATES` |

> ✅ **v1.1 DECYZJA [M1]**: VAT pozostaje RĘCZNYM wyborem użytkownika (amber toggle 8%/23%  
> w `ProjectControlPanel` — `updateProjectVatRate` server action). Auto-switching po typie projektu  
> NIE jest implementowany. Uzasadnienie: ryzyko błędnej klasyfikacji wyższe niż koszt ręcznego kliknięcia.

### 1.6 Modyfikatory powierzchni (Surface Engine)

```
getSurfaceModifier(description, globalContext):
  żelbet/żelbetow   → ×2.5   (kucie w żelbecie: ~2.0 rbh/m)
  beton/betonow     → ×1.8   (kucie w betonie zwykłym)
  cegła/ceglany     → ×1.0   (standard referencyjny)
  gazobeton/siporex → ×0.8   (miękki, szybka praca)
  tynk/płaski/gk    → ×0.5   (gipsokaton/tynk: minimalny opór)

Fallback: 1.0 gdy brak słów kluczowych lub item.section=null
```

### 1.7 Modyfikatory kabla (Cable Engine)

```
getCableComplexityModifier(name):
  section ≤ 35mm²  → ×1.0
  section > 35mm²  → ×1.3
  section > 70mm²  → ×1.8
  section > 150mm² → ×2.5
  +Al (aluminium)  → ×1.1 na wierzch

Regex: /(\d+)\s*[xх×]\s*(\d+(?:[.,]\d+)?)/i
```

---

## 2. Audyt Potoku AI (AI Pipeline)

### 2.1 Schemat przepływu L0→L3 (aktualny — v1.1)

```
WEJŚCIE: project_items z {id, name, unit, quantity, knr_code?, section?, description?}
         ↓
   ┌─────────────────────────────────────┐
   │  GUARD: detectAmbiguity(name)       │  → isAmbiguous=true
   │  FULL: "nieprzewidziane", "inne"     │
   │  SHORT: len<60 + suffix’s            │
   └─────────────────────────────────────┘
         ↓ clearItems
   ┌─────────────────────────────────────┐
   │  L0: Direct KNR Lookup              │
   │  Warunek: item.knr_code != null      │
   │  ✅ v1.1: "/" → "-" normalizacja kodu  │
   │  Źródło:  knr_norms + es_dictionary   │
   │  Query:  Promise.all([lab, mat])     │
   │  Wynik:  sugLab = norm×mods×R        │
   │  Mat:    matL0Map.get(code) ?? 0 ✅  │
   └─────────────────────────────────────┘
         ↓ l0 miss
   ┌─────────────────────────────────────┐
   │  L1: Personal Catalog               │
   │  Faza A: keyword fuzzy ≥ 0.2         │
   │  Faza B: batchSemanticCatalogMatch  │
   │  Wynik:  sugMat + sugLab ✅          │
   └─────────────────────────────────────┘
         ↓ l1 miss
   ┌─────────────────────────────────────┐
   │  L2: ES-Dictionary Match            │
   │  Fazy: exact→regex→fuzzy→analog      │
   │  Mat:  matL2Map.get(knr_ref) ?? 0 ✅ │
   │  Wynik: sugLab = norm×mods×R        │
   └─────────────────────────────────────┘
         ↓ l2 miss (trace="unmatched")
   ┌─────────────────────────────────────┐
   │  L3: Gemini 2.0 Flash AI Batch      │
   │  Model: gemini-2.0-flash            │
   │  Batch: 50 items/chunk              │
   │  Wynik: sugMat + sugLab ✅           │
   │  ✅ v1.1: adjLab = raw×cable×surface │
   └─────────────────────────────────────┘
         ↓
   applySanityCheck(est, baseRateForCalc)
         ↓
   WYJIŚCIE: AiPriceEstimate[]
```

### 2.2 Matching Engine — fazy normalizacji

Przed każdym dopasowaniem tekst przechodzi przez pipeline:

```
1. stripProjectNoise(input)       ← usuwa "uzupełnienie", "brakujących" itp.
2. removeDiacritics(text)         ← ż→z, ą→a, ó→o ...
3. toLowerCase()
4. SECTION_RANGE_RE               ← usuwa "do 7,5 mm2" itp.
5. TRAY_DIM_RE                    ← usuwa "100h50" (wymiary korytek)
6. UNITS_RE                       ← usuwa jednostki miary
7. NOISE_RE                       ← usuwa × i podobne
8. tokenize()                     → zestaw tokenów dla trigram/fuzzy
```

### 2.3 Normalizacja KNR — v1.1 status

| Wzorzec wejściowy | Problem | Status v1.1 |
|---|---|---|
| "KNR 5-08 2101/01" | Wariant kodu: "/" vs "-" | ✅ Naprawiono [D1]: `.replace(/\//g, "-")` w L0 i vision |
| "KNR 5-08/0401 01" | Separator katalogu: ukośnik | ✅ Vision route: `"5-08/0401"→"5-08 0401"` |
| "Trasy kablowe 100h50" | TRAY_DIM_RE, ale `trase kablowe` ≠ `koryto` | ⚠️ OTWARTE: L3 fallback |
| "YDYp/YDYzo 5x2.5" | Slash w nazwie przewodu | ⚠️ OTWARTE: tokenizacja dzieli błędnie |
| "kabelkowe" ≠ "kablowe" | Brak synonimu w słowniku | ⚠️ OTWARTE [D3] |
| "bruzdowanie" | GROOVE_RE: `/\b(bruzd|kucie|rowek|kanal)\b/i` | ✅ działa (stem "bruzd") |

### 2.4 Sanity Check — progi (v1.1)

```typescript
// Liniowe (m/mb):
  groove items:  maxRbh = 3.0   (GROOVE_RE: /\b(bruzd|kucie|rowek|kanal)\b/i)
  cable items:   maxRbh = 0.35 × getCableComplexityModifier(name)
  other linear:  maxRbh = 0.35

// Powierzchniowe / punktowe:
  m²/m2:   3.00 rbh
  szt:     8.00 rbh   — standard urządzenie
  szt:    24.00 rbh   — ✅ v1.1 NOWE [D4]: gdy PANEL_RE.test(name) (rozdzielnica/tablica/szafa)
  kpl:    20.00 rbh
  r-g:     8.00 rbh   — ✅ v1.1 NAPRAWIONO [M2]: było 1.20, podniesione do 8.00
  t:      12.00 rbh
  kg:      0.20 rbh
  default: 24.0 rbh

PANEL_RE = /\b(rozdzielnic|tablic|szaf)/i  ← nowy regex dla rozdzielnic
```

---

## 3. Analiza Ślepych Zón (Gap Analysis — aktualny stan v1.1)

### 3.1 Materiały w L0 i L2 — status v1.1

```
✅ v1.1 NAPRAWIONO [C1]:
L0: suggestedMaterial = mode==="labor" ? item.material_price : (matL0Map.get(code) ?? 0)
L2: suggestedMaterial = mode==="labor" ? item.material_price : (matL2Map.get(knr_code) ?? 0)

matL0Map: parallel query → es_dictionary WHERE knr_ref IN uniqueCodes AND material_unit_price > 0
matL2Map: parallel query → es_dictionary WHERE knr_ref IN l2KnrCodes AND material_unit_price > 0
```

**Status**: Materiały są teraz pobierane z `es_dictionary.material_unit_price` gdy dostępne.  
Pokrycie zależy od ilości wpisów w `es_dictionary` z uzupełnionym `material_unit_price > 0`.

**Gdzie materiały są prawidłowo wyceniane**:
- L0: `matL0Map` z `es_dictionary` ✅ (v1.1)
- L1 (katalog osobisty): `base_material_price` z `catalog_items` ✅
- L2: `matL2Map` z `es_dictionary` ✅ (v1.1)
- L3 (Gemini): AI sugeruje ceny rynkowe hurtowe ✅
- Ręczny wpis użytkownika ✅

### 3.2 Fizyka — aktualny stan

| Mechanizm | Zaimplementowany | Gdzie |
|---|---|---|
| Cu vs Al (×1.1 dla Al) | ✅ TAK | `getCableComplexityModifier()` |
| Przekrój kabla ≤35/35-70/70-150/>150 | ✅ TAK | `getCableComplexityModifier()` |
| Materiał ściany żelbet/beton/cegła | ✅ TAK | `getSurfaceModifier()` |
| Gazobeton/Siporex/GK (lekkie) | ✅ TAK | `getSurfaceModifier()` |
| Grubość tynku / warstwa izolacji | ❌ NIE | brak danych wejściowych |
| Głębokość bruzdy (1-żyłowa vs 3-żyłowa) | ⚠️ CZĘŚCIOWO | `KNR 5-08 0102` (2-przewodowa) w JSON |
| Kąt montażu (poziomo/pionowo/sufit) | ❌ NIE | brak |
| Temperatura robocza (kable grzewcze) | ❌ NIE | brak |

### 3.3 Halucynacje AI — znane wzorce

| Wzorzec halucynacji | Przyczyna | Zabezpieczenie |
|---|---|---|
| labor_price = qty × unit_price (total zamiast unit) | AI mnoży przez ilość | Prompt: "ZAKAZ MNOZENIA", sanity check |
| "YDYzo 3×2.5" → material 236 PLN/mb | AI zwraca cenę za 100mb | Prompt: "BŁĄD TYPOWY: 236 PLN/mb" |
| index=0 w odpowiedzi (0-based) | Stary prompt 0-based | ✅ Naprawione: 1-based + Zod min(1) |
| Bardzo wysokie rbh/m dla kabli | AI wyobraża ciężki kabel | applySanityCheck (0.35 rbh/m limit) |
| L3 bez surface_mod/cable_mod | Brak modyfikatorów w L3 | ✅ v1.1 NAPRAWIONO [C2]: post-process l3CtxMap |

### 3.4 L3 — modyfikatory fizyczne (v1.1)

✅ **NAPRAWIONO [C2]**: L3 teraz stosuje `cable_mod` × `surface_mod` po odpowiedzi AI:

```typescript
const cML3 = getCableComplexityModifier(est.name);
const sML3 = getSurfaceModifier(est.name, l3CtxMap.get(est.itemId) ?? "");
const adjLab = Math.round(l3.labor_price * cML3 * sML3 * 100) / 100;

// l3CtxMap: Map<itemId, "section description"> zbudowana przed pętlą L3
```

**Przykład**: "ułożenie YKY 5×240 w żelbecie"
```
raw_AI = 25 PLN/mb
cable_mod(>150mm²) = 2.5
surface_mod(żelbet) = 2.5
adjLab = 25 × 2.5 × 2.5 = 156 PLN/mb  ✅
```

---

## 4. Architektura Danych

### 4.1 Przepływ importu (useProjectImport)

```
Plik Excel/CSV/TXT/PDF
      ↓
parseExcelFile / parsePrzedmiarText / Vision AI (PDF)
      ↓
AIProjectItem[] { name, unit, quantity, material_price=0, labor_price=0 }
      ↓
analyzeExcelStructure (GPT-4o) → mapowanie kolumn
      ↓
importItemsFromExcel (Server Action) → INSERT project_items
      ↓
estimatePricesWithAI (opcjonalnie po imporcie)
```

> Ceny po imporcie: `material_price=0`, `labor_price=0` — użytkownik musi wywołać AI pricing.

### 4.2 Tabele bazy danych (kluczowe)

| Tabela | Rola | Uwagi |
|---|---|---|
| `knr_norms` | Oficjalne normy KNR (full_code, labor_norm, unit) | unit może być "mb" lub "100mb" |
| `es_dictionary` | Słownik ES-Engine (keyword, knr_ref, labor_norm_rbh) | ~1000+ wpisów |
| `catalog_items` | Katalog osobisty użytkownika (materiał + robocizna) | L1 priority |
| `project_items` | Pozycje projektu (wynik importu + wyceny) | confidence_level enum |
| `profiles` | Stawka użytkownika (hourly_rate, custom_labor_rate) | |
| `admin_settings` | market_rbh_rate, material_inflation_multiplier | fetchBenchmarks() |
| `regions` | Województwa + price_modifier | 16 regionów |

### 4.3 JSON Normy Lokalne (knr-local-context)

Ładowane przy starcie serwera, używane jako kontekst dla AI:

```
data/knr/fixed_norms/
  es_knr_instalacja_podstawowa.json    ← bruzdowanie, puszki, gniazda
  es_knr_trasy_kablowe_pvc.json        ← korytka kablowe
  es_knr_zasilanie_wlz_szr.json        ← WLZ, SZR, agregaty
  es_knr_teletechnika_kompletna.json   ← LAN, CCTV, domofony
  es_knr_odgromowka_uziemienie.json    ← odgromówka
  es_knr_trasy_rozszerzone_2026.json   ← trasy rozszerzone
  ... (35 plików łącznie)

KnrEntry { catalog_code, description, unit, labor_norm, unit_factor?, synonyms[] }
unit_factor = 0.01 dla norm per-100m (DOMYŚLNIE: 1.0)

> ✅ **v1.1 NAPRAWIONO [M4]**: `buildLocalKnrContext()` teraz memoizowany przez `_contextCache`  
> Map<number, string> (klucz: Math.round(hourlyRate)). Pierwsze wywołanie O(n), kolejne O(1).

---

## 5. Znane Problemy i Ograniczenia

### Krytyczne — status po v1.1

| # | Problem | Status | Fix |
|---|---|---|---|
| C1 | Materiały = 0 w L0/L2 | ✅ NAPRAWIONO v1.1 | `matL0Map` + `matL2Map` z `es_dictionary` |
| C2 | L3 bez cable_mod/surface_mod | ✅ NAPRAWIONO v1.1 | Post-process `l3CtxMap` |
| C3 | Hardcoded 84/120 PLN | ✅ NAPRAWIONO v1.1 | Usunięte; fallback = `admin_settings.market_rbh_rate` |

### Średnio ważne — status po v1.1

| # | Problem | Status | Fix |
|---|---|---|---|
| M1 | VAT auto-switching | ✅ DECYZJA: nie implementować | Ręczny toggle (amber buttons w UI) |
| M2 | r-g sanity = 1.20 rbh za nisko | ✅ NAPRAWIONO v1.1 | r-g → 8.00 rbh |
| M3 | `section`/`description` type cast | ⚠️ AKCEPTOWALNY | Cast `item as typeof item & {...}` dziala; Supabase types statyczne |
| M4 | `buildLocalKnrContext` nie cachowany | ✅ NAPRAWIONO v1.1 | `_contextCache` Map<number,string> |
| M5 | `PRICING_STATIC_SYSTEM_PROMPT` nie cachowany | ❌ OTWARTE v1.2 | Google Context Caching (API Gemini) |

### Drobne — status po v1.1

| # | Problem | Status | Fix |
|---|---|---|---|
| D1 | Slash `/` w kodach KNR | ✅ NAPRAWIONO v1.1 | `.replace(/\//g,"-")` w pricing.ts L0 + vision route |
| D2 | `globalCtx` często null | ⚠️ OTWARTE | Fallback z `project.description` (v1.2) |
| D3 | "kabelkowe" ≠ "kablowe" | ⚠️ OTWARTE | Dodać synonim do `es_dictionary` |
| D4 | `szt` sanity za nisko dla rozdzielnic | ✅ NAPRAWIONO v1.1 | `PANEL_RE` + szt=24.0 dla rozdzielnic/tablic |

---

## 6. System Confidence Levels

| Level | Źródło | Przykład |
|---|---|---|
| `manual` | Użytkownik ręcznie wpisał | Cena z oferty handlowca |
| `high` | L0 Direct KNR / L1 Exact Catalog | Pozycja z własnego katalogu |
| `medium` | L2 ES-Dictionary fuzzy / L3 AI medium | Dopasowanie analogowe |
| `low` | L3 AI low / Sanity fail | Brak w bazie, AI szacunek |

---

## 7. Changelog v1.0 → v1.1

| # | Zmiana | Commit | Plik |
|---|---|---|---|
| 1 | Usunięcie `BASE_HOURLY_RATE=84` i `DEFAULT_LABOR_RATE=120` | 99c9d14d | `pricing.ts`, `global-benchmarks.ts` |
| 2 | L3 post-process: `cable_mod × surface_mod` z `l3CtxMap` | poprzedni | `pricing.ts` |
| 3 | L0 parallel: `matL0Map` z `es_dictionary` | poprzedni | `pricing.ts` |
| 4 | L2 parallel: `matL2Map` z `es_dictionary` | poprzedni | `pricing.ts` |
| 5 | Sanity `r-g`: 1.20 → 8.00 rbh | 99c9d14d | `pricing.ts` |
| 6 | Sanity `szt` rozdzielnic: +`PANEL_RE` → 24.0 rbh | 99c9d14d | `pricing.ts` |
| 7 | KNR "/" → "-" normalizacja w L0 query | 99c9d14d | `pricing.ts` |
| 8 | KNR "/" → "-" normalizacja w vision extraction | poprzedni | `api/ai/vision/route.ts` |
| 9 | Memoize `buildLocalKnrContext` z `_contextCache` | 99c9d14d | `knr-local-context.ts` |
| 10 | VAT toggle: decyzja MANUAL only, bez auto-switch | — | `ProjectControlPanel` |

## 8. Roadmap v1.2 (Otwarte zadania)

```
Sprint v1.2 (optymalizacja — ~6h):
  [M5]  Google Context Caching dla PRICING_STATIC_SYSTEM_PROMPT
  [D2]  globalCtx fallback: project.description gdy section=null
  [D3]  Dodac synonim "kabelkowe" → "kablowe" do es_dictionary
  [NEW] Uzupełnić material_unit_price w es_dictionary (top 200 pozycji)
  [NEW] es_dictionary coverage audit: ile wpisów ma material_unit_price > 0?
```

---

*Audyt v1.1 — 2026-03-16 | Commit: 99c9d14d*  
*Wszystkie krytyczne problemy z v1.0 NAPRAWIONE. Następny audyt po Sprint v1.2.*
