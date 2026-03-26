"use client";

import { useReportWebVitals } from "next/web-vitals";
import { usePathname } from "next/navigation";

/**
 * Web Vitals reporter.
 * 
 * Collects Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP) and reports them.
 * In production: sends to /api/analytics/vitals endpoint for aggregation.
 * In development: logs to console for debugging.
 * 
 * Metrics:
 * - LCP (Largest Contentful Paint): <2.5s = good
 * - FID (First Input Delay): <100ms = good  
 * - CLS (Cumulative Layout Shift): <0.1 = good
 * - FCP (First Contentful Paint): <1.8s = good
 * - TTFB (Time to First Byte): <800ms = good
 * - INP (Interaction to Next Paint): <200ms = good
 */
export function WebVitals() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    const { name, value, rating, id } = metric;

    // In development, log to console
    if (process.env.NODE_ENV === "development") {
      const emoji = rating === "good" ? "🟢" : rating === "needs-improvement" ? "🟡" : "🔴";
      console.debug(`${emoji} ${name}: ${Math.round(value)}${name === "CLS" ? "" : "ms"} (${rating})`);
    }

    // In production, send to analytics endpoint (non-blocking)
    if (process.env.NODE_ENV === "production" && typeof navigator !== "undefined" && "sendBeacon" in navigator) {
      const body = JSON.stringify({
        name,
        value: Math.round(value * 100) / 100,
        rating,
        id,
        page: pathname,
        timestamp: Date.now(),
      });
      navigator.sendBeacon("/api/analytics/vitals", body);
    }
  });

  return null;
}
