import { redirect } from "next/navigation";
import { getAdminSession } from "@/app/actions/admin";
import { AdminLoginForm } from "@/components/features/admin/AdminLoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }
  return <AdminLoginForm />;
}
