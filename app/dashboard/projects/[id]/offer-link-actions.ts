"use server";

import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";

interface PortalSettings {
  showKnr: boolean;
  showRg: boolean;
  showColors: boolean;
}

export async function createOfferLink(
  projectId: string,
  recipientName?: string,
  recipientEmail?: string,
  portalSettings?: PortalSettings
): Promise<{ success?: boolean; error?: string; token?: string; url?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, user_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return { error: "Nie znaleziono projektu" };
  }

  const { data: link, error } = await supabase
    .from("offer_links")
    .insert({
      project_id: projectId,
      user_id: user.id,
      recipient_name: recipientName || null,
      recipient_email: recipientEmail || null,
      portal_settings: portalSettings ?? { showKnr: false, showRg: false, showColors: false },
    })
    .select("token")
    .single();

  if (error) {
    logger.error("Error creating offer link", { projectId }, error);
    return { error: `Błąd tworzenia linku: ${error.message}` };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://elektrosmart.pro";
  const url = `${baseUrl}/offer/${link.token}`;

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, token: link.token, url };
}

export async function getOfferLinks(projectId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return [];

  const { data } = await supabase
    .from("offer_links")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getOfferLinkById(linkId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return null;

  const { data } = await supabase
    .from("offer_links")
    .select("id, token, status, recipient_name, recipient_email, project_id, projects(name)")
    .eq("id", linkId)
    .eq("user_id", user.id)
    .single();

  return data;
}

export async function deleteOfferLink(linkId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("offer_links")
    .delete()
    .eq("id", linkId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error deleting offer link", { linkId }, error);
    return { error: "Błąd usuwania linku" };
  }

  return { success: true };
}
