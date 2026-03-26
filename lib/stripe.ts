import { logger } from "@/lib/logger";
import Stripe from "stripe";

/**
 * Stripe Singleton Instance
 * Ensures only one Stripe instance is created throughout the application lifecycle
 */

const apiKey = process.env.STRIPE_SECRET_KEY || "sk_test_mock_key_for_build";

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error("[Stripe] STRIPE_SECRET_KEY is missing. Stripe features will not work.", {});
}

// Create Stripe instance with secret key
export const stripe = new Stripe(apiKey, {
  apiVersion: "2024-06-20" as "2025-12-15.clover", // Stable API version (type cast required by installed stripe pkg)
  typescript: true,
});

