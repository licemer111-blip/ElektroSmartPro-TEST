import type { Metadata } from "next";
import { getAdminUsers } from "@/app/admin/actions";
import { AdminUsersClient } from "./admin-users-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Użytkownicy | Admin | ElektroSmart PRO",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(0, parseInt(params.page ?? "0", 10));
  const { users, total, error } = await getAdminUsers(page, 50);

  return (
    <AdminUsersClient
      users={users}
      total={total}
      page={page}
      pageSize={50}
      error={error}
    />
  );
}
