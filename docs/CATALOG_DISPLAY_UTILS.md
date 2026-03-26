# 🎨 Catalog Display Utilities

Утилиты для красивого отображения элементов каталога в UI.

---

## ✨ **Проблема:**

### **До (некрасиво):**

```
Gniazdo podwójne z uziemieniem Ref: MGU5.201.25ZD
```

**Проблемы:**
- ❌ Слишком длинное название
- ❌ Артикул смешан с названием
- ❌ Трудно читать

---

### **После (красиво):**

```
Gniazdo podwójne z uziemieniem           [Чистое название]
MGU5.201.25ZD • Osprzęt i punkty • szt   [Артикул + категория]
```

**Преимущества:**
- ✅ Четкое разделение
- ✅ Артикул выделен (font-mono, bg-muted)
- ✅ Легко читать
- ✅ Профессиональный вид

---

## 📦 **Установка:**

```typescript
import { parseItemName } from '@/lib/utils/catalog-display';
```

**Файл:** `lib/utils/catalog-display.ts`

---

## 🚀 **API:**

### **1. `parseItemName()` - Парсинг артикула**

```typescript
parseItemName(fullName: string): {
  displayName: string;
  refCode: string | null;
}
```

**Примеры:**

```typescript
// С артикулом:
parseItemName('Gniazdo podwójne Ref: MGU5.201.25ZD')
// → { displayName: 'Gniazdo podwójne', refCode: 'MGU5.201.25ZD' }

// Без артикула:
parseItemName('Montaż gniazda podwójnego')
// → { displayName: 'Montaż gniazda podwójnego', refCode: null }

// Пустая строка:
parseItemName('')
// → { displayName: '', refCode: null }
```

---

### **2. `formatPrice()` - Форматирование цены**

```typescript
formatPrice(price: number, currency = 'PLN'): string
```

**Примеры:**

```typescript
formatPrice(125.5)        // → '125.50 PLN'
formatPrice(99.99)        // → '99.99 PLN'
formatPrice(1234.567)     // → '1234.57 PLN'
formatPrice(99.99, 'EUR') // → '99.99 EUR'
```

---

### **3. `getItemPrice()` - Извлечь цену**

```typescript
getItemPrice(item: {
  type: 'labor' | 'material';
  base_material_price: number;
  base_labor_price: number;
}): number
```

**Примеры:**

```typescript
const laborItem = { type: 'labor', base_labor_price: 50, base_material_price: 0 };
getItemPrice(laborItem);  // → 50

const materialItem = { type: 'material', base_labor_price: 0, base_material_price: 125 };
getItemPrice(materialItem);  // → 125
```

---

### **4. `getItemColor()` - Цвета по типу**

```typescript
getItemColor(type: 'labor' | 'material'): {
  text: string;
  bg: string;
  icon: string;
}
```

**Примеры:**

```typescript
getItemColor('labor')
// → { text: 'text-orange-600', bg: 'bg-orange-50', icon: 'text-orange-500' }

getItemColor('material')
// → { text: 'text-blue-600', bg: 'bg-blue-50', icon: 'text-blue-500' }
```

---

### **5. `truncateText()` - Укоротить текст**

```typescript
truncateText(text: string, maxLength = 50): string
```

**Примеры:**

```typescript
truncateText('Bardzo długa nazwa produktu która nie mieści się', 20)
// → 'Bardzo długa nazwa p...'

truncateText('Krótka nazwa', 50)
// → 'Krótka nazwa' (без изменений)
```

---

## 🎨 **Использование в компонентах:**

### **Базовое использование:**

```tsx
import { parseItemName } from '@/lib/utils/catalog-display';

export function ItemCard({ item }) {
  const { displayName, refCode } = parseItemName(item.name);

  return (
    <div>
      {/* Основное название - жирное */}
      <span className="font-medium text-sm">
        {displayName}
      </span>
      
      {/* Артикул и категория - маленькие серые */}
      <div className="text-xs text-muted-foreground">
        {refCode && (
          <span className="font-mono bg-muted px-1.5 py-0.5 rounded mr-2">
            {refCode}
          </span>
        )}
        {item.category_name} • {item.unit}
      </div>
    </div>
  );
}
```

---

### **В результатах поиска (рекомендуемый паттерн):**

