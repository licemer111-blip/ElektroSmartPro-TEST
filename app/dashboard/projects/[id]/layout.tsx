import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProjectRealtimeWrapper } from "@/components/project/project-realtime-wrapper";

export const maxDuration = 300;

/**
 * V4.0: Project Layout with Realtime Features
 * - Realtime cursors with following mode
 * - Auto data sync
 * - Tab synchronization
 */

interface ProjectLayoutProps {
  children: ReactNode;
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const resolvedParams = await params;
  const { id: projectId } = resolvedParams;

  // Get current user for presence features
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  // Защищенный роут - редирект если нет юзера
  if (!user || error) {
    redirect('/login');
  }

  return (
    <ProjectRealtimeWrapper projectId={projectId} userId={user.id}>
      {children}
    </ProjectRealtimeWrapper>
  );
}
