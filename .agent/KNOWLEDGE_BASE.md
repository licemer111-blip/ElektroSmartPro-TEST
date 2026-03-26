# ⚡ ElektroSmart PRO — Agent Knowledge Base (v9.0 / 2026-03)

## 📋 Project Summary
**ElektroSmart PRO** — профессиональная SaaS система экспертной оценки (kosztorys) для польских электриков. НЕ простой калькулятор — экспертная система с Мозгом+Мышцей.
- **Рынок**: Польша (16 воеводств, польский VAT 8%/23%, нормы KNR).
- **AI модель**: Google Gemini 2.0 Flash (через @ai-sdk/google). НЕ OpenAI.
- **Версия движка**: Expert Engine v9.0 + Material Brain v1.0.

## 🛠 Tech Stack
- **Framework**: Next.js 14+ (App Router, Server Actions). НЕ Next.js 15.
- **Language**: TypeScript strict (NO `any`).
- **Database**: Supabase (PostgreSQL, RLS на ВСЕХ таблицах).
- **Styling**: Tailwind CSS + Shadcn UI + Lucide React.
- **Payments**: Stripe (Free / PRO).
- **AI**: Google Gemini 2.0 Flash + Vision API.

## 💰 IRON RULES (v9.0)

### 1. Split Pricing (SACRED)
- Каждая позиция: `material_price` + `labor_price` ОТДЕЛЬНО. НИКОГДА не объединять.
- Регион умножает ТОЛЬКО `labor_price`. `material_price` без изменений.
- Регион применяется при ОТОБРАЖЕНИИ (calcRowPrices), НЕ в DB.

### 2. Free Tier (ОБНОВЛЕНО)
- Free: max **3** активных проекта (НЕ 1 — это устаревшая инфо).
- PRO: max_projects=999. PDF export: только PRO. Цены blurred для free.

### 3. Expert Engine Pipeline (L0→SAL)
```
KNR exact (L0) → user catalog (L1) → KNR fuzzy (L2) → AI Gemini (L3)
→ enforceKeywordRules → applySanityCheck → enforceExpertGuards
→ securityAuditLayer  ← ПОСЛЕДНИЙ шаг, НЕЛЬЗЯ обойти
```
SAL hardcoded floors: HEAVY_CONNECTION 140.40 PLN · STANDARD_ACTION 45 PLN · HARD_CONSTRUCTION 40.50 PLN · DRILLING_HARD 35 PLN · MAX_LABOR 2000 PLN.
SAL persists to DB: `expert_override` BOOL · `is_low_confidence` BOOL · `calculation_log` TEXT.

### 4. Material Brain (v1.0) — НОВОЕ
- `classifyMaterial(name)` → CABLE/BREAKER/SOCKET/BOX/PLASTER/HARDWARE/GENERAL.
- Auto-unit: CABLE→mb (waste +10%), PLASTER→kg (waste +5%), остальное→szt.
- Formula: `totalNet = base × qty × wasteFactor × (1 + margin%)`.
- Smart VAT: residential 8%, commercial 23% из project.vat_rate.
- Bridge: HEAVY_CONNECTION → [YKY 5×2.5 8mb, MCB 3P B16, Puszka IP65, Dławnica PG16].
- Settings: `profiles.material_margin` (default 15%), `profiles.waste_factor_pct` (default 10%).

### 5. Zestawy (Assemblies)
- 9 рецептов в `lib/config/zestawy-recipes.ts`.
- Дочерние элементы (`is_assembly_child=true`) — SAL их ПРОПУСКАЕТ.
- MaterialBill bridge: `lib/config/material-bill-bridge.ts`.

### 6. VAT
- `projects.vat_rate` (8 или 23). Источник: `object_types.default_vat_rate`.
- 8%: Mieszkanie/Dom. 23%: Biuro/Sklep/Przemysł.
- VAT применяется при выставлении счёта, НЕ в ценах wyceny.

## 🗃 Database (Ключевые таблицы)
- `profiles`: ставки, margin, multiplier, KNR коэффициенты, PRO статус.
- `projects`: основные сметы, vat_rate, object_type_id.
- `project_items`: позиции сметы. NEW cols: `expert_override`, `is_low_confidence`, `calculation_log`.
- `catalog_items`: каталог пользователя.
- `regions`: 16 воеводств + price_modifier.
- `object_types`: типы объектов + default_vat_rate.
- `knr_norms`: нормы KNR (full_code, labor_norm, unit).
- `es_dictionary`: словарь ES + material_unit_price.

## 📍 Ключевые файлы
- `lib/services/semantic-classifier.ts` — Labor Brain (classifyIntent, SAL floors)
- `lib/services/material-classifier.ts` — Material Brain (classifyMaterial, calculateMaterialTotal)
- `lib/config/zestawy-recipes.ts` — 9 assembly recipes
- `lib/config/material-bill-bridge.ts` — LaborIntent → MaterialBill
- `app/dashboard/projects/[id]/_ai_actions/pricing.ts` — Expert Engine (~2450 lines)
- `tests/smoke-test-v1.test.ts` — 37 Labor Engine tests (Golden Standard)
- `tests/material-classifier.test.ts` — 34 Material Brain tests
- Total test suite: **576 tests / 15 файлов** — все GREEN ✅.

## 📝 Coding Standards
- NO `console.log` в production (только `logger.error` в catch).
- NO `any` types.
- Pure functions в `lib/services/` (без серверных зависимостей, vitest-safe).
- UI на Polish, чат с разработчиком на Russian.

---
*Обновлено 2026-03 после Expert Engine v9.0 + Material Brain v1.0. Supabase TEST: upwctgdpuckreoquofiu / LIVE: jbxveulddoznswyeihda.*
