import type { Metadata } from "next";
import { getCatalogAuditLogs, getAuditStats } from "./actions";
import { AuditLogsClient } from "./audit-logs-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = { title: "Audit Logs — ElektroSmart Admin" };

export default async function AuditPage() {
  const [{ logs, total }, stats] = await Promise.all([
    getCatalogAuditLogs(1, 50),
    getAuditStats(),
  ]);

  return <AuditLogsClient initialLogs={logs} total={total} stats={stats} />;
}
