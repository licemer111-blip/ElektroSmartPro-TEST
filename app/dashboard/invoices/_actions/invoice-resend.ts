"use server";

import { requireAuth } from "@/lib/auth";
import { getInFaktAPI } from "@/lib/infakt-api";
import { logger } from "@/lib/logger";
import { createClient } from "@/utils/supabase/server";

export async function resendInvoiceEmail(invoiceId: string): Promise<{ error?: string }> {
  try {
    const { user } = await requireAuth();
    const supabase = await createClient();

    const { data: invoice, error: fetchError } = await supabase
      .from("subscription_invoices")
      .select("infakt_invoice_id, user_id")
      .eq("id", invoiceId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !invoice) return { error: "Nie znaleziono faktury" };
    if (!invoice.infakt_invoice_id) return { error: "Brak ID faktury w InFakt" };

    const infakt = getInFaktAPI(process.env.INFAKT_API_KEY!);
    await infakt.deliverInvoice(Number(invoice.infakt_invoice_id));

    logger.info("[InFakt] Invoice resent manually:", { invoiceId, infaktId: invoice.infakt_invoice_id });
    return {};
  } catch (error) {
    logger.error("[InFakt] resendInvoiceEmail failed:", {}, error);
    return { error: "Błąd wysyłki — spróbuj ponownie" };
  }
}
