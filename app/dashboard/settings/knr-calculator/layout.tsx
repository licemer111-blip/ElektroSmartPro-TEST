import { SettingsShell } from "@/components/settings/settings-shell";

export default function KnrCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsShell activeTab="knr">{children}</SettingsShell>;
}
