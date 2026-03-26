import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { checkEdgeRateLimit } from "@/lib/rate-limit-edge";

const ALLOWED_COUNTRIES = new Set(["PL", "UA", "DE"]);
const GEO_BLOCKED_HTML = `<!DOCTYPE html><html lang="pl"><head><meta charset="utf-8"><title>Niedostępne w Twoim regionie</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc}div{text-align:center;max-width:480px;padding:40px}h1{font-size:2rem;margin-bottom:12px}p{color:#64748b;line-height:1.6}</style></head><body><div><h1>🇵🇱 ElektroSmart PRO</h1><p>Usługa dostępna wyłącznie w Polsce i wybranych krajach Europy.</p><p><em>Service is available in Poland, Ukraine, and Germany only.</em></p></div></body></html>`;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Geofencing: block non-PL/UA/DE on /api/* and /dashboard/* ─────────
  const country = request.headers.get("x-vercel-ip-country");
  const host = request.headers.get("host") ?? "";
  const isLocalhost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("::1");

  if (
    !isLocalhost &&
    country !== null &&
    country !== "" &&
    !ALLOWED_COUNTRIES.has(country) &&
    (pathname.startsWith("/api/") || pathname.startsWith("/dashboard"))
  ) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Service not available in your region." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new NextResponse(GEO_BLOCKED_HTML, {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // ─── Rate limiting for AI and Admin API routes ───────────────────────────
  if (pathname.startsWith("/api/ai/") || pathname.startsWith("/api/admin/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "127.0.0.1";

    const rl = await checkEdgeRateLimit(pathname, ip);
    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Zbyt wiele zapytań. Spróbuj ponownie za chwilę." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rl.retryAfter ?? 60),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError && authError.message !== "Auth session missing!") {
      // auth error handled by redirect below
    }

    // Protected routes - redirect to login if not authenticated
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
      // Use absolute URL with origin to avoid 404 loops on mobile
      const loginUrl = new URL("/login", request.nextUrl.origin);
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);

      return NextResponse.redirect(loginUrl);
    }

    // If user is logged in and tries to access login page, redirect to dashboard
    if (user && request.nextUrl.pathname === "/login") {
      // Use absolute URL with origin
      const dashboardUrl = new URL("/dashboard", request.nextUrl.origin);
      return NextResponse.redirect(dashboardUrl);
    }

    return response;
  } catch {
    // In case of error, allow the request to proceed
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml (SEO sitemap)
     * - robots.txt (SEO robots)
     * - manifest.webmanifest (PWA manifest)
     * - public folder assets
     * - api routes (webhooks, billing etc. — no user session available)
     * - /api/ai/* and /api/admin/* for rate limiting
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/(?!ai/|admin/)).*)",
  ],
};
