// ============================================================================
// CATALOG SEARCH INPUT COMPONENT
// ============================================================================
// Универсальный компонент поиска для каталога с автокомплитом
// ============================================================================

'use client';

import { useSmartSearchWithCategory } from '@/hooks/use-catalog-search';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
import { Loader2, Search, Package, Hammer, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { parseItemName } from '@/lib/utils/catalog-display';

// ============================================================================
// TYPES
// ============================================================================

interface CatalogSearchInputProps {
  /** Callback при выборе элемента */
  onSelect: (item: CatalogSearchResultWithCategory) => void;
  /** Placeholder текст */
  placeholder?: string;
  /** Автоматически очищать поле после выбора */
  clearOnSelect?: boolean;
  /** Отключить компонент */
  disabled?: boolean;
  /** CSS классы для контейнера */
  className?: string;
  /** Показывать кнопку очистки */
  showClearButton?: boolean;
  /** Максимальное количество результатов */
  limit?: number;
  /** PRO пользователь — показывать цены */
  isPro?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CatalogSearchInput({
  onSelect,
  placeholder = 'Szukaj materiałów i usług...',
  clearOnSelect = true,
  disabled = false,
  className,
  showClearButton = true,
  limit = 20,
  isPro = false,
}: CatalogSearchInputProps) {
  const { query, setQuery, results, isLoading, clear } = useSmartSearchWithCategory(limit);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ========== CLICK OUTSIDE HANDLER ==========
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ========== SELECT HANDLER ==========
  const handleSelect = (item: CatalogSearchResultWithCategory) => {
    onSelect(item);
    if (clearOnSelect) {
      clear(); // Используем clear() из хука
    }
    setIsOpen(false);
  };

  // ========== CLEAR HANDLER ==========
  const handleClear = () => {
    clear();
    setIsOpen(false);
  };

  // ========== RENDER ==========
  return (
    <div className={cn('relative w-full max-w-xl', className)} ref={containerRef}>
      {/* Input Field */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          id="catalog-search-main"
          name="catalog-search-main"
          aria-label="Szukaj w katalogu"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className={cn(
            'w-full pl-10 py-2 border rounded-md transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            'bg-background border-input',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            showClearButton && query.length > 0 ? 'pr-10' : 'pr-4'
          )}
          placeholder={placeholder}
        />

        {/* Loading or Clear Button */}
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
        ) : showClearButton && query.length > 0 ? (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
            type="button"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nie znaleziono wyników dla &quot;{query}&quot;
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item) => {
                // Определяем тип и цену
                const isLabor = item.type === 'labor';
                const price = isLabor ? item.base_labor_price : item.base_material_price;
                const priceLabel = isLabor ? 'PLN/rbh' : 'PLN';
                const { displayName, refCode } = parseItemName(item.name);

                return (
                  <li
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      'px-4 py-2 cursor-pointer transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'border-b last:border-b-0 border-border'
                    )}
                  >
                    <div className="flex justify-between items-center gap-3">
                      {/* Left: Name and Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {/* Icon */}
                          {isLabor ? (
                            <Hammer className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                          ) : (
                            <Package className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          )}
                          {/* Name - Clean without Ref */}
                          <span className="font-medium text-sm truncate">
                            {displayName}
                          </span>
                        </div>
                        {/* Ref Code, Category and Unit */}
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
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
                      <div className="text-right flex-shrink-0">
                        <div
                          className={cn(
                            'text-sm font-bold',
                            isLabor ? 'text-orange-600' : 'text-blue-600'
                          )}
                        >
                          {isPro ? `${price.toFixed(2)} ${priceLabel}` : (
                            <span className="flex items-center gap-1">
                              <span className="blur-[4px] select-none">**.**</span>
                              <span className="text-[9px] font-bold bg-amber-500 text-white px-1 py-0.5 rounded no-blur">PRO</span>
                            </span>
                          )}
                        </div>
                        {isLabor && (
                          <div className="text-xs text-muted-foreground">robocizna</div>
                        )}
                      </div>
                    </div>

                    {/* Description (if exists) */}
                    {item.description && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USAGE EXAMPLES:
// ============================================================================

/*
// 1. Базовое использование
<CatalogSearchInput onSelect={(item) => handleSelect(item)} />

// 2. Не очищать поле после выбора
<CatalogSearchInput
  onSelect={(item) => addToProject(item)}
  clearOnSelect={false}
/>

// 3. Кастомный placeholder
<CatalogSearchInput
  onSelect={handleSelect}
  placeholder="Znajdź materiał..."
/>

// 4. Без кнопки очистки
<CatalogSearchInput
  onSelect={handleSelect}
  showClearButton={false}
/>

// 5. Ограничить результаты
<CatalogSearchInput
  onSelect={handleSelect}
  limit={10}
/>

// 6. Disabled state
<CatalogSearchInput
  onSelect={handleSelect}
  disabled={isSubmitting}
/>

// 7. В форме добавления позиции в проект
function AddItemForm() {
  const handleSelect = async (item: CatalogSearchResultWithCategory) => {
    await addItemToProject({
      catalogItemId: item.id,
      name: item.name,
      unit: item.unit,
      baseMaterialPrice: item.base_material_price,
      baseLaborPrice: item.base_labor_price,
    });
  };

  return (
    <div>
      <h3>Dodaj pozycję</h3>
      <CatalogSearchInput onSelect={handleSelect} />
    </div>
  );
}
*/
