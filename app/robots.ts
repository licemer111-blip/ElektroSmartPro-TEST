import { MetadataRoute } from "next";

/**
 * Public pages are indexed. The estimate, admin and a client's offer link are not.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://elektrosmart.pro";

  const disallow = [
    "/api/",
    "/dashboard/",
    "/admin/",
    "/auth/",
    "/reset-password",
    "/offline",
    "/offer/",
  ];

  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow },
      { userAgent: "*", allow: "/", disallow },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
