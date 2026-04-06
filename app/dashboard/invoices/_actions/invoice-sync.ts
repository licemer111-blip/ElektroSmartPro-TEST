"use server";

import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { getInFaktAPI } from "@/lib/infakt-api";
import { logger } from "@/lib/logger";

export async function markInvoiceAsPaid(invoiceId: string, isSubscription: boolean = false) {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const table = isSubscription ? "subscription_invoices" : "project_invoices";

    const { error } = await supabase
      .from(table)
      .update({ status: "paid", payment_status: "paid" })
      .eq("id", invoiceId)
      .eq("user_id", user.id);

    if (error) {
      logger.error("Error marking invoice as paid", { invoiceId }, error);
      return { success: false, error: "Błąd aktualizacji faktury" };
    }

    try {
      const [{ data: invoice }, { data: profile }] = await Promise.all([
        supabase.from(table).select("infakt_invoice_id").eq("id", invoiceId).single(),
        supabase.from("profiles").select("infakt_api_key").eq("id", user.id).single(),
      ]);

      if (invoice?.infakt_invoice_id && profile?.infakt_api_key) {
        const infakt = getInFaktAPI(profile.infakt_api_key);
        await infakt.updateInvoiceStatus(parseInt(invoice.infakt_invoice_id), "paid");
      }
    } catch (infaktError) {
      logger.error("Error updating InFakt status", { invoiceId }, infaktError);
    }

    revalidatePath("/dashboard/invoices");
    return { success: true };
  } catch (error) {
    logger.error("markInvoiceAsPaid error", { invoiceId }, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

export async function syncInvoiceStatuses() {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const { data: profile } = await supabase
      .from("profiles")
      .select("infakt_api_key")
      .eq("id", user.id)
      .single();

    if (!profile?.infakt_api_key) {
      return { success: false, error: "Skonfiguruj klucz API InFakt w Ustawieniach" };
    }

    const { data: localInvoices } = await supabase
      .from("project_invoices")
      .select("id, infakt_invoice_id, status")
      .eq("user_id", user.id);

    if (!localInvoices || localInvoices.length === 0) return { success: true, updated: 0 };

    const infakt = getInFaktAPI(profile.infakt_api_key);
    let updated = 0;

    for (const invoice of localInvoices) {
      if (!invoice.infakt_invoice_id) continue;
      try {
        const statusResult = await infakt.checkPaymentStatus(parseInt(invoice.infakt_invoice_id));
        if (statusResult.status !== invoice.status) {
          await supabase
            .from("project_invoices")
            .update({
              status: statusResult.status,
              payment_status: statusResult.status === "paid" ? "paid" : "open",
            })
            .eq("id", invoice.id);
          updated++;
        }
      } catch (error) {
        logger.error("Error syncing invoice", { invoiceId: invoice.id }, error);
      }
    }

    revalidatePath("/dashboard/invoices");
    return { success: true, updated };
  } catch (error) {
    logger.error("syncInvoiceStatuses error", {}, error);
    return { success: false, error: error instanceof Error ? error.message : "Nieoczekiwany błąd" };
  }
}
