"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { logger } from "@/lib/logger";
import { Resend } from "resend";

// ============================================
// SUPABASE JOIN TYPES
// ============================================

interface OfferLinkProject {
  name: string;
}

interface OfferLinkWithProject {
  id: string;
  user_id: string;
  project_id: string;
  recipient_name: string | null;
  expires_at: string | null;
  status: string;
  viewed_at: string | null;
  negotiation_round?: number;
  projects: OfferLinkProject | null;
}

// ============================================
// NEGOTIATION TYPES
// ============================================

export interface ProposedItemChange {
  quantity?: number;
  materialPrice?: number;
  laborPrice?: number;
}

export interface ProposedChanges {
  items: Record<string, ProposedItemChange>;
  comment?: string;
  submittedAt: string;
}

export interface ContractorResponse {
  action: "accept" | "reject" | "counter";
  items?: Record<string, ProposedItemChange>;
  comment?: string;
  respondedAt: string;
}

// ============================================
// OFFER DATA
// ============================================

export interface OfferData {
  id: string;
  token: string;
  projectName: string;
  projectId: string;
  recipientName: string | null;
  recipientEmail: string | null;
  status: string;
  clientComment: string | null;
  signatureUrl: string | null;
  signedAt: string | null;
  viewedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  ownerName: string | null;
  ownerCompany: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  ownerLogo: string | null;
  isDemo: boolean;
  proposedChanges: ProposedChanges | null;
  contractorResponse: ContractorResponse | null;
  negotiationRound: number;
  items: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    materialPrice: number;
    laborPrice: number;
    totalPrice: number;
    section: string | null;
    isAssemblyChild: boolean;
  }[];
  totalAmount: number;
  vatRate: number;
  materialsOwnedByCustomer: boolean;
  portfolioItems: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    completion_date: string | null;
    category: string;
    images: string[];
  }[];
  documents: {
    name: string;
    path: string;
    size: number;
    mimetype: string;
  }[];
}

