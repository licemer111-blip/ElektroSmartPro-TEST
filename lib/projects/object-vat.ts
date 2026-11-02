/** Residential work is 8%. Office, shop and hall stay at 23%. */
export function vatForObjectType(name: string, defaultVat?: number | null): 8 | 23 {
  const n = name.toLowerCase();
  const residential = n.includes("mieszkan") || (n.includes("dom") && !n.includes("biuro") && !n.includes("lokal"));
  if (residential) return 8;
  if (defaultVat === 8) return 8;
  return 23;
}

/** One label per kind of building, even when the database still has old rows. */
export function objectTypeLabel(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("mieszkan") || n.includes("dom")) return "Mieszkanie / Dom";
  if (n.includes("biuro") || n.includes("lokal")) return "Biuro / Lokale";
  if (n.includes("przemys") || n.includes("hala")) return "Przemysł / Hala";
  return name.replace(/\s*\(VAT[^)]*\)/gi, "").trim();
}

export function isEstimateObjectType(name: string): boolean {
  const n = name.toLowerCase();
  return (
    n.includes("mieszkan") || n.includes("dom") ||
    n.includes("biuro") || n.includes("lokal") ||
    n.includes("przemys") || n.includes("hala")
  );
}

/** Keep one row per label. Prefer the canonical slug when duplicates exist. */
export function dedupeObjectTypes<T extends { id: string; name: string; slug?: string | null }>(types: T[]): T[] {
  const preferred = new Set(["mieszkanie", "biuro", "przemysl-hala"]);
  const sorted = [...types].sort((a, b) => {
    const aRank = preferred.has((a.slug || "").toLowerCase()) ? 0 : 1;
    const bRank = preferred.has((b.slug || "").toLowerCase()) ? 0 : 1;
    return aRank - bRank;
  });
  const byLabel = new Map<string, T>();
  for (const type of sorted) {
    if (!isEstimateObjectType(type.name)) continue;
    const label = objectTypeLabel(type.name);
    if (!byLabel.has(label)) byLabel.set(label, type);
  }
  const order = ["Mieszkanie / Dom", "Biuro / Lokale", "Przemysł / Hala"];
  const listed = order.map((label) => byLabel.get(label)).filter((row): row is T => Boolean(row));
  for (const [label, row] of byLabel) {
    if (!order.includes(label)) listed.push(row);
  }
  return listed;
}
