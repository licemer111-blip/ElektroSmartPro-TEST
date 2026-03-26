import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator cos φ",
  description: "Obliczanie współczynnika mocy i dobór kondensatorów kompensacyjnych",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
