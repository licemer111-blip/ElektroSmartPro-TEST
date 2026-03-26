# ⚡ БЫСТРЫЙ СТАРТ: Catalog Search

Подключение полнотекстового поиска в ElektroSmart PRO за 5 минут.

---

## 🚀 3 простых шага:

### **Шаг 1: Примени миграцию**

В Supabase SQL Editor выполни:
```sql
-- Скопируй весь файл:
supabase/migrations/20260122_fulltext_search_catalog.sql
```

**Результат:** Создастся поиск с индексами (~5-20ms на запрос)

---

### **Шаг 2: Импортируй утилиты**

```typescript
import { searchCatalog } from '@/lib/catalog-search';

// Поиск
const results = await searchCatalog('schneider wyłącznik');

console.log(results);
// [{ name: '...', base_material_price: 156.78, score: 0.95 }, ...]
```

---

### **Шаг 3: Используй компонент**

```tsx
import { CatalogSearchInput } from '@/components/catalog/catalog-search-input';

export function MyComponent() {
  return (
    <CatalogSearchInput
      onSelectItem={(item) => console.log('Выбрано:', item)}
      placeholder="Szukaj materiałów..."
      filterType="material"
    />
  );
}
```

**Готово!** Компонент с автокомплитом, клавиатурной навигацией и обработкой опечаток.

---

## 📖 **Подробнее:**

Полная документация: `docs/CATALOG_SEARCH.md`

---

## 🎯 **Примеры:**

### **1. Поиск по названию:**
```typescript
const panels = await searchCatalog('panel LED 60x60');
```

### **2. Поиск с опечаткой:**
```typescript
import { smartSearchCatalog } from '@/lib/catalog-search';

// Найдет "Schneider" даже при вводе "Shnyder"
const results = await smartSearchCatalog('shnyder wyłachnik');
```

### **3. Поиск только материалов:**
```typescript
import { searchMaterials } from '@/lib/catalog-search';

const materials = await searchMaterials('gniazdo', 10);
```

### **4. React Hook:**
```tsx
import { useCatalogSearch } from '@/lib/catalog-search';

function SearchComponent() {
  const { query, setQuery, results, loading } = useCatalogSearch('', {
    limit: 20,
    useSmart: true,
  });

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
      />
      {loading && <p>Ładowanie...</p>}
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## ✅ **Фичи:**

- ✅ Full-text search (по названию, описанию, категории)
- ✅ Fuzzy matching (обработка опечаток)
- ✅ Smart search (автоматический fallback)
- ✅ Фильтры (material/labor, категории)
- ✅ Ranking (сортировка по релевантности)
- ✅ Performance (5-20ms на 14k+ позиций)
- ✅ React Hook (с debounce)
- ✅ UI компонент (autocomplete)

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
