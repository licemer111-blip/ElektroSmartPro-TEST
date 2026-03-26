import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator Przekroju Kabla",
  description: "Dobór przekroju przewodu na podstawie obciążenia, długości i sposobu ułożenia",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
