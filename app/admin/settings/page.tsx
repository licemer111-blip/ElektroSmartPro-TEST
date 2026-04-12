import { redirect } from "next/navigation";
import { getGlobalBenchmarks } from "../actions";
import { SettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  const { data: benchmarks, error } = await getGlobalBenchmarks();

  if (error || !benchmarks) {
    redirect("/admin");
  }

  return <SettingsClient initialBenchmarks={benchmarks} />;
}
