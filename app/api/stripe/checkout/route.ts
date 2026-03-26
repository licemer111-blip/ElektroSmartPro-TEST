import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── Production-ready env check ──────────────────────────────────────────────
// Runs once at module load time (server startup). Logs warnings — never throws,
// so a missing optional key (e.g. INFAKT) doesn't break the checkout route.
const REQUIRED_STRIPE_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_BASE_URL",
] as const;

for (const key of REQUIRED_STRIPE_VARS) {
  if (!process.env[key]) {
    logger.error(`[Stripe] Missing required env var: ${key}`, {});
  }
}

const baseUrlCheck = process.env.NEXT_PUBLIC_BASE_URL ?? "";
if (baseUrlCheck.includes("localhost") && process.env.NODE_ENV === "production") {
  logger.error("[Stripe] NEXT_PUBLIC_BASE_URL points to localhost in production! success_url/cancel_url will be broken.", {});
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for PRO subscription
 * WITH AUTOMATIC TAX (Poland VAT registration) and NIP collection
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("[Stripe Checkout] Authentication failed:", {}, authError);
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Parse request body for plan selection
    const body = await request.json().catch(() => ({}));
    const { plan = "month" } = body;

    // 1. Define Net Prices in Grosze (Cents) - BEFORE TAX
    // Stripe automatic_tax will add VAT on top of these amounts
    const PRICES = {
      month: 15900,  // 159.00 PLN net (+ VAT = ~195.57 PLN gross with 23%)
      year: 159000,  // 1590.00 PLN net (+ VAT = ~1955.70 PLN gross with 23%)
    };

    // 2. Determine Amount & Product Name based on Plan
    const isYearly = plan === "year";
    const unitAmount = isYearly ? PRICES.year : PRICES.month;
    const productName = isYearly ? "ElektroSmart PRO (Roczny)" : "ElektroSmart PRO (Miesięczny)";

    // 3. Get or Create Stripe Customer (needed for customer_update)
    let stripeCustomerId: string | null = null;

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, full_name, company_name, nip")
      .eq("id", user.id)
      .single();

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
      logger.info("[Stripe Checkout] Using existing customer:", { stripeCustomerId });
    } else {
      // Only create if truly null — no duplicate customers
      logger.info("[Stripe Checkout] No customer in profile — creating new Stripe customer", { userId: user.id, email: user.email });
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: profile?.company_name || profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;
      logger.info("[Stripe Checkout] Created Stripe customer:", { stripeCustomerId });

      // Persist immediately so next checkout reuses it
      const { error: saveErr } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
      if (saveErr) logger.error("[Stripe Checkout] Failed to save stripe_customer_id:", {}, saveErr);
    }

    // CRITICAL GUARD: do not start session without a confirmed customer ID
    if (!stripeCustomerId) {
      logger.error("[Stripe Checkout] ABORT — stripeCustomerId is null, cannot create session", { userId: user.id });
      return NextResponse.json({ error: "Nie można zainicjować płatności. Spróbuj ponownie." }, { status: 500 });
    }

    // Get base URL for redirects
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "https://elektrosmart.pro").replace(/\/$/, "");

    logger.info("[Stripe Checkout] Using Customer ID for session:", { stripeCustomerId, userId: user.id, plan });

    // 4. Create Stripe Checkout Session with automatic_tax
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      
      // ✅ Use existing Stripe customer (required for customer_update)
      // CRITICAL: do NOT set customer_email when customer ID is present — avoids guest checkout
      customer: stripeCustomerId ?? undefined,

      // ✅ Save payment method to customer profile for future portal use
      payment_method_collection: "always",

      // ✅ AUTOMATIC TAX - Uses Poland VAT registration (Collecting status)
      // Stripe will automatically calculate and apply correct VAT rate (23%)
      automatic_tax: {
        enabled: true,
      },

      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: {
              name: productName,
              description: "Pełny dostęp do funkcji PRO, Eksport PDF, Baza Cen, AI Lab",
              // Tax code for digital services (helps Stripe determine correct VAT)
              tax_code: "txcd_10000000", // General - Electronically Supplied Services
            },
            unit_amount: unitAmount, // Net price - VAT will be added automatically
            recurring: {
              interval: plan === "year" ? "year" : "month",
            },
          },
          quantity: 1,
          // ❌ NO tax_rates here - automatic_tax handles it
        },
      ],
      
      metadata: {
        userId: user.id,
        userEmail: user.email || "",
        plan: plan,
      },
      
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/dashboard/subscription?canceled=true`,
      allow_promotion_codes: true,

      // ✅ BILLING ADDRESS - Required for legal invoices
      billing_address_collection: "required",

      // ✅ TAX ID COLLECTION - Shows NIP field when customer selects "I'm a business"
      tax_id_collection: {
        enabled: true,
      },

      // ✅ CUSTOMER UPDATE - Saves address & tax ID to Stripe customer profile
      customer_update: {
        address: "auto",      // Save billing address to customer
        name: "auto",         // Save name to customer
      },

      // ✅ SUBSCRIPTION DATA - Saves payment method to customer for portal use
      subscription_data: {
        metadata: {
          userId: user.id,
          userEmail: user.email || "",
        },
      },
    });

    // Return checkout URL
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: unknown) {
    logger.error("[Stripe Checkout] Error:", {}, error);

    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
