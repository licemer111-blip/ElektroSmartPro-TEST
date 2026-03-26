# 🎣 useCatalogSearch Hook

React Hook для поиска по каталогу с debounce, обработкой ошибок и гибкими настройками.

---

## 🚀 **Быстрый старт:**

```tsx
import { useSmartSearchWithCategory } from '@/hooks/use-catalog-search';

function SearchComponent() {
  const { query, setQuery, results, isLoading } = useSmartSearchWithCategory();

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj..."
      />
      {isLoading && <p>Ładowanie...</p>}
      {results.map((item) => (
        <div key={item.id}>
          {item.name} - {item.category_name}
        </div>
      ))}
    </div>
  );
}
```

---

## 📖 **API:**

### **useCatalogSearch(options)**

Основной хук для поиска.

```typescript
interface UseCatalogSearchOptions {
  mode?: SearchMode;           // Режим поиска (default: 'smart')
  debounceMs?: number;          // Задержка debounce (default: 300ms)
  limit?: number;               // Макс. результатов (default: 20)
  minQueryLength?: number;      // Мин. длина запроса (default: 2)
  autoSearch?: boolean;         // Авто-поиск (default: true)
}

interface UseCatalogSearchReturn {
  query: string;                // Текущий запрос
  setQuery: (query: string) => void;
  results: CatalogSearchResult[];
  isLoading: boolean;
  error: Error | null;
  search: (customQuery?: string) => Promise<void>;
  clear: () => void;
  hasResults: boolean;
}
```

---

## 🎯 **Режимы поиска (SearchMode):**

| Режим | Описание | Функция |
|-------|----------|---------|
| `'basic'` | Базовый полнотекстовый поиск | `searchCatalog()` |
| `'smart'` | Умный поиск (опечатки) | `smartSearchCatalog()` |
| `'withCategory'` | С названием категории | `searchCatalogWithCategory()` |
| `'smartCategory'` | Умный + категория (рекомендуется) | `smartSearchWithCategory()` |
| `'materials'` | Только материалы | `searchMaterials()` |
| `'labor'` | Только услуги | `searchLabor()` |

---

## 💡 **Примеры:**

### **1. Умный поиск (с опечатками):**

```tsx
import { useSmartSearch } from '@/hooks/use-catalog-search';

function SearchInput() {
  const { query, setQuery, results, isLoading } = useSmartSearch();

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {results.map(item => <div key={item.id}>{item.name}</div>)}
    </>
  );
}
```

---

### **2. С названием категории (для UI):**

```tsx
import { useSmartSearchWithCategory } from '@/hooks/use-catalog-search';

function CatalogSearch() {
  const { query, setQuery, results } = useSmartSearchWithCategory();

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {results.map(item => (
        <div key={item.id}>
          {item.name} ({item.category_name})
        </div>
      ))}
    </>
  );
}
```

---

### **3. Только материалы:**

```tsx
import { useMaterialsSearch } from '@/hooks/use-catalog-search';

function MaterialsPicker() {
  const { query, setQuery, results } = useMaterialsSearch(10);

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj materiałów..."
      />
      {results.map(item => (
        <div key={item.id}>
          {item.name} - {item.base_material_price} PLN
        </div>
      ))}
    </>
  );
}
```

---

### **4. Только услуги:**

```tsx
import { useLaborSearch } from '@/hooks/use-catalog-search';

function LaborPicker() {
  const { query, setQuery, results } = useLaborSearch();

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Szukaj usług..."
      />
      {results.map(item => (
        <div key={item.id}>
          {item.name} - {item.base_labor_price} PLN/rbh
        </div>
      ))}
    </>
  );
}
```

---

### **5. С кнопкой "Очистить":**

```tsx
import { useSmartSearchWithCategory } from '@/hooks/use-catalog-search';

function SearchWithClear() {
  const { query, setQuery, results, clear, hasResults } =
    useSmartSearchWithCategory();

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {hasResults && <button onClick={clear}>Wyczyść</button>}
      <div>Wyniki: {results.length}</div>
    </div>
  );
}
```

---

### **6. Ручной поиск (с кнопкой):**

```tsx
import { useCatalogSearch } from '@/hooks/use-catalog-search';

function ManualSearch() {
  const { query, setQuery, search, results, isLoading } = useCatalogSearch({
    mode: 'smartCategory',
    autoSearch: false, // ← Отключаем авто-поиск
  });

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={() => search()} disabled={isLoading}>
        Szukaj
      </button>
      {results.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

---

### **7. Обработка ошибок:**

```tsx
import { useSmartSearch } from '@/hooks/use-catalog-search';

