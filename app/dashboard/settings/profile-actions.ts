"use server";

import { revalidatePath } from "next/cache";
import type { Profile } from "@/lib/types/database";
import { profileSchema, validate } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// ============================================================================
// PROFILE ACTIONS — user data, avatars, InFakt API key
// ============================================================================

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<{ data: Profile | null; error: string | null }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { data: null, error: "Nie jesteś zalogowany" };
    }

    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          is_pro: false,
          max_projects: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "id", ignoreDuplicates: true });

      if (insertError) {
        logger.error("[getProfile] Failed to create profile", {}, insertError);
        return { data: null, error: "Błąd tworzenia profilu" };
      }

      const { data: newData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      data = newData;
    } else if (error) {
      logger.error("Error fetching profile", {}, error);
      return { data: null, error: "Błąd pobierania profilu" };
    }

    return { data, error: null };
  } catch (error) {
    logger.error("Exception in getProfile", {}, error);
    return { data: null, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Update user's profile (company settings)
 */
export async function updateProfile(profileData: {
  company_name?: string;
  nip?: string;
  regon?: string;
  address?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  bank_account?: string;
  logo_url?: string;
  hourly_rate?: number;
  use_custom_rates?: boolean;
  custom_labor_rate?: number | null;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error: validationError } = validate(profileSchema, profileData);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: profileData.company_name || null,
        nip: profileData.nip || null,
        regon: profileData.regon || null,
        address: profileData.address || null,
        street: profileData.street || null,
        city: profileData.city || null,
        postal_code: profileData.postal_code || null,
        phone: profileData.phone || null,
        email: profileData.email || null,
        bank_account: profileData.bank_account || null,
        logo_url: profileData.logo_url || null,
        ...(profileData.hourly_rate !== undefined && { hourly_rate: profileData.hourly_rate }),
        ...(profileData.use_custom_rates !== undefined && { use_custom_rates: profileData.use_custom_rates }),
        ...(profileData.custom_labor_rate !== undefined && { custom_labor_rate: profileData.custom_labor_rate }),
      })
      .eq("id", user.id);

    if (error) {
      logger.error("Error updating profile", {}, error);
      return { success: false, error: "Błąd aktualizacji profilu" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true, error: null };
  } catch (error) {
    logger.error("Exception in updateProfile", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Upload logo to Supabase Storage
 */
export async function uploadLogo(file: File): Promise<{ success: boolean; url?: string; error: string | null }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${timestamp}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      logger.error("Error uploading logo", { fileName: file.name }, uploadError);
      return { success: false, error: "Błąd przesyłania pliku" };
    }

    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(fileName);

    if (!urlData.publicUrl) {
      return { success: false, error: "Błąd pobierania URL" };
    }

    return { success: true, url: urlData.publicUrl, error: null };
  } catch (error) {
    logger.error("Exception in uploadLogo", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Create profile if it doesn't exist (fallback for existing users)
 */
export async function ensureProfile(): Promise<{ success: boolean; error: string | null }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) {
      return { success: true, error: null };
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });

    if (error) {
      logger.error("Error creating profile", {}, error);
      return { success: false, error: "Błąd tworzenia profilu" };
    }

    return { success: true, error: null };
  } catch (error) {
    logger.error("Exception in ensureProfile", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Update user's InFakt API key
 */
export async function updateInFaktAPIKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Nie jesteś zalogowany" };
    }

    if (!apiKey || apiKey.trim().length < 10) {
      return { success: false, error: "Klucz API jest za krótki lub nieprawidłowy" };
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ infakt_api_key: apiKey.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) {
      logger.error("[updateInFaktAPIKey] Error", {}, updateError);
      return { success: false, error: `Błąd aktualizacji: ${updateError.message}` };
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/invoices");

    return { success: true };
  } catch (error) {
    logger.error("[updateInFaktAPIKey] Unexpected error", {}, error);
    return { success: false, error: error instanceof Error ? error.message : "Nieznany błąd" };
  }
}

