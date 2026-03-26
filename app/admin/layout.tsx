import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <AdminCommandPalette />
    </div>
  );
}
