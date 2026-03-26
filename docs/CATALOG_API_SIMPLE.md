# 🔍 Catalog Search API - Упрощенная версия

Простой и понятный API для поиска по каталогу ElektroSmart PRO.

---

## 📋 **Два варианта API:**

### **1. Полная версия** (`lib/catalog-search.ts`)
- ✅ Максимальный функционал
- ✅ React Hook с debounce
- ✅ UI компонент
- ✅ Все опции фильтрации
- 📖 Документация: [`docs/CATALOG_SEARCH.md`](CATALOG_SEARCH.md)

### **2. Упрощенная версия** (`lib/catalog-api.ts`) ← **Эта версия**
- ✅ Простой API без лишних опций
- ✅ Меньше кода
- ✅ Быстрый старт
- 📖 Документация: этот файл

---

## 🚀 **Быстрый старт:**

### **Установка:**

```bash
# 1. Примени миграцию в Supabase SQL Editor:
supabase/migrations/20260122_fulltext_search_catalog.sql

# 2. (Опционально) Для category_name примени:
supabase/migrations/20260122_search_with_category_name.sql
```

### **Использование:**

```typescript
import { searchCatalog } from '@/lib/catalog-api';

// Базовый поиск
const results = await searchCatalog('schneider wyłącznik');

console.log(results);
// [
//   {
//     id: '...',
//     name: 'Wyłącznik...',
//     base_material_price: 156.78,
//     base_labor_price: 0,
//     unit: 'szt.',
//     type: 'material',
//     score: 0.95
//   }
// ]
```

---

## 📖 **API Reference:**

### **searchCatalog(query, limit)**

Базовый полнотекстовый поиск.

```typescript
async function searchCatalog(
  query: string,
  limit?: number = 20
): Promise<CatalogSearchResult[]>
```

**Параметры:**
- `query` - Поисковый запрос (мин. 2 символа)
- `limit` - Макс. результатов (default: 20)

**Возвращает:**
```typescript
type CatalogSearchResult = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  base_material_price: number;  // ← Правильное имя поля!
  base_labor_price: number;     // ← Правильное имя поля!
  type: 'material' | 'labor';
  category_id: string;
  sub_category: string | null;
  score: number;                // Релевантность (0-1)
  // ... и другие поля
};
```

**Пример:**
```typescript
const results = await searchCatalog('panel LED', 10);
```

---

### **smartSearchCatalog(query, limit)**

Умный поиск с автоматической обработкой опечаток.

```typescript
async function smartSearchCatalog(
  query: string,
  limit?: number = 20
): Promise<CatalogSearchResult[]>
```

**Логика:**
1. Сначала полнотекстовый поиск
2. Если нет результатов → fuzzy search (обработка опечаток)

**Пример:**
```typescript
// Найдет "Schneider Wyłącznik" даже с опечатками!
const results = await smartSearchCatalog('shneider wyłachnik');
```

---

### **searchMaterials(query, limit)**

Поиск только материалов (`type = 'material'`).

```typescript
const materials = await searchMaterials('gniazdo', 20);
```

---

### **searchLabor(query, limit)**

Поиск только услуг (`type = 'labor'`).

```typescript
const services = await searchLabor('montaż koryt', 15);
```

---

### **searchCatalogWithCategory(query, limit)**

Поиск с названием категории (включает `category_name`).

```typescript
async function searchCatalogWithCategory(
  query: string,
  limit?: number = 20
): Promise<CatalogSearchResultWithCategory[]>
```

**Возвращает дополнительное поле:**
- `category_name: string | null` - Название категории

**Пример:**
```typescript
const results = await searchCatalogWithCategory('gniazdo');

console.log(results[0].category_name); // "Osprzęt i punkty"
```

---

### **smartSearchWithCategory(query, limit)**

Умный поиск + название категории (рекомендуется для UI).

```typescript
const results = await smartSearchWithCategory('panel led', 20);

// Обрабатывает опечатки + возвращает category_name
console.log(results[0].category_name); // "Oświetlenie"
```

---

### **simpleSearch(query, limit, withCategory)**

Упрощенная версия (только основные поля).

```typescript
async function simpleSearch(
  query: string,
  limit?: number = 20,
  withCategory?: boolean = false
): Promise<SimpleCatalogItem[]>
```

**Возвращает:**
```typescript
type SimpleCatalogItem = {
  id: string;
  name: string;
  unit: string;
  price: number;              // Материал ИЛИ работа (зависит от type)
  type: 'material' | 'labor';
  score: number;
  category_name?: string | null; // Если withCategory = true
};
```

**Пример:**
```typescript
// Без категории
const simple = await simpleSearch('gniazdo');

// С категорией
const simpleWithCat = await simpleSearch('gniazdo', 20, true);

console.log(simpleWithCat[0].price); // Одна цена (материал или работа)
console.log(simpleWithCat[0].category_name); // "Osprzęt i punkty"
```

---

## 🆚 **Какую версию использовать?**

### **Используй базовые функции (`searchCatalog`, `smartSearchCatalog`):**
- ✅ Когда не нужно название категории (только `category_id`)
- ✅ Максимальная производительность (~5-20ms)
- ✅ Для внутренней логики

