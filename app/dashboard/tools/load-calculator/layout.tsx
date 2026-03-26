import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator Obciążeń",
  description: "Obliczanie obciążenia instalacji elektrycznej i bilansu mocy",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
