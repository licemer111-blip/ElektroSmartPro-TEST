import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Przelicznik Jednostek",
  description: "Konwersja jednostek elektrycznych — amper, wolt, wat, om, farad",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
