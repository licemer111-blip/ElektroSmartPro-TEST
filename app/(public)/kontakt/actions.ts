"use server";

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export async function submitContactForm(formData: ContactFormData): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Validate inputs
    if (!formData.name || !formData.email || !formData.message) {
      return { success: false, error: "Wszystkie pola są wymagane" };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return { success: false, error: "Nieprawidłowy adres e-mail" };
    }

    // Insert into feedback table
    const { error: insertError } = await supabase
      .from("feedback")
      .insert({
        user_email: formData.email,
        name: formData.name,
        message: formData.message,
        category: "contact", // Mark as contact form submission
        status: "new",
      });

    if (insertError) {
      logger.error("Error inserting contact form", { email: formData.email }, insertError);
      return { success: false, error: "Błąd podczas wysyłania wiadomości" };
    }

    return { success: true };
  } catch (error) {
    logger.error("Exception in submitContactForm", {}, error);
    return { success: false, error: "Nieoczekiwany błąd serwera" };
  }
}
