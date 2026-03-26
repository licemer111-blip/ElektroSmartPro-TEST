"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { isTeamAdmin } from "@/lib/team-auth";

// ─── Send message ─────────────────────────────────────────────────────────────

export async function sendTeamMessage(teamId: string, content: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { data, error } = await supabase
    .from("team_messages")
    .insert({ team_id: teamId, user_id: user.id, content: content.trim() })
    .select()
    .single();

  if (error) {
    logger.error("Error sending message", { teamId }, error);
    return { error: error.message || "Nie udało się wysłać wiadomości" };
  }

  return { success: true, message: data };
}

// ─── Get messages ─────────────────────────────────────────────────────────────

export async function getTeamMessages(teamId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany", messages: [] };

  const { data, error } = await supabase
    .from("team_messages")
    .select("*")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    logger.error("Error fetching messages", { teamId }, error);
    return { error: error.message, messages: [] };
  }

  if (data && data.length > 0) {
    const userIds = [...new Set(data.map((m) => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    return {
      messages: data.map((msg) => ({
        ...msg,
        profiles: profiles?.find((p) => p.id === msg.user_id) || null,
      })),
    };
  }

  return { messages: [] };
}

// ─── Edit message (own only) ──────────────────────────────────────────────────

export async function editTeamMessage(messageId: string, newContent: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { error } = await supabase
    .from("team_messages")
    .update({ content: newContent.trim(), updated_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error editing message", { messageId }, error);
    return { error: error.message };
  }

  return { success: true };
}

// ─── Delete message (own or admin) ───────────────────────────────────────────

export async function deleteTeamMessage(messageId: string, teamId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const adminCheck = await isTeamAdmin(supabase, teamId, user.id);

  let query = supabase.from("team_messages").delete().eq("id", messageId);
  if (!adminCheck) query = query.eq("user_id", user.id);

  const { error } = await query;

  if (error) {
    logger.error("Error deleting message", { messageId, teamId }, error);
    return { error: error.message };
  }

  return { success: true };
}

// ─── Send message with attachment ─────────────────────────────────────────────

export async function sendTeamMessageWithAttachment(
  teamId: string,
  content: string,
  attachment?: { url: string; filename: string; type: string; size: number }
) {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

    if (attachment) {
      const messageDataWithAttachment: Record<string, string | number> = {
        team_id: teamId,
        user_id: user.id,
        content: content.trim() || `📎 ${attachment.filename}`,
        attachment_url: attachment.url,
        attachment_filename: attachment.filename,
        attachment_type: attachment.type,
        attachment_size: attachment.size,
      };

      const { data, error } = await supabase
        .from("team_messages")
        .insert(messageDataWithAttachment)
        .select()
        .single();

      if (!error) return { success: true, message: data };

      logger.warn("Attachment columns may not exist. Using fallback. Apply migration 20260130_team_chat_attachments.sql", { teamId });

      const attachmentMarker = `\n<!--ATTACHMENT:${JSON.stringify({
        url: attachment.url,
        filename: attachment.filename,
        type: attachment.type,
        size: attachment.size,
      })}-->`;

      const fallbackContent = content.trim()
        ? `${content.trim()}${attachmentMarker}`
        : `📎 ${attachment.filename}${attachmentMarker}`;

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("team_messages")
        .insert({ team_id: teamId, user_id: user.id, content: fallbackContent })
        .select()
        .single();

      if (fallbackError) return { error: fallbackError.message };
      return { success: true, message: fallbackData };
    }

    const { data, error } = await supabase
      .from("team_messages")
      .insert({ team_id: teamId, user_id: user.id, content: content.trim() })
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, message: data };
  } catch (err) {
    logger.error("sendTeamMessageWithAttachment error", { teamId }, err);
    return { error: "Wystąpił błąd podczas wysyłania" };
  }
}
