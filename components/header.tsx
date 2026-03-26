import { getUser } from "@/app/auth/actions";
import { getUserProfile } from "@/app/dashboard/actions";
import { getAdminStatus } from "@/lib/utils/admin";
import { HeaderDynamic } from "@/components/header-dynamic";

export default async function Header({ isDashboard = true }: { isDashboard?: boolean }) {
  const user = await getUser();
  const profile = user ? await getUserProfile() : null;
  const isPro = profile?.is_pro || false;
  const { isAdmin } = await getAdminStatus();

  return <HeaderDynamic user={user} isPro={isPro} isDashboard={isDashboard} />;
}
