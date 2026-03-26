import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator Oświetlenia",
  description: "Obliczanie natężenia oświetlenia i dobór opraw wg normy PN-EN 12464",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
