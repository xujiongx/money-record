import { redirect } from "next/navigation";
import {
  fetchPendingHouseholds,
  getAdminSession,
} from "@/app/actions/admin";
import { AdminModerationClient } from "@/components/features/admin/AdminModerationClient";

export default async function AdminHomePage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  let pending = [] as Awaited<ReturnType<typeof fetchPendingHouseholds>>;
  try {
    pending = await fetchPendingHouseholds();
  } catch {
    pending = [];
  }

  return (
    <AdminModerationClient
      username={session.username}
      initialPending={pending}
    />
  );
}
