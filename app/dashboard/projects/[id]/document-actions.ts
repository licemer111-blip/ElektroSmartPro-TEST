"use server";

import { logger } from "@/lib/logger";
import { createClient } from "@/utils/supabase/server";
import { requireAuth } from "@/lib/auth";
// requirePro removed — demo users can access all features
import { revalidatePath } from "next/cache";

const BUCKET = "project-documents";
const SIGNED_URL_EXPIRY = 3600; // 1 hour

export type ProjectDocument = {
  name: string;
  path: string;
  id: string;
  created_at?: string;
  metadata?: { mimetype?: string; size?: number };
};

async function canAccessProject(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: project } = await supabase.from("projects").select("user_id, team_id").eq("id", projectId).single();
  if (!project) return false;
  if (project.user_id === user.id) return true;
  const { data: teamMember } = project.team_id
    ? await supabase.from("team_members").select("id").eq("team_id", project.team_id).eq("user_id", user.id).eq("status", "active").maybeSingle()
    : { data: null };
  if (teamMember) return true;
  const { data: projMember } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  return !!projMember;
}

export async function listProjectDocuments(
  projectId: string,
  subfolder: "client" | "estimation" = "client"
): Promise<{ data: ProjectDocument[]; error?: string }> {
  const supabase = await createClient();
  const ok = await canAccessProject(supabase, projectId);
  if (!ok) return { data: [], error: "Brak dostępu" };

  const folderPath = `${projectId}/${subfolder}`;
  const { data: list, error } = await supabase.storage
    .from(BUCKET)
    .list(folderPath, { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
      return { data: [] };
    }
    return { data: [], error: error.message };
  }

  const documents: ProjectDocument[] = (list ?? [])
    .filter((f) => f.name != null)
    .map((f) => ({
      name: f.name,
      path: `${folderPath}/${f.name}`,
      id: (f as { id?: string }).id ?? f.name,
      created_at: f.created_at,
      metadata: f.metadata as { mimetype?: string; size?: number } | undefined,
    }));

  return { data: documents };
}

export async function getProjectDocumentUrl(
  projectId: string,
  path: string,
  expiresIn: number = SIGNED_URL_EXPIRY
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const ok = await canAccessProject(supabase, projectId);
  if (!ok) return { error: "Brak dostępu" };

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) return { error: error.message };
  return { url: data?.signedUrl };
}

