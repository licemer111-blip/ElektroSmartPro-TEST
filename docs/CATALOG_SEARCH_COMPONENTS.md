# 🎨 Catalog Search Components

Готовые React компоненты для поиска по каталогу с автокомплитом.

---

## 📦 **Доступные компоненты:**

### **1. CatalogSearchInput** (Основной)
Полнофункциональный компонент с иконками, описаниями и красивым дизайном.

### **2. CatalogSearchInputCompact** (Компактный)
Упрощенная версия для модальных окон и узких мест.

### **3. CatalogSearchInputWithFilter** (С фильтром)
Расширенная версия с фильтром по типу (материалы/услуги/всё).

---

## 🚀 **1. CatalogSearchInput** (рекомендуется)

### **Импорт:**
```tsx
import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput';
```

### **Пример использования:**
```tsx
'use client';

import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';

export function AddItemForm() {
  const handleSelect = (item: CatalogSearchResultWithCategory) => {
    console.log('Выбран элемент:', item);
    // Добавить в проект, корзину и т.д.
  };

  return (
    <div>
      <h2>Dodaj pozycję</h2>
      <CatalogSearchInput onSelect={handleSelect} />
    </div>
  );
}
```

### **Props:**

| Prop | Тип | Default | Описание |
|------|-----|---------|----------|
| `onSelect` | `(item) => void` | **required** | Callback при выборе элемента |
| `placeholder` | `string` | `"Szukaj materiałów i usług..."` | Placeholder текст |
| `clearOnSelect` | `boolean` | `true` | Очищать поле после выбора |
| `disabled` | `boolean` | `false` | Отключить компонент |
| `className` | `string` | `undefined` | CSS классы для контейнера |
| `showClearButton` | `boolean` | `true` | Показывать кнопку очистки |
| `limit` | `number` | `20` | Макс. результатов |

### **Особенности:**
- ✅ Иконки для материалов (📦) и услуг (🔨)
- ✅ Отображение категории и единицы измерения
- ✅ Цветовая дифференциация (синий/оранжевый)
- ✅ Кнопка очистки поля
- ✅ Индикатор загрузки
- ✅ Описание элемента (если есть)
- ✅ Закрытие при клике вне

---

## 🎯 **2. CatalogSearchInputCompact**

### **Импорт:**
```tsx
import { CatalogSearchInputCompact } from '@/components/catalog/CatalogSearchInputCompact';
```

### **Пример использования:**
```tsx
import { CatalogSearchInputCompact } from '@/components/catalog/CatalogSearchInputCompact';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function QuickAddDialog() {
  return (
    <Dialog>
      <DialogContent className="max-w-md">
        <h3>Szybkie dodawanie</h3>
        <CatalogSearchInputCompact
          onSelect={handleSelect}
          placeholder="Szukaj..."
        />
      </DialogContent>
    </Dialog>
  );
}
```

### **Props:**

| Prop | Тип | Default | Описание |
|------|-----|---------|----------|
| `onSelect` | `(item) => void` | **required** | Callback при выборе |
| `placeholder` | `string` | `"Szukaj..."` | Placeholder |
| `clearOnSelect` | `boolean` | `true` | Очищать после выбора |
| `disabled` | `boolean` | `false` | Отключить |
| `className` | `string` | `undefined` | CSS классы |
| `limit` | `number` | `15` | Макс. результатов |

### **Особенности:**
- ✅ Компактный дизайн (меньше padding, text-sm)
- ✅ Меньше деталей в результатах
- ✅ Макс. высота 60vh вместо 80vh
- ✅ Идеально для модалок

---

## 🔍 **3. CatalogSearchInputWithFilter**

### **Импорт:**
```tsx
import { CatalogSearchInputWithFilter } from '@/components/catalog/CatalogSearchInputWithFilter';
```

### **Пример использования:**
```tsx
import { CatalogSearchInputWithFilter } from '@/components/catalog/CatalogSearchInputWithFilter';

export function AdvancedSearch() {
  return (
    <div>
      <h2>Zaawansowane wyszukiwanie</h2>
      <CatalogSearchInputWithFilter
        onSelect={handleSelect}
        defaultFilter="materials"
      />
    </div>
  );
}
```

### **Props:**

| Prop | Тип | Default | Описание |
|------|-----|---------|----------|
| `onSelect` | `(item) => void` | **required** | Callback при выборе |
| `placeholder` | `string` | `"Szukaj..."` | Placeholder |
| `clearOnSelect` | `boolean` | `true` | Очищать после выбора |
| `disabled` | `boolean` | `false` | Отключить |
| `className` | `string` | `undefined` | CSS классы |
| `limit` | `number` | `20` | Макс. результатов |
| `defaultFilter` | `'all' \| 'materials' \| 'labor'` | `'all'` | Фильтр по умолчанию |

### **Особенности:**
- ✅ Dropdown фильтр (Wszystko/Materiały/Usługi)
- ✅ Кнопки-фильтры (Pills UI)
- ✅ Автоматическое переключение режима поиска
- ✅ Иконки для каждого типа

---

## 💡 **Примеры использования:**

### **Пример 1: Добавление позиции в проект**

