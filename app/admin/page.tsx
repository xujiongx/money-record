import { redirect } from "next/navigation";
import {
  fetchActiveHouseholds,
  fetchPendingHouseholds,
  getAdminSession,
  type AdminHouseholdListRow,
} from "@/app/actions/admin";
import { AdminModerationClient } from "@/components/features/admin/AdminModerationClient";

export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  let pending: AdminHouseholdListRow[] = [];
  let active: AdminHouseholdListRow[] = [];
  try {
    [pending, active] = await Promise.all([
      fetchPendingHouseholds(),
      fetchActiveHouseholds(),
    ]);
  } catch {
    pending = [];
    active = [];
  }

  return (
    <AdminModerationClient
      username={session.username}
      initialPending={pending}
      initialActive={active}
    />
  );
}
