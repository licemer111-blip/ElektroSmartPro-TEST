import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type Stripe from "stripe";

type SessionLineItem = NonNullable<Stripe.Checkout.SessionCreateParams["line_items"]>[number];

/**
 * POST /api/billing/gateway
 * Creates a Stripe Checkout session for PRO subscription.
 * Route name avoids "stripe/checkout" keyword patterns used by AdBlockers.
 * No client-side Stripe JS required — returns session.url for direct redirect.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      billingCycle = "monthly",
      vatRate = 23,
      isTest = false,
    }: { billingCycle?: "monthly" | "yearly"; vatRate?: 8 | 23; isTest?: boolean } = body;

    const isYearly = billingCycle === "yearly";

    // Resolve Price ID — prefer env-configured Stripe Price IDs (recurring prices),
    // fall back to price_data with hardcoded amounts.
    const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY_ID;
    const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY_ID;

    const resolvedPriceId = isYearly ? yearlyPriceId : monthlyPriceId;

    // Resolve optional manual tax rate IDs (8% or 23% VAT)
    const taxRate8Id = process.env.STRIPE_TAX_RATE_8_ID;
    const taxRate23Id = process.env.STRIPE_TAX_RATE_23_ID;
    const defaultTaxRates: string[] = [];
    if (vatRate === 8 && taxRate8Id) {
      defaultTaxRates.push(taxRate8Id);
    } else if (vatRate === 23 && taxRate23Id) {
      defaultTaxRates.push(taxRate23Id);
    }

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "") || "https://elektrosmart.pro";
    const successUrl = new URL("/dashboard?success=true", baseUrl).toString();
    const cancelUrl = new URL("/dashboard/subscription?canceled=true", baseUrl).toString();

    // Get or create Stripe Customer
    let stripeCustomerId: string | null = null;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, full_name, company_name, nip")
      .eq("id", user.id)
      .single();

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
      logger.info("[Billing] Using existing Stripe customer:", { stripeCustomerId });
    } else {
      logger.info("[Billing] No customer in profile — creating new", { userId: user.id, email: user.email });
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: profile?.company_name || profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;
      logger.info("[Billing] Created new Stripe customer:", { stripeCustomerId });
      const { error: saveErr } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
      if (saveErr) logger.error("[Billing] WARN: failed to save stripe_customer_id:", {}, saveErr);
    }

    // HARD GUARD: never open checkout without a confirmed customer ID
    if (!stripeCustomerId) {
      logger.error("[Billing] ABORT — stripeCustomerId is null, refusing to create session", { userId: user.id });
      return NextResponse.json({ error: "Nie można zainicjować płatności. Spróbuj ponownie." }, { status: 500 });
    }

    // Build line item — use Price ID when available, otherwise inline price_data
    // isTest: override with 1 PLN test product (ignores real price IDs)
    let lineItems: SessionLineItem[];

    if (isTest) {
      // Test session: subscription mode (1 PLN/month) — enables full Portal features
      const testItem: SessionLineItem = {
        price_data: {
          currency: "pln",
          product_data: {
            name: "[TEST] ElektroSmart PRO — weryfikacja webhook",
            description: "Testowa subskrypcja 1 PLN/mies. — sprawdzenie inFakt + Resend + Portal",
          },
          unit_amount: 200, // 2.00 PLN net recurring (Stripe min ~2 PLN)
          recurring: { interval: "month" },
        },
        quantity: 1,
      };
      if (defaultTaxRates.length > 0) testItem.tax_rates = defaultTaxRates;
      lineItems = [testItem];

      logger.info("[Billing] Creating TEST subscription session for CUSTOMER ID:", { stripeCustomerId, userId: user.id });
      const testSession = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: stripeCustomerId,
        payment_method_collection: "always",
        line_items: lineItems,
        metadata: {
          userId: user.id,
          userEmail: user.email || "",
          billingCycle: "monthly",
          vatRate: String(vatRate),
          isTest: "true",
        },
        subscription_data: {
          metadata: { userId: user.id, userEmail: user.email || "", isTest: "true" },
        },
        success_url: new URL("/dashboard?test_payment=success", baseUrl).toString(),
        cancel_url: new URL("/dashboard/subscription?canceled=true", baseUrl).toString(),
        locale: "pl",
        billing_address_collection: "required",
        tax_id_collection: { enabled: true },
        customer_update: { address: "auto", name: "auto" },
      });

      if (!testSession.url) {
        return NextResponse.json(
          { error: "Stripe nie zwrócił adresu płatności testowej.", details: `session.id=${testSession.id} url=null` },
          { status: 500 }
        );
      }
      return NextResponse.json({ url: testSession.url, sessionId: testSession.id });
    } else if (resolvedPriceId) {
      const item: SessionLineItem = {
        price: resolvedPriceId,
        quantity: 1,
      };
      if (defaultTaxRates.length > 0) item.tax_rates = defaultTaxRates;
      lineItems = [item];
    } else {
      const unitAmount = isYearly ? 159000 : 15900;
      const productName = isYearly
        ? "ElektroSmart PRO (Roczny)"
        : "ElektroSmart PRO (Miesięczny)";
      const item: SessionLineItem = {
        price_data: {
          currency: "pln",
          product_data: {
            name: productName,
            description: "Pełny dostęp do funkcji PRO, Eksport PDF, Baza Cen, AI Lab",
            tax_code: "txcd_10000000",
          },
          unit_amount: unitAmount,
          recurring: { interval: isYearly ? "year" : "month" },
        },
        quantity: 1,
      };
      if (defaultTaxRates.length > 0) item.tax_rates = defaultTaxRates;
      lineItems = [item];
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      // CRITICAL: always pass confirmed customer ID — never pass customer_email alongside customer
      customer: stripeCustomerId,
      payment_method_collection: "always",
      line_items: lineItems,
      metadata: {
        userId: user.id,
        userEmail: user.email || "",
        billingCycle,
        vatRate: String(vatRate),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: "pl",
      allow_promotion_codes: true,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { address: "auto", name: "auto" },
      subscription_data: {
        metadata: { userId: user.id, userEmail: user.email || "" },
      },
    };

    logger.info("[Billing] Creating session for CUSTOMER ID:", { stripeCustomerId, userId: user.id, billingCycle, vatRate });
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      logger.error("[Billing Gateway] session.url is null", { sessionId: session.id, sessionParams });
      return NextResponse.json(
        { error: "Stripe nie zwrócił adresu płatności.", details: `session.id=${session.id} url=null` },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    logger.error("[Billing Gateway] Error:", {}, error);
    return NextResponse.json(
      {
        error: "Nie udało się zainicjować płatności. Spróbuj ponownie.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
