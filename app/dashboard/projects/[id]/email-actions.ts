"use server";

import { logger } from "@/lib/logger";
import { Resend } from "resend";
import { requireAuth } from "@/lib/auth";

import { revalidatePath } from "next/cache";
import { fillTemplate } from "@/lib/email-templates";
import { rateLimitEmail } from "@/lib/rate-limit";
import * as XLSX from "xlsx-js-style";
import { flattenProjectItems } from "@/lib/utils/flatten-project-items";
import type { ProjectItem } from "@/lib/types/database";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(key);
}

interface SendProjectEmailInput {
  projectId: string;
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  subject: string;
  body: string;
  templateType: string;
  visualTemplate?: string;
  attachPdf?: boolean;
}

// 5 Visual email HTML palettes
const EMAIL_VISUAL_PALETTES: Record<string, {
  headerGradient: string;
  accent: string;
  accentLight: string;
  pillBg: string;
  pillBorder: string;
  separatorGradient: string;
  contentBorder: string;
  attachIconGradient: string;
  footerBg: string;
  footerBorder: string;
  footerText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}> = {
  klasyczny: {
    headerGradient: "linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)",
    accent: "#64748b",
    accentLight: "#94a3b8",
    pillBg: "rgba(255,255,255,0.12)",
    pillBorder: "rgba(255,255,255,0.18)",
    separatorGradient: "linear-gradient(90deg, #64748b 0%, #94a3b8 100%)",
    contentBorder: "#64748b",
    attachIconGradient: "linear-gradient(135deg, #475569 0%, #64748b 100%)",
    footerBg: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
    footerBorder: "#e2e8f0",
    footerText: "#64748b",
    badgeBg: "#ecfdf5",
    badgeText: "#059669",
    badgeBorder: "#d1fae5",
  },
  nowoczesny: {
    headerGradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #5eead4 100%)",
    accent: "#0d9488",
    accentLight: "#14b8a6",
    pillBg: "rgba(255,255,255,0.15)",
    pillBorder: "rgba(255,255,255,0.22)",
    separatorGradient: "linear-gradient(90deg, #0d9488 0%, #5eead4 100%)",
    contentBorder: "#0d9488",
    attachIconGradient: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
    footerBg: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)",
    footerBorder: "#99f6e4",
    footerText: "#0d9488",
    badgeBg: "#f0fdfa",
    badgeText: "#0d9488",
    badgeBorder: "#99f6e4",
  },
  elegancki: {
    headerGradient: "linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)",
    accent: "#b8860b",
    accentLight: "#d4a843",
    pillBg: "rgba(184,134,11,0.15)",
    pillBorder: "rgba(184,134,11,0.30)",
    separatorGradient: "linear-gradient(90deg, #b8860b 0%, #d4a843 100%)",
    contentBorder: "#b8860b",
    attachIconGradient: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
    footerBg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    footerBorder: "#fde68a",
    footerText: "#92400e",
    badgeBg: "#fffbeb",
    badgeText: "#92400e",
    badgeBorder: "#fde68a",
  },
  korporacyjny: {
    headerGradient: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)",
    accent: "#2563eb",
    accentLight: "#3b82f6",
    pillBg: "rgba(255,255,255,0.15)",
    pillBorder: "rgba(255,255,255,0.25)",
    separatorGradient: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)",
    contentBorder: "#2563eb",
    attachIconGradient: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)",
    footerBg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
    footerBorder: "#bfdbfe",
    footerText: "#1e40af",
    badgeBg: "#eff6ff",
    badgeText: "#1e40af",
    badgeBorder: "#bfdbfe",
  },
  premium: {
    headerGradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #a78bfa 100%)",
    accent: "#7c3aed",
    accentLight: "#a78bfa",
    pillBg: "rgba(255,255,255,0.15)",
    pillBorder: "rgba(255,255,255,0.22)",
    separatorGradient: "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)",
    contentBorder: "#7c3aed",
    attachIconGradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    footerBg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    footerBorder: "#c4b5fd",
    footerText: "#5b21b6",
    badgeBg: "#f5f3ff",
    badgeText: "#5b21b6",
    badgeBorder: "#c4b5fd",
  },
};

