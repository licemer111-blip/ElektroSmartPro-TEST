// ============================================================================
// CATALOG SEARCH API
// ============================================================================
// Client-side utilities for searching catalog items using Supabase RPC
// Supports full-text search, fuzzy matching, and filters
// ============================================================================

import { logger } from "@/lib/logger";
import { createClient } from '@/utils/supabase/client';

// Types
export interface CatalogSearchResult {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  base_material_price: number;
  base_labor_price: number;
  type: 'material' | 'labor';
  category_id: string;
  sub_category: string | null;
  market_comment: string | null;
  price_min?: number | null;
  price_max?: number | null;
  price_trend?: string | null;
  confidence_level?: string | null;
  score?: number;
  match_type?: 'fulltext' | 'fuzzy';
}

export interface SearchOptions {
  limit?: number;
  filterType?: 'material' | 'labor' | null;
  filterCategoryId?: string | null;
  useFuzzy?: boolean;
  useSmart?: boolean;
}

// ============================================================================
// MAIN SEARCH FUNCTIONS
// ============================================================================

/**
 * Search catalog items using full-text search
 * @param query - Search query (supports multiple words)
 * @param options - Search options (limit, filters)
 * @returns Array of matching items with relevance scores
 */
export async function searchCatalog(
  query: string,
  options: SearchOptions = {}
): Promise<CatalogSearchResult[]> {
  const supabase = createClient();
  
  // Validate query
  if (!query || query.trim().length < 2) {
    return [];
  }

  const {
    limit = 20,
    filterType = null,
    filterCategoryId = null,
  } = options;

  try {
    const { data, error } = await supabase.rpc('search_catalog', {
      search_term: query.trim(),
      limit_val: limit,
      filter_type: filterType,
      filter_category_id: filterCategoryId,
    });

    if (error) {
      logger.error('[searchCatalog] Error', {}, error);
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('[searchCatalog] Exception', {}, err);
    return [];
  }
}

/**
 * Fuzzy search for handling typos and partial matches
 * @param query - Search query (may contain typos)
 * @param options - Search options
 * @returns Array of matching items with similarity scores
 */
export async function fuzzySearchCatalog(
  query: string,
  options: SearchOptions = {}
): Promise<CatalogSearchResult[]> {
  const supabase = createClient();
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  const { limit = 20 } = options;

  try {
    const { data, error } = await supabase.rpc('fuzzy_search_catalog', {
      search_term: query.trim(),
      limit_val: limit,
      similarity_threshold: 0.3,
    });

    if (error) {
      logger.error('[fuzzySearchCatalog] Error', {}, error);
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('[fuzzySearchCatalog] Exception', {}, err);
    return [];
  }
}

/**
 * Smart search with automatic fallback to fuzzy matching
 * @param query - Search query
 * @param options - Search options
 * @returns Array of matching items (full-text first, fuzzy fallback)
 */
export async function smartSearchCatalog(
  query: string,
  options: SearchOptions = {}
): Promise<CatalogSearchResult[]> {
  const supabase = createClient();
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  const {
    limit = 20,
    filterType = null,
    filterCategoryId = null,
  } = options;

  try {
    const { data, error } = await supabase.rpc('smart_search_catalog', {
      search_term: query.trim(),
      limit_val: limit,
      filter_type: filterType,
      filter_category_id: filterCategoryId,
    });

    if (error) {
      logger.error('[smartSearchCatalog] Error', {}, error);
      return [];
    }

    return data || [];
  } catch (err) {
    logger.error('[smartSearchCatalog] Exception', {}, err);
    return [];
  }
}

/**
 * Search materials only (convenience wrapper)
 * @param query - Search query
 * @param limit - Max results
 * @returns Array of material items
 */
export async function searchMaterials(
  query: string,
  limit: number = 20
): Promise<CatalogSearchResult[]> {
  return searchCatalog(query, { limit, filterType: 'material' });
}

/**
 * Search labor services only (convenience wrapper)
 * @param query - Search query
 * @param limit - Max results
 * @returns Array of labor items
 */
export async function searchLabor(
  query: string,
  limit: number = 20
): Promise<CatalogSearchResult[]> {
  return searchCatalog(query, { limit, filterType: 'labor' });
}

/**
 * Search by category (convenience wrapper)
 * @param query - Search query
 * @param categoryId - Category UUID
 * @param limit - Max results
 * @returns Array of items in the specified category
 */
export async function searchByCategory(
  query: string,
  categoryId: string,
  limit: number = 20
): Promise<CatalogSearchResult[]> {
  return searchCatalog(query, { limit, filterCategoryId: categoryId });
}

/**
 * Search by reference code (e.g., Schneider article numbers)
 * @param refCode - Reference code (e.g., "A9R41225")
 * @param limit - Max results
 * @returns Array of matching items
 */
export async function searchByRefCode(
  refCode: string,
  limit: number = 10
): Promise<CatalogSearchResult[]> {
  // Reference codes are usually in item names like "(Ref: A9R41225)"
  return searchCatalog(refCode, { limit });
}

// ============================================================================
// REACT HOOK (Optional)
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * React hook for debounced catalog search
 * @param initialQuery - Initial search query
 * @param options - Search options
 * @param debounceMs - Debounce delay in milliseconds
 * @returns Search results, loading state, and search function
 */
export function useCatalogSearch(
  initialQuery: string = '',
  options: SearchOptions = {},
  debounceMs: number = 300
) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = options.useSmart
          ? await smartSearchCatalog(query, options)
          : options.useFuzzy
          ? await fuzzySearchCatalog(query, options)
          : await searchCatalog(query, options);

        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, options.limit, options.filterType, options.filterCategoryId, debounceMs]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
}

// ============================================================================
// EXAMPLE USAGE:
// ============================================================================

/*
// 1. Basic search
const results = await searchCatalog('schneider wyłącznik');

// 2. Search materials only
const materials = await searchMaterials('panel LED', 10);

// 3. Search labor services
const services = await searchLabor('montaż koryt', 15);

// 4. Search by category
const items = await searchByCategory('gniazdo', categoryId);

// 5. Search by reference code
const product = await searchByRefCode('A9R41225');

// 6. React component with hook
function SearchComponent() {
  const { query, setQuery, results, loading } = useCatalogSearch('', { 
    limit: 20, 
    useSmart: true 
  });

  return (
    <div>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Szukaj..." 
      />
      {loading && <p>Ładowanie...</p>}
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.name} - {item.base_material_price} PLN</li>
        ))}
      </ul>
    </div>
  );
}
*/
