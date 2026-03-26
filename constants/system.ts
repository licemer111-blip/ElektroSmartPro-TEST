/**
 * System-wide fallback constants.
 * Used when DB is unreachable (build time, SSG, edge cache miss).
 * Update these after each major data migration.
 */
export const SYSTEM_STATS_FALLBACK = {
  normsCount: 8000,
  categoriesCount: 32,
  normsLabel: "8 000",
  normsLabelRounded: "ponad 8000",
  normsLabelPlus: "8000+",
  categoriesLabel: "32",
} as const;
