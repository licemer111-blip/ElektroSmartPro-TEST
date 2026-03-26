import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prąd Zwarciowy",
  description: "Obliczanie prądu zwarciowego w instalacji elektrycznej wg PN-IEC 60909",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
