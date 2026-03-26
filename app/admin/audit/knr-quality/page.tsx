import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyKnrQualityPage() {
  redirect("/admin/knr-quality");
}