export async function uploadProjectDocument(
  projectId: string,
  formData: FormData
): Promise<{ success: boolean; error?: string; path?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
  if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

  const ok = await canAccessProject(supabase, projectId);
  if (!ok) return { success: false, error: "Brak uprawnień do tego projektu" };

  const file = formData.get("file") as File | null;
  if (!file?.name) return { success: false, error: "Wybierz plik" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const allowed = ["pdf", "jpg", "jpeg", "png", "webp", "xlsx", "xls", "csv", "txt"];
  if (!allowed.includes(ext)) return { success: false, error: "Dozwolone: PDF, JPG, PNG, Excel (xlsx/xls), CSV, TXT" };

  const subfolder = (formData.get("subfolder") as string) || "client";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const unique = `${Date.now()}_${safeName}`;
  const path = `${projectId}/${subfolder}/${unique}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, path };
}

export async function deleteProjectDocument(
  projectId: string,
  path: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const ok = await canAccessProject(supabase, projectId);
  if (!ok) return { success: false, error: "Brak uprawnień" };

  if (!path.startsWith(projectId + "/")) return { success: false, error: "Nieprawidłowa ścieżka" };
  // Ensure path is within a valid subfolder
  const validPrefixes = [`${projectId}/client/`, `${projectId}/estimation/`, `${projectId}/`];
  if (!validPrefixes.some((p) => path.startsWith(p))) return { success: false, error: "Nieprawidłowa ścieżka" };

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true };
}

/**
 * Upload a calculator PDF (base64) to a project's documents.
 * Files are prefixed with "Obliczenia_" so they can be identified later for email attachments.
 */
export async function uploadCalculatorPdfToProject(
  projectId: string,
  pdfBase64: string,
  fileName: string
): Promise<{ success: boolean; error?: string; path?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const ok = await canAccessProject(supabase, projectId);
    if (!ok) return { success: false, error: "Brak uprawnień do tego projektu" };

    // Decode base64 to buffer
    const buffer = Buffer.from(pdfBase64, "base64");
    if (buffer.length === 0) return { success: false, error: "Pusty plik PDF" };
    if (buffer.length > 25 * 1024 * 1024) return { success: false, error: "Plik jest za duży (max 25 MB)" };

    // Sanitize filename
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}_${safeName}`;
    const path = `${projectId}/client/${unique}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, path };
  } catch (err) {
    logger.error("uploadCalculatorPdfToProject error:", {}, err);
    return { success: false, error: "Nie udało się zapisać PDF" };
  }
}

/**
 * Get a lightweight list of the user's projects for the "Attach to project" picker.
 */
export async function getUserProjectsForAttach(): Promise<{ id: string; name: string }[]> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return [];

    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", user.id)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(50);

    return projects ?? [];
  } catch {
    return [];
  }
}

/**
 * Upload an SVG file (as string) to a project's documents.
 * Files are prefixed with "Rozdzielnica_" so they can be identified for email attachments.
 */
export async function uploadSvgToProject(
  projectId: string,
  svgContent: string,
  fileName: string
): Promise<{ success: boolean; error?: string; path?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const ok = await canAccessProject(supabase, projectId);
    if (!ok) return { success: false, error: "Brak uprawnień do tego projektu" };

    const buffer = Buffer.from(svgContent, "utf-8");
    if (buffer.length === 0) return { success: false, error: "Pusty plik SVG" };
    if (buffer.length > 10 * 1024 * 1024) return { success: false, error: "Plik jest za duży (max 10 MB)" };

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const unique = `${Date.now()}_${safeName}`;
    const path = `${projectId}/client/${unique}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType: "image/svg+xml",
      upsert: false,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, path };
  } catch (err) {
    logger.error("uploadSvgToProject error:", {}, err);
    return { success: false, error: "Nie udało się zapisać SVG" };
  }
}

/**
 * Get user profile data for PDF header (company name, NIP, address, phone, email).
 * Used by calculator PDFs and panel configurator to render consistent headers.
 */
export async function getProfileForPdfHeader(): Promise<{
  companyName: string;
  fullName: string;
  nip: string;
  address: string;
  street: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
} | null> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_name, full_name, nip, address, street, city, postal_code, phone, email")
      .eq("id", user.id)
      .single();

    if (!profile) return null;
    return {
      companyName: profile.company_name || "",
      fullName: profile.full_name || "",
      nip: profile.nip || "",
      address: profile.address || "",
      street: profile.street || "",
      city: profile.city || "",
      postal_code: profile.postal_code || "",
      phone: profile.phone || "",
      email: profile.email || "",
    };
  } catch {
    return null;
  }
}

/**
 * Save a generated document (PDF/Excel) to project storage so it appears in the client portal.
 * Replaces any previous file with the same prefix to avoid duplicates.
 */
export async function saveGeneratedDocumentToProject(
  projectId: string,
  base64Content: string,
  fileName: string,
  contentType: string
): Promise<{ success: boolean; error?: string; path?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const ok = await canAccessProject(supabase, projectId);
    if (!ok) return { success: false, error: "Brak uprawnień do tego projektu" };

    const buffer = Buffer.from(base64Content, "base64");
    if (buffer.length === 0) return { success: false, error: "Pusty plik" };
    if (buffer.length > 25 * 1024 * 1024) return { success: false, error: "Plik jest za duży (max 25 MB)" };

    // Extract prefix (e.g. "Kosztorys_" or "Excel_") to find and remove old versions
    const prefix = fileName.replace(/[_-]\d+\..*$/, "");
    try {
      const { data: existing } = await supabase.storage
        .from(BUCKET)
        .list(`${projectId}/client`);
      if (existing) {
        const oldFiles = existing
          .filter(f => f.name.startsWith(prefix))
          .map(f => `${projectId}/client/${f.name}`);
        if (oldFiles.length > 0) {
          await supabase.storage.from(BUCKET).remove(oldFiles);
        }
      }
    } catch {
      // Ignore cleanup errors
    }

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${projectId}/client/${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: true,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true, path };
  } catch (err) {
    logger.error("saveGeneratedDocumentToProject error:", {}, err);
    return { success: false, error: "Nie udało się zapisać dokumentu" };
  }
}

