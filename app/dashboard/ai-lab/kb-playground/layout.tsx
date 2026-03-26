import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KB Playground — Test Bazy Wiedzy ES-Engine",
  description: "Testuj zapytania do bazy wiedzy KNR i sprawdzaj jak ES-Engine interpretuje normy robocizny i ceny materiałów elektrycznych",
};

export default function KbPlaygroundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
