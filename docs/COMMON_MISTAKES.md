# ❌ Частые ошибки при использовании Catalog Search

Список распространенных ошибок и их исправлений.

---

## 🚨 **Ошибка #1: Неправильные имена полей**

### **❌ НЕПРАВИЛЬНО:**
```tsx
const handleSelect = (item: any) => {
  console.log(item.price_material);  // ❌ Поле не существует
  console.log(item.price_labor);     // ❌ Поле не существует
  
  const price = item.price_material || item.price_labor;  // ❌ Ошибка
};
```

### **✅ ПРАВИЛЬНО:**
```tsx
const handleSelect = (item: CatalogSearchResultWithCategory) => {
  console.log(item.base_material_price);  // ✅ Правильное поле
  console.log(item.base_labor_price);     // ✅ Правильное поле
  
  const price = item.type === 'labor'
    ? item.base_labor_price
    : item.base_material_price;  // ✅ Правильно
};
```

**Почему:**
- RPC функции возвращают `base_material_price`, а не `price_material`
- RPC функции возвращают `base_labor_price`, а не `price_labor`

---

## 🚨 **Ошибка #2: Неправильная логика определения типа**

### **❌ НЕПРАВИЛЬНО:**
```tsx
if (item.price_labor > 0) {  // ❌ Ненадежно
  // Это услуга
} else {
  // Это материал
}
```

### **✅ ПРАВИЛЬНО:**
```tsx
if (item.type === 'labor') {  // ✅ Надежно
  // Это услуга
} else {
  // Это материал
}
```

**Почему:**
- Услуга может иметь цену `0.00` (бесплатная услуга)
- Поле `type` всегда точно определяет тип элемента

---

## 🚨 **Ошибка #3: Использование `any` вместо типов**

### **❌ НЕПРАВИЛЬНО:**
```tsx
const handleSelect = (item: any) => {  // ❌ any
  // Нет подсказок TypeScript
  // Можно допустить опечатку в именах полей
};
```

### **✅ ПРАВИЛЬНО:**
```tsx
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';

const handleSelect = (item: CatalogSearchResultWithCategory) => {  // ✅ Типы
  // TypeScript подскажет правильные поля
  // Автодополнение в IDE
};
```

**Почему:**
- TypeScript защищает от опечаток
- IDE показывает доступные поля
- Легче поддерживать код

---

## 🚨 **Ошибка #4: Неправильный хук**

### **❌ НЕПРАВИЛЬНО:**
```tsx
const { query, setQuery, results } = useCatalogSearch();

// results не содержат category_name
console.log(results[0].category_name);  // ❌ undefined
```

### **✅ ПРАВИЛЬНО:**
```tsx
const { query, setQuery, results } = useSmartSearchWithCategory();

// results содержат category_name
console.log(results[0].category_name);  // ✅ "Rozdzielnice"
```

**Почему:**
- `useCatalogSearch()` по умолчанию использует режим `'smart'` без категорий
- `useSmartSearchWithCategory()` использует режим `'smartCategory'` с категориями

---

## 🚨 **Ошибка #5: Отсутствие обработки типа**

### **❌ НЕПРАВИЛЬНО:**
```tsx
<div>
  Цена: {item.base_material_price.toFixed(2)} PLN
</div>
```

**Проблема:** Если это услуга, `base_material_price` будет `0.00`, и вы покажете неправильную цену.

### **✅ ПРАВИЛЬНО:**
```tsx
const price = item.type === 'labor'
  ? item.base_labor_price
  : item.base_material_price;

<div>
  Цена: {price.toFixed(2)} PLN
  {item.type === 'labor' && ' /rbh'}
</div>
```

---

## 🚨 **Ошибка #6: Неправильная иконка**

### **❌ НЕПРАВИЛЬНО:**
```tsx
{item.price_labor > 0 ? (  // ❌ Неправильное поле
  <Hammer className="h-4 w-4 text-orange-500" />
) : (
  <Package className="h-4 w-4 text-blue-500" />
)}
```

### **✅ ПРАВИЛЬНО:**
```tsx
{item.type === 'labor' ? (  // ✅ Правильная проверка
  <Hammer className="h-4 w-4 text-orange-500" />
) : (
  <Package className="h-4 w-4 text-blue-500" />
)}
```

---

## 🚨 **Ошибка #7: Забыли импортировать тип**

