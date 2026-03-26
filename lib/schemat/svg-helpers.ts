// ═══════════════════════════════════════════════════════════════════
// Schemat SVG Helpers
// Responsible for: SVG string utilities, XML escaping, text truncation,
// and combining multi-page SVG output into a single document.
// ═══════════════════════════════════════════════════════════════════

import type { PageResult } from "../schemat-svg-types";

// ── Re-export from SSOT ──
export { esc, truncate } from "../schemat-svg-types";

/**
 * Combines multiple SVG page results into a single vertically-stacked SVG document.
 * Compatible with PDF/DXF export consumers (panel-schemat-tab.tsx).
 */
export function combinePagesToSvg(pages: PageResult[]): string {
  if (pages.length === 0) return "";
  const GAP = 20;
  const maxW = Math.max(...pages.map((p) => p.w));
  let totalH = 0;
  const combined: string[] = [];
  for (const page of pages) {
    combined.push(`<g transform="translate(0, ${totalH})">${page.svg}</g>`);
    totalH += page.h + GAP;
  }
  totalH -= GAP;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxW} ${totalH}" width="${maxW}" height="${totalH}" style="font-family: 'Segoe UI', system-ui, sans-serif">${combined.join("")}</svg>`;
}
