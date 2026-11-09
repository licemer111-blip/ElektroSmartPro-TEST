import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moja Baza Wiedzy KNR — Własne Cenniki i Normy",
  description: "Wgraj swój cennik i dokumenty. Twoja cena materiału ma pierwszeństwo. Godzinę robocizny bierze norma ES.",
};

export default function MyKnowledgeBaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