### **❌ НЕПРАВИЛЬНО:**
```tsx
import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput';

const handleSelect = (item: CatalogSearchResultWithCategory) => {  // ❌ Тип не импортирован
  // ...
};
```

### **✅ ПРАВИЛЬНО:**
```tsx
import { CatalogSearchInput } from '@/components/catalog/CatalogSearchInput';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';  // ✅ Импортировали тип

const handleSelect = (item: CatalogSearchResultWithCategory) => {
  // ...
};
```

---

## 🚨 **Ошибка #8: Неправильный расчет суммы**

### **❌ НЕПРАВИЛЬНО:**
```tsx
const total = items.reduce((sum, item) => {
  return sum + (item.price_material || item.price_labor);  // ❌ Неправильные поля
}, 0);
```

### **✅ ПРАВИЛЬНО:**
```tsx
const total = items.reduce((sum, item) => {
  const price = item.type === 'labor'
    ? item.base_labor_price
    : item.base_material_price;
  return sum + price;  // ✅ Правильно
}, 0);

// Или раздельно:
const totalMaterial = items.reduce((sum, item) => 
  sum + item.base_material_price, 0
);
const totalLabor = items.reduce((sum, item) => 
  sum + item.base_labor_price, 0
);
const grandTotal = totalMaterial + totalLabor;
```

---

## 🚨 **Ошибка #9: Забыли про `category_name` может быть `null`**

### **❌ НЕПРАВИЛЬНО:**
```tsx
<div>{item.category_name}</div>  // ❌ Может быть null
```

### **✅ ПРАВИЛЬНО:**
```tsx
<div>{item.category_name || 'Inne'}</div>  // ✅ Fallback
```

---

## 🚨 **Ошибка #10: Неправильная структура данных для сохранения**

### **❌ НЕПРАВИЛЬНО:**
```tsx
const handleSelect = async (item: CatalogSearchResultWithCategory) => {
  await addItemToProject({
    name: item.name,
    price: item.price_material,  // ❌ Неправильное поле
  });
};
```

### **✅ ПРАВИЛЬНО:**
```tsx
const handleSelect = async (item: CatalogSearchResultWithCategory) => {
  await addItemToProject({
    catalogItemId: item.id,
    name: item.name,
    unit: item.unit,
    quantity: 1,
    baseMaterialPrice: item.base_material_price,  // ✅ Правильно
    baseLaborPrice: item.base_labor_price,        // ✅ Правильно
    type: item.type,
  });
};
```

---

## 📋 **Checklist для проверки кода:**

Перед деплоем проверь:

- [ ] Используешь `base_material_price`, а не `price_material`
- [ ] Используешь `base_labor_price`, а не `price_labor`
- [ ] Проверяешь тип через `item.type === 'labor'`, а не через `item.price_labor > 0`
- [ ] Используешь типы `CatalogSearchResultWithCategory`, а не `any`
- [ ] Импортировал тип: `import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api'`
- [ ] Используешь правильный хук: `useSmartSearchWithCategory()`
- [ ] Обрабатываешь `category_name` с fallback: `item.category_name || 'Inne'`
- [ ] Правильно рассчитываешь цену на основе `item.type`
- [ ] Правильно сохраняешь данные в базу (правильные имена полей)

---

## 🔄 **Быстрая миграция кода:**

Если у тебя уже есть код с неправильными полями, используй поиск и замену:

1. **Find:** `item.price_material` → **Replace:** `item.base_material_price`
2. **Find:** `item.price_labor` → **Replace:** `item.base_labor_price`
3. **Find:** `item.price_labor > 0` → **Replace:** `item.type === 'labor'`
4. **Find:** `(item: any)` → **Replace:** `(item: CatalogSearchResultWithCategory)`
5. **Find:** `useCatalogSearch()` → **Replace:** `useSmartSearchWithCategory()` (если нужна категория)

**Не забудь добавить импорт:**
```tsx
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
```

---

## 📚 **См. также:**

- 🎨 [`docs/CATALOG_SEARCH_COMPONENTS.md`](CATALOG_SEARCH_COMPONENTS.md) - Документация компонентов
- 🎣 [`docs/USE_CATALOG_SEARCH_HOOK.md`](USE_CATALOG_SEARCH_HOOK.md) - Документация хука
- 📘 [`docs/CATALOG_API_SIMPLE.md`](CATALOG_API_SIMPLE.md) - API функции

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