### **Используй версию "WithCategory":**
- ✅ Когда нужно отображать название категории в UI
- ✅ Для пользовательских интерфейсов
- ⚠️ Немного медленнее (~7-25ms) из-за LEFT JOIN

### **Используй `simpleSearch`:**
- ✅ Когда нужны только основные поля
- ✅ Для автокомплита
- ✅ Для выпадающих списков

---

## 💡 **Примеры использования:**

### **1. Базовый поиск в React:**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { searchCatalog } from '@/lib/catalog-api';

export function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await searchCatalog(query);
      setResults(data);
      setLoading(false);
    }, 300); // Debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj..."
      />
      {loading && <p>Ładowanie...</p>}
      <ul>
        {results.map((item) => (
          <li key={item.id}>
            {item.name} - {item.base_material_price} PLN
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### **2. Умный поиск с категорией:**

```typescript
import { smartSearchWithCategory } from '@/lib/catalog-api';

async function handleSearch(query: string) {
  const results = await smartSearchWithCategory(query, 20);
  
  // Обрабатывает опечатки + возвращает category_name
  results.forEach((item) => {
    console.log(`${item.name} (${item.category_name})`);
    // "Wyłącznik... (Rozdzielnice)"
  });
}
```

---

### **3. Автокомплит (упрощенная версия):**

```typescript
import { simpleSearch } from '@/lib/catalog-api';

async function autocomplete(query: string) {
  const results = await simpleSearch(query, 10, true);
  
  return results.map((item) => ({
    label: `${item.name} (${item.category_name})`,
    value: item.id,
    price: item.price,
  }));
}
```

---

### **4. Поиск материалов для проекта:**

```typescript
import { searchMaterials } from '@/lib/catalog-api';

async function addMaterialToProject(query: string) {
  const materials = await searchMaterials(query, 20);
  
  // Только материалы (type = 'material')
  const selected = materials[0];
  
  await addItemToProject({
    catalogItemId: selected.id,
    quantity: 1,
    price: selected.base_material_price,
  });
}
```

---

### **5. Поиск услуг для предмера:**

```typescript
import { searchLabor } from '@/lib/catalog-api';

async function addLaborService(query: string) {
  const services = await searchLabor(query);
  
  // Только услуги (type = 'labor')
  const service = services[0];
  
  console.log(`${service.name}: ${service.base_labor_price} PLN/rbh`);
}
```

---

## ⚠️ **Важные замечания:**

### **1. Правильные имена полей:**

❌ **НЕ ИСПОЛЬЗУЙ:**
```typescript
item.price_material  // НЕПРАВИЛЬНО
item.price_labor     // НЕПРАВИЛЬНО
```

✅ **ИСПОЛЬЗУЙ:**
```typescript
item.base_material_price  // ПРАВИЛЬНО
item.base_labor_price     // ПРАВИЛЬНО
```

### **2. category_name vs category_id:**

```typescript
// Базовая версия (без JOIN)
const results = await searchCatalog('gniazdo');
console.log(results[0].category_id);   // UUID категории
console.log(results[0].category_name); // undefined (не включено)

// Версия с категорией (с JOIN)
const resultsWithCat = await searchCatalogWithCategory('gniazdo');
console.log(resultsWithCat[0].category_id);   // UUID категории
console.log(resultsWithCat[0].category_name); // "Osprzęt i punkty"
```

### **3. Performance:**

```
searchCatalog():             5-20ms   (без JOIN)
searchCatalogWithCategory(): 7-25ms   (с LEFT JOIN)
smartSearchCatalog():        5-50ms   (fallback на fuzzy)
smartSearchWithCategory():   7-55ms   (JOIN + fallback)
```

**Рекомендация:** Используй версию "WithCategory" только когда нужно отображать название в UI.

---

## 🔄 **Миграция с твоей старой версии:**

### **Было (твоя версия):**
```typescript
export type CatalogSearchResult = {
  id: string;
  name: string;
  category_name: string;      // ← Неправильно (не возвращается RPC)
  unit: string;
  price_material: number;     // ← Неправильно
  price_labor: number;        // ← Неправильно
  score: number;
};
```

### **Стало (правильная версия):**
```typescript
export type CatalogSearchResult = {
  id: string;
  name: string;
  unit: string;
  base_material_price: number; // ← Правильно
  base_labor_price: number;    // ← Правильно
  category_id: string;         // ← UUID категории
  score: number;
  // ... и другие поля
};

// Для category_name используй:
export type CatalogSearchResultWithCategory = CatalogSearchResult & {
  category_name: string | null;
};
```

### **Замена кода:**
```typescript
// Было:
const results = await searchCatalog('query');
console.log(results[0].price_material);

// Стало:
const results = await searchCatalog('query');
console.log(results[0].base_material_price);

// Для category_name:
const results = await searchCatalogWithCategory('query');
console.log(results[0].category_name);
```

---

## 📚 **См. также:**

- 📖 [`docs/CATALOG_SEARCH.md`](CATALOG_SEARCH.md) - Полная документация
- ⚡ [`docs/QUICK_START_SEARCH.md`](QUICK_START_SEARCH.md) - Быстрый старт

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
