// ─── Barrel re-exports — preserves all existing imports in UI ─────────────────
// Domain split:
//   catalog-search-actions.ts     → getCatalogItems, getTotalCatalogCount, getCategoryItemCounts, getCatalogCategories
//   catalog-item-actions.ts       → createCatalogItem, updateCatalogItem, deleteCatalogItem, moveItemToCategory,
//                                   hideGlobalCatalogItem, unhideGlobalCatalogItem, getHiddenCatalogItems,
//                                   toggleFavoriteCatalogItem, getFavoriteCatalogItemIds, getFavoriteCatalogItems
//   catalog-visibility-actions.ts → shareCategoryWithTeam, updateCatalogItemVisibility

export type { CatalogItem, CatalogItemsResult } from "./catalog-search-actions";

export {
  getCatalogItems,
  getTotalCatalogCount,
  getCategoryItemCounts,
  getCatalogCategories,
  getUserCategoriesCount,
} from "./catalog-search-actions";

export {
  createCatalogItem,
  updateCatalogItem,
  deleteCatalogItem,
  bulkDeleteCatalogItems,
  moveItemToCategory,
  hideGlobalCatalogItem,
  unhideGlobalCatalogItem,
  getHiddenCatalogItems,
  toggleFavoriteCatalogItem,
  getFavoriteCatalogItemIds,
  getFavoriteCatalogItems,
} from "./catalog-item-actions";

export {
  shareCategoryWithTeam,
  updateCatalogItemVisibility,
} from "./catalog-visibility-actions";
