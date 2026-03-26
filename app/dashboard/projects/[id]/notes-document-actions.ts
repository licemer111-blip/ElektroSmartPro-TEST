"use server";

import { listProjectDocuments, getProjectDocumentUrl } from "./document-actions";

const SIGNED_URL_EXPIRY = 3600;

/** Resolve document by display filename (e.g. from legacy "Załącznik: filename" in notes). */
export async function getProjectDocumentUrlByFilename(
  projectId: string,
  filename: string,
  expiresIn: number = SIGNED_URL_EXPIRY
): Promise<{ url?: string; error?: string }> {
  const { data: list, error: listError } = await listProjectDocuments(projectId);
  if (listError || !list?.length) return { error: listError ?? "Brak dokumentów" };
  const decoded = decodeURIComponent(filename).trim();
  const norm = (n: string) => n.replace(/^\d+_/, "");
  const found =
    list.find((d) => d.name === decoded) ||
    list.find((d) => d.name.endsWith(decoded) || decoded.endsWith(d.name)) ||
    list.find((d) => norm(d.name) === decoded || norm(d.name) === norm(decoded));
  if (!found) return { error: "Nie znaleziono pliku" };
  return getProjectDocumentUrl(projectId, found.path, expiresIn);
}
