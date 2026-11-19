import { notFound, redirect } from "next/navigation";
import {
  fetchAdminHouseholdDetail,
  fetchAdminHouseholdTransactions,
  getAdminSession,
} from "@/app/actions/admin";
import { AdminHouseholdDetailClient } from "@/components/features/admin/AdminHouseholdDetailClient";

export default async function AdminHouseholdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;

  try {
    const [{ household, members }, txns] = await Promise.all([
      fetchAdminHouseholdDetail(id),
      fetchAdminHouseholdTransactions(id, 0),
    ]);

    return (
      <AdminHouseholdDetailClient
        username={session.username}
        household={household}
        members={members}
        initialTxns={txns.rows}
        initialTotal={txns.total}
        pageSize={txns.pageSize}
      />
    );
  } catch {
    notFound();
  }
}
