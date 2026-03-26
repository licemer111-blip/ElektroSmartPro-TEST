import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spadek Napięcia",
  description: "Obliczanie spadku napięcia w linii zasilającej wg normy PN-HD 60364",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