```tsx
{results.map((item) => {
  const isLabor = item.type === 'labor';
  const price = isLabor ? item.base_labor_price : item.base_material_price;
  const { displayName, refCode } = parseItemName(item.name);

  return (
    <li key={item.id} className="px-4 py-2 hover:bg-accent cursor-pointer">
      <div className="flex justify-between items-center gap-3">
        {/* Left: Name and Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isLabor ? (
              <Hammer className="h-3.5 w-3.5 text-orange-500" />
            ) : (
              <Package className="h-3.5 w-3.5 text-blue-500" />
            )}
            {/* Чистое название БЕЗ артикула */}
            <span className="font-medium text-sm truncate">
              {displayName}
            </span>
          </div>
          
          {/* Артикул (если есть) + Категория + Единица */}
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            {refCode && (
              <>
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                  {refCode}
                </span>
                <span>•</span>
              </>
            )}
            <span className="truncate">{item.category_name || 'Inne'}</span>
            <span>•</span>
            <span>{item.unit}</span>
          </div>
        </div>

        {/* Right: Price */}
        <div className={cn('text-sm font-bold', isLabor ? 'text-orange-600' : 'text-blue-600')}>
          {price.toFixed(2)} PLN
        </div>
      </div>
    </li>
  );
})}
```

---

### **С цветами:**

```tsx
import { getItemColor, parseItemName, getItemPrice } from '@/lib/utils/catalog-display';

export function ItemRow({ item }) {
  const colors = getItemColor(item.type);
  const price = getItemPrice(item);
  const { displayName, refCode } = parseItemName(item.name);

  return (
    <div className={colors.bg + ' p-3 rounded'}>
      <h3 className={colors.text}>{displayName}</h3>
      {refCode && (
        <span className="font-mono text-xs">{refCode}</span>
      )}
      <p className={colors.text + ' font-bold'}>{price.toFixed(2)} PLN</p>
    </div>
  );
}
```

---

## 📊 **Визуальный пример:**

### **Результат поиска "schneider":**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔨 Montaż rozdzielnicy modułowej                      45.00 PLN │
│    MGU5.201.25ZD • Rozdzielnice • szt                        │
├─────────────────────────────────────────────────────────────┤
│ 📦 Rozdzielnica modułowa 4-modułowa                  125.50 PLN │
│    EZ9E112S2S • Rozdzielnice • szt                           │
└─────────────────────────────────────────────────────────────┘
```

**Структура:**
1. **Строка 1:** Иконка + Чистое название + Цена
2. **Строка 2:** Артикул (gray, mono) + Категория + Единица

---

## 🎯 **Best Practices:**

### **1. Всегда используй `parseItemName` для отображения:**

```tsx
// ❌ ПЛОХО:
<span>{item.name}</span>

// ✅ ХОРОШО:
const { displayName, refCode } = parseItemName(item.name);
<span>{displayName}</span>
{refCode && <span className="font-mono text-xs">{refCode}</span>}
```

---

### **2. Артикул должен быть моноширинным:**

```tsx
// Моноширинный шрифт для кодов:
<span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
  {refCode}
</span>
```

---

### **3. Разделяй визуально:**

```tsx
// Артикул на светлом фоне:
<span className="font-mono bg-muted px-1.5 py-0.5 rounded">
  {refCode}
</span>

// Или с рамкой:
<span className="font-mono border border-border px-1.5 py-0.5 rounded">
  {refCode}
</span>
```

---

### **4. Адаптивный layout:**

```tsx
// Используй flex-wrap для длинных артикулов:
<div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
  {refCode && (
    <>
      <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
        {refCode}
      </span>
      <span>•</span>
    </>
  )}
  <span>{item.category_name}</span>
  <span>•</span>
  <span>{item.unit}</span>
</div>
```

---

## 🔧 **Примеры из реальных компонентов:**

### **1. CatalogSearchInput.tsx**

```tsx
const { displayName, refCode } = parseItemName(item.name);

<span className="font-medium text-sm truncate">
  {displayName}
</span>
<div className="text-xs text-muted-foreground flex items-center gap-1.5">
  {refCode && (
    <>
      <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
        {refCode}
      </span>
      <span>•</span>
    </>
  )}
  <span>{item.category_name}</span>
</div>
```

---

### **2. CatalogSearchInputCompact.tsx**

```tsx
const { displayName, refCode } = parseItemName(item.name);

<span className="truncate font-medium">{displayName}</span>
<div className="text-xs text-muted-foreground flex items-center gap-1">
  {refCode && (
    <>
      <span className="font-mono bg-muted px-1 py-0.5 rounded text-[9px]">
        {refCode}
      </span>
      <span>•</span>
    </>
  )}
  <span>{item.category_name}</span>
</div>
```

---

### **3. В таблице kosztorysu:**

```tsx
const { displayName, refCode } = parseItemName(item.name);

<td>
  <div className="font-medium">{displayName}</div>
  {refCode && (
    <div className="text-xs text-muted-foreground font-mono mt-0.5">
      Ref: {refCode}
    </div>
  )}
