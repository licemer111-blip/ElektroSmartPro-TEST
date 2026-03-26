import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Zaloguj się do ElektroSmart PRO — profesjonalny program do kosztorysowania instalacji elektrycznych",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
