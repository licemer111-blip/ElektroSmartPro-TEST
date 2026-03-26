import { describe, it, expect } from "vitest";
import { cn, normalizePolish, searchComparator } from "@/lib/utils";

// ============================================
// cn (class name merge)
// ============================================

describe("cn", () => {
  it("merges basic class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("deduplicates Tailwind classes", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty call", () => {
    expect(cn()).toBe("");
  });
});

// ============================================
// normalizePolish
// ============================================

describe("normalizePolish", () => {
  it("removes Polish diacritics", () => {
    expect(normalizePolish("Łącznik")).toBe("lacznik");
    expect(normalizePolish("Ręczny")).toBe("reczny");
    expect(normalizePolish("Puszka pożarowa")).toBe("puszka pozarowa");
    expect(normalizePolish("Gniazdo")).toBe("gniazdo");
  });

  it("converts to lowercase", () => {
    expect(normalizePolish("KABEL")).toBe("kabel");
    expect(normalizePolish("Wyłącznik")).toBe("wylacznik");
  });

  it("handles all Polish special characters", () => {
    expect(normalizePolish("ąćęłńóśźż")).toBe("acelnoszz");
    expect(normalizePolish("ĄĆĘŁŃÓŚŹŻ")).toBe("acelnoszz");
  });

  it("handles null and undefined", () => {
    expect(normalizePolish(null)).toBe("");
    expect(normalizePolish(undefined)).toBe("");
    expect(normalizePolish("")).toBe("");
  });

  it("preserves non-Polish characters", () => {
    expect(normalizePolish("test 123")).toBe("test 123");
    expect(normalizePolish("kabel-3x2.5mm²")).toBe("kabel-3x2.5mm²");
  });
});

// ============================================
// searchComparator
// ============================================

describe("searchComparator", () => {
  it("prioritizes exact match", () => {
    expect(searchComparator("kabel", "kabel", "kabel ydy")).toBe(-1);
    expect(searchComparator("kabel", "kabel ydy", "kabel")).toBe(1);
  });

  it("prioritizes starts-with over contains", () => {
    expect(searchComparator("kab", "kabel", "skrzynka kablowa")).toBe(-1);
    expect(searchComparator("kab", "skrzynka kablowa", "kabel")).toBe(1);
  });

  it("falls back to alphabetical for equal relevance", () => {
    // Both contain "kab" but neither starts with it
    const result = searchComparator("kab", "uchwyt kablowy", "skrzynka kablowa");
    // Alphabetical: "skrzynka" < "uchwyt"
    expect(result).toBeGreaterThan(0);
  });

  it("is case insensitive", () => {
    expect(searchComparator("KABEL", "kabel", "xyz")).toBe(-1);
    expect(searchComparator("kabel", "KABEL", "xyz")).toBe(-1);
  });
});
