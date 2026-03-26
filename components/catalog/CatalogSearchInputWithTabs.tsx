// ============================================================================
// CATALOG SEARCH INPUT WITH TABS (Labor/Materials)
// ============================================================================
// Компонент поиска с табами: ТОЛЬКО услуги или материалы (по умолчанию labor)
// ============================================================================

'use client';

import { useCatalogSearch, type SearchMode } from '@/hooks/use-catalog-search';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
import { Loader2, Search, Package, Hammer } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { parseItemName } from '@/lib/utils/catalog-display';

// ============================================================================
// TYPES
// ============================================================================

type FilterType = 'labor' | 'material';

interface CatalogSearchInputWithTabsProps {
  onSelect: (item: CatalogSearchResultWithCategory) => void;
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

export function CatalogSearchInputWithTabs({
  onSelect,
  clearOnSelect = true,
  disabled = false,
  className,
  limit = 20,
  defaultFilter = 'labor', // ← По умолчанию УСЛУГИ (работа)
  isPro = false,
}: CatalogSearchInputWithTabsProps) {
  const [filterType, setFilterType] = useState<FilterType>(defaultFilter);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Определяем режим поиска на основе фильтра
  const searchMode: SearchMode = filterType === 'material' ? 'materials' : 'labor';

  // Плейсхолдер зависит от выбранного типа
  const placeholder =
    filterType === 'labor' ? 'Szukaj usługi... (np. montaż)' : 'Szukaj materiału... (np. kabel)';

  const searchResult = useCatalogSearch({
    mode: searchMode,
    limit,
  });

  const { query, setQuery, isLoading, clear } = searchResult;
  const results = searchResult.results as CatalogSearchResultWithCategory[];

  // Click outside handler
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
    <div className={cn('space-y-3', className)} ref={containerRef}>
      {/* Tabs для переключения типа */}
      <Tabs
        defaultValue={defaultFilter}
        value={filterType}
        onValueChange={(value) => setFilterType(value as FilterType)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="labor" className="flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            Usługi (Robocizna)
          </TabsTrigger>
          <TabsTrigger value="material" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Materiały
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          id="catalog-search-tabs"
          name="catalog-search-tabs"
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
            'w-full pl-10 pr-10 py-2.5 border rounded-md',
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

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nie znaleziono {filterType === 'labor' ? 'usług' : 'materiałów'}
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
                    className="px-4 py-2.5 hover:bg-accent cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex justify-between items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isLabor ? (
                            <Hammer className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                          ) : (
                            <Package className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
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
                      <div
                        className={cn(
                          'text-sm font-bold flex-shrink-0',
                          isLabor ? 'text-orange-600' : 'text-blue-600'
                        )}
                      >
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
// USAGE EXAMPLES:
// ============================================================================

/*
// 1. Podstawowe użycie (domyślnie labor)
<CatalogSearchInputWithTabs
  onSelect={(item) => handleSelect(item)}
/>

// 2. Domyślnie materiały
<CatalogSearchInputWithTabs
  onSelect={handleSelect}
  defaultFilter="material"
/>

// 3. W formularzu dodawania pozycji
function AddItemForm() {
  const [items, setItems] = useState<CatalogSearchResultWithCategory[]>([]);

  const handleAddItem = (item: CatalogSearchResultWithCategory) => {
    setItems([...items, item]);
    toast.success(`Dodano: ${item.name}`);
  };

  return (
    <div className="space-y-4">
      <h2>Dodaj pozycję do kosztorysu</h2>
      <CatalogSearchInputWithTabs onSelect={handleAddItem} />
      
      <div>
        <h3>Wybrane pozycje:</h3>
        {items.map((item) => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>
    </div>
  );
}

// 4. W Dialog/Modal
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Wybierz pozycję</DialogTitle>
    </DialogHeader>
    <CatalogSearchInputWithTabs
      onSelect={(item) => {
        handleSelect(item);
        setOpen(false); // Zamknij dialog
      }}
    />
  </DialogContent>
</Dialog>
*/
