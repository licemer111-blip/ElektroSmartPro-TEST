import { logger } from "@/lib/logger";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getInFaktAPI, parseAddressLine } from "@/lib/infakt-api";
import type Stripe from "stripe";


type InvoiceWithRelations = Stripe.Invoice & {
  subscription?: string | { id: string } | null;
  payment_intent?: string | { id: string } | null;
};

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

/**
 * Builds InFakt client payload.
 * B2B (NIP present): company_name + nip + address
 * B2C (no NIP):      first_name + last_name + address (no nip field)
 * InFakt rejects invoices where nip is present without company_name and vice-versa.
 */
function buildInFaktClientData(params: {
  customerName: string;
  customerNip: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  customerCity: string | null;
  customerPostalCode: string | null;
}) {
  const { customerName, customerNip, customerEmail, customerAddress, customerCity, customerPostalCode } = params;
  const isB2B = !!customerNip;
  const addrParsed = customerAddress ? parseAddressLine(customerAddress) : { street: "", street_number: "" };
  // Fallback: never send empty company_name — inFakt rejects 422 without it
  const resolvedName = customerName.trim() || "Klient";

  if (isB2B) {
    return {
      company_name: resolvedName,
      nip: customerNip!,
      street: addrParsed.street || undefined,
      street_number: addrParsed.street_number || undefined,
      city: customerCity || undefined,
      post_code: customerPostalCode || undefined,
      email: customerEmail || undefined,
      country: "PL",
    };
  }

  // B2C (private individual): inFakt requires company_name — use full name, no NIP
  return {
    company_name: resolvedName,
    street: addrParsed.street || undefined,
    street_number: addrParsed.street_number || undefined,
    city: customerCity || undefined,
    post_code: customerPostalCode || undefined,
    email: customerEmail || undefined,
    country: "PL",
  };
}

async function resolveStripeCustomerData(
  customerId: string,
  fallback: { name?: string; email?: string; address?: string; city?: string; postalCode?: string }
) {
  let customerNip: string | null = null;
  let customerName = fallback.name || "Klient";
  let customerEmail = fallback.email || null;
  let customerAddress = fallback.address || null;
  let customerCity = fallback.city || null;
  let customerPostalCode = fallback.postalCode || null;

  try {
    const stripeCustomer = await stripe.customers.retrieve(customerId, { expand: ["tax_ids"] });
    if (stripeCustomer && !stripeCustomer.deleted) {
      const customer = stripeCustomer as Stripe.Customer & { tax_ids?: { data: Stripe.TaxId[] } };
      const polishNip = (customer.tax_ids?.data || []).find(
        (t) => (t.type as string) === "pl_vat" || (t.type as string) === "eu_vat"
      );
      if (polishNip?.value) customerNip = polishNip.value.replace(/[^0-9]/g, "");
      if (customer.name) customerName = customer.name;
      if (customer.email) customerEmail = customer.email;
      if (customer.address?.line1) customerAddress = customer.address.line1;
      if (customer.address?.city) customerCity = customer.address.city;
      if (customer.address?.postal_code) customerPostalCode = customer.address.postal_code;
      logger.info("[InFakt] Resolved Stripe customer data:", { customerId, hasNip: !!customerNip });
    }
  } catch (err) {
    logger.error("[InFakt] Could not retrieve Stripe customer:", {}, err);
  }

  return { customerNip, customerName, customerEmail, customerAddress, customerCity, customerPostalCode };
}

