import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkRateLimit } from "@/lib/rate-limit";
import { PAY_PER_EXPORT_PRICE_PLN } from "@/lib/config/tier-limits";

/**
 * POST /api/billing/pay-per-export
 *
 * v2.0 Freemium monetization path #2 — users who don't want to subscribe
 * can pay {PAY_PER_EXPORT_PRICE_PLN} PLN once to unlock a single clean PDF
 * export of a specific project.
 *
 * Flow:
 *   1. Client POSTs { projectId }
 *   2. We verify the user owns the project (RLS handles this via user session)
 *   3. We create a Stripe Checkout Session in `mode: "payment"` (one-time)
 *      with metadata.type = "pay_per_export" and metadata.projectId
 *   4. User is redirected to Stripe's hosted checkout
 *   5. On payment success, webhook (stripe-subscription-handlers.ts) writes
 *      projects.paid_export_unlocked_at = now() for that specific project
 *   6. Next PDF export for the project is rendered without DEMO watermark
 *      and clears the flag (one-shot unlock).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Musisz być zalogowany." }, { status: 401 });
    }

    // Rate limit: 10 attempts per 5 min per user (abuse guard on payment creation).
    const rl = checkRateLimit({ key: `ppe:${user.id}`, limit: 10, windowMs: 5 * 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Zbyt wiele prób. Spróbuj ponownie za kilka minut." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rl.retryAfterMs ?? 60_000) / 1000)) } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { projectId } = body as { projectId?: string };

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Brak identyfikatora projektu." }, { status: 400 });
    }

    // Verify project exists and the authenticated user owns it.
    // NOTE: uses the user-scoped client so RLS filters automatically.
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, user_id, paid_export_unlocked_at")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json(
        { error: "Nie znaleziono projektu lub nie masz do niego dostępu." },
        { status: 404 }
      );
    }

    // Idempotency: if the unlock is already active, don't charge again.
    if (project.paid_export_unlocked_at) {
      return NextResponse.json(
        {
          alreadyUnlocked: true,
          message: "Ten projekt ma już opłacony eksport. Wygeneruj PDF, aby go wykorzystać.",
        },
        { status: 200 }
      );
    }

    // Resolve / create Stripe customer — reuse existing one if profile already has it.
    let stripeCustomerId: string | null = null;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, full_name, company_name")
      .eq("id", user.id)
      .single();

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: profile?.company_name || profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;
      const { error: saveErr } = await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);
      if (saveErr) logger.error("[PayPerExport] Failed to save stripe_customer_id:", {}, saveErr);
    }

    if (!stripeCustomerId) {
      logger.error("[PayPerExport] stripeCustomerId is null — aborting", { userId: user.id, projectId });
      return NextResponse.json(
        { error: "Nie można zainicjować płatności. Spróbuj ponownie." },
        { status: 500 }
      );
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "https://elektrosmart.pro"
    ).replace(/\/$/, "");

    // Amount in grosze (net). Stripe automatic_tax will add 23% VAT on top.
    const unitAmountNet = PAY_PER_EXPORT_PRICE_PLN * 100;
    const projectNameSafe = String(project.name || "").slice(0, 80) || "Projekt";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "blik", "p24"],
      customer: stripeCustomerId,
      locale: "pl",
      line_items: [
        {
          price_data: {
            currency: "pln",
            product_data: {
              name: `Czysty PDF — ${projectNameSafe}`,
              description:
                "Jednorazowy eksport PDF ElektroSmart PRO bez znaku wodnego „DEMO”. " +
                "Odblokowuje następny eksport kosztorysu tego konkretnego projektu.",
              tax_code: "txcd_10000000", // Electronically Supplied Services
            },
            unit_amount: unitAmountNet,
          },
          quantity: 1,
        },
      ],
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { address: "auto", name: "auto" },

      // CRITICAL: metadata is what lets the webhook distinguish this from
      // PRO test-payment / subscription flows.
      metadata: {
        type: "pay_per_export",
        userId: user.id,
        userEmail: user.email || "",
        projectId: project.id,
        projectName: projectNameSafe,
      },
      payment_intent_data: {
        metadata: {
          type: "pay_per_export",
          userId: user.id,
          projectId: project.id,
        },
      },

      success_url: `${baseUrl}/dashboard/projects/${project.id}?ppe=success`,
      cancel_url: `${baseUrl}/dashboard/projects/${project.id}?ppe=canceled`,
    });

    if (!session.url) {
      logger.error("[PayPerExport] Stripe returned null URL", { sessionId: session.id });
      return NextResponse.json(
        { error: "Stripe nie zwrócił adresu płatności." },
        { status: 500 }
      );
    }

    logger.info("[PayPerExport] Created checkout session", {
      sessionId: session.id,
      userId: user.id,
      projectId: project.id,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    logger.error("[PayPerExport] Error:", {}, error);
    return NextResponse.json(
      {
        error: "Nie udało się zainicjować płatności. Spróbuj ponownie.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
