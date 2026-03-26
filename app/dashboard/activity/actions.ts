"use server";

import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Define types inline to avoid re-export issues in Server Actions
export type ActivityLog = {
  id: string;
  user_id: string;
  project_id: string | null;
  action_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: {
    full_name: string | null;
    email: string | null;
  };
  project?: {
    name: string | null;
  };
};

export type ActivityActionType = 
  | 'project_created' | 'project_updated' | 'project_deleted' | 'project_archived'
  | 'project_duplicated' | 'project_finalized' | 'project_shared'
  | 'item_added' | 'item_updated' | 'item_deleted' | 'items_imported'
  | 'member_invited' | 'member_removed' | 'member_role_changed'
  | 'invitation_accepted' | 'invitation_declined'
  | 'pdf_generated' | 'email_sent' | 'invoice_created'
  | 'template_created' | 'template_used';

/**
 * Get recent activity for current user
 * Includes own actions and actions on shared projects
 */
export async function getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return [];
  }

  // Fetch activity logs
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Error fetching activity", {}, error);
    return [];
  }

  // Fetch related data separately to avoid FK issues
  const projectIds = [...new Set((data || []).map(d => d.project_id).filter(Boolean))];
  
  let projectsMap: Record<string, { name: string }> = {};
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);
    
    projectsMap = (projects || []).reduce((acc, p) => {
      acc[p.id] = { name: p.name };
      return acc;
    }, {} as Record<string, { name: string }>);
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  return (data || []).map((item) => ({
    ...item,
    user: profile || { full_name: null, email: null },
    project: item.project_id ? projectsMap[item.project_id] : null,
  })) as ActivityLog[];
}

/**
 * Get activity for a specific project
 */
export async function getProjectActivity(
  projectId: string,
  limit: number = 50
): Promise<ActivityLog[]> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("Error fetching project activity", { projectId }, error);
    return [];
  }

  // Fetch user profiles separately
  const userIds = [...new Set((data || []).map(d => d.user_id).filter(Boolean))];
  
  let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    
    profilesMap = (profiles || []).reduce((acc, p) => {
      acc[p.id] = { full_name: p.full_name, email: p.email };
      return acc;
    }, {} as Record<string, { full_name: string | null; email: string | null }>);
  }

  return (data || []).map((item) => ({
    ...item,
    user: profilesMap[item.user_id] || { full_name: null, email: null },
  })) as ActivityLog[];
}

/**
 * Log an activity manually (for actions not covered by triggers)
 */
export async function logActivity(
  actionType: ActivityActionType,
  description: string,
  projectId?: string,
  metadata?: Record<string, unknown>
): Promise<{ success?: boolean; error?: string }> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return { error: "Musisz być zalogowany" };
  }

  const { error } = await supabase
    .from("activity_logs")
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      action_type: actionType,
      description,
      metadata: metadata || {},
    });

  if (error) {
    logger.error("Error logging activity", { actionType, projectId }, error);
    return { error: "Błąd podczas logowania aktywności" };
  }

  return { success: true };
}

/**
 * Get activity summary/stats for a user
 */
export async function getActivityStats(): Promise<{
  today: number;
  week: number;
  month: number;
  topActions: { action_type: string; count: number }[];
}> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return { today: 0, week: 0, month: 0, topActions: [] };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  // Get counts for different periods
  const [todayData, weekData, monthData] = await Promise.all([
    supabase
      .from("activity_logs")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("activity_logs")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", weekStart.toISOString()),
    supabase
      .from("activity_logs")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString()),
  ]);

  return {
    today: todayData.count || 0,
    week: weekData.count || 0,
    month: monthData.count || 0,
    topActions: [],
  };
}
