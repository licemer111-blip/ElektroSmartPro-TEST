// ============================================================================
// CATALOG SEARCH API - SIMPLIFIED VERSION
// ============================================================================
// Упрощенная версия для быстрого использования
// Для полного функционала смотри: lib/catalog-search.ts
// ============================================================================

import { createClient } from '@/utils/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export type CatalogSearchResult = {
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
  score: number;
};

// Расширенный тип (с названием категории)
export type CatalogSearchResultWithCategory = CatalogSearchResult & {
  category_name: string | null;
};

// Упрощенный тип (только основные поля)
export type SimpleCatalogItem = {
  id: string;
  name: string;
  unit: string;
  price: number; // Материал или работа (зависит от type)
  type: 'material' | 'labor';
  score: number;
  category_name?: string | null;
};

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Базовый поиск по каталогу
 * @param query - Поисковый запрос (мин. 2 символа)
 * @param limit - Максимальное количество результатов (default: 20)
 * @returns Массив результатов с релевантностью
 */
export async function searchCatalog(
  query: string,
  limit = 20
): Promise<CatalogSearchResult[]> {
  const supabase = createClient();
  
  // Не ищем, если запрос слишком короткий
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('search_catalog', {
      search_term: query.trim(),
      limit_val: limit,
    });

    if (error) {
      // RPC error in searchCatalog - silently return empty
      return [];
    }

    return (data || []) as CatalogSearchResult[];
  } catch (err) {
    // Silent catch('[searchCatalog] Exception:', err);
    return [];
  }
}

/**
 * Умный поиск с автоматическим fallback на fuzzy matching
 * Обрабатывает опечатки автоматически
 * @param query - Поисковый запрос
 * @param limit - Максимальное количество результатов
 * @returns Массив результатов
 */
export async function smartSearchCatalog(
  query: string,
  limit = 20
): Promise<CatalogSearchResult[]> {
  const supabase = createClient();
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('smart_search_catalog', {
      search_term: query.trim(),
      limit_val: limit,
      filter_type: null,
      filter_category_id: null,
    });

    if (error) {
      // Silent catch('[smartSearchCatalog] RPC Error:', error);
      return [];
    }

    return (data || []) as CatalogSearchResult[];
  } catch (err) {
    // Silent catch('[smartSearchCatalog] Exception:', err);
    return [];
  }
}

/**
 * Поиск только материалов (type = 'material')
 * @param query - Поисковый запрос
 * @param limit - Максимальное количество результатов
 * @returns Массив материалов
 */
export async function searchMaterials(
  query: string,
  limit = 20
): Promise<CatalogSearchResult[]> {
  const supabase = createClient();
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('search_catalog', {
      search_term: query.trim(),
      limit_val: limit,
      filter_type: 'material',
      filter_category_id: null,
    });

    if (error) {
      // Silent catch('[searchMaterials] RPC Error:', error);
      return [];
    }

    return (data || []) as CatalogSearchResult[];
  } catch (err) {
    // Silent catch('[searchMaterials] Exception:', err);
    return [];
  }
}

/**
 * Поиск только услуг (type = 'labor')
 * @param query - Поисковый запрос
 * @param limit - Максимальное количество результатов
 * @returns Массив услуг
 */
export async function searchLabor(
  query: string,
  limit = 20
): Promise<CatalogSearchResult[]> {
  const supabase = createClient();
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('search_catalog', {
      search_term: query.trim(),
      limit_val: limit,
      filter_type: 'labor',
      filter_category_id: null,
    });

    if (error) {
      // Silent catch('[searchLabor] RPC Error:', error);
      return [];
    }

    return (data || []) as CatalogSearchResult[];
  } catch (err) {
    // Silent catch('[searchLabor] Exception:', err);
    return [];
  }
}

/**
 * Поиск с названием категории (включает LEFT JOIN с catalog_categories)
 * @param query - Поисковый запрос
 * @param limit - Максимальное количество результатов
 * @returns Массив результатов с category_name
 */
