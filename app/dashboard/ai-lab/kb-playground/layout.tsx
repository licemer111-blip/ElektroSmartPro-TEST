import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KB Playground — test bazy godzin",
  description: "Sprawdź, jaką godzinę norma ES przypisuje do nazwy. Cen materiałów tu nie ma.",
};

export default function KbPlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
