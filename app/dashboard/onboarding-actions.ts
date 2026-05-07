"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { bulkRecalculateLaborPrices } from "@/app/dashboard/catalog/bulk-recalculate-labor";

/**
 * Complete the initial onboarding setup.
 * Saves hourly rate + region + marks profile as onboarding_completed.
 * Also propagates rate to all user projects and recalculates catalog/assembly prices.
 */
export async function completeOnboardingSetup(params: {
  hourlyRate: number;
  regionId: string | null;
  companyName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const { hourlyRate, regionId, companyName } = params;

    if (hourlyRate < 1 || hourlyRate > 9999) {
      return { success: false, error: "Stawka musi być między 1 a 9999 PLN/h" };
    }

    // Build profile update payload
    // NOTE: onboarding_completed is NOT set here — it is set by OnboardingTour on dismiss.
    // This allows the tour to fire after the wizard for new users.
    const profileUpdate: Record<string, unknown> = {
      hourly_rate: hourlyRate,
      updated_at: new Date().toISOString(),
    };

    if (regionId) {
      profileUpdate.default_region_id = regionId;
    }

    if (companyName && companyName.trim().length > 0) {
      profileUpdate.company_name = companyName.trim();
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);

    if (profileError) {
      logger.error("[completeOnboardingSetup] Profile update failed", {}, profileError);
      return { success: false, error: "Błąd zapisu profilu" };
    }

    // Propagate rate to all user projects
    await supabase
      .from("projects")
      .update({ default_hourly_rate: hourlyRate })
      .eq("user_id", user.id);

    // Propagate region to all user projects
    if (regionId) {
      await supabase
        .from("projects")
        .update({ region_id: regionId })
        .eq("user_id", user.id);
    }

    // Recalculate catalog & assembly labor prices with new rate
    await bulkRecalculateLaborPrices(hourlyRate).catch((err) => {
      logger.error("[completeOnboardingSetup] Recalc failed (non-fatal)", {}, err);
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/projects", "layout");

    return { success: true };
  } catch (err) {
    logger.error("[completeOnboardingSetup] Unexpected error", {}, err);
    return { success: false, error: "Nieoczekiwany błąd systemu" };
  }
}