export async function getOfferByToken(token: string): Promise<{ offer?: OfferData; error?: string }> {
  // Use admin client — client portal is public (no auth session)
  // Fetch offer link
  const { data: link, error: linkError } = await supabaseAdmin
    .from("offer_links")
    .select("*, projects(id, name, vat_rate, materials_owned_by_customer, adjustment_percentage, mat_markup_pct, lab_markup_pct, complexity_factor, contingency_pct, region_id, regions(price_modifier))")
    .eq("token", token)
    .single();

  if (linkError || !link) {
    return { error: "Nie znaleziono oferty lub link wygasł" };
  }

  // Check expiry
  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return { error: "Link do oferty wygasł. Skontaktuj się z wykonawcą." };
  }

  // Mark as viewed if first time + notify contractor
  if (!link.viewed_at) {
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("offer_links")
      .update({ viewed_at: now, status: "viewed" })
      .eq("id", link.id);

    const project = link.projects as { name?: string } | null;
    const projectName = project?.name ?? "projekt";
    const recipientLabel = link.recipient_name ? ` przez ${link.recipient_name}` : "";

    await supabaseAdmin.from("notifications").insert({
      user_id: link.user_id,
      type: "info",
      title: "Oferta otwarta",
      message: `Oferta dla „${projectName}" została otwarta${recipientLabel}.`,
      read: false,
      action_url: `/dashboard/projects/${link.project_id}`,
      action_label: "Otwórz projekt",
      data: { offer_link_id: link.id, project_id: link.project_id },
    });
  }

  // Get owner profile (including is_pro to enforce demo mode)
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, company_name, phone, email, logo_url, is_pro, portfolio_visible, portfolio_limit")
    .eq("id", link.user_id)
    .single();

  // Fetch portfolio items if visible
  let portfolioItems: OfferData["portfolioItems"] = [];
  if (profile?.portfolio_visible !== false) {
    const portfolioLimit = profile?.portfolio_limit ?? 5;
    const { data: portfolio } = await supabaseAdmin
      .from("portfolio_items")
      .select("id, title, description, location, completion_date, category, images")
      .eq("user_id", link.user_id)
      .eq("is_public", true)
      .order("sort_order", { ascending: true })
      .limit(portfolioLimit);
    portfolioItems = (portfolio || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      location: p.location,
      completion_date: p.completion_date,
      category: p.category,
      images: p.images || [],
    }));
  }

  const isOwnerPro = profile?.is_pro || false;

  // Fetch project documents from storage (client subfolder)
  let projectDocuments: OfferData["documents"] = [];
  try {
    const { data: docList } = await supabaseAdmin.storage
      .from("project-documents")
      .list(`${link.project_id}/client`, { sortBy: { column: "created_at", order: "desc" } });

    if (docList) {
      projectDocuments = docList
        .filter(f => f.name && !f.name.startsWith("."))
        .map(f => ({
          name: f.name,
          path: `${link.project_id}/client/${f.name}`,
          size: (f.metadata as { size?: number } | undefined)?.size ?? 0,
          mimetype: (f.metadata as { mimetype?: string } | undefined)?.mimetype ?? "application/octet-stream",
        }));
    }
  } catch (docErr) {
    logger.error("Error fetching project documents for offer", { token }, docErr instanceof Error ? docErr : new Error(String(docErr)));
  }

  // Get project items (only show name, unit, quantity, and total price — no internal pricing)
  const { data: items } = await supabaseAdmin
    .from("project_items")
    .select("id, name, unit, quantity, final_material_price, final_labor_price, material_price, labor_price, is_assembly_child, parent_assembly_id, section, confidence_level")
    .eq("project_id", link.project_id)
    .order("sort_order");

  const project = link.projects as {
    id: string; name: string; vat_rate?: number;
    materials_owned_by_customer?: boolean; adjustment_percentage?: number;
    mat_markup_pct?: number; lab_markup_pct?: number;
    complexity_factor?: number; contingency_pct?: number;
    regions?: { price_modifier?: number } | null;
  } | null;
  const materialsOwnedByCustomer = project?.materials_owned_by_customer || false;
  const adjMult = 1 + (project?.adjustment_percentage || 0) / 100;
  // v10.5 FIX: Apply v3.0 multipliers — must match project-summary.tsx and PDF route
  const matMarkupMult   = 1 + (project?.mat_markup_pct || 0) / 100;
  const labMarkupMult   = 1 + (project?.lab_markup_pct || 0) / 100;
  const complexityFactor = (project?.complexity_factor as number | undefined) || 1.0;
  const regionModifier  = project?.regions?.price_modifier ?? 1.0;

  const allItems = items || [];

  // Build a map of parent_id -> sum of children prices
  const childSums = new Map<string, { mat: number; lab: number }>();
  for (const i of allItems) {
    if (i.is_assembly_child && i.parent_assembly_id) {
      const mat = i.final_material_price ?? i.material_price ?? 0;
      const lab = i.final_labor_price ?? i.labor_price ?? 0;
      const effectiveMat = materialsOwnedByCustomer ? 0 : mat;
      const isManual = (i as Record<string, unknown>).confidence_level === "manual";
      const effRegion = isManual ? 1.0 : regionModifier;
      const existing = childSums.get(i.parent_assembly_id) || { mat: 0, lab: 0 };
      existing.mat += effectiveMat * i.quantity * matMarkupMult * adjMult;
      existing.lab += lab * i.quantity * labMarkupMult * complexityFactor * adjMult * effRegion;
      childSums.set(i.parent_assembly_id, existing);
    }
  }

  const projectItems = allItems.map(i => {
    const mat = i.final_material_price ?? i.material_price ?? 0;
    const lab = i.final_labor_price ?? i.labor_price ?? 0;
    const effectiveMat = materialsOwnedByCustomer ? 0 : mat;
    const isParent = !i.is_assembly_child && childSums.has(i.id);
    const isManual = (i as Record<string, unknown>).confidence_level === "manual";
    const effRegion = isManual ? 1.0 : regionModifier;

    // For assembly parents: show sum of children as their displayed price
    // v10.5: Material × matMarkupMult × adjMult | Labor × labMarkupMult × complexity × adjMult × region
    const displayMat = isParent ? (childSums.get(i.id)?.mat ?? 0) : effectiveMat * i.quantity * matMarkupMult * adjMult;
    const displayLab = isParent ? (childSums.get(i.id)?.lab ?? 0) : lab * i.quantity * labMarkupMult * complexityFactor * adjMult * effRegion;
    const displayTotal = displayMat + displayLab;

    return {
      id: i.id,
      name: i.name,
      unit: i.unit,
      quantity: i.quantity,
      materialPrice: isOwnerPro ? displayMat : 0,
      laborPrice: isOwnerPro ? displayLab : 0,
      totalPrice: isOwnerPro ? displayTotal : 0,
      section: i.section || null,
      isAssemblyChild: i.is_assembly_child || false,
    };
  });

  // Total = sum of only NON-child items (parents already contain children sums)
  const totalAmount = projectItems
    .filter(i => !i.isAssemblyChild)
    .reduce((sum, i) => sum + i.totalPrice, 0);

  return {
    offer: {
      id: link.id,
      token: link.token,
      projectName: project?.name || "Projekt",
      projectId: link.project_id,
      recipientName: link.recipient_name,
      recipientEmail: link.recipient_email,
      status: link.status,
      clientComment: link.client_comment,
      signatureUrl: link.signature_url,
      signedAt: link.signed_at,
      viewedAt: link.viewed_at,
      expiresAt: link.expires_at,
      createdAt: link.created_at,
      ownerName: profile?.full_name || null,
      ownerCompany: profile?.company_name || null,
      ownerPhone: profile?.phone || null,
      ownerEmail: profile?.email || null,
      ownerLogo: profile?.logo_url || null,
      isDemo: !isOwnerPro,
      proposedChanges: (link as Record<string, unknown>).proposed_changes as ProposedChanges | null,
      contractorResponse: (link as Record<string, unknown>).contractor_response as ContractorResponse | null,
      negotiationRound: ((link as Record<string, unknown>).negotiation_round as number) || 0,
      items: projectItems,
      totalAmount,
      vatRate: project?.vat_rate ?? 23,
      materialsOwnedByCustomer,
      portfolioItems,
      documents: projectDocuments,
    },
  };
}

