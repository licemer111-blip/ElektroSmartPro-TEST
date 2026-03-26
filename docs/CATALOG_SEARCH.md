# 🔍 Catalog Search System

Мощная система полнотекстового поиска для каталога ElektroSmart PRO с поддержкой fuzzy matching (поиск с опечатками).

---

## 📋 **Возможности:**

✅ **Full-text search** - поиск по названию, описанию, подкатегории  
✅ **Fuzzy matching** - обработка опечаток и частичных совпадений  
✅ **Smart search** - автоматический fallback на fuzzy при отсутствии точных результатов  
✅ **Фильтры** - по типу (material/labor), категории  
✅ **Ranking** - результаты отсортированы по релевантности  
✅ **Performance** - 5-20ms на запрос (с индексами)  
✅ **React Hook** - готовый хук с debounce для React компонентов  

---

## 🚀 **Установка:**

### **Шаг 1: Примени миграцию**

```bash
# В Supabase SQL Editor:
# Скопируй и выполни:
# supabase/migrations/20260122_fulltext_search_catalog.sql
```

**Что создастся:**
- Колонка `search_vector` (tsvector) для полнотекстового поиска
- GIN индекс для быстрого поиска
- Trigram индекс для fuzzy matching
- RPC функции: `search_catalog`, `fuzzy_search_catalog`, `smart_search_catalog`
- Триггер для автоматического обновления `search_vector`

### **Шаг 2: Импортируй утилиты**

```typescript
import { 
  searchCatalog, 
  searchMaterials, 
  searchLabor,
  useCatalogSearch 
} from '@/lib/catalog-search';
```

---

## 📖 **Использование:**

### **1. Базовый поиск**

```typescript
import { searchCatalog } from '@/lib/catalog-search';

// Поиск по всему каталогу
const results = await searchCatalog('schneider wyłącznik');

console.log(results);
// [
//   {
//     id: '...',
//     name: 'Wyłącznik różnicowo-prądowy iID (Ref: A9R41225)',
//     base_material_price: 156.78,
//     score: 0.95,
//     ...
//   },
//   ...
// ]
```

### **2. Поиск только материалов**

```typescript
import { searchMaterials } from '@/lib/catalog-search';

// Только материалы (type = 'material')
const materials = await searchMaterials('panel LED', 10);
```

### **3. Поиск только услуг**

```typescript
import { searchLabor } from '@/lib/catalog-search';

// Только услуги (type = 'labor')
const services = await searchLabor('montaż koryt', 15);
```

### **4. Поиск по категории**

```typescript
import { searchByCategory } from '@/lib/catalog-search';

const categoryId = '...'; // UUID категории
const items = await searchByCategory('gniazdo', categoryId);
```

### **5. Поиск по артикулу**

```typescript
import { searchByRefCode } from '@/lib/catalog-search';

// Поиск по артикулу Schneider
const product = await searchByRefCode('A9R41225');
```

### **6. Умный поиск (с fallback)**

```typescript
import { smartSearchCatalog } from '@/lib/catalog-search';

// Сначала full-text, потом fuzzy (если нет результатов)
const results = await smartSearchCatalog('shneider wyłachnik'); // С опечатками!
```

### **7. Fuzzy поиск (для опечаток)**

```typescript
import { fuzzySearchCatalog } from '@/lib/catalog-search';

// Только fuzzy (для сильных опечаток)
const results = await fuzzySearchCatalog('shnyder', 10);
```

---

## ⚛️ **React Hook:**

### **Базовое использование:**

```typescript
'use client';

import { useCatalogSearch } from '@/lib/catalog-search';

export function SearchComponent() {
  const { query, setQuery, results, loading, error } = useCatalogSearch('', {
    limit: 20,
    useSmart: true, // Используй smart search (с fallback)
  });

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj w katalogu..."
        className="border p-2"
      />
      
      {loading && <p>Ładowanie...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <ul className="mt-4 space-y-2">
        {results.map((item) => (
          <li key={item.id} className="border p-3 rounded">
            <h3 className="font-bold">{item.name}</h3>
            <p className="text-sm text-gray-600">
              {item.base_material_price > 0 
                ? `${item.base_material_price} PLN` 
                : `${item.base_labor_price} PLN/roboczogodzina`}
            </p>
            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
              {item.type === 'material' ? 'Materiał' : 'Usługa'}
            </span>
            {item.score && (
              <span className="text-xs text-gray-500 ml-2">
                Relevance: {(item.score * 100).toFixed(0)}%
              </span>
            )}
          </li>
        ))}
      </ul>
      
      {results.length === 0 && query && !loading && (
        <p className="text-gray-500 mt-4">Brak wyników dla "{query}"</p>
      )}
    </div>
  );
}
```

### **С фильтрами:**

```typescript
'use client';

import { useCatalogSearch } from '@/lib/catalog-search';
import { useState } from 'react';

export function AdvancedSearch() {
  const [filterType, setFilterType] = useState<'material' | 'labor' | null>(null);
  
  const { query, setQuery, results, loading } = useCatalogSearch('', {
    limit: 20,
    filterType,
    useSmart: true,
  });

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj..."
      />
      
      <div className="flex gap-2 mt-2">
        <button 
          onClick={() => setFilterType(null)}
          className={filterType === null ? 'font-bold' : ''}
        >
          Wszystko
        </button>
        <button 
          onClick={() => setFilterType('material')}
          className={filterType === 'material' ? 'font-bold' : ''}
        >
          Materiały
        </button>
        <button 
          onClick={() => setFilterType('labor')}
          className={filterType === 'labor' ? 'font-bold' : ''}
        >
          Usługi
        </button>
      </div>
      
      {/* Results... */}
    </div>
  );
}
```