export async function searchCatalogWithCategory(
  query: string,
  limit = 20
): Promise<CatalogSearchResultWithCategory[]> {
  const supabase = createClient();
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('search_catalog_with_category', {
      search_term: query.trim(),
      limit_val: limit,
      filter_type: null,
      filter_category_id: null,
    });

    if (error) {
      // Silent catch('[searchCatalogWithCategory] RPC Error:', error);
      return [];
    }

    return (data || []) as CatalogSearchResultWithCategory[];
  } catch (err) {
    // Silent catch('[searchCatalogWithCategory] Exception:', err);
    return [];
  }
}

/**
 * Умный поиск с названием категории (обрабатывает опечатки + category_name)
 * @param query - Поисковый запрос
 * @param limit - Максимальное количество результатов
 * @returns Массив результатов с category_name
 */
export async function smartSearchWithCategory(
  query: string,
  limit = 20
): Promise<CatalogSearchResultWithCategory[]> {
  const supabase = createClient();
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc('smart_search_catalog_with_category', {
      search_term: query.trim(),
      limit_val: limit,
      filter_type: null,
      filter_category_id: null,
    });

    if (error) {
      // Silent catch('[smartSearchWithCategory] RPC Error:', error);
      return [];
    }

    return (data || []) as CatalogSearchResultWithCategory[];
  } catch (err) {
    // Silent catch('[smartSearchWithCategory] Exception:', err);
    return [];
  }
}

/**
 * Упрощенная версия поиска (возвращает только основные поля)
 * @param query - Поисковый запрос
 * @param limit - Максимальное количество результатов
 * @param withCategory - Включить название категории (default: false)
 * @returns Массив упрощенных результатов
 */
export async function simpleSearch(
  query: string,
  limit = 20,
  withCategory = false
): Promise<SimpleCatalogItem[]> {
  if (withCategory) {
    const results = await searchCatalogWithCategory(query, limit);
    return results.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      price: item.type === 'material' ? item.base_material_price : item.base_labor_price,
      type: item.type,
      score: item.score,
      category_name: item.category_name,
    }));
  }

  const results = await searchCatalog(query, limit);
  return results.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    price: item.type === 'material' ? item.base_material_price : item.base_labor_price,
    type: item.type,
    score: item.score,
  }));
}

// ============================================================================
// USAGE EXAMPLES:
// ============================================================================

/*
// 1. Базовый поиск
const results = await searchCatalog('schneider wyłącznik');

// 2. Умный поиск (обрабатывает опечатки)
const results = await smartSearchCatalog('shneider wyłachnik');

// 3. Поиск только материалов
const materials = await searchMaterials('panel LED', 10);

// 4. Поиск только услуг
const services = await searchLabor('montaż koryt');

// 5. Поиск с названием категории
const resultsWithCat = await searchCatalogWithCategory('gniazdo');

// 6. Умный поиск с категорией (рекомендуется для UI)
const smart = await smartSearchWithCategory('panel led');

// 7. Упрощенный поиск (только основные поля)
const simple = await simpleSearch('gniazdo', 20, false); // Без категории
const simpleWithCat = await simpleSearch('gniazdo', 20, true); // С категорией

// 8. Доступ к полям результата
results.forEach(item => {
  // item.name, item.base_material_price, item.base_labor_price, item.score, item.category_id
});

// 9. С категорией
resultsWithCat.forEach(item => {
  // item.name, item.category_name, item.base_material_price
});

// 10. Для React компонентов (рекомендуется smartSearchWithCategory)
const handleSearch = async (query: string) => {
  const results = await smartSearchWithCategory(query, 20);
  // Обрабатывает опечатки + возвращает category_name
  setSearchResults(results);
};
*/

// ============================================================================
// SEARCH WITH LABOR PRIORITY (NEW!)
// ============================================================================
// Функции поиска с приоритетом услуг (labor first)
// Идеально для kosztorys, где услуги добавляются первыми
// ============================================================================