</td>
```

---

## 📋 **Полный список утилит:**

| Функция | Описание | Возвращает |
|---------|----------|------------|
| `parseItemName()` | Парсит название + артикул | `{ displayName, refCode }` |
| `formatPrice()` | Форматирует цену | `'125.50 PLN'` |
| `getItemPrice()` | Извлекает цену по типу | `number` |
| `getItemColor()` | Цвета по типу | `{ text, bg, icon }` |
| `truncateText()` | Укорачивает текст | `string` |

---

## 🎨 **Styling Guidelines:**

### **Артикул (Ref Code):**
```css
font-mono          /* Моноширинный шрифт */
bg-muted           /* Светлый фон */
px-1.5 py-0.5      /* Небольшие отступы */
rounded            /* Скругленные углы */
text-[10px]        /* Очень маленький текст (compact) */
```

### **Основное название:**
```css
font-medium        /* Среднее начертание */
text-sm            /* Обычный размер */
truncate           /* Обрезать если длинное */
```

### **Категория и единица:**
```css
text-xs            /* Маленький текст */
text-muted-foreground  /* Серый цвет */
```

---

## 🔍 **Примеры парсинга:**

### **Schneider Electric (с артикулом):**

```typescript
parseItemName('Gniazdo podwójne z uziemieniem Ref: MGU5.201.25ZD')
// → displayName: 'Gniazdo podwójne z uziemieniem'
// → refCode: 'MGU5.201.25ZD'

parseItemName('Wyłącznik pojedynczy Ref: EZ9F34110')
// → displayName: 'Wyłącznik pojedynczy'
// → refCode: 'EZ9F34110'
```

---

### **Usługi (bez артикула):**

```typescript
parseItemName('Montaż gniazda podwójnego wtynkowego')
// → displayName: 'Montaż gniazda podwójnego wtynkowego'
// → refCode: null

parseItemName('Ułożenie przewodu w korytku')
// → displayName: 'Ułożenie przewodu w korytku'
// → refCode: null
```

---

## 💡 **Best Practices:**

### **1. Всегда парсь название перед отображением:**

```tsx
// ❌ ПЛОХО:
<span>{item.name}</span>

// ✅ ХОРОШО:
const { displayName, refCode } = parseItemName(item.name);
<span>{displayName}</span>
```

---

### **2. Показывай артикул только если он есть:**

```tsx
{refCode && (
  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
    {refCode}
  </span>
)}
```

---

### **3. Используй моноширинный шрифт для кодов:**

```tsx
// Артикулы, SKU, коды - всегда font-mono:
<span className="font-mono">{refCode}</span>
```

---

### **4. Разделяй точками или вертикальной чертой:**

```tsx
// С точками:
{refCode} • {category_name} • {unit}

// С вертикальной чертой:
{refCode} | {category_name} | {unit}
```

---

## 🐛 **Troubleshooting:**

### **Проблема: Артикул не парсится**

**Проверка:**
```typescript
console.log(item.name);
// Убедись, что там есть "Ref:" (с заглавной R)
```

**Решение:**
Если в базе данных используется другой разделитель:
```typescript
// Измени в lib/utils/catalog-display.ts:
const parts = fullName.split('Ref:'); // или 'REF:' или 'ref:'
```

---

### **Проблема: Артикул слишком длинный**

**Решение:**
```tsx
// Укороти артикул:
{refCode && (
  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px] truncate max-w-[100px]">
    {refCode}
  </span>
)}
```

---

### **Проблема: Название переносится на 2 строки**

**Решение:**
```tsx
// Добавь line-clamp:
<span className="font-medium text-sm line-clamp-1">
  {displayName}
</span>
```

---

## 📚 **Обновленные компоненты:**

Эти компоненты уже используют `parseItemName`:

- ✅ `CatalogSearchInput.tsx`
- ✅ `CatalogSearchInputCompact.tsx`
- ✅ `CatalogSearchInputWithFilter.tsx`
- ✅ `CatalogSearchInputWithTabs.tsx`

**Все автоматически показывают артикулы отдельно!**

---

## 🎯 **Результат:**

### **До:**
```
Gniazdo podwójne z uziemieniem Ref: MGU5.201.25ZD
Osprzęt i punkty • szt
```

### **После:**
```
Gniazdo podwójne z uziemieniem
MGU5.201.25ZD • Osprzęt i punkty • szt
```

**Преимущества:**
- ✅ Чище и профессиональнее
- ✅ Артикул выделен визуально
- ✅ Легче читать
- ✅ Лучше на мобильных

---

**Версия:** 1.0  
**Дата:** 22 stycznia 2026
