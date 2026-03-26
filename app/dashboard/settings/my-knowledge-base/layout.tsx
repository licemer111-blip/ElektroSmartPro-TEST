import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moja Baza Wiedzy KNR — Własne Cenniki i Normy",
  description: "Wgraj własne pliki KNR, cenniki i dokumenty — ES-Engine będzie je używać jako priorytetowe źródło (P1) przy wycenie instalacji elektrycznych",
};

export default function MyKnowledgeBaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
