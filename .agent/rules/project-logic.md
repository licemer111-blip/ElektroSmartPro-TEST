---
trigger: always_on
---

# ⚡ ElektroSmart PRO — Project Rules (v9.0)

## 🏗 Architecture & Patterns
- **Database**: `createClient` из `@/utils/supabase/server` для серверных компонентов.
- **Server Actions**: Все мутации → Server Actions в `actions.ts` файлах.
- **Validation**: Zod или ручная проверка. Возвращать `{ success: boolean, error?: string }`.
- **Pure functions**: Вся бизнес-логика в `lib/services/` (без серверных зависимостей, testable).
- **NO console.log**: Только `logger.error` в catch блоках.

## 💰 Estimation Logic (CRITICAL — Expert Engine v9.0)

### Split Pricing (СВЯЩЕННОЕ ПРАВИЛО)
- `material_price` и `labor_price` — ВСЕГДА раздельно в DB. НИКОГДА не объединять.
- `final_material_price` и `final_labor_price` — финальные значения после коэффициентов.

### Expert Engine Pipeline
Порядок выполнения (НЕЛЬЗЯ нарушать):
1. L0: KNR exact match → L1: User catalog → L2: KNR fuzzy → L3: AI Gemini
2. `enforceKeywordRules` → `applySanityCheck` → `enforceExpertGuards`
3. `securityAuditLayer` — ПОСЛЕДНИЙ шаг, НЕЛЬЗЯ обойти, unskippable

SAL сохраняет в DB: `expert_override` BOOL, `is_low_confidence` BOOL, `calculation_log` TEXT.
Assembly children (`is_assembly_child=true`) → SAL их ПРОПУСКАЕТ.

### Regional Modifier
- Применяется ТОЛЬКО к `labor_price`. `material_price` НЕ меняется.
- Применяется при ОТОБРАЖЕНИИ (calcRowPrices), НЕ baked в DB цену.
- Пример: Mazowieckie = 1.20 × labor_price.

### VAT Logic (ОБНОВЛЕНО)
- VAT НЕ входит в `suggestedLabor`/`suggestedMaterial` — это NET цены.
- `project.vat_rate` (8 или 23) берётся из `object_types.default_vat_rate`.
- VAT применяется при генерации инвойса, НЕ в pricing engine.
- Material formula: `totalNet = base × qty × wasteFactor × (1 + margin%)`.

### Material Brain (v1.0)
- `classifyMaterial(name)` → category + wasteFactor + forcedUnit.
- CABLE→mb+waste1.10, PLASTER→kg+waste1.05, остальное→szt+waste1.0.
- `profiles.material_margin` (default 15%) — нарядка на материалы.
- Bridge: SemanticIntent → MaterialBill (suggestions, НЕ авто-вставка).

## 📂 Naming Conventions
- DB схемы: `public.projects`, `public.project_items`, `public.catalog_items`.
- Компоненты: PascalCase в `components/`.
- Pure modules: snake_case в `lib/services/` и `lib/config/`.