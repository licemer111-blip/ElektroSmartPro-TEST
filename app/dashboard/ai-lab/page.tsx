import type { Metadata } from "next";
import { getUserProfile } from "../actions";
import { AiLabClient } from "./ai-lab-client";

export const metadata: Metadata = {
  title: "ES Import — Analiza Dokumentów",
  description: "Wgraj PDF, Excel lub CSV → ES-Engine (Gemini Vision) wyciągnie pozycje kosztorysowe, materiały i ceny. Analiza rzutów budowlanych wg IEC 60617. Inteligentny import do projektu.",
};

// Force dynamic rendering to always get fresh is_pro status from database
export const dynamic = 'force-dynamic';
// Allow up to 60s for AI analysis (PDF parsing + OpenAI API)
export const maxDuration = 60;

export default async function AiLabPage() {
  const profile = await getUserProfile();
  const isPro = profile?.is_pro || false;

  return <AiLabClient isPro={isPro} />;
}
