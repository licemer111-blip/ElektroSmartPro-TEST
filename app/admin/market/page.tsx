import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/utils/admin";
import { getAdminMarketItems } from "./actions";
import { AdminMarketTable } from "./admin-market-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMarketPage() {
  // Check if user is admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect("/dashboard");
  }

  // Fetch market items
  const { items, total } = await getAdminMarketItems();

  return (
    <div className="container mx-auto py-4 sm:py-8 px-2 sm:px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Admin Panel - Market Intelligence
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Zarządzaj cenami rynkowymi, trendami i komentarzami dla wszystkich pozycji globalnych
        </p>
      </div>

      <AdminMarketTable items={items} total={total} />
    </div>
  );
}
