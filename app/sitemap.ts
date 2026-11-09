import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BLOG_POSTS } from "@/lib/blog-posts";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://elektrosmart.pro";
  const now = new Date();

  // ── 1. Statyczne strony ────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl,                           lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${baseUrl}/login`,                lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/o-nas`,                lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/kontakt`,              lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/katalog`,              lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${baseUrl}/polityka-prywatnosci`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/regulamin`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  // ── 2. Blog posts (hardcoded slugs) ───────────────────────────────────────
  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
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
