import { redirect } from "next/navigation";
import { getKnrMultiplier } from "@/lib/global-benchmarks";
import { SettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const knrMultiplier = await getKnrMultiplier();

  return <SettingsClient initialKnrMultiplier={knrMultiplier} />;
}