---

## 🎯 **API Reference:**

### **searchCatalog(query, options)**

Основная функция полнотекстового поиска.

**Параметры:**
- `query: string` - Поисковый запрос (мин. 2 символа)
- `options.limit?: number` - Лимит результатов (default: 20)
- `options.filterType?: 'material' | 'labor' | null` - Фильтр по типу
- `options.filterCategoryId?: string | null` - Фильтр по категории

**Возвращает:** `Promise<CatalogSearchResult[]>`

**Пример:**
```typescript
const results = await searchCatalog('schneider', {
  limit: 10,
  filterType: 'material',
});
```

---

### **smartSearchCatalog(query, options)**

Умный поиск с автоматическим fallback на fuzzy.

**Логика:**
1. Сначала полнотекстовый поиск
2. Если результатов нет → fuzzy search

**Пример:**
```typescript
// Обработает опечатки автоматически
const results = await smartSearchCatalog('shneider wyłachnik');
```

---

### **fuzzySearchCatalog(query, options)**

Поиск с обработкой опечаток.

**Использует:**
- `pg_trgm` (trigram similarity)
- `ILIKE` для частичных совпадений

**Пример:**
```typescript
// Найдет "Schneider" даже при вводе "Shnyder"
const results = await fuzzySearchCatalog('shnyder', { limit: 10 });
```

---

### **useCatalogSearch(initialQuery, options, debounceMs)**

React Hook для поиска с debounce.

**Параметры:**
- `initialQuery: string` - Начальный запрос (default: '')
- `options: SearchOptions` - Опции поиска
- `debounceMs: number` - Задержка debounce (default: 300ms)

**Возвращает:**
```typescript
{
  query: string;
  setQuery: (q: string) => void;
  results: CatalogSearchResult[];
  loading: boolean;
  error: string | null;
}
```

---

## 🔧 **Типы:**

### **CatalogSearchResult**

```typescript
interface CatalogSearchResult {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  base_material_price: number;
  base_labor_price: number;
  type: 'material' | 'labor';
  category_id: string;
  sub_category: string | null;
  market_comment: string | null;
  price_min?: number | null;
  price_max?: number | null;
  price_trend?: string | null;
  confidence_level?: string | null;
  score?: number; // Relevance score (0-1)
  match_type?: 'fulltext' | 'fuzzy'; // Match type (only in smart_search)
}
```

### **SearchOptions**

```typescript
interface SearchOptions {
  limit?: number;
  filterType?: 'material' | 'labor' | null;
  filterCategoryId?: string | null;
  useFuzzy?: boolean;
  useSmart?: boolean;
}
```

---

## ⚡ **Performance:**

### **Benchmarks (14k+ items):**

| Метод | Время выполнения | Индексы |
|-------|------------------|---------|
| Full-text search | 5-15ms | GIN (search_vector) |
| Fuzzy search | 20-50ms | GIN (trigram) |
| Smart search | 5-50ms | Оба индекса |

### **Оптимизация:**

1. **GIN индекс** на `search_vector` → быстрый полнотекстовый поиск
2. **Trigram индекс** на `name` → быстрый fuzzy search
3. **Auto-trigger** → `search_vector` обновляется автоматически при INSERT/UPDATE

---

## 🐛 **Troubleshooting:**

### **Проблема: "RPC function not found"**

**Причина:** Миграция не применена.

**Решение:**
```sql
-- Выполни в Supabase SQL Editor:
-- supabase/migrations/20260122_fulltext_search_catalog.sql
```

### **Проблема: "No results for existing items"**

**Причина:** `search_vector` не обновлен.

**Решение:**
```sql
-- Переиндексация:
UPDATE catalog_items
SET search_vector = 
  setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(sub_category, '')), 'C');
```

### **Проблема: "Slow search performance"**

**Причина:** Индексы не созданы.

**Решение:**
```sql
-- Проверь индексы:
SELECT indexname FROM pg_indexes WHERE tablename = 'catalog_items';

-- Должны быть:
-- catalog_items_search_vector_idx (GIN)
-- catalog_items_name_trgm_idx (GIN)
```

---

## 📊 **Примеры запросов:**

### **1. Поиск Schneider продуктов:**
```typescript
const results = await searchCatalog('schneider');
// Найдет все позиции с "Schneider" в названии/описании
```

### **2. Поиск панелей LED:**
```typescript
const panels = await searchCatalog('panel LED 60x60', { limit: 10 });
```

### **3. Поиск услуг монтажа:**
```typescript
const services = await searchLabor('montaż koryt kablowych');
```

### **4. Поиск по артикулу:**
```typescript
const product = await searchByRefCode('A9R41225');
```

### **5. Поиск с опечаткой:**
```typescript
const results = await smartSearchCatalog('shnyder wyłachnik');
// Найдет "Schneider Wyłącznik"
```

---

## 🎯 **Best Practices:**

1. **Используй `smartSearchCatalog`** для пользовательского ввода (обрабатывает опечатки)
2. **Используй `searchCatalog`** для точного поиска (быстрее)
3. **Используй React Hook** для компонентов поиска (встроенный debounce)
4. **Ограничивай результаты** (limit: 20-50 оптимально)
5. **Фильтруй по типу** для специфичных запросов (материалы/услуги)

---

## 🔮 **Roadmap:**

- [ ] Поиск по синонимам (словарь)
- [ ] Поиск по цене (диапазон)
- [ ] Autocomplete suggestions
- [ ] Search history
- [ ] Popular searches (trending)

---

**Автор:** ElektroSmart PRO Team  
**Дата:** 22 stycznia 2026  
**Версия:** 1.0
