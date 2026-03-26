"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import type { FeedbackType } from "@/lib/types/database";
import { feedbackSchema, validate } from "@/lib/validations";
import { logger } from "@/lib/logger";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

interface SubmitFeedbackParams {
  type: FeedbackType;
  message: string;
  contactEmail?: string;
  metadata?: Record<string, string>;
  attachmentUrls?: string[];
}

interface UploadAttachmentResult {
  url?: string;
  path?: string;
  error?: string;
}

interface SubmitFeedbackResult {
  success: boolean;
  error?: string;
}

/**
 * Generate HTML email template for feedback notifications
 */
function generateFeedbackEmailHTML(params: {
  type: FeedbackType;
  message: string;
  contactEmail?: string;
  userEmail?: string;
  metadata?: Record<string, string>;
  attachmentUrls?: string[];
}): string {
  const typeLabels: Record<FeedbackType, { label: string; icon: string; color: string }> = {
    bug: { label: "Zgłoszenie Błędu", icon: "🐛", color: "#EF4444" },
    feature: { label: "Propozycja Funkcji", icon: "💡", color: "#F59E0B" },
    contact: { label: "Kontakt", icon: "📧", color: "#3B82F6" },
  };

  const typeInfo = typeLabels[params.type];
  const userInfo = params.userEmail || params.contactEmail || "Anonimowy użytkownik";
  const pageUrl = params.metadata?.page_url || "N/A";
  const userAgent = params.metadata?.user_agent || "N/A";
  const timestamp = params.metadata?.timestamp || new Date().toISOString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ElektroSmart Feedback</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                      ${typeInfo.icon} ElektroSmart PRO
                    </h1>
                    <p style="margin: 8px 0 0 0; color: #E0E7FF; font-size: 14px;">
                      Nowa wiadomość od użytkownika
                    </p>
                  </td>
                </tr>

                <!-- Type Badge -->
                <tr>
                  <td style="padding: 24px 40px 16px 40px;">
                    <div style="display: inline-block; background-color: ${typeInfo.color}15; border: 2px solid ${typeInfo.color}; border-radius: 8px; padding: 8px 16px;">
                      <span style="color: ${typeInfo.color}; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${typeInfo.icon} ${typeInfo.label}
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- User Info -->
                <tr>
                  <td style="padding: 16px 40px;">
                    <table width="100%" cellpadding="8" cellspacing="0" style="background-color: #F1F5F9; border-radius: 8px;">
                      <tr>
                        <td style="color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                          Od użytkownika:
                        </td>
                        <td style="color: #1E293B; font-size: 14px; font-weight: 600; text-align: right;">
                          ${userInfo}
                        </td>
                      </tr>
                      ${params.contactEmail ? `
                      <tr>
                        <td style="color: #64748B; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding-top: 8px;">
                          Email kontaktowy:
                        </td>
                        <td style="color: #3B82F6; font-size: 14px; font-weight: 600; text-align: right; padding-top: 8px;">
                          <a href="mailto:${params.contactEmail}" style="color: #3B82F6; text-decoration: none;">
                            ${params.contactEmail}
                          </a>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>

                <!-- Message Content -->
                <tr>
                  <td style="padding: 16px 40px;">
                    <h3 style="margin: 0 0 12px 0; color: #1E293B; font-size: 16px; font-weight: 700;">
                      📝 Treść wiadomości:
                    </h3>
                    <div style="background-color: #F8FAFC; border-left: 4px solid ${typeInfo.color}; padding: 20px; border-radius: 8px; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
${params.message}
                    </div>
                  </td>
                </tr>

                <!-- Metadata -->
                <tr>
                  <td style="padding: 16px 40px 32px 40px;">
                    <h3 style="margin: 0 0 12px 0; color: #1E293B; font-size: 14px; font-weight: 700;">
                      🔍 Metadane:
                    </h3>
                    <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px; color: #64748B; border-top: 1px solid #E2E8F0;">
                      <tr style="border-bottom: 1px solid #E2E8F0;">
                        <td style="font-weight: 600; padding: 8px 0;">Strona:</td>
                        <td style="text-align: right; color: #475569; padding: 8px 0;">${pageUrl}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #E2E8F0;">
                        <td style="font-weight: 600; padding: 8px 0;">Przeglądarka:</td>
                        <td style="text-align: right; color: #475569; padding: 8px 0; font-size: 11px;">${userAgent.substring(0, 80)}${userAgent.length > 80 ? "..." : ""}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: 600; padding: 8px 0;">Data i czas:</td>
                        <td style="text-align: right; color: #475569; padding: 8px 0;">${new Date(timestamp).toLocaleString("pl-PL", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Attachments -->
                ${(params.attachmentUrls && params.attachmentUrls.length > 0) ? `
                <tr>
                  <td style="padding: 16px 40px 8px 40px;">
                    <h3 style="margin: 0 0 12px 0; color: #1E293B; font-size: 14px; font-weight: 700;">📎 Załączniki (${params.attachmentUrls.length}):</h3>
                    <table cellpadding="0" cellspacing="8" style="width: 100%;">
                      <tr>
                        ${params.attachmentUrls.map((url, i) => `
                          <td style="vertical-align: top; width: 33%;">
                            <a href="${url}" target="_blank" style="display: block; text-decoration: none;">
                              <img src="${url}" alt="Zdjęcie ${i + 1}" style="width: 100%; max-width: 160px; height: 120px; object-fit: cover; border-radius: 8px; border: 2px solid #E2E8F0;" />
                              <p style="margin: 4px 0 0 0; color: #3B82F6; font-size: 11px; text-align: center;">Otwórz pełny rozmiar</p>
                            </a>
                          </td>
                        `).join('')}
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F8FAFC; padding: 24px 40px; text-align: center; border-top: 1px solid #E2E8F0;">
                    <p style="margin: 0; color: #94A3B8; font-size: 12px;">
                      Ta wiadomość została automatycznie wygenerowana przez system ElektroSmart PRO
                    </p>
                    <p style="margin: 8px 0 0 0; color: #CBD5E1; font-size: 11px;">
                      © ${new Date().getFullYear()} ElektroSmart PRO. Wszystkie prawa zastrzeżone.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Submit user feedback (bug report, feature request, or contact message)
 * Can be called by authenticated users or guests
 */
export async function submitFeedback(
  params: SubmitFeedbackParams
): Promise<SubmitFeedbackResult> {
  try {
    const supabase = await createClient();
    
    // Get current user (may be null for guests)
    const { data: { user } } = await supabase.auth.getUser();

    // Validate input with Zod
    const { data: validatedInput, error: validationError } = validate(feedbackSchema, params);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Insert feedback to Supabase
    const feedbackMetadata = {
      ...(params.metadata || {}),
      ...(params.attachmentUrls && params.attachmentUrls.length > 0
        ? { attachments: params.attachmentUrls.join(",") }
        : {}),
    };

    const { error } = await supabase.from("feedback").insert({
      user_id: user?.id || null,
      type: params.type,
      message: params.message.trim(),
      contact_email: params.contactEmail || null,
      metadata: feedbackMetadata,
    });

    if (error) {
      logger.error("Error submitting feedback", { type: params.type }, error);
      return {
        success: false,
        error: "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
      };
    }

    // Send email notification to admin (non-blocking, errors won't affect user experience)
    try {
      const emailHtml = generateFeedbackEmailHTML({
        type: params.type,
        message: params.message.trim(),
        contactEmail: params.contactEmail,
        userEmail: user?.email,
        metadata: params.metadata,
        attachmentUrls: params.attachmentUrls,
      });

      const typeLabels: Record<FeedbackType, string> = {
        bug: "Zgłoszenie Błędu",
        feature: "Propozycja Funkcji",
        contact: "Kontakt",
      };

      await getResend().emails.send({
        from: "ElektroSmart PRO <onboarding@resend.dev>", // Resend verified sender
        to: "elektrosmartpro@gmail.com",
        subject: `[ElektroSmart Feedback] ${typeLabels[params.type]}: Nowa wiadomość od użytkownika`,
        html: emailHtml,
      });

    } catch (emailError) {
      // Log error but don't fail the request - data is already safe in Supabase
      logger.error("Failed to send email notification (non-critical)", { type: params.type }, emailError);
    }

    // Revalidate feedback page if it exists
    revalidatePath("/dashboard/feedback");

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Unexpected error submitting feedback", {}, error);
    return {
      success: false,
      error: "Wystąpił nieoczekiwany błąd.",
    };
  }
}

/**
 * Get user's own feedback (for "My Feedback" page)
 * Only returns feedback submitted by the current user
 */
export async function getUserFeedback() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: [],
        error: "Musisz być zalogowany, aby zobaczyć swoje wiadomości.",
      };
    }

    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Error fetching user feedback", {}, error);
      return {
        data: [],
        error: "Nie udało się pobrać wiadomości.",
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    logger.error("Unexpected error fetching user feedback", {}, error);
    return {
      data: [],
      error: "Wystąpił nieoczekiwany błąd.",
    };
  }
}

/**
 * Upload a single attachment file for feedback (images only, max 5MB)
 * Returns the public URL of the uploaded file
 */
export async function uploadFeedbackAttachment(
  formData: FormData
): Promise<UploadAttachmentResult> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "Musisz być zalogowany, aby przesłać załącznik." };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { error: "Brak pliku." };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type)) {
      return { error: "Dozwolone formaty: JPG, PNG, WebP, GIF." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { error: "Plik jest za duży. Maksymalny rozmiar to 5MB." };
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("feedback-attachments")
      .upload(path, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      logger.error("Failed to upload feedback attachment", {}, uploadError);
      return { error: "Nie udało się przesłać pliku." };
    }

    const { data: { publicUrl } } = supabase.storage
      .from("feedback-attachments")
      .getPublicUrl(path);

    return { url: publicUrl, path };
  } catch (error) {
    logger.error("Unexpected error uploading feedback attachment", {}, error);
    return { error: "Wystąpił błąd podczas przesyłania pliku." };
  }
}
