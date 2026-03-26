import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for managing subscriptions
 */
export async function POST(request: NextRequest) {
  // Validate base URL at request time
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  if (baseUrl.includes("localhost") && process.env.NODE_ENV === "production") {
    logger.error("[Stripe Portal] NEXT_PUBLIC_BASE_URL points to localhost in production!", {});
  }

  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error("[Stripe Portal] Authentication failed:", {}, authError);
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // Get user profile with Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      logger.error("[Stripe Portal] No Stripe customer found:", {}, profileError);
      return NextResponse.json(
        { error: "Nie znaleziono aktywnej subskrypcji. Skontaktuj się z supportem." },
        { status: 404 }
      );
    }

    // Create Stripe Customer Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/subscription`,
    });

    // Return portal URL
    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error: unknown) {
    logger.error("[Stripe Portal] Error:", {}, error);

    // Translate common Stripe errors to Polish for the client
    let clientMessage = "Nie udało się otworzyć panelu płatności. Spróbuj ponownie.";
    const rawMessage = error instanceof Error ? error.message : "";

    if (rawMessage.includes("configure your customer portal")) {
      clientMessage = "Portal płatności wymaga konfiguracji w panelu Stripe. Skontaktuj się z administratorem.";
    } else if (rawMessage.includes("No such customer")) {
      clientMessage = "Nie znaleziono konta płatności. Skontaktuj się z supportem.";
    } else if (rawMessage.includes("return_url")) {
      clientMessage = "Błąd konfiguracji adresu powrotu. Skontaktuj się z administratorem.";
    } else if (rawMessage.includes("Invalid API Key") || rawMessage.includes("No API key")) {
      clientMessage = "Błąd konfiguracji systemu płatności. Skontaktuj się z administratorem.";
    }

    return NextResponse.json(
      {
        error: clientMessage,
        details: rawMessage || "Unknown error",
      },
      { status: 500 }
    );
  }
}
