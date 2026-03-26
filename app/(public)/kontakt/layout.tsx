import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt — Wsparcie ElektroSmart PRO",
  description: "Skontaktuj się z zespołem ElektroSmart PRO — pomoc techniczna, pytania o AI Lab, Konfigurator rozdzielnic, subskrypcję PRO i współpracę. Odpowiadamy w ciągu 24h.",
  keywords: [
    "kontakt elektrosmart",
    "wsparcie elektrosmart pro",
    "pomoc kosztorysowanie elektryczne",
    "kontakt program dla elektryków",
    "elektrosmart email",
  ],
  openGraph: {
    title: "Kontakt - ElektroSmart PRO | Wsparcie dla Elektryków",
    description: "Skontaktuj się z nami. Pomoc techniczna, pytania o funkcje i subskrypcję. Odpowiadamy szybko!",
    type: "website",
    locale: "pl_PL",
  },
};

export default function KontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
