import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Admin Client
 * Uses Service Role Key to bypass Row Level Security (RLS)
 * ⚠️ ONLY use this on the server side for privileged operations
 */

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables. " +
    "Please add it to your .env.local file."
  );
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables. " +
    "This is required for admin operations. " +
    "Please add it to your .env.local file."
  );
}

/**
 * Admin client with full database access (bypasses RLS)
 * Use ONLY for:
 * - Webhook handlers
 * - Background jobs
 * - System-level operations
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

