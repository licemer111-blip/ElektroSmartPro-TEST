"use server";

import { tryAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

/**
 * Delete an email log entry
 */
export async function deleteEmailLog(emailLogId: string) {
  try {
    const { user, supabase } = await tryAuth();

    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // Delete the email log (RLS will ensure user can only delete their own logs)
    const { error } = await supabase
      .from("email_logs")
      .delete()
      .eq("id", emailLogId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error deleting email log", { emailLogId }, error);
      return { success: false, error: "Nie udało się usunąć wpisu" };
    }

    revalidatePath("/dashboard/sent-offers");

    return { success: true };
  } catch (error) {
    logger.error("deleteEmailLog error", { emailLogId }, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Wystąpił błąd",
    };
  }
}