export async function respondToOffer(
  token: string,
  action: "accepted" | "rejected",
  comment?: string
): Promise<{ success?: boolean; error?: string }> {
  // Use admin client — client portal users are NOT authenticated
  const { data: link } = await supabaseAdmin
    .from("offer_links")
    .select("id, status, expires_at, user_id, recipient_name, project_id, projects(name)")
    .eq("token", token)
    .single();

  if (!link) return { error: "Nie znaleziono oferty" };
  if (link.expires_at && new Date(link.expires_at) < new Date()) return { error: "Link wygasł" };
  if (link.status === "accepted" || link.status === "rejected") {
    return { error: "Oferta została już rozpatrzona" };
  }

  const { error } = await supabaseAdmin
    .from("offer_links")
    .update({
      status: action,
      client_comment: comment || null,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", link.id);

  if (error) {
    logger.error("Error responding to offer", { token }, error);
    return { error: "Błąd zapisu odpowiedzi" };
  }

  // Notify contractor via in-app notification (bell icon)
  {
    const project = (link as unknown as OfferLinkWithProject).projects;
    const clientName = link.recipient_name || "Klient";
    const isAccepted = action === "accepted";

    const { error: notifError } = await supabaseAdmin.from("notifications").insert({
      user_id: link.user_id,
      type: isAccepted ? "success" : "warning",
      title: isAccepted ? "Oferta zaakceptowana" : "Oferta odrzucona",
      message: `${clientName} ${isAccepted ? "zaakceptował(a)" : "odrzucił(a)"} ofertę dla projektu „${project?.name || "—"}"${comment ? `. Komentarz: "${comment}"` : ""}`,
      data: JSON.stringify({ project_id: link.project_id, offer_link_id: link.id, action, client_name: clientName }),
      action_url: `/dashboard/projects/${link.project_id}`,
      action_label: "Otwórz projekt",
    });
    if (notifError) {
      logger.error("Failed to insert offer notification", { token, user_id: link.user_id }, new Error(notifError.message));
    }
  }

  // Notify contractor via email
  try {
    const { data: ownerProfile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", link.user_id)
      .single();

    if (ownerProfile?.email && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const project = (link as unknown as OfferLinkWithProject).projects;
      const clientName = link.recipient_name || "Klient";
      const isAccepted = action === "accepted";
      const emoji = isAccepted ? "✅" : "❌";
      const statusText = isAccepted ? "ZAAKCEPTOWANA" : "ODRZUCONA";

      const fromEmail = process.env.RESEND_FROM_EMAIL || "powiadomienia@elektrosmart.pro";
      await resend.emails.send({
        from: `ElektroSmart PRO <${fromEmail}>`,
        replyTo: ownerProfile.email,
        to: [ownerProfile.email],
        subject: `${emoji} Oferta ${statusText} — ${project?.name || "Projekt"}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
            <div style="background: ${isAccepted ? "#f0fdf4" : "#fef2f2"}; border: 1px solid ${isAccepted ? "#bbf7d0" : "#fecaca"}; border-radius: 12px; padding: 24px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 12px;">${isAccepted ? "🎉" : "😔"}</div>
              <h2 style="color: ${isAccepted ? "#15803d" : "#dc2626"}; margin: 0 0 8px;">Oferta ${statusText}</h2>
              <p style="color: #475569; font-size: 14px; margin: 0;">
                <strong>${clientName}</strong> ${isAccepted ? "zaakceptował(a)" : "odrzucił(a)"} ofertę dla projektu <strong>${project?.name || "—"}</strong>.
              </p>
              ${comment ? `<p style="margin-top: 16px; padding: 12px; background: white; border-radius: 8px; color: #334155; font-size: 13px; font-style: italic;">"${comment}"</p>` : ""}
            </div>
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">ElektroSmart PRO — <a href="https://elektrosmart.pro" style="color: #94a3b8;">elektrosmart.pro</a></p>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    logger.error("Error sending offer notification email", { token }, emailErr instanceof Error ? emailErr : new Error(String(emailErr)));
  }

  return { success: true };
}

export async function saveSignature(
  token: string,
  signatureDataUrl: string
): Promise<{ success?: boolean; error?: string }> {
  // Use admin client — client portal users are NOT authenticated
  const { data: link } = await supabaseAdmin
    .from("offer_links")
    .select("id, project_id, status, user_id, recipient_name, projects(name)")
    .eq("token", token)
    .single();

  if (!link) return { error: "Nie znaleziono oferty" };

  // Convert data URL to blob and upload to storage
  const base64 = signatureDataUrl.split(",")[1];
  const buffer = Buffer.from(base64, "base64");
  const fileName = `signatures/${link.project_id}/${link.id}_${Date.now()}.png`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from("project-documents")
    .upload(fileName, buffer, { contentType: "image/png", upsert: true });

  if (uploadError) {
    logger.error("Error uploading signature", { token }, uploadError);
    return { error: "Błąd zapisu podpisu" };
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from("project-documents")
    .getPublicUrl(fileName);

  const { error } = await supabaseAdmin
    .from("offer_links")
    .update({
      signature_url: publicUrl.publicUrl,
      signed_at: new Date().toISOString(),
      status: "accepted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", link.id);

  if (error) {
    logger.error("Error saving signature", { token }, error);
    return { error: "Błąd zapisu podpisu" };
  }

  // Notify contractor via in-app notification (bell icon)
  {
    const project = (link as unknown as OfferLinkWithProject).projects;
    const clientName = link.recipient_name || "Klient";

    const { error: notifError } = await supabaseAdmin.from("notifications").insert({
      user_id: link.user_id,
      type: "success",
      title: "Oferta zaakceptowana i podpisana",
      message: `${clientName} zaakceptował(a) i podpisał(a) ofertę dla projektu „${project?.name || "—"}". Podpis elektroniczny został zapisany.`,
      data: JSON.stringify({ project_id: link.project_id, offer_link_id: link.id, action: "signed", client_name: clientName }),
      action_url: `/dashboard/projects/${link.project_id}`,
      action_label: "Otwórz projekt",
    });
    if (notifError) {
      logger.error("Failed to insert signature notification", { token, user_id: link.user_id }, new Error(notifError.message));
    }
  }

  return { success: true };
}

// ============================================
// NEGOTIATION ACTIONS
// ============================================

/**
 * Client submits proposed changes to prices/quantities.
 * Sets offer status to "negotiating" and stores changes in JSONB.
 */
export async function submitProposal(
  token: string,
  changes: Record<string, ProposedItemChange>,
  comment?: string
): Promise<{ success?: boolean; error?: string }> {
  const { data: link } = await supabaseAdmin
    .from("offer_links")
    .select("id, status, expires_at, user_id, recipient_name, project_id, projects(name)")
    .eq("token", token)
    .single();

  if (!link) return { error: "Nie znaleziono oferty" };
  if (link.expires_at && new Date(link.expires_at) < new Date()) return { error: "Link wygasł" };
  if (link.status === "accepted" || link.status === "rejected") {
    return { error: "Oferta została już rozpatrzona" };
  }

  const itemIds = Object.keys(changes);
  if (itemIds.length === 0) return { error: "Brak zmian do zaproponowania" };

  const proposedChanges: ProposedChanges = {
    items: changes,
    comment: comment || undefined,
    submittedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("offer_links")
    .update({
      status: "negotiating",
      proposed_changes: proposedChanges as unknown as Record<string, unknown>,
      contractor_response: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", link.id);

  if (error) {
    logger.error("Error submitting proposal", { token }, error);
    return { error: "Błąd zapisu propozycji" };
  }

  // Notify contractor
  const project = (link as unknown as OfferLinkWithProject).projects;
  const clientName = link.recipient_name || "Klient";

  await supabaseAdmin.from("notifications").insert({
    user_id: link.user_id,
    type: "info",
    title: "Nowa propozycja korekty",
    message: `${clientName} zaproponował(a) zmiany w ofercie dla projektu „${project?.name || "—"}" (${itemIds.length} pozycji).${comment ? ` Komentarz: "${comment}"` : ""}`,
    data: { project_id: link.project_id, offer_link_id: link.id, action: "proposal", client_name: clientName },
    action_url: `/dashboard/projects/${link.project_id}?review_offer=${link.id}`,
    action_label: "Przejrzyj propozycję",
  });

  return { success: true };
}

/**
 * Contractor reviews the client's proposal: accept, reject, or counter.
 * Requires auth (contractor must be logged in).
 */
export async function reviewProposal(
  offerId: string,
  action: "accept" | "reject" | "counter",
  counterChanges?: Record<string, ProposedItemChange>,
  comment?: string
): Promise<{ success?: boolean; error?: string }> {
  // This action is called from the contractor dashboard (authenticated)
  const { tryAuth } = await import("@/lib/auth");
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Musisz być zalogowany" };

  const { data: link } = await supabaseAdmin
    .from("offer_links")
    .select("id, status, user_id, project_id, recipient_name, negotiation_round, projects(name)")
    .eq("id", offerId)
    .single();

  if (!link) return { error: "Nie znaleziono oferty" };
  if (link.user_id !== user.id) return { error: "Brak uprawnień" };
  if (link.status !== "negotiating") return { error: "Oferta nie jest w trybie negocjacji" };

  const contractorResponse: ContractorResponse = {
    action,
    items: action === "counter" ? counterChanges : undefined,
    comment: comment || undefined,
    respondedAt: new Date().toISOString(),
  };

  const currentRound = ((link as Record<string, unknown>).negotiation_round as number) || 0;

  if (action === "accept") {
    // Merge proposed changes into project_items
    const proposedRaw = await supabaseAdmin
      .from("offer_links")
      .select("proposed_changes")
      .eq("id", offerId)
      .single();

    const proposed = proposedRaw.data?.proposed_changes as unknown as ProposedChanges | null;
    if (proposed?.items) {
      for (const [itemId, changes] of Object.entries(proposed.items)) {
        const updateData: Record<string, number> = {};
        if (changes.quantity !== undefined) updateData.quantity = changes.quantity;
        if (changes.materialPrice !== undefined) updateData.final_material_price = changes.materialPrice;
        if (changes.laborPrice !== undefined) updateData.final_labor_price = changes.laborPrice;

        if (Object.keys(updateData).length > 0) {
          await supabaseAdmin
            .from("project_items")
            .update(updateData)
            .eq("id", itemId)
            .eq("project_id", link.project_id);
        }
      }
    }

    await supabaseAdmin
      .from("offer_links")
      .update({
        status: "accepted",
        contractor_response: contractorResponse as unknown as Record<string, unknown>,
        negotiation_round: currentRound + 1,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);
  } else if (action === "reject") {
    await supabaseAdmin
      .from("offer_links")
      .update({
        status: "viewed",
        contractor_response: contractorResponse as unknown as Record<string, unknown>,
        proposed_changes: null,
        negotiation_round: currentRound + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);
  } else if (action === "counter") {
    await supabaseAdmin
      .from("offer_links")
      .update({
        status: "viewed",
        contractor_response: contractorResponse as unknown as Record<string, unknown>,
        proposed_changes: null,
        negotiation_round: currentRound + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);
  }

  return { success: true };
}

/**
 * Get a signed download URL for a project document (client portal — no auth).
 * Validates the token first to ensure the request is legitimate.
 */
export async function getOfferDocumentUrl(
  token: string,
  filePath: string
): Promise<{ url?: string; error?: string }> {
  const { data: link } = await supabaseAdmin
    .from("offer_links")
    .select("id, project_id")
    .eq("token", token)
    .single();

  if (!link) return { error: "Nie znaleziono oferty" };

  // Ensure the requested path belongs to this project
  if (!filePath.startsWith(`${link.project_id}/client/`)) {
    return { error: "Nieprawidłowa ścieżka pliku" };
  }

  const { data, error } = await supabaseAdmin.storage
    .from("project-documents")
    .createSignedUrl(filePath, 3600);

  if (error) return { error: error.message };
  return { url: data?.signedUrl };
}
