// ============================================================================
// CATALOG DISPLAY UTILITIES
// ============================================================================
// Утилиты для отображения названий каталога (парсинг артикулов и т.д.)
// ============================================================================

/**
 * Парсит название товара, отделяя основное название от артикула
 * @param fullName - Полное название (например: "Gniazdo podwójne z uziemieniem Ref: MGU5.201.25ZD")
 * @returns Объект с displayName и refCode
 */
export function parseItemName(fullName: string): {
  displayName: string;
  refCode: string | null;
} {
  if (!fullName) {
    return { displayName: '', refCode: null };
  }

  // Проверяем наличие "Ref:"
  const hasRef = fullName.includes('Ref:');

  if (!hasRef) {
    return {
      displayName: fullName.trim(),
      refCode: null,
    };
  }

  // Разделяем по "Ref:"
  const parts = fullName.split('Ref:');

  return {
    displayName: parts[0].trim(),
    refCode: parts[1] ? parts[1].trim() : null,
  };
}

/**
 * Форматирует цену для отображения в polskim formacie
 * @param price - Цена
 * @param currency - Валюта (по умолчанию 'PLN')
 * @returns Форматированная строка (np. "1 234,56 PLN")
 */
export function formatPrice(price: number, currency = 'PLN'): string {
  return `${price.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

/**
 * Укорачивает название до определенной длины
 * @param text - Текст
 * @param maxLength - Максимальная длина (по умолчанию 50)
 * @returns Укороченный текст с "..."
 */
export function truncateText(text: string, maxLength = 50): string {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}

/**
 * Получает тип иконки для элемента каталога
 * @param type - Тип ('labor' или 'material')
 * @returns Название иконки из lucide-react
 */
export function getItemIcon(type: 'labor' | 'material'): string {
  return type === 'labor' ? 'Hammer' : 'Package';
}

/**
 * Получает цвет для типа элемента
 * @param type - Тип ('labor' или 'material')
 * @returns Tailwind CSS класс цвета
 */
export function getItemColor(type: 'labor' | 'material'): {
  text: string;
  bg: string;
  icon: string;
} {
  if (type === 'labor') {
    return {
      text: 'text-orange-600',
      bg: 'bg-orange-50',
      icon: 'text-orange-500',
    };
  }

  return {
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: 'text-blue-500',
  };
}

/**
 * Извлекает цену из элемента каталога в зависимости от типа
 * @param item - Элемент каталога с base_material_price и base_labor_price
 * @returns Актуальная цена
 */
export function getItemPrice(item: {
  type: 'labor' | 'material';
  base_material_price: number;
  base_labor_price: number;
}): number {
  return item.type === 'labor' ? item.base_labor_price : item.base_material_price;
}

// ============================================================================
// USAGE EXAMPLES:
// ============================================================================

/*
// 1. Парсинг названия
const { displayName, refCode } = parseItemName(
  'Gniazdo podwójne z uziemieniem Ref: MGU5.201.25ZD'
);
// displayName: "Gniazdo podwójne z uziemieniem"
// refCode: "MGU5.201.25ZD"

// 2. В компоненте:
const { displayName, refCode } = parseItemName(item.name);

return (
  <div>
    <span className="font-medium">{displayName}</span>
    {refCode && (
      <span className="text-xs text-muted-foreground font-mono">
        Ref: {refCode}
      </span>
    )}
  </div>
);

// 3. Цвета и иконки:
const colors = getItemColor(item.type);
// labor: { text: 'text-orange-600', bg: 'bg-orange-50', icon: 'text-orange-500' }
// material: { text: 'text-blue-600', bg: 'bg-blue-50', icon: 'text-blue-500' }

// 4. Цена:
const price = getItemPrice(item);
// Автоматически выбирает base_labor_price или base_material_price

// 5. Форматирование:
const formattedPrice = formatPrice(price); // "125.50 PLN"
const shortText = truncateText(displayName, 30); // "Gniazdo podwójne z uziem..."
*/
