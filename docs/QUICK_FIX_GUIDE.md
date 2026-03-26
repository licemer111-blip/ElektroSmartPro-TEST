# ⚡ Быстрое исправление ошибок - Шпаргалка

Самые частые ошибки и их исправления в одном месте.

---

## 🔴 **ОШИБКА vs** 🟢 **ИСПРАВЛЕНИЕ**

### **1. Типы:**

```tsx
// 🔴 НЕПРАВИЛЬНО
const handleSelect = (item: any) => { ... }

// 🟢 ПРАВИЛЬНО
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
const handleSelect = (item: CatalogSearchResultWithCategory) => { ... }
```

---

### **2. Поле материала:**

```tsx
// 🔴 НЕПРАВИЛЬНО
item.price_material

// 🟢 ПРАВИЛЬНО
item.base_material_price
```

---

### **3. Поле работы:**

```tsx
// 🔴 НЕПРАВИЛЬНО
item.price_labor

// 🟢 ПРАВИЛЬНО
item.base_labor_price
```

---

### **4. Проверка типа:**

```tsx
// 🔴 НЕПРАВИЛЬНО
if (item.price_labor > 0) { ... }

// 🟢 ПРАВИЛЬНО
if (item.type === 'labor') { ... }
```

---

### **5. Расчет цены:**

```tsx
// 🔴 НЕПРАВИЛЬНО
const price = item.price_material || item.price_labor;

// 🟢 ПРАВИЛЬНО
const price = item.type === 'labor' 
  ? item.base_labor_price 
  : item.base_material_price;
```

---

### **6. Отображение цены:**

```tsx
// 🔴 НЕПРАВИЛЬНО
<div>{item.price_material} zł</div>

// 🟢 ПРАВИЛЬНО
const price = item.type === 'labor' 
  ? item.base_labor_price 
  : item.base_material_price;
<div>{price.toFixed(2)} PLN</div>
```

---

### **7. Категория:**

```tsx
// 🔴 НЕПРАВИЛЬНО (может быть null)
<div>{item.category_name}</div>

// 🟢 ПРАВИЛЬНО
<div>{item.category_name || 'Inne'}</div>
```

---

### **8. Хук:**

```tsx
// 🔴 НЕПРАВИЛЬНО (нет category_name)
const { query, setQuery, results } = useCatalogSearch();

// 🟢 ПРАВИЛЬНО (с category_name)
const { query, setQuery, results } = useSmartSearchWithCategory();
```

---

## 📋 **Копируй-Вставляй:**

### **Полный правильный код:**

```tsx
'use client';

import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';

export default function MyPage() {
  const handleSelect = (item: CatalogSearchResultWithCategory) => {
    // Правильный расчет цены
    const price = item.type === 'labor' 
      ? item.base_labor_price 
      : item.base_material_price;
    
    console.log('Выбрано:', item.name);
    console.log('Цена:', price);
    console.log('Категория:', item.category_name || 'Inne');
  };

  return (
    <div>
      <CatalogSearchInput onSelect={handleSelect} />
    </div>
  );
}
```

---

## 🔍 **Find & Replace:**

Если у тебя уже есть код с ошибками, используй поиск и замену:

| Найти | Заменить на |
|-------|-------------|
| `item.price_material` | `item.base_material_price` |
| `item.price_labor` | `item.base_labor_price` |
| `item.price_labor > 0` | `item.type === 'labor'` |
| `(item: any)` | `(item: CatalogSearchResultWithCategory)` |

**Не забудь добавить импорт:**
```tsx
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
```

---

## ✅ **Проверка перед деплоем:**

- [ ] Используешь `base_material_price` вместо `price_material`
- [ ] Используешь `base_labor_price` вместо `price_labor`
- [ ] Проверяешь тип через `item.type === 'labor'`
- [ ] Используешь `CatalogSearchResultWithCategory` вместо `any`
- [ ] Импортировал тип из `@/lib/catalog-api`
- [ ] Обрабатываешь `null` для `category_name`

---

## 🆘 **Если не работает:**

1. **Проверь, что миграция применена:**
   - Открой Supabase SQL Editor
   - Выполни: `SELECT * FROM search_catalog('test', 5);`
   - Если ошибка - примени миграцию из `supabase/migrations/20260122_fulltext_search_catalog.sql`

2. **Проверь, что функция существует:**
   ```sql
   SELECT * FROM smart_search_catalog_with_category('schneider', 10, NULL, NULL);
   ```

3. **Проверь импорты:**
   ```tsx
   import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput';
   import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
   ```

---

## 📚 **Подробнее:**

- 🎨 [Компоненты](CATALOG_SEARCH_COMPONENTS.md)
- 🎣 [Хук](USE_CATALOG_SEARCH_HOOK.md)
- ❌ [Частые ошибки](COMMON_MISTAKES.md)
- 📘 [API](CATALOG_API_SIMPLE.md)

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
