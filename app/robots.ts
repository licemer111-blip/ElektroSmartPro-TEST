import { MetadataRoute } from "next";

/**
 * Robots.txt for ElektroSmart PRO
 * Guides search engine crawlers on which pages to index.
 * 
 * Public pages: /, /login, /o-nas, /kontakt, /blog, /offer/*, legal pages
 * Blocked: /api/, /dashboard/, /admin/, /reset-password, /_next/, /offline
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://elektrosmart.pro";

  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/login",
          "/o-nas",
          "/kontakt",
          "/blog",
          "/blog/",
          "/katalog",
          "/katalog/",
          "/offer/",
          "/polityka-prywatnosci",
          "/regulamin",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/reset-password",
          "/_next/",
          "/offline",
        ],
      },
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/o-nas",
          "/kontakt",
          "/blog",
          "/blog/",
          "/katalog",
          "/katalog/",
          "/offer/",
          "/polityka-prywatnosci",
          "/regulamin",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/reset-password",
          "/_next/",
          "/offline",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