export async function handleInvoicePaymentSucceeded(invoice: InvoiceWithRelations) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription
    ? (typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id)
    : null;

  // IDEMPOTENCY: skip if this stripe_invoice_id already recorded
  const { data: existing } = await supabaseAdmin
    .from("subscription_invoices")
    .select("id")
    .eq("stripe_invoice_id", invoice.id)
    .maybeSingle();
  if (existing) {
    logger.info("[Stripe Webhook] SKIP invoice.payment_succeeded — already recorded:", { stripe_invoice_id: invoice.id });
    return;
  }

  const { data: profile, error: findError } = await supabaseAdmin
    .from("profiles")
    .select("id, email")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (findError || !profile) {
    logger.info("[Stripe Webhook] User not found for customer — skipping invoice:", { customerId });
    return;
  }

  const amountTotal = invoice.total || 0;

  // Skip inFakt invoice generation for zero-value invoices (trial periods, 100% coupons).
  // inFakt rejects 422 with "services.unit_cost: value cannot be 0".
  if (amountTotal <= 0) {
    logger.info("[Stripe Webhook] SKIP inFakt — zero-amount invoice (trial/coupon):", {
      stripe_invoice_id: invoice.id,
      amountTotal,
    });
    return;
  }

  // Use invoice.total (after discounts) as gross. Derive net from gross.
  const vatRate = 23; // always 23% for ElektroSmart PRO subscriptions
  const amountNet = Math.round(amountTotal / (1 + vatRate / 100));
  const amountVat = amountTotal - amountNet;

  const paymentIntentId = invoice.payment_intent
    ? (typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.payment_intent.id)
    : null;

  const now = new Date();
  const description = `Subskrypcja ElektroSmart PRO - ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const { error: insertError } = await supabaseAdmin.from("payments").insert({
    user_id: profile.id,
    user_email: invoice.customer_email || profile.email || "",
    stripe_payment_intent_id: paymentIntentId,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    amount_total: amountTotal,
    amount_net: amountNet,
    amount_vat: amountVat,
    vat_rate: vatRate,
    currency: invoice.currency || "pln",
    status: "succeeded",
    description,
  });

  if (insertError) {
    logger.error("[Stripe Webhook] Failed to record payment:", {}, insertError);
    return;
  }

  await generateSubscriptionInvoice(profile.id, invoice, amountNet, amountVat, amountTotal, vatRate);
}

export async function generateInvoiceFromCheckoutSession(
  userId: string,
  session: Stripe.Checkout.Session
) {
  try {
    if (!process.env.INFAKT_API_KEY) return;

    // IDEMPOTENCY: skip if this checkout session already has an invoice recorded
    const { data: existing } = await supabaseAdmin
      .from("subscription_invoices")
      .select("id")
      .eq("stripe_invoice_id", session.id)
      .maybeSingle();
    if (existing) {
      logger.info("[InFakt] SKIP generateInvoiceFromCheckoutSession — already recorded:", { sessionId: session.id });
      return;
    }

    const customerDetails = session.customer_details;
    let customerName = customerDetails?.name || "";
    // For payment mode (guest checkout), session.customer_email is the most reliable source
    let customerEmail: string | null =
      customerDetails?.email ||
      (session as unknown as { customer_email?: string }).customer_email ||
      session.metadata?.userEmail ||
      null;
    let customerAddress = customerDetails?.address?.line1 || null;
    let customerCity = customerDetails?.address?.city || null;
    let customerPostalCode = customerDetails?.address?.postal_code || null;
    let customerNip: string | null = null;

    // Extract NIP from session tax_ids
    const sessionTaxIds = customerDetails?.tax_ids || [];
    const polishTax = sessionTaxIds.find(
      (t) => (t.type as string) === "pl_vat" || (t.type as string) === "eu_vat"
    );
    if (polishTax?.value) customerNip = polishTax.value.replace(/[^0-9]/g, "");

    // Try to resolve more data from Stripe Customer object (subscription mode)
    if (session.customer) {
      const resolved = await resolveStripeCustomerData(session.customer as string, {
        name: customerName || undefined,
        email: customerEmail ?? undefined,
        address: customerAddress ?? undefined,
        city: customerCity ?? undefined,
        postalCode: customerPostalCode ?? undefined,
      });
      if (!customerNip && resolved.customerNip) customerNip = resolved.customerNip;
      if (!customerName && resolved.customerName) customerName = resolved.customerName;
      if (!customerEmail && resolved.customerEmail) customerEmail = resolved.customerEmail;
      if (!customerAddress && resolved.customerAddress) customerAddress = resolved.customerAddress;
      if (!customerCity && resolved.customerCity) customerCity = resolved.customerCity;
      if (!customerPostalCode && resolved.customerPostalCode) customerPostalCode = resolved.customerPostalCode;
    }

    // Final fallback: Supabase profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_name, full_name, nip, street, city, postal_code, email")
      .eq("id", userId)
      .single();
    if (profile) {
      if (!customerNip && profile.nip) customerNip = profile.nip;
      if (!customerName) customerName = profile.company_name || profile.full_name || "Klient";
      if (!customerEmail && profile.email) customerEmail = profile.email;
      if (!customerAddress && profile.street) customerAddress = profile.street;
      if (!customerCity && profile.city) customerCity = profile.city;
      if (!customerPostalCode && profile.postal_code) customerPostalCode = profile.postal_code;
      if (customerNip && profile.company_name) customerName = profile.company_name;
    }

    if (!customerName) customerName = "Klient";

    if (!customerEmail) {
      logger.info("[InFakt] No customer email — skipping invoice generation", { userId, sessionId: session.id });
      return;
    }

    const amountTotalGrosze = session.amount_total || 0;
    const sessionVatRate = parseInt(session.metadata?.vatRate || "23", 10) as 8 | 23;
    const grossPLN = amountTotalGrosze / 100;
    const netPLN = Math.round((grossPLN / (1 + sessionVatRate / 100)) * 100) / 100;
    const vatPLN = Math.round((grossPLN - netPLN) * 100) / 100;
    const isB2B = !!customerNip;

    logger.info("[InFakt] Pre-call data summary:", {
      userId,
      sessionId: session.id,
      customerName: customerName || "(EMPTY)",
      customerEmail: customerEmail || "(MISSING)",
      customerAddress: customerAddress || "(MISSING)",
      customerCity: customerCity || "(MISSING)",
      customerPostalCode: customerPostalCode || "(MISSING — inFakt will reject)",
      customerNip: customerNip ? "[NIP_PRESENT]" : null,
    });

    logger.info("[InFakt] Invoice amounts", {
      amount_total_raw: session.amount_total,
      amountTotalGrosze,
      grossPLN,
      netPLN,
      vatPLN,
      sessionVatRate,
      unit_net_price_grosze: Math.round(netPLN * 100),
      customerEmail,
      customerNip,
      isB2B,
    });
    const isTestSession = session.metadata?.isTest === "true";
    const billingCycle = session.metadata?.billingCycle || "monthly";
    const isYearly = billingCycle === "yearly";
    const baseProductName = isYearly
      ? "Subskrypcja roczna ElektroSmart PRO"
      : "Subskrypcja ElektroSmart PRO";

    const infakt = getInFaktAPI(process.env.INFAKT_API_KEY);

    const clientData = buildInFaktClientData({
      customerName,
      customerNip,
      customerEmail,
      customerAddress,
      customerCity,
      customerPostalCode,
    });

    const today = new Date().toISOString().split("T")[0];
    const infaktInvoice = await infakt.createInvoice({
      client: clientData,
      items: [{
        name: isTestSession
          ? `[TEST] ${baseProductName}`
          : baseProductName,
        quantity: 1,
        unit: "szt",
        unit_net_price: Math.round(netPLN * 100), // grosze integer
        tax_symbol: String(sessionVatRate),        // "23" or "8" per inFakt docs
        flat_rate_tax_symbol: "8.5",               // ryczałt per-item explicit override
      }],
      payment_method: "transfer",
      payment_date: today,
      seller_name: "Stanislav Vovk — ElektroSmart PRO",
      ...(process.env.INFAKT_NUMBER_SERIES_ID ? { number_series_id: Number(process.env.INFAKT_NUMBER_SERIES_ID) } : {}),
      notes: `Zapłacono automatycznie przez Stripe\nStripe Session: ${session.id}\nPlan: ${isYearly ? "Roczny" : "Miesięczny"}${isTestSession ? "\n\n[TRANSAKCJA TESTOWA]" : ""}${!isB2B ? "\n\nFaktura dla osoby prywatnej" : ""}`,  
      status: "sent",
    });

    const { error: saveError } = await supabaseAdmin.from("subscription_invoices").upsert({
      user_id: userId,
      stripe_invoice_id: session.id,
      stripe_payment_intent_id: (session.payment_intent as string) || null,
      infakt_invoice_id: infaktInvoice.id.toString(),
      infakt_client_id: infaktInvoice.client_id.toString(),
      invoice_number: infaktInvoice.number,
      issue_date: infaktInvoice.invoice_date,
      sale_date: infaktInvoice.sale_date,
      payment_date: infaktInvoice.payment_date,
      client_name: customerName,
      client_nip: customerNip,
      client_address: customerAddress,
      client_city: customerCity,
      client_postal_code: customerPostalCode,
      amount_net: netPLN,
      amount_vat: vatPLN,
      amount_gross: grossPLN,
      vat_rate: sessionVatRate,
      status: "paid",
      payment_status: "paid",
      pdf_url: null,
      description: isTestSession
        ? `[TEST] ${baseProductName}`
        : baseProductName,
    }, { onConflict: "stripe_invoice_id" });

    if (saveError) logger.error("[InFakt] Failed to save invoice to DB:", {}, saveError);
    logger.info("[InFakt] Saved invoice to DB:", { invoiceNumber: infaktInvoice.number });

    // Deliver invoice via email (status:sent triggers PDF generation and email)
    try {
      await infakt.deliverInvoice(infaktInvoice.uuid ?? infaktInvoice.id);
      logger.info("[InFakt] Invoice delivered OK:", { invoiceId: infaktInvoice.id });
    } catch (deliverErr) {
      logger.error("[InFakt] deliverInvoice failed (non-fatal):", {}, deliverErr);
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[InFakt] generateInvoiceFromCheckoutSession FAILED — see Pre-call data summary above for client details:", {
      userId,
      sessionId: session.id,
      exactError: msg,
    });
    throw error;
  }
}

async function generateSubscriptionInvoice(
  userId: string,
  stripeInvoice: InvoiceWithRelations,
  amountNet: number,
  amountVat: number,
  amountTotal: number,
  vatRate: number
) {
  try {
    if (!process.env.INFAKT_API_KEY) return;

    // IDEMPOTENCY: skip if this stripe_invoice_id already recorded
    const { data: existing } = await supabaseAdmin
      .from("subscription_invoices")
      .select("id")
      .eq("stripe_invoice_id", stripeInvoice.id)
      .maybeSingle();
    if (existing) {
      logger.info("[InFakt] SKIP generateSubscriptionInvoice — already recorded:", { stripe_invoice_id: stripeInvoice.id });
      return;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_name, full_name, nip, street, city, postal_code, email")
      .eq("id", userId)
      .single();

    if (!profile) { logger.info("[InFakt] User profile not found — skipping:", { userId }); return; }

    let customerNip: string | null = profile.nip || null;
    let customerName = profile.full_name || "Klient";
    let customerEmail: string | null = profile.email || stripeInvoice.customer_email || null;
    let customerAddress: string | null = profile.street || null;
    let customerCity: string | null = profile.city || null;
    let customerPostalCode: string | null = profile.postal_code || null;

    const stripeCustomerId = stripeInvoice.customer;
    if (stripeCustomerId && typeof stripeCustomerId === "string") {
      const resolved = await resolveStripeCustomerData(stripeCustomerId, {
        name: customerName, email: customerEmail ?? undefined,
        address: customerAddress ?? undefined, city: customerCity ?? undefined,
        postalCode: customerPostalCode ?? undefined,
      });
      if (resolved.customerNip) customerNip = resolved.customerNip;
      customerName = resolved.customerName;
      if (resolved.customerEmail) customerEmail = resolved.customerEmail;
      if (resolved.customerAddress) customerAddress = resolved.customerAddress;
      if (resolved.customerCity) customerCity = resolved.customerCity;
      if (resolved.customerPostalCode) customerPostalCode = resolved.customerPostalCode;
    }

    if (customerNip && profile.company_name) customerName = profile.company_name;

    const netPLN = amountNet / 100;
    const vatPLN = amountVat / 100;
    const grossPLN = amountTotal / 100;
    const isB2B = !!customerNip;

    // Detect billing cycle from invoice line items interval
    type InvoiceWithLines = InvoiceWithRelations & {
      lines?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
    };
    const invoiceInterval = (stripeInvoice as InvoiceWithLines).lines?.data?.[0]?.price?.recurring?.interval;
    const isYearly = invoiceInterval === "year";
    const productName = isYearly
      ? "Subskrypcja roczna ElektroSmart PRO"
      : "Subskrypcja ElektroSmart PRO";

    const infakt = getInFaktAPI(process.env.INFAKT_API_KEY);
    const clientData = buildInFaktClientData({
      customerName,
      customerNip,
      customerEmail,
      customerAddress,
      customerCity,
      customerPostalCode,
    });

    logger.info("[InFakt/Sub] Pre-call data summary:", {
      userId,
      stripeInvoiceId: stripeInvoice.id,
      customerName: customerName || "(EMPTY)",
      customerEmail: customerEmail || "(MISSING)",
      customerAddress: customerAddress || "(MISSING)",
      customerCity: customerCity || "(MISSING)",
      customerPostalCode: customerPostalCode || "(MISSING — inFakt will reject)",
      customerNip: customerNip ? "[NIP_PRESENT]" : null,
    });

    const today = new Date().toISOString().split("T")[0];
    const infaktInvoice = await infakt.createInvoice({
      client: clientData,
      items: [{
        name: productName,
        quantity: 1,
        unit: "szt",
        unit_net_price: Math.round(netPLN * 100), // grosze integer
        tax_symbol: String(vatRate),
        flat_rate_tax_symbol: "8.5",               // ryczałt per-item explicit override
      }],
      payment_method: "transfer",
      payment_date: today,
      seller_name: "Stanislav Vovk — ElektroSmart PRO",
      ...(process.env.INFAKT_NUMBER_SERIES_ID ? { number_series_id: Number(process.env.INFAKT_NUMBER_SERIES_ID) } : {}),
      notes: `Zapłacono automatycznie przez Stripe\nStripe Invoice: ${stripeInvoice.number || stripeInvoice.id}\nPlan: ${isYearly ? "Roczny" : "Miesięczny"}${!isB2B ? "\n\nFaktura dla osoby prywatnej" : ""}`,  
      status: "sent",
    });

    const { error: saveError } = await supabaseAdmin.from("subscription_invoices").upsert({
      user_id: userId,
      stripe_invoice_id: stripeInvoice.id,
      stripe_payment_intent_id: typeof stripeInvoice.payment_intent === "string"
        ? stripeInvoice.payment_intent
        : stripeInvoice.payment_intent?.id ?? null,
      infakt_invoice_id: infaktInvoice.id.toString(),
      infakt_client_id: infaktInvoice.client_id.toString(),
      invoice_number: infaktInvoice.number,
      issue_date: infaktInvoice.invoice_date,
      sale_date: infaktInvoice.sale_date,
      payment_date: infaktInvoice.payment_date,
      client_name: customerName,
      client_nip: customerNip,
      client_address: customerAddress,
      client_city: customerCity,
      client_postal_code: customerPostalCode,
      amount_net: netPLN,
      amount_vat: vatPLN,
      amount_gross: grossPLN,
      vat_rate: vatRate,
      status: "paid",
      payment_status: "paid",
      pdf_url: null,
      description: productName,
    }, { onConflict: "stripe_invoice_id" });

    if (saveError) logger.error("[InFakt] Failed to save invoice to DB:", {}, saveError);
    logger.info("[InFakt/Sub] Invoice saved:", { invoiceNumber: infaktInvoice.number });

    // Deliver invoice via email (status:sent triggers PDF generation and email)
    try {
      await infakt.deliverInvoice(infaktInvoice.uuid ?? infaktInvoice.id);
      logger.info("[InFakt/Sub] Invoice delivered OK:", { invoiceId: infaktInvoice.id });
    } catch (deliverErr) {
      logger.error("[InFakt/Sub] deliverInvoice failed (non-fatal):", {}, deliverErr);
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("[InFakt] generateSubscriptionInvoice FAILED — see Pre-call data summary above for client details:", {
      userId,
      stripeInvoiceId: stripeInvoice.id,
      exactError: msg,
    });
    throw error;
  }
}
