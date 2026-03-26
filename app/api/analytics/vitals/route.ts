import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Endpoint for collecting Web Vitals metrics from the client.
 * 
 * In production, this data can be forwarded to:
 * - Supabase (analytics table)
 * - Vercel Analytics (automatic)
 * - Custom dashboard
 * 
 * For now, we log structured metrics for Vercel's log aggregation.
 */
export async function POST(request: Request) {
  try {
    const metric = await request.json();

    // Structured log for aggregation
    logger.info("web-vital", {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      page: metric.page,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
