// ============================================================================
// CATALOG SEARCH INPUT WITH TYPE FILTER
// ============================================================================
// Компонент поиска с фильтром по типу (материалы/услуги/всё)
// ============================================================================

'use client';

import { useCatalogSearch, type SearchMode } from '@/hooks/use-catalog-search';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
import { Loader2, Search, Package, Hammer, Filter } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { parseItemName } from '@/lib/utils/catalog-display';

// ============================================================================
// TYPES
// ============================================================================

type FilterType = 'all' | 'materials' | 'labor';

interface CatalogSearchInputWithFilterProps {
  onSelect: (item: CatalogSearchResultWithCategory) => void;
  placeholder?: string;
  clearOnSelect?: boolean;
  disabled?: boolean;
  className?: string;
  limit?: number;
  defaultFilter?: FilterType;
  isPro?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CatalogSearchInputWithFilter({
  onSelect,
  placeholder = 'Szukaj...',
  clearOnSelect = true,
  disabled = false,
  className,
  limit = 20,
  defaultFilter = 'all',
  isPro = false,
}: CatalogSearchInputWithFilterProps) {
  const [filterType, setFilterType] = useState<FilterType>(defaultFilter);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Определяем режим поиска на основе фильтра
  const searchMode: SearchMode =
    filterType === 'materials'
      ? 'materials'
      : filterType === 'labor'
      ? 'labor'
      : 'smartCategory';

  const searchResult = useCatalogSearch({
    mode: searchMode,
    limit,
  });

  // Type assertion based on mode
  const { query, setQuery, isLoading, clear } = searchResult;
  const results = searchResult.results as CatalogSearchResultWithCategory[];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: CatalogSearchResultWithCategory) => {
    onSelect(item);
    if (clearOnSelect) {
      clear();
    }
    setIsOpen(false);
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Input with Filter Buttons */}
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="catalog-search-filter"
            name="catalog-search-filter"
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
              'w-full pl-10 pr-4 py-2 border rounded-md',
              'focus:outline-none focus:ring-2 focus:ring-primary',
              'bg-background border-input',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            placeholder={placeholder}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
          )}
        </div>

        {/* Filter Dropdown */}
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            disabled={disabled}
            className={cn(
              'h-full px-3 py-2 border rounded-md bg-background border-input',
              'focus:outline-none focus:ring-2 focus:ring-primary',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'text-sm font-medium'
            )}
          >
            <option value="all">Wszystko</option>
            <option value="materials">Materiały</option>
            <option value="labor">Usługi</option>
          </select>
        </div>
      </div>

      {/* Filter Pills (Alternative UI) */}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => setFilterType('all')}
          disabled={disabled}
          className={cn(
            'px-3 py-1 text-xs rounded-full transition-colors',
            filterType === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          Wszystko
        </button>
        <button
          onClick={() => setFilterType('materials')}
          disabled={disabled}
          className={cn(
            'px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1',
            filterType === 'materials'
              ? 'bg-blue-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <Package className="h-3 w-3" />
          Materiały
        </button>
        <button
          onClick={() => setFilterType('labor')}
          disabled={disabled}
          className={cn(
            'px-3 py-1 text-xs rounded-full transition-colors flex items-center gap-1',
            filterType === 'labor'
              ? 'bg-orange-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          <Hammer className="h-3 w-3" />
          Usługi
        </button>
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nie znaleziono {filterType === 'materials' ? 'materiałów' : filterType === 'labor' ? 'usług' : 'wyników'}
            </div>
          ) : (
            <ul className="py-1">
              {results.map((item) => {
                const isLabor = item.type === 'labor';
                const price = isLabor ? item.base_labor_price : item.base_material_price;
                const { displayName, refCode } = parseItemName(item.name);

                return (
                  <li
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="px-4 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isLabor ? (
                            <Hammer className="h-3.5 w-3.5 text-orange-500" />
                          ) : (
                            <Package className="h-3.5 w-3.5 text-blue-500" />
                          )}
                          <span className="font-medium text-sm truncate">{displayName}</span>
                        </div>
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
                      <div className={cn('text-sm font-bold', isLabor ? 'text-orange-600' : 'text-blue-600')}>
                        {isPro ? `${price.toFixed(2)} PLN` : (
                          <span className="flex items-center gap-1">
                            <span className="blur-[4px] select-none">**.**</span>
                            <span className="text-[9px] font-bold bg-amber-500 text-white px-1 py-0.5 rounded">PRO</span>
                          </span>
                        )}
                      </div>
                    </div>
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
// USAGE:
// ============================================================================

/*
// С фильтром по умолчанию "материалы"
<CatalogSearchInputWithFilter
  onSelect={handleSelect}
  defaultFilter="materials"
/>

// В форме добавления позиции
function AddItemDialog() {
  const [type, setType] = useState<'materials' | 'labor'>('materials');

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj pozycję</DialogTitle>
        </DialogHeader>
        <CatalogSearchInputWithFilter
          onSelect={handleAddItem}
          defaultFilter={type}
        />
      </DialogContent>
    </Dialog>
  );
}
*/
