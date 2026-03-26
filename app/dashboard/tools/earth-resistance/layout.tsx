import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rezystancja Uziemienia",
  description: "Kalkulator rezystancji uziemienia — metoda Wennera i pomiary",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
