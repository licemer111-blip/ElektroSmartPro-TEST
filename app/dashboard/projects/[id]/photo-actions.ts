"use server";

import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import type { ProjectPhoto, PhotoType } from "@/lib/types/database";

/**
 * Upload photo to Supabase Storage and add to project notes
 */
export async function uploadProjectPhoto(
  projectId: string,
  imageDataUrl: string
): Promise<{ success: boolean; error?: string; imageUrl?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) {
      return { success: false, error: "Unauthorized" };
    }

    // Convert data URL to blob
    const base64Data = imageDataUrl.split(",")[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `project-${projectId}-${timestamp}.jpg`;
    const filepath = `${user.id}/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(filepath, blob, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logger.error("[Upload Photo] Storage error:", {}, uploadError);
      return { success: false, error: "Nie udało się przesłać zdjęcia" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("project-photos").getPublicUrl(filepath);

    // Get current project notes
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("notes")
      .eq("id", projectId)
      .single();

    if (projectError) {
      logger.error("[Upload Photo] Project fetch error:", {}, projectError);
      return { success: false, error: "Projekt nie znaleziony" };
    }

    // Append photo to notes
    const currentNotes = project.notes || "";
    const photoMarkdown = `\n\n![Zdjęcie z ${new Date().toLocaleDateString("pl-PL")}](${publicUrl})\n`;
    const updatedNotes = currentNotes + photoMarkdown;

    // Update project notes
    const { error: updateError } = await supabase
      .from("projects")
      .update({ notes: updatedNotes })
      .eq("id", projectId);

    if (updateError) {
      logger.error("[Upload Photo] Update error:", {}, updateError);
      return { success: false, error: "Nie udało się zaktualizować notatek" };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);

    return { success: true, imageUrl: publicUrl };
  } catch (error) {
    logger.error("[Upload Photo] Error:", {}, error);
    return { success: false, error: "Błąd serwera — spróbuj ponownie" };
  }
}

/**
 * Upload image file (from file input) to project-photos, return public URL for embedding in notes
 */
/**
 * List all photos uploaded for a project from Supabase Storage
 */
export async function listProjectPhotos(
  projectId: string
): Promise<{ urls: string[]; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { urls: [], error: "Unauthorized" };

    const folder = `${user.id}`;
    const { data: files, error } = await supabase.storage
      .from("project-photos")
      .list(folder, { limit: 200, sortBy: { column: "created_at", order: "asc" } });

    if (error) return { urls: [], error: error.message };

    const prefix = `project-${projectId}-`;
    const projectFiles = (files || []).filter((f) => f.name.startsWith(prefix));

    const urls = projectFiles.map((f) => {
      const { data: { publicUrl } } = supabase.storage
        .from("project-photos")
        .getPublicUrl(`${folder}/${f.name}`);
      return publicUrl;
    });

    return { urls };
  } catch (error) {
    logger.error("[List Photos] Error:", {}, error);
    return { urls: [], error: "Internal server error" };
  }
}

export async function uploadProjectPhotoFile(
  projectId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; imageUrl?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File | null;
    if (!file?.size) return { success: false, error: "Wybierz plik" };

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Dozwolone: JPG, PNG, WEBP, GIF" };
    }
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) return { success: false, error: "Maks. 10 MB" };

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
    const filename = `project-${projectId}-${Date.now()}.${safeExt}`;
    const filepath = `${user.id}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(filepath, file, { contentType: file.type, cacheControl: "3600", upsert: false });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: { publicUrl } } = supabase.storage.from("project-photos").getPublicUrl(filepath);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, imageUrl: publicUrl };
  } catch (error) {
    logger.error("[Upload Photo File] Error:", {}, error);
    return { success: false, error: "Internal server error" };
  }
}

// =============================================
// NEW: project_photos table CRUD
// =============================================

export async function getProjectPhotos(projectId: string): Promise<ProjectPhoto[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return [];

  const { data, error } = await supabase
    .from("project_photos")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching project photos", { projectId }, error);
    return [];
  }

  return (data || []) as ProjectPhoto[];
}

export async function uploadAndSavePhoto(
  projectId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; photo?: ProjectPhoto }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, error: "Unauthorized" };

    const file = formData.get("file") as File | null;
    const itemId = formData.get("item_id") as string | null;
    const caption = formData.get("caption") as string | null;
    const location = formData.get("location") as string | null;
    const photoType = (formData.get("photo_type") as PhotoType) || "progress";

    if (!file?.size) return { success: false, error: "Wybierz plik" };

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Dozwolone: JPG, PNG, WEBP, HEIC" };
    }
    if (file.size > 10 * 1024 * 1024) return { success: false, error: "Maks. 10 MB" };

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpg", "jpeg", "png", "webp", "heic"].includes(ext) ? ext : "jpg";
    const filename = `photo-${projectId}-${Date.now()}.${safeExt}`;
    const filepath = `${user.id}/${filename}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(filepath, file, { contentType: file.type, cacheControl: "3600", upsert: false });

    if (uploadError) {
      logger.error("Photo upload error", { projectId }, uploadError);
      return { success: false, error: uploadError.message };
    }

    // Save record in project_photos table
    const { data: photo, error: dbError } = await supabase
      .from("project_photos")
      .insert({
        project_id: projectId,
        item_id: itemId || null,
        user_id: user.id,
        storage_path: filepath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        caption: caption || null,
        location: location || null,
        photo_type: photoType,
      })
      .select()
      .single();

    if (dbError) {
      logger.error("Photo DB save error", { projectId }, dbError);
      return { success: false, error: "Nie udało się zapisać zdjęcia" };
    }

    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, photo: photo as ProjectPhoto };
  } catch (error) {
    logger.error("Photo upload unexpected error", {}, error);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

export async function deleteProjectPhotoRecord(photoId: string, projectId: string) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  // Get photo record to find storage path
  const { data: photo } = await supabase
    .from("project_photos")
    .select("storage_path")
    .eq("id", photoId)
    .eq("user_id", user.id)
    .single();

  if (photo?.storage_path) {
    await supabase.storage.from("project-photos").remove([photo.storage_path]);
  }

  const { error } = await supabase
    .from("project_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error deleting photo", { photoId }, error);
    return { error: "Nie udało się usunąć zdjęcia" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

export async function updatePhotoMetadata(
  photoId: string,
  projectId: string,
  updates: Partial<{ caption: string; location: string; photo_type: PhotoType; item_id: string | null }>
) {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("project_photos")
    .update(updates)
    .eq("id", photoId)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Error updating photo metadata", { photoId }, error);
    return { error: "Nie udało się zaktualizować zdjęcia" };
  }

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