/**
 * Cleanup old Rozdzielnica_* files from project documents.
 * Call this ONCE before uploading new panel files to avoid duplicates.
 */
export async function cleanupPanelDocuments(
  projectId: string
): Promise<{ success: boolean; removed: number }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, removed: 0 };

    const ok = await canAccessProject(supabase, projectId);
    if (!ok) return { success: false, removed: 0 };

    const { data: existing } = await supabase.storage
      .from(BUCKET)
      .list(`${projectId}/client`);

    if (!existing) return { success: true, removed: 0 };

    const oldFiles = existing
      .filter(f => f.name.startsWith("Rozdzielnica_") || f.name.includes("_Rozdzielnica_"))
      .map(f => `${projectId}/client/${f.name}`);

    if (oldFiles.length > 0) {
      await supabase.storage.from(BUCKET).remove(oldFiles);
    }

    return { success: true, removed: oldFiles.length };
  } catch {
    return { success: false, removed: 0 };
  }
}

/**
 * Upload a single panel file to project documents with upsert (no cleanup).
 * Call cleanupPanelDocuments ONCE before calling this for each file.
 */
export async function uploadSinglePanelFile(
  projectId: string,
  base64Content: string,
  fileName: string,
  contentType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));
    if (!user || !supabase) return { success: false, error: "Musisz być zalogowany" };

    const ok = await canAccessProject(supabase, projectId);
    if (!ok) return { success: false, error: "Brak uprawnień" };

    const buffer = Buffer.from(base64Content, "base64");
    if (buffer.length === 0) return { success: false, error: "Pusty plik" };
    if (buffer.length > 25 * 1024 * 1024) return { success: false, error: "Za duży (max 25 MB)" };

    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${projectId}/client/${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: true,
    });

    if (error) return { success: false, error: error.message };
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (err) {
    logger.error("uploadSinglePanelFile error:", {}, err);
    return { success: false, error: "Nieoczekiwany błąd" };
  }
}

/**
 * Count calculator PDFs (prefixed "Obliczenia_") attached to a project.
 */
export async function countCalculatorPdfs(projectId: string): Promise<number> {
  try {
    const supabase = await createClient();
    const ok = await canAccessProject(supabase, projectId);
    if (!ok) return 0;

    const { data: list } = await supabase.storage
      .from(BUCKET)
      .list(`${projectId}/client`, { sortBy: { column: "created_at", order: "desc" } });

    if (!list) return 0;
    return list.filter((f) => f.name.includes("Obliczenia_")).length;
  } catch {
    return 0;
  }
}

/**
 * List all documents in the project client folder (for attachment preview in email dialog).
 */
export interface ProjectDocSummary {
  calculators: number;
  panelPdfs: number;
  panelWidok: number;
  panelSchemat: number;
  other: string[];
}

export async function getProjectDocsSummary(projectId: string): Promise<ProjectDocSummary> {
  const empty: ProjectDocSummary = { calculators: 0, panelPdfs: 0, panelWidok: 0, panelSchemat: 0, other: [] };
  try {
    const supabase = await createClient();
    const ok = await canAccessProject(supabase, projectId);
    if (!ok) return empty;

    const { data: list } = await supabase.storage
      .from(BUCKET)
      .list(`${projectId}/client`, { sortBy: { column: "created_at", order: "desc" } });

    if (!list) return empty;

    const result: ProjectDocSummary = { calculators: 0, panelPdfs: 0, panelWidok: 0, panelSchemat: 0, other: [] };
    for (const f of list) {
      if (f.name.includes("Obliczenia_")) {
        result.calculators++;
      } else if (f.name.includes("Rozdzielnica_")) {
        if (f.name.includes("_schemat.")) result.panelSchemat++;
        else if (f.name.endsWith(".pdf")) result.panelPdfs++;
        else if (f.name.endsWith(".svg")) result.panelWidok++;
        else result.other.push(f.name);
      } else if (f.name !== ".emptyFolderPlaceholder") {
        result.other.push(f.name);
      }
    }
    return result;
  } catch {
    return empty;
  }
}
