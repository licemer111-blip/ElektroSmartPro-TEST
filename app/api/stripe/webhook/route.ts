import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  handleCheckoutCompleted,
  handleSubscriptionDeleted,
  handleSubscriptionUpdated,
} from "./_handlers/stripe-subscription-handlers";
import {
  handleInvoicePaymentSucceeded,
  generateInvoiceFromCheckoutSession,
} from "./_handlers/stripe-infakt-handlers";

type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

type InvoiceWithRelations = Stripe.Invoice & {
  subscription?: string | { id: string } | null;
  payment_intent?: string | { id: string } | null;
};

/**
 * DB-First: записывает событие как 'pending', обновляет статус после обработки.
 * Возвращает { id, alreadyProcessed } — если alreadyProcessed=true, пропустить.
 */
async function recordBillingEvent(
  event: Stripe.Event,
  stripeObjectId: string | null
): Promise<{ id: string; alreadyProcessed: boolean }> {
  // Atomic INSERT ... ON CONFLICT DO NOTHING — only the first invocation wins.
  // Parallel serverless calls cannot both insert the same stripe_event_id.
  const { error: insertError } = await supabaseAdmin
    .from("billing_events")
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      status: "pending",
      stripe_object_id: stripeObjectId,
      payload: event.data.object as unknown as Record<string, unknown>,
    });

  if (insertError) {
    // Unique violation (23505) = event already being processed by another invocation
    if (insertError.code === "23505" || insertError.message?.includes("duplicate")) {
      // Fetch existing record to check its status
      const { data: existing } = await supabaseAdmin
        .from("billing_events")
        .select("id, status")
        .eq("stripe_event_id", event.id)
        .maybeSingle();

      if (!existing) {
        logger.error("[Webhook] billing_events conflict but no row found:", {}, event.id);
        return { id: "", alreadyProcessed: true };
      }

      const alreadyDone = existing.status === "success" || existing.status === "skipped";
      logger.info("[Webhook] billing_events conflict — event already recorded", {
        eventId: event.id,
        status: existing.status,
        alreadyDone,
      });
      return { id: existing.id, alreadyProcessed: alreadyDone };
    }

    logger.error("[Webhook] Failed to record billing_event:", {}, insertError);
    return { id: "", alreadyProcessed: false };
  }

  // Insert succeeded — fetch the new row id
  const { data: newRow } = await supabaseAdmin
    .from("billing_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  return { id: newRow?.id ?? "", alreadyProcessed: false };
}

async function finalizeBillingEvent(
  eventDbId: string,
  status: "success" | "failed" | "skipped",
  opts?: { userId?: string; infaktInvoiceId?: string; errorMessage?: string }
) {
  if (!eventDbId) return;
  const { error } = await supabaseAdmin
    .from("billing_events")
    .update({
      status,
      user_id: opts?.userId ?? undefined,
      infakt_invoice_id: opts?.infaktInvoiceId ?? undefined,
      error_message: opts?.errorMessage ?? undefined,
    })
    .eq("id", eventDbId);
  if (error) logger.error("[Webhook] Failed to finalize billing_event:", {}, error);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  // Security: reject unsigned requests immediately (only legitimate 400)
  if (!signature) {
    logger.error("[Stripe Webhook] Missing stripe-signature header", {});
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[Stripe Webhook] Signature verification failed:", {}, message);
    // 400 on bad signature — Stripe will NOT retry these
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Extract the primary Stripe object ID for audit trail
  const stripeObjectId =
    ((event.data.object as unknown as Record<string, unknown>)?.id as string | undefined) ?? null;

  // DB-First Step A: record event as 'pending' — idempotency guard
  const { id: eventDbId, alreadyProcessed } = await recordBillingEvent(event, stripeObjectId);
  if (alreadyProcessed) {
    logger.info("[Stripe Webhook] Event already processed — returning 200", { eventId: event.id, type: event.type });
    return NextResponse.json({ received: true, skipped: true });
  }

  // Try-Everything: NEVER return 5xx to Stripe — log internally, always 200
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, generateInvoiceFromCheckoutSession);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as SubscriptionWithPeriod;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as SubscriptionWithPeriod;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "invoice.finalized": {
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as InvoiceWithRelations;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      default:
        await finalizeBillingEvent(eventDbId, "skipped");
        return NextResponse.json({ received: true, skipped: true });
    }

    // DB-First Step C: mark as success
    await finalizeBillingEvent(eventDbId, "success");
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("[Stripe Webhook] Handler error — logged, returning 200 to prevent retry:", { eventId: event.id, type: event.type }, error);

    // DB-First Step C (failure): persist error for manual retry / monitoring
    await finalizeBillingEvent(eventDbId, "failed", { errorMessage: message.slice(0, 500) });

    // CRITICAL: always 200 — prevent Stripe duplicate retries
    return NextResponse.json({ received: true, error: message });
  }
}