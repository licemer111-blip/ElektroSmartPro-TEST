import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dobór Zabezpieczeń",
  description: "Kalkulator doboru wyłączników nadprądowych i różnicowoprądowych",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
