import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** The voivodeship coefficient lives next to the hourly rate. This page is that card. */
export default function MarketAnalysisPage() {
  redirect("/dashboard/settings?tab=knr");
}
