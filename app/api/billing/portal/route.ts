import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session.
 * Route name avoids "stripe/portal" keyword patterns used by AdBlockers.
 */
export async function POST(req: NextRequest) {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://elektrosmart.pro").replace(/\/$/, "");

  try {
    // Primary: cookie-based session (works in most cases)
    const supabase = await createClient();
    let { data: { user }, error: authError } = await supabase.auth.getUser();

    // Fallback: Authorization: Bearer <token> header (when cookies not forwarded)
    if (!user || authError) {
      const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
      const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (token) {
        const { data: tokenData, error: tokenErr } = await supabaseAdmin.auth.getUser(token);
        if (!tokenErr && tokenData.user) {
          user = tokenData.user;
          authError = null;
          logger.error("[Billing Portal] Auth via Bearer token", { userId: user.id });
        }
      }
    }

    logger.error("[Billing Portal] Auth result:", { userId: user?.id, authError: authError?.message ?? null });

    if (!user) {
      return NextResponse.json(
        { error: "Sesja wygasła. Zaloguj się ponownie." },
        { status: 401 }
      );
    }

    // Use supabaseAdmin to bypass RLS on profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    logger.error("[Billing Portal] Profile lookup:", { userId: user.id, userEmail: user.email, profileError: profileError?.message, stripe_customer_id: profile?.stripe_customer_id, profileEmail: profile?.email });

    if (profileError) {
      return NextResponse.json({ error: "Błąd pobierania profilu." }, { status: 500 });
    }

    let customerId = profile?.stripe_customer_id ?? null;

    // Fallback: search Stripe customers by email if no customer ID saved
    if (!customerId) {
      const email = profile?.email || user.email;
      logger.error("[Billing Portal] No customer ID — searching Stripe by email:", { email });
      if (email) {
        const existing = await stripe.customers.list({ email, limit: 1 });
        logger.error("[Billing Portal] Stripe customers found:", { count: existing.data.length, ids: existing.data.map(c => c.id) });
        if (existing.data.length > 0) {
          customerId = existing.data[0].id;
          // Save for future use via admin client (bypasses RLS)
          const { error: updateErr } = await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
          if (updateErr) logger.error("[Billing Portal] Failed to save stripe_customer_id:", {}, updateErr);
          logger.error("[Billing Portal] Recovered stripe_customer_id by email", { email, customerId });
        }
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Nie znaleziono konta płatności. Skontaktuj się z supportem pod adresem kontakt@elektrosmart.pro" },
        { status: 404 }
      );
    }

    const returnUrl = `${baseUrl}/dashboard/subscription`;
    if (!returnUrl.startsWith("http")) {
      throw new Error(`[Billing Portal] Invalid returnUrl: "${returnUrl}"`);
    }
    logger.error("[Billing Portal] Creating session:", { customerId, returnUrl });

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    logger.error("[Billing Portal] Error:", {}, error);

    const rawMessage = error instanceof Error ? error.message : "";
    let clientMessage = "Nie udało się otworzyć panelu płatności. Spróbuj ponownie.";

    if (rawMessage.includes("configure your customer portal")) {
      clientMessage = "Portal płatności wymaga konfiguracji w panelu Stripe. Skontaktuj się z administratorem.";
    } else if (rawMessage.includes("No such customer")) {
      clientMessage = "Nie znaleziono konta płatności. Skontaktuj się z supportem.";
    } else if (rawMessage.includes("Invalid API Key") || rawMessage.includes("No API key")) {
      clientMessage = "Błąd konfiguracji systemu płatności. Skontaktuj się z administratorem.";
    }

    return NextResponse.json(
      { error: clientMessage, details: rawMessage || "Unknown error" },
      { status: 500 }
    );
  }
}
