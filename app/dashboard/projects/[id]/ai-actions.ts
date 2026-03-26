// ═══════════════════════════════════════════════════════════════════
// ai-actions.ts — Orchestrator stub (backwards-compatible public API)
// All logic decomposed into _ai_actions/:
//   utils.ts      — guards, admin client, shared interfaces
//   analysis.ts   — categorize, price anomaly, fill RBH norms
//   pricing.ts    — estimate prices, apply AI prices
//   generation.ts — generate items, generate panel config
// ═══════════════════════════════════════════════════════════════════

export * from "./_ai_actions";