/**
 * Поиск с приоритетом услуг (labor first)
 * Сначала показывает услуги, потом материалы
 * Комбинирует fulltext + similarity для лучших результатов
 *
 * @param query - Поисковый запрос
 * @param limit - Максимум результатов (по умолчанию 50)
 * @param filterType - Фильтр: 'all', 'labor', 'material' (по умолчанию 'all')
 * @returns Массив результатов с category_name, sorted by labor first
 */
export async function searchCatalogLaborFirst(
  query: string,
  limit = 50,
  filterType: 'all' | 'labor' | 'material' = 'all'
): Promise<SimpleCatalogItem[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = createClient();

  const { data, error } = await supabase.rpc('search_catalog_with_labor_priority', {
    search_term: query.trim(),
    limit_val: limit,
    filter_type: filterType,
  });

  if (error) {
    // Silent catch('Search error:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Преобразуем в SimpleCatalogItem
  return data.map((item: CatalogSearchResultWithCategory) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    price: item.type === 'labor' ? item.base_labor_price : item.base_material_price,
    type: item.type,
    score: item.score,
    category_name: item.category_name,
  }));
}

/**
 * Упрощенный поиск с приоритетом labor (только similarity)
 * Быстрая версия для простых запросов
 *
 * @param query - Поисковый запрос
 * @param limit - Максимум результатов (по умолчанию 50)
 * @param filterType - Фильтр: 'all', 'labor', 'material'
 * @returns Массив результатов, labor first
 */
export async function searchLaborFirstSimple(
  query: string,
  limit = 50,
  filterType: 'all' | 'labor' | 'material' = 'all'
): Promise<SimpleCatalogItem[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = createClient();

  const { data, error } = await supabase.rpc('search_catalog_labor_first', {
    search_term: query.trim(),
    limit_val: limit,
    filter_type: filterType,
  });

  if (error) {
    // Silent catch('Search error:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  return data.map((item: CatalogSearchResultWithCategory) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    price: item.type === 'labor' ? item.base_labor_price : item.base_material_price,
    type: item.type,
    score: item.score,
    category_name: item.category_name,
  }));
}

/**
 * Smart search с приоритетом labor
 * Лучший вариант для UI компонентов
 * Комбинирует fulltext + fuzzy + labor priority
 *
 * @param query - Поисковый запрос
 * @param limit - Максимум результатов (по умолчанию 20)
 * @param filterType - Фильтр: 'labor', 'material', null для 'all'
 * @returns Массив результатов с полными данными, labor first
 */
export async function smartSearchLaborFirst(
  query: string,
  limit = 20,
  filterType: 'labor' | 'material' | null = null
): Promise<CatalogSearchResult[]> {
  if (!query || query.trim().length < 2) return [];

  const supabase = createClient();

  const { data, error } = await supabase.rpc('smart_search_with_labor_priority', {
    search_term: query.trim(),
    limit_val: limit,
    filter_type: filterType,
  });

  if (error) {
    // Silent catch('Search error:', error);
    return [];
  }

  return (data as CatalogSearchResult[]) || [];
}

// ============================================================================
// USAGE EXAMPLES (LABOR PRIORITY):
// ============================================================================

/*
// 1. Поиск с приоритетом услуг (для kosztorys)
const results = await searchCatalogLaborFirst('montaż', 20, 'all');
// Результат: Сначала "Montaż rozdzielnicy", потом материалы

// 2. Только услуги (быстрая версия)
const labor = await searchLaborFirstSimple('montaż', 50, 'labor');

// 3. Smart search с labor priority (рекомендуется)
const smart = await smartSearchLaborFirst('panel', 20);

// 4. В React компоненте:
const handleSearch = async (query: string) => {
  const results = await searchCatalogLaborFirst(query, 20, 'all');
  // Labor результаты идут первыми!
  setSearchResults(results);
};

// 5. Проверка типа результата:
results.forEach(item => {
  if (item.type === 'labor') {
    // Usługa: item.name, item.price (base_labor_price)
  } else {
    // Materiał: item.name, item.price (base_material_price)
  }
});
*/
