import type { Metadata } from "next";
import { getAdminKpi, getVoivodeshipStats, getPopularAssemblies } from "@/app/admin/actions";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Admin Dashboard | ElektroSmart PRO",
};

export default async function AdminDashboardPage() {
  const [kpiResult, voivResult, assemblyResult] = await Promise.all([
    getAdminKpi(),
    getVoivodeshipStats(),
    getPopularAssemblies(),
  ]);

  return (
    <AdminDashboardClient
      kpi={kpiResult.data}
      voivodeships={voivResult.data}
      assemblies={assemblyResult.data}
      errors={{
        kpi: kpiResult.error,
        voiv: voivResult.error,
        assembly: assemblyResult.error,
      }}
    />
  );
}
