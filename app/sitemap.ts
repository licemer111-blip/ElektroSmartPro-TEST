import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * SEO-Захват 2026 — Dynamic Sitemap for ElektroSmart PRO
 *
 * Structure:
 *   1.0  — Strona główna
 *   0.9  — Strony kategorii (SEO landing /katalog/[category])
 *   0.8  — Blog posts, Rejestracja
 *   0.7  — Strony informacyjne (o-nas, kontakt, login)
 *   0.3  — Strony prawne
 *
 * Data sources:
 *   - Static: hardcoded public routes
 *   - Dynamic: 63 categories from es_dictionary (Supabase)
 *   - Blog: hardcoded slugs (no blog_posts table yet)
 */

export const revalidate = 86400; // Revalidate sitemap every 24 hours

// Blog slugs are hardcoded (no blog_posts table in DB)
const BLOG_SLUGS: { slug: string; date: string }[] = [
  { slug: "jak-wycenic-instalacje-2026",          date: "2026-01-08" },
  { slug: "vat-8-czy-23-przewodnik",               date: "2026-01-10" },
  { slug: "wspolpraca-zespolowa-real-time",        date: "2026-01-20" },
  { slug: "co-pilot-audio-sterowanie-glosem",      date: "2026-01-28" },
  { slug: "automatyczne-faktury-infakt",           date: "2026-02-03" },
  { slug: "import-knr-excel-ai-lab",               date: "2026-02-05" },
  { slug: "profesjonalny-kosztorys-pdf",           date: "2026-01-05" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://elektrosmart.pro";
  const now = new Date();

  // ── 1. Statyczne strony ────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                                    lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${baseUrl}/login`,                         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/login?tab=signup`,              lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/o-nas`,                         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/kontakt`,                       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`,                          lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${baseUrl}/polityka-prywatnosci`,          lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/regulamin`,                     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  // ── 2. Blog posts (hardcoded slugs) ───────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map(({ slug, date }) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // ── 3. Dynamiczne strony kategorii z Supabase ─────────────────────────────
  // /katalog/[category] — SEO landing pages for each work category
  // Priority 0.9 — these are the main organic traffic drivers
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("es_dictionary")
      .select("category")
      .not("category", "is", null)
      .order("category");

    if (!error && data) {
      const uniqueCategories = Array.from(
        new Set(data.map((row: { category: string }) => row.category).filter(Boolean))
      ) as string[];

      categoryPages = uniqueCategories.map((cat) => ({
        url: `${baseUrl}/katalog/${cat}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }));
    }
  } catch {
    // Graceful fallback — sitemap still works without category pages
  }

  return [...staticPages, ...blogPages, ...categoryPages];
}
