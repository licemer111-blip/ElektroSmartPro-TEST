import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator Fotowoltaiki",
  description: "Obliczanie wydajności instalacji PV — dobór paneli i inwerterów",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
