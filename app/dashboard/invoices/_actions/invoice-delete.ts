"use server";

import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

export async function deleteSubscriptionInvoice(
  invoiceId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user) return { error: "Musisz być zalogowany" };

    const { data: invoice } = await supabaseAdmin
      .from("subscription_invoices")
      .select("id, user_id")
      .eq("id", invoiceId)
      .single();

    if (!invoice) return { error: "Nie znaleziono faktury" };
    if (invoice.user_id !== user.id) return { error: "Brak uprawnień" };

    const { error } = await supabaseAdmin
      .from("subscription_invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) {
      logger.error("Error deleting invoice", { invoiceId }, error);
      return { error: "Błąd usuwania faktury" };
    }

    return { success: true };
  } catch (err) {
    logger.error("deleteSubscriptionInvoice error", {}, err);
    return { error: "Nieoczekiwany błąd" };
  }
}

export async function resendInvoiceEmail(
  invoiceId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const { user } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user) return { error: "Musisz być zalogowany" };

    const { data: invoice } = await supabaseAdmin
      .from("subscription_invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (!invoice) return { error: "Nie znaleziono faktury" };
    if (invoice.user_id !== user.id) return { error: "Brak uprawnień" };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const email = profile?.email;
    if (!email) return { error: "Brak adresu email" };

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL || "faktury@elektrosmart.pro";

    const invoiceNumber = invoice.invoice_number || String(invoice.id || "—");
    const grossPLN = Number(invoice.amount_gross) || 0;
    const pdfUrl: string | null = invoice.pdf_url || null;
    const infaktInvoiceId: string | null = invoice.infakt_invoice_id || null;
    const viewUrl: string | null = infaktInvoiceId
      ? `https://app.infakt.pl/app/faktury/${infaktInvoiceId}`
      : null;

    // Build branded buttons
    const buttons: string[] = [];
    if (pdfUrl) {
      buttons.push(`<a href="${pdfUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:11px 24px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;margin-right:8px;">📄 Pobierz fakturę PDF</a>`);
    }
    if (viewUrl) {
      buttons.push(`<a href="${viewUrl}" style="display:inline-block;background:#1e40af;color:#fff;padding:11px 24px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;">🔗 Otwórz w inFakt</a>`);
    }
    const buttonsBlock = buttons.length > 0
      ? `<p style="margin:20px 0;">${buttons.join("\n")}</p>`
      : `<p style="color:#6b7280;font-size:13px;">Faktura jest dostępna w panelu inFakt.</p>`;

    const html = `<!DOCTYPE html>
<html lang="pl"><body style="font-family:Arial,sans-serif;background:#f8fafc;margin:0;padding:0;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1e293b,#334155);padding:28px 32px;">
    <h1 style="margin:0;color:#f97316;font-size:22px;font-weight:700;">ElektroSmart <span style="color:#fff;">PRO</span></h1>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Faktura VAT</p>
  </div>
  <div style="padding:28px 32px;">
    <p style="margin:0 0 20px;font-size:14px;color:#475569;">Poniżej znajdziesz fakturę VAT za subskrypcję ElektroSmart PRO.</p>
    <div style="background:#f1f5f9;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <table style="width:100%;font-size:13px;border-collapse:collapse;">
        <tr><td style="color:#64748b;padding:3px 0;">Numer faktury:</td><td style="text-align:right;font-weight:600;color:#1e293b;">${invoiceNumber}</td></tr>
        <tr><td style="color:#64748b;padding:3px 0;">Kwota brutto:</td><td style="text-align:right;font-weight:700;color:#f97316;font-size:15px;">${grossPLN.toFixed(2).replace(".", ",")} zł</td></tr>
        ${invoice.issue_date ? `<tr><td style="color:#64748b;padding:3px 0;">Data wystawienia:</td><td style="text-align:right;font-weight:600;color:#1e293b;">${new Date(invoice.issue_date).toLocaleDateString("pl-PL")}</td></tr>` : ""}
      </table>
    </div>
    ${buttonsBlock}
    <p style="font-size:12px;color:#94a3b8;margin-top:24px;">Faktura dostępna też w panelu: <a href="https://elektrosmart.pro/dashboard/invoices" style="color:#f97316;">elektrosmart.pro → Faktury</a></p>
  </div>
  <div style="background:#f8fafc;padding:14px 32px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;">
    ElektroSmart PRO · Polska · <a href="https://elektrosmart.pro" style="color:#94a3b8;">elektrosmart.pro</a>
  </div>
</div>
</body></html>`;

    const { error: sendError } = await resend.emails.send({
      from: `ElektroSmart PRO <${fromEmail}>`,
      to: [email],
      subject: `Faktura ${invoiceNumber} — ElektroSmart PRO`,
      html,
    });

    if (sendError) {
      logger.error("resendInvoiceEmail send error", { invoiceId }, sendError);
      return { error: "Błąd wysyłki email" };
    }

    return { success: true };
  } catch (err) {
    logger.error("resendInvoiceEmail error", {}, err);
    return { error: "Nieoczekiwany błąd" };
  }
}
