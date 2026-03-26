import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const { projectUpdatedAt } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ hasChanges: false }, { status: 401 });

    // Check if project belongs to user (or user is team member)
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) return NextResponse.json({ hasChanges: false });

    // Fetch catalog_item_ids actually used in this project
    const { data: projectItems } = await supabase
      .from("project_items")
      .select("catalog_item_id")
      .eq("project_id", projectId)
      .not("catalog_item_id", "is", null);

    const catalogIds = (projectItems ?? [])
      .map((pi) => pi.catalog_item_id as string)
      .filter(Boolean);

    if (catalogIds.length === 0) {
      return NextResponse.json({ hasChanges: false });
    }

    // Check only catalog items used in THIS project
    const { data: changedItems } = await supabase
      .from("catalog_items")
      .select("id")
      .in("id", catalogIds)
      .gt("updated_at", projectUpdatedAt)
      .limit(1);

    const hasChanges = !!(changedItems && changedItems.length > 0);
    return NextResponse.json({ hasChanges });
  } catch {
    return NextResponse.json({ hasChanges: false });
  }
}
