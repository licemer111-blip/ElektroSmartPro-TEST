import { NextRequest, NextResponse } from "next/server";
import { getProjectDocumentUrl } from "@/app/dashboard/projects/[id]/document-actions";
import { getProjectDocumentUrlByFilename } from "@/app/dashboard/projects/[id]/notes-document-actions";

/**
 * GET /api/projects/[id]/documents/open?path=... | ?filename=...
 * Returns redirect to signed document URL. Used from notes preview so we don't call server actions from client (avoids webpack chunk error).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const filename = searchParams.get("filename");

  if (path) {
    const { url, error } = await getProjectDocumentUrl(projectId, path);
    if (error || !url) {
      return NextResponse.json({ error: error ?? "Nie udało się otworzyć" }, { status: 403 });
    }
    return NextResponse.redirect(url);
  }

  if (filename) {
    const { url, error } = await getProjectDocumentUrlByFilename(projectId, filename);
    if (error || !url) {
      return NextResponse.json({ error: error ?? "Nie udało się otworzyć" }, { status: 403 });
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "Podaj path lub filename" }, { status: 400 });
}