function SearchWithErrors() {
  const { query, setQuery, results, isLoading, error } = useSmartSearch();

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      
      {isLoading && <p>Ładowanie...</p>}
      {error && <p className="text-red-500">Błąd: {error.message}</p>}
      
      {results.map(item => <div key={item.id}>{item.name}</div>)}
    </div>
  );
}
```

---

### **8. Кастомные настройки:**

```tsx
import { useCatalogSearch } from '@/hooks/use-catalog-search';

function CustomSearch() {
  const search = useCatalogSearch({
    mode: 'smartCategory',
    debounceMs: 500,      // Увеличить debounce
    limit: 15,            // Макс. 15 результатов
    minQueryLength: 3,    // Искать от 3 символов
  });

  return (
    <div>
      <input
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
      />
      {search.results.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

---

## 🔧 **Продвинутые примеры:**

### **Автокомплит с выбором:**

```tsx
'use client';

import { useState } from 'react';
import { useSmartSearchWithCategory } from '@/hooks/use-catalog-search';

function Autocomplete({ onSelect }: { onSelect: (itemId: string) => void }) {
  const { query, setQuery, results, clear } = useSmartSearchWithCategory(10);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSelect = (itemId: string) => {
    onSelect(itemId);
    clear();
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder="Wybierz pozycję..."
      />
      
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border shadow-lg">
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-gray-500">
                {item.category_name} • {item.base_material_price} PLN
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### **Поиск с фильтрами:**

```tsx
'use client';

import { useState } from 'react';
import { useCatalogSearch, type SearchMode } from '@/hooks/use-catalog-search';

function SearchWithFilters() {
  const [mode, setMode] = useState<SearchMode>('smartCategory');
  const search = useCatalogSearch({ mode, limit: 20 });

  return (
    <div>
      {/* Фильтр типа */}
      <select value={mode} onChange={(e) => setMode(e.target.value as SearchMode)}>
        <option value="smartCategory">Wszystko</option>
        <option value="materials">Tylko materiały</option>
        <option value="labor">Tylko usługi</option>
      </select>

      {/* Поиск */}
      <input
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
        placeholder="Szukaj..."
      />

      {/* Результаты */}
      <div>
        {search.results.map((item) => (
          <div key={item.id}>
            {item.name} ({item.type === 'material' ? 'Materiał' : 'Usługa'})
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ⚡ **Performance:**

| Режим | Среднее время | Описание |
|-------|---------------|----------|
| `basic` | 5-20ms | Самый быстрый |
| `smart` | 5-50ms | С fallback на fuzzy |
| `withCategory` | 7-25ms | + LEFT JOIN |
| `smartCategory` | 7-55ms | Полный функционал |

**Debounce:** 300ms (default) = задержка перед запросом после ввода

---

## 🆚 **Какую версию использовать?**

### **Для большинства случаев:**
```tsx
useSmartSearchWithCategory()
```
✅ Обрабатывает опечатки  
✅ Возвращает `category_name`  
✅ Универсальный

### **Для списков материалов:**
```tsx
useMaterialsSearch()
```
✅ Только материалы  
✅ Проще фильтровать

### **Для списков услуг:**
```tsx
useLaborSearch()
```
✅ Только услуги  
✅ Быстрый доступ

### **Для кастомизации:**
```tsx
useCatalogSearch({ mode, debounceMs, limit })
```
✅ Полный контроль

---

## 📚 **Связанные файлы:**

- 📖 [`hooks/use-catalog-search.ts`](../hooks/use-catalog-search.ts) - Исходный код хука
- 📖 [`lib/catalog-api.ts`](../lib/catalog-api.ts) - API функции
- 📄 [`docs/CATALOG_API_SIMPLE.md`](CATALOG_API_SIMPLE.md) - Документация API
- 🎨 [`components/catalog/search-input-example.tsx`](../components/catalog/search-input-example.tsx) - Примеры компонентов

---

## ✅ **Рекомендации:**

1. **Используй `useSmartSearchWithCategory()` для UI** - обрабатывает опечатки + возвращает category_name
2. **Увеличь `debounceMs` для медленных сетей** - например, 500ms вместо 300ms
3. **Используй `minQueryLength: 3`** - если база данных очень большая
4. **Используй `autoSearch: false`** - если нужна кнопка "Szukaj"
5. **Обрабатывай `error`** - показывай пользователю сообщение об ошибке

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
