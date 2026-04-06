"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { tryAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { isTeamAdmin } from "@/lib/team-auth";

// ─── Remove a member (admin-only guard) ──────────────────────────────────────

export async function removeTeamMember(teamId: string, memberId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const adminCheck = await isTeamAdmin(supabase, teamId, user.id);
  if (!adminCheck) return { error: "Tylko administrator może usuwać członków zespołu" };

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true };
}

// ─── Leave team (self-removal) ────────────────────────────────────────────────

export async function leaveTeam(teamId: string) {
  const { user, supabase } = await tryAuth();
  if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

  const { data: team } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (team?.owner_id === user.id) {
    return { error: "Właściciel nie może opuścić zespołu. Przekaż najpierw własność innemu użytkownikowi." };
  }

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/team");
  return { success: true };
}

// ─── Storage: ensure bucket exists ───────────────────────────────────────────

export async function ensureTeamAttachmentsBucket(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      logger.error("Error listing buckets", {}, listError);
      return { success: false, error: listError.message };
    }

    if (buckets?.some((b) => b.id === "team-attachments")) return { success: true };

    const { error: createError } = await supabaseAdmin.storage.createBucket("team-attachments", {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
      ],
    });

    if (createError) {
      logger.error("Error creating bucket", { bucket: "team-attachments" }, createError);
      return { success: false, error: createError.message };
    }

    try {
      const policyQueries = [
        `DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'team_attachments_insert' AND tablename = 'objects'
          ) THEN
            CREATE POLICY "team_attachments_insert" ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (bucket_id = 'team-attachments');
          END IF;
        END $$;`,
        `DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE policyname = 'team_attachments_select' AND tablename = 'objects'
          ) THEN
            CREATE POLICY "team_attachments_select" ON storage.objects
            FOR SELECT TO authenticated
            USING (bucket_id = 'team-attachments');
          END IF;
        END $$;`,
      ];
      for (const sql of policyQueries) {
        try {
          await supabaseAdmin.rpc("exec_sql", { sql });
        } catch {
          // Ignore individual policy creation errors
        }
      }
    } catch {
      logger.warn("Could not auto-create storage policies. Bucket is public, reads work. Uploads may need manual policy setup.");
    }

    return { success: true };
  } catch (err) {
    logger.error("ensureTeamAttachmentsBucket error", {}, err);
    return { success: false, error: String(err) };
  }
}

// ─── Storage: ensure attachment columns exist ─────────────────────────────────

export async function ensureAttachmentColumns(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: checkError } = await supabaseAdmin
      .from("team_messages")
      .select("attachment_url")
      .limit(0);

    if (!checkError) return { success: true };

    const sql = `
      ALTER TABLE public.team_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
      ALTER TABLE public.team_messages ADD COLUMN IF NOT EXISTS attachment_filename TEXT;
      ALTER TABLE public.team_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
      ALTER TABLE public.team_messages ADD COLUMN IF NOT EXISTS attachment_size BIGINT;
      ALTER TABLE public.team_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
    `;

    const { error: rpcError } = await supabaseAdmin.rpc("exec_sql", { sql });

    if (rpcError) {
      logger.warn("Could not add columns via RPC. Please run migration manually.", { rpcErrorMessage: rpcError.message });
      return { success: false, error: "Kolumny załączników wymagają ręcznej migracji SQL" };
    }

    return { success: true };
  } catch (err) {
    logger.error("ensureAttachmentColumns error", {}, err);
    return { success: false, error: String(err) };
  }
}

// ─── Upload attachment ────────────────────────────────────────────────────────

export async function uploadTeamAttachment(teamId: string, file: File) {
  try {
    const { user, supabase } = await tryAuth();
    if (!user || !supabase) return { error: "Nie jesteś zalogowany" };

    if (file.size > 10 * 1024 * 1024) return { error: "Plik jest zbyt duży (max 10MB)" };

    const ext = file.name.split(".").pop()?.toLowerCase() || "file";
    const filename = `${teamId}/${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("team-attachments")
      .upload(filename, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      logger.error("Error uploading attachment", { teamId, filename: file.name }, uploadError);
      if (uploadError.message?.includes("bucket") || uploadError.message?.includes("not found")) {
        return { error: "Storage nie jest skonfigurowany. Uruchom migrację 20260130_team_chat_attachments.sql" };
      }
      return { error: "Nie udało się przesłać pliku: " + uploadError.message };
    }

    const { data: urlData } = supabase.storage.from("team-attachments").getPublicUrl(filename);

    return { success: true, url: urlData.publicUrl, filename: file.name, type: file.type, size: file.size };
  } catch (err) {
    logger.error("uploadTeamAttachment error", { teamId }, err);
    return { error: "Wystąpił błąd podczas przesyłania" };
  }
}