/**
 * Send project estimate email to client
 */
export async function sendProjectEmail(input: SendProjectEmailInput) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Musisz być zalogowany" };
    }

    // Rate limit: max 10 emails per minute per user
    const rl = rateLimitEmail(user.id);
    if (!rl.allowed) {
      const retrySec = Math.ceil((rl.retryAfterMs || 60000) / 1000);
      return { success: false, error: `Zbyt wiele emaili. Spróbuj ponownie za ${retrySec}s.` };
    }

    // Get project details (include region for Iron Rule: regionModifier applies to labor)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, regions ( price_modifier )")
      .eq("id", input.projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return { success: false, error: "Nie znaleziono projektu" };
    }

    // Get user profile for sender info (including logo and PRO status)
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, phone, email, logo_url, address, nip, is_pro")
      .eq("id", user.id)
      .single();

    const isPro = profile?.is_pro || false;
    const regionModifier = (project.regions as { price_modifier: number } | null)?.price_modifier ?? 1.0;

    // Prepare email content with variables filled
    const offerNumber = `OF-${project.id.substring(0, 8).toUpperCase()}`;
    const variables = {
      clientName: input.recipientName,
      projectName: project.name,
      totalAmount: isPro ? (project.total_price_with_margin?.toFixed(2) || "0.00") : "*** zł",
      userName: input.senderName || profile?.company_name || "ElektroSmart PRO",
      companyName: profile?.company_name || "",
      userEmail: profile?.email || user.email || "",
      userPhone: profile?.phone || "",
      offerNumber: offerNumber,
      sentDate: new Date().toLocaleDateString("pl-PL"),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("pl-PL"),
      startDate: project.deadline ? new Date(project.deadline).toLocaleDateString("pl-PL") : "Do ustalenia",
      duration: project.deadline ? "Zgodnie z terminem" : "Do ustalenia",
    };

    const filledSubject = fillTemplate(input.subject, variables);
    const filledBody = fillTemplate(input.body, variables);

    // Convert markdown-style formatting to HTML
    const htmlBody = filledBody
      .split('\n')
      .map(line => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return line;
      })
      .join('<br />');

    // Always attach PDF and Excel files
    const attachments: Array<{ filename: string; content: string }> = [];

    // Generate attachments
    {
      try {
        
        // Get project items for Excel
        const { data: items } = await supabase
          .from("project_items")
          .select("*")
          .eq("project_id", input.projectId)
          .order("created_at");

        // Generate PDF via direct import (avoid server-side fetch issues)
        
        try {
          // Import PDF generator directly
          const { POST: generatePDF } = await import('@/app/api/pdf/route');
          
          // Create mock request
          const mockRequest = new Request('http://localhost/api/pdf', {
            method: 'POST',
            body: JSON.stringify({
              projectId: input.projectId,
              priceModifier: project.adjustment_percentage || 0,
              showColors: false,
              notes: project.pdf_notes || "",
              vatMode: project.vat_rate ?? 23,
              priceDisplay: "netto",
            }),
          });
          
          const pdfResponse = await generatePDF(mockRequest);
          
          if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.arrayBuffer();
            const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
            
            const pdfFileName = `Kosztorys_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
            attachments.push({
              filename: pdfFileName,
              content: base64Pdf,
            });

            // Save PDF copy to project storage for client portal
            try {
              const { saveGeneratedDocumentToProject } = await import("./document-actions");
              await saveGeneratedDocumentToProject(input.projectId, base64Pdf, pdfFileName, "application/pdf");
            } catch { /* non-critical */ }
          } else {
            logger.error("PDF generation returned non-OK status:", {}, pdfResponse.status);
          }
        } catch (pdfError) {
          logger.error("PDF generation error:", {}, pdfError);
          // Continue without PDF if generation fails
        }

        // Generate Excel file (professional format with xlsx library)
        if (items && items.length > 0) {
          try {
            const flatItems = flattenProjectItems(items as unknown as ProjectItem[]) as typeof items;
            const parentAssemblyIds = new Set(
              flatItems
                .filter(i => (i as unknown as Record<string, unknown>).parent_assembly_id)
                .map(i => (i as unknown as Record<string, unknown>).parent_assembly_id as string)
            );

            // Create workbook
            const workbook = XLSX.utils.book_new();

            // Calculate totals — apply adjustment + region modifier (Iron Rule: region only on labor)
            const getMaterialPrice = (item: { final_material_price?: number | null; material_price?: number | null }) => Number(item.final_material_price || item.material_price || 0);
            const getLaborPrice = (item: { final_labor_price?: number | null; labor_price?: number | null }) => Number(item.final_labor_price || item.labor_price || 0);
            const adjMult = 1 + (project.adjustment_percentage || 0) / 100;

            // Iron Rule: regionModifier applies to labor only, material is sovereign
            // For totals, skip assembly parents (their value comes from children)
            const materialTotal = flatItems.reduce((sum, item) => parentAssemblyIds.has(item.id) ? sum : sum + (getMaterialPrice(item) * item.quantity * adjMult), 0);
            const laborTotal = flatItems.reduce((sum, item) => parentAssemblyIds.has(item.id) ? sum : sum + (getLaborPrice(item) * item.quantity * adjMult * regionModifier), 0);
            const subtotal = materialTotal + laborTotal;
            const vatRate = project.vat_rate || 23;
            const vatAmount = (subtotal * vatRate) / 100;
            const grandTotal = subtotal + vatAmount;

            // Build Excel data
            const allData: (string | number | undefined)[][] = [];

            // 1. PROJECT HEADER
            allData.push(['KOSZTORYS INSTALACJI ELEKTRYCZNEJ']);
            allData.push([]);
            
            // 2. COMPANY INFO (USER'S COMPANY)
            allData.push(['FIRMA WYKONAWCY']);
            allData.push(['Nazwa:', profile?.company_name || user.email?.split('@')[0] || 'Firma']);
            if (profile?.nip) allData.push(['NIP:', profile.nip]);
            if (profile?.address) allData.push(['Adres:', profile.address]);
            if (profile?.phone) allData.push(['Telefon:', profile.phone]);
            if (profile?.email || user.email) allData.push(['Email:', profile?.email || user.email]);
            allData.push([]);
            
            // 3. PROJECT INFO
            allData.push(['PROJEKT:', project.name, '', 'Data:', new Date().toLocaleDateString('pl-PL')]);
            allData.push([]);

            // 4. CLIENT INFO
            allData.push(['KLIENT']);
            allData.push(['Nazwa:', input.recipientName]);
            allData.push(['Email:', input.recipientEmail]);
            allData.push([]);
            allData.push([]);

            // 5. ITEMS TABLE HEADER
            allData.push(['Lp.', 'Pozycja', 'Jednostka', 'Ilość', 'Cena materiału (zł)', 'Cena robocizny (zł)', 'Wartość netto (zł)']);

            // 6. ITEMS DATA
            let itemCounter = 1;
            flatItems.forEach((item) => {
              const raw = item as unknown as Record<string, unknown>;
              const isChild = !!raw.parent_assembly_id;
              const isParent = parentAssemblyIds.has(item.id);
              const materialPrice = getMaterialPrice(item) * adjMult;
              // Iron Rule: regionModifier on labor only
              const laborPrice = getLaborPrice(item) * adjMult * regionModifier;
              const totalPrice = (materialPrice + laborPrice) * item.quantity;

              if (isParent) {
                // Assembly parent: show as header row with children's combined total
                const children = flatItems.filter(c => (c as unknown as Record<string, unknown>).parent_assembly_id === item.id);
                const childTotal = children.reduce((acc, c) => {
                  const cm = getMaterialPrice(c) * adjMult;
                  const cl = getLaborPrice(c) * adjMult * regionModifier;
                  return acc + (cm + cl) * c.quantity;
                }, 0);
                allData.push([
                  itemCounter++,
                  `>> ${item.name}`,
                  item.unit || 'szt',
                  item.quantity,
                  '---',
                  '---',
                  isPro ? childTotal.toFixed(2) : '*** zl',
                ]);
              } else {
                allData.push([
                  isChild ? '' : itemCounter++,
                  isChild ? `  \u21b3 ${item.name}` : item.name,
                  item.unit || 'szt',
                  item.quantity,
                  isPro ? materialPrice.toFixed(2) : '*** zl',
                  isPro ? laborPrice.toFixed(2) : '*** zl',
                  isPro ? totalPrice.toFixed(2) : '*** zl',
                ]);
              }
            });

            // 7. SUMMARY
            allData.push([]);
            allData.push([]);
            const fM = (v: number) => isPro ? `${v.toFixed(2)} zł` : '*** zł';
            allData.push(['', '', '', '', '', 'Materiały:', fM(materialTotal)]);
            allData.push(['', '', '', '', '', 'Robocizna:', fM(laborTotal)]);
            allData.push(['', '', '', '', '', 'Suma netto:', fM(subtotal)]);
            allData.push(['', '', '', '', '', `VAT (${vatRate}%):`, fM(vatAmount)]);
            allData.push([]);
            allData.push(['', '', '', '', '', 'SUMA BRUTTO:', fM(grandTotal)]);

            // Create worksheet from data
            const ws = XLSX.utils.aoa_to_sheet(allData);
            
            // Set column widths for better readability
            ws['!cols'] = [
              { wch: 5 },  // Lp.
              { wch: 35 }, // Pozycja
              { wch: 10 }, // Jednostka
              { wch: 8 },  // Ilość
              { wch: 18 }, // Cena materiału
              { wch: 18 }, // Cena robocizny
              { wch: 18 }, // Wartość netto
            ];

            XLSX.utils.book_append_sheet(workbook, ws, 'Kosztorys');

            // Generate Excel file as buffer
            const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
            const base64Excel = Buffer.from(excelBuffer).toString('base64');
            
            const excelFileName = `Kosztorys_Excel_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
            attachments.push({
              filename: excelFileName,
              content: base64Excel,
            });

            // Save Excel copy to project storage for client portal
            try {
              const { saveGeneratedDocumentToProject } = await import("./document-actions");
              await saveGeneratedDocumentToProject(input.projectId, base64Excel, excelFileName, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            } catch { /* non-critical */ }
            
          } catch (excelError) {
            logger.error("Excel generation error:", {}, excelError);
            // Continue without Excel if generation fails
          }
        }

        // Attach calculator PDFs + panel SVGs from project documents
        try {
          const { data: docs } = await supabase.storage
            .from("project-documents")
            .list(`${input.projectId}/client`, { sortBy: { column: "created_at", order: "desc" } });

          const attachableDocs = docs?.filter((d) =>
            d.name.includes("Obliczenia_") || d.name.includes("Rozdzielnica_") || d.name.includes("Protokol_")
          ) || [];

          for (const doc of attachableDocs) {
            try {
              const { data: fileData } = await supabase.storage
                .from("project-documents")
                .download(`${input.projectId}/client/${doc.name}`);
              if (fileData) {
                const buffer = Buffer.from(await fileData.arrayBuffer());
                attachments.push({
                  filename: doc.name,
                  content: buffer.toString("base64"),
                });
              }
            } catch (docErr) {
              logger.error(`Failed to download document ${doc.name}:`, {}, docErr);
            }
          }
        } catch (calcDocsError) {
          logger.error("Failed to list project documents:", {}, calcDocsError);
        }

      } catch (attachError) {
        logger.error("Failed to generate attachments:", {}, attachError);
        // Continue without attachments if generation fails
      }
    }

    // Validate reply-to email and use fallback
    const validateEmail = (email: string | null | undefined): boolean => {
      if (!email) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const replyToEmail = validateEmail(profile?.email) 
      ? profile!.email 
      : validateEmail(user.email) 
        ? user.email 
        : undefined;

    // Send email via Resend
    // Using verified domain: elektrosmart.pro ✅
    
    // Resolve visual palette
    const p = EMAIL_VISUAL_PALETTES[input.visualTemplate || "klasyczny"] || EMAIL_VISUAL_PALETTES.klasyczny;

    const emailResponse = await getResend().emails.send({
      from: `${profile?.company_name || "ElektroSmart PRO"} <noreply@elektrosmart.pro>`,
      to: input.recipientEmail,
      replyTo: replyToEmail,
      subject: filledSubject,
      attachments: attachments.length > 0 ? attachments : undefined,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f2f5;">
          <div style="max-width: 680px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <div style="background: ${p.headerGradient}; padding: 45px 40px; position: relative;">
              
              <!-- Subtle Pattern Overlay -->
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px); opacity: 0.5;"></div>
              
              <!-- Logo Section -->
              ${profile?.logo_url ? `
                <div style="text-align: center; margin-bottom: 28px; position: relative; z-index: 1;">
                  <div style="background: white; padding: 22px 30px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <img src="${profile.logo_url}" alt="Logo firmy" style="max-width: 240px; max-height: 90px; height: auto; display: block;" />
                  </div>
                </div>
              ` : ''}
              
              <!-- Company Name -->
              <div style="text-align: center; position: relative; z-index: 1;">
                <h1 style="color: #ffffff; margin: 0 0 22px 0; font-size: 32px; font-weight: 600; letter-spacing: -0.3px;">
                  ${profile?.company_name || 'Firma Wykonawcza'}
                </h1>
                
                <!-- Contact Info Pills -->
                <div style="margin-top: 22px; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;">
                  ${profile?.phone ? `
                    <div style="background: ${p.pillBg}; padding: 8px 16px; border-radius: 6px; border: 1px solid ${p.pillBorder};">
                      <span style="color: #ffffff; font-size: 14px; font-weight: 500;">
                        📞 ${profile.phone}
                      </span>
                    </div>
                  ` : ''}
                  ${profile?.email || user.email ? `
                    <div style="background: ${p.pillBg}; padding: 8px 16px; border-radius: 6px; border: 1px solid ${p.pillBorder};">
                      <span style="color: #ffffff; font-size: 14px; font-weight: 500;">
                        ✉️ ${profile?.email || user.email}
                      </span>
                    </div>
                  ` : ''}
                  <div style="background: ${p.pillBg}; padding: 8px 16px; border-radius: 6px; border: 1px solid ${p.pillBorder};">
                    <span style="color: #ffffff; font-size: 14px; font-weight: 600;">
                      📋 Oferta: ${offerNumber}
                    </span>
                  </div>
                </div>
                
                ${profile?.address || profile?.nip ? `
                  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.12);">
                    <div style="color: rgba(255,255,255,0.9); font-size: 13px; line-height: 1.6;">
                      ${profile?.address ? `<div style="margin: 2px 0;">${profile.address}</div>` : ''}
                      ${profile?.nip ? `<div style="margin: 2px 0;">NIP: ${profile.nip}</div>` : ''}
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 40px 45px 40px; background: #ffffff;">
              
              <!-- Greeting -->
              <div style="margin-bottom: 32px;">
                <h2 style="color: #1e293b; margin: 0 0 8px 0; font-size: 22px; font-weight: 600;">
                  Dzień dobry, ${input.recipientName}
                </h2>
                <div style="width: 50px; height: 3px; background: ${p.separatorGradient}; border-radius: 2px;"></div>
              </div>
              
              <!-- Offer Content -->
              <div style="background: #f8fafc; padding: 28px; border-radius: 6px; border-left: 4px solid ${p.contentBorder}; margin-bottom: 28px;">
                <div style="color: #334155; line-height: 1.8; font-size: 15px;">
                  ${htmlBody || '<p style="color: #dc2626;"><strong>Błąd:</strong> Treść emaila jest pusta.</p>'}
                </div>
              </div>

              <!-- Attachments Section -->
              ${attachments.length > 0 ? `
              <div style="background: #f8fafc; padding: 24px; border-radius: 6px; margin-bottom: 28px; border: 1px solid #e2e8f0;">
                <div style="margin-bottom: 16px;">
                  <h3 style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 600; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">📎</span> Załączone dokumenty
                  </h3>
                </div>
                <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0;">
                  ${attachments.map(a => `
                    <div style="display: flex; align-items: center; padding: 12px; margin-bottom: 8px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
                      <div style="background: ${p.attachIconGradient}; color: white; width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">
                        ${a.filename.endsWith('.pdf') ? '📄' : '📊'}
                      </div>
                      <div style="flex: 1;">
                        <div style="color: #1e293b; font-weight: 600; font-size: 14px;">${a.filename}</div>
                        <div style="color: ${p.accent}; font-size: 12px; margin-top: 2px;">${a.filename.endsWith('.pdf') ? 'Dokument PDF' : 'Arkusz Excel'}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <div style="margin-top: 12px; padding: 10px; background: ${p.badgeBg}; border-radius: 6px; text-align: center; border: 1px solid ${p.badgeBorder};">
                  <span style="color: ${p.badgeText}; font-size: 13px; font-weight: 500;">
                    ✓ Wygenerowano za pomocą ElektroSmart PRO
                  </span>
                </div>
              </div>
              ` : ''}

              <!-- Separator -->
              <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%); margin: 32px 0;"></div>

              <!-- Professional Footer -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid ${p.footerBorder};">
                <div style="background: ${p.footerBg}; padding: 20px; border-radius: 6px; border: 1px solid ${p.footerBorder};">
                  <div style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: ${p.footerText}; font-size: 13px; font-weight: 600;">
                      ${profile?.company_name || 'Firma Wykonawcza'}
                    </p>
                    ${profile?.address ? `
                      <p style="margin: 0 0 4px 0; color: ${p.accentLight}; font-size: 12px;">
                        ${profile.address}
                      </p>
                    ` : ''}
                    ${profile?.nip ? `
                      <p style="margin: 0 0 12px 0; color: ${p.accentLight}; font-size: 12px;">
                        NIP: ${profile.nip}
                      </p>
                    ` : ''}
                    <div style="height: 1px; background: linear-gradient(90deg, transparent 0%, ${p.footerBorder} 50%, transparent 100%); margin: 12px 0;"></div>
                    <p style="margin: 0; color: #cbd5e1; font-size: 11px;">
                      ElektroSmart PRO
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Check for Resend errors
    if (emailResponse.error) {
      logger.error("Resend API error:", {}, emailResponse.error);
      
      // Log failed email attempt to database
      await supabase.from("email_logs").insert({
        user_id: user.id,
        project_id: input.projectId,
        recipient_email: input.recipientEmail,
        recipient_name: input.recipientName,
        subject: filledSubject,
        template_type: input.templateType,
        status: 'failed',
        error_message: JSON.stringify(emailResponse.error),
        sent_at: new Date().toISOString(),
      });
      
      throw new Error(`Resend API error: ${JSON.stringify(emailResponse.error)}`);
    }

    if (!emailResponse.data) {
      logger.error("No data in response", {});
      throw new Error("Resend API returned no data");
    }

    // Save successful email to email_logs table
    const { error: logError } = await supabase.from("email_logs").insert({
      user_id: user.id,
      project_id: input.projectId,
      recipient_email: input.recipientEmail,
      recipient_name: input.recipientName,
      subject: filledSubject,
      template_type: input.templateType,
      status: 'sent',
      resend_id: emailResponse.data.id,
      sent_at: new Date().toISOString(),
    });

    if (logError) {
      logger.error("Failed to save email log:", {}, logError);
      // Don't fail the whole operation if logging fails
    } else {
    }

    revalidatePath(`/dashboard/projects/${input.projectId}`);
    revalidatePath(`/dashboard/sent-offers`);

    return {
      success: true,
      messageId: emailResponse.data.id,
      message: "Email został wysłany pomyślnie",
    };
  } catch (error) {
    logger.error("sendProjectEmail error:", {}, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Nie udało się wysłać emaila",
    };
  }
}
