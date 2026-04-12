import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analityka Biznesowa — Raporty i Trendy",
  description: "Przychody, marże, trendy projektowe i statystyki zespołu — podejmuj decyzje biznesowe na podstawie danych, nie intuicji",
};

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
