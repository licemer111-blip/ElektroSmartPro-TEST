import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Kosztorys",
  description: "Nowy kosztorys zaczyna się od Twoich pozycji, nie od listy ułożonej z metrażu.",
};

export default function QuickEstimatePage() {
  redirect("/dashboard");
}
