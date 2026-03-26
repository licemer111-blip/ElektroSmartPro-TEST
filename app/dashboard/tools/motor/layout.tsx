import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator Silnika",
  description: "Obliczanie parametrów silnika elektrycznego — prąd, moc, moment obrotowy",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
