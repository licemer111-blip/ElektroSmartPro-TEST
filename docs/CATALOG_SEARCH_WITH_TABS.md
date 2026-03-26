# 🔍 CatalogSearchInputWithTabs

Компонент поиска в каталоге с **табами для переключения** между услугами (robocizna) и материалами.

**По умолчанию выбраны услуги (labor)** — идеально для быстрого добавления работ в kosztorys.

---

## ✨ **Особенности:**

- ✅ **2 таба:** Usługi (робота) и Materiały
- ✅ **По умолчанию услуги** — самый частый use case
- ✅ **Умный плейсхолдер** — меняется в зависимости от выбранного таба
- ✅ **Фильтрация в реальном времени** — только выбранный тип
- ✅ **Удобный UI** — большие кликабельные табы с иконками
- ✅ **TypeScript** — полная типизация
- ✅ **shadcn/ui Tabs** — красивый стандартный дизайн

---

## 📦 **Установка:**

Компонент уже готов к использованию:

```tsx
import { CatalogSearchInputWithTabs } from '@/components/catalog';
```

**Зависимости:**
- ✅ `@/components/ui/tabs` (shadcn/ui)
- ✅ `@/hooks/use-catalog-search`
- ✅ `@/lib/catalog-api`
- ✅ `lucide-react` (иконки)

---

## 🚀 **Быстрый старт:**

### **1. Основное использование (по умолчанию labor):**

```tsx
import { CatalogSearchInputWithTabs } from '@/components/catalog';

export default function MyPage() {
  const handleSelect = (item) => {
    console.log('Wybrano:', item);
    // Dodaj do kosztorysu
  };

  return (
    <CatalogSearchInputWithTabs onSelect={handleSelect} />
  );
}
```

**Результат:**
- ✅ Открывается таб "Usługi" (robocizna)
- ✅ Поиск только по услугам
- ✅ Placeholder: "Szukaj usługi... (np. montaż)"

---

### **2. Начать с материалов:**

```tsx
<CatalogSearchInputWithTabs
  onSelect={handleSelect}
  defaultFilter="material"  // ← Начинаем с материалов
/>
```

---

### **3. В форме добавления позиции:**

```tsx
'use client';

import { useState } from 'react';
import { CatalogSearchInputWithTabs } from '@/components/catalog';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';

export function AddItemForm() {
  const [items, setItems] = useState<CatalogSearchResultWithCategory[]>([]);

  const handleAddItem = (item: CatalogSearchResultWithCategory) => {
    setItems([...items, item]);
  };

  return (
    <div className="space-y-4">
      <h2>Dodaj pozycję</h2>
      <CatalogSearchInputWithTabs onSelect={handleAddItem} />
      
      <div>
        <h3>Wybrane ({items.length}):</h3>
        {items.map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    </div>
  );
}
```

---

### **4. В Dialog/Modal:**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CatalogSearchInputWithTabs } from '@/components/catalog';

