import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type Stripe from "stripe";

type SubscriptionWithPeriod = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  generateInvoiceFn: (userId: string, session: Stripe.Checkout.Session) => Promise<void>
) {
  const userId = session.metadata?.userId;

  if (!userId) {
    logger.error("[Stripe Webhook] Missing userId in session metadata", {});
    throw new Error("Missing userId in session metadata");
  }

  // v2.0 Pay-per-Export: one-time payment that unlocks a single clean PDF
  // for a specific project. Distinguished from PRO test-payment by
  // metadata.type === "pay_per_export".
  if (session.mode === "payment" && session.metadata?.type === "pay_per_export") {
    const projectId = session.metadata?.projectId;
    if (!projectId) {
      logger.error("[Stripe Webhook] pay_per_export session missing projectId", { sessionId: session.id, userId });
      throw new Error("pay_per_export session missing projectId in metadata");
    }

    // Atomic unlock: set `paid_export_unlocked_at = now()`, but ONLY if the
    // project belongs to this user AND isn't already unlocked. This prevents
    // cross-user exploits via crafted metadata.
    const nowIso = new Date().toISOString();
    const { data: updated, error: unlockErr } = await supabaseAdmin
      .from("projects")
      .update({ paid_export_unlocked_at: nowIso })
      .eq("id", projectId)
      .eq("user_id", userId)
      .is("paid_export_unlocked_at", null)
      .select("id")
      .maybeSingle();

    if (unlockErr) {
      logger.error("[Stripe Webhook] pay_per_export: DB unlock failed", { projectId, userId }, unlockErr);
      throw new Error(`pay_per_export DB unlock failed: ${unlockErr.message}`);
    }

    if (!updated) {
      // Either project not owned by user OR already unlocked — log but don't throw
      // so the webhook is marked as processed (Stripe has already charged the user).
      logger.error(
        "[Stripe Webhook] pay_per_export: no-op (wrong owner or already unlocked)",
        { projectId, userId, sessionId: session.id }
      );
    } else {
      logger.info("[Stripe Webhook] pay_per_export: unlocked project", {
        projectId,
        userId,
        sessionId: session.id,
      });
    }

    // Generate InFakt invoice for the 29 PLN charge (no PRO activation).
    await generateInvoiceFn(userId, session);
    return;
  }

  // payment mode ONLY (mode strictly === "payment", not subscription).
  // isTestPayment flag does NOT determine the branch — session.mode does.
  // For mode=subscription, invoice.payment_succeeded handles InFakt regardless of isTest.
  // Calling generateInvoiceFn here for subscription mode = DUPLICATE invoice.
  if (session.mode === "payment") {
    logger.info("[Stripe Webhook] Test payment session — activating PRO manually", { sessionId: session.id, userId });
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    // Resolve stripe_customer_id: session.customer may be null for guest checkouts
    let stripeCustomerId = (session.customer as string) || null;
    if (!stripeCustomerId) {
      const email = session.customer_details?.email || session.metadata?.userEmail;
      if (email) {
        // Try to find existing Stripe customer by email, otherwise create one
        const existing = await stripe.customers.list({ email, limit: 1 });
        if (existing.data.length > 0) {
          stripeCustomerId = existing.data[0].id;
          logger.error("[Stripe Webhook] Test: recovered customer by email", { email, customerId: stripeCustomerId });
        } else {
          const created = await stripe.customers.create({ email, metadata: { userId } });
          stripeCustomerId = created.id;
          logger.error("[Stripe Webhook] Test: created new Stripe customer", { email, customerId: stripeCustomerId });
        }
      }
    }

    const { error: testUpdateError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          is_pro: true,
          max_projects: 999,
          stripe_customer_id: stripeCustomerId ?? undefined,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
          updated_at: now.toISOString(),
        },
        { onConflict: "id" }
      );

    if (testUpdateError) {
      logger.error("[Stripe Webhook] Test: Failed to activate PRO:", {}, testUpdateError);
    }

    await generateInvoiceFn(userId, session);
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    logger.error("[Stripe Webhook] Missing subscription_id in non-test session", { sessionId: session.id });
    throw new Error("Missing subscription_id in checkout session");
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as SubscriptionWithPeriod;

  const sessionCustomerId = (session.customer as string) || null;
  logger.info("[Stripe Webhook] Syncing profile (subscription mode):", { userId, customerId: sessionCustomerId, subscriptionId });

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: userId,
        is_pro: true,
        max_projects: 999,
        stripe_customer_id: sessionCustomerId ?? undefined,
        subscription_id: subscriptionId,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (error) {
    logger.error("[Stripe Webhook] Failed to upsert profile on checkout:", {}, error);
    throw new Error(`Failed to upsert profile: ${error.message}`);
  }

  // DO NOT call generateInvoiceFn here for subscription mode.
  // invoice.payment_succeeded fires immediately after checkout.session.completed
  // and calls generateSubscriptionInvoice — calling InFakt here too = DUPLICATE invoice.
  logger.info("[Stripe Webhook] checkout.session.completed (subscription): profile synced, InFakt handled by invoice.payment_succeeded", { userId, subscriptionId });
}

export async function handleSubscriptionDeleted(subscription: SubscriptionWithPeriod) {
  const customerId = subscription.customer as string;

  // Primary lookup by stripe_customer_id, fallback by subscription_id
  let profile: { id: string } | null = null;
  const { data: byCustomer } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (byCustomer) {
    profile = byCustomer;
  } else {
    const { data: bySub } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("subscription_id", subscription.id)
      .maybeSingle();
    profile = bySub;
  }

  if (!profile) {
    logger.error("[Stripe Webhook] handleSubscriptionDeleted: User not found — skipping", { customerId, subscriptionId: subscription.id });
    return;
  }

  // Preserve current_period_end so the UI can display "Your access ended on X".
  // Do NOT null it out — it is informational only after cancellation.
  const finalPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: profile.id,
        is_pro: false,
        max_projects: 3,
        subscription_id: null,
        current_period_start: null,
        current_period_end: finalPeriodEnd,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (updateError) {
    logger.error("[Stripe Webhook] Failed to deactivate PRO:", {}, updateError);
    throw new Error(`Failed to deactivate PRO: ${updateError.message}`);
  }

  logger.info("[Stripe Webhook] handleSubscriptionDeleted: PRO revoked", { userId: profile.id, finalPeriodEnd });
}

export async function handleSubscriptionUpdated(subscription: SubscriptionWithPeriod) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!profile) {
    logger.error("[Stripe Webhook] handleSubscriptionUpdated: User not found — skipping", { customerId });
    return;
  }

  // PRO access is VALID as long as the subscription is active or trialing.
  // cancel_at_period_end = true means "will cancel at period end" — user still has paid access NOW.
  // Actual revocation happens via customer.subscription.deleted (fired when period_end passes).
  const isPro = ["active", "trialing"].includes(status);

  logger.info("[Stripe Webhook] handleSubscriptionUpdated", { customerId, status, isPro, cancel_at_period_end: subscription.cancel_at_period_end });

  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: profile.id,
        is_pro: isPro,
        max_projects: isPro ? 999 : 3,
        subscription_id: subscription.id,
        ...(periodStart && { current_period_start: periodStart }),
        ...(periodEnd && { current_period_end: periodEnd }),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (updateError) {
    logger.error("[Stripe Webhook] Failed to upsert subscription status:", {}, updateError);
    throw new Error(`Failed to upsert subscription status: ${updateError.message}`);
  }
}
