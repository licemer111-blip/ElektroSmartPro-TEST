// ============================================================================
// CATALOG SEARCH HOOK - ENHANCED VERSION
// ============================================================================
// React Hook для поиска по каталогу с debounce, обработкой ошибок и опциями
// ============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  searchCatalog,
  smartSearchCatalog,
  searchCatalogWithCategory,
  smartSearchWithCategory,
  searchMaterials,
  searchLabor,
  type CatalogSearchResult,
  type CatalogSearchResultWithCategory,
} from '@/lib/catalog-api';

// ============================================================================
// TYPES
// ============================================================================

export type SearchMode =
  | 'basic'           // searchCatalog()
  | 'smart'           // smartSearchCatalog() - с обработкой опечаток
  | 'withCategory'    // searchCatalogWithCategory()
  | 'smartCategory'   // smartSearchWithCategory() - рекомендуется
  | 'materials'       // searchMaterials()
  | 'labor';          // searchLabor()

export interface UseCatalogSearchOptions {
  /** Режим поиска (default: 'smart') */
  mode?: SearchMode;
  /** Задержка debounce в мс (default: 300) */
  debounceMs?: number;
  /** Максимальное количество результатов (default: 20) */
  limit?: number;
  /** Минимальная длина запроса (default: 2) */
  minQueryLength?: number;
  /** Автоматически искать при изменении query (default: true) */
  autoSearch?: boolean;
}

export interface UseCatalogSearchReturn {
  /** Текущий поисковый запрос */
  query: string;
  /** Функция для изменения запроса */
  setQuery: (query: string) => void;
  /** Результаты поиска */
  results: CatalogSearchResult[] | CatalogSearchResultWithCategory[];
  /** Идет ли сейчас поиск */
  isLoading: boolean;
  /** Ошибка поиска (если есть) */
  error: Error | null;
  /** Функция для ручного запуска поиска */
  search: (customQuery?: string) => Promise<void>;
  /** Функция для очистки результатов */
  clear: () => void;
  /** Есть ли результаты */
  hasResults: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * React Hook для поиска по каталогу
 * 
 * @param options - Опции поиска
 * @returns Состояние и функции для работы с поиском
 * 
 * @example
 * // Базовое использование
 * const { query, setQuery, results, isLoading } = useCatalogSearch();
 * 
 * @example
 * // С опциями
 * const search = useCatalogSearch({
 *   mode: 'smartCategory',
 *   debounceMs: 500,
 *   limit: 10,
 * });
 */
export function useCatalogSearch(
  options: UseCatalogSearchOptions = {}
): UseCatalogSearchReturn {
  const {
    mode = 'smart',
    debounceMs = 300,
    limit = 20,
    minQueryLength = 2,
    autoSearch = true,
  } = options;

  // ========== STATE ==========
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<
    CatalogSearchResult[] | CatalogSearchResultWithCategory[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ========== REFS ==========
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ========== SEARCH FUNCTION ==========
  const performSearch = useCallback(
    async (searchQuery: string) => {
      // Валидация длины запроса
      if (searchQuery.length < minQueryLength) {
        setResults([]);
        setError(null);
        return;
      }

      // Отменяем предыдущий запрос
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        let data: CatalogSearchResult[] | CatalogSearchResultWithCategory[] = [];

        // Выбираем функцию поиска в зависимости от режима
        switch (mode) {
          case 'basic':
            data = await searchCatalog(searchQuery, limit);
            break;
          case 'smart':
            data = await smartSearchCatalog(searchQuery, limit);
            break;
          case 'withCategory':
            data = await searchCatalogWithCategory(searchQuery, limit);
            break;
          case 'smartCategory':
            data = await smartSearchWithCategory(searchQuery, limit);
            break;
          case 'materials':
            data = await searchMaterials(searchQuery, limit);
            break;
          case 'labor':
            data = await searchLabor(searchQuery, limit);
            break;
          default:
            data = await smartSearchCatalog(searchQuery, limit);
        }

        setResults(data);
      } catch (err) {
        // Игнорируем ошибки отмены
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        
        const errorObj = err instanceof Error ? err : new Error('Unknown error');
        setError(errorObj);
      } finally {
        setIsLoading(false);
      }
    },
    [mode, limit, minQueryLength]
  );

  // ========== MANUAL SEARCH ==========
  const search = useCallback(
    async (customQuery?: string) => {
      const searchQuery = customQuery ?? query;
      await performSearch(searchQuery);
    },
    [query, performSearch]
  );

  // ========== CLEAR ==========
  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsLoading(false);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // ========== AUTO SEARCH EFFECT ==========
  useEffect(() => {
    if (!autoSearch) return;

    // Очищаем результаты для коротких запросов
    if (query.length < minQueryLength) {
      setResults([]);
      setError(null);
      return;
    }

    // Сбрасываем предыдущий таймер
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Запускаем новый таймер
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, autoSearch, minQueryLength, debounceMs, performSearch]);

  // ========== CLEANUP ON UNMOUNT ==========
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ========== RETURN ==========
  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    search,
    clear,
    hasResults: results.length > 0,
  };
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/**
 * Hook для умного поиска (рекомендуется для большинства случаев)
 */
export function useSmartSearch(limit = 20) {
  return useCatalogSearch({ mode: 'smart', limit });
}

/**
 * Hook для умного поиска с названием категории (для UI)
 */
export function useSmartSearchWithCategory(limit = 20) {
  const result = useCatalogSearch({ mode: 'smartCategory', limit });
  return {
    ...result,
    results: result.results as CatalogSearchResultWithCategory[],
  };
}

/**
 * Hook для поиска материалов
 */
export function useMaterialsSearch(limit = 20) {
  return useCatalogSearch({ mode: 'materials', limit });
}

/**
 * Hook для поиска услуг
 */
export function useLaborSearch(limit = 20) {
  return useCatalogSearch({ mode: 'labor', limit });
}

// ============================================================================
// USAGE EXAMPLES:
// ============================================================================

/*
// 1. Базовое использование (с опечатками)
const { query, setQuery, results, isLoading } = useSmartSearch();

// 2. С категориями (для UI)
const search = useSmartSearchWithCategory(10);
<input value={search.query} onChange={(e) => search.setQuery(e.target.value)} />
{search.results.map(item => (
  <div>{item.name} ({item.category_name})</div>
))}

// 3. Только материалы
const materials = useMaterialsSearch();

// 4. Только услуги
const labor = useLaborSearch();

// 5. Продвинутое использование
const search = useCatalogSearch({
  mode: 'smartCategory',
  debounceMs: 500,
  limit: 15,
  minQueryLength: 3,
});

// 6. Ручной поиск (без auto search)
const { query, setQuery, search, results } = useCatalogSearch({
  autoSearch: false,
});
<button onClick={() => search()}>Szukaj</button>

// 7. Обработка ошибок
const { error, results, isLoading } = useSmartSearch();
{error && <div>Błąd: {error.message}</div>}

// 8. Очистка
const { clear, hasResults } = useSmartSearch();
{hasResults && <button onClick={clear}>Wyczyść</button>}
*/
