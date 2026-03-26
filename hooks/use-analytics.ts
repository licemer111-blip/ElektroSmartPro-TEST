"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useOfflineSync } from "./use-offline-sync";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalProjects: number;
    averageProjectValue: number;
    growthRate: number;
    activeClients: number;
    conversionRate: number;
  };
  profitability: {
    byRegion: Array<{
      region: string;
      revenue: number;
      projects: number;
      margin: number;
    }>;
    byType: Array<{
      type: string;
      revenue: number;
      projects: number;
      avgValue: number;
      projectsCount: number;
    }>;
    materials: Array<{
      category: string;
      cost: number;
      usage: number;
      trend: "up" | "down" | "stable";
    }>;
  };
  predictions: {
    nextMonthRevenue: number;
    seasonalTrend: "increasing" | "decreasing" | "stable";
    topOpportunities: Array<{
      title: string;
      potential: number;
      confidence: number;
    }>;
  };
}

export function useAnalytics(timeRange: "week" | "month" | "quarter" | "year" = "month") {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchWithOffline } = useOfflineSync();

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Attempt to get user securely
      let { data: { user } } = await supabase.auth.getUser();

      // Fallback to session cache if getUser fails (e.g. network issue or token refresh lag)
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession();
        user = session?.user || null;
      }

      if (!user) {
        throw new Error("Nie znaleziono aktywnej sesji użytkownika. Spróbuj odświeżyć stronę lub zalogować się ponownie.");
      }

      // Get date range based on timeRange
      const endDate = new Date();
      const startDate = new Date();

      switch (timeRange) {
        case "week":
          startDate.setDate(startDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch projects data
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          regions(name),
          object_types(name),
          project_items(
            quantity,
            material_price,
            labor_price,
            catalog_items(
              catalog_categories(name)
            )
          )
        `)
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Process analytics data
      const analyticsData = processAnalyticsData(projects || [], startDate, endDate);
      setData(analyticsData);

      // Cache for offline use
      await fetchWithOffline(
        `/api/analytics?range=${timeRange}`,
        {},
        () => Promise.resolve(analyticsData)
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");

      // Try to load from cache
      try {
        const cachedData = await fetchWithOffline(
          `/api/analytics?range=${timeRange}`,
          {},
          () => Promise.reject("No cache")
        );
        setData(cachedData);
      } catch {
        // No cache available
      }
    } finally {
      setLoading(false);
    }
  };

  interface AnalyticsProjectItem {
    quantity: number;
    material_price: number | null;
    labor_price: number | null;
    catalog_items?: {
      catalog_categories?: { name: string } | null;
    } | null;
  }

  interface AnalyticsProject {
    project_items?: AnalyticsProjectItem[];
    regions?: { name: string } | null;
    object_types?: { name: string } | null;
  }

  const processAnalyticsData = (projects: AnalyticsProject[], startDate: Date, endDate: Date): AnalyticsData => {
    // Calculate overview metrics
    const totalRevenue = projects.reduce((sum, project) => {
      const itemsRevenue = project.project_items?.reduce(
        (itemSum: number, item: AnalyticsProjectItem) =>
          itemSum + (item.quantity * ((item.material_price || 0) + (item.labor_price || 0))),
        0
      );
      return sum + (itemsRevenue ?? 0);
    }, 0);

    const totalProjects = projects.length;
    const averageProjectValue = totalProjects > 0 ? totalRevenue / totalProjects : 0;

    // Get previous period data for growth calculation
    const previousPeriodStart = new Date(startDate);
    const previousPeriodEnd = new Date(startDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() - 1);

    // Mock growth rate for now
    const growthRate = 15.3 + Math.random() * 10 - 5;

    // Group by region
    const regionMap = new Map<string, { revenue: number; projects: number; cost: number }>();
    projects.forEach(project => {
      const region = project.regions?.name || "Unknown";
      const projectRevenue = project.project_items?.reduce(
        (sum: number, item: AnalyticsProjectItem) =>
          sum + (item.quantity * ((item.material_price || 0) + (item.labor_price || 0))),
        0
      );
      const projectCost = project.project_items?.reduce(
        (sum: number, item: AnalyticsProjectItem) =>
          sum + (item.quantity * (item.material_price || 0)),
        0
      );

      if (!regionMap.has(region)) {
        regionMap.set(region, { revenue: 0, projects: 0, cost: 0 });
      }
      const regionData = regionMap.get(region)!;
      regionData.revenue += projectRevenue ?? 0;
      regionData.projects += 1;
      regionData.cost += projectCost ?? 0;
    });

    const byRegion = Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      revenue: data.revenue,
      projects: data.projects,
      margin: data.revenue > 0 ? ((data.revenue - data.cost) / data.revenue) * 100 : 0,
    }));

    // Group by type
    const typeMap = new Map<string, { revenue: number; projects: number }>();
    projects.forEach(project => {
      const type = project.object_types?.name || "Unknown";
      const projectRevenue = project.project_items?.reduce(
        (sum: number, item: AnalyticsProjectItem) =>
          sum + (item.quantity * ((item.material_price || 0) + (item.labor_price || 0))),
        0
      );

      if (!typeMap.has(type)) {
        typeMap.set(type, { revenue: 0, projects: 0 });
      }
      const typeData = typeMap.get(type)!;
      typeData.revenue += projectRevenue ?? 0;
      typeData.projects += 1;
    });

    const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      revenue: data.revenue,
      projects: data.projects,
      projectsCount: data.projects,
      avgValue: data.projects > 0 ? data.revenue / data.projects : 0,
    }));

    // Analyze materials
    const materialMap = new Map<string, { cost: number; usage: number }>();
    projects.forEach(project => {
      project.project_items?.forEach((item: AnalyticsProjectItem) => {
        const catRef = item.catalog_items?.catalog_categories;
        const category = (Array.isArray(catRef) ? catRef[0]?.name : (catRef as { name: string } | null | undefined)?.name) || "Other";
        const cost = item.quantity * (item.material_price || 0);

        if (!materialMap.has(category)) {
          materialMap.set(category, { cost: 0, usage: 0 });
        }
        const materialData = materialMap.get(category)!;
        materialData.cost += cost;
        materialData.usage += 1;
      });
    });

    const materials = Array.from(materialMap.entries()).map(([category, data]) => ({
      category,
      cost: data.cost,
      usage: data.usage,
      trend: Math.random() > 0.5 ? "up" : Math.random() > 0.5 ? "down" : "stable" as "up" | "down" | "stable",
    }));

    // Mock predictions
    const nextMonthRevenue = totalRevenue * (1 + (growthRate / 100) / 12);
    const seasonalTrend =
      new Date().getMonth() >= 4 && new Date().getMonth() <= 8 ? "increasing" :
        new Date().getMonth() >= 11 || new Date().getMonth() <= 2 ? "decreasing" : "stable";

    const topOpportunities = [
      {
        title: "Remonty obiektów komercyjnych",
        potential: 50000 + Math.random() * 50000,
        confidence: 0.85 + Math.random() * 0.15,
      },
      {
        title: "Nowe budownictwo mieszkalne",
        potential: 30000 + Math.random() * 40000,
        confidence: 0.75 + Math.random() * 0.2,
      },
      {
        title: "Modernizacje przemysłowe",
        potential: 70000 + Math.random() * 80000,
        confidence: 0.65 + Math.random() * 0.25,
      },
    ];

    return {
      overview: {
        totalRevenue,
        totalProjects,
        averageProjectValue,
        growthRate,
        activeClients: Math.floor(totalProjects * 0.8),
        conversionRate: 5 + Math.random() * 10,
      },
      profitability: {
        byRegion,
        byType,
        materials,
      },
      predictions: {
        nextMonthRevenue,
        seasonalTrend,
        topOpportunities,
      },
    };
  };

  const refresh = () => {
    fetchAnalytics();
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
}
