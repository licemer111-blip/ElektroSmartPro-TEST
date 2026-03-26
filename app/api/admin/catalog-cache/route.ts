/**
 * Admin API: Catalog Cache Management (Tier 3 RAG)
 *
 * POST   /api/admin/catalog-cache  — Export catalog to .txt + rebuild Gemini cache
 * GET    /api/admin/catalog-cache  — Status of current catalog cache
 *
 * Protected by ADMIN_SECRET header.
 * Designed to be called by a cron job every 24h (e.g., Vercel Cron).
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { rebuildCatalogCache, getCatalogCacheStatus } from "@/server/services/catalog-context.service";
import { isGoogleAIConfigured } from "@/lib/google-ai";

function isAuthorized(req: NextRequest): boolean {
  const secret = req.headers.get("x-admin-secret");
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  return secret === expected;
}

// ─── GET — Status ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getCatalogCacheStatus();
    return NextResponse.json({ success: true, status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ─── POST — Rebuild catalog cache ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGoogleAIConfigured()) {
    return NextResponse.json(
      { error: "GOOGLE_AI_API_KEY is not configured" },
      { status: 503 }
    );
  }

  try {
    const { cacheName, itemCount } = await rebuildCatalogCache();
    return NextResponse.json({
      success: true,
      cacheName,
      itemCount,
      message: `Catalog cache rebuilt: ${itemCount} items exported`,
    });
  } catch (error) {
    logger.error("[catalog-cache POST]", {}, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rebuild failed" },
      { status: 500 }
    );
  }
}
