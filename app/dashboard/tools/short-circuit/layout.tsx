import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prąd Zwarciowy",
  description: "Szacunek Ik3 i Ik1: impedancja transformatora przy uk 4% plus kabel. Nie zastępuje pełnego obliczenia PN-EN 60909.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
