// ============================================================================
// COMPACT CATALOG SEARCH INPUT
// ============================================================================
// Компактная версия для модальных окон и узких мест
// ============================================================================

'use client';

import { useSmartSearchWithCategory } from '@/hooks/use-catalog-search';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
import { Loader2, Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { parseItemName } from '@/lib/utils/catalog-display';

// ============================================================================
// TYPES
// ============================================================================

interface CatalogSearchInputCompactProps {
  onSelect: (item: CatalogSearchResultWithCategory) => void;
  placeholder?: string;
  clearOnSelect?: boolean;
  isPro?: boolean;
  disabled?: boolean;
  className?: string;
  limit?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CatalogSearchInputCompact({
  onSelect,
  placeholder = 'Szukaj...',
  clearOnSelect = true,
  disabled = false,
  className,
  limit = 15,
  isPro = false,
}: CatalogSearchInputCompactProps) {
  const { query, setQuery, results, isLoading, clear } = useSmartSearchWithCategory(limit);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          id="catalog-search-compact"
          name="catalog-search-compact"
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
            'w-full pl-8 pr-8 py-1.5 text-sm border rounded',
            'focus:outline-none focus:ring-1 focus:ring-primary',
            'bg-background border-input',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          placeholder={placeholder}
        />
        {isLoading ? (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-primary" />
        ) : query.length > 0 ? (
          <button
            onClick={() => clear()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            type="button"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        ) : null}
      </div>

      {/* Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 && !isLoading ? (
            <div className="p-3 text-center text-xs text-muted-foreground">
              Brak wyników
            </div>
          ) : (
            <ul>
              {results.map((item) => {
                const isLabor = item.type === 'labor';
                const price = isLabor ? item.base_labor_price : item.base_material_price;
                const { displayName, refCode } = parseItemName(item.name);

                return (
                  <li
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="px-3 py-1.5 hover:bg-accent cursor-pointer text-sm border-b last:border-b-0"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="truncate font-medium">{displayName}</span>
                      <span className={cn('text-xs font-semibold whitespace-nowrap', isLabor ? 'text-orange-600' : 'text-blue-600')}>
                        {isPro ? price.toFixed(2) : (
                          <span className="flex items-center gap-1">
                            <span className="blur-[4px] select-none">**.**</span>
                            <span className="text-[9px] font-bold bg-amber-500 text-white px-1 py-0.5 rounded">PRO</span>
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                      {refCode && (
                        <>
                          <span className="font-mono bg-muted px-1 py-0.5 rounded text-[9px]">
                            {refCode}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span>{item.category_name}</span>
                      <span>•</span>
                      <span>{item.unit}</span>
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
// В модальном окне
<Dialog>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Dodaj pozycję</DialogTitle>
    </DialogHeader>
    <CatalogSearchInputCompact onSelect={handleSelect} />
  </DialogContent>
</Dialog>

// В узкой колонке
<div className="w-48">
  <CatalogSearchInputCompact
    onSelect={handleSelect}
    placeholder="Szukaj..."
  />
</div>
*/
