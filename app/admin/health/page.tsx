import type { Metadata } from "next";
import { getCatalogHealthReport } from "./actions";
import { HealthClient } from "./health-client";
import { AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Health Monitor — Admin | ElektroSmart PRO",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminHealthPage() {
  const { data, error } = await getCatalogHealthReport();

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-950/40">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800 dark:text-slate-200">Błąd ładowania raportu</p>
          <p className="text-sm text-slate-500 mt-1">{error ?? "Nieznany błąd"}</p>
        </div>
      </div>
    );
  }

  return <HealthClient report={data} />;
}
