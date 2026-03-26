"use server";

import { requireAuth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export interface AnalyticsData {
  // Summary stats
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  avgProjectValue: number;
  
  // Monthly data (last 6 months)
  monthlyRevenue: { month: string; revenue: number; projects: number }[];
  
  // Top items
  topItems: { name: string; count: number; revenue: number }[];
  
  // Top clients
  topClients: { name: string; projects: number; revenue: number }[];
  
  // Project status breakdown
  statusBreakdown: { status: string; count: number }[];
  
  // Recent activity
  recentProjects: { id: string; name: string; status: string; created_at: string; total: number }[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const { user, supabase } = await requireAuth().catch(() => ({ user: null, supabase: null }));

  if (!user || !supabase) {
    return getEmptyAnalytics();
  }

  try {
    // Get all user's projects
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, status, created_at, client_id, client_name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!projects || projects.length === 0) {
      return getEmptyAnalytics();
    }

    // Get project items to calculate revenue
    const projectIds = projects.map(p => p.id);
    const { data: items } = await supabase
      .from("project_items")
      .select("project_id, name, quantity, material_price, labor_price, final_material_price, final_labor_price")
      .in("project_id", projectIds);

    // Calculate project totals
    const projectTotals: Record<string, number> = {};
    const itemCounts: Record<string, { count: number; revenue: number }> = {};
    
    (items || []).forEach(item => {
      const materialPrice = item.final_material_price ?? item.material_price ?? 0;
      const laborPrice = item.final_labor_price ?? item.labor_price ?? 0;
      const itemTotal = (materialPrice + laborPrice) * item.quantity;
      
      // Add to project total
      projectTotals[item.project_id] = (projectTotals[item.project_id] || 0) + itemTotal;
      
      // Track item usage
      if (item.name) {
        if (!itemCounts[item.name]) {
          itemCounts[item.name] = { count: 0, revenue: 0 };
        }
        itemCounts[item.name].count += item.quantity;
        itemCounts[item.name].revenue += itemTotal;
      }
    });

    // Calculate totals
    const totalRevenue = Object.values(projectTotals).reduce((sum, val) => sum + val, 0);
    const completedProjects = projects.filter(p => p.status === "final").length;
    const activeProjects = projects.filter(p => p.status === "draft").length;
    const avgProjectValue = projects.length > 0 ? totalRevenue / projects.length : 0;

    // Monthly revenue (last 6 months)
    const monthlyRevenue = calculateMonthlyRevenue(projects, projectTotals);

    // Top items
    const topItems = Object.entries(itemCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, data]) => ({ name, count: data.count, revenue: data.revenue }));

    // Top clients
    const clientTotals: Record<string, { name: string; projects: number; revenue: number }> = {};
    projects.forEach(project => {
      const clientName = project.client_name || "Bez klienta";
      if (!clientTotals[clientName]) {
        clientTotals[clientName] = { name: clientName, projects: 0, revenue: 0 };
      }
      clientTotals[clientName].projects += 1;
      clientTotals[clientName].revenue += projectTotals[project.id] || 0;
    });
    
    const topClients = Object.values(clientTotals)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Status breakdown
    const statusBreakdown = [
      { status: "draft", count: activeProjects },
      { status: "final", count: completedProjects },
      { status: "archived", count: projects.filter(p => p.status === "archived").length },
    ];

    // Recent projects
    const recentProjects = projects.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      created_at: p.created_at,
      total: projectTotals[p.id] || 0,
    }));

    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
      totalRevenue,
      avgProjectValue,
      monthlyRevenue,
      topItems,
      topClients,
      statusBreakdown,
      recentProjects,
    };
  } catch (error) {
    logger.error("Error fetching analytics", {}, error);
    return getEmptyAnalytics();
  }
}

function calculateMonthlyRevenue(
  projects: { id: string; created_at: string; status: string }[],
  projectTotals: Record<string, number>
): { month: string; revenue: number; projects: number }[] {
  const months: Record<string, { revenue: number; projects: number }> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    months[key] = { revenue: 0, projects: 0 };
  }
  
  // Fill in data
  projects.forEach(project => {
    const date = new Date(project.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    if (months[key]) {
      months[key].projects += 1;
      if (project.status === "final") {
        months[key].revenue += projectTotals[project.id] || 0;
      }
    }
  });
  
  return Object.entries(months).map(([month, data]) => ({
    month: formatMonth(month),
    revenue: data.revenue,
    projects: data.projects,
  }));
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const monthNames = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];
  return `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`;
}

function getEmptyAnalytics(): AnalyticsData {
  return {
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRevenue: 0,
    avgProjectValue: 0,
    monthlyRevenue: [],
    topItems: [],
    topClients: [],
    statusBreakdown: [],
    recentProjects: [],
  };
}
