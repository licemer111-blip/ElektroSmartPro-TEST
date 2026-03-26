import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileName: string }> }
) {
  const { projectId, fileName } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const decodedFileName = decodeURIComponent(fileName);

  const { data, error } = await supabase.storage
    .from("project-documents")
    .download(`${projectId}/${decodedFileName}`);

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const text = await data.text();
    const json = JSON.parse(text);
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}