```tsx
'use client';

import { useState } from 'react';
import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
import { addItemToProject } from '@/app/dashboard/projects/[id]/actions';

export function AddItemToProjectForm({ projectId }: { projectId: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = async (item: CatalogSearchResultWithCategory) => {
    setIsSubmitting(true);
    try {
      await addItemToProject(projectId, {
        catalogItemId: item.id,
        name: item.name,
        unit: item.unit,
        quantity: 1,
        baseMaterialPrice: item.base_material_price,
        baseLaborPrice: item.base_labor_price,
      });
      alert('Pozycja dodana!');
    } catch (err) {
      alert('Błąd!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Dodaj pozycję</h3>
      <CatalogSearchInput
        onSelect={handleSelect}
        disabled={isSubmitting}
        placeholder="Wyszukaj materiał lub usługę..."
      />
    </div>
  );
}
```

---

### **Пример 2: Модальное окно (компактная версия)**

```tsx
'use client';

import { useState } from 'react';
import { CatalogSearchInputCompact } from '@/components/catalog/CatalogSearchInputCompact';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function QuickAddButton() {
  const [open, setOpen] = useState(false);

  const handleSelect = (item) => {
    console.log('Wybrano:', item);
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Szybkie dodawanie</Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Wybierz pozycję</DialogTitle>
          </DialogHeader>
          <CatalogSearchInputCompact
            onSelect={handleSelect}
            placeholder="Szukaj..."
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### **Пример 3: С фильтром типа**

```tsx
'use client';

import { useState } from 'react';
import { CatalogSearchInputWithFilter } from '@/components/catalog/CatalogSearchInputWithFilter';

export function MaterialsOrLaborPicker() {
  const [selectedType, setSelectedType] = useState<'materials' | 'labor'>('materials');

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Co chcesz dodać?
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as 'materials' | 'labor')}
        >
          <option value="materials">Materiały</option>
          <option value="labor">Usługi</option>
        </select>
      </div>

      <CatalogSearchInputWithFilter
        onSelect={handleSelect}
        defaultFilter={selectedType}
      />
    </div>
  );
}
```

---

### **Пример 4: Автокомплит в таблице**

```tsx
'use client';

import { useState } from 'react';
import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput';

export function InlineItemPicker({ onAdd }: { onAdd: (item: any) => void }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div>
      {!showSearch ? (
        <button
          onClick={() => setShowSearch(true)}
          className="text-sm text-blue-600 hover:underline"
        >
          + Dodaj pozycję
        </button>
      ) : (
        <CatalogSearchInput
          onSelect={(item) => {
            onAdd(item);
            setShowSearch(false);
          }}
          placeholder="Wyszukaj..."
        />
      )}
    </div>
  );
}
```

---

## 🎨 **Стилизация:**

Все компоненты используют Tailwind CSS и Shadcn/UI, поэтому они автоматически адаптируются к вашей теме (светлая/темная).

### **Кастомные стили:**

```tsx
<CatalogSearchInput
  onSelect={handleSelect}
  className="max-w-2xl mx-auto" // Центрируем и ограничиваем ширину
/>

<CatalogSearchInputCompact
  onSelect={handleSelect}
  className="w-full sm:w-64" // Адаптивная ширина
/>
```

---

## ⚡ **Performance:**

| Компонент | Debounce | Макс. результатов | Время поиска |
|-----------|----------|-------------------|--------------|
| CatalogSearchInput | 300ms | 20 (настраивается) | ~7-55ms |
| CatalogSearchInputCompact | 300ms | 15 (настраивается) | ~7-55ms |
| CatalogSearchInputWithFilter | 300ms | 20 (настраивается) | ~7-55ms |

**Все компоненты:**
- ✅ Используют `useSmartSearchWithCategory()` (обработка опечаток)
- ✅ Debounce 300ms
- ✅ AbortController (отмена предыдущих запросов)
- ✅ Lazy rendering (dropdown только при открытии)

---

## 🆚 **Какой компонент использовать?**

### **CatalogSearchInput (Основной)**
✅ Для страниц добавления позиций  
✅ Когда нужна полная информация  
✅ Когда достаточно места  

### **CatalogSearchInputCompact**
✅ Для модальных окон  
✅ Для узких колонок  
✅ Для быстрого выбора  

### **CatalogSearchInputWithFilter**
✅ Когда нужна фильтрация по типу  
✅ Для продвинутых форм  
✅ Когда пользователь знает, что ищет (материал или услугу)  

---

## 🔧 **Исправления из твоей версии:**

### **Было (неправильно):**
```tsx
{item.price_labor > 0 ? (  // ❌ Неправильное поле
  <div>{item.price_labor.toFixed(2)} zł</div>
) : (
  <div>{item.price_material.toFixed(2)} zł</div>  // ❌ Неправильное поле
)}
```

### **Стало (правильно):**
```tsx
const isLabor = item.type === 'labor';  // ✅ Используем тип
const price = isLabor 
  ? item.base_labor_price   // ✅ Правильное поле
  : item.base_material_price;  // ✅ Правильное поле

<div>{price.toFixed(2)} PLN</div>
```

### **Почему так?**
1. **Поле `price_labor` не существует** - правильное имя `base_labor_price`
2. **Поле `price_material` не существует** - правильное имя `base_material_price`
3. **Логика `item.price_labor > 0` неправильна** - услуга может иметь цену 0
4. **Используй `item.type`** - это надежнее

---

## 📚 **См. также:**

- 🎣 [`docs/USE_CATALOG_SEARCH_HOOK.md`](USE_CATALOG_SEARCH_HOOK.md) - Документация хука
- 📘 [`docs/CATALOG_API_SIMPLE.md`](CATALOG_API_SIMPLE.md) - API функции
- 📖 [`docs/CATALOG_SEARCH.md`](CATALOG_SEARCH.md) - Полная документация системы поиска

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
