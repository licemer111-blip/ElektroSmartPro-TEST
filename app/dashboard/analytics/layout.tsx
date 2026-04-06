import type { Metadata } from "next";
import { requireMinProjects } from "@/lib/guards/feature-gate";

export const metadata: Metadata = {
  title: "Analityka Biznesowa — Raporty i Trendy",
  description: "Przychody, marże, trendy projektowe i statystyki zespołu — podejmuj decyzje biznesowe na podstawie danych, nie intuicji",
};

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  await requireMinProjects();
  return children;
}
