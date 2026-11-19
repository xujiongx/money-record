import { redirect } from "next/navigation";
import {
  fetchAdminOpsSummary,
  getAdminSession,
} from "@/app/actions/admin";
import { AdminOpsClient } from "@/components/features/admin/AdminOpsClient";

export default async function AdminOpsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  let summary = {
    pendingCount: 0,
    activeCount: 0,
    createdLast7Days: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthTxnCount: 0,
  };
  let households: Awaited<
    ReturnType<typeof fetchAdminOpsSummary>
  >["households"] = [];

  try {
    const data = await fetchAdminOpsSummary();
    summary = data.summary;
    households = data.households;
  } catch {
    /* empty */
  }

  return (
    <AdminOpsClient
      username={session.username}
      summary={summary}
      households={households}
    />
  );
}
