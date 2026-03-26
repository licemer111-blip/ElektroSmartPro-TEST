import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";

/**
 * Require authenticated user for server actions.
 * Returns user object or throws an error response.
 * 
 * Usage in server actions:
 *   const { user, supabase } = await requireAuth();
 * 
 * This replaces the repeated pattern:
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) return { error: "Musisz być zalogowany" };
 */
export async function requireAuth(): Promise<{
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthError("Musisz być zalogowany");
  }

  return { user, supabase };
}

/**
 * Custom auth error class for distinguishing auth failures.
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Safe wrapper for server actions that use requireAuth.
 * Catches AuthError and returns { error: string } instead of throwing.
 * 
 * Usage:
 *   export async function myAction() {
 *     return withAuth(async ({ user, supabase }) => {
 *       // ... your logic
 *       return { success: true };
 *     });
 *   }
 */
export async function withAuth<T>(
  fn: (ctx: { user: User; supabase: Awaited<ReturnType<typeof createClient>> }) => Promise<T>
): Promise<T | { error: string }> {
  try {
    const ctx = await requireAuth();
    return await fn(ctx);
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: err.message };
    }
    throw err;
  }
}