export function AddItemDialog({ open, onOpenChange }) {
  const handleSelect = (item) => {
    console.log('Wybrano:', item);
    onOpenChange(false); // Zamknij dialog
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Wybierz pozycję</DialogTitle>
        </DialogHeader>
        <CatalogSearchInputWithTabs onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📋 **Props:**

| Prop | Type | Default | Opis |
|------|------|---------|------|
| `onSelect` | `(item: CatalogSearchResultWithCategory) => void` | **Required** | Callback po wyborze pozycji |
| `defaultFilter` | `'labor' \| 'material'` | `'labor'` | Domyślnie wybrany tab |
| `clearOnSelect` | `boolean` | `true` | Czy czyścić input po wyborze |
| `disabled` | `boolean` | `false` | Wyłącz komponent |
| `className` | `string` | - | Dodatkowe klasy CSS |
| `limit` | `number` | `20` | Max liczba wyników |

---

## 🎨 **UI/UX Szczegóły:**

### **Taby:**
```tsx
<TabsList className="grid w-full grid-cols-2">
  <TabsTrigger value="labor">
    <Hammer className="w-4 h-4" />
    Usługi (Robocizna)
  </TabsTrigger>
  <TabsTrigger value="material">
    <Package className="w-4 h-4" />
    Materiały
  </TabsTrigger>
</TabsList>
```

### **Dynamiczny placeholder:**
- **Labor:** "Szukaj usługi... (np. montaż)"
- **Material:** "Szukaj materiału... (np. kabel)"

### **Kolory:**
- **Usługi (labor):** 🟠 Pomarańczowy (`text-orange-600`)
- **Materiały (material):** 🔵 Niebieski (`text-blue-600`)

---

## 🔍 **Jak to działa:**

1. **User otwiera stronę** → Widzi tab "Usługi" (domyślnie)
2. **User wpisuje "montaż"** → Szuka tylko w usługach
3. **User klika "Materiały"** → Przełącza na materiały
4. **User wpisuje "kabel"** → Szuka tylko w materiałach
5. **User wybiera wynik** → `onSelect(item)` + input się czyści

---

## 💡 **Przykłady użycia:**

### **Przykład 1: Kosztorys (domyślnie labor)**

```tsx
'use client';

import { useState } from 'react';
import { CatalogSearchInputWithTabs } from '@/components/catalog';

export default function EstimatePage() {
  const [items, setItems] = useState([]);

  return (
    <div className="p-6">
      <h1>Nowy kosztorys</h1>
      <CatalogSearchInputWithTabs
        onSelect={(item) => setItems([...items, item])}
      />
    </div>
  );
}
```

---

### **Przykład 2: Formularz zamówienia (domyślnie material)**

```tsx
export function OrderForm() {
  const [materials, setMaterials] = useState([]);

  return (
    <div>
      <h2>Zamów materiały</h2>
      <CatalogSearchInputWithTabs
        onSelect={(item) => setMaterials([...materials, item])}
        defaultFilter="material"  // ← Materiały od razu
      />
    </div>
  );
}
```

---

### **Przykład 3: Pełny kosztorys z tabami**

Zobacz kompletny przykład:
```
app/dashboard/estimate-with-tabs/page.tsx
```

**Funkcje:**
- ✅ Dodawanie pozycji (labor + material)
- ✅ Zmiana ilości (+/- buttons)
- ✅ Usuwanie pozycji
- ✅ Podsumowanie: materiały + robocizna + razem
- ✅ Responsywna tabela

---

## 🆚 **Różnice między komponentami:**

| Komponent | Filtry | Domyślnie | Use Case |
|-----------|--------|-----------|----------|
| `CatalogSearchInput` | Brak | Wszystko | Podstawowy search |
| `CatalogSearchInputWithFilter` | Dropdown + Pills | "all" | Elastyczny filtr |
| **`CatalogSearchInputWithTabs`** | **2 Taby** | **"labor"** | **Kosztorys / Szybki wybór** |

**Kiedy używać `CatalogSearchInputWithTabs`:**
- ✅ Chcesz tylko 2 opcje (labor / material)
- ✅ Najczęściej używasz labor (robocizna)
- ✅ Chcesz przejrzysty UI z dużymi tabami
- ✅ Kosztorysy, przedmiary, zamówienia

**Kiedy używać `CatalogSearchInputWithFilter`:**
- ⚙️ Potrzebujesz "Wszystko" (all)
- ⚙️ Masz więcej opcji filtrowania
- ⚙️ Admin panel, raporty

---

## 🎯 **Best Practices:**

### **1. Wyczyść input po wyborze:**
```tsx
<CatalogSearchInputWithTabs
  onSelect={handleSelect}
  clearOnSelect={true}  // ← Domyślnie true
/>
```

### **2. Toast po dodaniu:**
```tsx
import { toast } from 'sonner';

const handleSelect = (item) => {
  addToEstimate(item);
  toast.success(`Dodano: ${item.name}`);
};
```

### **3. Walidacja przed dodaniem:**
```tsx
const handleSelect = (item) => {
  // Sprawdź, czy już istnieje
  const exists = items.some((i) => i.id === item.id);
  
  if (exists) {
    toast.error('Ta pozycja już istnieje w kosztorysie');
    return;
  }
  
  setItems([...items, item]);
};
```

### **4. Responsive layout:**
```tsx
<div className="max-w-2xl mx-auto p-4">
  <CatalogSearchInputWithTabs
    onSelect={handleSelect}
    className="w-full"
  />
</div>
```

---

## 🔧 **Customization:**

### **Zmień limity wyników:**
```tsx
<CatalogSearchInputWithTabs
  onSelect={handleSelect}
  limit={50}  // ← Więcej wyników
/>
```

### **Disable całkowicie:**
```tsx
<CatalogSearchInputWithTabs
  onSelect={handleSelect}
  disabled={isSubmitting}
/>
```

### **Custom styling:**
```tsx
<CatalogSearchInputWithTabs
  onSelect={handleSelect}
  className="max-w-4xl"
/>
```

---

## 📊 **Porównanie wydajności:**

| Mode | Szybkość | Use Case |
|------|----------|----------|
| `labor` | ~60ms | Tylko usługi (szybkie) |
| `material` | ~60ms | Tylko materiały (szybkie) |
| `smartCategory` | ~80ms | Wszystko (wolniejsze) |

**Dlaczego szybsze:**
- ✅ Filtruje tylko 1 typ (`type = 'labor'` lub `type = 'material'`)
- ✅ Indeks `catalog_items_type_idx` jest używany
- ✅ Mniej wyników do przetworzenia

---

## 🐛 **Troubleshooting:**

### **Problem: Brak wyników**

**Rozwiązanie:**
```sql
-- Sprawdź, czy są dane:
SELECT COUNT(*) FROM catalog_items WHERE type = 'labor' AND is_active = true;
SELECT COUNT(*) FROM catalog_items WHERE type = 'material' AND is_active = true;
```

### **Problem: Wolne wyszukiwanie**

**Rozwiązanie:**
```sql
-- Sprawdź indeksy:
SELECT * FROM pg_indexes WHERE tablename = 'catalog_items';

-- Dodaj brakujące:
CREATE INDEX IF NOT EXISTS catalog_items_type_idx 
  ON catalog_items(type) WHERE is_active = true;
```

### **Problem: Tabs nie przełączają się**

**Rozwiązanie:**
```tsx
// Upewnij się, że masz zainstalowane shadcn/ui tabs:
npx shadcn-ui@latest add tabs
```

---

## 📚 **Powiązane pliki:**

### **Komponenty:**
- 📄 `components/catalog/CatalogSearchInputWithTabs.tsx` — Główny komponent
- 📄 `components/catalog/CatalogSearchInput.tsx` — Podstawowy komponent
- 📄 `components/catalog/CatalogSearchInputWithFilter.tsx` — Z filtrem dropdown

### **Hooki:**
- 🎣 `hooks/use-catalog-search.ts` — Główny hook do wyszukiwania

### **API:**
- 🔌 `lib/catalog-api.ts` — API do Supabase

### **Przykłady:**
- 📄 `app/dashboard/estimate-with-tabs/page.tsx` — Pełny przykład kosztorysu

### **Dokumentacja:**
- 📖 `docs/USE_CATALOG_SEARCH_HOOK.md` — Hook documentation
- 📖 `docs/CATALOG_SEARCH_COMPONENTS.md` — Komponenty search

---

## ✅ **Checklist implementacji:**

- [ ] Zainstaluj shadcn/ui tabs: `npx shadcn-ui@latest add tabs`
- [ ] Zaimportuj komponent: `import { CatalogSearchInputWithTabs } from '@/components/catalog'`
- [ ] Dodaj `onSelect` handler
- [ ] (Opcjonalnie) Ustaw `defaultFilter`
- [ ] Test w przeglądarce
- [ ] Sprawdź responsive design
- [ ] Dodaj toast notifications
- [ ] Walidacja przed dodaniem

---

**Wersja:** 1.0  
**Data:** 22 stycznia 2026  
**Autor:** ElektroSmart PRO Team
