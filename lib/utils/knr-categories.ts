import fs from "fs";
import path from "path";

export interface KnrCategory {
  fileName: string;
  label: string;
  keywords: string[];
  normalizedKey: string;
}

const SKIP_TOKENS = new Set(["es", "knr", "i", "w", "do", "a", "z", "na", "po"]);

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*\(\d{4}\)\s*/g, "")
    .replace(/\.json$/i, "")
    .replace(/[._\-\s,]+/g, "");
}

function labelFromFileName(fileName: string): string {
  const base = fileName
    .replace(/\.json$/i, "")
    .replace(/\s*\(\d{4}\)\s*/g, "")
    .replace(/^es[_-]knr[_-]/i, "")
    .replace(/[-_]/g, " ")
    .trim();

  return base
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
    .slice(0, 40);
}

function keywordsFromFileName(fileName: string): string[] {
  return fileName
    .toLowerCase()
    .replace(/\.json$/i, "")
    .replace(/\s*\(\d{4}\)\s*/g, "")
    .split(/[_\-\s,]+/)
    .filter((k) => k.length > 2 && !SKIP_TOKENS.has(k));
}

let _cache: KnrCategory[] | null = null;

export function getKnrCategories(): KnrCategory[] {
  if (_cache) return _cache;

  const dir = path.join(process.cwd(), "data", "knr", "fixed_norms");
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".json"))
      .sort();

    _cache = files.map((fileName) => ({
      fileName,
      label: labelFromFileName(fileName),
      keywords: keywordsFromFileName(fileName),
      normalizedKey: normalizeForMatch(fileName),
    }));

    return _cache;
  } catch {
    return [];
  }
}

export function isCovered(
  category: KnrCategory,
  bucketFileNames: string[]
): boolean {
  const normalizedBucket = bucketFileNames.map(normalizeForMatch);

  return normalizedBucket.some((bn) => {
    if (bn === category.normalizedKey) return true;
    if (bn.includes(category.normalizedKey)) return true;
    if (category.normalizedKey.includes(bn) && bn.length > 5) return true;
    return category.keywords.some(
      (kw) => kw.length > 3 && bn.includes(kw.replace(/[_\-\s]/g, ""))
    );
  });
}
