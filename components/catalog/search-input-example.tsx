// ============================================================================
// SEARCH INPUT EXAMPLES
// ============================================================================
// Примеры компонентов поиска с использованием useCatalogSearch hook
// ============================================================================

'use client';

import { Search, X, Loader2 } from 'lucide-react';
import {
  useCatalogSearch,
  useSmartSearchWithCategory,
} from '@/hooks/use-catalog-search';
import type { CatalogSearchResultWithCategory } from '@/lib/catalog-api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ============================================================================
// EXAMPLE 1: SIMPLE SEARCH INPUT
// ============================================================================

export function SimpleSearchInput() {
  const { query, setQuery, results, isLoading } = useSmartSearchWithCategory();

  return (
    <div className="relative w-full max-w-md">
      <Input
        type="text"
        placeholder="Szukaj materiałów..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
      )}

      {/* Results Dropdown */}
      {results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-80 overflow-y-auto z-50">
          {results.map((item) => (
            <div
              key={item.id}
              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
            >
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">
                {item.category_name} • {item.unit}
              </div>
              <div className="text-sm font-semibold text-primary">
                {item.base_material_price > 0
                  ? `${item.base_material_price.toFixed(2)} PLN`
                  : `${item.base_labor_price.toFixed(2)} PLN/rbh`}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: SEARCH WITH CLEAR BUTTON
// ============================================================================

export function SearchInputWithClear() {
  const { query, setQuery, results, isLoading, clear, hasResults } =
    useSmartSearchWithCategory();

  return (
    <div className="relative w-full max-w-md">
      <Input
        type="text"
        placeholder="Wyszukaj pozycję..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

      {/* Loading or Clear Button */}
      {isLoading ? (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
      ) : query.length > 0 ? (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      ) : null}

      {/* Results Count */}
      {hasResults && !isLoading && (
        <div className="mt-2 text-sm text-muted-foreground">
          Znaleziono: {results.length} pozycji
        </div>
      )}

      {/* Results List */}
      {hasResults && (
        <div className="mt-2 space-y-2">
          {results.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {item.category_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {item.type === 'material'
                      ? `${item.base_material_price.toFixed(2)} PLN`
                      : `${item.base_labor_price.toFixed(2)} PLN/rbh`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.unit}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {query.length >= 2 && !isLoading && !hasResults && (
        <div className="mt-4 text-center text-muted-foreground">
          Nie znaleziono wyników dla &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: MANUAL SEARCH (with button)
// ============================================================================

export function ManualSearchInput() {
  const searchResult = useCatalogSearch({
    mode: 'smartCategory',
    autoSearch: false,
  });
  const { query, setQuery, isLoading, search, error } = searchResult;
  const results = searchResult.results as CatalogSearchResultWithCategory[];

  const handleSearch = () => {
    if (query.length >= 2) {
      search();
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Szukaj..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={isLoading || query.length < 2}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-destructive">
          Błąd: {error.message}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">
            Wyniki ({results.length}):
          </div>
          <div className="space-y-2">
            {results.map((item) => (
              <div
                key={item.id}
                className="p-2 border rounded hover:bg-muted cursor-pointer"
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: MATERIALS ONLY SEARCH
// ============================================================================

export function MaterialsOnlySearch() {
  const { query, setQuery, results, isLoading } = useCatalogSearch({
    mode: 'materials',
    limit: 10,
  });

  return (
    <div className="w-full max-w-md">
      <div className="mb-2 text-sm text-muted-foreground">
        Wyszukiwanie tylko materiałów
      </div>
      <Input
        type="text"
        placeholder="Szukaj materiałów..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading && (
        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ładowanie...
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="flex justify-between">
                <span className="font-medium">{item.name}</span>
                <span className="text-primary font-semibold">
                  {item.base_material_price.toFixed(2)} PLN
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: LABOR SERVICES SEARCH
// ============================================================================

export function LaborServicesSearch() {
  const { query, setQuery, results, isLoading } = useCatalogSearch({
    mode: 'labor',
    debounceMs: 400,
  });

  return (
    <div className="w-full max-w-md">
      <div className="mb-2 text-sm text-muted-foreground">
        Wyszukiwanie usług (robocizna)
      </div>
      <Input
        type="text"
        placeholder="Szukaj usług..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {isLoading && (
        <div className="mt-2 text-sm text-muted-foreground">Szukam...</div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((item) => (
            <Card key={item.id} className="p-3">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">
                {item.unit} • {item.base_labor_price.toFixed(2)} PLN
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// USAGE IN PAGE:
// ============================================================================

/*
// app/dashboard/catalog/page.tsx
import { SimpleSearchInput } from '@/components/catalog/search-input-example';

export default function CatalogPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Katalog Pozycji</h1>
      <SimpleSearchInput />
    </div>
  );
}
*/
