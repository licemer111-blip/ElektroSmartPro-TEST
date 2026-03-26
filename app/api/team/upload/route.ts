import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/team/upload
 * Upload a file to the team-attachments storage bucket.
 * Uses admin client to bypass RLS policies on storage.objects.
 * 
 * Expects multipart/form-data with:
 * - file: the file to upload
 * - teamId: the team ID
 */
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Nie jesteś zalogowany" },
        { status: 401 }
      );
    }

    // Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const teamId = formData.get("teamId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Brak pliku" },
        { status: 400 }
      );
    }

    if (!teamId) {
      return NextResponse.json(
        { error: "Brak teamId" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Plik jest zbyt duży (max 10MB)" },
        { status: 400 }
      );
    }

    // Verify user is a member of this team
    const { data: membership } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!membership && !team) {
      return NextResponse.json(
        { error: "Nie masz dostępu do tego zespołu" },
        { status: 403 }
      );
    }

    // Generate storage path
    const ext = file.name.split(".").pop()?.toLowerCase() || "file";
    const storagePath = `${teamId}/${user.id}/${Date.now()}.${ext}`;

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload using admin client (bypasses RLS)
    const { error: uploadError } = await supabaseAdmin.storage
      .from("team-attachments")
      .upload(storagePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      logger.error("Storage upload error:", {}, uploadError);
      return NextResponse.json(
        { error: `Błąd przesyłania: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("team-attachments")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    });
  } catch (err) {
    logger.error("Team upload error:", {}, err);
    return NextResponse.json(
      { error: "Wystąpił błąd serwera podczas przesyłania" },
      { status: 500 }
    );
  }
}
