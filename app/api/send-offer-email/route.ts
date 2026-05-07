import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // DB-based email rate limit: 10 emails/hour (in-memory Map is useless on Vercel serverless)
    {
      const emailHourLimit = 10;
      const windowMs = 60 * 60 * 1000;
      const now = new Date();
      const { data: rlStat } = await supabaseAdmin
        .from("ai_usage_stats")
        .select("usage_count, reset_at")
        .eq("user_id", user.id)
        .eq("function_name", "email_ratelimit")
        .maybeSingle();
      const rlResetAt = rlStat?.reset_at ? new Date(rlStat.reset_at) : null;
      const withinWindow = rlResetAt && (now.getTime() - rlResetAt.getTime()) < windowMs;
      const rlCount = withinWindow ? (rlStat?.usage_count ?? 0) : 0;
      if (rlCount >= emailHourLimit) {
        return NextResponse.json({ error: "Zbyt wiele wiadomości. Spróbuj ponownie za godzinę." }, { status: 429 });
      }
      await supabaseAdmin
        .from("ai_usage_stats")
        .upsert(
          { user_id: user.id, function_name: "email_ratelimit", usage_count: rlCount + 1, reset_at: withinWindow ? (rlStat?.reset_at ?? now.toISOString()) : now.toISOString() },
          { onConflict: "user_id,function_name" }
        );
    }

    const { to, name, offerUrl } = await request.json();

    if (!to || !offerUrl) {
      return NextResponse.json({ error: "Brak wymaganych danych (email, link)" }, { status: 400 });
    }

    // Get sender profile for branding
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, full_name, phone, email")
      .eq("id", user.id)
      .single();

    const senderName = profile?.company_name || profile?.full_name || "ElektroSmart";
    const senderEmail = profile?.email || user.email || "";

    const { error } = await resend.emails.send({
      from: "ElektroSmart PRO <noreply@elektrosmart.pro>",
      to: [to],
      subject: `Oferta kosztorysu od ${senderName}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px 24px;">
          <div style="background: white; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #1e40af; font-size: 24px; margin: 0;">⚡ ElektroSmart PRO</h1>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Portal oferty dla klienta</p>
            </div>
            
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Dzień dobry${name ? ` <strong>${name}</strong>` : ""},
            </p>
            
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              Firma <strong>${senderName}</strong> przygotowała dla Ciebie ofertę kosztorysu elektrycznego.
              Kliknij poniższy przycisk, aby zobaczyć szczegóły, zaakceptować lub odrzucić ofertę.
            </p>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="${offerUrl}" 
                style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                📋 Zobacz ofertę
              </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
              Link jest ważny przez 30 dni. Jeśli masz pytania, skontaktuj się z ${senderName}${senderEmail ? ` (${senderEmail})` : ""}${profile?.phone ? ` tel: ${profile.phone}` : ""}.
            </p>
          </div>
          
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
            Wysłano z ElektroSmart PRO — profesjonalny system kosztorysowania
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error("Resend error", { to, userId: user.id }, error);
      return NextResponse.json({ error: "Nie udało się wysłać emaila" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Send offer email error", {}, err);
    return NextResponse.json({ error: "Błąd serwera" }, { status: 500 });
  }
}
